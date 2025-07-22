import { create } from 'zustand';
import type { Organization } from '@/types';

interface OrganizationState {
  organizations: Organization[];
  selectedOrganization: Organization | null;
  isLoading: boolean;
  setOrganizations: (orgs: Organization[]) => void;
  setSelectedOrganization: (org: Organization | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useOrganizationStore = create<OrganizationState>((set) => ({
  organizations: [],
  selectedOrganization: null,
  isLoading: true,
  setOrganizations: (orgs) => set({ organizations: orgs }),
  setSelectedOrganization: (org) => set({ selectedOrganization: org, isLoading: true }),
  setLoading: (loading) => set({ isLoading: loading }),
})); 