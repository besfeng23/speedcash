
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownToLine, ArrowUpFromLine, Plane, Send, ServerCrash } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApiQuery } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import Link from "next/link";

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
  details?: any;
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
      return `Withdrawal to ${tx.details?.bankDetails?.bankCode || 'bank'}`;
    case 'remittance':
      return 'Remittance to';
    default:
      return tx.type.replace(/_/g, ' ');
  }
};

const formatTransactionTarget = (tx: Transaction, currentUid: string) => {
    const isSender = tx.senderInfo?.uid === currentUid;
    switch (tx.type) {
     case 'p2p_transfer':
       if (isSender) {
           return tx.details?.receiverName ? tx.details.receiverName : `User ${tx.receiverInfo?.uid?.substring(0, 5)}...`
       }
       return tx.details?.senderName ? tx.details.senderName : `User ${tx.senderInfo?.uid?.substring(0, 5)}...`
     default:
       return tx.details?.recipientName || tx.details?.bankDetails?.accountName || 'External Account';
   }
};

export default function ActivityFeed() {
  const { user } = useAuth();
  
  const { data: transactionResponse, isLoading, error } = useApiQuery<{ transactions: Transaction[] }>(
    'getTransactionHistory',
    { uid: user?.uid },
    { enabled: !!user, queryKey: ['transactionHistory', user?.uid] }
  );
  
  const transactions = Array.isArray(transactionResponse?.transactions) 
    ? transactionResponse.transactions.slice(0, 4) 
    : [];
  
  return (
    <div>
      <div className="flex justify-between items-center mb-2 px-1">
        <h2 className="font-headline text-lg font-semibold text-foreground">Recent Activity</h2>
        <Button variant="link" asChild><Link href="/history">View All</Link></Button>
      </div>
      <Card className="rounded-xl shadow-sm">
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
          {isLoading && transactions.length === 0 && Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-5 w-20" />
            </li>
          ))}

          {error && (
            <li className="p-4">
              <div className="flex flex-col items-center justify-center text-center">
                  <ServerCrash className="h-10 w-10 text-destructive mb-2"/>
                  <p className="text-sm font-medium">Could not load activity</p>
                  <p className="text-xs text-muted-foreground">{error.message}</p>
              </div>
            </li>
          )}

          {!isLoading && transactions.length > 0 && transactions.map((tx) => {
              const Icon = getTransactionIcon(tx.type);
              const isSender = tx.senderInfo?.uid === user?.uid;
              const amount = isSender ? -Math.abs(tx.amount) : Math.abs(tx.amount);

              return (
                <li key={tx.id} className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                    <Icon className={cn("h-5 w-5", amount > 0 ? "text-green-500" : "text-destructive")} />
                  </div>
                  <div className="flex-1">
                    <p className="font-body text-sm font-medium text-foreground">{formatTransactionTitle(tx, user!.uid)} <span className="font-semibold">{formatTransactionTarget(tx, user!.uid)}</span></p>
                    <p className="font-body text-xs text-muted-foreground">{new Date(tx.timestamp.seconds * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-headline text-base font-bold", amount > 0 ? "text-green-600" : "text-destructive")}>
                      {amount > 0 ? "+" : "-"} ₱{Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </li>
              )
          })}

          {!isLoading && transactions.length === 0 && !error && (
             <li className="p-4">
                <div className="text-center text-sm text-muted-foreground py-8">
                  No recent activity yet.
                </div>
            </li>
          )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
