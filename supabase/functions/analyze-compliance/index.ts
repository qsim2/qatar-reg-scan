import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// QCB Licensing Requirements with Categories
const QCB_REQUIREMENTS = [
  {
    id: "capital_adequacy",
    category: "Capital Adequacy",
    requirement: "Minimum Capital Requirements",
    description: "QCB requires minimum paid-up capital of QAR 5 million for payment service providers and QAR 10 million for other financial institutions.",
    input_category: "business_model"
  },
  {
    id: "governance",
    category: "Governance",
    requirement: "Fit and Proper Requirements",
    description: "Board members and senior management must meet fit and proper criteria with appropriate qualifications, experience, and integrity.",
    input_category: "business_model"
  },
  {
    id: "aml_policy",
    category: "AML/CFT Compliance",
    requirement: "Anti-Money Laundering Policies",
    description: "Comprehensive AML/CFT policies including customer due diligence, transaction monitoring, and suspicious activity reporting.",
    input_category: "aml_security"
  },
  {
    id: "data_protection",
    category: "Data Security",
    requirement: "Data Protection and Privacy",
    description: "Robust data protection measures including PII handling, third-party data sharing protocols, and access controls meeting QCB standards.",
    input_category: "aml_security"
  },
  {
    id: "it_infrastructure",
    category: "IT Security & Infrastructure",
    requirement: "Information Technology and Cybersecurity",
    description: "Secure IT infrastructure with cybersecurity measures, data localization (preferably in Qatar), and restricted access controls.",
    input_category: "tech_operations"
  },
  {
    id: "business_continuity",
    category: "Business Continuity",
    requirement: "Disaster Recovery & Business Continuity Plans",
    description: "Documented business continuity management framework with tested disaster recovery procedures, RTOs, and crisis management protocols.",
    input_category: "tech_operations"
  },
];

// Resource Mapping Data
const RESOURCE_MAPPING = [
  {
    name: "Qatar FinTech Hub Compliance Advisory",
    type: "Government Program",
    contact: "compliance@qfh.gov.qa",
    linked_rule_ids: ["aml_policy", "governance"]
  },
  {
    name: "Doha Cybersecurity & Data Privacy Consultancy",
    type: "Private Consultant",
    contact: "+974 4000 1234",
    linked_rule_ids: ["data_protection", "it_infrastructure"]
  },
  {
    name: "Qatar Central Bank - FinTech Support Unit",
    type: "Regulatory Authority",
    contact: "fintech@qcb.gov.qa",
    linked_rule_ids: ["capital_adequacy", "governance", "aml_policy"]
  },
  {
    name: "Gulf Region DR & Business Continuity Services",
    type: "Technical Service Provider",
    contact: "info@gulfdr.com",
    linked_rule_ids: ["business_continuity", "it_infrastructure"]
  },
  {
    name: "Lusail Legal & Compliance Partners",
    type: "Law Firm",
    contact: "+974 4000 5678",
    linked_rule_ids: ["aml_policy", "data_protection"]
  }
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessModel, amlSecurity, techOperations } = await req.json();

    if (!businessModel && !amlSecurity && !techOperations) {
      return new Response(
        JSON.stringify({ error: "At least one input section is required" }),
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

    // STAGE 1: Evaluation - Analyze all requirements
    const evaluationSystemPrompt = `You are an expert regulatory compliance analyst specializing in Qatar Central Bank (QCB) FinTech licensing requirements. 

Analyze the provided documentation against these QCB requirements:
${QCB_REQUIREMENTS.map((req, i) => `${i + 1}. [ID: ${req.id}] ${req.category}: ${req.requirement}\n   ${req.description}\n   Input Category: ${req.input_category}`).join("\n\n")}

Evaluate each requirement and classify as:
- "compliant": Fully meets the requirement with comprehensive evidence
- "partial": Partially meets the requirement but lacks detail or completeness
- "missing": Does not address the requirement or fundamentally absent`;

    const evaluationUserPrompt = `Analyze this FinTech startup documentation for QCB licensing compliance:

BUSINESS MODEL & CORPORATE GOVERNANCE:
${businessModel || "Not provided"}

AML/CFT & SECURITY POLICIES:
${amlSecurity || "Not provided"}

TECHNOLOGY & OPERATIONS PLAN:
${techOperations || "Not provided"}`;

    // First AI call for evaluation
    const evaluationResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: evaluationSystemPrompt },
          { role: "user", content: evaluationUserPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "evaluate_compliance",
              description: "Evaluate QCB regulatory compliance and classify each requirement",
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
                        id: { type: "string" },
                        category: { type: "string" },
                        requirement: { type: "string" },
                        status: {
                          type: "string",
                          enum: ["compliant", "partial", "missing"],
                        },
                        details: { type: "string" },
                      },
                      required: ["id", "category", "requirement", "status", "details"],
                    },
                  },
                  recommendations: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 general actionable recommendations to improve compliance",
                  },
                },
                required: ["overall_score", "requirements", "recommendations"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "evaluate_compliance" } },
      }),
    });

    if (!evaluationResponse.ok) {
      const errorText = await evaluationResponse.text();
      console.error("AI Gateway error (evaluation):", evaluationResponse.status, errorText);
      
      if (evaluationResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (evaluationResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI Gateway error: ${evaluationResponse.status}`);
    }

    const evaluationData = await evaluationResponse.json();
    console.log("Evaluation Response:", JSON.stringify(evaluationData, null, 2));

    const evaluationToolCall = evaluationData.choices?.[0]?.message?.tool_calls?.[0];
    if (!evaluationToolCall) {
      throw new Error("No tool call in evaluation response");
    }

    const evaluationResult = JSON.parse(evaluationToolCall.function.arguments);

    // STAGE 2: Suggestions - Generate suggestions for "partial" items only
    const partialRequirements = evaluationResult.requirements.filter((req: any) => req.status === "partial");
    
    const requirementsWithSuggestions = await Promise.all(
      evaluationResult.requirements.map(async (req: any) => {
        if (req.status !== "partial") {
          return req;
        }

        // Generate AI suggestion for this partial requirement
        const suggestionPrompt = `You are a regulatory compliance advisor. A FinTech startup has PARTIALLY met this QCB requirement:

Requirement: ${req.requirement}
Category: ${req.category}
Current Status: ${req.details}

Provide a concise, actionable suggestion (2-3 sentences) on how they can improve their documentation to fully meet this requirement.`;

        try {
          const suggestionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "user", content: suggestionPrompt }
              ],
            }),
          });

          if (suggestionResponse.ok) {
            const suggestionData = await suggestionResponse.json();
            const suggestion = suggestionData.choices?.[0]?.message?.content || "";
            return { ...req, suggestion };
          }
        } catch (err) {
          console.error(`Failed to generate suggestion for ${req.id}:`, err);
        }

        return req;
      })
    );

    // Map resources to requirements
    const finalRequirements = requirementsWithSuggestions.map((req: any) => {
      if (req.status === "partial" || req.status === "missing") {
        const matchedResources = RESOURCE_MAPPING.filter(resource => 
          resource.linked_rule_ids.includes(req.id)
        );
        return { ...req, resources: matchedResources };
      }
      return req;
    });

    return new Response(
      JSON.stringify({
        score: evaluationResult.overall_score,
        requirements: finalRequirements,
        recommendations: evaluationResult.recommendations,
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
