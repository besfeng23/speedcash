"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export function ComplianceTabs() {
  const pathname = usePathname();

  const tabs = [
    {
      name: 'KYC / KYB Queue',
      href: '/admin/compliance/kyc',
    },
    {
      name: 'Withdrawal Queue',
      href: '/admin/compliance/withdrawals',
    },
  ];

  return (
    <div className="px-4 sm:px-6">
      <Tabs value={pathname}>
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger key={tab.href} value={tab.href} asChild>
              <Link href={tab.href}>{tab.name}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
