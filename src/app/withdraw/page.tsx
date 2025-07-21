
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, Landmark, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";

const partnerBanks = [
    { name: "BDO Unibank", code: "BDO" },
    { name: "Bank of the Philippine Islands", code: "BPI" },
    { name: "Metrobank", code: "MBTC" },
    { name: "Land Bank of the Philippines", code: "LBP" },
    { name: "Security Bank", code: "SECB" },
    { name: "UnionBank of the Philippines", code: "UBP" },
    { name: "GCash", code: "GCASH" },
    { name: "Maya", code: "MAYA" },
];

export default function WithdrawPage() {
    const [step, setStep] = useState(1);
    const [amount, setAmount] = useState("");
    const [transferMethod, setTransferMethod] = useState("");
    const [bankDetails, setBankDetails] = useState({
        bankCode: "",
        accountNumber: "",
        accountName: "",
    });
    const router = useRouter();
    const { toast } = useToast();
    
    const { call: initiateInstaPay, isLoading: isInstaPayLoading } = useApi("initiateInstaPayTransfer");
    const { call: initiatePesoNet, isLoading: isPesoNetLoading } = useApi("initiatePesoNetTransfer");
    const isLoading = isInstaPayLoading || isPesoNetLoading;


    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const isStep1Valid = amount && parseFloat(amount) > 0 && transferMethod;
    const isStep2Valid = bankDetails.bankCode && bankDetails.accountNumber && bankDetails.accountName;

    const selectedBankName = partnerBanks.find(b => b.code === bankDetails.bankCode)?.name;

    const handleConfirm = async () => {
        const payload = {
            amount: parseFloat(amount),
            currency: "PHP",
            bankDetails: bankDetails
        };

        let result: any;
        if (transferMethod === 'instapay') {
            result = await initiateInstaPay(payload);
        } else if (transferMethod === 'pesonet') {
            result = await initiatePesoNet(payload);
        } else {
            toast({ title: "Error", description: "Invalid transfer method selected.", variant: "destructive" });
            return;
        }

        if (result?.success) {
            toast({
                title: "Request Submitted",
                description: "Your withdrawal request has been submitted for approval.",
            });
            router.push("/consumer");
        }
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
                <h1 className="font-headline text-xl font-bold text-foreground">Withdraw Funds</h1>
            </header>

            <main className="flex flex-1 flex-col items-center justify-center p-4">
                <div className="w-full max-w-md space-y-6">
                    {step === 1 && (
                        <Card className="rounded-xl shadow-lg">
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl">Enter Amount & Method</CardTitle>
                                <CardDescription>Choose how you want to receive your money.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount to Withdraw (PHP)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="h-14 text-2xl font-bold"
                                    />
                                </div>

                                <div>
                                    <Label>Select Transfer Method</Label>
                                    <RadioGroup className="grid grid-cols-2 gap-4 pt-2" onValueChange={setTransferMethod} value={transferMethod}>
                                        <Label htmlFor="instapay" className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                            <RadioGroupItem value="instapay" id="instapay" className="peer sr-only" />
                                            <Landmark className="mb-2 h-7 w-7" />
                                            <span className="font-semibold">InstaPay</span>
                                            <span className="text-xs text-muted-foreground text-center">Real-time, 24/7</span>
                                        </Label>
                                        <Label htmlFor="pesonet" className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                            <RadioGroupItem value="pesonet" id="pesonet" className="peer sr-only" />
                                            <Landmark className="mb-2 h-7 w-7" />
                                            <span className="font-semibold">PESONet</span>
                                            <span className="text-xs text-muted-foreground text-center">Same/next day</span>
                                        </Label>
                                    </RadioGroup>
                                </div>
                                
                                <Button className="w-full" size="lg" onClick={handleNext} disabled={!isStep1Valid}>
                                    Next <ArrowRight className="ml-2"/>
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {step === 2 && (
                        <Card className="rounded-xl shadow-lg">
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl">Bank Details</CardTitle>
                                <CardDescription>Enter the destination account information.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bank">Destination Bank</Label>
                                    <Select value={bankDetails.bankCode} onValueChange={(value) => setBankDetails(prev => ({...prev, bankCode: value}))}>
                                        <SelectTrigger id="bank">
                                            <SelectValue placeholder="Choose a bank or e-wallet..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {partnerBanks.map((bank) => (
                                                <SelectItem key={bank.code} value={bank.code}>
                                                    {bank.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="accountNumber">Account Number</Label>
                                    <Input id="accountNumber" placeholder="Enter account number" value={bankDetails.accountNumber} onChange={(e) => setBankDetails(prev => ({...prev, accountNumber: e.target.value}))}/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="accountName">Account Holder Name</Label>
                                    <Input id="accountName" placeholder="Full name as registered in bank" value={bankDetails.accountName} onChange={(e) => setBankDetails(prev => ({...prev, accountName: e.target.value}))}/>
                                </div>
                            </CardContent>
                            <CardFooter className="flex gap-4">
                                <Button variant="outline" className="w-full" onClick={handleBack}>Back</Button>
                                <Button className="w-full" onClick={handleNext} disabled={!isStep2Valid}>Review <ArrowRight className="ml-2"/></Button>
                            </CardFooter>
                        </Card>
                    )}

                     {step === 3 && (
                         <Card className="rounded-xl shadow-lg">
                            <CardHeader className="text-center">
                                <CardTitle className="font-headline text-2xl">Confirm Withdrawal</CardTitle>
                                <CardDescription>Review the details carefully before confirming.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                               <div className="flex flex-col items-center space-y-2 rounded-lg border p-4">
                                  <p className="text-sm text-muted-foreground">You are withdrawing</p>
                                  <p className="font-headline text-4xl font-bold text-primary">
                                    ₱{parseFloat(amount || "0").toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                               </div>

                               <Separator />
                                <div className="space-y-3 text-sm">
                                    <p className="font-semibold text-foreground">Destination Account:</p>
                                    <div className="pl-4 space-y-1">
                                        <p className="text-muted-foreground"><User className="inline-block h-4 w-4 mr-2" />{bankDetails.accountName}</p>
                                        <p className="text-muted-foreground"><Building2 className="inline-block h-4 w-4 mr-2" />{bankDetails.accountNumber}</p>
                                        <p className="text-muted-foreground"><Landmark className="inline-block h-4 w-4 mr-2" />{selectedBankName}</p>
                                    </div>
                                </div>
                                <Separator />
                                 <div className="space-y-2 text-sm">
                                   <div className="flex justify-between">
                                       <span className="text-muted-foreground">Transfer Method:</span>
                                       <span className="font-semibold">{transferMethod.toUpperCase()}</span>
                                   </div>
                                    <div className="flex justify-between">
                                       <span className="text-muted-foreground">Transfer Fee:</span>
                                       <span className="font-semibold">{transferMethod === 'instapay' ? '₱15.00' : '₱0.00'}</span>
                                   </div>
                                   <div className="flex justify-between font-bold text-base">
                                       <span className="text-foreground">Total to be deducted:</span>
                                       <span className="text-foreground">₱{(parseFloat(amount || "0") + (transferMethod === 'instapay' ? 15 : 0)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                   </div>
                               </div>
                                <div className="pt-2 text-xs text-muted-foreground">
                                    By clicking confirm, you agree to CPay's terms and certify that the provided details are correct. Incorrect details may result in delayed or lost funds.
                                </div>
                            </CardContent>
                             <CardFooter className="flex gap-4">
                                <Button variant="outline" className="w-full" onClick={handleBack} disabled={isLoading}>Back</Button>
                                <Button className="w-full" size="lg" onClick={handleConfirm} disabled={isLoading}>
                                     {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Confirm Withdrawal
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
