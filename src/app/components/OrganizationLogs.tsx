import { useOrganizationLogs } from '@/hooks/useOrganizationLogs';
import { useOrganizationStore } from '@/stores/organization-store';
import { useRef, useEffect } from 'react';

function formatTimestamp(ts: any) {
  if (!ts) return '';
  if (typeof ts === 'object' && ts.seconds) {
    return new Date(ts.seconds * 1000).toLocaleString();
  }
  return new Date(ts).toLocaleString();
}

const typeColors: Record<string, string> = {
  info: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  audit: 'bg-blue-100 text-blue-700',
  default: 'bg-gray-100 text-gray-700',
};

export function OrganizationLogs() {
  const { selectedOrganization } = useOrganizationStore();
  const { data: logs, isLoading, error } = useOrganizationLogs();
  const prevLogIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (logs) {
      prevLogIds.current = new Set(logs.map(l => l.id));
    }
  }, [logs]);

  if (!selectedOrganization) {
    return <div className="p-4">No organization selected.</div>;
  }
  if (isLoading) {
    return (
      <div className="p-4 animate-pulse">
        <div className="h-6 w-1/3 bg-gray-200 rounded mb-4" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  if (error) {
    return <div className="p-4 text-red-500">Error loading logs: {error.message}</div>;
  }
  if (!logs || logs.length === 0) {
    return <div className="p-4">No logs found for this organization.</div>;
  }
  return (
    <div className="p-4">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200 mb-4 py-2 px-2 flex items-center justify-between">
        <h2 className="font-headline text-xl font-bold tracking-tight">API Logs for <span className="text-primary">{selectedOrganization.name}</span></h2>
        <span className="text-xs text-muted-foreground">Showing latest {logs.length} logs</span>
      </div>
      <ul className="space-y-3">
        {logs.map(log => {
          const logType = (log as any).type || 'default';
          const logMsg = (log as any).message || '';
          const isNew = !prevLogIds.current.has(log.id);
          return (
            <li
              key={log.id}
              className={`border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow bg-white/90 animate-fade-in relative ${isNew ? 'ring-2 ring-primary/40 animate-highlight' : ''}`}
              style={{ animationDelay: `${Math.random() * 0.2}s` }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold mr-2 ${typeColors[logType] || typeColors.default}`}>
                  {logType.charAt(0).toUpperCase() + logType.slice(1)}
                </span>
                <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">
                  {formatTimestamp(log.timestamp)}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground">User:</span>
                <span className="font-mono text-xs text-blue-700">{log.userId}</span>
                <span className="text-xs text-muted-foreground ml-2">Log ID:</span>
                <span className="font-mono text-xs text-gray-700">{log.id}</span>
              </div>
              {logMsg && (
                <div className="mt-1 text-sm text-gray-800 line-clamp-2">
                  <span className="font-medium text-muted-foreground">Message:</span> {logMsg}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fade-in {
          animation: fade-in 0.5s cubic-bezier(0.4,0,0.2,1) both;
        }
        @keyframes highlight {
          0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
          70% { box-shadow: 0 0 0 6px rgba(59,130,246,0.1); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
        .animate-highlight {
          animation: highlight 1.2s cubic-bezier(0.4,0,0.2,1) 1;
        }
      `}</style>
    </div>
  );
} 