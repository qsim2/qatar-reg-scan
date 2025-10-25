import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Upload, Building2, Shield, Server } from "lucide-react";

interface InputSectionProps {
  businessModel: string;
  amlSecurity: string;
  techOperations: string;
  onBusinessModelChange: (value: string) => void;
  onAmlSecurityChange: (value: string) => void;
  onTechOperationsChange: (value: string) => void;
  onEvaluate: () => void;
  isLoading: boolean;
}

const DEFAULT_BUSINESS_MODEL = `Al-Ameen Digital, LLC is a Limited Liability Company registered in Lusail, State of Qatar. Our primary business activities are the development and operation of financial technology software, management of digital payment systems (PSP), and the facilitation of peer-to-peer financing services.

Our authorized share capital is QAR 8,000,000. The initial paid-up capital upon incorporation was QAR 5,000,000.

The company is managed by a Board of Directors consisting of three (3) members. We will be submitting the required CVs, organizational charts, and police clearance certificates for all key personnel, including the CEO and Compliance Officer, to meet the QCB's Fit and Proper criteria during the formal application stage.`;

const DEFAULT_AML_SECURITY = `Our security framework focuses on robust data privacy. We collect Personal Identifiable Information (PII) such as full name, national ID number, and contact details for KYC, credit scoring, and service provision. This data is processed via multi-factor authentication and access is restricted to authorized personnel. We share data with trusted third-party service providers like 'ID-Verify Pro' for KYC and 'SwiftPay Global' for payment processing.

We are committed to preventing illicit financial activities and have a foundational Anti-Money Laundering (AML) policy in place. Our procedures include initial customer risk assessment and basic identity verification.`;

const DEFAULT_TECH_OPERATIONS = `Our core platform is built on a modern, secure cloud environment. All customer data is currently processed and stored within AWS regions located in Ireland and Singapore to ensure high availability and geographic redundancy. Access to raw PII is restricted to the Head of Technology and two designated Data Analysts.

For business continuity, we maintain regular data backups. Data is retained for 7 years after the termination of the customer relationship before secure disposal. We have not yet formalized a comprehensive Disaster Recovery (DR) plan detailing failover procedures and recovery time objectives (RTOs).`;

export const InputSection = ({
  businessModel,
  amlSecurity,
  techOperations,
  onBusinessModelChange,
  onAmlSecurityChange,
  onTechOperationsChange,
  onEvaluate,
  isLoading,
}: InputSectionProps) => {
  const hasAnyContent = businessModel.trim() || amlSecurity.trim() || techOperations.trim();

  return (
    <Card className="p-6 shadow-card hover:shadow-elevated transition-shadow duration-300">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-primary">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Multi-Input Diagnostic Tool</h2>
            <p className="text-sm text-muted-foreground">
              Enter your documentation in the three categories below for comprehensive QCB compliance evaluation
            </p>
          </div>
        </div>

        {/* Business Model Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <label className="text-sm font-medium text-foreground">
              Business Model & Corporate Governance
            </label>
          </div>
          <Textarea
            placeholder="Enter your business model, capital structure, and governance documentation..."
            value={businessModel}
            onChange={(e) => onBusinessModelChange(e.target.value)}
            className="min-h-[150px] resize-none border-border focus:ring-primary"
            disabled={isLoading}
          />
        </div>

        {/* AML/CFT Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <label className="text-sm font-medium text-foreground">
              AML/CFT & Security Policies
            </label>
          </div>
          <Textarea
            placeholder="Enter your AML/CFT policies, security framework, and data protection measures..."
            value={amlSecurity}
            onChange={(e) => onAmlSecurityChange(e.target.value)}
            className="min-h-[150px] resize-none border-border focus:ring-primary"
            disabled={isLoading}
          />
        </div>

        {/* Tech Operations Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-primary" />
            <label className="text-sm font-medium text-foreground">
              Technology & Operations Plan
            </label>
          </div>
          <Textarea
            placeholder="Enter your IT infrastructure, data storage, backup procedures, and disaster recovery plans..."
            value={techOperations}
            onChange={(e) => onTechOperationsChange(e.target.value)}
            className="min-h-[150px] resize-none border-border focus:ring-primary"
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onEvaluate}
            disabled={!hasAnyContent || isLoading}
            className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Analyzing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Evaluate Readiness
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};
