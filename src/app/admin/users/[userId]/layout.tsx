
"use client";

import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApiQuery } from '@/hooks/useApi';

type UserProfile = {
  displayName: string;
  kycStatus: string;
}

export default function UserDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const userId = params.userId as string;
  
  const { data: user, isLoading, error } = useApiQuery<UserProfile>(
    'adminGetUser',
    { uid: userId },
    { enabled: !!userId, queryKey: ['adminGetUser', { uid: userId }] }
  );

  const tabs = [
    { name: 'Profile', href: `/admin/users/${userId}/profile` },
    { name: 'Wallets', href: `/admin/users/${userId}/wallets` },
    { name: 'Transactions', href: `/admin/users/${userId}/transactions` },
    { name: 'Admin Actions', href: `/admin/users/${userId}/actions` },
  ];
  
  // A simple way to determine the active tab based on the current path
  const currentTab = tabs.find(tab => pathname === tab.href)?.href || `/admin/users/${userId}/profile`;

  return (
    <div className="flex-1 space-y-6">
        <div className="flex items-center gap-4">
             <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                <Link href="/admin/users">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Link>
            </Button>
            {isLoading ? (
               <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
                <>
                    <h2 className="font-headline text-3xl font-bold tracking-tight">
                        {user?.displayName || 'User Details'}
                    </h2>
                    <Badge 
                        className="text-base"
                        variant={user?.kycStatus === 'VERIFIED' ? 'default' : 'secondary'}
                    >
                        {user?.kycStatus || 'N/A'}
                    </Badge>
                </>
            )}
        </div>

      <Tabs value={currentTab} className="w-full">
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.href} value={tab.href} asChild>
              <Link href={tab.href}>{tab.name}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      
      <div className="pt-4">
        {children}
      </div>
    </div>
  );
}
