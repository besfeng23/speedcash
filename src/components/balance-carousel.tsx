
"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useApiQuery } from '@/hooks/useApi';
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";

type WalletData = {
  balances: Record<string, number>;
  walletNotSetUp: boolean;
}

const walletSkins = [
  {
    currency: "PHP",
    flag: "/flags/ph.svg",
    gradient: "from-blue-600 to-sky-500",
    textColor: "text-white",
  },
  {
    currency: "KRW",
    flag: "/flags/kr.svg",
    gradient: "from-red-600 to-rose-500",
    textColor: "text-white",
  },
];

export default function BalanceCarousel() {
  const { user } = useAuth();
  
  const { data: walletData, isLoading } = useApiQuery<WalletData>(
    'getWalletBalance',
    { uid: user?.uid },
    { enabled: !!user, queryKey: ['walletBalances', user?.uid] }
  );
  
  if (isLoading && !walletData) {
    return (
      <Card className="overflow-hidden rounded-2xl border-0 shadow-lg bg-muted aspect-[1.8/1] md:aspect-auto md:h-[220px]">
        <CardContent className="relative flex flex-col justify-between p-6 h-full">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-8 rounded-sm" />
          </div>
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-48" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const balances = walletData?.balances ?? { PHP: 0, KRW: 0 };
  const wallets = walletSkins.map(skin => ({
    ...skin,
    balance: balances?.[skin.currency] ?? 0,
  }));

  if (walletData?.walletNotSetUp && !isLoading) {
    return (
       <Card className="overflow-hidden rounded-2xl border-0 shadow-lg bg-muted">
        <CardContent className="relative flex aspect-[1.8/1] md:aspect-auto md:h-[220px] flex-col items-center justify-center p-6 text-center">
            <p className="font-semibold">Wallet not set up</p>
            <p className="text-sm text-muted-foreground">Make your first cash-in to activate your wallet.</p>
        </CardContent>
      </Card>
    )
  }


  return (
    <Carousel className="w-full" opts={{ align: "start", loop: wallets.length > 1 }}>
      <CarouselContent className="-ml-4">
        {wallets.map((wallet, index) => (
          <CarouselItem key={index} className="pl-4">
            <Card className={cn("overflow-hidden rounded-2xl border-0 shadow-lg bg-gradient-to-br", wallet.gradient)}>
              <CardContent className={cn("relative flex aspect-[1.8/1] md:aspect-auto md:h-[220px] flex-col justify-between p-6", wallet.textColor)}>
                 <div className="absolute inset-0 bg-[url('/pattern.svg')] bg-cover opacity-10"></div>
                 <div className="absolute inset-[1px] rounded-2xl shadow-[inset_0_2px_8px_rgba(255,255,255,0.2)]"></div>

                <div className="flex items-center justify-between z-10">
                  <span className="font-headline text-xl font-semibold">{wallet.currency} Wallet</span>
                   <div className="relative h-6 w-8 overflow-hidden rounded-sm">
                      <Image src={`https://placehold.co/32x24.png`} alt={`${wallet.currency} flag`} fill className="object-cover" data-ai-hint={`${wallet.currency} flag`}/>
                   </div>
                </div>
                <div className="z-10">
                  <p className="font-body text-sm opacity-80">Total Balance</p>
                  <p className="font-headline text-4xl font-bold tracking-tight">
                    {wallet.currency === 'PHP' ? '₱' : '₩'}{wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
