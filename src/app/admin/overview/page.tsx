
"use client";

import { FileCheck2, UserPlus, Hourglass, BarChart, Loader2, Banknote, ShieldAlert, ServerCrash } from 'lucide-react';
import KpiCard from '@/components/kpi-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useApiQuery } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

type ActivityLog = {
    id: string;
    adminName: string;
    details: {
        action: string;
        [key: string]: any;
    };
    timestamp: {
        seconds: number;
        nanoseconds: number;
    };
};

const formatAction = (log: ActivityLog) => {
    const { action, transactionId, targetUid, newStatus, targetUser } = log.details;
    switch (action) {
        case 'APPROVE_WITHDRAWAL':
            return `Approved withdrawal for txn #${(transactionId || '').substring(0, 7)}...`;
        case 'REJECT_WITHDRAWAL':
            return `Rejected withdrawal for txn #${(transactionId || '').substring(0, 7)}...`;
        case 'SUSPEND_USER':
            return `Suspended user ${(targetUid || '').substring(0,7)}...`;
        case 'UNSUSPEND_USER':
            return `Unsuspended user ${(targetUid || '').substring(0,7)}...`;
        case 'UPDATE_KYC_STATUS':
             return `Set KYC for ${(targetUser || '').substring(0,7)}... to ${newStatus}`;
        default:
            return action.replace(/_/g, ' ');
    }
}

const getActionVariant = (action: string): 'default' | 'destructive' | 'secondary' => {
    if (action.includes('SUSPEND') || action.includes('REJECT') || action.includes('DELETE')) return 'destructive';
    if (action.includes('APPROVE') || action.includes('UPDATE_KYC_STATUS')) return 'default';
    return 'secondary';
}

function ActionableQueueCard({ title, value, icon: Icon, href, isLoading }: { title: string, value: number, icon: React.ElementType, href: string, isLoading: boolean}) {
    return (
        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-4">
                <Icon className="w-6 h-6 text-primary"/>
                <div>
                    <p className="font-semibold text-foreground">{title}</p>
                    <p className="text-sm text-muted-foreground">{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : `${value} pending`}</p>
                </div>
            </div>
            <Button size="sm" asChild><Link href={href}>Review</Link></Button>
        </div>
    )
}


export default function AdminDashboard() {
  const { data: dashboardStats, isLoading: statsLoading } = useApiQuery<any>(
    'adminGetDashboardStats',
    undefined,
    { enabled: true, queryKey: ['adminGetDashboardStats'] }
  );

  const { data: activityLogs } = useApiQuery<{ logs: ActivityLog[] }>(
    'adminGetActivityLogs',
    undefined,
    { enabled: true, queryKey: ['adminGetActivityLogs'] }
  );

  
  return (
    <div className="flex-1 space-y-6">
       <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Mission Control</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          <>
            <KpiCard title="Pending KYC Submissions" value={<Skeleton className="h-8 w-16" />} icon={FileCheck2} details={<Skeleton className="h-4 w-40" />} />
            <KpiCard title="Pending Withdrawals" value={<Skeleton className="h-8 w-16" />} icon={Hourglass} details={<Skeleton className="h-4 w-32" />} />
            <KpiCard title="New Users (24h)" value={<Skeleton className="h-8 w-16" />} icon={UserPlus} details={<Skeleton className="h-4 w-40" />} />
            <KpiCard title="Total Txn Volume (24h)" value={<Skeleton className="h-8 w-16" />} icon={BarChart} details={<Skeleton className="h-4 w-32" />} />
          </>
        ) : (
          <>
            <KpiCard title="Pending KYC Submissions" value={dashboardStats?.pendingKyc ?? 0} icon={FileCheck2} details="Actionable queue for compliance" />
            <KpiCard title="Pending Withdrawals" value={dashboardStats?.pendingWithdrawals ?? 0} icon={Hourglass} details="Awaiting approval" />
            <KpiCard title="New Users (24h)" value={`+${dashboardStats?.newUsers24h ?? 0}`} icon={UserPlus} details="Platform growth indicator" />
            <KpiCard title="Total Txn Volume (24h)" value={`₱${(dashboardStats?.totalTxnVolume24h ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={BarChart} details="Overall platform health" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Recent Admin Activity</CardTitle>
            <CardDescription>Oversight and accountability at a glance.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Administrator</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statsLoading ? (
                     Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-24"/></TableCell>
                            <TableCell><Skeleton className="h-6 w-48 rounded-full"/></TableCell>
                            <TableCell className="text-right"><Skeleton className="h-4 w-16 inline-block"/></TableCell>
                        </TableRow>
                     ))
                ) : activityLogs?.logs?.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                            No admin activity recorded yet.
                        </TableCell>
                    </TableRow>
                ) : (
                    activityLogs?.logs?.map((log: ActivityLog) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">{log.adminName}</TableCell>
                        <TableCell>
                          <Badge variant={getActionVariant(log.details.action)}>{formatAction(log)}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                            {formatDistanceToNow(new Date(log.timestamp.seconds * 1000), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card className="rounded-xl shadow-sm">
            <CardHeader>
                <CardTitle className="font-headline text-xl">Actionable Queues</CardTitle>
                <CardDescription>Tasks requiring immediate attention.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <ActionableQueueCard title="KYC/KYB Review" value={dashboardStats?.pendingKyc ?? 0} icon={FileCheck2} href="/admin/compliance/kyc" isLoading={statsLoading} />
                <ActionableQueueCard title="Withdrawal Requests" value={dashboardStats?.pendingWithdrawals ?? 0} icon={Banknote} href="/admin/compliance/withdrawals" isLoading={statsLoading} />
                 <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-4">
                        <ShieldAlert className="w-6 h-6 text-destructive"/>
                        <div>
                            <p className="font-semibold text-foreground">Fraud Alerts</p>
                            <p className="text-sm text-muted-foreground">0 new</p>
                        </div>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                        <Link href="/admin/transactions">Investigate</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
