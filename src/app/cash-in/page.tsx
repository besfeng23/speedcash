
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Banknote, CreditCard, Landmark, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const partnerBanks = [
    { name: "BDO Unibank", logo: "/banks/bdo.svg" },
    { name: "Bank of the Philippine Islands", logo: "/banks/bpi.svg" },
    { name: "Metrobank", logo: "/banks/metrobank.svg" },
    { name: "Land Bank of the Philippines", logo: "/banks/landbank.svg" },
    { name: "Security Bank", logo: "/banks/securitybank.svg" },
];

export default function CashInPage() {
    const [step, setStep] = useState(1);
    const [amount, setAmount] = useState("");
    const [selectedBank, setSelectedBank] = useState("");
    const [selectedMethod, setSelectedMethod] = useState("instapay");

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/80 px-4 py-3 backdrop-blur-sm sm:px-6">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/consumer">
                        <ArrowLeft />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="font-headline text-xl font-bold text-foreground">Cash In</h1>
            </header>

            <main className="flex flex-1 flex-col items-center justify-center p-4">
                <div className="w-full max-w-md space-y-6">
                    {step === 1 && (
                        <Card className="rounded-xl shadow-lg">
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl">Choose Source</CardTitle>
                                <CardDescription>Select where your money will come from.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="bank">Select a Partner Bank</Label>
                                    <Select value={selectedBank} onValueChange={setSelectedBank}>
                                        <SelectTrigger id="bank">
                                            <SelectValue placeholder="Choose a bank..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {partnerBanks.map((bank) => (
                                                <SelectItem key={bank.name} value={bank.name}>
                                                    {bank.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <RadioGroup defaultValue="instapay" className="grid grid-cols-2 gap-4" onValueChange={setSelectedMethod}>
                                    <div>
                                        <RadioGroupItem value="instapay" id="instapay" className="peer sr-only" />
                                        <Label
                                            htmlFor="instapay"
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                        >
                                            <Landmark className="mb-3 h-6 w-6" />
                                            InstaPay
                                        </Label>
                                    </div>
                                    <div>
                                        <RadioGroupItem value="pesonet" id="pesonet" className="peer sr-only" />
                                        <Label
                                            htmlFor="pesonet"
                                            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                                        >
                                            <Wallet className="mb-3 h-6 w-6" />
                                            PESONet
                                        </Label>
                                    </div>
                                </RadioGroup>

                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount (PHP)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="h-12 text-lg"
                                    />
                                </div>

                                <Button className="w-full" size="lg" onClick={() => setStep(2)} disabled={!amount || !selectedBank}>
                                    Continue
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {step === 2 && (
                         <Card className="rounded-xl shadow-lg">
                            <CardHeader className="items-center text-center">
                                <CardTitle className="font-headline text-2xl">Confirm Cash-In</CardTitle>
                                <CardDescription>You will be redirected to {selectedBank} to complete the transaction.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                               <div className="flex flex-col items-center space-y-2 rounded-lg border p-4">
                                  <p className="text-sm text-muted-foreground">You are cashing in</p>
                                  <p className="font-headline text-4xl font-bold text-primary">
                                    ₱{parseFloat(amount || "0").toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                   <p className="text-sm text-muted-foreground">via {selectedMethod.toUpperCase()}</p>
                               </div>

                               <div className="space-y-2 text-sm">
                                   <div className="flex justify-between">
                                       <span className="text-muted-foreground">From:</span>
                                       <span className="font-semibold">{selectedBank}</span>
                                   </div>
                                    <div className="flex justify-between">
                                       <span className="text-muted-foreground">Transfer Fee:</span>
                                       <span className="font-semibold">₱15.00</span>
                                   </div>
                                   <div className="flex justify-between font-bold">
                                       <span className="text-foreground">You will be debited:</span>
                                       <span className="text-foreground">₱{(parseFloat(amount || "0") + 15).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                   </div>
                               </div>
                                
                                <div className="flex gap-4">
                                    <Button variant="outline" className="w-full" onClick={() => setStep(1)}>
                                        Back
                                    </Button>
                                    <Button className="w-full" asChild>
                                      <Link href="/consumer">
                                        Proceed
                                      </Link>
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
