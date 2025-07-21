
"use client";

import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApiQuery } from '@/hooks/useApi';

type Partner = {
  id: string;
  businessName: string;
  status: 'Active' | 'Pending Review' | 'Rejected';
}

export default function PartnerDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const partnerId = params.partnerId as string;

  const { data: partner, isLoading, error } = useApiQuery<Partner>(
    'adminGetPartner',
    { partnerId },
    { enabled: !!partnerId, queryKey: ['adminGetPartner', partnerId] }
  );
  
  if (error) {
      return <div>Partner not found or an error occurred.</div>;
  }

  const tabs = [
    { name: 'API Access', href: `/admin/partners/${partnerId}/api` },
    { name: 'KYC Dashboard', href: `/admin/partners/${partnerId}/kyc` },
    { name: 'Payouts', href: `/admin/partners/${partnerId}/payouts` },
    { name: 'Activity Logs', href: `/admin/partners/${partnerId}/activity` },
  ];
  
  const currentTab = tabs.find(tab => pathname === tab.href)?.href || tabs[0].href;

  return (
    <div className="flex-1 space-y-6">
        <div className="flex items-center gap-4">
             <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                <Link href="/admin/partners">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Link>
            </Button>
            {isLoading || !partner ? (
                <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
                <>
                    <h2 className="font-headline text-3xl font-bold tracking-tight">
                        {partner.businessName}
                    </h2>
                    <Badge 
                        className="text-base"
                        variant={partner.status === 'Active' ? 'default' : partner.status === 'Pending Review' ? 'secondary' : 'destructive'}
                    >
                        {partner.status}
                    </Badge>
                </>
            )}
        </div>

      <Tabs value={currentTab}>
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
