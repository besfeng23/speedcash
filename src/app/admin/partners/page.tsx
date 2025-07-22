
"use client";

import { useState } from "react";
import { MoreHorizontal, PlusCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi, useApiQuery } from "@/hooks/useApi";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

type Partner = {
  id: string;
  businessName: string;
  status: 'Active' | 'Pending Review' | 'Rejected';
  dateJoined: string;
};

export default function PartnerManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: response, isLoading, error } = useApiQuery<{partners: Partner[]}>(
    'adminGetPartners',
    undefined,
    { queryKey: ['adminPartners'] }
  );
  
  const suspendUserMutation = useApi('adminSuspendUser');

  const allPartners = response?.partners || [];

  const filteredPartners = allPartners.filter(partner =>
    partner.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleInvitePartner = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      // Mock implementation
      toast({
          title: "Invite Sent (Mock)",
          description: "In a real app, an invitation would be sent to the partner.",
      });
      setIsInviteOpen(false);
  };
  
  const handleDeactivate = async (partnerId: string, partnerName: string) => {
      const result = await suspendUserMutation.mutateAsync({ uid: partnerId, suspend: true });
      if ((result as any)?.success) {
          toast({
              title: "Partner Deactivated",
              description: `${partnerName} has been deactivated.`,
              variant: "destructive",
          });
          queryClient.invalidateQueries({ queryKey: ['adminPartners'] });
      }
  }

  return (
    <div className="flex-1 space-y-6">
       <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Partner Management</h2>
        <div className="flex items-center space-x-2 w-full md:w-auto">
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Invite Partner
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite a New Partner</DialogTitle>
                    <DialogDescription>Enter the details of the business you wish to onboard.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInvitePartner} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input id="businessName" name="businessName" required/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="contactEmail">Contact Email</Label>
                        <Input id="contactEmail" name="contactEmail" type="email" required/>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Send Invite</Button>
                    </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Partners</CardTitle>
          <CardDescription>A list of all partner businesses on the platform.</CardDescription>
           <div className="pt-4">
             <Input 
                placeholder="Search by business name or partner ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner ID</TableHead>
                <TableHead>Business Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Joined</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                    </TableRow>
                  ))
              ) : error ? (
                 <TableRow>
                  <TableCell colSpan={5} className="text-center text-destructive">Failed to load partners.</TableCell>
                </TableRow>
              ) : filteredPartners.length > 0 ? (
                filteredPartners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-mono text-xs">{partner.id}</TableCell>
                    <TableCell className="font-medium">{partner.businessName}</TableCell>
                    <TableCell>
                      <Badge variant={partner.status === 'Active' ? 'default' : partner.status === 'Pending Review' ? 'secondary' : 'destructive'}>
                        {partner.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{partner.dateJoined}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/partners/${partner.id}`}>View Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/partners/${partner.id}/payouts`}>Manage Payouts</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive" 
                            onClick={() => handleDeactivate(partner.id, partner.businessName)}
                            disabled={suspendUserMutation.isPending}
                          >
                             {suspendUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Deactivate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
              ))) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    No partners found{searchTerm && ' for your search'}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
