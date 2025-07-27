
"use client";

import { useMutation, useQuery, useQueryClient, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { getFunctions, httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';
import { app } from '@/lib/firebase';
import { useAuth } from './useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Use our CORS proxy to handle Firebase Functions CORS issues
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/cors-proxy';

// This type helps us define that the payload will be wrapped with an idToken.
type DispatcherPayload<T> = {
  idToken: string;
  payload: T;
  action: string;
};

// Generic function to call the dispatcher, now with authentication handling
async function callDispatcher<TRequest, TResponse>(
  action: string,
  payload: TRequest,
  idToken: string | null
): Promise<TResponse> {
  if (!idToken) {
    throw new Error('Authentication token is missing. Please log in.');
  }
  
  try {
    console.log(`[API Call] Calling action: ${action}`, { payload, hasToken: !!idToken });
    
    // Use our CORS proxy
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({ action, data: payload }),
      credentials: 'include'
    });
    
    console.log(`[API Call] Response status: ${response.status} for action: ${action}`);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        errorData = { error: response.statusText };
      }
      
      console.error(`[API Call] Error response for action ${action}:`, errorData);
      
      // Handle specific error cases
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else if (response.status === 400) {
        throw new Error(errorData.error || 'Invalid request');
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }
    }
    
    const data = await response.json();
    console.log(`[API Call] Success response for action ${action}:`, data);
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data.data as TResponse;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`[API Call] Error calling action ${action}:`, error);
    throw new Error(errorMessage);
  }
}

// Hook for making API calls with authentication
export function useApi<TResponse = unknown, TRequest = unknown>(actionName: string) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (payload: TRequest): Promise<TResponse> => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Get fresh ID token
      const idToken = await user.getIdToken(true);
      return callDispatcher<TRequest, TResponse>(actionName, payload, idToken);
    },
    onError: (error: Error) => {
      console.error(`[useApi] Error in ${actionName}:`, error);
      
      // Handle authentication errors
      if (error.message.includes('Authentication') || error.message.includes('log in')) {
        toast({
          title: "Session Expired",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        
        // Clear user session and redirect to login
        logout();
        router.push('/login');
        return;
      }
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSuccess: () => {
      // Invalidate relevant queries after successful mutation
      queryClient.invalidateQueries({ queryKey: ['api'] });
    },
  });

  return mutation;
}

// Direct API call function
export async function apiCall<TResponse = unknown>(action: string, payload?: unknown, idToken?: string | null): Promise<TResponse> {
  if (!idToken) {
    throw new Error('Authentication token is required');
  }
  
  return callDispatcher(action, payload || {}, idToken);
}

// Hook for making authenticated queries
export function useApiQuery<TResponse = unknown>(
  action: string,
  payload?: unknown,
  options?: UseQueryOptions<TResponse, Error, TResponse, QueryKey>
) {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const query = useQuery({
    queryKey: ['api', action, payload],
    queryFn: async (): Promise<TResponse> => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      // Get fresh ID token
      const idToken = await user.getIdToken(true);
      return callDispatcher(action, payload || {}, idToken);
    },
    enabled: !!user, // Only run query if user is authenticated
    retry: (failureCount, error) => {
      // Don't retry authentication errors
      if (error.message.includes('Authentication') || error.message.includes('401')) {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
    ...options,
  });

  // Fix: Move error handling to useEffect to prevent infinite loops
  useEffect(() => {
    if (query.error) {
      // Handle authentication errors
      if (query.error.message.includes('Authentication') || query.error.message.includes('log in')) {
        toast({
          title: "Session Expired",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        
        // Clear user session and redirect to login
        logout();
        router.push('/login');
        return;
      }
      
      toast({
        title: 'Error',
        description: query.error.message,
        variant: 'destructive',
      });
    }
  }, [query.error, toast, logout, router]);

  return query;
}

