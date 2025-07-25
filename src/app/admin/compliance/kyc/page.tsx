
"use client";

import React, { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileCheck2, Bot, Loader2, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Skeleton } from "@/components/ui/skeleton";
import { app } from "@/lib/firebase";
import { useApi, useApiQuery } from "@/hooks/useApi";
import { ApiCallableResult } from "@/types/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// AI flows for KYC processing - commented out as not currently used
// const kycDataExtraction = async (documentUrl: string): Promise<KycDataExtractionOutput> => {
//   console.log('Extracting KYC data from:', documentUrl);
//   
//   // Simulate AI processing
//   await new Promise(resolve => setTimeout(resolve, 2000));
//   
//   return {
//     fullName: 'John Doe',
//     dateOfBirth: '1990-01-01',
//     address: '123 Main St, City, Country',
//     documentType: 'PASSPORT',
//     confidence: 0.92,
//     extractedFields: {
//       name: 'John Doe',
//       dob: '1990-01-01',
//       address: '123 Main St, City, Country',
//       documentNumber: 'ABC123456'
//     }
//   };
// };

// const analyzeKycDocument = async (documentUrl: string): Promise<DocumentAnalysisResult> => {
//   console.log('Analyzing KYC document:', documentUrl);
//   
//   // Simulate AI processing
//   await new Promise(resolve => setTimeout(resolve, 1500));
//   
//   return {
//     isValid: true,
//     documentType: 'PASSPORT',
//     authenticity: 0.95,
//     quality: 0.88,
//     issues: [],
//     recommendations: ['Document appears genuine', 'Good image quality']
//   };
// };

type KycDataExtractionOutput = {
  fullName: string;
  dateOfBirth: string;
  address: string;
  documentType: string;
  confidence: number;
  extractedFields: Record<string, string>;
};

type DocumentAnalysisResult = {
  isValid: boolean;
  documentType: string;
  authenticity: number;
  quality: number;
  issues: string[];
  recommendations: string[];
};

const storage = getStorage(app);

type Submission = {
  id: string;
  subjectName: string;
  subjectId: string;
  type: string;
  submittedAt: { seconds: number; nanoseconds: number; };
  status: string;
  fullName: string;
  dateOfBirth: string;
  address: string;
  documentUrls: string[];
};

export default function KycQueuePage() {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<DocumentAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useApiQuery<{ submissions: Submission[] }>(
    'adminGetKycQueue',
    { limit: 50 }
  );

  // Update selected submission if it no longer exists in the data
  React.useEffect(() => {
    if (data && selectedSubmission) {
      const stillExists = data.submissions.find((s: Submission) => s.id === selectedSubmission.id);
      if (!stillExists) {
        setSelectedSubmission(null);
      }
    }
  }, [data, selectedSubmission]);

  const kycSubmissions = data?.submissions;


  const updateKycStatusMutation = useApi('adminUpdateKycStatus');
  const addKycDocumentMutation = useApi('addKycDocument');
  const deleteKycDocumentMutation = useApi('adminDeleteKycDocument');


  const handleApproveReject = async (id: string | undefined, status: 'VERIFIED' | 'REJECTED') => {
    if (!id) return;
    const result = await updateKycStatusMutation.mutateAsync({ uid: id, status: status, rejectionReason: status === 'REJECTED' ? 'Documents unclear.' : undefined });
    if((result as ApiCallableResult)?.success) {
        toast({ title: "Status Updated", description: `The KYC status has been ${status.toLowerCase()}.` });
        queryClient.invalidateQueries({ queryKey: ['adminKycQueue'] });
        queryClient.invalidateQueries({ queryKey: ['adminGetDashboardStats'] });
    }
  };

  const handleSelectSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setAiAnalysisResult(null);
    setIsAnalyzing(false);
  }

  const handleAnalyzeDocument = async (_docUrl: string, _docType: string) => {
    setIsAnalyzing(true);
    setAiAnalysisResult(null);
    try {
      // This part of the code was commented out as analyzeKycDocument is not imported
      // const result = await analyzeKycDocument({ docUrl, docType });
      // setAiAnalysisResult(result);
      toast({
        variant: "destructive",
        title: "AI Analysis Not Available",
        description: "AI document analysis functionality is currently unavailable.",
      });
    } catch (error) {
      console.error("AI Analysis failed:", error);
      toast({
        variant: "destructive",
        title: "AI Analysis Failed",
        description: "Could not analyze the document. Please check the function logs.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteDocument = async (docUrl: string) => {
    if (!selectedSubmission) return;
    try {
        await deleteKycDocumentMutation.mutateAsync({ userId: selectedSubmission.subjectId, docUrl });
        toast({ title: "Document Deleted", description: "The document has been successfully removed." });
        queryClient.invalidateQueries({ queryKey: ['adminKycQueue'] });

    } catch (_e) {
        toast({ variant: "destructive", title: "Deletion Failed", description: "Could not delete the document." });
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && selectedSubmission) {
          const file = e.target.files[0];
          try {
              const storageRef = ref(storage, `kyc-documents/${selectedSubmission.subjectId}/${file.name}`);
              await uploadBytes(storageRef, file);
              const downloadURL = await getDownloadURL(storageRef);

              await addKycDocumentMutation.mutateAsync({ userId: selectedSubmission.subjectId, docUrl: downloadURL });

              toast({ title: "Upload Complete", description: "New document has been added to the submission." });
              queryClient.invalidateQueries({ queryKey: ['adminKycQueue'] });

          } catch (error) {
              console.error("Upload failed", error);
              toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload the new document." });
          }
      }
  };


  return (
    <div className="flex min-h-screen">
      <div className="w-full lg:w-1/3 border-r">
        <div className="p-4 space-y-2">
            <h2 className="font-headline text-2xl font-bold tracking-tight">Review Queue</h2>
            <p className="text-muted-foreground">Select a submission to review.</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32"/></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full"/></TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow><TableCell colSpan={2} className="text-center text-destructive">Failed to load queue.</TableCell></TableRow>
            ) : kycSubmissions && kycSubmissions.length > 0 ? (
              kycSubmissions.map((sub) => (
              <TableRow 
                key={sub.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSelectSubmission(sub)}
                data-state={selectedSubmission?.id === sub.id ? 'selected' : ''}
              >
                <TableCell className="font-medium">{sub.subjectName}</TableCell>
                <TableCell><Badge variant="secondary">{sub.type}</Badge></TableCell>
              </TableRow>
            ))) : (
                <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">Queue is clear.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex-1 p-6">
        {selectedSubmission ? (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Review: {selectedSubmission.subjectName}</CardTitle>
              <CardDescription>Verify the submitted information and documents.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 rounded-lg border bg-background p-4">
                  <h3 className="font-semibold">Submitted Data</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <React.Fragment>
                      <p className="text-muted-foreground">Full Name:</p>
                      <p className="font-medium">{selectedSubmission.fullName}</p>
                      <p className="text-muted-foreground">Date of Birth:</p>
                      <p className="font-medium">{selectedSubmission.dateOfBirth}</p>
                      <p className="text-muted-foreground">Address:</p>
                      <p className="font-medium">{selectedSubmission.address}</p>
                      <p className="text-muted-foreground">User ID:</p>
                      <p className="font-medium font-mono text-xs">{selectedSubmission.subjectId}</p>
                    </React.Fragment>
                  </div>
                </div>

                <div className="space-y-4 rounded-lg border bg-background p-4">
                  <h3 className="font-semibold">AI Analysis Result</h3>
                  {isAnalyzing ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="ml-2 text-muted-foreground">Analyzing document...</p>
                    </div>
                  ) : aiAnalysisResult ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                       {Object.entries(aiAnalysisResult).map(([key, value]) => (
                        <React.Fragment key={key}>
                          <p className="text-muted-foreground">{key}:</p>
                          <p className="font-medium">{String(value)}</p>
                        </React.Fragment>
                      ))}
                      <p className="text-muted-foreground">Confidence:</p>
                      <p className="font-medium">
                        {/* Confidence score is not available in the current AI flow, so this will be empty */}
                        <Badge variant="secondary">N/A</Badge>
                      </p>
                    </div>
                  ) : (
                     <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      <p>Click "Analyze with AI" on a document to see results here.</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />
              
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Uploaded Documents</h3>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/png, image/jpeg, application/pdf"/>
                    <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={addKycDocumentMutation.isPending}>
                        {addKycDocumentMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Upload className="mr-2 h-4 w-4"/>}
                        Upload Document
                    </Button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(selectedSubmission.documentUrls || []).map((docUrl, i) => (
                    <Card key={docUrl} className="p-2 group">
                      <div className="rounded-lg border text-center aspect-video flex items-center justify-center bg-muted overflow-hidden">
                        <img src={docUrl} alt={`Document ${i+1}`} className="max-h-full max-w-full object-contain" data-ai-hint='id document' />
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Button 
                          size="sm" 
                          className="w-full" 
                          onClick={() => handleAnalyzeDocument(docUrl, "ID Document")}
                          disabled={isAnalyzing}
                        >
                          <Bot className="mr-2 h-4 w-4"/>
                          Analyze
                        </Button>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive" className="w-full" disabled={deleteKycDocumentMutation.isPending}>
                                    {deleteKycDocumentMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the document from the submission.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteDocument(docUrl)}>
                                        Continue
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </Card>
                  ))}
                 </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                  <Button variant="destructive" onClick={() => handleApproveReject(selectedSubmission.id, 'REJECTED')} disabled={updateKycStatusMutation.isPending || isAnalyzing}>
                    {(updateKycStatusMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Reject
                  </Button>
                  <Button onClick={() => handleApproveReject(selectedSubmission.id, 'VERIFIED')} disabled={updateKycStatusMutation.isPending || isAnalyzing}>
                    {(updateKycStatusMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Approve
                  </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
             {isLoading ? (
                <>
                    <Loader2 className="h-16 w-16 mb-4 animate-spin text-primary"/>
                    <h3 className="text-xl font-semibold">Loading Queue...</h3>
                    <p>Fetching the latest submissions.</p>
                </>
            ) : (
                <>
                    <FileCheck2 className="h-16 w-16 mb-4"/>
                    <h3 className="text-xl font-semibold">Queue Clear!</h3>
                    <p>There are no pending submissions to review right now.</p>
                </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
