
"use client";

import { History, Home, UserCircle2, Send } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/consumer", label: "Home", icon: Home },
  { href: "/history", label: "History", icon: History },
  { href: "/scan", label: "Scan", icon: Send, isFab: true },
  { href: "/receive", label: "Receive", icon: Send, isHidden: true }, // Not displayed, but keeps layout
  { href: "/profile", label: "Profile", icon: UserCircle2 },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-20 bg-background border-t">
      <div className="grid h-full grid-cols-5 max-w-lg mx-auto">
        {navItems.map((item) => {
          if (item.isHidden) {
            return <div key={item.href} />;
          }
          if (item.isFab) {
            return (
              <div key={item.href} className="flex items-center justify-center -mt-6">
                <Button asChild size="icon" className="h-16 w-16 rounded-full shadow-lg bg-primary hover:bg-primary/90">
                  <Link href={item.href}>
                    <item.icon className="h-7 w-7 text-primary-foreground" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </Button>
              </div>
            );
          }
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex flex-col items-center justify-center px-5 hover:bg-muted-foreground/10 group",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
