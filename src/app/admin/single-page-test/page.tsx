
"use client";

import { useAuth } from "@/hooks/useAuth";
import ProfilePage from "@/app/profile/page";
import AdminDashboard from "@/app/admin/overview/page";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ShieldAlert } from "lucide-react";

/**
 * This page is a workaround for a Firebase Studio preview limitation where
 * auth state is not persisted across page navigations.
 *
 * It renders both the Profile and Admin Dashboard components on a single
 * page to allow for testing of role-based UI without triggering a
 * context-destroying navigation.
 */
export default function SinglePageAdminTest() {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Auth State...</p>
      </div>
    );
  }

  const isAdmin = role === 'admin' || role === 'superadmin';

  return (
    <div className="flex flex-col gap-8 p-4">
      <Alert variant={isAdmin ? "default" : "destructive"}>
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Single-Page Test View</AlertTitle>
        <AlertDescription>
          This view combines multiple pages to test role-based UI. Your current role is: <strong>{role || 'Not Authenticated'}</strong>.
          {isAdmin ? " You should see the admin panel link on the profile card and the full admin dashboard below." : " You should NOT see the admin panel link or the dashboard."}
        </AlertDescription>
      </Alert>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">1. Profile Component Preview</h2>
        {/* We need to wrap ProfilePage in a div to avoid layout issues since it's a full-page component */}
        <div className="relative h-[800px] overflow-y-auto border rounded-lg">
           <ProfilePage />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">2. Admin Dashboard Preview</h2>
        {isAdmin ? (
          <AdminDashboard />
        ) : (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>
              The admin dashboard is not rendered because your role is not 'admin' or 'superadmin'.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
