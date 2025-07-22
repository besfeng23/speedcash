import { useOrganizationStore } from '@/stores/organization-store';

export function OrganizationSwitcher() {
  const { organizations, selectedOrganization, setSelectedOrganization } = useOrganizationStore();

  if (!organizations || organizations.length === 0) {
    return <div className="p-4">No organizations available.</div>;
  }

  return (
    <div className="p-4">
      <label htmlFor="org-switcher" className="block mb-2 font-medium">Select Organization:</label>
      <select
        id="org-switcher"
        className="border rounded px-2 py-1"
        value={selectedOrganization?.id || ''}
        onChange={e => {
          const org = organizations.find(o => o.id === e.target.value) || null;
          setSelectedOrganization(org);
        }}
      >
        {organizations.map(org => (
          <option key={org.id} value={org.id}>{org.name}</option>
        ))}
      </select>
    </div>
  );
} 