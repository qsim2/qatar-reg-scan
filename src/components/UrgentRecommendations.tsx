import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface RequirementItem {
  category: string;
  requirement: string;
  status: "compliant" | "partial" | "missing";
  details: string;
}

interface UrgentRecommendationsProps {
  requirements: RequirementItem[];
}

export const UrgentRecommendations = ({ requirements }: UrgentRecommendationsProps) => {
  const urgentItems = requirements.filter(req => req.status === "missing");

  if (urgentItems.length === 0) return null;

  return (
    <Card className="p-6 border-destructive/50 bg-destructive/5 shadow-card">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive">
            <AlertTriangle className="h-5 w-5 text-destructive-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Urgent Requirements</h2>
            <p className="text-sm text-muted-foreground">
              {urgentItems.length} critical {urgentItems.length === 1 ? 'requirement' : 'requirements'} must be addressed immediately
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {urgentItems.map((item, index) => (
            <div
              key={index}
              className="flex gap-3 p-4 rounded-lg border border-destructive/30 bg-card"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-destructive flex items-center justify-center text-xs font-bold text-destructive-foreground">
                !
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground">{item.requirement}</p>
                  <Badge variant="destructive" className="flex-shrink-0">
                    URGENT
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {item.category}
                </p>
                <p className="text-sm text-muted-foreground">{item.details}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
