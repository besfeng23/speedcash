
"use client";

import { useParams } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useApiQuery } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/skeleton';
import { ServerCrash } from 'lucide-react';

type Transaction = {
  id: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  timestamp: { seconds: number };
  details?: {
    senderName?: string;
    recipientName?: string;
    [key: string]: unknown;
  };
};



export default function UserTransactionsPage() {
  const params = useParams();
  const userId = params.userId as string;

  const { data: transactionsData, isLoading, error } = useApiQuery<{ transactions: Transaction[] }>(
    'adminGetUserTransactions',
    { uid: userId },
    { enabled: !!userId, queryKey: ['adminGetUserTransactions', { uid: userId }] }
  );

  const transactions = transactionsData?.transactions || [];

  const getStatusVariant = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('completed') || lowerStatus.includes('success')) {
      return 'default';
    }
    if (lowerStatus.includes('pending')) {
      return 'secondary';
    }
    if (lowerStatus.includes('rejected') || lowerStatus.includes('failed')) {
      return 'destructive';
    }
    return 'outline';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>A complete ledger of this user&apos;s transactions.</CardDescription>
         <div className="pt-4">
             <Input placeholder="Search by Transaction ID or type..." />
          </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    </TableRow>
                ))
            ) : error ? (
                 <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    <div className="flex flex-col items-center gap-2 text-destructive">
                      <ServerCrash className="h-8 w-8" />
                      <span className="font-semibold">Failed to load transactions.</span>
                    </div>
                  </TableCell>
                </TableRow>
            ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    This user has no transactions.
                  </TableCell>
                </TableRow>
            ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                    <TableCell><Badge variant="outline">{tx.type.replace(/_/g, ' ')}</Badge></TableCell>
                    <TableCell>
                        <Badge variant={getStatusVariant(tx.status)}>{tx.status}</Badge>
                    </TableCell>
                    <TableCell className={`font-medium`}>
                        {tx.currency} {tx.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </TableCell>
                    <TableCell>{new Date(tx.timestamp.seconds * 1000).toLocaleString()}</TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
