
"use client";

import { Banknote, BarChart, CalendarDays, Download, ServerCrash } from 'lucide-react';
import KpiCard from '@/components/kpi-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useApiQuery } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig = {
  volume: {
    label: 'Volume (PHP)',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

type Transaction = {
    id: string;
    amount: number;
    currency: string;
    timestamp: { seconds: number };
    status: string;
};

type PartnerStats = {
    availableBalance: number;
    volume24h: number;
    dailyVolumeLast7Days: { date: string, volume: number }[];
};

export default function PartnerDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: isStatsLoading } = useApiQuery<PartnerStats>(
    'partnerGetDashboardStats',
    undefined,
    { enabled: !!user, queryKey: ['partnerGetDashboardStats'] }
  );

  const { data: transactionResponse, isLoading: isPayoutsLoading, error: payoutsError } = useApiQuery<{ transactions: Transaction[] }>(
    'partnerGetDashboardStats',
    undefined,
    { 
      enabled: !!user, 
      select: (data: any) => ({ transactions: data.transactions.slice(0, 4) }),
      queryKey: ['partnerGetDashboardStats', 'recent']
    }
  );

  const recentPayouts = transactionResponse?.transactions || [];
  
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
      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <CalendarDays className="mr-2 h-4 w-4" />
            Last 30 days
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

       <div className="grid gap-4 md:grid-cols-2">
        {isStatsLoading ? (
            <>
                <KpiCard title="Available for Payout" value={<Skeleton className="h-8 w-40" />} icon={Banknote} details={<Skeleton className="h-4 w-32" />} />
                <KpiCard title="Incoming Volume (24h)" value={<Skeleton className="h-8 w-40" />} icon={BarChart} details={<Skeleton className="h-4 w-40" />} />
            </>
        ) : (
             <>
                <KpiCard title="Available for Payout" value={`₱${(stats?.availableBalance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={Banknote} details="Current CPay balance" />
                <KpiCard title="Incoming Volume (24h)" value={`₱${(stats?.volume24h ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={BarChart} details="vs. previous 24h" />
            </>
        )}
       
      </div>
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle className="font-headline text-xl">Incoming Payment Volume</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
                <div className="h-[250px] w-full flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                </div>
            ) : (
                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <RechartsBarChart accessibilityLayer data={stats?.dailyVolumeLast7Days}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                    dataKey="date"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => new Date(value).toLocaleDateString("en-US", { day: 'numeric', month: 'short' })}
                    />
                    <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => `₱${Number(value) / 1000}k`}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="volume" fill="var(--color-volume)" radius={4} />
                </RechartsBarChart>
                </ChartContainer>
            )}
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2 rounded-xl shadow-sm">
           <CardHeader>
            <CardTitle className="font-headline text-xl">Recent Payouts</CardTitle>
            <CardDescription>Latest settlement requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Payout ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isPayoutsLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        </TableRow>
                      ))
                    ) : payoutsError ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                          <div className="flex flex-col items-center gap-2 text-destructive">
                            <ServerCrash className="h-6 w-6" />
                            <span className="font-semibold text-sm">Could not load payouts.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : recentPayouts.length === 0 ? (
                       <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                          No recent payouts found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentPayouts.map((payout: any) => (
                        <TableRow key={payout.id}>
                            <TableCell className="font-mono text-xs font-medium">{payout.id.substring(0, 10)}...</TableCell>
                            <TableCell>{payout.currency} {payout.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusVariant(payout.status)}>{payout.status.replace('_', ' ')}</Badge>
                            </TableCell>
                        </TableRow>
                      ))
                    )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
