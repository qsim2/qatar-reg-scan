import { useState } from "react";
import { InputSection } from "@/components/InputSection";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { RequirementsChecklist, RequirementItem } from "@/components/RequirementsChecklist";
import { RecommendationsSection } from "@/components/RecommendationsSection";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, Building2 } from "lucide-react";

interface AnalysisResult {
  score: number;
  requirements: RequirementItem[];
  recommendations: string[];
}

const Index = () => {
  const [businessPlan, setBusinessPlan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const handleEvaluate = async () => {
    if (!businessPlan.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-compliance", {
        body: { businessPlan },
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: "Analysis Complete",
        description: "Your regulatory readiness assessment is ready.",
      });
    } catch (error: any) {
      console.error("Error analyzing compliance:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze compliance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">QCB Regulatory Navigator</h1>
              <p className="text-sm text-muted-foreground">
                FinTech Licensing Readiness Evaluator for Qatar
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4 py-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Qatar Central Bank Compliance</span>
            </div>
            <h2 className="text-4xl font-bold text-foreground">
              Evaluate Your Regulatory Readiness
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get instant AI-powered analysis of your FinTech startup's compliance with QCB
              licensing requirements. Identify gaps and receive actionable recommendations.
            </p>
          </div>

          {/* Input Section */}
          <InputSection
            businessPlan={businessPlan}
            onBusinessPlanChange={setBusinessPlan}
            onEvaluate={handleEvaluate}
            isLoading={isLoading}
          />

          {/* Results Section */}
          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ScoreDisplay score={result.score} />

              <div className="grid md:grid-cols-2 gap-6">
                <RequirementsChecklist requirements={result.requirements} />
                <RecommendationsSection recommendations={result.recommendations} />
              </div>
            </div>
          )}

          {/* Info Footer */}
          {!result && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                This tool evaluates your business plan against key QCB requirements including capital
                adequacy, AML/CFT compliance, IT security, fit & proper criteria, and business
                continuity planning.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
