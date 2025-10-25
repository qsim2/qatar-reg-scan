import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface ScoringChartProps {
  overallScore: number;
  summary: {
    compliant: number;
    partial: number;
    missing: number;
    total: number;
  };
}

export default function ScoringChart({ overallScore, summary }: ScoringChartProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (score: number) => {
    if (score >= 70) return "bg-green-600";
    if (score >= 40) return "bg-yellow-600";
    return "bg-red-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Readiness Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className={`text-6xl font-bold ${getScoreColor(overallScore)}`}>
            {overallScore}%
          </div>
          <p className="text-sm text-muted-foreground mt-2">Overall Readiness</p>
          <Progress 
            value={overallScore} 
            className="mt-4"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 pt-6 border-t">
          <div className="text-center">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{summary.compliant}</div>
            <div className="text-sm text-muted-foreground">Compliant</div>
          </div>
          
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold">{summary.partial}</div>
            <div className="text-sm text-muted-foreground">Partial</div>
          </div>
          
          <div className="text-center">
            <XCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
            <div className="text-2xl font-bold">{summary.missing}</div>
            <div className="text-sm text-muted-foreground">Missing</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
