import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rule patterns for NER and compliance checking
const RULE_PATTERNS = {
  capital_amounts: /QAR\s*[\d,]+(?:\.\d+)?(?:\s*(?:million|M))?/gi,
  data_residency: /(?:AWS|Azure|GCP|eu-west-1|ap-southeast-1|Ireland|Singapore|cloud|hosted)/gi,
  aml_keywords: /(?:AML|Anti-Money Laundering|KYC|Customer Due Diligence|CDD|STR|Suspicious Transaction)/gi,
  personnel: /(?:CEO|CFO|CTO|Compliance Officer|Board|Director)/gi,
  licensing: /(?:P2P|Marketplace Lending|Payment Service Provider|PSP|Digital Wealth|FinTech)/gi,
};

interface RuleMatch {
  rule_type: string;
  matched_text: string;
  position: number;
  requirement_ids: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { chunks } = await req.json();
    
    console.log(`Running rule-based checks on ${chunks.length} chunks`);
    
    const allMatches: RuleMatch[] = [];
    
    // Run pattern matching on each chunk
    for (const chunk of chunks) {
      const text = chunk.text;
      
      // Capital amounts
      const capitalMatches = [...text.matchAll(RULE_PATTERNS.capital_amounts)];
      capitalMatches.forEach(match => {
        allMatches.push({
          rule_type: "capital_amount",
          matched_text: match[0],
          position: chunk.start_char + match.index!,
          requirement_ids: ["minimum_capital_psp", "minimum_capital_p2p", "minimum_capital_wealth"],
        });
      });
      
      // Data residency
      const dataMatches = [...text.matchAll(RULE_PATTERNS.data_residency)];
      dataMatches.forEach(match => {
        allMatches.push({
          rule_type: "data_residency",
          matched_text: match[0],
          position: chunk.start_char + match.index!,
          requirement_ids: ["data_residency", "primary_data_environment"],
        });
      });
      
      // AML/KYC keywords
      const amlMatches = [...text.matchAll(RULE_PATTERNS.aml_keywords)];
      amlMatches.forEach(match => {
        allMatches.push({
          rule_type: "aml_kyc",
          matched_text: match[0],
          position: chunk.start_char + match.index!,
          requirement_ids: ["aml_policy", "kyc_documentation", "cdd_enhanced", "str_reporting"],
        });
      });
      
      // Personnel
      const personnelMatches = [...text.matchAll(RULE_PATTERNS.personnel)];
      personnelMatches.forEach(match => {
        allMatches.push({
          rule_type: "personnel",
          matched_text: match[0],
          position: chunk.start_char + match.index!,
          requirement_ids: ["key_personnel", "compliance_officer"],
        });
      });
      
      // Licensing
      const licenseMatches = [...text.matchAll(RULE_PATTERNS.licensing)];
      licenseMatches.forEach(match => {
        allMatches.push({
          rule_type: "licensing",
          matched_text: match[0],
          position: chunk.start_char + match.index!,
          requirement_ids: ["licensing_category"],
        });
      });
    }
    
    console.log(`Found ${allMatches.length} rule matches`);
    
    return new Response(
      JSON.stringify({
        rule_matches: allMatches,
        total_matches: allMatches.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Rule-based check error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
