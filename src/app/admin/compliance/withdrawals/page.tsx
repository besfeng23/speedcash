
"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useApi, useApiQuery } from "@/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, ServerCrash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type WithdrawalRequest = {
  id: string;
  userName: string;
  uid: string;
  amount: number;
  currency: string;
  bankDetails: {
    bankCode: string;
    accountNumber: string;
    accountName: string;
  };
  createdAt: { seconds: number };
};

export default function WithdrawalQueuePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: response, isLoading, error } = useApiQuery<{requests: WithdrawalRequest[]}>(
      "adminGetWithdrawalQueue", 
      undefined,
      { queryKey: ["adminGetWithdrawalQueue"] }
    );
  
  const withdrawalRequests = response?.requests;

  const approveWithdrawalMutation = useApi("adminApproveWithdrawal");
  const rejectWithdrawalMutation = useApi("adminRejectWithdrawal");

  const handleApprove = async (transactionId: string) => {
    const result = await approveWithdrawalMutation.mutateAsync({ transactionId });
    if ((result as any)?.success) {
      toast({ title: "Success", description: "Withdrawal has been approved and is processing." });
      queryClient.invalidateQueries({ queryKey: ["adminGetWithdrawalQueue"] });
      queryClient.invalidateQueries({ queryKey: ["adminGetDashboardStats"] });
    }
  };

  const handleReject = async (transactionId: string) => {
    const result = await rejectWithdrawalMutation.mutateAsync({ transactionId, reason: "Admin rejection." });
     if ((result as any)?.success) {
      toast({ title: "Success", description: "Withdrawal has been rejected and refunded." });
      queryClient.invalidateQueries({ queryKey: ["adminGetWithdrawalQueue"] });
      queryClient.invalidateQueries({ queryKey: ["adminGetDashboardStats"] });
    }
  };

  const isProcessing = approveWithdrawalMutation.isPending || rejectWithdrawalMutation.isPending;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Withdrawal Approval Queue</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
          <CardDescription>Review and approve user withdrawal requests.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Requested At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-32" />
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right space-x-2">
                       <Skeleton className="h-9 w-20 inline-block" />
                       <Skeleton className="h-9 w-24 inline-block" />
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    <div className="flex flex-col items-center gap-2 text-destructive">
                      <ServerCrash className="h-8 w-8" />
                      <span className="font-semibold">Failed to load withdrawal queue.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : withdrawalRequests?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    There are no pending withdrawal requests.
                  </TableCell>
                </TableRow>
              ) : (
                withdrawalRequests?.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell>
                      <div className="font-medium">{req.userName}</div>
                      <div className="text-sm text-muted-foreground font-mono">{req.uid}</div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {req.currency} {req.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </TableCell>
                    <TableCell>{req.bankDetails.bankCode} | **** {req.bankDetails.accountNumber.slice(-4)}</TableCell>
                    <TableCell>{new Date(req.createdAt.seconds * 1000).toLocaleString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="destructive" onClick={() => handleReject(req.id)} disabled={isProcessing}>
                        {rejectWithdrawalMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Reject
                      </Button>
                      <Button size="sm" onClick={() => handleApprove(req.id)} disabled={isProcessing}>
                        {approveWithdrawalMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Approve
                      </Button>
                    </TableCell>
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
