import { useEffect } from 'react';
import { useOrganizationStore } from '@/stores/organization-store';
// import { useErrorStore } from '@/stores/error-store'; // Uncomment if you have a global error store

export function AppInitializer() {
  const { setOrganizations, setSelectedOrganization, setLoading } = useOrganizationStore();

  useEffect(() => {
    let isMounted = true;
    async function fetchUserOrgs() {
      setLoading(true);
      try {
        const response = await fetch('/api/user/organizations');
        if (!response.ok) {
          throw new Error(`Failed to fetch organizations: ${response.statusText}`);
        }
        const orgs = await response.json();
        if (isMounted) {
          if (orgs && orgs.length > 0) {
            setOrganizations(orgs);
            setSelectedOrganization(orgs[0]);
          } else {
            setOrganizations([]);
            setSelectedOrganization(null);
          }
        }
      } catch (error) {
        console.error(error);
        // useErrorStore.getState().setError('Could not load your organizations.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchUserOrgs();
    return () => { isMounted = false; };
  }, [setOrganizations, setSelectedOrganization, setLoading]);

  return null;
} 