
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle, Clock, RefreshCw, XCircle } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const activityLogs = [
  { id: 'evt_1', type: 'payout.created', status: 'Success', httpStatus: 200, date: '2023-10-27 10:00 AM' },
  { id: 'evt_2', type: 'payment.succeeded', status: 'Success', httpStatus: 200, date: '2023-10-27 09:45 AM' },
  { id: 'evt_3', type: 'payment.succeeded', status: 'Failed', httpStatus: 503, date: '2023-10-27 09:30 AM' },
  { id: 'evt_4', type: 'payout.paid', status: 'Success', httpStatus: 200, date: '2023-10-26 05:00 PM' },
  { id: 'evt_5', type: 'payment.succeeded', status: 'Success', httpStatus: 200, date: '2023-10-26 04:30 PM' },
  { id: 'evt_6', type: 'payment.succeeded', status: 'Pending', httpStatus: null, date: '2023-10-26 04:25 PM' },
];

const statusConfig = {
    Success: { icon: CheckCircle, color: "text-green-500", badge: "default" as const },
    Failed: { icon: XCircle, color: "text-destructive", badge: "destructive" as const },
    Pending: { icon: Clock, color: "text-amber-500", badge: "secondary" as const },
}

export default function ActivityLogPage() {
  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
            <Link href="/partner/developer">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
            </Link>
        </Button>
        <h2 className="font-headline text-3xl font-bold tracking-tight">Activity Logs</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Delivery Logs</CardTitle>
          <CardDescription>A log of all webhook events sent to your configured endpoint.</CardDescription>
           <div className="pt-4 flex flex-col md:flex-row gap-2">
             <Input placeholder="Search by Event ID or Type..." className="flex-1"/>
              <Select>
                  <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
              </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Event ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activityLogs.map((log) => {
                  const SIcon = statusConfig[log.status as keyof typeof statusConfig].icon;
                  const color = statusConfig[log.status as keyof typeof statusConfig].color;
                  const badge = statusConfig[log.status as keyof typeof statusConfig].badge;
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                          <div className="flex items-center gap-2">
                              <SIcon className={`h-4 w-4 ${color}`} />
                              <Badge variant={badge}>{log.httpStatus || log.status}</Badge>
                          </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.type}</TableCell>
                      <TableCell className="font-mono text-xs">{log.id}</TableCell>
                      <TableCell>{log.date}</TableCell>
                      <TableCell className="text-right">
                         {log.status === 'Failed' && <Button size="sm" variant="outline"><RefreshCw className="mr-2"/>Retry</Button>}
                      </TableCell>
                    </TableRow>
                  )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
