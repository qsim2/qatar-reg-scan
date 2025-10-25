import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESOURCE_MAPPING: Record<string, any[]> = {
  "minimum_capital_psp": [
    { name: "Qatar Development Bank", type: "Financing", url: "https://www.qdb.qa" },
  ],
  "data_residency": [
    { name: "Qatar Data Center", type: "Infrastructure", url: "https://qdatacenters.com" },
  ],
  "aml_policy": [
    { name: "QCB AML Guidelines", type: "Regulatory Resource", url: "https://www.qcb.gov.qa" },
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scoring_result } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }
    
    console.log(`Generating report for score: ${scoring_result.overall_score}%`);
    
    // Generate recommendations using AI
    const recommendations = [];
    const urgentGaps = scoring_result.requirements.filter(
      (r: any) => r.status === "missing" && r.is_critical
    );
    
    for (const gap of urgentGaps) {
      const prompt = `Generate a concise recommendation (2-3 sentences) for addressing this compliance gap: ${gap.requirement_id} (Status: ${gap.status})`;
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a regulatory compliance advisor." },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const suggestion = data.choices[0].message.content;
        recommendations.push({
          requirement_id: gap.requirement_id,
          suggestion,
          resources: RESOURCE_MAPPING[gap.requirement_id] || [],
        });
      }
    }
    
    const report = {
      generated_at: new Date().toISOString(),
      overall_score: scoring_result.overall_score,
      summary: scoring_result.summary,
      requirements: scoring_result.requirements,
      urgent_recommendations: recommendations,
      all_resources: Object.values(RESOURCE_MAPPING).flat(),
    };
    
    console.log(`Report generated with ${recommendations.length} urgent recommendations`);
    
    return new Response(
      JSON.stringify(report),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Report generation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
