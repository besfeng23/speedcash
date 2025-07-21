
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, Download, Loader2, Bot, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
// TODO: Create AI flow for transaction reports
// import { generateTransactionReport, GenerateTransactionReportOutput } from "@/ai/flows/generate-transaction-report";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Temporary types and function until AI flow is implemented
type GenerateTransactionReportOutput = {
  summary: string;
  csvData: string;
};

const generateTransactionReport = async (params: { startDate: string; endDate: string }): Promise<GenerateTransactionReportOutput> => {
  // Mock implementation
  return {
    summary: `• Generated report for ${params.startDate} to ${params.endDate}\n• Total transactions: 1,234\n• Total volume: ₱5,678,901.23\n• Success rate: 98.5%`,
    csvData: "Transaction ID,Type,Amount,Status,Date\n12345,p2p_transfer,1000.00,completed,2024-01-01"
  };
};

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [reportType, setReportType] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [reportResult, setReportResult] = useState<GenerateTransactionReportOutput | null>(null);
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    if (!reportType) {
        toast({ variant: "destructive", title: "Missing Information", description: "Please select a report type." });
        return;
    }
    if (!dateRange || !dateRange.from || !dateRange.to) {
        toast({ variant: "destructive", title: "Missing Information", description: "Please select a valid date range." });
        return;
    }

    setIsLoading(true);
    setReportResult(null);
    try {
        const result = await generateTransactionReport({
            startDate: format(dateRange.from, "yyyy-MM-dd"),
            endDate: format(dateRange.to, "yyyy-MM-dd"),
        });

        setReportResult(result);
        toast({ title: "Report Ready", description: "Your report summary is ready to view." });

    } catch (error) {
        console.error("Report generation failed:", error);
        toast({ variant: "destructive", title: "Generation Failed", description: "Could not generate the report." });
    } finally {
        setIsLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!reportResult) return;
    const blob = new Blob([reportResult.csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        const fileName = `${reportType}_${format(dateRange!.from!, "yyyyMMdd")}-${format(dateRange!.to!, "yyyyMMdd")}.csv`;
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  }


  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Reports Management</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Generate a New Report</CardTitle>
              <CardDescription>Select a report type and date range to generate a CSV export.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <p className="text-sm font-medium">Report Type</p>
                    <Select value={reportType} onValueChange={setReportType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a report..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all-tx">Full Transaction Ledger</SelectItem>
                            <SelectItem value="p2p" disabled>All P2P Transfers</SelectItem>
                            <SelectItem value="remittances" disabled>All Remittances</SelectItem>
                            <SelectItem value="settlements" disabled>Settlement Summary</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="space-y-2">
                    <p className="text-sm font-medium">Date Range</p>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="date"
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                {format(dateRange.from, "LLL dd, y")} -{" "}
                                {format(dateRange.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(dateRange.from, "LLL dd, y")
                            )
                            ) : (
                            <span>Pick a date range</span>
                            )}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                        />
                        </PopoverContent>
                    </Popover>
                </div>

                <Button className="w-full" size="lg" onClick={handleGenerateReport} disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 animate-spin"/>
                            Generating Report...
                        </>
                    ) : (
                        <>
                            <Bot className="mr-2"/>
                            Generate with AI
                        </>
                    )}
                </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
            {isLoading && (
                 <Card className="flex flex-col items-center justify-center h-full min-h-[300px]">
                    <Loader2 className="h-12 w-12 animate-spin text-primary"/>
                    <p className="mt-4 text-muted-foreground">Kai is analyzing the data...</p>
                 </Card>
            )}
            {!isLoading && reportResult && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>AI-Generated Summary</CardTitle>
                                <CardDescription>Key insights from the selected period.</CardDescription>
                            </div>
                            <Button onClick={handleDownloadCsv}>
                                <Download className="mr-2"/>
                                Download CSV
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Alert>
                            <FileText className="h-4 w-4" />
                            <AlertTitle>Analysis Complete</AlertTitle>
                            <AlertDescription>
                               <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: reportResult.summary.replace(/•/g, '<br/>•') }} />
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            )}
             {!isLoading && !reportResult && (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed h-full min-h-[300px]">
                    <Bot className="h-12 w-12 text-muted-foreground"/>
                    <p className="mt-4 text-muted-foreground">Your AI-generated summary will appear here.</p>
                </div>
             )}
        </div>
      </div>
    </div>
  );
}
