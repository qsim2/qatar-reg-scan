import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// QCB Licensing Requirements
const QCB_REQUIREMENTS = [
  {
    category: "Capital Adequacy",
    requirement: "Minimum Capital Requirements",
    description: "QCB requires minimum paid-up capital of QAR 5 million for payment service providers and QAR 10 million for other financial institutions.",
  },
  {
    category: "AML/CFT Compliance",
    requirement: "Anti-Money Laundering & Counter-Terrorism Financing",
    description: "Comprehensive AML/CFT policies, procedures, and systems including customer due diligence, transaction monitoring, and suspicious activity reporting.",
  },
  {
    category: "IT Security & Infrastructure",
    requirement: "Information Technology and Cybersecurity",
    description: "Robust IT infrastructure with cybersecurity measures, data protection, disaster recovery, and business continuity plans meeting QCB standards.",
  },
  {
    category: "Governance",
    requirement: "Fit and Proper Requirements",
    description: "Board members and senior management must meet fit and proper criteria with appropriate qualifications, experience, and integrity.",
  },
  {
    category: "Business Continuity",
    requirement: "Business Continuity & Disaster Recovery Plans",
    description: "Documented business continuity management framework with tested disaster recovery procedures and crisis management protocols.",
  },
  {
    category: "Operational Controls",
    requirement: "Risk Management Framework",
    description: "Comprehensive risk management framework covering operational, financial, compliance, and strategic risks with clear policies and controls.",
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessPlan } = await req.json();

    if (!businessPlan || typeof businessPlan !== "string") {
      return new Response(
        JSON.stringify({ error: "Business plan is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the analysis prompt
    const systemPrompt = `You are an expert regulatory compliance analyst specializing in Qatar Central Bank (QCB) FinTech licensing requirements. 

Analyze the provided business plan against the following QCB requirements:
${QCB_REQUIREMENTS.map((req, i) => `${i + 1}. ${req.category}: ${req.requirement}\n   ${req.description}`).join("\n\n")}

Provide a detailed assessment of compliance for each requirement.`;

    const userPrompt = `Analyze this FinTech startup business plan for QCB licensing compliance:\n\n${businessPlan}`;

    // Call Lovable AI with tool calling for structured output
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_compliance",
              description: "Analyze QCB regulatory compliance and provide structured assessment",
              parameters: {
                type: "object",
                properties: {
                  overall_score: {
                    type: "number",
                    description: "Overall compliance readiness score from 0-100",
                  },
                  requirements: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string" },
                        requirement: { type: "string" },
                        status: {
                          type: "string",
                          enum: ["compliant", "partial", "missing"],
                        },
                        details: { type: "string" },
                      },
                      required: ["category", "requirement", "status", "details"],
                    },
                  },
                  recommendations: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 actionable recommendations to improve compliance",
                  },
                },
                required: ["overall_score", "requirements", "recommendations"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_compliance" } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI Response:", JSON.stringify(aiResponse, null, 2));

    // Extract the tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const analysisResult = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        score: analysisResult.overall_score,
        requirements: analysisResult.requirements,
        recommendations: analysisResult.recommendations,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-compliance function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Analysis failed" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
