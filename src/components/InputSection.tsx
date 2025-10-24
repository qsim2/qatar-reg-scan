import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Upload } from "lucide-react";

interface InputSectionProps {
  businessPlan: string;
  onBusinessPlanChange: (value: string) => void;
  onEvaluate: () => void;
  isLoading: boolean;
}

export const InputSection = ({
  businessPlan,
  onBusinessPlanChange,
  onEvaluate,
  isLoading,
}: InputSectionProps) => {
  return (
    <Card className="p-6 shadow-card hover:shadow-elevated transition-shadow duration-300">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-primary">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Business Plan Input</h2>
            <p className="text-sm text-muted-foreground">
              Enter your FinTech startup business plan for QCB compliance evaluation
            </p>
          </div>
        </div>

        <Textarea
          placeholder="Paste your business plan here... Include information about your business model, capital structure, AML/CFT procedures, IT infrastructure, management team qualifications, and business continuity plans."
          value={businessPlan}
          onChange={(e) => onBusinessPlanChange(e.target.value)}
          className="min-h-[200px] resize-none border-border focus:ring-primary"
          disabled={isLoading}
        />

        <div className="flex gap-3">
          <Button
            onClick={onEvaluate}
            disabled={!businessPlan.trim() || isLoading}
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
