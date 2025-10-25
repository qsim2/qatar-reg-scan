import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ExternalLink } from "lucide-react";

interface Requirement {
  requirement_id: string;
  status: "compliant" | "partial" | "missing";
  matched_text: string;
  similarity_score: number;
  is_critical: boolean;
  points: number;
  weight: number;
}

interface Recommendation {
  requirement_id: string;
  suggestion: string;
  resources: Array<{
    name: string;
    type: string;
    url: string;
  }>;
}

interface ComplianceResultsProps {
  requirements: Requirement[];
  recommendations: Recommendation[];
}

export default function ComplianceResults({ requirements, recommendations }: ComplianceResultsProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "compliant":
        return <Badge className="bg-green-600">Compliant</Badge>;
      case "partial":
        return <Badge className="bg-yellow-600">Partial</Badge>;
      case "missing":
        return <Badge variant="destructive">Missing</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const criticalRequirements = requirements.filter(r => r.is_critical);
  const standardRequirements = requirements.filter(r => !r.is_critical);

  return (
    <div className="space-y-6">
      {/* Critical Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Critical Requirements</CardTitle>
          <CardDescription>High-priority compliance items that must be addressed</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {criticalRequirements.map((req, idx) => (
              <AccordionItem key={idx} value={`critical-${idx}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="font-medium text-left">
                      {req.requirement_id.replace(/_/g, " ").toUpperCase()}
                    </span>
                    {getStatusBadge(req.status)}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>Similarity Score:</strong> {(req.similarity_score * 100).toFixed(1)}%</p>
                    <p><strong>Matched Text:</strong> {req.matched_text}</p>
                    <p><strong>Points:</strong> {req.points} / 100 (Weight: {req.weight}x)</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Standard Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Standard Requirements</CardTitle>
          <CardDescription>Additional compliance requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {standardRequirements.map((req, idx) => (
              <AccordionItem key={idx} value={`standard-${idx}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="font-medium text-left">
                      {req.requirement_id.replace(/_/g, " ").toUpperCase()}
                    </span>
                    {getStatusBadge(req.status)}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <p><strong>Similarity Score:</strong> {(req.similarity_score * 100).toFixed(1)}%</p>
                    <p><strong>Matched Text:</strong> {req.matched_text}</p>
                    <p><strong>Points:</strong> {req.points} / 100</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Urgent Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Urgent Recommendations</CardTitle>
            <CardDescription>Actionable steps to address critical gaps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="border-l-4 border-primary pl-4 py-2">
                <h4 className="font-semibold mb-2">
                  {rec.requirement_id.replace(/_/g, " ").toUpperCase()}
                </h4>
                <p className="text-sm text-muted-foreground mb-3">{rec.suggestion}</p>
                {rec.resources.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Resources:</p>
                    {rec.resources.map((resource, ridx) => (
                      <a
                        key={ridx}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {resource.name} ({resource.type})
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
