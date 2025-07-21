
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Copy, RefreshCw, FileText, Check, TestTube, Power, Send, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function DeveloperPage() {
  const { toast } = useToast();
  const [env, setEnv] = useState("test");
  const [secretKeyVisible, setSecretKeyVisible] = useState(false);
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: `${label} has been copied.`,
    });
  };

  const API_KEYS = {
    test: {
      public: "pk_test_a1b2c3d4e5f6g7h8i9j0k1l2",
      secret: "sk_test_z9y8x7w6v5u4t3s2r1q0p9o8",
    },
    live: {
      public: "pk_live_p0o9i8u7y6t5r4e3w2q1a0s9",
      secret: "sk_live_f1g2h3j4k5l6m7n8b9v0c8x7",
    },
  };
  
  const WEBHOOK_SIGNING_SECRET = {
    test: "whsec_test_abc123def456",
    live: "whsec_live_xyz789uvw123",
  };

  const selectedKeys = env === 'test' ? API_KEYS.test : API_KEYS.live;
  const selectedWebhookSecret = env === 'test' ? WEBHOOK_SIGNING_SECRET.test : WEBHOOK_SIGNING_SECRET.live;


  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-headline text-3xl font-bold tracking-tight">Developer Toolkit</h2>
          <p className="text-muted-foreground">Manage your API keys, webhooks, and other integration settings.</p>
        </div>
        <div className="flex items-center gap-2">
            <Tabs value={env} onValueChange={setEnv} className="w-full md:w-auto">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="test"><TestTube className="mr-2" />Test Mode</TabsTrigger>
                    <TabsTrigger value="live"><Power className="mr-2"/>Live Mode</TabsTrigger>
                </TabsList>
            </Tabs>
             <Button variant="outline"><FileText className="mr-2"/>API Docs</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>Use these keys to authenticate your API requests. Keep your secret key confidential.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Public Key</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={selectedKeys.public} className="font-mono"/>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(selectedKeys.public, 'Public Key')}><Copy/></Button>
              </div>
            </div>
             <div className="space-y-2">
              <Label>Secret Key</Label>
              <div className="flex items-center gap-2">
                <Input readOnly type={secretKeyVisible ? 'text' : 'password'} value={selectedKeys.secret} className="font-mono"/>
                <Button variant="outline" size="icon" onClick={() => setSecretKeyVisible(!secretKeyVisible)}>
                  {secretKeyVisible ? <EyeOff/> : <Eye/>}
                </Button>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(selectedKeys.secret, 'Secret Key')}><Copy/></Button>
                <Button variant="outline" size="icon"><RefreshCw/></Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhooks</CardTitle>
            <CardDescription>Configure endpoints to receive real-time event notifications from CPay.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Endpoint URL</Label>
              <div className="flex items-center gap-2">
                <Input id="webhook-url" placeholder="https://api.your-domain.com/webhooks/cpay" />
                <Button><Check className="mr-2"/>Save URL</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Webhook Signing Secret (SHA256)</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={selectedWebhookSecret} className="font-mono"/>
                 <Button variant="outline" size="icon" onClick={() => copyToClipboard(selectedWebhookSecret, 'Signing Secret')}><Copy/></Button>
              </div>
              <p className="text-xs text-muted-foreground">Use this secret to verify that webhooks are coming from CPay.</p>
            </div>
             <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                    <Label htmlFor="webhook-active">Enable Webhooks</Label>
                    <p className="text-xs text-muted-foreground">Toggle to enable or disable all webhook notifications.</p>
                </div>
                <Switch id="webhook-active" defaultChecked/>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary"><Send className="mr-2"/>Send Test Event</Button>
              <Button variant="outline" asChild>
                <a href="/partner/activity">View Delivery Logs</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
