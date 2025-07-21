
"use client";

import { useState } from "react";
import { MoreHorizontal, FileDown, ServerCrash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useApiQuery } from "@/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";

type Transaction = {
  id: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  senderInfo?: { uid: string };
  receiverInfo?: { uid: string };
  timestamp: { seconds: number };
};

export default function TransactionManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: transactions } = useApiQuery<{ transactions: Transaction[] }>(
    'adminGetTransactions',
    undefined,
    { enabled: true, queryKey: ['adminGetTransactions'] }
  );

  const allTransactions = transactions?.transactions || [];

  const filteredTransactions = allTransactions.filter(tx => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      return (
        tx.id.toLowerCase().includes(lowerSearchTerm) ||
        tx.senderInfo?.uid?.toLowerCase().includes(lowerSearchTerm) ||
        tx.receiverInfo?.uid?.toLowerCase().includes(lowerSearchTerm)
      );
  });

  const getStatusVariant = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes('completed') || lowerStatus.includes('success')) return 'default';
    if (lowerStatus.includes('pending') || lowerStatus.includes('processing')) return 'secondary';
    if (lowerStatus.includes('rejected') || lowerStatus.includes('failed')) return 'destructive';
    return 'outline';
  };

  const getTransactionDirection = (tx: Transaction) => {
    switch(tx.type) {
      case 'cash_in': return `from External Source to ${tx.receiverInfo?.uid?.substring(0, 7)}...`;
      case 'cash_out': return `from ${tx.senderInfo?.uid?.substring(0, 7)}... to External`;
      case 'p2p_transfer': return `from ${tx.senderInfo?.uid?.substring(0, 7)}... to ${tx.receiverInfo?.uid?.substring(0, 7)}...`;
      case 'remittance': return `from ${tx.senderInfo?.uid?.substring(0, 7)}... to External`;
      default: return 'N/A';
    }
  };

  const downloadCSV = () => {
    const headers = ["Transaction ID", "Type", "Status", "Amount", "Currency", "From User", "To User", "Date"];
    const rows = filteredTransactions.map((tx: any) => [
      `"${tx.id}"`,
      `"${tx.type}"`,
      `"${tx.status}"`,
      tx.amount,
      `"${tx.currency}"`,
      `"${tx.senderInfo?.uid || 'N/A'}"`,
      `"${tx.receiverInfo?.uid || 'N/A'}"`,
      `"${new Date(tx.timestamp.seconds * 1000).toISOString()}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cpay_transactions_all_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Financial Oversight</h2>
        <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={downloadCSV} disabled={transactions?.transactions.length === 0}>
                <FileDown className="mr-2 h-4 w-4" />
                Export
            </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>A complete ledger of every transaction on the platform.</CardDescription>
          <div className="pt-4">
             <Input 
                placeholder="Search by Transaction ID, User ID, etc..." 
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
                <TableHead>From / To</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No transactions found{searchTerm && ' for your search'}.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{tx.type.replace(/_/g, ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant={getStatusVariant(tx.status)}>{tx.status}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{tx.currency} {tx.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {getTransactionDirection(tx)}
                    </TableCell>
                    <TableCell>{new Date(tx.timestamp.seconds * 1000).toLocaleString()}</TableCell>
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
