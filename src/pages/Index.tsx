import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InputSection } from "@/components/InputSection";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { RequirementsChecklist } from "@/components/RequirementsChecklist";
import { RecommendationsSection } from "@/components/RecommendationsSection";
import { UrgentRecommendations } from "@/components/UrgentRecommendations";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Download, Shield, Building2 } from "lucide-react";

const Index = () => {
  const [businessModelFile, setBusinessModelFile] = useState<File | null>(null);
  const [amlSecurityFile, setAmlSecurityFile] = useState<File | null>(null);
  const [techOperationsFile, setTechOperationsFile] = useState<File | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [summaryPdfUrl, setSummaryPdfUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleEvaluate = async () => {
    if (!businessModelFile && !amlSecurityFile && !techOperationsFile) {
      toast({
        title: "Files Required",
        description: "Please upload at least one PDF document",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setSummaryPdfUrl(null);
    
    try {
      const payload: any = {};
      
      if (businessModelFile) {
        payload.businessModelPdf = await fileToBase64(businessModelFile);
        payload.businessModelFilename = businessModelFile.name;
      }
      if (amlSecurityFile) {
        payload.amlSecurityPdf = await fileToBase64(amlSecurityFile);
        payload.amlSecurityFilename = amlSecurityFile.name;
      }
      if (techOperationsFile) {
        payload.techOperationsPdf = await fileToBase64(techOperationsFile);
        payload.techOperationsFilename = techOperationsFile.name;
      }

      const { data, error } = await supabase.functions.invoke("analyze-compliance", {
        body: payload,
      });

      if (error) throw error;

      setScore(data.score);
      setRequirements(data.requirements);
      setRecommendations(data.recommendations);

      // Create blob URL for PDF download
      if (data.summaryPdf) {
        const pdfBlob = new Blob(
          [Uint8Array.from(atob(data.summaryPdf), c => c.charCodeAt(0))],
          { type: 'application/pdf' }
        );
        const url = URL.createObjectURL(pdfBlob);
        setSummaryPdfUrl(url);
      }

      toast({
        title: "Analysis Complete",
        description: `Your readiness score is ${data.score}%`,
      });
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing your documentation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (summaryPdfUrl) {
      const a = document.createElement('a');
      a.href = summaryPdfUrl;
      a.download = 'QCB_Compliance_Summary_Report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">QCB Regulatory Navigator</h1>
              <p className="text-sm text-muted-foreground">
                PDF Document Processing Pipeline for FinTech Licensing Readiness
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4 py-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Upload → Extract → Analyze → Download</span>
            </div>
            <h2 className="text-4xl font-bold text-foreground">
              Upload Your Compliance Documents
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload 3 PDFs, receive AI-powered analysis and download a comprehensive summary report
            </p>
          </div>

          <InputSection
            businessModelFile={businessModelFile}
            amlSecurityFile={amlSecurityFile}
            techOperationsFile={techOperationsFile}
            onBusinessModelFileChange={setBusinessModelFile}
            onAmlSecurityFileChange={setAmlSecurityFile}
            onTechOperationsFileChange={setTechOperationsFile}
          />

          <Button 
            onClick={handleEvaluate} 
            disabled={isLoading || (!businessModelFile && !amlSecurityFile && !techOperationsFile)}
            className="w-full"
            size="lg"
          >
            {isLoading ? "Analyzing..." : "Evaluate Compliance"}
          </Button>

          {score !== null && (
            <div className="space-y-6">
              <ScoreDisplay score={score} />
              
              {summaryPdfUrl && (
                <div className="flex justify-center">
                  <Button onClick={handleDownloadPdf} size="lg" className="gap-2">
                    <Download className="h-5 w-5" />
                    Download Summary Report PDF
                  </Button>
                </div>
              )}
              
              <UrgentRecommendations requirements={requirements} />
              <RequirementsChecklist requirements={requirements} />
              <RecommendationsSection recommendations={recommendations} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
