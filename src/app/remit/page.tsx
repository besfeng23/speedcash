"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Banknote, Building2, User, Loader2, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
// TODO: Create AI flow for remittance recipient info
// import { collectRecipientInfo, CollectRecipientInfoOutput } from "@/ai/flows/remittance-recipient-info";
import { useApi } from "@/hooks/useApi";
import { useApiQuery } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";

type Transaction = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  timestamp: any;
};


export default function RemitPage() {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [phpAmount, setPhpAmount] = useState("");
    const [userInfo, setUserInfo] = useState("");
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [recipientDetails, setRecipientDetails] = useState<any | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const krwAmount = (parseFloat(phpAmount) || 0) * 45.50; // Example static rate

    const callInitiateRemittanceMutation = useApi('initiateRemittance');
    const { data: transactions } = useApiQuery<{ transactions: Transaction[] }>(
        'getTransactionHistory',
        undefined,
        { enabled: !!user, queryKey: ['getTransactionHistory'] }
    );


    const handleRecipientInfoSubmit = async () => {
        setIsAiProcessing(true);
        try {
            // TODO: Implement AI recipient info collection
            // const result = await collectRecipientInfo({
            //   recipientDetails: recipientDetails,
            //   amount: amount,
            //   currency: 'PHP'
            // });
            // setRecipientDetails(result);
            setStep(3);
        } catch (error) {
            console.error("AI processing failed:", error);
            toast({
                variant: "destructive",
                title: "Processing Failed",
                description: "Could not process the recipient information. Please try again.",
            });
        } finally {
            setIsAiProcessing(false);
        }
    }
    
    const handleConfirmSend = async () => {
        if (!recipientDetails || !phpAmount) return;

        const result = await callInitiateRemittanceMutation.mutateAsync({
            amount: parseFloat(phpAmount),
            recipientDetails: recipientDetails,
        });

        if (result && (result as any).success) {
            toast({
                title: "Remittance Sent!",
                description: `Your transfer of ₱${phpAmount} is being processed.`,
            });
            router.push("/consumer");
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
                <h1 className="font-headline text-xl font-bold text-foreground">Remit to South Korea</h1>
            </header>
            
            <main className="flex flex-1 flex-col items-center justify-center p-4">
                 <div className="w-full max-w-md space-y-4">
                    <Progress value={(step / 3) * 100} className="h-2" />

                    {step === 1 && (
                        <Card className="rounded-xl shadow-lg">
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl">Enter Amount</CardTitle>
                                <CardDescription>Specify the amount you want to send.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-1">
                                    <Label htmlFor="php-amount">You Send (PHP)</Label>
                                    <Input 
                                        id="php-amount" 
                                        type="number" 
                                        placeholder="0.00" 
                                        className="h-16 text-3xl font-bold"
                                        value={phpAmount}
                                        onChange={(e) => setPhpAmount(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="krw-amount">They Receive (KRW)</Label>
                                    <Input 
                                        id="krw-amount" 
                                        readOnly 
                                        value={`≈ ₩${krwAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        className="h-16 text-3xl font-bold bg-muted"
                                    />
                                    <p className="text-xs text-muted-foreground text-center">Live FX Rate: 1 PHP = 45.50 KRW</p>
                                </div>
                                <Button className="w-full" size="lg" onClick={() => setStep(2)} disabled={!phpAmount}>
                                    Next <ArrowRight className="ml-2"/>
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {step === 2 && (
                        <Card className="rounded-xl shadow-lg">
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl">Recipient Details</CardTitle>
                                <CardDescription>Describe who you're sending to and for what purpose. Our AI will handle the rest.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                               <div className="space-y-2">
                                    <Label htmlFor="recipient-info">Recipient and Purpose</Label>
                                    <Textarea
                                        id="recipient-info"
                                        placeholder="e.g., 'Sending to Kim Min-jun for family support. His bank is Kookmin Bank, account 123-456-7890.'"
                                        rows={5}
                                        value={userInfo}
                                        onChange={(e) => setUserInfo(e.target.value)}
                                    />
                               </div>
                                 <div className="flex gap-4">
                                    <Button variant="outline" className="w-full" onClick={() => setStep(1)} disabled={isAiProcessing}>Back</Button>
                                    <Button className="w-full" onClick={handleRecipientInfoSubmit} disabled={isAiProcessing || !userInfo}>
                                        {isAiProcessing ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                        ) : (
                                            <Bot className="mr-2 h-4 w-4" />
                                        )}
                                        Process with AI
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {step === 3 && recipientDetails && (
                         <Card className="rounded-xl shadow-lg">
                            <CardHeader className="text-center">
                                <CardTitle className="font-headline text-2xl">Review and Confirm</CardTitle>
                                <CardDescription>Please check the AI-extracted details carefully.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                               <div className="space-y-4 rounded-lg border p-4">
                                  <div className="flex justify-between items-baseline">
                                    <p className="text-muted-foreground">You send</p>
                                    <p className="font-headline text-xl font-bold text-primary">₱{parseFloat(phpAmount || "0").toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                  </div>
                                   <div className="flex justify-between items-baseline">
                                    <p className="text-muted-foreground">They receive</p>
                                    <p className="font-headline text-xl font-bold text-primary">₩{krwAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                  </div>
                               </div>
                               <Separator />
                                <div className="space-y-2 text-sm">
                                    <p className="font-semibold text-foreground">Recipient:</p>
                                    <p className="text-muted-foreground"><User className="inline-block h-4 w-4 mr-2" />{recipientDetails.recipientName}</p>
                                    <p className="text-muted-foreground"><Building2 className="inline-block h-4 w-4 mr-2" />{recipientDetails.recipientBankName}, {recipientDetails.recipientBankAccountNumber}</p>
                                    <p className="font-semibold text-foreground mt-2">Purpose:</p>
                                    <p className="text-muted-foreground">{recipientDetails.purposeOfTransfer}</p>
                                </div>
                                <Separator />
                                 <div className="space-y-2 text-sm">
                                   <div className="flex justify-between">
                                       <span className="text-muted-foreground">Transfer Fee:</span>
                                       <span className="font-semibold">₱150.00</span>
                                   </div>
                                   <div className="flex justify-between font-bold text-base">
                                       <span className="text-foreground">Total to pay:</span>
                                       <span className="text-foreground">₱{(parseFloat(phpAmount || "0") + 150).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                   </div>
                               </div>
                                <div className="flex gap-4">
                                    <Button variant="outline" className="w-full" onClick={() => setStep(2)} disabled={callInitiateRemittanceMutation.isPending}>Back</Button>
                                    <Button className="w-full" size="lg" onClick={handleConfirmSend} disabled={callInitiateRemittanceMutation.isPending}>
                                        {callInitiateRemittanceMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                        Confirm & Send
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                 </div>
            </main>
        </div>
    );
}
