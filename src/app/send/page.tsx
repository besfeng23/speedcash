
"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Wallet, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import debounce from 'lodash.debounce';

// Mock user lookup. In a real app, this would be a debounced API call.
const mockUserLookup = (mobileNumber: string) => {
    if (mobileNumber === "09171234567") {
        return { name: "Jane Doe", mobile: "09171234567" };
    }
    const mobileNumberRegex = /^(09|\+639)\d{9}$/;
    if (mobileNumberRegex.test(mobileNumber) && mobileNumber.length >= 11) {
        return { name: "CPay User", mobile: mobileNumber };
    }
    return null;
}

function SendMoneyContent() {
    const searchParams = useSearchParams()
    const router = useRouter();

    const [mobileNumber, setMobileNumber] = useState(searchParams.get('mobileNumber') || "");
    const [amount, setAmount] = useState("");
    const [recipient, setRecipient] = useState<{name: string, mobile: string} | null>(null);
    const { call: initiateTransfer, isLoading } = useApi("initiateP2PTransfer");
    const { toast } = useToast();

    // Debounced lookup function
    const debouncedLookup = useCallback(
        debounce((num: string) => {
            const foundUser = mockUserLookup(num);
            setRecipient(foundUser);
        }, 500),
    []);

    useEffect(() => {
        if (mobileNumber) {
            debouncedLookup(mobileNumber);
        }
        // Cleanup the debounced function on unmount
        return () => debouncedLookup.cancel();
    }, [mobileNumber, debouncedLookup]);


    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const num = e.target.value;
        setMobileNumber(num);
        if (num.length < 11) {
            setRecipient(null);
        } else {
             debouncedLookup(num);
        }
    }

    const handleSend = async () => {
        if (!recipient) return;

        const transferAmount = parseFloat(amount);
        if (isNaN(transferAmount) || transferAmount <= 0) {
             toast({ title: "Invalid Amount", description: "Please enter a valid amount.", variant: "destructive" });
            return;
        }

        const result = await initiateTransfer({
            recipientMobileNumber: recipient.mobile,
            amount: transferAmount,
            currency: "PHP"
        });

        if (result && (result as any).success) {
            toast({
                title: "Transfer Successful!",
                description: `You have sent ₱${transferAmount.toFixed(2)} to ${(result as any).receiverName}.`
            });
            router.push("/consumer");
        }
    }

    return (
        <div className="w-full max-w-md space-y-6">
            <Card className="rounded-xl shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Send to CPay User</CardTitle>
                    <CardDescription>Enter the recipient's mobile number and the amount to send.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="mobileNumber">Mobile Number</Label>
                        <Input
                            id="mobileNumber"
                            type="tel"
                            placeholder="e.g., 09171234567"
                            value={mobileNumber}
                            onChange={handleNumberChange}
                        />
                    </div>

                    {recipient && (
                        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
                            <Avatar>
                                <AvatarImage src="https://placehold.co/40x40.png" alt="Recipient" data-ai-hint="person avatar" />
                                <AvatarFallback>{recipient.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold text-foreground">{recipient.name}</p>
                                <p className="text-sm text-muted-foreground">{recipient.mobile}</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (PHP)</Label>
                        <Input
                            id="amount"
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="h-14 text-2xl font-bold"
                        />
                    </div>
                    
                    <AlertDialog>
                        <Button asChild>
                            <Button className="w-full" size="lg" disabled={!recipient || !amount || isLoading}>
                                <Wallet className="mr-2 h-5 w-5" />
                                Send Payment
                            </Button>
                        </Button>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Transfer</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to send{" "}
                                    <span className="font-bold text-primary">₱{parseFloat(amount || '0').toFixed(2)}</span> to{" "}
                                    <span className="font-bold text-primary">{recipient?.name}</span>?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleSend} disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Confirm & Send
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>
        </div>
    );
}


export default function SendMoneyPage() {
     return (
        <div className="flex min-h-screen flex-col bg-background">
            <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/80 px-4 py-3 backdrop-blur-sm sm:px-6">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/consumer">
                        <ArrowLeft />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="font-headline text-xl font-bold text-foreground">Send Money</h1>
            </header>

            <main className="flex flex-1 flex-col items-center justify-center p-4">
               <Suspense fallback={<div>Loading...</div>}>
                    <SendMoneyContent />
               </Suspense>
            </main>
        </div>
    );
}
