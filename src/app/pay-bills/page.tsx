
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lightbulb, Droplet, Wifi, Landmark, Search, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const billers = [
    { name: 'Meralco', category: 'Utilities', icon: Lightbulb, logo: "https://placehold.co/40x40.png" },
    { name: 'Manila Water', category: 'Utilities', icon: Droplet, logo: "https://placehold.co/40x40.png" },
    { name: 'PLDT Home Fibr', category: 'Telecoms', icon: Wifi, logo: "https://placehold.co/40x40.png" },
    { name: 'Pag-IBIG Fund', category: 'Government', icon: Landmark, logo: "https://placehold.co/40x40.png" },
    { name: 'Globe At Home', category: 'Telecoms', icon: Wifi, logo: "https://placehold.co/40x40.png" },
];

export default function PayBillsPage() {
    const [step, setStep] = useState(1);
    const [selectedBiller, setSelectedBiller] = useState<(typeof billers)[0] | null>(null);
    const [accountNumber, setAccountNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const router = useRouter();
    const { toast } = useToast();

    const { call: payBill, isLoading } = useApi('initiateBillPayment');

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);
    
    const filteredBillers = billers.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleConfirm = async () => {
        if (!selectedBiller || !accountNumber || !amount) return;

        const result = await payBill({
            billerName: selectedBiller.name,
            accountNumber,
            amount: parseFloat(amount),
        });

        if ((result as any)?.success) {
            toast({
                title: "Payment Successful",
                description: `Your payment of ₱${amount} to ${selectedBiller.name} has been processed.`,
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
                <h1 className="font-headline text-xl font-bold text-foreground">Pay Bills</h1>
            </header>

             <main className="flex flex-1 flex-col items-center p-4">
                <div className="w-full max-w-md space-y-6">
                    {step === 1 && (
                        <Card className="rounded-xl shadow-lg">
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl">Select a Biller</CardTitle>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search for a biller..." 
                                        className="pl-10"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                {filteredBillers.map((biller) => (
                                    <li key={biller.name}>
                                        <button className="flex w-full items-center gap-4 rounded-lg p-3 text-left hover:bg-muted/50" onClick={() => { setSelectedBiller(biller); handleNext(); }}>
                                            <Avatar>
                                                <AvatarImage src={biller.logo} data-ai-hint="logo company"/>
                                                <AvatarFallback><biller.icon/></AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="font-semibold">{biller.name}</p>
                                                <p className="text-xs text-muted-foreground">{biller.category}</p>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {step === 2 && selectedBiller && (
                        <Card className="rounded-xl shadow-lg">
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl">Pay {selectedBiller.name}</CardTitle>
                                <CardDescription>Enter your payment details.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="accountNumber">Account / Reference Number</Label>
                                    <Input id="accountNumber" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount (PHP)</Label>
                                    <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)}/>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <Button variant="outline" className="w-full" onClick={handleBack}>Back</Button>
                                    <Button className="w-full" onClick={handleNext} disabled={!accountNumber || !amount}>Review Payment</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    
                    {step === 3 && selectedBiller && (
                         <Card className="rounded-xl shadow-lg">
                           <CardHeader className="items-center text-center">
                                <CardTitle className="font-headline text-2xl">Review & Confirm</CardTitle>
                                <CardDescription>Please check the details before paying.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                               <div className="flex flex-col items-center space-y-2 rounded-lg border p-4">
                                  <p className="text-sm text-muted-foreground">You are paying</p>
                                  <p className="font-headline text-4xl font-bold text-primary">
                                    ₱{parseFloat(amount || "0").toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                               </div>

                               <div className="space-y-2 text-sm">
                                   <div className="flex justify-between items-center">
                                       <span className="text-muted-foreground">Biller:</span>
                                       <div className="flex items-center gap-2">
                                            <Avatar className="h-5 w-5"><AvatarImage src={selectedBiller.logo} data-ai-hint="logo company"/></Avatar>
                                            <span className="font-semibold">{selectedBiller.name}</span>
                                       </div>
                                   </div>
                                   <div className="flex justify-between items-center">
                                       <span className="text-muted-foreground">Account/Ref #:</span>
                                       <span className="font-semibold font-mono">{accountNumber}</span>
                                   </div>
                                    <div className="flex justify-between font-bold">
                                       <span className="text-foreground">Total to Pay:</span>
                                       <span className="text-foreground">₱{parseFloat(amount || "0").toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                   </div>
                               </div>
                                
                                <AlertDialog>
                                    <div className="flex gap-4">
                                        <Button variant="outline" className="w-full" onClick={handleBack} disabled={isLoading}>
                                            Back
                                        </Button>
                                        <AlertDialogTrigger asChild>
                                            <Button className="w-full" disabled={isLoading}>
                                                {isLoading ? <Loader2 className="mr-2 animate-spin"/> : <Check className="mr-2"/>}
                                                Confirm & Pay
                                            </Button>
                                        </AlertDialogTrigger>
                                    </div>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                 Are you sure you want to pay ₱{parseFloat(amount || "0").toFixed(2)} to {selectedBiller.name}? This action cannot be undone.
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
