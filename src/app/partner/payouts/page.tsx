
"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Banknote, Download, Loader2, PlusCircle, ServerCrash } from "lucide-react";
import KpiCard from "@/components/kpi-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApi, useApiQuery } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Payout = {
  id: string;
  amount: number;
  status: string;
  timestamp: any;
  type?: string; // Add optional type property
  details: {
    bankDetails: {
      bankCode: string;
      accountNumber: string;
    };
  };
};

const partnerBanks = [
    { name: "BDO Unibank", code: "BDO" },
    { name: "Bank of the Philippine Islands", code: "BPI" },
    { name: "Metrobank", code: "MBTC" },
    { name: "Land Bank of the Philippines", code: "LBP" },
    { name: "Security Bank", code: "SECB" },
];


export default function PayoutsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: balanceData, isLoading: isBalanceLoading } = useApiQuery<{balances: Record<string, number>}>(
    'getWalletBalance',
    { uid: user?.uid },
    { enabled: !!user, queryKey: ['walletBalances', user?.uid] }
  );

  const { data: transactions, isLoading: isPayoutsLoading, error: payoutsError } = useApiQuery<{ transactions: Payout[] }>(
    'getTransactionHistory',
    undefined,
    { enabled: !!user, queryKey: ['getTransactionHistory'] }
  );

  const { data: stats } = useApiQuery<any>(
    'partnerGetDashboardStats',
    undefined,
    { enabled: !!user, queryKey: ['partnerGetDashboardStats'] }
  );
  
  const payouts = transactions?.transactions || [];

  const { call: requestPayout, isLoading: isRequestingPayout } = useApi('initiateCashOut');

  const availableBalance = balanceData?.balances?.PHP ?? 0;

  const handlePayoutRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = parseFloat(formData.get("amount") as string);
    const bankCode = formData.get("bankCode") as string;
    const accountNumber = formData.get("accountNumber") as string;
    const accountName = formData.get("accountName") as string;

    if (amount > availableBalance) {
        toast({
            variant: "destructive",
            title: "Insufficient Balance",
            description: "The requested amount exceeds your available balance.",
        });
        return;
    }

    const result = await requestPayout({
      amount,
      currency: "PHP",
      bankDetails: { bankCode, accountNumber, accountName },
    });
    
    if ((result as any)?.success) {
      toast({
        title: "Payout Request Submitted",
        description: "Your request has been sent for admin approval.",
      });
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['walletBalances', user?.uid] });
      queryClient.invalidateQueries({ queryKey: ['payoutsHistory', user?.uid] });
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'pending_approval': return 'secondary';
      case 'failed': return 'destructive';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };


  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Payouts</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Request Payout
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request a New Payout</DialogTitle>
              <DialogDescription>
                Enter the amount and destination for your payout. Requests are subject to admin approval.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePayoutRequest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (Available: ₱{availableBalance.toLocaleString()})</Label>
                <Input id="amount" name="amount" type="number" step="0.01" max={availableBalance} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankCode">Destination Bank</Label>
                 <Select name="bankCode" required>
                    <SelectTrigger id="bankCode">
                        <SelectValue placeholder="Choose a bank..." />
                    </SelectTrigger>
                    <SelectContent>
                        {partnerBanks.map((bank) => (
                            <SelectItem key={bank.code} value={bank.code}>
                                {bank.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
               <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input id="accountNumber" name="accountNumber" required />
              </div>
               <div className="space-y-2">
                <Label htmlFor="accountName">Account Name</Label>
                <Input id="accountName" name="accountName" placeholder="Full name as registered in bank" required />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full" disabled={isRequestingPayout}>
                  {isRequestingPayout && <Loader2 className="animate-spin mr-2"/>}
                  Submit Payout Request
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        {isBalanceLoading ? (
             <KpiCard title="Available for Payout" value={<Skeleton className="h-8 w-40" />} icon={Banknote} details={<Skeleton className="h-4 w-32" />} />
        ) : (
             <KpiCard title="Available for Payout" value={`₱${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={Banknote} details="Ready for payout to your linked account" />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>A record of all your settlements.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payout ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Destination</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPayoutsLoading ? (
                 Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    </TableRow>
                  ))
              ) : payoutsError ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                        <div className="flex flex-col items-center gap-2 text-destructive">
                            <ServerCrash className="h-6 w-6" />
                            <span className="font-semibold text-sm">Could not load payout history.</span>
                        </div>
                    </TableCell>
                </TableRow>
              ) : payouts.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                        You haven't made any payouts yet.
                    </TableCell>
                </TableRow>
              ) : (
                payouts.map((payout) => (
                    <TableRow key={payout.id}>
                    <TableCell className="font-mono text-xs">{payout.id}</TableCell>
                    <TableCell className="font-medium">₱{payout.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</TableCell>
                    <TableCell>{new Date(payout.timestamp.seconds * 1000).toLocaleDateString()}</TableCell>
                    <TableCell>
                        <Badge variant={getStatusVariant(payout.status)}>
                            {payout.status.replace('_', ' ')}
                        </Badge>
                    </TableCell>
                    <TableCell>{payout.details.bankDetails.bankCode} | **** {payout.details.bankDetails.accountNumber.slice(-4)}</TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
