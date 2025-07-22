import { useQuery } from '@tanstack/react-query';
import { useOrganizationStore } from '@/stores/organization-store';
import type { ApiLog } from '@/types';

export function useOrganizationLogs() {
  const { selectedOrganization } = useOrganizationStore();

  return useQuery<ApiLog[]>({
    queryKey: ['org-logs', selectedOrganization?.id],
    queryFn: async () => {
      if (!selectedOrganization) return [];
      const res = await fetch(`/api/logs?orgId=${selectedOrganization.id}`);
      if (!res.ok) throw new Error('Failed to fetch logs');
      return res.json();
    },
    enabled: !!selectedOrganization,
  });
} 