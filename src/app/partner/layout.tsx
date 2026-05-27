'use client';

import PartnerSidebarNav from "@/components/partner/sidebar-nav";
import { MobileHeader } from "@/components/mobile-header";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();
  const isAuthorizedPartner = role === 'partner' || role === 'admin' || role === 'superadmin';

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
      return;
    }

    if (!isLoading && user && !isAuthorizedPartner) {
      router.replace('/login');
    }
  }, [user, role, isLoading, isAuthorizedPartner, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorizedPartner) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <PartnerSidebarNav />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <MobileHeader>
          <PartnerSidebarNav isMobile />
        </MobileHeader>
        <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}
