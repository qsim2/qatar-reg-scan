import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

interface ScoreDisplayProps {
  score: number;
}

export const ScoreDisplay = ({ score }: ScoreDisplayProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-8 w-8" />;
    if (score >= 60) return <AlertCircle className="h-8 w-8" />;
    return <AlertCircle className="h-8 w-8" />;
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "High Readiness";
    if (score >= 60) return "Moderate Readiness";
    return "Low Readiness";
  };

  return (
    <Card className="p-6 shadow-card hover:shadow-elevated transition-shadow duration-300">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-primary">
            <TrendingUp className="h-5 w-5 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Regulatory Readiness Score</h2>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className={`flex items-center gap-2 ${getScoreColor(score)}`}>
              {getScoreIcon(score)}
              <span className="text-5xl font-bold">{score}%</span>
            </div>
            <p className="text-sm text-muted-foreground">{getScoreLabel(score)}</p>
          </div>
        </div>

        <Progress value={score} className="h-3" />

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">✅</div>
            <p className="text-xs text-muted-foreground mt-1">Compliant</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">⚠️</div>
            <p className="text-xs text-muted-foreground mt-1">Partial</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">❌</div>
            <p className="text-xs text-muted-foreground mt-1">Missing</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
