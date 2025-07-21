
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Banknote,
  Code2,
  Settings,
  Building,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
    { href: "/partner", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/partner/payouts", label: "Payouts", icon: Banknote },
    { href: "/partner/transactions", label: "Transactions", icon: CreditCard },
    { href: "/partner/team", label: "Team", icon: Users },
    { href: "/partner/kyb", label: "Verification", icon: ShieldCheck },
    { href: "/partner/developer", label: "Developer", icon: Code2 },
];

export default function PartnerSidebarNav({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();

  const navContent = (
    <>
      <nav className={cn("flex flex-col items-center gap-4 px-2 sm:py-5", isMobile && "items-start px-4")}>
        <Link
          href="/"
          className={cn(
            "group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base",
             isMobile && "h-auto w-auto bg-transparent text-foreground"
          )}
        >
          <Building className="h-5 w-5 transition-all group-hover:scale-110" />
          <span className={cn("sr-only", isMobile && "not-sr-only")}>CPay Partner</span>
        </Link>
        {navLinks.map((link) => {
           const isActive = link.exact ? pathname === link.href : pathname.startsWith(link.href);
           return (
           <Tooltip key={link.href}>
              <TooltipTrigger asChild>
              <Link
                  href={link.href}
                  className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                      isActive && "bg-accent text-accent-foreground",
                      isMobile && "w-full h-auto justify-start gap-2 p-2"
                  )}
              >
                  <link.icon className="h-5 w-5" />
                  <span className={cn("sr-only", isMobile && "not-sr-only")}>{link.label}</span>
              </Link>
              </TooltipTrigger>
             {!isMobile && <TooltipContent side="right">{link.label}</TooltipContent>}
          </Tooltip>
        )})}
      </nav>
      <nav className={cn("mt-auto flex flex-col items-center gap-4 px-2 sm:py-5", isMobile && "items-start px-4")}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/partner/settings"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                 pathname.startsWith('/partner/settings') && 'bg-accent text-accent-foreground',
                 isMobile && "w-full h-auto justify-start gap-2 p-2"
              )}
            >
              <Settings className="h-5 w-5" />
              <span className={cn("sr-only", isMobile && "not-sr-only")}>Settings</span>
            </Link>
          </TooltipTrigger>
          {!isMobile && <TooltipContent side="right">Settings</TooltipContent>}
        </Tooltip>
      </nav>
    </>
  );

  if (isMobile) {
    return (
      <div className="flex h-full w-full flex-col">
        {navContent}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        {navContent}
      </aside>
    </TooltipProvider>
  );
}
