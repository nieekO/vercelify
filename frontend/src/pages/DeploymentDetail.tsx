import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { StatusDot } from '../components/ui/StatusDot';
import { Skeleton } from '../components/ui/Skeleton';

function colorize(line: string): string {
  if (line.includes('✓') || line.includes('success') || line.includes('done')) return 'text-green-400';
  if (line.includes('✗') || line.includes('error') || line.includes('Error') || line.includes('failed')) return 'text-red-400';
  if (line.includes('warn') || line.includes('⚠')) return 'text-yellow-400';
  if (line.match(/\[\d{2}:\d{2}/)) return 'text-gray-400';
  return 'text-gray-300';
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function DeploymentDetail() {
  const { uuid } = useParams<{ uuid: string }>();

  const { data: dep, isLoading } = useQuery({
    queryKey: ['deployment', uuid],
    queryFn: () => api.get(`/deployments/${uuid}`).then(r => r.data),
  });

  if (isLoading) return <div className="p-6"><Skeleton className="h-40" /></div>;
  if (!dep) return <div className="p-6 text-gray-500">Deployment not found.</div>;

  const logs: string[] = dep.logs
    ? (typeof dep.logs === 'string' ? dep.logs.split('\n') : dep.logs)
    : [];

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <StatusDot status={dep.status} />
          <span className="text-sm font-medium capitalize">{dep.status}</span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500 font-mono">{dep.commit_hash?.slice(0,7)} · {dep.branch || 'main'}</p>
          <p className="text-xs text-gray-600">{relativeTime(dep.created_at)}</p>
        </div>
        {dep.commit_message && <p className="text-sm text-gray-300">"{dep.commit_message}"</p>}
      </div>

      <div className="space-y-2">
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Build Log</h2>
        <div className="bg-gray-950 border border-[rgba(255,255,255,0.08)] rounded-[8px] p-4 overflow-auto max-h-[500px]">
          {logs.length ? (
            <pre className="font-mono text-[13px] leading-5 space-y-0">
              {logs.map((line, i) => (
                <div key={i} className={colorize(line)}>{line}</div>
              ))}
            </pre>
          ) : (
            <p className="text-xs text-gray-600">No logs available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
