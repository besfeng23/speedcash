
"use client";


import Link from "next/link";
import { ArrowLeft, KeyRound, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AccountSecurityPage() {
  const { toast } = useToast();

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Password Updated",
      description: "Your new password has been saved.",
    });
  };

  const handleSaveMpin = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "mPIN Updated",
      description: "Your new mPIN has been set.",
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/80 px-4 py-3 backdrop-blur-sm sm:px-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profile">
            <ArrowLeft />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="font-headline text-xl font-bold text-foreground">Account & Security</h1>
      </header>

      <main className="flex flex-1 flex-col items-center p-4">
        <div className="w-full max-w-md space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                For your security, we recommend choosing a strong password that you don&apos;t use elsewhere.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSavePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" required />
                </div>
                <Button type="submit" className="w-full">
                  <Save />
                  Save Password
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manage mPIN</CardTitle>
              <CardDescription>
                Your 4-digit mPIN is used to authorize transactions quickly and securely.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveMpin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-mpin">Current mPIN</Label>
                  <Input id="current-mpin" type="password" maxLength={4} pattern="\d{4}" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-mpin">New 4-Digit mPIN</Label>
                  <Input id="new-mpin" type="password" maxLength={4} pattern="\d{4}" required />
                </div>
                <Button type="submit" className="w-full">
                  <KeyRound />
                  Set New mPIN
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
