
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

export default function PartnerSettingsPage() {
  const { toast } = useToast();

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState("#DAA520");
  const [accentColor, setAccentColor] = useState("#FFFFFF");

  const [customDomain, setCustomDomain] = useState("portal.global-exports.com");
  const [domainStatus, setDomainStatus] = useState<'PENDING_VERIFICATION' | 'ACTIVE'>('PENDING_VERIFICATION');
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveAppearance = () => {
    toast({
      title: "Appearance Settings Saved",
      description: "Your logo and color scheme have been updated.",
    });
  };

  const handleVerifyDomain = () => {
    toast({
      title: "Domain verification re-checked",
      description: "Please allow a few hours for DNS changes to propagate.",
    });
    // In a real app, this would call a backend function.
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Branding & Domain</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column for settings */}
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of your Partner Hub to match your brand.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Your Logo</Label>
                <div className="flex items-center gap-4">
                  <Button asChild variant="outline">
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Logo
                      <input id="logo-upload" type="file" className="sr-only" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoChange} />
                    </label>
                  </Button>
                  {logoPreview && <p className="text-sm text-muted-foreground">Preview shown on the right.</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color Scheme</Label>
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className="space-y-2 flex-1 w-full">
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="relative">
                      <Input id="primary-color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="pl-12" />
                      <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-8 cursor-pointer rounded-md border-0 bg-transparent p-0" />
                    </div>
                  </div>
                  <div className="space-y-2 flex-1 w-full">
                    <Label htmlFor="accent-color">Accent Color</Label>
                    <div className="relative">
                      <Input id="accent-color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="pl-12" />
                      <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-8 cursor-pointer rounded-md border-0 bg-transparent p-0" />
                    </div>
                  </div>
                </div>
              </div>
              <Button onClick={handleSaveAppearance}>Save Appearance</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom Domain</CardTitle>
              <CardDescription>Serve the Partner Hub from your own domain.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-domain">Your Custom Domain</Label>
                <Input id="custom-domain" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} />
              </div>
              {domainStatus === 'PENDING_VERIFICATION' && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">Verify your domain</h4>
                  <p className="text-sm text-muted-foreground mb-4">To complete the setup, please add the following TXT record to your DNS settings for <strong>{customDomain}</strong>. This can take up to 24 hours to propagate.</p>
                  <div className="space-y-2 font-mono text-xs bg-background p-3 rounded-md">
                    <div>
                      <p className="font-sans text-muted-foreground font-semibold">TYPE</p>
                      <p>TXT</p>
                    </div>
                    <div>
                      <p className="font-sans text-muted-foreground font-semibold">HOST</p>
                      <p>@</p>
                    </div>
                    <div>
                      <p className="font-sans text-muted-foreground font-semibold">VALUE</p>
                      <p>firebase=cpay-partner-hub-a1b2c3</p>
                    </div>
                  </div>
                   <Button variant="outline" size="sm" className="mt-4" onClick={handleVerifyDomain}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Re-check Now
                    </Button>
                </div>
              )}
               {domainStatus === 'ACTIVE' && (
                  <div className="p-4 border-l-4 border-green-500 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600"/>
                        <p className="font-semibold text-green-800">Your domain is live and active.</p>
                      </div>
                  </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right Column for preview */}
        <div className="lg:col-span-2">
          <Card className="sticky top-4">
             <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>This is how your hub will look to your team.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="w-full rounded-lg border bg-background p-4 space-y-8" style={{
                    ['--partner-primary' as any]: primaryColor,
                    ['--partner-accent' as any]: accentColor
                }}>
                    <div className="flex items-center justify-between">
                       {logoPreview ? (
                         <Image src={logoPreview} alt="Partner Logo Preview" width={120} height={32} data-ai-hint="logo company"/>
                       ): (
                        <div className="h-8 w-32 bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground">Your Logo</div>
                       )}
                       <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-muted"></div>
                            <div className="w-20 h-4 bg-muted rounded-md"></div>
                       </div>
                    </div>
                    
                    <div className="space-y-2">
                        <h3 className="text-lg font-bold" style={{color: 'var(--partner-primary)'}}>Welcome to your portal</h3>
                        <p className="text-sm text-muted-foreground">This is a preview of your branded partner experience.</p>
                        <Button style={{
                            backgroundColor: 'var(--partner-primary)',
                            color: 'var(--partner-accent)'
                        }}>
                           Example Button
                        </Button>
                    </div>

                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
