
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle, Loader2 } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { hexToHsl } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useApi } from "@/hooks/useApi";

const partners = [
  { id: 'prt_4d5e6f', businessName: 'Global Exports Co.' },
  { id: 'prt_1a2b3c', businessName: 'SuperMart Inc.' },
];

export default function SettingsPage() {
  const [appName, setAppName] = useState("CPay");
  const [logoPreview, setLogoPreview] = useState<string | null>("https://placehold.co/128x32.png");
  const [primaryColor, setPrimaryColor] = useState("#2E3192");
  const [accentColor, setAccentColor] = useState("#72BCD4");
  const { toast } = useToast();

  // State for partner whitelabeling
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [partnerCustomDomain, setPartnerCustomDomain] = useState('');
  const [domainStatus, setDomainStatus] = useState<'Not Configured' | 'Pending' | 'Active'>('Not Configured');
  const [partnerLogoUrl, setPartnerLogoUrl] = useState<string | null>(null);
  const [partnerPrimaryColor, setPartnerPrimaryColor] = useState('#DAA520');
  const [partnerAccentColor, setPartnerAccentColor] = useState('#FFFFFF');
  
  const updateSettingsMutation = useApi('adminUpdatePlatformSettings');

  useEffect(() => {
    // This effect applies the global theme color changes instantly for preview
    if (primaryColor) {
      try {
        const hsl = hexToHsl(primaryColor);
        document.documentElement.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      } catch (e) {
        console.error("Invalid primary color");
      }
    }
    if (accentColor) {
      try {
        const hsl = hexToHsl(accentColor);
        document.documentElement.style.setProperty('--accent', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
      } catch(e) {
        console.error("Invalid accent color");
      }
    }
  }, [primaryColor, accentColor]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>, isPartner: boolean) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const setPreview = isPartner ? setPartnerLogoUrl : setLogoPreview;
      setPreview(URL.createObjectURL(file));
      // In a real app, you would upload the file to storage here and get a URL.
      // For now, we'll just use the object URL for preview.
    }
  };

  const handleSaveChanges = async () => {
    // In a real app, the logo would be uploaded first to get a persistent URL.
    const result = await updateSettingsMutation.mutateAsync({
        appName,
        logoUrl: 'https://placehold.co/128x32.png', // Using placeholder as we don't have real upload
        primaryColor,
        accentColor,
    });
    
    if ((result as any)?.success) {
      toast({
        title: "Changes Saved",
        description: "Global branding settings have been updated.",
      });
    }
  };
  
  const handleVerifyDomain = () => {
      if (!partnerCustomDomain) {
          toast({ variant: "destructive", title: "Missing Domain", description: "Please enter a custom domain name." });
          return;
      }
      setDomainStatus('Pending');
      toast({
          title: "Domain Verification Started",
          description: `Verification process initiated for ${partnerCustomDomain}.`,
      });
      // In a real app, this would call admin_verifyPartnerDomain
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Platform Settings</h2>
        <Button onClick={handleSaveChanges} disabled={updateSettingsMutation.isPending}>
            {updateSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Save All Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Global Branding</CardTitle>
            <CardDescription>Customize the name and logo for the main CPay application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="app-name">Application Name</Label>
              <Input
                id="app-name"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Application Logo</Label>
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-32 rounded-md border p-2">
                  {logoPreview ? (
                     <Image src={logoPreview} alt="Logo preview" layout="fill" objectFit="contain" data-ai-hint="logo company" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                      No Logo
                    </div>
                  )}
                </div>
                <Button asChild variant="outline">
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Logo
                    <input id="logo-upload" type="file" className="sr-only" accept="image/png, image/jpeg, image/svg+xml" onChange={(e) => handleLogoChange(e, false)} />
                  </label>
                </Button>
              </div>
            </div>
             <div className="space-y-2">
                <Label>Global Color Scheme</Label>
                 <div className="flex items-center gap-4">
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="relative">
                      <Input id="primary-color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="pl-12"/>
                      <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-8 cursor-pointer rounded-md border-0 bg-transparent p-0"/>
                    </div>
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="accent-color">Accent Color</Label>
                     <div className="relative">
                      <Input id="accent-color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="pl-12"/>
                      <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-8 cursor-pointer rounded-md border-0 bg-transparent p-0"/>
                    </div>
                  </div>
                </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Partner Whitelabeling</CardTitle>
            <CardDescription>Manage custom branding and domains for specific partners.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="partner-select">Select a Partner</Label>
              <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                  <SelectTrigger id="partner-select">
                      <SelectValue placeholder="Select a partner to configure..." />
                  </SelectTrigger>
                  <SelectContent>
                      {partners.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                              {p.businessName}
                          </SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>
            
            {selectedPartner && (
              <>
                <Separator/>
                <div className="space-y-4">
                    <Label>Custom Domain</Label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <Input placeholder="portal.partnercompany.com" value={partnerCustomDomain} onChange={(e) => setPartnerCustomDomain(e.target.value)} />
                        <Button onClick={handleVerifyDomain} className="w-full sm:w-auto">Save & Verify</Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label>Status:</Label>
                        <Badge variant={domainStatus === 'Active' ? 'default' : domainStatus === 'Pending' ? 'secondary' : 'destructive'}>{domainStatus}</Badge>
                    </div>
                    {domainStatus === 'Pending' && 
                        <div className="text-xs p-2 bg-muted rounded-md font-mono">
                            <p className="font-sans font-semibold mb-1">Add this TXT record to your DNS settings:</p>
                            <p>Host: _firebase.{partnerCustomDomain}</p>
                            <p>Value: "d9a8c7b6e5f4d3c2b1a0"</p>
                        </div>
                    }
                </div>
                 <div className="space-y-4">
                    <Label>Partner Branding</Label>
                     <div className="flex items-center gap-4">
                        <Button asChild variant="outline" size="sm">
                          <label htmlFor="partner-logo-upload" className="cursor-pointer">
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Logo
                            <input id="partner-logo-upload" type="file" className="sr-only" accept="image/png, image/jpeg, image/svg+xml" onChange={(e) => handleLogoChange(e, true)} />
                          </label>
                        </Button>
                        {partnerLogoUrl && <Image src={partnerLogoUrl} alt="Partner Logo" width={96} height={32} data-ai-hint="logo company"/>}
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="space-y-2 flex-1">
                            <Label htmlFor="partner-primary-color">Primary</Label>
                            <div className="relative">
                              <Input id="partner-primary-color" value={partnerPrimaryColor} onChange={(e) => setPartnerPrimaryColor(e.target.value)} className="pl-12"/>
                              <input type="color" value={partnerPrimaryColor} onChange={(e) => setPartnerPrimaryColor(e.target.value)} className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-8 cursor-pointer rounded-md border-0 bg-transparent p-0"/>
                            </div>
                        </div>
                        <div className="space-y-2 flex-1">
                            <Label htmlFor="partner-accent-color">Accent</Label>
                            <div className="relative">
                              <Input id="partner-accent-color" value={partnerAccentColor} onChange={(e) => setPartnerAccentColor(e.target.value)} className="pl-12"/>
                              <input type="color" value={partnerAccentColor} onChange={(e) => setPartnerAccentColor(e.target.value)} className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-8 cursor-pointer rounded-md border-0 bg-transparent p-0"/>
                            </div>
                        </div>
                    </div>
                </div>
              </>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
