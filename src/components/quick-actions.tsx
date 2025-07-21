
"use client";

import { ArrowDownToLine, ArrowUpFromLine, Plane, ReceiptText, Smartphone, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "./ui/card";

const moneyActions = [
  {
    label: "Send",
    icon: Wallet,
    href: "/send",
  },
  {
    label: "Remit",
    icon: Plane,
    href: "/remit",
  },
  {
    label: "Cash-In",
    icon: ArrowDownToLine,
    href: "/cash-in",
  },
  {
    label: "Withdraw",
    icon: ArrowUpFromLine,
    href: "/withdraw",
  },
];

const serviceActions = [
   {
    label: "Buy Load",
    icon: Smartphone,
    href: "/buy-load",
  },
  {
    label: "Pay Bills",
    icon: ReceiptText,
    href: "/pay-bills",
  },
];

export default function QuickActions() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h2 className="font-headline text-lg font-semibold text-foreground px-1">Money Operations</h2>
        <Card className="rounded-xl shadow-sm">
          <CardContent className="p-2">
            <div className="grid grid-cols-4 gap-1">
              {moneyActions.map((action) => (
                <Link href={action.href} key={action.label} className="flex flex-col items-center gap-2 rounded-lg p-3 text-center hover:bg-accent transition-colors">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <action.icon className="h-6 w-6" />
                  </div>
                  <span className="font-body text-xs font-medium text-foreground">{action.label}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
       <div className="space-y-3">
        <h2 className="font-headline text-lg font-semibold text-foreground px-1">Services</h2>
         <div className="grid grid-cols-2 gap-4">
            {serviceActions.map((action) => (
                <Link href={action.href} key={action.label}>
                  <Card className="rounded-xl shadow-sm hover:bg-accent transition-colors">
                    <CardContent className="p-4 flex items-center gap-4">
                       <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <action.icon className="h-5 w-5" />
                       </div>
                       <span className="font-body font-semibold text-foreground">{action.label}</span>
                    </CardContent>
                  </Card>
                </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
