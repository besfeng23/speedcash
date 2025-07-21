
"use client";

import { useState } from "react";
import { MoreHorizontal, FileDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useApiQuery } from "@/hooks/useApi";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type User = {
  id: string;
  displayName: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin' | 'partner';
  kycStatus: 'VERIFIED' | 'PENDING_REVIEW' | 'BASIC' | 'REJECTED';
  createdAt?: string;
  lastSeen?: string;
  disabled?: boolean;
}

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: usersResponse, isLoading, error } = useApiQuery<{users: User[]}>(
    'adminGetUsers',
    undefined,
    { queryKey: ['adminUsers'] }
  );

  const allUsers = usersResponse?.users || [];
  
  const filteredUsers = allUsers.filter(user => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    return (
      user.displayName?.toLowerCase().includes(lowerSearchTerm) ||
      user.email.toLowerCase().includes(lowerSearchTerm) ||
      user.id.toLowerCase().includes(lowerSearchTerm)
    );
  });
  
  const getKycStatusVariant = (status?: string) => {
      switch (status) {
          case 'VERIFIED': return 'default';
          case 'PENDING_REVIEW': return 'secondary';
          case 'REJECTED': return 'destructive';
          default: return 'outline';
      }
  };

  const downloadCSV = () => {
    const headers = ["User ID", "Display Name", "Email", "Role", "KYC Status", "Account Status", "Date Joined", "Last Seen"];
    const rows = filteredUsers.map(user => [
      `"${user.id}"`,
      `"${user.displayName || 'N/A'}"`,
      `"${user.email}"`,
      `"${user.role || 'user'}"`,
      `"${user.kycStatus || 'N/A'}"`,
      `"${user.disabled ? 'Suspended' : 'Active'}"`,
      `"${user.createdAt ? new Date(user.createdAt).toISOString() : 'N/A'}"`,
      `"${user.lastSeen ? new Date(user.lastSeen).toISOString() : 'N/A'}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cpay_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-2 md:space-y-0">
        <h2 className="font-headline text-3xl font-bold tracking-tight">User Management</h2>
        <div className="flex items-center space-x-2 w-full md:w-auto">
            <Button variant="outline" className="w-full md:w-auto" onClick={downloadCSV} disabled={isLoading || filteredUsers.length === 0}>
                <FileDown className="mr-2 h-4 w-4" />
                Export
            </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>A list of all users on the platform.</CardDescription>
          <div className="pt-4">
             <Input 
                placeholder="Search by name, email, or user ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>KYC Status</TableHead>
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
                      <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full"/><div className="space-y-2"><Skeleton className="h-4 w-24"/><Skeleton className="h-3 w-32"/></div></div></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                    </TableRow>
                  ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-destructive">Failed to load users.</TableCell>
                </TableRow>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                     <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarFallback>{user.displayName?.[0] || user.email[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{user.displayName || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>
                      <Badge variant={user.disabled ? 'destructive' : 'default'}>{user.disabled ? 'Suspended' : 'Active'}</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Seen {user.lastSeen ? formatDistanceToNow(new Date(user.lastSeen), { addSuffix: true }) : 'never'}
                      </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' || user.role === 'superadmin' ? 'destructive' : 'outline'}>
                        {user.role || 'user'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getKycStatusVariant(user.kycStatus)}>
                      {user.kycStatus || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                     {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
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
                          <Link href={`/admin/users/${user.id}`}>View Details</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))) : (
                 <TableRow>
                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                        No users found{searchTerm && ' for your search'}.
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
