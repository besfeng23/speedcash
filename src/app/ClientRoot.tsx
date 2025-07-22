"use client";
import QueryProvider from '@/components/query-provider';
import { AuthContext, firebaseAuth } from '@/hooks/useAuth';
import { AuthContextType } from '@/hooks/useAuth';
import { useState, useEffect, ReactNode } from 'react';
import { onIdTokenChanged, signOut, User } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from "@/components/ui/toaster";
import { ChatAssistantWidget } from '@/components/ai/chat-assistant-widget';
import { cn } from '@/lib/utils';

export function ClientRoot({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <div className={cn('font-body antialiased', 'min-h-screen bg-background font-sans', 'relative flex min-h-screen flex-col')}>
          <main className="flex-1">{children}</main>
        </div>
        <Toaster />
        <ChatAssistantWidget />
      </AuthProvider>
    </QueryProvider>
  );
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // onIdTokenChanged is essential for reading custom claims securely.
    const unsubscribe = onIdTokenChanged(firebaseAuth, async (firebaseUser) => {
      setIsLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        // Force a refresh of the token to get the latest custom claims from the server.
        const tokenResult = await firebaseUser.getIdTokenResult(true); 
        // Read the role securely from the token's claims. Default to 'user'.
        setRole((tokenResult.claims.role as string) || 'user'); 
      } else {
        setUser(null);
        setRole(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(firebaseAuth);
      // State will be cleared automatically by the onIdTokenChanged listener.
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out."
      });
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const value: AuthContextType = { user, role, isLoading, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 