
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Smartphone, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const loadDenominations = [
    { type: 'Regular', amount: 50, data: 0 },
    { type: 'Regular', amount: 100, data: 0 },
    { type: 'Regular', amount: 300, data: 0 },
    { type: 'Promo', amount: 99, data: 5, description: '5GB Data, 7 days' },
    { type: 'Promo', amount: 149, data: 10, description: '10GB Data, 15 days' },
    { type: 'Promo', amount: 299, data: 25, description: '25GB Data, 30 days' },
];

const getNetworkLogo = (number: string) => {
    const prefix = number.substring(0, 4);
    if (['0917', '0927', '0905', '0906'].some(p => prefix.startsWith(p))) return 'https://placehold.co/40x40.png'; // Globe
    if (['0918', '0919', '0920', '0928'].some(p => prefix.startsWith(p))) return 'https://placehold.co/40x40.png'; // Smart
    if (['0991', '0992', '0993'].some(p => prefix.startsWith(p))) return 'https://placehold.co/40x40.png'; // DITO
    return null;
}

export default function BuyLoadPage() {
    const [step, setStep] = useState(1);
    const [mobileNumber, setMobileNumber] = useState("");
    const [selectedLoad, setSelectedLoad] = useState<(typeof loadDenominations)[0] | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    const { call: buyLoad, isLoading } = useApi('initiateBuyLoad');

    const networkLogo = getNetworkLogo(mobileNumber);

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleConfirm = async () => {
        if (!selectedLoad || !mobileNumber) return;
        
        const result = await buyLoad({
            mobileNumber,
            amount: selectedLoad.amount,
        });

        if (result && typeof result === 'object' && 'success' in result && result.success) {
            toast({
                title: "Purchase Successful",
                description: `₱${selectedLoad.amount} load sent to ${mobileNumber}.`,
            });
            router.push('/consumer');
        }
    }


    return (
        <div className="flex min-h-screen flex-col bg-background">
            <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/80 px-4 py-3 backdrop-blur-sm sm:px-6">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/consumer">
                        <ArrowLeft />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="font-headline text-xl font-bold text-foreground">Buy Load</h1>
            </header>

            <main className="flex flex-1 flex-col items-center justify-center p-4">
                <div className="w-full max-w-md space-y-6">
                    {step === 1 && (
                        <Card className="rounded-xl shadow-lg">
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl">Enter Mobile Number</CardTitle>
                                <CardDescription>Input the 11-digit mobile number you want to top up.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="mobileNumber">Mobile Number</Label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        {networkLogo && <Avatar className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"><AvatarImage src={networkLogo} data-ai-hint="logo company" /></Avatar>}
                                        <Input
                                            id="mobileNumber"
                                            type="tel"
                                            placeholder="09XX XXX XXXX"
                                            value={mobileNumber}
                                            onChange={(e) => setMobileNumber(e.target.value)}
                                            className="pl-10 text-lg"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {loadDenominations.map((load, i) => (
                                        <Button 
                                            key={i} 
                                            variant="outline" 
                                            className="h-auto flex-col py-3" 
                                            onClick={() => { setSelectedLoad(load); handleNext(); }}
                                            disabled={!mobileNumber || mobileNumber.length < 11}
                                        >
                                            <span className="font-bold text-lg">₱{load.amount}</span>
                                            <span className="text-xs text-muted-foreground">{load.description || 'Regular Load'}</span>
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {step === 2 && selectedLoad && (
                        <Card className="rounded-xl shadow-lg">
                           <CardHeader className="items-center text-center">
                                <CardTitle className="font-headline text-2xl">Review & Confirm</CardTitle>
                                <CardDescription>Please check the details before paying.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                               <div className="flex flex-col items-center space-y-2 rounded-lg border p-4">
                                  <p className="text-sm text-muted-foreground">You are sending</p>
                                  <p className="font-headline text-4xl font-bold text-primary">
                                    ₱{selectedLoad.amount.toFixed(2)}
                                  </p>
                                   <p className="text-sm text-muted-foreground">of {selectedLoad.type} Load</p>
                               </div>

                               <div className="space-y-2 text-sm">
                                   <div className="flex justify-between items-center">
                                       <span className="text-muted-foreground">To Mobile Number:</span>
                                       <div className="flex items-center gap-2">
                                            {networkLogo && <Avatar className="h-5 w-5"><AvatarImage src={networkLogo} data-ai-hint="logo company"/></Avatar>}
                                            <span className="font-semibold font-mono">{mobileNumber}</span>
                                       </div>
                                   </div>
                                    <div className="flex justify-between font-bold">
                                       <span className="text-foreground">Total to Pay:</span>
                                       <span className="text-foreground">₱{selectedLoad.amount.toFixed(2)}</span>
                                   </div>
                               </div>
                                
                                <AlertDialog>
                                    <div className="flex gap-4">
                                        <Button variant="outline" className="w-full" onClick={handleBack} disabled={isLoading}>
                                            Back
                                        </Button>
                                        <AlertDialogTrigger asChild>
                                            <Button className="w-full" disabled={isLoading}>
                                                <Check className="mr-2"/>
                                                Confirm & Pay
                                            </Button>
                                        </AlertDialogTrigger>
                                    </div>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                 Are you sure you want to send ₱{selectedLoad.amount.toFixed(2)} load to {mobileNumber}? This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleConfirm} disabled={isLoading}>
                                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                Confirm
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
