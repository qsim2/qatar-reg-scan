import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, AlertCircle, XCircle, ClipboardList } from "lucide-react";

export interface RequirementItem {
  category: string;
  requirement: string;
  status: "compliant" | "partial" | "missing";
  details: string;
}

interface RequirementsChecklistProps {
  requirements: RequirementItem[];
}

export const RequirementsChecklist = ({ requirements }: RequirementsChecklistProps) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case "partial":
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case "missing":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      compliant: "bg-success/10 text-success border-success/20",
      partial: "bg-warning/10 text-warning border-warning/20",
      missing: "bg-destructive/10 text-destructive border-destructive/20",
    };

    const labels = {
      compliant: "✅ Compliant",
      partial: "⚠️ Partial",
      missing: "❌ Missing",
    };

    return (
      <Badge variant="outline" className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <Card className="p-6 shadow-card hover:shadow-elevated transition-shadow duration-300">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-primary">
            <ClipboardList className="h-5 w-5 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Requirements Analysis</h2>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {requirements.map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getStatusIcon(item.status)}</div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-card-foreground">{item.requirement}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.category}</p>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{item.details}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
};
