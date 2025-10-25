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

const DEFAULT_BUSINESS_MODEL = `Al-Ameen Digital, LLC is a Limited Liability Company registered in Lusail, State of Qatar. Our primary business activities are the development and operation of financial technology software, management of digital payment systems (PSP), and the facilitation of peer-to-peer financing services.

Our authorized share capital is QAR 8,000,000. The initial paid-up capital upon incorporation was QAR 5,000,000.

The company is managed by a Board of Directors consisting of three (3) members. We will be submitting the required CVs, organizational charts, and police clearance certificates for all key personnel, including the CEO and Compliance Officer, to meet the QCB's Fit and Proper criteria during the formal application stage.`;

const DEFAULT_AML_SECURITY = `Our security framework focuses on robust data privacy. We collect Personal Identifiable Information (PII) such as full name, national ID number, and contact details for KYC, credit scoring, and service provision. This data is processed via multi-factor authentication and access is restricted to authorized personnel. We share data with trusted third-party service providers like 'ID-Verify Pro' for KYC and 'SwiftPay Global' for payment processing.

We are committed to preventing illicit financial activities and have a foundational Anti-Money Laundering (AML) policy in place. Our procedures include initial customer risk assessment and basic identity verification.`;

const DEFAULT_TECH_OPERATIONS = `Our core platform is built on a modern, secure cloud environment. All customer data is currently processed and stored within AWS regions located in Ireland and Singapore to ensure high availability and geographic redundancy. Access to raw PII is restricted to the Head of Technology and two designated Data Analysts.

For business continuity, we maintain regular data backups. Data is retained for 7 years after the termination of the customer relationship before secure disposal. We have not yet formalized a comprehensive Disaster Recovery (DR) plan detailing failover procedures and recovery time objectives (RTOs).`;

const Index = () => {
  const [businessModel, setBusinessModel] = useState(DEFAULT_BUSINESS_MODEL);
  const [amlSecurity, setAmlSecurity] = useState(DEFAULT_AML_SECURITY);
  const [techOperations, setTechOperations] = useState(DEFAULT_TECH_OPERATIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const handleEvaluate = async () => {
    if (!businessModel.trim() && !amlSecurity.trim() && !techOperations.trim()) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-compliance", {
        body: { 
          businessModel,
          amlSecurity,
          techOperations
        },
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
            businessModel={businessModel}
            amlSecurity={amlSecurity}
            techOperations={techOperations}
            onBusinessModelChange={setBusinessModel}
            onAmlSecurityChange={setAmlSecurity}
            onTechOperationsChange={setTechOperations}
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
