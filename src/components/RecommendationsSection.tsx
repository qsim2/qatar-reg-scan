import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Download } from "lucide-react";

interface RecommendationsSectionProps {
  recommendations: string[];
}

export const RecommendationsSection = ({ recommendations }: RecommendationsSectionProps) => {
  const handleExport = () => {
    const content = recommendations.map((rec, i) => `${i + 1}. ${rec}`).join("\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qcb-compliance-recommendations.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-6 shadow-card hover:shadow-elevated transition-shadow duration-300">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Lightbulb className="h-5 w-5 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Recommendations</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        <div className="space-y-3">
          {recommendations.map((recommendation, index) => (
            <div
              key={index}
              className="flex gap-3 p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                {index + 1}
              </div>
              <p className="text-sm text-card-foreground flex-1">{recommendation}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
