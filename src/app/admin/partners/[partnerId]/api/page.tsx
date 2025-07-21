
"use client";

import { useState } from "react";
import { useApiQuery } from "@/hooks/useApi";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Eye, EyeOff, RefreshCw, Send, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type PartnerData = {
  apiKeys: {
    live: { publishable: string; secret: string; };
    test: { publishable: string; secret: string; };
  };
  webhookConfig: {
    url?: string;
    secret: string;
  };
};



export default function PartnerApiPage() {
    const params = useParams();
    const partnerId = params.partnerId as string;
    const [secretKeyVisible, setSecretKeyVisible] = useState(false);
    const { toast } = useToast();

    const { data: partner, isLoading } = useApiQuery<PartnerData>(
        'adminGetPartner',
        { partnerId },
        { enabled: !!partnerId, queryKey: ['adminGetPartner', partnerId] }
    );

    const apiKeys = partner?.apiKeys;
    const webhookConfig = partner?.webhookConfig;

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({
        title: "Copied to Clipboard",
        description: `${label} has been copied.`,
        });
    };

    const handleNotImplemented = () => {
        toast({
            title: "Feature Coming Soon",
            description: "This functionality is not yet implemented.",
        });
    }

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <Card><CardHeader><Skeleton className="h-6 w-32"/></CardHeader><CardContent className="space-y-4"><Skeleton className="h-24 w-full"/></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-32"/></CardHeader><CardContent className="space-y-4"><Skeleton className="h-24 w-full"/></CardContent></Card>
                </div>
                 <div className="space-y-6">
                    <Card><CardHeader><Skeleton className="h-6 w-32"/></CardHeader><CardContent className="space-y-4"><Skeleton className="h-24 w-full"/></CardContent></Card>
                </div>
            </div>
        );
    }
    
    if (!partner) {
        return <p>Could not load partner data.</p>
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>API Keys</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                        <Label>Publishable Key</Label>
                        <div className="flex items-center gap-2">
                            <Input readOnly value={apiKeys?.live?.publishable || "N/A"} className="font-mono"/>
                            <Button variant="outline" size="icon" onClick={() => copyToClipboard(apiKeys?.live?.publishable || '', 'Publishable Key')}><Copy/></Button>
                        </div>
                        </div>
                        <div className="space-y-2">
                        <Label>Secret Key</Label>
                        <div className="flex items-center gap-2">
                            <Input readOnly type={secretKeyVisible ? "text" : "password"} value={apiKeys?.live?.secret || "N/A"} className="font-mono"/>
                            <Button variant="outline" size="icon" onClick={() => setSecretKeyVisible(!secretKeyVisible)}>
                                {secretKeyVisible ? <EyeOff/> : <Eye/>}
                            </Button>
                            <Button variant="destructive" size="icon" onClick={handleNotImplemented}><RefreshCw/></Button>
                        </div>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>API Endpoints</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Live Endpoint</Label>
                             <div className="flex items-center gap-2">
                                <Input readOnly defaultValue="https://api.cpay.com/v1" className="font-mono"/>
                                <Button variant="outline" size="icon" onClick={() => copyToClipboard('https://api.cpay.com/v1', 'Live Endpoint')}><Copy/></Button>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label>Test Endpoint</Label>
                             <div className="flex items-center gap-2">
                                <Input readOnly defaultValue="https://api.test.cpay.com/v1" className="font-mono"/>
                                <Button variant="outline" size="icon" onClick={() => copyToClipboard('https://api.test.cpay.com/v1', 'Test Endpoint')}><Copy/></Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

             {/* Right Column */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Webhook Settings</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Webhook Endpoint URL</Label>
                            <Input readOnly value={webhookConfig?.url || "Not configured"} className="font-mono"/>
                        </div>
                         <div className="space-y-2">
                            <Label>Webhook Signing Secret (SHA256)</Label>
                             <div className="flex items-center gap-2">
                                <Input readOnly type="password" value={webhookConfig?.secret || "N/A"} className="font-mono"/>
                                <Button variant="outline" size="icon" onClick={() => copyToClipboard(webhookConfig?.secret || '', 'Webhook Secret')}><Eye/></Button>
                            </div>
                        </div>
                        <Button variant="secondary" onClick={handleNotImplemented}>
                            <Send className="mr-2 h-4 w-4" />
                            Send Test Webhook
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
