
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, QrCode, Share2, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useApiQuery } from "@/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";

type UserProfile = {
  mobileNumber: string;
};

export default function ReceivePage() {
    const { toast } = useToast();
    const [amount, setAmount] = useState("");
    
    const { data: profile, isLoading } = useApiQuery<UserProfile>("getUserProfile", undefined, { queryKey: ["getUserProfile"] });
    
    const myCpayNumber = profile?.mobileNumber || "";
    
    const qrData = amount 
        ? `${myCpayNumber}?amount=${encodeURIComponent(amount)}`
        : myCpayNumber;

    const qrCodeUrl = myCpayNumber 
        ? `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrData)}`
        : "";

    const copyToClipboard = () => {
        if (!myCpayNumber) return;
        navigator.clipboard.writeText(myCpayNumber);
        toast({
            title: "Copied to Clipboard",
            description: "Your CPay mobile number has been copied.",
        });
    };

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/80 px-4 py-3 backdrop-blur-sm sm:px-6">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/consumer">
                        <ArrowLeft />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="font-headline text-xl font-bold text-foreground">Receive Money</h1>
            </header>

            <main className="flex flex-1 flex-col items-center justify-center p-4">
                <div className="w-full max-w-md space-y-6">
                    <Card className="rounded-xl shadow-lg">
                        <CardHeader className="text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-2">
                                <QrCode className="h-9 w-9 text-primary"/>
                            </div>
                            <CardTitle className="font-headline text-2xl">My QR Code</CardTitle>
                            <CardDescription>Show this to other CPay users to receive money instantly.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center space-y-4">
                            <div className="rounded-lg border bg-white p-4">
                                {isLoading ? (
                                    <Skeleton className="h-64 w-64" />
                                ) : (
                                    <img src={qrCodeUrl} alt="User QR Code" className="h-64 w-64" data-ai-hint="qr code"/>
                                )}
                            </div>
                             <div className="w-full">
                                <Label htmlFor="amount">Set an amount (optional)</Label>
                                <Input 
                                    id="amount" 
                                    type="number" 
                                    placeholder="Enter amount to request"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-4">
                            <Button variant="outline" className="w-full">
                                <Share2 className="mr-2"/>
                                Share
                            </Button>
                             <Button className="w-full" asChild>
                               <Link href="/consumer">Done</Link>
                            </Button>
                        </CardFooter>
                    </Card>

                     <Card className="rounded-xl shadow-sm">
                        <CardContent className="p-4">
                           <Label>Your CPay Number</Label>
                           <div className="flex gap-2">
                            {isLoading ? (
                                <Skeleton className="h-10 w-full" />
                            ) : (
                                <Input readOnly value={myCpayNumber} />
                            )}
                            <Button variant="secondary" onClick={copyToClipboard} disabled={isLoading || !myCpayNumber}>
                                {isLoading ? <Loader2 className="animate-spin" /> : <Copy className="mr-2"/>}
                                Copy
                            </Button>
                           </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
