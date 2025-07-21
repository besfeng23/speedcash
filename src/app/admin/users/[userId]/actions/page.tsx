
"use client";

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';



export default function UserActionsPage() {
  const params = useParams();
  const userId = params.userId as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');

  const { call: suspendUser, isLoading: isSuspending } = useApi<{ success: boolean }>(
    'adminSuspendUser'
  );

  const handleSuspend = async () => {
    const result = await suspendUser({ uid: userId, suspend: true });
    if (result?.success) {
      toast({
        title: "User Suspended",
        description: `User ${userId} has been successfully suspended.`,
      });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminGetUser', userId] });
    }
  };
  
  const handleUnsuspend = async () => {
    const result = await suspendUser({ uid: userId, suspend: false });
    if (result?.success) {
      toast({
        title: "User Unsuspended",
        description: `User ${userId} has been successfully unsuspended.`,
      });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      queryClient.invalidateQueries({ queryKey: ['adminGetUser', userId] });
    }
  };

  const handleResetPassword = () => {
    // This is a mock implementation
    console.log(`Simulating password reset for user: ${userId}`);
    toast({
      title: "Password Reset Triggered",
      description: `A password reset link has been sent to the user's registered email.`,
    });
  }
  
  const handleSaveNote = () => {
     if (!note.trim()) {
        toast({ variant: 'destructive', title: 'Note is empty', description: 'Please write a note before saving.' });
        return;
    }
    // This is a mock implementation
    console.log(`Saving note for user ${userId}:`, note);
    toast({
        title: 'Note Saved',
        description: 'The internal note has been added to the user record.',
    });
    setNote('');
  }


  return (
    <div className="grid gap-6 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Admin Actions</CardTitle>
                <CardDescription>Perform administrative actions on this user account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Card className="p-4 bg-destructive/10 border-destructive/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-destructive">Suspend User</h4>
                            <p className="text-sm text-destructive/80">This will disable the user's ability to log in or transact.</p>
                        </div>
                         <Button variant="destructive" onClick={handleSuspend} disabled={isSuspending}>
                             {isSuspending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Suspend
                        </Button>
                    </div>
                </Card>
                 <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold">Unsuspend User</h4>
                            <p className="text-sm text-muted-foreground">Re-enable the user's account.</p>
                        </div>
                         <Button variant="secondary" onClick={handleUnsuspend} disabled={isSuspending}>
                              {isSuspending && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Unsuspend
                        </Button>
                    </div>
                </Card>
                 <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold">Reset Password / mPIN</h4>
                            <p className="text-sm text-muted-foreground">Trigger a secure password reset flow for the user.</p>
                        </div>
                         <Button variant="outline" onClick={handleResetPassword}>
                            Send Reset Link
                        </Button>
                    </div>
                </Card>
            </CardContent>
        </Card>
         <Card>
            <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
                <CardDescription>Leave timestamped notes for internal reference.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="internal-note">New Note</Label>
                    <Textarea 
                        id="internal-note"
                        placeholder="e.g., User called to report a lost phone. Temporarily suspended account as a precaution."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={4}
                    />
                </div>
                <Button onClick={handleSaveNote}>Save Note</Button>
                <div className="pt-4 border-t">
                    <h4 className="font-medium text-sm mb-2">Previous Notes</h4>
                    <p className="text-sm text-muted-foreground">Note history will appear here.</p>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
