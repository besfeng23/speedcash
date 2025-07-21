
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { ArrowLeft, Camera, Lightbulb, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function ScanPage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hasCameraPermission, setHasCameraPermission] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        const getCameraPermission = async () => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                toast({
                    variant: 'destructive',
                    title: 'Camera Not Supported',
                    description: 'Your browser does not support camera access.',
                });
                setHasCameraPermission(false);
                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                setHasCameraPermission(true);

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        setIsScanning(true);
                    };
                }
            } catch (error) {
                console.error('Error accessing camera:', error);
                setHasCameraPermission(false);
                toast({
                    variant: 'destructive',
                    title: 'Camera Access Denied',
                    description: 'Please enable camera permissions in your browser settings.',
                });
            }
        };

        getCameraPermission();

        return () => {
            if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [toast]);

    useEffect(() => {
        let animationFrameId: number;

        const scan = () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const context = canvas.getContext("2d");

                if (context) {
                    canvas.height = video.videoHeight;
                    canvas.width = video.videoWidth;
                    context.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "dontInvert",
                    });

                    if (code) {
                        setIsScanning(false);
                        const mobileNumberRegex = /^(09|\+639)\d{9}$/;
                        if (mobileNumberRegex.test(code.data)) {
                             toast({
                                title: 'QR Code Detected!',
                                description: `Redirecting to payment for ${code.data}`,
                            });
                            router.push(`/send?mobileNumber=${encodeURIComponent(code.data)}`);
                        } else {
                            toast({
                                variant: 'destructive',
                                title: 'Invalid QR Code',
                                description: 'This QR code does not contain a valid CPay mobile number.',
                            });
                             setTimeout(() => setIsScanning(true), 2000);
                        }
                    }
                }
            }
            if (isScanning) {
                animationFrameId = requestAnimationFrame(scan);
            }
        };

        if (isScanning) {
            animationFrameId = requestAnimationFrame(scan);
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isScanning, router, toast]);

    return (
        <div className="flex h-screen flex-col bg-black text-white">
            <header className="absolute top-0 z-20 flex w-full items-center justify-between p-4">
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" asChild>
                    <Link href="/consumer">
                        <ArrowLeft />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <h1 className="font-headline text-xl font-bold">Scan to Pay</h1>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white">
                    <Lightbulb />
                    <span className="sr-only">Toggle Flash</span>
                </Button>
            </header>

            <main className="relative flex-1">
                <div className="absolute inset-0">
                    <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />

                    {!hasCameraPermission && (
                        <div className="flex h-full w-full flex-col items-center justify-center bg-black/80 p-8 text-center">
                            <Camera className="h-16 w-16 text-muted-foreground mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Camera Access Required</h2>
                            <p className="text-muted-foreground">Please grant camera permissions to scan QR codes.</p>
                        </div>
                    )}
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative h-64 w-64">
                        <div className="absolute -top-1 -left-1 h-12 w-12 border-l-4 border-t-4 border-white rounded-tl-lg"></div>
                        <div className="absolute -top-1 -right-1 h-12 w-12 border-r-4 border-t-4 border-white rounded-tr-lg"></div>
                        <div className="absolute -bottom-1 -left-1 h-12 w-12 border-l-4 border-b-4 border-white rounded-bl-lg"></div>
                        <div className="absolute -bottom-1 -right-1 h-12 w-12 border-r-4 border-b-4 border-white rounded-br-lg"></div>
                    </div>
                </div>
            </main>

            <footer className="z-10 bg-black/50 p-4 text-center">
                <p className="mb-4">Point your camera at a QR code</p>
                <Button variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                    <Upload className="mr-2" />
                    Upload from Gallery
                </Button>
            </footer>
        </div>
    );
}