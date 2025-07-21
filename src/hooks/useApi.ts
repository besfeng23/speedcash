
"use client";

import { useMutation, useQuery, useQueryClient, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { getFunctions, httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { useToast } from '@/hooks/use-toast';
import { app } from '@/lib/firebase';
import { useAuth } from './useAuth';

const functions = getFunctions(app, 'asia-southeast1');
const dispatcher = httpsCallable(functions, 'cpayDispatcher');

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
    const result = await dispatcher({
      action,
      payload,
      idToken, // The backend dispatcher can now use this token if needed
    });
    return result.data as TResponse;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Error calling action ${action} via dispatcher:`, error);
    throw new Error(errorMessage || `An unknown error occurred while calling ${action}.`);
  }
}

// Hook for mutations (e.g., POST, PUT, DELETE actions)
export function useApi<TResponse = unknown, TRequest = unknown>(actionName: string) {
  const { toast } = useToast();
  const { user } = useAuth(); // Get user from auth context

  const { mutateAsync, isPending, error, ...rest } = useMutation<TResponse, Error, TRequest>({
    mutationFn: async (payload: TRequest) => {
      console.log(`[useApi Mutation] Calling action: ${actionName}`, payload);
      const idToken = await user?.getIdToken() || null;
      return callDispatcher<TRequest, TResponse>(actionName, payload, idToken);
    },
    onError: (e: Error) => {
      toast({
        title: `Error: ${actionName}`,
        description: e.message,
        variant: 'destructive',
      });
    },
  });

  return { call: mutateAsync, isLoading: isPending, error: error?.message || null, ...rest };
}

export async function apiCall<TResponse = unknown>(action: string, payload?: unknown): Promise<TResponse> {
  try {
    const result = await dispatcher({
      action,
      payload,
    });
    return result.data as TResponse;
  } catch (error: unknown) {
    console.error(`API call failed for action '${action}':`, error);
    throw error;
  }
}

// Hook for queries (e.g., GET actions) that integrates with TanStack Query
export function useApiQuery<TResponse = unknown>(
  action: string,
  payload?: unknown,
  options?: UseQueryOptions<TResponse, Error, TResponse, QueryKey>
) {
  return useQuery({
    queryKey: [action, payload],
    queryFn: () => apiCall<TResponse>(action, payload),
    enabled: options?.enabled ?? true,
    select: options?.select,
    ...options,
  });
}
