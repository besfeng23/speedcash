
"use client";

import { Bell, UserCircle2, Loader2, ArrowUpFromLine, ArrowDownToLine, Send, Plane } from "lucide-react";
import BalanceCarousel from "@/components/balance-carousel";
import QuickActions from "@/components/quick-actions";
import ActivityFeed from "@/components/activity-feed";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { SuperAdminDashboard } from "@/components/super-admin-dashboard";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useApiQuery } from "@/hooks/useApi";

type Transaction = {
  id: string;
  type: string;
  amount: number;
  details?: any;
};

const getTransactionIcon = (type: string) => {
    if (type.includes('transfer')) return Send;
    if (type.includes('remit')) return Plane;
    if (type.includes('cash_in')) return ArrowDownToLine;
    if (type.includes('cash_out') || type.includes('withdrawal')) return ArrowUpFromLine;
    return UserCircle2;
};

const formatNotificationTitle = (tx: Transaction) => {
    switch (tx.type) {
        case 'p2p_transfer': return 'Payment Received';
        case 'cash_in': return 'Cash-In Successful';
        case 'cash_out': return 'Withdrawal Processed';
        case 'remittance': return 'Remittance Sent';
        default: return 'New Transaction';
    }
};

const formatNotificationDescription = (tx: Transaction) => {
    switch (tx.type) {
        case 'p2p_transfer': return `You received ₱${tx.amount.toFixed(2)} from ${tx.details?.senderName || 'another user'}.`;
        case 'cash_in': return `You have successfully cashed in ₱${tx.amount.toFixed(2)}.`;
        case 'cash_out': return `Your withdrawal of ₱${tx.amount.toFixed(2)} is complete.`;
        case 'remittance': return `Your remittance of ₱${tx.amount.toFixed(2)} has been sent.`;
        default: `Transaction ID: ${tx.id.substring(0, 7)}...`;
    }
    return `Transaction for ₱${tx.amount.toFixed(2)} completed.`;
}


export default function WalletDashboard() {
  const { user, role, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/login');
    }
  }, [user, isAuthLoading, router]);

  const { data: recentTransactions } = useApiQuery<{ transactions: Transaction[] }>(
    'getTransactionHistory',
    undefined,
    {
      enabled: !!user,
      select: (data: any) => ({ transactions: data.transactions.slice(0, 3) }),
      queryKey: ['getTransactionHistory', 'recent']
    }
  );

  const notifications = recentTransactions?.transactions || [];

  if (isAuthLoading || !user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your wallet...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-background/80 px-4 py-3 backdrop-blur-sm sm:px-6">
        <Link href="/profile" className="flex items-center gap-3 group">
          <UserCircle2 className="h-9 w-9 text-muted-foreground group-hover:text-primary transition-colors" />
          <div>
            <p className="font-body text-xs text-muted-foreground">Welcome back,</p>
            <p className="font-headline text-lg font-semibold text-foreground leading-tight">{user?.displayName || 'User'}</p>
          </div>
        </Link>
        <Popover>
          <PopoverTrigger asChild>
             <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-6 w-6" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
             <div className="p-4">
              <h3 className="text-lg font-medium">Notifications</h3>
              <p className="text-sm text-muted-foreground">You have {notifications.length} new notifications.</p>
            </div>
            <div className="grid gap-1">
              {notifications.length > 0 ? notifications.map((tx: any) => {
                const Icon = getTransactionIcon(tx.type);
                return (
                 <div
                  key={tx.id}
                  className="grid grid-cols-[25px_1fr] items-start p-4 last:mb-0 last:pb-0"
                >
                  <Icon className="h-5 w-5 translate-y-1 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {formatNotificationTitle(tx)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatNotificationDescription(tx)}
                    </p>
                  </div>
                </div>
              )}) : (
                <p className="p-4 text-sm text-center text-muted-foreground">No new notifications.</p>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </header>
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 space-y-8">
          {role === 'superadmin' && <SuperAdminDashboard />}
          <BalanceCarousel />
          <QuickActions />
          <ActivityFeed />
        </div>
      </main>
    </div>
  );
}
