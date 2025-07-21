
"use client";

import AdminSidebarNav from "@/components/admin/sidebar-nav";
import { ComplianceTabs } from "@/components/admin/compliance-tabs";
import { usePathname, useRouter } from "next/navigation";
import { MobileHeader } from "@/components/mobile-header";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { role, isLoading } = useAuth();
  const router = useRouter();

  // This effect handles the redirection after the auth check is complete.
  useEffect(() => {
    // If auth is done loading and the user is not an admin/superadmin, redirect.
    if (!isLoading && role !== 'admin' && role !== 'superadmin') {
      router.replace('/login');
    }
  }, [role, isLoading, router]);

  // While loading, show a full-screen loader to prevent any content flash.
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If the user is not authorized, return null to render nothing while the
  // redirect in useEffect completes. This is the key to preventing content flash.
  if (role !== 'admin' && role !== 'superadmin') {
    return null;
  }
  
  // Only render the admin layout if the user is authorized.
  const showComplianceTabs = pathname.startsWith('/admin/compliance');
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AdminSidebarNav />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <MobileHeader>
          <AdminSidebarNav isMobile />
        </MobileHeader>
        {showComplianceTabs && <ComplianceTabs />}
        <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}
