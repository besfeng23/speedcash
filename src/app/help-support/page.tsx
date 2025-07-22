
"use client";

import Link from "next/link";
import { ArrowLeft, Bot, MessageSquare, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatAssistantWidget } from "@/components/ai/chat-assistant-widget";

const faqItems = [
  { question: "How do I reset my password?", answer: "You can reset your password from the 'Account & Security' section in your profile." },
  { question: "What are the transaction limits?", answer: "For unverified accounts, the limit is ₱10,000 per day. Verified accounts have a limit of ₱100,000 per day." },
  { question: "How long do remittances take?", answer: "Remittances to South Korea are typically processed within 1-2 hours." },
];

export default function HelpSupportPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/80 px-4 py-3 backdrop-blur-sm sm:px-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/profile">
            <ArrowLeft />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="font-headline text-xl font-bold text-foreground">Help & Support</h1>
      </header>

      <main className="flex flex-1 flex-col items-center p-4">
        <div className="w-full max-w-lg space-y-6">
          <Card className="rounded-xl shadow-lg bg-primary text-primary-foreground">
            <CardHeader className="flex flex-row items-center gap-4">
              <Bot className="h-12 w-12" />
              <div>
                <CardTitle className="font-headline text-2xl">Ask Kai</CardTitle>
                <CardDescription className="text-primary-foreground/80">Our AI Assistant is available 24/7 to help you.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Have a question about a transaction, your balance, or how to use a feature? Just ask Kai. If it can&apos;t help, it will create a support ticket for our team.
              </p>
               {/* The ChatAssistantWidget is already in layout, so no need to add it here. We just guide the user to it. */}
               <Button variant="secondary" className="mt-4 w-full">Chat with Kai</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {faqItems.map((item, index) => (
                        <li key={index} className="border-b pb-4 last:border-b-0">
                            <h3 className="font-semibold">{item.question}</h3>
                            <p className="text-sm text-muted-foreground">{item.answer}</p>
                        </li>
                    ))}
                </ul>
            </CardContent>
          </Card>

          <Card>
             <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>If you need to speak with a human agent.</CardDescription>
            </CardHeader>
             <CardContent className="space-y-2">
               <Button variant="outline" className="w-full justify-start gap-3"><MessageSquare/>Chat with an agent</Button>
               <Button variant="outline" className="w-full justify-start gap-3"><LifeBuoy/>Create a support ticket</Button>
            </CardContent>
          </Card>

        </div>
      </main>
    </div>
  );
}
