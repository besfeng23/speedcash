
"use client";

import { ArrowLeft, Send, Plane, ArrowDownToLine, ArrowUpFromLine, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { useApiQuery } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

type Transaction = {
  id: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  timestamp: { seconds: number };
  userId: string;
  senderInfo?: { uid: string };
  receiverInfo?: { uid: string };
  details?: {
    senderName?: string;
    recipientName?: string;
    method?: string;
    bankDetails?: {
      bankCode?: string;
      accountName?: string;
    };
    [key: string]: unknown;
  };
};

const getTransactionIcon = (type: string) => {
    if (type.includes('transfer')) return Send;
    if (type.includes('remit')) return Plane;
    if (type.includes('cash_in')) return ArrowDownToLine;
    if (type.includes('cash_out') || type.includes('withdrawal')) return ArrowUpFromLine;
    return Send;
};

const formatTransactionTitle = (tx: Transaction, currentUid: string) => {
  const isSender = tx.senderInfo?.uid === currentUid;
  switch (tx.type) {
    case 'p2p_transfer':
      return isSender ? 'P2P Transfer to' : 'P2P Transfer from';
    case 'cash_in':
      return `Cash-In via ${tx.details?.method || 'source'}`;
    case 'cash_out':
      return `Withdrawal via ${tx.details?.bankDetails?.bankCode || 'bank'}`;
    case 'remittance':
      return 'Remittance to';
    default:
      return tx.type.replace(/_/g, ' ');
  }
};

const formatTransactionTarget = (tx: Transaction, currentUid: string): string => {
  const isSender = tx.senderInfo?.uid === currentUid;
   switch (tx.type) {
    case 'p2p_transfer':
      if (isSender) {
          return String(tx.details?.receiverName || `User ${tx.receiverInfo?.uid?.substring(0, 5)}...`)
      }
      return String(tx.details?.senderName || `User ${tx.senderInfo?.uid?.substring(0, 5)}...`)
    default:
      return String(tx.details?.recipientName || tx.details?.bankDetails?.accountName || 'External Account');
  }
};

const groupTransactionsByMonth = (transactions: Transaction[] | undefined) => {
  if (!transactions) return {};
  return transactions.reduce((acc, tx) => {
    const date = new Date(tx.timestamp.seconds * 1000);
    const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);
};

export default function HistoryPage() {
  const { user } = useAuth();
  
  const { data: transactions } = useApiQuery<{ transactions: Transaction[] }>(
    'getTransactionHistory',
    undefined,
    { enabled: !!user, queryKey: ['getTransactionHistory'] }
  );
  
  const groupedTransactions = groupTransactionsByMonth(transactions?.transactions);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-4 bg-background/80 px-4 py-3 backdrop-blur-sm sm:px-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/consumer">
            <ArrowLeft />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="font-headline text-xl font-bold text-foreground">Transaction History</h1>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 pt-2 md:p-6">
        <div className="space-y-6">
          {transactions?.transactions.length === 0 &&
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-6 w-40 mb-4" />
                <Card className="rounded-xl bg-card shadow-sm">
                  <CardContent className="p-0">
                    <div className="flow-root">
                      <ul role="list" className="divide-y divide-border">
                        {Array.from({ length: 3 }).map((_, j) => (
                          <li key={j} className="p-4">
                            <div className="flex items-center space-x-4">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <div className="min-w-0 flex-1 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/2" />
                              </div>
                              <Skeleton className="h-5 w-20" />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}

          {transactions?.transactions.length === 0 && (
             <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <h3 className="mt-4 text-lg font-semibold">No Transactions Yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Your recent activity will appear here.</p>
            </div>
          )}

          {transactions?.transactions && transactions.transactions.length > 0 && Object.keys(groupedTransactions).length === 0 && (
             <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <h3 className="mt-4 text-lg font-semibold">No Transactions Yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">Your recent activity will appear here.</p>
            </div>
          )}

          {transactions?.transactions && transactions.transactions.length > 0 &&
            Object.entries(groupedTransactions).map(([month, monthTransactions]) => (
              <div key={month}>
                <h3 className="text-lg font-semibold mb-4">{month}</h3>
                <div className="space-y-3">
                  {monthTransactions.map((tx) => {
                        const Icon = getTransactionIcon(tx.type);
                        const isSender = tx.senderInfo?.uid === user?.uid;
                        const amount = isSender ? -Math.abs(tx.amount) : Math.abs(tx.amount);

                        return (
                          <Card key={tx.id} className="rounded-xl bg-card shadow-sm">
                            <CardContent className="p-0">
                              <div className="flow-root">
                                <ul role="list" className="divide-y divide-border">
                                  <li key={tx.id} className="p-4 hover:bg-muted/50">
                                    <div className="flex items-center space-x-4">
                                      <div className="flex-shrink-0">
                                         <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                                          <Icon className={cn("h-5 w-5", amount > 0 ? "text-green-500" : "text-destructive")} />
                                        </div>
                                      </div>
                                      <div className="min-w-0 flex-1">
                                         <p className="font-body text-sm font-medium text-foreground truncate">{formatTransactionTitle(tx, user!.uid)} <span className="font-semibold">{formatTransactionTarget(tx, user!.uid)}</span></p>
                                         <p className="font-body text-sm text-muted-foreground truncate">{new Date(tx.timestamp.seconds * 1000).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                                      </div>
                                      <div>
                                         <p className={cn("font-headline text-base font-bold text-right", amount > 0 ? "text-green-600" : "text-destructive")}>
                                          {amount > 0 ? "+" : "-"} ₱{Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                      </div>
                                    </div>
                                  </li>
                                </ul>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
        </div>
      </main>
    </div>
  );
}
