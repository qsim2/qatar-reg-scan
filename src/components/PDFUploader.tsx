import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PDFUploaderProps {
  onUploadComplete: (documents: {
    businessPlan: string;
    compliancePolicy: string;
    legalStructure: string;
  }) => void;
}

export default function PDFUploader({ onUploadComplete }: PDFUploaderProps) {
  const [files, setFiles] = useState<{
    businessPlan?: File;
    compliancePolicy?: File;
    legalStructure?: File;
  }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (type: keyof typeof files, file: File | null) => {
    if (file) {
      setFiles(prev => ({ ...prev, [type]: file }));
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result?.toString().split(',')[1];
        resolve(base64 || "");
      };
      reader.onerror = reject;
    });
  };

  const handleSubmit = async () => {
    if (!files.businessPlan || !files.compliancePolicy || !files.legalStructure) {
      toast({
        variant: "destructive",
        title: "Missing Documents",
        description: "Please upload all three required documents",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Convert files to base64
      const businessPlanB64 = await convertToBase64(files.businessPlan);
      const compliancePolicyB64 = await convertToBase64(files.compliancePolicy);
      const legalStructureB64 = await convertToBase64(files.legalStructure);

      onUploadComplete({
        businessPlan: businessPlanB64,
        compliancePolicy: compliancePolicyB64,
        legalStructure: legalStructureB64,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Failed to process documents",
      });
      setIsProcessing(false);
    }
  };

  const allFilesUploaded = files.businessPlan && files.compliancePolicy && files.legalStructure;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Business Plan
          </CardTitle>
          <CardDescription>Upload your business plan PDF</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => handleFileChange("businessPlan", e.target.files?.[0] || null)}
            />
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">
              {files.businessPlan ? files.businessPlan.name : "Click to upload"}
            </span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Compliance Policy
          </CardTitle>
          <CardDescription>Upload compliance policy PDF</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => handleFileChange("compliancePolicy", e.target.files?.[0] || null)}
            />
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">
              {files.compliancePolicy ? files.compliancePolicy.name : "Click to upload"}
            </span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Legal Structure
          </CardTitle>
          <CardDescription>Upload legal structure PDF</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => handleFileChange("legalStructure", e.target.files?.[0] || null)}
            />
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">
              {files.legalStructure ? files.legalStructure.name : "Click to upload"}
            </span>
          </label>
        </CardContent>
      </Card>

      <div className="col-span-full flex justify-center">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={!allFilesUploaded || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing Documents...
            </>
          ) : (
            "Analyze Compliance"
          )}
        </Button>
      </div>
    </div>
  );
}
