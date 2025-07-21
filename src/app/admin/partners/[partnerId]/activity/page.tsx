
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const activityLogs = [
  { id: 'evt_1', ip: '123.45.67.89', method: 'POST', endpoint: '/v1/payouts', status: 200, statusText: "OK", date: '2023-10-27 10:00 AM', requestBody: '{ "amount": 5000, "currency": "PHP", ... }', responseBody: '{ "id": "po_123", "status": "processing", ... }' },
  { id: 'evt_2', ip: '123.45.67.89', method: 'GET', endpoint: '/v1/balance', status: 200, statusText: "OK", date: '2023-10-27 09:45 AM', requestBody: '{}', responseBody: '{ "available": 85430.25, ... }' },
  { id: 'evt_3', ip: '210.1.2.3', method: 'POST', endpoint: '/v1/webhooks', status: 401, statusText: "Unauthorized", date: '2023-10-27 09:30 AM', requestBody: '{ "event": "payment.failed", ... }', responseBody: '{ "error": "Invalid signature." }' },
  { id: 'evt_4', ip: '123.45.67.89', method: 'GET', endpoint: '/v1/payouts/po_122', status: 200, statusText: "OK", date: '2023-10-26 05:00 PM', requestBody: '{}', responseBody: '{ "id": "po_122", "status": "completed", ... }' },
];

const statusConfig = {
    "200": { color: "bg-green-500" },
    "401": { color: "bg-red-500" },
}

export default function PartnerActivityLogPage() {
  return (
    <Card>
    <CardHeader>
      <CardTitle>Activity Logs</CardTitle>
      <CardDescription>
        A raw, unfiltered log for debugging partner API integrations.
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2">
        <Input placeholder="Filter by Endpoint or IP Address..." className="flex-1"/>
        <Select>
            <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="2xx">Success (2xx)</SelectItem>
                <SelectItem value="4xx">Client Error (4xx)</SelectItem>
                <SelectItem value="5xx">Server Error (5xx)</SelectItem>
            </SelectContent>
        </Select>
      </div>

       <Accordion type="single" collapsible className="w-full">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[200px]">Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {activityLogs.map((log) => (
                <AccordionItem value={log.id} key={log.id} asChild>
                    <>
                    <TableRow>
                      <TableCell className="font-medium">{log.date}</TableCell>
                      <TableCell>
                        <Badge variant={log.status >= 400 ? 'destructive' : 'default'}>
                            {log.status} {log.statusText}
                        </Badge>
                      </TableCell>
                      <TableCell>
                          <Badge variant="outline">{log.method}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.endpoint}</TableCell>
                      <TableCell className="font-mono text-xs">{log.ip}</TableCell>
                      <TableCell>
                         <AccordionTrigger className="p-2 hover:no-underline [&[data-state=open]>svg]:rotate-90">
                            <span className="sr-only">View Details</span>
                         </AccordionTrigger>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell colSpan={6} className="p-0">
                            <AccordionContent>
                                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50">
                                    <div>
                                        <h4 className="font-semibold mb-2">Request Body</h4>
                                        <pre className="text-xs bg-background p-2 rounded-md overflow-auto font-mono"><code>{log.requestBody}</code></pre>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2">Response Body</h4>
                                        <pre className="text-xs bg-background p-2 rounded-md overflow-auto font-mono"><code>{log.responseBody}</code></pre>
                                    </div>
                                </div>
                            </AccordionContent>
                        </TableCell>
                    </TableRow>
                    </>
                </AccordionItem>
              ))}
            </TableBody>
        </Table>
       </Accordion>
    </CardContent>
  </Card>
  );
}
