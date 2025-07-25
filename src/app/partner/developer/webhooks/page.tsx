"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useApi } from "@/hooks/useApi";
import { 
  Send, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Copy, 
  AlertTriangle,
  Zap,
  Settings,
  Activity,
  TestTube
} from "lucide-react";

interface WebhookEvent {
  id: string;
  type: string;
  status: 'delivered' | 'failed' | 'pending';
  timestamp: string;
  responseCode?: number;
  responseBody?: string;
  retryCount: number;
  data: any;
}

interface WebhookConfig {
  url: string;
  secret: string;
  enabled: boolean;
  events: string[];
}

const webhookEventTypes = [
  { value: 'payment.succeeded', label: 'Payment Succeeded', description: 'When a payment is successfully completed' },
  { value: 'payment.failed', label: 'Payment Failed', description: 'When a payment fails' },
  { value: 'transfer.completed', label: 'Transfer Completed', description: 'When a transfer is completed' },
  { value: 'kyc.verified', label: 'KYC Verified', description: 'When KYC verification is completed' },
  { value: 'kyc.rejected', label: 'KYC Rejected', description: 'When KYC verification is rejected' },
  { value: 'payout.initiated', label: 'Payout Initiated', description: 'When a payout is initiated' },
  { value: 'payout.completed', label: 'Payout Completed', description: 'When a payout is completed' },
  { value: 'payout.failed', label: 'Payout Failed', description: 'When a payout fails' }
];

export default function WebhookDashboard() {
  const { toast } = useToast();
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>({
    url: '',
    secret: 'whsec_test_abc123def456',
    enabled: true,
    events: ['payment.succeeded', 'payment.failed']
  });
  
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState('payment.succeeded');

  // Mock data for demonstration
  useEffect(() => {
    setWebhookEvents([
      {
        id: 'evt_1',
        type: 'payment.succeeded',
        status: 'delivered',
        timestamp: '2024-01-15T10:30:00Z',
        responseCode: 200,
        responseBody: '{"received": true}',
        retryCount: 0,
        data: { transactionId: 'txn_123', amount: 1000, currency: 'PHP' }
      },
      {
        id: 'evt_2',
        type: 'payment.failed',
        status: 'failed',
        timestamp: '2024-01-15T09:15:00Z',
        responseCode: 500,
        responseBody: 'Internal Server Error',
        retryCount: 3,
        data: { transactionId: 'txn_124', amount: 500, currency: 'PHP' }
      },
      {
        id: 'evt_3',
        type: 'transfer.completed',
        status: 'pending',
        timestamp: '2024-01-15T08:45:00Z',
        retryCount: 1,
        data: { transferId: 'trf_123', amount: 2000, currency: 'PHP' }
      }
    ]);
  }, []);

  const updateWebhookConfig = (field: keyof WebhookConfig, value: any) => {
    setWebhookConfig(prev => ({ ...prev, [field]: value }));
  };

  const toggleEventType = (eventType: string) => {
    const newEvents = webhookConfig.events.includes(eventType)
      ? webhookConfig.events.filter(e => e !== eventType)
      : [...webhookConfig.events, eventType];
    updateWebhookConfig('events', newEvents);
  };

  const sendTestWebhook = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newEvent: WebhookEvent = {
        id: `evt_test_${Date.now()}`,
        type: selectedEventType,
        status: 'delivered',
        timestamp: new Date().toISOString(),
        responseCode: 200,
        responseBody: '{"received": true}',
        retryCount: 0,
        data: { test: true, eventType: selectedEventType }
      };
      
      setWebhookEvents(prev => [newEvent, ...prev]);
      
      toast({
        title: "Test Webhook Sent",
        description: `Test ${selectedEventType} event sent successfully.`,
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to send test webhook. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const retryWebhook = async (eventId: string) => {
    try {
      // Simulate retry
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setWebhookEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, status: 'delivered', retryCount: event.retryCount + 1 }
          : event
      ));
      
      toast({
        title: "Webhook Retried",
        description: "Webhook has been retried successfully.",
      });
    } catch (error) {
      toast({
        title: "Retry Failed",
        description: "Failed to retry webhook. Please try again.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: `${label} has been copied.`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Delivered</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getResponseCodeBadge = (code?: number) => {
    if (!code) return null;
    
    const isSuccess = code >= 200 && code < 300;
    const isError = code >= 400;
    
    return (
      <Badge variant={isSuccess ? "default" : isError ? "destructive" : "secondary"}>
        {code}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Webhook Dashboard</h1>
          <p className="text-gray-600">Manage your webhook endpoints and monitor delivery status</p>
        </div>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="configuration" className="space-y-6">
        <TabsList>
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Event Log
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Testing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Endpoint Configuration</CardTitle>
              <CardDescription>
                Configure your webhook endpoint to receive real-time event notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">Endpoint URL</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="webhook-url"
                    value={webhookConfig.url}
                    onChange={(e) => updateWebhookConfig('url', e.target.value)}
                    placeholder="https://api.your-domain.com/webhooks/cpay"
                  />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(webhookConfig.url, 'Webhook URL')}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Webhook Signing Secret (SHA256)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={webhookConfig.secret}
                    className="font-mono"
                  />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(webhookConfig.secret, 'Signing Secret')}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use this secret to verify that webhooks are coming from CPay
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <Label htmlFor="webhook-active">Enable Webhooks</Label>
                  <p className="text-xs text-muted-foreground">
                    Toggle to enable or disable all webhook notifications
                  </p>
                </div>
                <Switch
                  id="webhook-active"
                  checked={webhookConfig.enabled}
                  onCheckedChange={(checked) => updateWebhookConfig('enabled', checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Types</CardTitle>
              <CardDescription>
                Select which events you want to receive webhook notifications for
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {webhookEventTypes.map((eventType) => (
                  <div
                    key={eventType.value}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      webhookConfig.events.includes(eventType.value)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleEventType(eventType.value)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{eventType.label}</h4>
                        <p className="text-sm text-gray-600">{eventType.description}</p>
                      </div>
                      <Switch
                        checked={webhookConfig.events.includes(eventType.value)}
                        onCheckedChange={() => toggleEventType(eventType.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Delivery Log</CardTitle>
              <CardDescription>
                Monitor the delivery status of all webhook events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">{webhookEvents.length} Total Events</Badge>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      {webhookEvents.filter(e => e.status === 'delivered').length} Delivered
                    </Badge>
                    <Badge variant="destructive">
                      {webhookEvents.filter(e => e.status === 'failed').length} Failed
                    </Badge>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Response</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Retries</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {webhookEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{event.type}</div>
                            <div className="text-sm text-gray-500">{event.id}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(event.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getResponseCodeBadge(event.responseCode)}
                            {event.responseBody && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(event.responseBody!, 'Response Body')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(event.timestamp).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{event.retryCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {event.status === 'failed' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => retryWebhook(event.id)}
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(JSON.stringify(event.data, null, 2), 'Event Data')}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Webhook Events</CardTitle>
              <CardDescription>
                Send test webhook events to verify your endpoint configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {webhookEventTypes.map((eventType) => (
                        <SelectItem key={eventType.value} value={eventType.value}>
                          {eventType.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Endpoint Status</Label>
                  <div className="flex items-center gap-2">
                    {webhookConfig.url ? (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Configured
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Not Configured
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Sample Payload</h4>
                <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
                  {JSON.stringify({
                    id: "evt_test_123",
                    type: selectedEventType,
                    data: {
                      transactionId: "txn_test_123",
                      amount: 1000,
                      currency: "PHP",
                      status: "completed"
                    },
                    timestamp: new Date().toISOString(),
                    signature: "test_signature"
                  }, null, 2)}
                </pre>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  onClick={sendTestWebhook}
                  disabled={isLoading || !webhookConfig.url}
                  className="flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isLoading ? "Sending..." : "Send Test Event"}
                </Button>

                {!webhookConfig.url && (
                  <p className="text-sm text-red-600">
                    Please configure a webhook URL first
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Webhook Verification</CardTitle>
              <CardDescription>
                Verify webhook signatures to ensure they come from CPay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Signature Verification</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    To verify webhook signatures, use the following code:
                  </p>
                  <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`// Node.js Example
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}`}
                  </pre>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Security Best Practices</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Always verify webhook signatures</li>
                    <li>• Use HTTPS endpoints only</li>
                    <li>• Implement idempotency to handle duplicate events</li>
                    <li>• Respond with 200 status code to acknowledge receipt</li>
                    <li>• Process webhooks asynchronously when possible</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 