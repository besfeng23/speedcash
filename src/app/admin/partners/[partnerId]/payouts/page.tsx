
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useApi } from "@/hooks/useApi";
import { useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type TestPayout = {
    id: string;
    ts: string;
    amount: string;
    status: 'SUCCESS' | 'FAILED';
    response: string;
}

  interface PayoutResponse {
    id: string;
    status: string;
    response: string;
  }

export default function PartnerPayoutsPage() {
    const [testPayouts, setTestPayouts] = useState<TestPayout[]>([]);
    const params = useParams();
    const partnerId = params.partnerId as string;
    const { toast } = useToast();

    const { call: initiateTestPayout, isLoading } = useApi('partnerInitiateTestPayout');

    const handleTestPayout = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const amount = parseFloat(formData.get('amount') as string);
        const channel = formData.get('channel') as 'instapay' | 'pesonet';
        const accountNumber = formData.get('accountNumber') as string;
        const accountName = formData.get('accountName') as string;
        
        const result = await initiateTestPayout({
            partnerId, amount, channel, accountNumber, accountName
        });
        
        const newPayout: TestPayout = {
            id: `tp_${Date.now()}`,
            ts: new Date().toLocaleString(),
            amount: `₱${amount.toFixed(2)}`,
            status: (result as any)?.success ? 'SUCCESS' : 'FAILED',
            response: (result as any)?.response || 'Error'
        };

        setTestPayouts(prev => [newPayout, ...prev]);

        toast({
            title: (result as any)?.success ? "Test Payout Submitted" : "Test Payout Failed",
            description: (result as any)?.message || "An unexpected error occurred.",
            variant: (result as any)?.success ? "default" : "destructive"
        });

    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Initiate Test Payout</CardTitle>
                        <CardDescription>Submit a test payout on behalf of the partner for debugging.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleTestPayout} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Payout Channel</Label>
                                <Select name="channel" defaultValue="instapay">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select channel..."/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="instapay">InstaPay</SelectItem>
                                        <SelectItem value="pesonet">PESONet</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                               <Label htmlFor="amount">Amount (PHP)</Label>
                               <Input id="amount" name="amount" type="number" step="0.01" defaultValue="1.00" required/>
                            </div>
                            <div className="space-y-2">
                               <Label htmlFor="accountNumber">Recipient Account Number</Label>
                               <Input id="accountNumber" name="accountNumber" defaultValue="0123456789" required/>
                            </div>
                            <div className="space-y-2">
                               <Label htmlFor="accountName">Recipient Name</Label>
                               <Input id="accountName" name="accountName" defaultValue="Juan dela Cruz" required/>
                            </div>
                            <Button className="w-full" type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Submit Test Payout
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
             {/* Right Column */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Test Payout Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                               {testPayouts.length === 0 && (
                                   <TableRow>
                                       <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                           No test payouts initiated yet.
                                       </TableCell>
                                   </TableRow>
                               )}
                               {testPayouts.map(payout => (
                                <TableRow key={payout.id}>
                                    <TableCell className="text-xs">{payout.ts}</TableCell>
                                    <TableCell className="font-medium">{payout.amount}</TableCell>
                                    <TableCell>
                                        <Badge variant={payout.status === 'SUCCESS' ? 'default' : 'destructive'}>{payout.status}</Badge>
                                    </TableCell>
                                </TableRow>
                               ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
