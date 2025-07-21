
"use client";

import { useParams } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiQuery } from '@/hooks/useApi';
import { Skeleton } from '@/components/ui/skeleton';

type UserProfile = {
    id: string;
    displayName: string;
    email: string;
    mobileNumber?: string;
    kycStatus: 'VERIFIED' | 'PENDING_REVIEW' | 'BASIC' | 'REJECTED';
    createdAt?: { seconds: number, nanoseconds: number };
    address?: string; // Address might be optional
    disabled?: boolean;
    role?: string;
};



export default function UserProfilePage() {
    const params = useParams();
    const userId = params.userId as string;

    const { data: userProfile, isLoading, error } = useApiQuery<UserProfile>(
        'adminGetUser',
        { uid: userId },
        { enabled: !!userId, queryKey: ['adminGetUser', { uid: userId }] }
    );

    const getStatusVariant = (status?: string) => {
        switch (status) {
            case 'VERIFIED': return 'default';
            case 'PENDING_REVIEW': return 'secondary';
            case 'REJECTED': return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>User Profile</CardTitle>
                <CardDescription>Comprehensive details of the user's account and status.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8 text-sm">
                        {Array.from({ length: 8 }).map((_, i) => (
                             <div key={i} className="space-y-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-5 w-40" />
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <p className="text-destructive">Failed to load user profile.</p>
                ) : userProfile ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8 text-sm">
                        <div className="md:col-span-1 space-y-1">
                            <p className="text-muted-foreground">User ID</p>
                            <p className="font-mono text-xs">{userProfile.id}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Full Name</p>
                            <p className="font-medium">{userProfile.displayName}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Email Address</p>
                            <p className="font-medium">{userProfile.email}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Mobile Number</p>
                            <p className="font-medium">{userProfile.mobileNumber || 'Not provided'}</p>
                        </div>
                         <div className="space-y-1">
                            <p className="text-muted-foreground">Account Status</p>
                            <p>
                                <Badge variant={userProfile.disabled ? 'destructive' : 'default'}>
                                    {userProfile.disabled ? 'Suspended' : 'Active'}
                                </Badge>
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Role</p>
                             <p>
                                <Badge variant={userProfile.role === 'admin' || userProfile.role === 'superadmin' ? 'destructive' : 'outline'}>
                                    {userProfile.role || 'user'}
                                </Badge>
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-muted-foreground">KYC Status</p>
                            <p><Badge variant={getStatusVariant(userProfile.kycStatus)}>{userProfile.kycStatus || 'N/A'}</Badge></p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-muted-foreground">Date Joined</p>
                            <p className="font-medium">{userProfile.createdAt ? new Date(userProfile.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</p>
                        </div>
                        <div className="md:col-span-3 space-y-1">
                            <p className="text-muted-foreground">Registered Address</p>
                            <p className="font-medium">{userProfile.address || 'Not provided in KYC'}</p>
                        </div>
                    </div>
                ) : (
                    <p>User not found.</p>
                )}
            </CardContent>
        </Card>
    );
}
