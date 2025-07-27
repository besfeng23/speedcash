
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { firebaseAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { useApi } from '@/hooks/useApi';

export default function PartnerSignupPage() {
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  const createPartnerRecordMutation = useApi('createPartner');


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const user = userCredential.user;
      
      // 2. Update user's profile with their name
      if (user) {
        await updateProfile(user, { displayName: businessName }); // For partners, display name is the business name
        
        // 3. Call our backend function to create the partner record and set the custom claim
        const partnerResult = await createPartnerRecordMutation.mutateAsync({
            uid: user.uid,
            businessName: businessName,
            email: user.email,
            mobileNumber: mobileNumber, // Pass the mobile number
        });

        if (!(partnerResult as any)?.success) {
            throw new Error('Failed to create partner-specific records.');
        }

      } else {
        throw new Error('User creation failed.');
      }

      toast({
        title: "Partner Account Created",
        description: "Welcome to CPay! Redirecting to your new partner dashboard...",
      });
      
      // 4. Redirect to the partner portal after successful signup
      router.push('/partner');

    } catch (error: unknown) {
      console.error("Partner signup failed:", error);
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm rounded-xl shadow-lg">
        <CardHeader className="text-center space-y-4">
           <Image src="/CPayWallet_blue.png" alt="CPay Logo" width={220} height={56} className="mx-auto" data-ai-hint="logo cpay"/>
          <CardTitle className="font-headline text-2xl">Partner with CPay</CardTitle>
          <CardDescription>Create a business account to integrate our payment solutions.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
             <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                type="text"
                placeholder="Your Company Inc."
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="mobileNumber">Contact Number</Label>
              <Input
                id="mobileNumber"
                type="tel"
                placeholder="09171234567"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                required
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
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || createPartnerRecordMutation.isPending}>
              {isLoading || createPartnerRecordMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <UserPlus className="mr-2"/> Create Business Account
                </>
              )}
            </Button>
             <p className="text-center text-xs text-muted-foreground pt-4">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                    Sign In
                </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
