import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

interface InputSectionProps {
  businessModelFile: File | null;
  amlSecurityFile: File | null;
  techOperationsFile: File | null;
  onBusinessModelFileChange: (file: File | null) => void;
  onAmlSecurityFileChange: (file: File | null) => void;
  onTechOperationsFileChange: (file: File | null) => void;
}

export const InputSection = ({
  businessModelFile,
  amlSecurityFile,
  techOperationsFile,
  onBusinessModelFileChange,
  onAmlSecurityFileChange,
  onTechOperationsFileChange,
}: InputSectionProps) => {
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setter(file);
    } else if (file) {
      alert("Please upload a PDF file");
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📋</span>
            Business Model & Corporate Governance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="business-model-pdf" className="cursor-pointer">
            <div className="border-2 border-dashed border-primary/20 rounded-lg p-8 hover:border-primary/40 transition-colors">
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {businessModelFile ? businessModelFile.name : "Upload Business Model PDF"}
                </span>
              </div>
            </div>
            <Input
              id="business-model-pdf"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => handleFileChange(e, onBusinessModelFileChange)}
            />
          </Label>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>🔒</span>
            AML/CFT & Security Policies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="aml-security-pdf" className="cursor-pointer">
            <div className="border-2 border-dashed border-primary/20 rounded-lg p-8 hover:border-primary/40 transition-colors">
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {amlSecurityFile ? amlSecurityFile.name : "Upload AML/CFT & Security PDF"}
                </span>
              </div>
            </div>
            <Input
              id="aml-security-pdf"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => handleFileChange(e, onAmlSecurityFileChange)}
            />
          </Label>
        </CardContent>
      </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>⚙️</span>
            Technology & Operations Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="tech-operations-pdf" className="cursor-pointer">
            <div className="border-2 border-dashed border-primary/20 rounded-lg p-8 hover:border-primary/40 transition-colors">
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {techOperationsFile ? techOperationsFile.name : "Upload Technology & Operations PDF"}
                </span>
              </div>
            </div>
            <Input
              id="tech-operations-pdf"
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => handleFileChange(e, onTechOperationsFileChange)}
            />
          </Label>
        </CardContent>
      </Card>
    </div>
  );
};
