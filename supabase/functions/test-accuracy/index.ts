import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Requirement {
  id: string;
  category: string;
  requirement?: string;
  status: "compliant" | "partial" | "missing";
  details?: string;
  suggestion?: string;
  resources?: any[];
}

interface TestCase {
  name: string;
  documents: {
    business_plan: string;
    compliance_policy: string;
    legal_structure: string;
  };
  ground_truth: {
    overall_score: number;
    requirements: Requirement[];
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { test_cases } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const results = [];

    for (const testCase of test_cases as TestCase[]) {
      console.log(`Testing: ${testCase.name}`);
      
      // Run AI evaluation
      const evaluation = await evaluateCompliance(
        testCase.documents.business_plan,
        testCase.documents.compliance_policy,
        testCase.documents.legal_structure,
        LOVABLE_API_KEY
      );

      // Calculate KPIs
      const kpis = calculateKPIs(
        evaluation,
        testCase.ground_truth
      );

      results.push({
        test_case: testCase.name,
        ...kpis,
        predicted_score: evaluation.overall_score,
        ground_truth_score: testCase.ground_truth.overall_score,
      });
    }

    // Calculate averages
    const avgKpi1 = results.reduce((sum, r) => sum + r.kpi1_weighted, 0) / results.length;
    const avgKpi2 = results.reduce((sum, r) => sum + r.kpi2_weighted, 0) / results.length;
    const avgKpi3 = results.reduce((sum, r) => sum + r.kpi3_weighted, 0) / results.length;
    const avgKpi4 = results.reduce((sum, r) => sum + r.kpi4_weighted, 0) / results.length;
    const avgTotal = results.reduce((sum, r) => sum + r.total_weighted, 0) / results.length;

    return new Response(
      JSON.stringify({
        summary: {
          test_cases_run: results.length,
          kpi1_avg: avgKpi1,
          kpi2_avg: avgKpi2,
          kpi3_avg: avgKpi3,
          kpi4_avg: avgKpi4,
          total_avg: avgTotal,
        },
        detailed_results: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in test-accuracy:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function evaluateCompliance(
  businessPlan: string,
  compliancePolicy: string,
  legalStructure: string,
  apiKey: string
): Promise<{ overall_score: number; requirements: Requirement[] }> {
  const prompt = `You are an expert regulatory compliance analyst specializing in Qatar Central Bank (QCB) FinTech licensing requirements.

Analyze the provided documentation and evaluate each requirement, classifying as:
- "compliant": Fully meets the requirement
- "partial": Partially meets but lacks detail
- "missing": Does not address the requirement

CRITICAL: If documents mention hosting on public cloud outside Qatar (AWS/Azure/GCP in regions like eu-west-1, Ireland, Singapore) without explicitly stating data is stored physically in Qatar, mark data_residency as "missing" or "partial".

Documentation:
BUSINESS PLAN: ${businessPlan}
COMPLIANCE POLICY: ${compliancePolicy}
LEGAL STRUCTURE: ${legalStructure}

Return JSON with: {"overall_score": <0-100>, "requirements": [{"id": "<req_id>", "category": "<category>", "status": "<status>", "details": "<reasoning>"}]}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are a regulatory compliance expert. Return only valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI Gateway error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  // Extract JSON from markdown if present
  let jsonStr = content;
  if (content.includes("```json")) {
    jsonStr = content.split("```json")[1].split("```")[0].trim();
  } else if (content.includes("```")) {
    jsonStr = content.split("```")[1].split("```")[0].trim();
  }

  return JSON.parse(jsonStr);
}

function calculateKPIs(predicted: any, groundTruth: any) {
  // KPI 1: F1 Score and Recall (10%)
  const predIds = new Set(predicted.requirements.map((r: Requirement) => r.id));
  const truthIds = new Set(groundTruth.requirements.map((r: Requirement) => r.id));
  
  const tp = [...predIds].filter(id => truthIds.has(id)).length;
  const fp = [...predIds].filter(id => !truthIds.has(id)).length;
  const fn = [...truthIds].filter(id => !predIds.has(id)).length;
  
  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;
  const f1 = 2 * (precision * recall) / (precision + recall) || 0;
  const kpi1Score = (f1 + recall) / 2;

  // KPI 2: Gap Flagging Precision (5%)
  const truthGaps = new Set(
    groundTruth.requirements
      .filter((r: Requirement) => ["missing", "partial"].includes(r.status))
      .map((r: Requirement) => r.id)
  );
  const predGaps = new Set(
    predicted.requirements
      .filter((r: Requirement) => ["missing", "partial"].includes(r.status))
      .map((r: Requirement) => r.id)
  );
  
  const gapTp = [...predGaps].filter(id => truthGaps.has(id)).length;
  const gapFp = [...predGaps].filter(id => !truthGaps.has(id)).length;
  const gapPrecision = gapTp / (gapTp + gapFp) || 0;

  // KPI 3: Scoring Accuracy (5%)
  const scoreDiff = Math.abs(predicted.overall_score - groundTruth.overall_score);
  const scoreAccuracy = Math.max(0, 1 - scoreDiff / 100);

  // KPI 4: Recommendation Quality (5%)
  const partialReqs = predicted.requirements.filter((r: Requirement) => r.status === "partial");
  const suggestionRate = partialReqs.filter((r: Requirement) => r.suggestion).length / (partialReqs.length || 1);

  const kpi1Weighted = kpi1Score * 0.10;
  const kpi2Weighted = gapPrecision * 0.05;
  const kpi3Weighted = scoreAccuracy * 0.05;
  const kpi4Weighted = suggestionRate * 0.05;
  const totalWeighted = kpi1Weighted + kpi2Weighted + kpi3Weighted + kpi4Weighted;

  return {
    kpi1_f1: f1,
    kpi1_recall: recall,
    kpi1_precision: precision,
    kpi1_weighted: kpi1Weighted,
    kpi2_gap_precision: gapPrecision,
    kpi2_weighted: kpi2Weighted,
    kpi3_score_diff: scoreDiff,
    kpi3_score_accuracy: scoreAccuracy,
    kpi3_weighted: kpi3Weighted,
    kpi4_suggestion_rate: suggestionRate,
    kpi4_weighted: kpi4Weighted,
    total_weighted: totalWeighted,
  };
}
