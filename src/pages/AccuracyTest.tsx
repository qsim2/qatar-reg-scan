import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const DEFAULT_TEST_DATA = JSON.stringify({
  "test_cases": [
    {
      "name": "P2P Lending Startup (Compliant)",
      "documents": {
        "business_plan": "QatarLend is a Marketplace Lending (P2P) platform with QAR 7,500,000 in capital. Maximum transaction cap of QAR 200,000 per loan. Data stored in Doha data center.",
        "compliance_policy": "Enhanced CDD for transactions over QAR 10,000. Source of funds for QAR 50,000+. Board-approved AML/CFT Policy. STRs filed within 48 hours. Compliance Officer: Ahmed Al-Mansouri.",
        "legal_structure": "QatarLend W.L.L. registered in Qatar. Board: CEO Fatima Al-Thani, CFO Mohamed Hassan. Data Privacy Officer: Layla Ibrahim."
      },
      "ground_truth": {
        "overall_score": 95,
        "requirements": [
          {"id": "licensing_category", "status": "compliant", "category": "Licensing"},
          {"id": "minimum_capital_p2p", "status": "compliant", "category": "Capital"},
          {"id": "data_residency", "status": "compliant", "category": "Data Security"}
        ]
      }
    }
  ]
}, null, 2);

export default function AccuracyTest() {
  const [testData, setTestData] = useState(DEFAULT_TEST_DATA);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const runTests = async () => {
    setIsRunning(true);
    setResults(null);

    try {
      const parsedData = JSON.parse(testData);
      
      const { data, error } = await supabase.functions.invoke("test-accuracy", {
        body: parsedData,
      });

      if (error) throw error;

      setResults(data);
      toast({
        title: "Tests Complete",
        description: `Ran ${data.summary.test_cases_run} test cases successfully`,
      });
    } catch (error: any) {
      console.error("Test error:", error);
      toast({
        variant: "destructive",
        title: "Test Failed",
        description: error.message || "Failed to run accuracy tests",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">QCB Accuracy Testing</h1>
          <p className="text-muted-foreground">
            Test the compliance evaluation system against ground truth data
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Data (JSON)</CardTitle>
            <CardDescription>
              Paste your test cases in JSON format with ground truth data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={testData}
              onChange={(e) => setTestData(e.target.value)}
              className="font-mono text-sm min-h-[300px]"
              placeholder="Paste test data JSON here..."
            />
            <Button
              onClick={runTests}
              disabled={isRunning}
              className="mt-4"
              size="lg"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                "Run Accuracy Tests"
              )}
            </Button>
          </CardContent>
        </Card>

        {results && (
          <>
            <Card className="bg-primary/5 border-primary">
              <CardHeader>
                <CardTitle>Summary Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Test Cases</p>
                    <p className="text-2xl font-bold">{results.summary.test_cases_run}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">KPI 1 (Mapping)</p>
                    <p className="text-2xl font-bold">{(results.summary.kpi1_avg * 100).toFixed(2)}%</p>
                    <p className="text-xs text-muted-foreground">Target: 10%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">KPI 2 (Gap)</p>
                    <p className="text-2xl font-bold">{(results.summary.kpi2_avg * 100).toFixed(2)}%</p>
                    <p className="text-xs text-muted-foreground">Target: 5%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">KPI 3 (Score)</p>
                    <p className="text-2xl font-bold">{(results.summary.kpi3_avg * 100).toFixed(2)}%</p>
                    <p className="text-xs text-muted-foreground">Target: 5%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">KPI 4 (Recs)</p>
                    <p className="text-2xl font-bold">{(results.summary.kpi4_avg * 100).toFixed(2)}%</p>
                    <p className="text-xs text-muted-foreground">Target: 5%</p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-muted-foreground">Total Weighted Score</p>
                  <p className="text-4xl font-bold text-primary">
                    {(results.summary.total_avg * 100).toFixed(2)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Target: 25%</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Results by Test Case</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.detailed_results.map((result: any, idx: number) => (
                    <div key={idx} className="p-4 border rounded-lg space-y-2">
                      <h3 className="font-semibold text-lg">{result.test_case}</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <p>Predicted Score: <span className="font-mono">{result.predicted_score}%</span></p>
                        <p>Ground Truth: <span className="font-mono">{result.ground_truth_score}%</span></p>
                        <p>F1 Score: <span className="font-mono">{result.kpi1_f1.toFixed(3)}</span></p>
                        <p>Recall: <span className="font-mono">{result.kpi1_recall.toFixed(3)}</span></p>
                        <p>Gap Precision: <span className="font-mono">{result.kpi2_gap_precision.toFixed(3)}</span></p>
                        <p>Score Diff: <span className="font-mono">{result.kpi3_score_diff}</span></p>
                        <p className="col-span-2 font-semibold">
                          Total: <span className="text-primary">{(result.total_weighted * 100).toFixed(2)}%</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
