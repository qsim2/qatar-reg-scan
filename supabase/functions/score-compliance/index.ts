import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Critical requirements that have higher weight
const CRITICAL_REQUIREMENTS = [
  "minimum_capital_psp",
  "minimum_capital_p2p",
  "minimum_capital_wealth",
  "data_residency",
  "aml_policy",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { semantic_matches } = await req.json();
    
    console.log(`Scoring compliance for ${semantic_matches.length} requirements`);
    
    let totalScore = 0;
    let maxScore = 0;
    
    const scoredRequirements = semantic_matches.map((match: any) => {
      const isCritical = CRITICAL_REQUIREMENTS.includes(match.requirement_id);
      const weight = isCritical ? 2.0 : 1.0;
      
      let points = 0;
      if (match.status === "compliant") points = 100;
      else if (match.status === "partial") points = 50;
      else points = 0;
      
      const weightedPoints = points * weight;
      const maxPoints = 100 * weight;
      
      totalScore += weightedPoints;
      maxScore += maxPoints;
      
      return {
        ...match,
        points,
        weight,
        weighted_points: weightedPoints,
        is_critical: isCritical,
      };
    });
    
    const overallScore = Math.round((totalScore / maxScore) * 100);
    
    // Group by status
    const compliantCount = scoredRequirements.filter((r: any) => r.status === "compliant").length;
    const partialCount = scoredRequirements.filter((r: any) => r.status === "partial").length;
    const missingCount = scoredRequirements.filter((r: any) => r.status === "missing").length;
    
    console.log(`Overall score: ${overallScore}% (${compliantCount} compliant, ${partialCount} partial, ${missingCount} missing)`);
    
    return new Response(
      JSON.stringify({
        overall_score: overallScore,
        total_score: totalScore,
        max_score: maxScore,
        requirements: scoredRequirements,
        summary: {
          compliant: compliantCount,
          partial: partialCount,
          missing: missingCount,
          total: scoredRequirements.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Scoring error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
