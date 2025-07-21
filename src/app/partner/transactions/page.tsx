
"use client";

import { useState } from "react";
import { FileDown, ServerCrash, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useApiQuery } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

type Transaction = {
  id: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  senderInfo?: { uid: string };
  timestamp: { seconds: number };
};

export default function PartnerTransactionsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: response, isLoading, error } = useApiQuery<{ transactions: Transaction[] }>(
    'getTransactionHistory',
    { uid: user?.uid },
    { enabled: !!user, queryKey: ['transactionHistory', user?.uid] }
  );

  const transactions = response?.transactions || [];

  const filteredTransactions = transactions.filter(tx =>
    tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.senderInfo?.uid?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadCSV = () => {
    const headers = ["Transaction ID", "Type", "Status", "Amount", "Currency", "From User", "Date"];
    const rows = filteredTransactions.map(tx => [
      `"${tx.id}"`,
      `"${tx.type}"`,
      `"${tx.status}"`,
      tx.amount,
      `"${tx.currency}"`,
      `"${tx.senderInfo?.uid || 'N/A'}"`,
      `"${new Date(tx.timestamp.seconds * 1000).toISOString()}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cpay_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Transactions</h2>
        <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={downloadCSV} disabled={filteredTransactions.length === 0}>
                <FileDown className="mr-2 h-4 w-4" />
                Export CSV
            </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Incoming Transactions</CardTitle>
          <CardDescription>A ledger of all payments received by your business.</CardDescription>
          <div className="pt-4 relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none"/>
             <Input 
                placeholder="Search by Transaction or User ID..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                <TableHead>From User</TableHead>
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
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    <div className="flex flex-col items-center gap-2 text-destructive">
                      <ServerCrash className="h-8 w-8" />
                      <span className="font-semibold">Failed to load transactions.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    {searchTerm ? "No transactions match your search." : "You have not received any transactions yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{tx.type.replace(/_/g, ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{tx.status}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {tx.currency} {tx.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{tx.senderInfo?.uid}</TableCell>
                    <TableCell>{new Date(tx.timestamp.seconds * 1000).toLocaleString()}</TableCell>
                  </TableRow>
              )))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
