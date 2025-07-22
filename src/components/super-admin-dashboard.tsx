
"use client";

import { FileCheck2, UserPlus, Hourglass, BarChart, Loader2, Banknote, ShieldAlert } from 'lucide-react';
import KpiCard from '@/components/kpi-card';
import { useApi, useApiQuery } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import Link from 'next/link';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';

// This data is mocked for now, but would come from an admin activity log function
const recentActivities = [
    { admin: 'Jane Doe', action: 'Approved withdrawal #12345', timestamp: '5m ago', variant: 'default' },
    { admin: 'John Smith', action: 'Suspended user #67890', timestamp: '1h ago', variant: 'destructive' },
    { admin: 'Jane Doe', action: 'Approved KYC for user #11223', timestamp: '3h ago', variant: 'default' },
];

export function SuperAdminDashboard() {
  const { data: stats, isLoading } = useApiQuery<{
    pendingKycCount?: number;
    pendingWithdrawalCount?: number;
    newUsersToday?: number;
    totalVolumeToday?: number;
  }>(
      'adminGetDashboardStats', 
      undefined,
      { staleTime: 300000, queryKey: ['adminGetDashboardStats'] } // Cache for 5 minutes
  );
  
  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center mb-2 px-1">
            <h2 className="font-headline text-lg font-semibold text-foreground">Mission Control</h2>
            <Link href="/admin" className='text-sm text-primary hover:underline font-semibold'>Go to Full Panel</Link>
        </div>
        
        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {isLoading ? (
            <>
                <KpiCard title="Pending KYC" value={<Skeleton className="h-8 w-16" />} icon={FileCheck2} />
                <KpiCard title="Pending Withdrawals" value={<Skeleton className="h-8 w-16" />} icon={Hourglass} />
                <KpiCard title="New Users (24h)" value={<Skeleton className="h-8 w-16" />} icon={UserPlus} />
                <KpiCard title="Txn Volume (24h)" value={<Skeleton className="h-8 w-16" />} icon={BarChart} />
            </>
            ) : (
            <>
                <KpiCard title="Pending KYC" value={stats?.pendingKycCount ?? 0} icon={FileCheck2} />
                <KpiCard title="Pending Withdrawals" value={stats?.pendingWithdrawalCount ?? 0} icon={Hourglass} />
                <KpiCard title="New Users (24h)" value={`+${stats?.newUsersToday ?? 0}`} icon={UserPlus} />
                <KpiCard title="Txn Volume (24h)" value={`₱${(stats?.totalVolumeToday ?? 0).toLocaleString()}`} icon={BarChart} />
            </>
            )}
        </div>

        {/* Actionable Queues & Activity Log */}
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
                        {recentActivities.map((activity, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium">{activity.admin}</TableCell>
                            <TableCell>
                            <Badge variant={(activity.variant as 'default' | 'secondary' | 'destructive' | 'outline') || 'default'}>{activity.action}</Badge>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">{activity.timestamp}</TableCell>
                        </TableRow>
                        ))}
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
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-4">
                            <FileCheck2 className="w-6 h-6 text-primary"/>
                            <div>
                                <p className="font-semibold text-foreground">KYC/KYB Review</p>
                                <p className="text-sm text-muted-foreground">{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : `${stats?.pendingKycCount ?? 0} pending`}</p>
                            </div>
                        </div>
                        <Button size="sm" asChild><Link href="/admin/compliance/kyc">Review</Link></Button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-4">
                            <Banknote className="w-6 h-6 text-green-600"/>
                            <div>
                                <p className="font-semibold text-foreground">Withdrawal Requests</p>
                                <p className="text-sm text-muted-foreground">{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : `${stats?.pendingWithdrawalCount ?? 0} pending`}</p>
                            </div>
                        </div>
                        <Button size="sm" asChild><Link href="/admin/compliance/withdrawals">Approve</Link></Button>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-4">
                            <ShieldAlert className="w-6 h-6 text-destructive"/>
                            <div>
                                <p className="font-semibold text-foreground">Fraud Alerts</p>
                                <p className="text-sm text-muted-foreground">1 new</p>
                            </div>
                        </div>
                        <Button size="sm" variant="destructive">Investigate</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
