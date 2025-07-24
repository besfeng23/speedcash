
"use client";

import { useState } from "react";
import { MoreHorizontal, PlusCircle, Loader2, ServerCrash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApi, useApiQuery } from "@/hooks/useApi";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type TeamMember = {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
};

export default function TeamManagementPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const inviteMemberMutation = useApi('partnerInviteMember');
  const removeMemberMutation = useApi('partnerRemoveMember');

  const { data: teamResponse, isLoading: isLoadingTeam, error } = useApiQuery<{teamMembers: TeamMember[]}>(
      'partnerGetTeamMembers',
      ['teamMembers']
  );

  const teamMembers = teamResponse?.teamMembers || [];

  const handleInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    
    const result = await inviteMemberMutation.mutateAsync({ name, email, role });
    if ((result as any)?.success) {
      toast({
        title: "Invite Sent",
        description: `An invitation has been sent to ${email}.`,
      });
      setIsInviteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
    }
  }

  const handleRemove = async () => {
    if (!selectedMember) return;
    const result = await removeMemberMutation.mutateAsync({ userId: selectedMember.id });
    if ((result as any)?.success) {
        toast({
            title: "Member Removed",
            description: `${selectedMember.name} has been removed from the team.`,
        });
        setIsRemoveOpen(false);
        setSelectedMember(null);
        queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
    }
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="font-headline text-3xl font-bold tracking-tight">Team Management</h2>
        <div className="flex items-center space-x-2">
           <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite a new team member</DialogTitle>
                  <DialogDescription>
                    Enter the email and role for your new team member. They will receive an email to set up their account.
                  </DialogDescription>
                </DialogHeader>
                 <form onSubmit={handleInvite} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" name="name" type="text" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select name="role" defaultValue="Developer" required>
                        <SelectTrigger id="role">
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Admin">Admin (Full access)</SelectItem>
                            <SelectItem value="Developer">Developer (API and logs access)</SelectItem>
                            <SelectItem value="Support">Support (View-only)</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full" disabled={inviteMemberMutation.isPending}>
                      {inviteMemberMutation.isPending && <Loader2 className="animate-spin mr-2"/>}
                      Send Invite
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>Manage who has access to your Partner Hub.</CardDescription>
        </CardHeader>
        <CardContent>
           <AlertDialog open={isRemoveOpen} onOpenChange={setIsRemoveOpen}>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                    <span className="sr-only">Actions</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoadingTeam ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full"/><div className="space-y-2"><Skeleton className="h-4 w-24"/><Skeleton className="h-3 w-32"/></div></div></TableCell>
                            <TableCell><Skeleton className="h-6 w-20 rounded-full"/></TableCell>
                            <TableCell><Skeleton className="h-6 w-20 rounded-full"/></TableCell>
                            <TableCell><Skeleton className="h-8 w-8"/></TableCell>
                        </TableRow>
                    ))
                ) : error ? (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            <div className="flex flex-col items-center gap-2 text-destructive">
                                <ServerCrash className="h-8 w-8" />
                                <span className="font-semibold">Failed to load team members.</span>
                            </div>
                        </TableCell>
                        </TableRow>
                ) : teamMembers.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                            No team members invited yet.
                        </TableCell>
                        </TableRow>
                ) : (
                    teamMembers.map((member) => (
                        <TableRow key={member.id}>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={`https://placehold.co/40x40.png`} data-ai-hint="person avatar"/>
                                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p>{member.name}</p>
                                    <p className="text-sm text-muted-foreground">{member.email}</p>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline">{member.role}</Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant={member.status === 'Active' ? 'default' : 'destructive'}>{member.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem>Edit Role</DropdownMenuItem>
                                <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => { setSelectedMember(member); setIsRemoveOpen(true); }}
                                    disabled={removeMemberMutation.isPending}
                                >
                                    Remove Member
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    ))
                )}
                </TableBody>
            </Table>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently remove <strong>{selectedMember?.name}</strong> from your team and revoke their access. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={removeMemberMutation.isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemove} disabled={removeMemberMutation.isPending} className="bg-destructive hover:bg-destructive/90">
                        {removeMemberMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Yes, remove member
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
           </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
