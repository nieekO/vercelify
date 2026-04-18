import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import api from '../services/api';
import { useProjects } from '../hooks/useProjects';
import { StatusDot } from '../components/ui/StatusDot';
import { Skeleton } from '../components/ui/Skeleton';
import { CoolifyServer, CoolifyDeployment } from '../types';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function todayLabel(): string {
  return new Date().toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

export function Overview() {
  const { data: projects } = useProjects();
  const { data: servers, isLoading: serversLoading } = useQuery<CoolifyServer[]>({
    queryKey: ['servers'],
    queryFn: () => api.get('/servers').then(r => r.data),
    refetchInterval: 30000,
  });
  const { data: deployments, isLoading: depsLoading } = useQuery<CoolifyDeployment[]>({
    queryKey: ['deployments-recent'],
    queryFn: () => api.get('/deployments?limit=5').then(r => Array.isArray(r.data) ? r.data : r.data?.data || []),
    refetchInterval: 30000,
  });

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      {/* Greeting */}
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-[-0.04em]">{greeting()}, Niko</h1>
        <span className="text-xs text-gray-500">{todayLabel()}</span>
      </div>

      {/* Server Status */}
      <section>
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Server Status</h2>
        {serversLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {servers?.map(server => (
              <div key={server.uuid} className="border border-[rgba(255,255,255,0.08)] rounded-[8px] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusDot status={server.is_reachable ? 'running' : 'stopped'} />
                    <span className="text-sm font-medium">{server.name}</span>
                  </div>
                  {server.name === 'localhost' && (
                    <a
                      href="http://138.199.209.224:8000"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-500 hover:text-white flex items-center gap-1"
                    >
                      Open Coolify <ExternalLink size={10} />
                    </a>
                  )}
                </div>
                <p className="text-xs text-gray-500">{server.ip}</p>
                <p className="text-xs text-gray-600">
                  {server.is_reachable ? 'Reachable' : 'Unreachable'}
                  {server.is_usable ? ' · Usable' : ' · Not usable'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Deployments */}
      <section>
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Recent Deployments</h2>
        {depsLoading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : deployments?.length ? (
          <div className="border border-[rgba(255,255,255,0.08)] rounded-[8px] divide-y divide-[rgba(255,255,255,0.04)]">
            {deployments.map(dep => (
              <div key={dep.uuid} className="flex items-center gap-3 px-4 py-3">
                <StatusDot status={dep.status} />
                <span className="text-sm font-medium flex-1 truncate">
                  {dep.commit_message || 'Deployment'}
                </span>
                <span className="text-xs text-gray-500 font-mono">{dep.commit_hash?.slice(0,7)}</span>
                <span className="text-xs text-gray-500">{relativeTime(dep.created_at)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No deployments yet.</p>
        )}
      </section>

      {/* Supabase Instances */}
      {projects && projects.filter(p => p.supabaseStudioUrl).length > 0 && (
        <section>
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Supabase Instances</h2>
          <div className="border border-[rgba(255,255,255,0.08)] rounded-[8px] divide-y divide-[rgba(255,255,255,0.04)]">
            {projects.filter(p => p.supabaseStudioUrl).map(p => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <StatusDot status="running" />
                <span className="text-sm font-medium flex-1">{p.name}-supabase-{p.environment}</span>
                <a
                  href={p.supabaseStudioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#0070F3] hover:underline flex items-center gap-1"
                >
                  Open Studio <ExternalLink size={10} />
                </a>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
