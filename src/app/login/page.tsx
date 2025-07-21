
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      
      // Force a refresh of the token to get the latest custom claims
      const tokenResult = await userCredential.user.getIdTokenResult(true);
      const userRole = tokenResult.claims.role;

      toast({
        title: "Login Successful",
        description: "Redirecting to your dashboard...",
      });
      
      if (userRole === 'admin' || userRole === 'superadmin') {
        router.push('/admin/overview');
      } else if (userRole === 'partner') {
        router.push('/partner');
      } else {
        router.push('/consumer');
      }

    } catch (error: any) {
      console.error("Login failed:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
      setIsLoading(false); // Only set loading to false on error
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm rounded-xl shadow-lg">
        <CardHeader className="text-center space-y-4">
           <Image src="/CPayWallet_blue.png" alt="CPay Logo" width={220} height={56} className="mx-auto" data-ai-hint="logo cpay"/>
          <CardTitle className="font-headline text-2xl">Welcome Back</CardTitle>
          <CardDescription>Enter your credentials to access your portal.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <LogIn className="mr-2"/> Sign In
                </>
              )}
            </Button>
             <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
            </div>
             <p className="text-center text-xs text-muted-foreground">
                <Link href="/signup" className="font-semibold text-primary hover:underline">
                    Consumer Sign Up
                </Link>
                {' '}or{' '}
                 <Link href="/partner/signup" className="font-semibold text-primary hover:underline">
                    Partner Sign Up
                </Link>
            </p>
             <p className="text-center text-xs text-muted-foreground pt-4">
                Use 'jovenongz@gmail.com' (superadmin), 'winny@redapplex.com' (admin), 'partner@cpay.com', or 'user@cpay.com' with password 'password123' to test roles.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
