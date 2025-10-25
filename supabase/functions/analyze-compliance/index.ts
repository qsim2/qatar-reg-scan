import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

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

// Simple PDF text extraction function
async function extractTextFromPdf(base64Pdf: string): Promise<string> {
  try {
    const pdfBytes = Uint8Array.from(atob(base64Pdf), c => c.charCodeAt(0));
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    // For MVP: Return a placeholder indicating we received the PDF
    // In production, you'd use a proper PDF text extraction library
    return `[PDF Document with ${pages.length} pages - Text extraction placeholder for MVP demo]`;
  } catch (error) {
    console.error("PDF extraction error:", error);
    return "[PDF extraction failed - please check PDF format]";
  }
}

// Generate summary PDF report
async function generateSummaryPdf(score: number, requirements: any[], recommendations: string[]): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const { width, height } = page.getSize();
  let yPosition = height - 50;
  
  // Title
  page.drawText('QCB Compliance Readiness Report', {
    x: 50,
    y: yPosition,
    size: 20,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.4),
  });
  
  yPosition -= 40;
  
  // Score
  page.drawText(`Overall Readiness Score: ${score}%`, {
    x: 50,
    y: yPosition,
    size: 16,
    font: boldFont,
    color: score >= 70 ? rgb(0, 0.6, 0) : score >= 40 ? rgb(0.8, 0.6, 0) : rgb(0.8, 0, 0),
  });
  
  yPosition -= 40;
  
  // Requirements summary
  page.drawText('Compliance Requirements:', {
    x: 50,
    y: yPosition,
    size: 14,
    font: boldFont,
  });
  
  yPosition -= 25;
  
  for (const req of requirements) {
    if (yPosition < 100) break; // Prevent overflow for MVP
    
    const statusSymbol = req.status === 'compliant' ? '✓' : req.status === 'partial' ? '⚠' : '✗';
    const statusColor = req.status === 'compliant' ? rgb(0, 0.6, 0) : req.status === 'partial' ? rgb(0.8, 0.6, 0) : rgb(0.8, 0, 0);
    
    page.drawText(`${statusSymbol} ${req.requirement}`, {
      x: 60,
      y: yPosition,
      size: 10,
      font: font,
      color: statusColor,
    });
    
    yPosition -= 20;
  }
  
  // Recommendations
  if (yPosition > 150 && recommendations.length > 0) {
    yPosition -= 20;
    page.drawText('Key Recommendations:', {
      x: 50,
      y: yPosition,
      size: 14,
      font: boldFont,
    });
    
    yPosition -= 25;
    
    for (let i = 0; i < Math.min(recommendations.length, 3); i++) {
      if (yPosition < 100) break;
      const rec = recommendations[i].substring(0, 80) + (recommendations[i].length > 80 ? '...' : '');
      page.drawText(`${i + 1}. ${rec}`, {
        x: 60,
        y: yPosition,
        size: 9,
        font: font,
      });
      yPosition -= 20;
    }
  }
  
  const pdfBytes = await pdfDoc.save();
  return btoa(String.fromCharCode(...pdfBytes));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      businessModelPdf, 
      amlSecurityPdf, 
      techOperationsPdf,
      businessModelFilename,
      amlSecurityFilename,
      techOperationsFilename
    } = await req.json();

    if (!businessModelPdf && !amlSecurityPdf && !techOperationsPdf) {
      return new Response(
        JSON.stringify({ error: "At least one PDF document is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Extracting text from PDFs...");
    
    // Extract text from PDFs
    const businessModel = businessModelPdf ? await extractTextFromPdf(businessModelPdf) : "";
    const amlSecurity = amlSecurityPdf ? await extractTextFromPdf(amlSecurityPdf) : "";
    const techOperations = techOperationsPdf ? await extractTextFromPdf(techOperationsPdf) : "";

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

    // Generate summary PDF
    console.log("Generating summary PDF...");
    const summaryPdf = await generateSummaryPdf(
      evaluationResult.overall_score,
      finalRequirements,
      evaluationResult.recommendations
    );

    return new Response(
      JSON.stringify({
        score: evaluationResult.overall_score,
        requirements: finalRequirements,
        recommendations: evaluationResult.recommendations,
        summaryPdf: summaryPdf,
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
