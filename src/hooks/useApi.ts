"use client";

import { useMutation, useQuery, useQueryClient, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const rawApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const normalizedApiBaseUrl = rawApiBaseUrl?.replace(/\/$/, '');
const API_BASE_URL = normalizedApiBaseUrl
  ? normalizedApiBaseUrl.endsWith('/cpayDispatcher')
    ? normalizedApiBaseUrl
    : `${normalizedApiBaseUrl}/cpayDispatcher`
  : '/api/cors-proxy';

const SENSITIVE_KEYS = new Set([
  'accountNumber',
  'account_number',
  'mobileNumber',
  'mobile_number',
  'recipientMobileNumber',
  'bankDetails',
  'recipientInfo',
  'signature',
  'authorization',
  'idToken',
]);

function redactForLog(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactForLog);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [
        key,
        SENSITIVE_KEYS.has(key) ? '[REDACTED]' : redactForLog(entryValue),
      ])
    );
  }

  return value;
}

async function callDispatcher<TRequest, TResponse>(
  action: string,
  payload: TRequest,
  idToken: string | null
): Promise<TResponse> {
  if (!idToken) {
    throw new Error('Authentication token is missing. Please log in.');
  }

  try {
    console.log(`[API Call] ${action}`, { payload: redactForLog(payload), hasToken: true });

    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({ action, data: payload }),
    });

    console.log(`[API Call] Response status: ${response.status} for action: ${action}`);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (_parseError) {
        errorData = { error: response.statusText };
      }

      console.error(`[API Call] Error response for action ${action}:`, redactForLog(errorData));

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
    console.log(`[API Call] Success response for action ${action}`);

    if (data.error) {
      throw new Error(data.error);
    }

    return data.data as TResponse;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`[API Call] Error calling action ${action}:`, errorMessage);
    throw new Error(errorMessage);
  }
}

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

      const idToken = await user.getIdToken(true);
      return callDispatcher<TRequest, TResponse>(actionName, payload, idToken);
    },
    onError: (error: Error) => {
      console.error(`[useApi] Error in ${actionName}:`, error.message);

      if (error.message.includes('Authentication') || error.message.includes('log in')) {
        toast({
          title: 'Session Expired',
          description: 'Please log in again to continue.',
          variant: 'destructive',
        });

        logout();
        router.push('/login');
        return;
      }

      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api'] });
    },
  });

  return mutation;
}

export async function apiCall<TResponse = unknown>(action: string, payload?: unknown, idToken?: string | null): Promise<TResponse> {
  if (!idToken) {
    throw new Error('Authentication token is required');
  }

  return callDispatcher(action, payload || {}, idToken);
}

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
      const idToken = await user.getIdToken(true);
      return callDispatcher(action, payload || {}, idToken);
    },
    enabled: !!user,
    retry: (failureCount, error) => {
      if (error.message.includes('Authentication') || error.message.includes('401')) {
        return false;
      }
      return failureCount < 2;
    },
    ...options,
  });

  useEffect(() => {
    if (query.error) {
      if (query.error.message.includes('Authentication') || query.error.message.includes('log in')) {
        toast({
          title: 'Session Expired',
          description: 'Please log in again to continue.',
          variant: 'destructive',
        });

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
