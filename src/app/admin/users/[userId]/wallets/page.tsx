
"use client";

import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiQuery } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/skeleton';
import { ServerCrash } from 'lucide-react';

type WalletData = {
  balances: Record<string, number>;
};



export default function UserWalletsPage() {
    const params = useParams();
    const userId = params.userId as string;

     const { data: wallets, isLoading, error } = useApiQuery<WalletData>(
        'getWalletBalance',
        { uid: userId },
        { enabled: !!userId, queryKey: ['getWalletBalance', { uid: userId }] }
    );

    const walletData = wallets;
    const walletEntries = wallets ? Object.entries(wallets.balances || {}) : [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Wallets</CardTitle>
                <CardDescription>Real-time list of all currency wallets and their balances.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="divide-y divide-border rounded-md border">
                    {isLoading ? (
                        Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-3 items-center p-4">
                                <Skeleton className="h-5 w-12"/>
                                <Skeleton className="h-6 w-32"/>
                            </div>
                        ))
                    ) : error ? (
                        <div className="p-4 text-center text-destructive">
                             <ServerCrash className="h-8 w-8 mx-auto mb-2" />
                            Failed to load wallets.
                        </div>
                    ) : walletEntries.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                            Wallets have not been set up for this user.
                        </div>
                    ) : (
                        walletEntries.map(([currency, balance]) => (
                            <div key={currency} className="grid grid-cols-3 items-center p-4">
                                <div className="font-medium">{currency}</div>
                                <div>
                                    <p className="font-semibold text-lg">
                                        {new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2 }).format(balance)}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
