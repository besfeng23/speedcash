
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApi, useApiQuery } from "@/hooks/useApi";
import { FileText, Loader2, ServerCrash } from "lucide-react";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";



const requiredDocs = [
    { id: "sec_cert", name: "SEC Certificate of Registration" },
    { id: "bir_cert", name: "BIR Certificate of Registration" },
    { id: "gis", name: "General Information Sheet (GIS)" },
    { id: "sec_cert_auth", name: "Secretary's Certificate of Authority" },
];

const associatedUsers = [
  { id: 'usr_abc', email: 'alice@partner.com', role: 'Admin', kycStatus: 'Verified' },
  { id: 'usr_def', email: 'bob@partner.com', role: 'Developer', kycStatus: 'Verified' },
  { id: 'usr_ghi', email: 'charlie@partner.com', role: 'Support', kycStatus: 'Pending Review' },
];

type KybDocument = {
    id: string;
    docType: string;
    url: string;
    status: 'UPLOADED' | 'EXPIRED' | 'REJECTED';
};

type Partner = {
    kybStatus: 'PENDING_REVIEW' | 'VERIFIED' | 'ACTION_REQUIRED';
    kybDocuments: KybDocument[];
};

export default function PartnerKycPage() {
    const params = useParams();
    const partnerId = params.partnerId as string;
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: partner, isLoading, error } = useApiQuery<Partner>(
        'adminGetPartner',
        { partnerId },
        { enabled: !!partnerId, queryKey: ['adminGetPartner', partnerId] }
    );
    
    const { call: updatePartnerStatus, isLoading: isUpdatingStatus } = useApi('adminUpdatePartnerStatus');
    
    // Create a memoized map of uploaded documents for efficient lookup
    const uploadedDocsMap = useMemo(() => {
        const map = new Map<string, KybDocument>();
        if (partner?.kybDocuments) {
            partner.kybDocuments.forEach((doc: any) => map.set(doc.id, doc));
        }
        return map;
    }, [partner?.kybDocuments]);

    const handleUpdateStatus = async (status: 'VERIFIED' | 'ACTION_REQUIRED') => {
        const reason = status === 'ACTION_REQUIRED' ? 'Admin requested re-submission of documents.' : 'All documents verified.';
        
        const result = await updatePartnerStatus({
            partnerId,
            status,
            reason,
        });

        if ((result as any)?.success) {
            toast({
                title: "Partner Status Updated",
                description: `The partner has been marked as ${status === 'VERIFIED' ? 'Verified' : 'Action Required'}.`,
            });
            queryClient.invalidateQueries({ queryKey: ['adminGetPartner', partnerId] });
             queryClient.invalidateQueries({ queryKey: ['adminPartners'] });
        }
    }

    const getDocStatus = (docId: string) => {
        const doc = uploadedDocsMap.get(docId);
        if (doc) {
            if (doc.status === 'EXPIRED') return { text: 'Expired', variant: 'destructive' as const };
            return { text: 'Uploaded', variant: 'default' as const };
        }
        return { text: 'Missing', variant: 'destructive' as const };
    };
    
    const getKybStatusVariant = () => {
        switch (partner?.kybStatus) {
            case 'VERIFIED': return 'default';
            case 'PENDING_REVIEW': return 'secondary';
            case 'ACTION_REQUIRED': return 'destructive';
            default: return 'outline';
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Business Verification (KYB) Status</CardTitle>
                            <CardDescription>Overall status of the business entity.</CardDescription>
                        </div>
                         {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                         ) : (
                            <Badge variant={getKybStatusVariant()} className="text-base px-4 py-1">
                                {partner?.kybStatus?.replace('_', ' ') || 'UNKNOWN'}
                            </Badge>
                         )}
                    </div>
                </CardHeader>
                <CardContent>
                    {error && (
                         <div className="text-center text-destructive py-8">
                            <ServerCrash className="mx-auto h-8 w-8 mb-2"/>
                            Could not load KYB documents.
                        </div>
                    )}
                    <ul className="divide-y">
                        {requiredDocs.map(doc => {
                            const status = getDocStatus(doc.id);
                            const uploadedDoc = uploadedDocsMap.get(doc.id);
                            return (
                                <li key={doc.id} className="flex items-center justify-between py-3">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-muted-foreground"/>
                                        <span className="font-medium">{doc.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant={status.variant}>{status.text}</Badge>
                                        <Button asChild variant="outline" size="sm" disabled={!uploadedDoc}>
                                           {uploadedDoc ? (
                                             <a href={uploadedDoc.url} target="_blank" rel="noopener noreferrer">View Document</a>
                                           ) : (
                                            <span>View Document</span>
                                           )}
                                        </Button>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                </CardContent>
                 <CardContent className="border-t pt-6">
                     <div className="flex justify-end gap-4">
                        <Button variant="destructive" onClick={() => handleUpdateStatus('ACTION_REQUIRED')} disabled={isUpdatingStatus}>
                           {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           Request Re-submission
                        </Button>
                        <Button onClick={() => handleUpdateStatus('VERIFIED')} disabled={isUpdatingStatus}>
                             {isUpdatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Approve Business
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Associated User KYC</CardTitle>
                    <CardDescription>Status of individual team members.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>KYC Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {associatedUsers.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.email}</TableCell>
                                    <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                                    <TableCell>
                                         <Badge variant={user.kycStatus === 'Verified' ? 'default' : user.kycStatus === 'Pending Review' ? 'secondary' : 'destructive'}>
                                            {user.kycStatus}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm">Review KYC</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
