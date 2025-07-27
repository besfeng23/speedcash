
"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Loader2, Upload, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useApi, useApiQuery } from "@/hooks/useApi";
import { useAuth } from "@/hooks/useAuth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

const storage = getStorage(app);

const requiredDocs = [
    { id: "sec_cert", name: "SEC Certificate of Registration" },
    { id: "bir_cert", name: "BIR Certificate of Registration (2303)" },
    { id: "gis", name: "General Information Sheet (GIS)" },
    { id: "sec_cert_auth", name: "Secretary's Certificate of Authority" },
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

export default function PartnerKybPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

    const { data: partner } = useApiQuery<Partner>(
        'partnerGetProfile',
        undefined,
        { enabled: !!user, queryKey: ['partnerGetProfile'] }
    );
    
    const submitDocumentMutation = useApi('partnerSubmitKybDocument');

    const uploadedDocsMap = useMemo(() => {
        const map = new Map<string, KybDocument>();
        if (partner?.kybDocuments) {
            partner.kybDocuments.forEach((doc: KybDocument) => map.set(doc.id, doc));
        }
        return map;
    }, [partner?.kybDocuments]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, docId: string, docName: string) => {
        if (!e.target.files || !e.target.files[0] || !user) return;
        
        const file = e.target.files[0];
        setUploadingDocId(docId);

        try {
            const storageRef = ref(storage, `kyb-documents/${user.uid}/${docId}-${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            
            await submitDocumentMutation.mutateAsync({
                docId: docId,
                docType: docName,
                url: downloadURL,
            });

            toast({ title: "Document Uploaded", description: `${docName} has been submitted for review.` });
            // refetch(); // This line was removed as per the edit hint

        } catch (error) {
            console.error("Upload failed", error);
            toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload the document." });
        } finally {
            setUploadingDocId(null);
            if (e.target) {
              e.target.value = ''; // Reset file input
            }
        }
    };
    
    const kybStatus = partner?.kybStatus || 'ACTION_REQUIRED';
    
    const getStatusCard = () => {
        switch(kybStatus) {
            case 'VERIFIED':
                return (
                     <div className="p-4 border-l-4 border-green-500 bg-green-50/50 rounded-lg flex items-center gap-4">
                        <CheckCircle className="h-8 w-8 text-green-600"/>
                        <div>
                            <h3 className="font-semibold text-green-800">Your business is verified!</h3>
                            <p className="text-sm text-green-700">All features are unlocked. No further action is needed.</p>
                        </div>
                    </div>
                )
            case 'PENDING_REVIEW':
                return (
                    <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50/50 rounded-lg flex items-center gap-4">
                        <Loader2 className="h-8 w-8 text-yellow-600 animate-spin"/>
                        <div>
                            <h3 className="font-semibold text-yellow-800">Your documents are under review.</h3>
                            <p className="text-sm text-yellow-700">This typically takes 2-3 business days. We will notify you of any updates.</p>
                        </div>
                    </div>
                )
            case 'ACTION_REQUIRED':
                 return (
                    <div className="p-4 border-l-4 border-destructive bg-destructive/10 rounded-lg flex items-center gap-4">
                        <AlertTriangle className="h-8 w-8 text-destructive"/>
                        <div>
                            <h3 className="font-semibold text-destructive">Action Required</h3>
                            <p className="text-sm text-destructive/90">Please upload all required documents to begin the verification process.</p>
                        </div>
                    </div>
                )
        }
    }


    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <h2 className="font-headline text-3xl font-bold tracking-tight">Business Verification (KYB)</h2>
            <Card>
                <CardHeader>
                    <CardTitle>KYB Status</CardTitle>
                    <CardDescription>
                       Submit your business documents to get verified and unlock all platform features.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* isPartnerLoading ? <Skeleton className="h-20 w-full"/> : */} getStatusCard()
                    {getStatusCard()}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                     <CardTitle>Required Documents</CardTitle>
                     <CardDescription>Upload a clear, valid copy for each of the documents listed below.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* isPartnerLoading ? (
                        <div className="space-y-4">
                            {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-12 w-full"/>)}
                        </div>
                    ) : ( */}
                        <ul className="divide-y">
                            {requiredDocs.map(doc => {
                                const uploadedDoc = uploadedDocsMap.get(doc.id);
                                const isCurrentlyUploading = uploadingDocId === doc.id;
                                return (
                                    <li key={doc.id} className="flex flex-col md:flex-row items-start md:items-center justify-between py-4 gap-4">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-muted-foreground"/>
                                            <span className="font-medium">{doc.name}</span>
                                        </div>
                                        <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                                            {uploadedDoc ? (
                                                <>
                                                    <Badge variant="default"><CheckCircle className="mr-2 h-4 w-4"/>Uploaded</Badge>
                                                    <Button asChild variant="secondary" size="sm">
                                                        <Link href={uploadedDoc.url} target="_blank" rel="noopener noreferrer">View</Link>
                                                    </Button>
                                                </>
                                            ) : (
                                                 <Badge variant="destructive">Missing</Badge>
                                            )}
                                            <Button asChild variant="outline" size="sm" className="w-full md:w-auto">
                                                <label htmlFor={doc.id} className="cursor-pointer">
                                                     {isCurrentlyUploading ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                                     ) : (
                                                        <Upload className="mr-2 h-4 w-4"/>
                                                     )}
                                                    {uploadedDoc ? "Re-upload" : "Upload"}
                                                    <input id={doc.id} type="file" className="sr-only" onChange={(e) => handleFileChange(e, doc.id, doc.name)} disabled={isCurrentlyUploading}/>
                                                </label>
                                            </Button>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    {/* ) */}
                </CardContent>
            </Card>
        </div>
    );
}

    