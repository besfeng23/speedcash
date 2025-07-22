
"use client";

import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bot, FileWarning, Loader2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi, useApiQuery } from "@/hooks/useApi";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
// TODO: Import Label component
// import { Label } from "@/components/ui/label";

type Ticket = {
  id: string;
  ticketId: string;
  uid: string;
  intent: 'SUPPORT_REQUEST' | 'FEATURE_REQUEST';
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  initialQuery: string;
  createdAt: { seconds: number };
  conversationHistory: { sender: 'USER' | 'AI'; text: string }[];
  aiReply: string;
  resolutionNotes?: string;
};

export default function AiTicketsPage() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useApiQuery<{ tickets: Ticket[] }>(
    'adminGetTickets',
    { limit: 50 }
  );

  // Update selected ticket if it no longer exists in the data
  React.useEffect(() => {
    if (data && selectedTicket) {
      const currentTicketStillExists = data.tickets.find((t: Ticket) => t.id === selectedTicket.id);
      if (!currentTicketStillExists) {
        setSelectedTicket(null);
      }
    }
  }, [data, selectedTicket]);

  const tickets = data?.tickets;
  const updateTicketMutation = useApi('adminUpdateSupportTicket');
  const [resolutionNotes, setResolutionNotes] = useState("");

  useEffect(() => {
    if (selectedTicket) {
      setResolutionNotes(selectedTicket.resolutionNotes || "");
    }
  }, [selectedTicket]);


  const handleStatusChange = async (ticketId: string, status: string) => {
    const result = await updateTicketMutation.mutateAsync({ ticketId, status });
    if((result as any)?.success) {
        toast({ title: "Status Updated", description: "The ticket status has been changed." });
        queryClient.invalidateQueries({ queryKey: ['adminTickets', statusFilter] });
    }
  }

  const handleSaveChanges = async () => {
    if (!selectedTicket) return;
    const result = await updateTicketMutation.mutateAsync({ 
        ticketId: selectedTicket.id, 
        resolutionNotes: resolutionNotes 
    });
    if ((result as any)?.success) {
      toast({ title: "Changes Saved", description: "The ticket has been updated." });
      queryClient.invalidateQueries({ queryKey: ['adminTickets', statusFilter] });
    }
  }

  const getStatusVariant = (status: Ticket['status']) => {
    switch (status) {
        case 'NEW': return 'destructive';
        case 'IN_PROGRESS': return 'secondary';
        case 'RESOLVED': return 'default';
        case 'CLOSED': return 'outline';
        default: return 'secondary';
    }
  }
  
  const getIntentVariant = (intent: Ticket['intent']) => {
    return intent === 'SUPPORT_REQUEST' ? 'destructive' : 'default';
  }


  return (
    <div className="flex min-h-[calc(100vh-theme(spacing.16))]">
      <div className="w-full lg:w-2/5 border-r">
        <div className="p-4 space-y-2">
            <h2 className="font-headline text-2xl font-bold tracking-tight">AI-Generated Tickets</h2>
            <p className="text-muted-foreground">User feedback captured by the AI Assistant.</p>
             <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                    <SelectValue placeholder="Filter by status..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Intent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32"/></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full"/></TableCell>
                    <TableCell><Skeleton className="h-6 w-24 rounded-full"/></TableCell>
                </TableRow>
              ))
            ) : error ? (
              <TableRow><TableCell colSpan={3} className="text-center text-destructive">Failed to load tickets.</TableCell></TableRow>
            ) : tickets && tickets.length > 0 ? (
              tickets?.map((ticket) => (
              <TableRow 
                key={ticket.id} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedTicket(ticket)}
                data-state={selectedTicket?.id === ticket.id ? 'selected' : ''}
              >
                <TableCell className="font-mono text-xs">{ticket.id.substring(0,8)}...</TableCell>
                <TableCell><Badge variant={getStatusVariant(ticket.status)}>{ticket.status.replace('_', ' ')}</Badge></TableCell>
                <TableCell><Badge variant={getIntentVariant(ticket.intent)}>{ticket.intent.replace('_', ' ')}</Badge></TableCell>
              </TableRow>
            ))) : (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground h-24">No tickets found for this filter.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex-1 p-6">
        {selectedTicket ? (
          <div className="flex flex-col h-full">
            <CardHeader className="p-0 pb-4">
              <CardTitle>Ticket: {selectedTicket.ticketId.substring(0,8)}...</CardTitle>
              <CardDescription>
                Created on {new Date(selectedTicket.createdAt.seconds * 1000).toLocaleString()} for user {selectedTicket.uid.substring(0,10)}...
              </CardDescription>
            </CardHeader>

            <ScrollArea className="flex-1 pr-4 -mr-4 mb-4">
                <div className="space-y-4">
                <h3 className="font-semibold text-lg">Conversation Transcript</h3>
                {selectedTicket.conversationHistory.map((msg, index) => (
                    <div key={index} className={cn("flex items-start gap-3", { 'justify-end flex-row-reverse': msg.sender === 'USER' })}>
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                            {msg.sender === 'AI' ? <Bot className="h-5 w-5 text-primary"/> : <User className="h-5 w-5 text-foreground"/>}
                        </div>
                        <div className={cn("max-w-[80%] rounded-lg px-3 py-2 text-sm break-words", 
                            msg.sender === 'AI' ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'
                        )}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                 <div className="flex items-start gap-3">
                     <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                        <Bot className="h-5 w-5 text-primary"/>
                    </div>
                    <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-muted text-foreground break-words">
                        {selectedTicket.aiReply}
                    </div>
                </div>
                </div>
            </ScrollArea>
            
             <Card className="mt-auto">
                <CardContent className="pt-6 space-y-4">
                     <div className="space-y-2">
                        {/* TODO: Import Label component */}
                        <div className="text-sm font-medium">Ticket Management</div>
                        <div className="flex gap-4">
                             <Select defaultValue={selectedTicket.status} onValueChange={(value) => handleStatusChange(selectedTicket.id, value)} disabled={updateTicketMutation.isPending}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Change status..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NEW">New</SelectItem>
                                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                                    <SelectItem value="CLOSED">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {/* TODO: Import Label component */}
                        <label className="text-sm font-medium" htmlFor="notes">Resolution Notes</label>
                        <Textarea 
                            id="notes" 
                            placeholder="Add internal notes for this ticket..." 
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                        />
                        <Button className="w-full" disabled={updateTicketMutation.isPending} onClick={handleSaveChanges}>
                             {updateTicketMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Save Notes
                        </Button>
                    </div>
                </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
             {isLoading ? (
                <>
                    <Loader2 className="h-16 w-16 mb-4 animate-spin text-primary"/>
                    <h3 className="text-xl font-semibold">Loading Tickets...</h3>
                    <p>Fetching the latest tickets from the queue.</p>
                </>
            ) : (
                <>
                    <FileWarning className="h-16 w-16 mb-4"/>
                    <h3 className="text-xl font-semibold">No Ticket Selected</h3>
                    <p>Select a ticket from the list to view its details.</p>
                </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
