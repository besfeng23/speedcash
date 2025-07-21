
"use client";

import { createContext, useContext } from 'react';
import { getAuth, User } from 'firebase/auth';
import { app } from '@/lib/firebase';

export const firebaseAuth = getAuth(app);

export type AuthContextType = {
  user: User | null;
  role: string | null;
  isLoading: boolean;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
