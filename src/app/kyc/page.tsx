
"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useApi } from "@/hooks/useApi";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";

const kycSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter a valid date (YYYY-MM-DD)."),
  address: z.string().min(10, "Address seems too short."),
});

type KycFormValues = z.infer<typeof kycSchema>;

const storage = getStorage(app);

export default function KycPage() {
    const [step, setStep] = useState(1);
    const [documentUrl, setDocumentUrl] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { user } = useAuth();
    
    const form = useForm<KycFormValues>({
        resolver: zodResolver(kycSchema),
        defaultValues: {
            fullName: "",
            dateOfBirth: "",
            address: "",
        },
    });
    
    const submitKycMutation = useApi('submitKyc');

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && user) {
            const file = e.target.files[0];
            setIsUploading(true);
            let timeoutId: NodeJS.Timeout | null = null;
            try {
                // Add a 30s timeout to prevent infinite loading
                const uploadPromise = (async () => {
                    const storageRef = ref(storage, `kyc-documents/${user.uid}/${file.name}`);
                    await uploadBytes(storageRef, file);
                    const downloadURL = await getDownloadURL(storageRef);
                    setDocumentUrl(downloadURL);
                })();
                timeoutId = setTimeout(() => {
                    setIsUploading(false);
                    form.setError("root", { message: "Upload timed out. Please try again or check your connection." });
                }, 30000);
                await uploadPromise;
                if (timeoutId) clearTimeout(timeoutId);
            } catch (error) {
                if (timeoutId) clearTimeout(timeoutId);
                console.error("Upload failed", error);
                form.setError("root", { message: "File upload failed. Please try again." });
            } finally {
                setIsUploading(false);
            }
        }
    };
    
    const onSubmit: SubmitHandler<KycFormValues> = async (data) => {
        if (!documentUrl) {
            form.setError("root", { message: "Please upload a document."});
            return;
        }

        const result = await submitKycMutation.mutateAsync({
            ...data,
            documentUrls: [documentUrl],
        });

        if ((result as any)?.success) {
            setStep(3);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <header className="sticky top-0 z-10 flex items-center gap-4 border-b bg-background/80 px-4 py-3 backdrop-blur-sm sm:px-6">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/consumer">
                        <ArrowLeft />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="font-headline text-xl font-bold text-foreground">Identity Verification</h1>
            </header>

            <main className="flex flex-1 flex-col items-center justify-center p-4">
                <div className="w-full max-w-md space-y-4">
                     <Progress value={(step / 3) * 100} className="h-2" />
                     
                    {step === 1 && (
                        <Card className="rounded-xl shadow-lg">
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl">Personal Details</CardTitle>
                                <CardDescription>Please enter your information exactly as it appears on your official documents.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(() => setStep(2))} className="space-y-6">
                                        <FormField
                                            control={form.control}
                                            name="fullName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Full Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Juan dela Cruz" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="dateOfBirth"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Date of Birth</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                         <FormField
                                            control={form.control}
                                            name="address"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Full Address</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="123 Rizal St, Metro Manila" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <Button type="submit" className="w-full" size="lg">Continue</Button>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    )}

                    {step === 2 && (
                        <Card className="rounded-xl shadow-lg">
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl">Upload Document</CardTitle>
                                <CardDescription>Upload a clear photo of a valid government-issued ID (e.g., Passport, Driver's License).</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed p-12">
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                            <p className="text-muted-foreground">Uploading document...</p>
                                        </>
                                    ) : documentUrl ? (
                                        <>
                                            <CheckCircle className="h-10 w-10 text-green-500" />
                                            <p className="text-muted-foreground">Document uploaded successfully!</p>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-10 w-10 text-muted-foreground" />
                                            <p className="text-center text-muted-foreground">Drag & drop your file here or</p>
                                            <Button asChild variant="outline">
                                                <label htmlFor="doc-upload" className="cursor-pointer">
                                                    Browse Files
                                                    <input id="doc-upload" type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handleFileChange} />
                                                </label>
                                            </Button>
                                        </>
                                    )}
                                </div>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)}>
                                        {form.formState.errors.root && (
                                            <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
                                        )}
                                        <div className="flex gap-4 pt-2">
                                            <Button variant="outline" className="w-full" onClick={() => setStep(1)} disabled={submitKycMutation.isPending}>Back</Button>
                                            <Button type="submit" className="w-full" disabled={!documentUrl || submitKycMutation.isPending}>
                                                {submitKycMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                Submit for Review
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    )}
                    
                    {step === 3 && (
                        <Card className="rounded-xl shadow-lg">
                            <CardHeader className="items-center text-center">
                                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                                <CardTitle className="font-headline text-2xl">Submission Complete!</CardTitle>
                                <CardDescription>Your documents have been submitted for review. You will be notified once the process is complete, typically within 1-2 business days.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button className="w-full" size="lg" asChild>
                                    <Link href="/consumer">Back to Dashboard</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
