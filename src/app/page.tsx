
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, CircleDollarSign, Shield, User, Building, Loader2, Star } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function LandingPage() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  const userRole = user?.email ? 'user' : 'guest'; // Simplified role detection
  const isAdmin = role === 'admin' || role === 'superadmin';

  useEffect(() => {
    // Auto-redirect logged-in non-admin users to their dashboard
    if (!isLoading && user && !isAdmin) {
      router.push('/consumer');
    }
  }, [user, isLoading, isAdmin, router]);

  // Show a loading screen while auth state is being determined or if user is being redirected
  if (isLoading || (!isLoading && user && !isAdmin)) {
    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-background">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading your session...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-white">
        <div className="container flex h-24 max-w-screen-2xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/CPayWallet_blue.png" alt="CPay Logo" width={220} height={56} data-ai-hint="logo cpay" />
          </Link>
          <div className="flex items-center gap-2">
            {!user ? (
                <>
                    <Button variant="ghost" asChild>
                        <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/signup">Sign Up</Link>
                    </Button>
                </>
            ) : isAdmin ? (
                 <Button asChild>
                    <Link href="/admin">
                        <Star className="mr-2"/>
                        Go to Mission Control
                    </Link>
                </Button>
            ) : null }
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <section className="relative w-full py-20 md:py-32 lg:py-40">
           <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent -z-10"></div>
            <div className="container text-center">
                <h1 className="font-headline text-4xl font-extrabold tracking-tight lg:text-5xl">
                    The Future of Digital Payments is Here
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                    CPay provides a seamless, secure, and global financial platform for individuals, partners, and administrators.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                    <Button size="lg" asChild>
                        <Link href="/signup">Get Started <ArrowRight className="ml-2"/></Link>
                    </Button>
                    <Button size="lg" variant="outline">
                        Contact Sales
                    </Button>
                </div>
            </div>
        </section>

        <section className="container py-16">
            <div className="grid gap-8 md:grid-cols-3">
                 <Card className="flex flex-col items-center justify-center p-8 text-center rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                           <User className="h-8 w-8 text-primary"/>
                        </div>
                        <CardTitle className="font-headline text-2xl">Consumer Portal</CardTitle>
                        <CardDescription>Your personal wallet for everyday transactions and international remittance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/login">Access Wallet <ArrowRight className="ml-2"/></Link>
                        </Button>
                    </CardContent>
                </Card>

                 <Card className="flex flex-col items-center justify-center p-8 text-center rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                           <Building className="h-8 w-8 text-primary"/>
                        </div>
                        <CardTitle className="font-headline text-2xl">Partner Hub</CardTitle>
                        <CardDescription>Integrate CPay, manage payouts, and track your business performance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Button asChild>
                            <Link href="/login">Enter Partner Hub <ArrowRight className="ml-2"/></Link>
                        </Button>
                    </CardContent>
                </Card>

                 <Card className="flex flex-col items-center justify-center p-8 text-center rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                         <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                           <Shield className="h-8 w-8 text-primary"/>
                        </div>
                        <CardTitle className="font-headline text-2xl">Admin Mission Control</CardTitle>
                        <CardDescription>Oversee operations, manage compliance, and ensure platform integrity.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Button asChild>
                            <Link href="/login">Launch Mission Control <ArrowRight className="ml-2"/></Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </section>
      </main>

      <footer className="bg-muted">
        <div className="container py-8 text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} CPay. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
