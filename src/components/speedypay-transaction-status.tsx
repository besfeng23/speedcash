'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';

interface TransactionStatus {
  orderSeq: string;
  transSeq: string;
  transState: string;
  transStateDescription: string;
  amount: number;
  currency: string;
  procId: string;
  procDetail: string;
  purposes: string;
  firstName: string;
  lastName: string;
  respCode: string;
  respMessage: string;
  createTime?: string;
  notifyTime?: string;
  updatedAt?: string;
}

interface StatusResponse {
  success: boolean;
  data?: TransactionStatus;
  error?: string;
}

// 📊 Transaction State Icons and Colors
const TRANSACTION_STATES = {
  '00': { label: 'SUCCESS', icon: CheckCircle, color: 'bg-green-100 text-green-800', border: 'border-green-200' },
  '01': { label: 'FAILED', icon: XCircle, color: 'bg-red-100 text-red-800', border: 'border-red-200' },
  '03': { label: 'PARTIAL_REFUND', icon: AlertCircle, color: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-200' },
  '04': { label: 'FULL_REFUND', icon: AlertCircle, color: 'bg-blue-100 text-blue-800', border: 'border-blue-200' },
  '05': { label: 'FAILED_REFUND', icon: XCircle, color: 'bg-red-100 text-red-800', border: 'border-red-200' },
  '06': { label: 'IN_PROCESS', icon: Clock, color: 'bg-blue-100 text-blue-800', border: 'border-blue-200' },
  '07': { label: 'ORDER_TO_BE_PAID', icon: Clock, color: 'bg-gray-100 text-gray-800', border: 'border-gray-200' },
  '08': { label: 'CANCELLED', icon: XCircle, color: 'bg-red-100 text-red-800', border: 'border-red-200' },
  '09': { label: 'EXPIRED', icon: XCircle, color: 'bg-red-100 text-red-800', border: 'border-red-200' }
};

export default function SpeedyPayTransactionStatus() {
  const [orderSeq, setOrderSeq] = useState('');
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState<TransactionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 🔍 Search transaction status
  const searchTransaction = async () => {
    if (!orderSeq.trim()) {
      setError('Please enter an Order ID');
      return;
    }

    setLoading(true);
    setError(null);
    setTransaction(null);

    try {
      const response = await fetch(`/api/speedypay/status/${orderSeq}`);
      const result: StatusResponse = await response.json();

      if (result.success && result.data) {
        setTransaction(result.data);
      } else {
        setError(result.error || 'Transaction not found');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Refresh transaction status
  const refreshStatus = () => {
    if (orderSeq) {
      searchTransaction();
    }
  };

  // 🎯 Get transaction state info
  const getTransactionStateInfo = (stateCode: string) => {
    return TRANSACTION_STATES[stateCode as keyof typeof TRANSACTION_STATES] || {
      label: 'UNKNOWN',
      icon: AlertCircle,
      color: 'bg-gray-100 text-gray-800',
      border: 'border-gray-200'
    };
  };

  // 🏦 Get channel name
  const getChannelName = (procId: string): string => {
    const channels: { [key: string]: string } = {
      'BOPIPHMMXXX': 'Bank of the Philippine Islands (BPI)',
      'BNORPHMMXXY': 'Banco de Oro Unibank Inc (BDO)',
      'MBTCPHMMXXX': 'Metrobank',
      'UBPHPHMMXXY': 'Unionbank of the Philippines',
      'RCBCPHMMXXX': 'RCBC',
      'TLBPPHMMXXX': 'LAND BANK OF THE PHILIPPINES',
      'CHBKPHMMXXX': 'China Banking Corporation',
      'PNBMPHMMTOD': 'Philippine National Bank',
      'EWBCPHMMXXX': 'East West Banking Corporation',
      'SETCPHMM000': 'Security Bank Corporation',
      'AUBKPHMMXXX': 'Asia United Bank',
      'GXCHPHM2XXX': 'GCASH (G-Xchange Inc)',
      'PAPHPHM1XXX': 'Maya Philippines Inc',
      'MYDBPHM2XXX': 'MAYA BANK INC',
      'SPEYPHM2XXX': 'SpeedyPay Inc',
      'LAUIPHM2XXZ': 'Seabank Philippines Inc',
      'SHPHPHM2XXZ': 'ShopeePay Philippines Inc',
      'GOTYPHM2XXX': 'GoTyme Bank Corporation',
      'TDBIPHM2XXX': 'Tonik Digital Bank Inc',
      'UNODPHM2XXX': 'UnionDigital Bank Inc'
    };
    return channels[procId] || procId;
  };

  // 📅 Format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('en-PH');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Transaction Status
          </CardTitle>
          <CardDescription>
            Check the status of your SpeedyPay transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Form */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="orderSeq">Order ID</Label>
              <Input
                id="orderSeq"
                type="text"
                placeholder="CPAY_1234567890_abc123"
                value={orderSeq}
                onChange={(e) => setOrderSeq(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchTransaction()}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={searchTransaction} 
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="border-red-500 mb-6">
              <XCircle className="h-4 w-4 text-red-500" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Transaction Details */}
          {transaction && (
            <div className="space-y-6">
              {/* Status Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const stateInfo = getTransactionStateInfo(transaction.transState);
                    const Icon = stateInfo.icon;
                    return (
                      <>
                        <Icon className={`h-6 w-6 ${stateInfo.color.replace('bg-', 'text-').replace(' text-', '')}`} />
                        <div>
                          <h3 className="text-lg font-semibold">Transaction Status</h3>
                          <Badge className={`${stateInfo.color} ${stateInfo.border}`}>
                            {stateInfo.label}
                          </Badge>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshStatus}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {/* Transaction Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm text-gray-600">Order ID</Label>
                      <p className="font-mono text-sm">{transaction.orderSeq}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Transaction ID</Label>
                      <p className="font-mono text-sm">{transaction.transSeq}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Amount</Label>
                      <p className="text-lg font-semibold">
                        ₱{transaction.amount.toLocaleString()} {transaction.currency}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Purpose</Label>
                      <p className="text-sm">{transaction.purposes}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Recipient Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Recipient Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm text-gray-600">Name</Label>
                      <p className="text-sm">{transaction.firstName} {transaction.lastName}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Channel</Label>
                      <p className="text-sm">{getChannelName(transaction.procId)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Account/Mobile</Label>
                      <p className="font-mono text-sm">{transaction.procDetail}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Timestamps */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Timestamps</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm text-gray-600">Created</Label>
                      <p className="text-sm">{formatDate(transaction.createTime)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Notified</Label>
                      <p className="text-sm">{formatDate(transaction.notifyTime)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Last Updated</Label>
                      <p className="text-sm">{formatDate(transaction.updatedAt)}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Response Details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Response Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm text-gray-600">Response Code</Label>
                      <p className="font-mono text-sm">{transaction.respCode}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Response Message</Label>
                      <p className="text-sm">{transaction.respMessage}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">State Code</Label>
                      <p className="font-mono text-sm">{transaction.transState}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Status Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Status Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Transaction Created</p>
                        <p className="text-xs text-gray-600">{formatDate(transaction.createTime)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">Status Updated</p>
                        <p className="text-xs text-gray-600">{formatDate(transaction.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 