
"use client";

import Link from "next/link";
import { ArrowLeft, Bell, ChevronRight, Fingerprint, HelpCircle, Lock, LogOut, ShieldCheck, ShieldAlert, Loader2, Star, Building } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useApiQuery } from "@/hooks/useApi";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type UserProfile = {
  kycStatus: "BASIC" | "PENDING_REVIEW" | "VERIFIED" | "REJECTED";
  mobileNumber: string;
};

const kycStatusConfig = {
    VERIFIED: { text: "Verified", variant: "default" as const, icon: ShieldCheck, color: "bg-green-100 text-green-800 border-green-200" },
    PENDING_REVIEW: { text: "In Review", variant: "secondary" as const, icon: Loader2, color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    REJECTED: { text: "Rejected", variant: "destructive" as const, icon: ShieldAlert, color: "bg-red-100 text-red-800 border-red-200" },
    BASIC: { text: "Unverified", variant: "destructive" as const, icon: ShieldAlert, color: "bg-red-100 text-red-800 border-red-200" },
};

export default function ProfilePage() {
    const { user, role, logout } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const { data: profile, isLoading: isProfileLoading } = useApiQuery<UserProfile>(
        "getUserProfile", 
        { uid: user?.uid },
        { enabled: !!user, queryKey: ["userProfile", user?.uid] }
    );
    
    const kycConfig = (profile?.kycStatus && kycStatusConfig[profile.kycStatus]) || kycStatusConfig.BASIC;
    const KycIcon = kycConfig.icon;
    
    const isAdmin = role === 'admin' || role === 'superadmin';
    const isPartner = role === 'partner';

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };
    
    const handleBiometricsClick = () => {
        toast({
            title: "Coming Soon!",
            description: "Biometric login is not yet available but is planned for a future update.",
        });
    };

    const menuItems = [
        { label: "Account & Security", icon: Lock, href: "/account-security" },
        { label: "Identity Verification (KYC)", icon: ShieldCheck, href: "/kyc" },
        { label: "Login with Biometrics", icon: Fingerprint, onClick: handleBiometricsClick },
        { label: "Notifications", icon: Bell, href: "#" },
        { label: "Help & Support", icon: HelpCircle, href: "/help-support" },
    ];


    return (
        <div className="flex min-h-screen flex-col bg-muted/30">
             <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/80 px-4 py-3 backdrop-blur-sm sm:px-6">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/consumer">
                        <ArrowLeft />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="font-headline text-xl font-bold text-foreground">Profile</h1>
            </header>
            
            <main className="flex-1 p-4">
                <div className="space-y-6">
                    <Card className="overflow-hidden rounded-xl shadow-sm">
                        <CardContent className="flex items-center gap-4 p-6">
                            <Avatar className="h-16 w-16">
                                <AvatarImage src={user?.photoURL || "https://placehold.co/64x64.png"} alt={user?.displayName || "User"} data-ai-hint="person avatar"/>
                                <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h2 className="font-headline text-xl font-bold">{user?.displayName || 'User Name'}</h2>
                                {isProfileLoading ? (
                                    <Skeleton className="h-5 w-32 mt-1" />
                                ) : (
                                    <p className="text-sm text-muted-foreground">{profile?.mobileNumber || user?.email || 'No contact info'}</p>
                                )}
                            </div>
                             {isProfileLoading ? (
                                <Skeleton className="h-7 w-24 rounded-full" />
                            ) : (
                                <Badge variant={kycConfig.variant} className={cn(kycConfig.color)}>
                                    <KycIcon className={cn("h-4 w-4 mr-1.5", profile?.kycStatus === 'PENDING_REVIEW' && "animate-spin")} />
                                    {kycConfig.text}
                                </Badge>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl shadow-sm">
                        <ul className="divide-y">
                           {menuItems.map((item) => {
                                const isLink = 'href' in item && item.href !== '#';
                                const isAction = 'onClick' in item;

                                const content = (
                                    <>
                                        <item.icon className="h-6 w-6 text-muted-foreground" />
                                        <span className="ml-4 flex-1 font-medium">{item.label}</span>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </>
                                );

                                return (
                                <li key={item.label}>
                                    {isLink ? (
                                        <Link href={item.href!} className="flex w-full items-center p-4 text-left hover:bg-muted/50">
                                            {content}
                                        </Link>
                                    ) : (
                                        <button
                                            onClick={isAction ? item.onClick : undefined}
                                            className="flex w-full items-center p-4 text-left hover:bg-muted/50 disabled:opacity-50"
                                        >
                                           {content}
                                        </button>
                                    )}
                                </li>
                                );
                           })}
                        </ul>
                    </Card>
                    
                    {(isAdmin || isPartner) && (
                      <Card className="rounded-xl shadow-sm">
                          <ul className="divide-y">
                            {isAdmin && (
                                <li>
                                    <Link href="/admin" className="flex items-center p-4 hover:bg-muted/50">
                                        <Star className="h-6 w-6 text-primary" />
                                        <span className="ml-4 flex-1 font-semibold text-primary">Admin Panel</span>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </Link>
                                </li>
                           )}
                           {isPartner && (
                                <li>
                                    <Link href="/partner" className="flex items-center p-4 hover:bg-muted/50">
                                        <Building className="h-6 w-6 text-primary" />
                                        <span className="ml-4 flex-1 font-semibold text-primary">Partner Portal</span>
                                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                    </Link>
                                </li>
                           )}
                          </ul>
                      </Card>
                    )}

                     <Card className="rounded-xl shadow-sm">
                        <CardContent className="p-4">
                            <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                                <LogOut className="mr-4"/>
                                Log Out
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
