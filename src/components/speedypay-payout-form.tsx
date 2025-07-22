'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Banknote, Smartphone } from 'lucide-react';

// 🏦 SpeedyPay Channel Codes
const PAYOUT_CHANNELS = {
  'Major Banks': [
    { procId: 'BOPIPHMMXXX', name: 'Bank of the Philippine Islands (BPI)' },
    { procId: 'BNORPHMMXXY', name: 'Banco de Oro Unibank Inc (BDO)' },
    { procId: 'MBTCPHMMXXX', name: 'Metrobank' },
    { procId: 'UBPHPHMMXXY', name: 'Unionbank of the Philippines' },
    { procId: 'RCBCPHMMXXX', name: 'RCBC' },
    { procId: 'TLBPPHMMXXX', name: 'LAND BANK OF THE PHILIPPINES' },
    { procId: 'CHBKPHMMXXX', name: 'China Banking Corporation' },
    { procId: 'PNBMPHMMTOD', name: 'Philippine National Bank' },
    { procId: 'EWBCPHMMXXX', name: 'East West Banking Corporation' },
    { procId: 'SETCPHMM000', name: 'Security Bank Corporation' },
    { procId: 'AUBKPHMMXXX', name: 'Asia United Bank' }
  ],
  'E-Wallets & Digital': [
    { procId: 'GXCHPHM2XXX', name: 'GCASH (G-Xchange Inc)' },
    { procId: 'PAPHPHM1XXX', name: 'Maya Philippines Inc' },
    { procId: 'MYDBPHM2XXX', name: 'MAYA BANK INC' },
    { procId: 'SPEYPHM2XXX', name: 'SpeedyPay Inc' },
    { procId: 'LAUIPHM2XXZ', name: 'Seabank Philippines Inc' },
    { procId: 'SHPHPHM2XXZ', name: 'ShopeePay Philippines Inc' },
    { procId: 'GOTYPHM2XXX', name: 'GoTyme Bank Corporation' },
    { procId: 'TDBIPHM2XXX', name: 'Tonik Digital Bank Inc' },
    { procId: 'UNODPHM2XXX', name: 'UnionDigital Bank Inc' }
  ]
};

interface PayoutFormData {
  amount: string;
  currency: string;
  procId: string;
  procDetail: string;
  purposes: string;
  firstName: string;
  lastName: string;
  mobilePhone: string;
}

interface PayoutResponse {
  success: boolean;
  data?: {
    orderSeq: string;
    transSeq: string;
    transState: string;
    respCode: string;
    respMessage: string;
  };
  error?: string;
}

export default function SpeedyPayPayoutForm() {
  const [formData, setFormData] = useState<PayoutFormData>({
    amount: '',
    currency: 'PHP',
    procId: '',
    procDetail: '',
    purposes: '',
    firstName: '',
    lastName: '',
    mobilePhone: ''
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<PayoutResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Major Banks');

  // 🔄 Handle form input changes
  const handleInputChange = (field: keyof PayoutFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 🔄 Handle category selection
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setFormData(prev => ({
      ...prev,
      procId: ''
    }));
  };

  // 🔄 Handle channel selection
  const handleChannelChange = (procId: string) => {
    setFormData(prev => ({
      ...prev,
      procId
    }));
  };

  // ✅ Validate form data
  const validateForm = (): boolean => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setResponse({ success: false, error: 'Please enter a valid amount' });
      return false;
    }
    if (!formData.procId) {
      setResponse({ success: false, error: 'Please select a payout channel' });
      return false;
    }
    if (!formData.procDetail) {
      setResponse({ success: false, error: 'Please enter account/mobile number' });
      return false;
    }
    if (!formData.purposes) {
      setResponse({ success: false, error: 'Please enter transaction purpose' });
      return false;
    }
    if (!formData.firstName || !formData.lastName) {
      setResponse({ success: false, error: 'Please enter recipient name' });
      return false;
    }
    if (!formData.mobilePhone) {
      setResponse({ success: false, error: 'Please enter mobile number' });
      return false;
    }
    return true;
  };

  // 🚀 Submit payout request
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setResponse(null);

    try {
      const response = await fetch('/api/speedypay/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result: PayoutResponse = await response.json();
      setResponse(result);

      if (result.success) {
        // Reset form on success
        setFormData({
          amount: '',
          currency: 'PHP',
          procId: '',
          procDetail: '',
          purposes: '',
          firstName: '',
          lastName: '',
          mobilePhone: ''
        });
      }
    } catch (error) {
      setResponse({
        success: false,
        error: 'Network error. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // 🏦 Get selected channel name
  const getSelectedChannelName = (): string => {
    const channels = PAYOUT_CHANNELS[selectedCategory as keyof typeof PAYOUT_CHANNELS] || [];
    const channel = channels.find(c => c.procId === formData.procId);
    return channel?.name || '';
  };

  // 📱 Check if selected channel is e-wallet
  const isEWallet = (): boolean => {
    return formData.procId.startsWith('GXCH') || 
           formData.procId.startsWith('PAPH') || 
           formData.procId.startsWith('MYDB') ||
           formData.procId.startsWith('SPEY') ||
           formData.procId.startsWith('LAUI') ||
           formData.procId.startsWith('SHPH') ||
           formData.procId.startsWith('GOTY') ||
           formData.procId.startsWith('TDBI') ||
           formData.procId.startsWith('UNOD');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            SpeedyPay Payout
          </CardTitle>
          <CardDescription>
            Send money to bank accounts and e-wallets across the Philippines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount and Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount (PHP)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="1000.00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleInputChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PHP">PHP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payout Channel Category */}
            <div>
              <Label>Channel Category</Label>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(PAYOUT_CHANNELS).map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payout Channel */}
            <div>
              <Label>Payout Channel</Label>
              <Select value={formData.procId} onValueChange={handleChannelChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a channel" />
                </SelectTrigger>
                <SelectContent>
                  {PAYOUT_CHANNELS[selectedCategory as keyof typeof PAYOUT_CHANNELS]?.map(channel => (
                    <SelectItem key={channel.procId} value={channel.procId}>
                      {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Account/Mobile Number */}
            <div>
              <Label htmlFor="procDetail" className="flex items-center gap-2">
                {isEWallet() ? <Smartphone className="h-4 w-4" /> : <Banknote className="h-4 w-4" />}
                {isEWallet() ? 'Mobile Number' : 'Account Number'}
              </Label>
              <Input
                id="procDetail"
                type="text"
                placeholder={isEWallet() ? "09123456789" : "1234567890"}
                value={formData.procDetail}
                onChange={(e) => handleInputChange('procDetail', e.target.value)}
                required
              />
            </div>

            {/* Transaction Purpose */}
            <div>
              <Label htmlFor="purposes">Transaction Purpose</Label>
              <Input
                id="purposes"
                type="text"
                placeholder="Salary Payment, Remittance, etc."
                value={formData.purposes}
                onChange={(e) => handleInputChange('purposes', e.target.value)}
                required
              />
            </div>

            {/* Recipient Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Mobile Phone */}
            <div>
              <Label htmlFor="mobilePhone">Mobile Number</Label>
              <Input
                id="mobilePhone"
                type="tel"
                placeholder="09123456789"
                value={formData.mobilePhone}
                onChange={(e) => handleInputChange('mobilePhone', e.target.value)}
                required
              />
            </div>

            {/* Response Alert */}
            {response && (
              <Alert className={response.success ? 'border-green-500' : 'border-red-500'}>
                <div className="flex items-center gap-2">
                  {response.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <AlertDescription>
                    {response.success ? (
                      <div>
                        <p className="font-semibold">Payout initiated successfully!</p>
                        <p className="text-sm text-gray-600">
                          Order ID: {response.data?.orderSeq}<br />
                          Status: {response.data?.transState}<br />
                          Message: {response.data?.respMessage}
                        </p>
                      </div>
                    ) : (
                      <p className="font-semibold">{response.error}</p>
                    )}
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Send Payout'
              )}
            </Button>
          </form>

          {/* Selected Channel Info */}
          {formData.procId && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-sm text-gray-700">Selected Channel</h4>
              <p className="text-sm text-gray-600">{getSelectedChannelName()}</p>
              <p className="text-xs text-gray-500 mt-1">
                {isEWallet() ? 'E-Wallet Transfer' : 'Bank Transfer'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 