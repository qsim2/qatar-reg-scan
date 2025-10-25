import { useState } from "react";
import PDFUploader from "@/components/PDFUploader";
import ScoringChart from "@/components/ScoringChart";
import ComplianceResults from "@/components/ComplianceResults";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const analyzeDocuments = async (documents: {
    businessPlan: string;
    compliancePolicy: string;
    legalStructure: string;
  }) => {
    setIsAnalyzing(true);

    try {
      // Step 1: Extract PDF text
      toast({ title: "Step 1/6", description: "Extracting PDF text..." });
      const extractedDocs = await Promise.all([
        supabase.functions.invoke("extract-pdf", {
          body: { pdf_base64: documents.businessPlan, document_type: "business_plan" },
        }),
        supabase.functions.invoke("extract-pdf", {
          body: { pdf_base64: documents.compliancePolicy, document_type: "compliance_policy" },
        }),
        supabase.functions.invoke("extract-pdf", {
          body: { pdf_base64: documents.legalStructure, document_type: "legal_structure" },
        }),
      ]);

      // Step 2: Preprocess and chunk
      toast({ title: "Step 2/6", description: "Preprocessing and chunking text..." });
      const chunkedDocs = await Promise.all(
        extractedDocs.map(doc =>
          supabase.functions.invoke("preprocess-chunks", {
            body: { raw_text: doc.data.raw_text, document_type: doc.data.document_type },
          })
        )
      );

      const allChunks = chunkedDocs.flatMap(doc => doc.data.chunks);

      // Step 3: Rule-based checks
      toast({ title: "Step 3/6", description: "Running rule-based checks..." });
      const { data: ruleData } = await supabase.functions.invoke("rule-based-checks", {
        body: { chunks: allChunks },
      });

      // Step 4: Semantic matching
      toast({ title: "Step 4/6", description: "Performing semantic matching..." });
      const { data: semanticData } = await supabase.functions.invoke("semantic-matching", {
        body: { chunks: allChunks, rule_matches: ruleData.rule_matches },
      });

      // Step 5: Scoring
      toast({ title: "Step 5/6", description: "Calculating compliance scores..." });
      const { data: scoreData } = await supabase.functions.invoke("score-compliance", {
        body: { semantic_matches: semanticData.semantic_matches },
      });

      // Step 6: Generate report
      toast({ title: "Step 6/6", description: "Generating final report..." });
      const { data: reportData } = await supabase.functions.invoke("generate-report", {
        body: { scoring_result: scoreData },
      });

      setResults(reportData);
      toast({ title: "Analysis Complete!", description: "View your compliance report below" });
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: error.message || "Failed to analyze documents",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            QCB Compliance Navigator
          </h1>
          <p className="text-muted-foreground">
            Upload your documents for intelligent compliance analysis
          </p>
        </div>

        {!results && !isAnalyzing && (
          <PDFUploader onUploadComplete={analyzeDocuments} />
        )}

        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-xl text-muted-foreground">
              Analyzing your compliance documents...
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This may take a few moments
            </p>
          </div>
        )}

        {results && (
          <div className="space-y-8">
            <ScoringChart
              overallScore={results.overall_score}
              summary={results.summary}
            />
            <ComplianceResults
              requirements={results.requirements}
              recommendations={results.urgent_recommendations}
            />
          </div>
        )}
      </div>
    </div>
  );
}
