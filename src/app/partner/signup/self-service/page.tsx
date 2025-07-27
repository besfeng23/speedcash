"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/hooks/useApi";
import { Building2, Mail, Phone, MapPin, FileText, Shield, CheckCircle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BusinessType {
  value: string;
  label: string;
  description: string;
  requiredDocs: string[];
}

const businessTypes: BusinessType[] = [
  {
    value: "sole_proprietorship",
    label: "Sole Proprietorship",
    description: "Individual business owner",
    requiredDocs: ["DTI Registration", "BIR Certificate", "Valid ID"]
  },
  {
    value: "partnership",
    label: "Partnership",
    description: "Business owned by two or more partners",
    requiredDocs: ["DTI Registration", "Partnership Agreement", "BIR Certificate", "Valid IDs"]
  },
  {
    value: "corporation",
    label: "Corporation",
    description: "Registered corporation or company",
    requiredDocs: ["SEC Registration", "Articles of Incorporation", "BIR Certificate", "Board Resolution"]
  }
];

export default function SelfServicePartnerSignup() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    email: "",
    mobileNumber: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    website: "",
    description: "",
    expectedVolume: "",
    acceptTerms: false,
    acceptPrivacy: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createPartnerMutation = useApi('createPartner');

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.businessName.trim()) newErrors.businessName = "Business name is required";
      if (!formData.businessType) newErrors.businessType = "Business type is required";
      if (!formData.email.trim()) newErrors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
      if (!formData.mobileNumber.trim()) newErrors.mobileNumber = "Mobile number is required";
      else if (!/^\+?[0-9]{10,15}$/.test(formData.mobileNumber.replace(/\s/g, ''))) {
        newErrors.mobileNumber = "Invalid mobile number format";
      }
    }

    if (currentStep === 2) {
      if (!formData.address.trim()) newErrors.address = "Address is required";
      if (!formData.city.trim()) newErrors.city = "City is required";
      if (!formData.province.trim()) newErrors.province = "Province is required";
      if (!formData.postalCode.trim()) newErrors.postalCode = "Postal code is required";
    }

    if (currentStep === 3) {
      if (!formData.acceptTerms) newErrors.acceptTerms = "You must accept the terms and conditions";
      if (!formData.acceptPrivacy) newErrors.acceptPrivacy = "You must accept the privacy policy";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;

    setIsLoading(true);
    try {
      const result = await createPartnerMutation.mutateAsync({
        businessName: formData.businessName,
        businessType: formData.businessType,
        email: formData.email,
        mobileNumber: formData.mobileNumber,
        address: `${formData.address}, ${formData.city}, ${formData.province} ${formData.postalCode}`,
        website: formData.website,
        description: formData.description,
        expectedVolume: formData.expectedVolume
      });

      if ((result as { success: boolean }).success) {
        toast({
          title: "Registration Successful!",
          description: "Your partner account has been created. Please check your email for next steps.",
        });
        router.push('/partner/kyb');
      }
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "There was an error creating your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const selectedBusinessType = businessTypes.find(bt => bt.value === formData.businessType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Partner with CPay
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join thousands of businesses already using CPay to accept payments, 
            manage transactions, and grow their revenue.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  step >= stepNumber 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  {step > stepNumber ? <CheckCircle className="w-5 h-5" /> : stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Steps */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {step === 1 && <Building2 className="w-5 h-5" />}
              {step === 2 && <MapPin className="w-5 h-5" />}
              {step === 3 && <Shield className="w-5 h-5" />}
              {step === 1 && "Business Information"}
              {step === 2 && "Business Address"}
              {step === 3 && "Terms & Conditions"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Tell us about your business"}
              {step === 2 && "Where is your business located?"}
              {step === 3 && "Review and accept our terms"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Business Information */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => updateFormData('businessName', e.target.value)}
                      placeholder="Enter your business name"
                      className={errors.businessName ? 'border-red-500' : ''}
                    />
                    {errors.businessName && (
                      <p className="text-sm text-red-500">{errors.businessName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type *</Label>
                    <Select
                      value={formData.businessType}
                      onValueChange={(value) => updateFormData('businessType', value)}
                    >
                      <SelectTrigger className={errors.businessType ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.businessType && (
                      <p className="text-sm text-red-500">{errors.businessType}</p>
                    )}
                  </div>
                </div>

                {selectedBusinessType && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900 mb-2">
                            Required Documents for {selectedBusinessType.label}
                          </h4>
                          <ul className="text-sm text-blue-800 space-y-1">
                            {selectedBusinessType.requiredDocs.map((doc, index) => (
                              <li key={index} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                {doc}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData('email', e.target.value)}
                      placeholder="business@example.com"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber">Mobile Number *</Label>
                    <Input
                      id="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={(e) => updateFormData('mobileNumber', e.target.value)}
                      placeholder="+63 912 345 6789"
                      className={errors.mobileNumber ? 'border-red-500' : ''}
                    />
                    {errors.mobileNumber && (
                      <p className="text-sm text-red-500">{errors.mobileNumber}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website (Optional)</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => updateFormData('website', e.target.value)}
                    placeholder="https://yourbusiness.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Business Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    placeholder="Tell us about your business..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedVolume">Expected Monthly Transaction Volume</Label>
                  <Select
                    value={formData.expectedVolume}
                    onValueChange={(value) => updateFormData('expectedVolume', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select volume range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-100k">₱0 - ₱100,000</SelectItem>
                      <SelectItem value="100k-500k">₱100,000 - ₱500,000</SelectItem>
                      <SelectItem value="500k-1m">₱500,000 - ₱1,000,000</SelectItem>
                      <SelectItem value="1m-5m">₱1,000,000 - ₱5,000,000</SelectItem>
                      <SelectItem value="5m+">₱5,000,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 2: Business Address */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => updateFormData('address', e.target.value)}
                    placeholder="123 Business Street"
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500">{errors.address}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateFormData('city', e.target.value)}
                      placeholder="Manila"
                      className={errors.city ? 'border-red-500' : ''}
                    />
                    {errors.city && (
                      <p className="text-sm text-red-500">{errors.city}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="province">Province *</Label>
                    <Input
                      id="province"
                      value={formData.province}
                      onChange={(e) => updateFormData('province', e.target.value)}
                      placeholder="Metro Manila"
                      className={errors.province ? 'border-red-500' : ''}
                    />
                    {errors.province && (
                      <p className="text-sm text-red-500">{errors.province}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => updateFormData('postalCode', e.target.value)}
                      placeholder="1234"
                      className={errors.postalCode ? 'border-red-500' : ''}
                    />
                    {errors.postalCode && (
                      <p className="text-sm text-red-500">{errors.postalCode}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Terms & Conditions */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Terms and Conditions</h4>
                  <div className="text-sm text-gray-600 space-y-2 max-h-40 overflow-y-auto">
                    <p>By accepting these terms, you agree to:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Provide accurate and complete business information</li>
                      <li>Comply with all applicable laws and regulations</li>
                      <li>Maintain the security of your API credentials</li>
                      <li>Report any suspicious transactions immediately</li>
                      <li>Pay all applicable fees and charges</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="acceptTerms"
                      checked={formData.acceptTerms}
                      onCheckedChange={(checked) => updateFormData('acceptTerms', checked)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="acceptTerms" className="text-sm">
                        I accept the Terms and Conditions *
                      </Label>
                      {errors.acceptTerms && (
                        <p className="text-sm text-red-500">{errors.acceptTerms}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="acceptPrivacy"
                      checked={formData.acceptPrivacy}
                      onCheckedChange={(checked) => updateFormData('acceptPrivacy', checked)}
                    />
                    <div className="space-y-1">
                      <Label htmlFor="acceptPrivacy" className="text-sm">
                        I accept the Privacy Policy *
                      </Label>
                      {errors.acceptPrivacy && (
                        <p className="text-sm text-red-500">{errors.acceptPrivacy}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">What happens next?</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Your application will be reviewed within 24-48 hours</li>
                        <li>• You'll receive an email with your API credentials</li>
                        <li>• Complete KYB verification to activate your account</li>
                        <li>• Start accepting payments immediately after approval</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1}
              >
                Back
              </Button>

              {step < 3 ? (
                <Button onClick={handleNext} className="flex items-center gap-2">
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? "Creating Account..." : "Create Partner Account"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Benefits Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Easy Integration</h3>
              <p className="text-sm text-gray-600">
                Simple API integration with comprehensive documentation and SDKs
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Secure & Compliant</h3>
              <p className="text-sm text-gray-600">
                Bank-grade security with PCI DSS compliance and fraud protection
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">24/7 Support</h3>
              <p className="text-sm text-gray-600">
                Dedicated support team and comprehensive documentation
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 