import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload, GitBranch, Database, ExternalLink } from 'lucide-react';
import api from '../services/api';
import { useProjects } from '../hooks/useProjects';
import { StatusDot } from '../components/ui/StatusDot';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { ImportModal } from '../components/projects/ImportModal';
import { ProjectQuickView } from '../components/projects/ProjectQuickView';
import { CoolifyServer, CoolifyDeployment, VercelifyProject } from '../types';

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
  if (h < 12) return 'Guten Morgen';
  if (h < 18) return 'Guten Tag';
  return 'Guten Abend';
}

function todayLabel(): string {
  return new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function Overview() {
  const navigate = useNavigate();
  const { data: projects } = useProjects();
  const [selectedProject, setSelectedProject] = useState<VercelifyProject | null>(null);
  const [showImport, setShowImport] = useState(false);

  const { data: servers, isLoading: serversLoading } = useQuery<CoolifyServer[]>({
    queryKey: ['servers'],
    queryFn: () => api.get('/servers').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: deployments, isLoading: depsLoading } = useQuery<CoolifyDeployment[]>({
    queryKey: ['deployments-recent'],
    queryFn: () => api.get('/deployments?limit=6').then(r => Array.isArray(r.data) ? r.data : r.data?.data || []),
    refetchInterval: 20000,
  });

  const serversOnline = servers?.filter(s => s.is_reachable).length ?? 0;
  const supabaseCount = projects?.filter(p => p.supabaseStudioUrl).length ?? 0;
  const projectCount = projects?.length ?? 0;

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      {/* Greeting */}
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold tracking-[-0.04em]">{greeting()}, Niko</h1>
        <span className="text-xs text-gray-500">{todayLabel()}</span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border border-[rgba(255,255,255,0.08)] rounded-[8px] p-4">
          <p className="text-[11px] text-gray-600 mb-1.5">Projekte</p>
          <p className="text-3xl font-semibold tracking-tight">{projectCount}</p>
        </div>
        <div className="border border-[rgba(255,255,255,0.08)] rounded-[8px] p-4">
          <p className="text-[11px] text-gray-600 mb-1.5">Server Online</p>
          <p className={`text-3xl font-semibold tracking-tight ${serversOnline > 0 && serversOnline === servers?.length ? 'text-[#00C853]' : serversOnline > 0 ? 'text-[#F5A623]' : 'text-[#EE0000]'}`}>
            {servers ? `${serversOnline}/${servers.length}` : '—'}
          </p>
        </div>
        <div className="border border-[rgba(255,255,255,0.08)] rounded-[8px] p-4">
          <p className="text-[11px] text-gray-600 mb-1.5">Supabase</p>
          <p className="text-3xl font-semibold tracking-tight">{supabaseCount}</p>
        </div>
        <div className="border border-[rgba(255,255,255,0.08)] rounded-[8px] p-4">
          <p className="text-[11px] text-gray-600 mb-1.5">Deployments</p>
          <p className="text-3xl font-semibold tracking-tight">{deployments?.length ?? '—'}</p>
        </div>
      </div>

      {/* Projects Grid */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Alle Projekte</h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowImport(true)}>
              <Upload size={12} /> Import
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/projects/new')}>
              <Plus size={12} /> Neu
            </Button>
          </div>
        </div>

        {!projects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : !projects.length ? (
          <div className="border border-[rgba(255,255,255,0.08)] rounded-[8px] p-8 text-center space-y-3">
            <p className="text-sm text-gray-600">Noch keine Projekte vorhanden.</p>
            <div className="flex justify-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowImport(true)}>
                <Upload size={12} /> Aus Coolify importieren
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/projects/new')}>
                <Plus size={12} /> Erstes Projekt erstellen
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className="text-left border border-[rgba(255,255,255,0.08)] rounded-[8px] p-4 space-y-2 hover:border-[rgba(255,255,255,0.2)] hover:bg-[rgba(255,255,255,0.02)] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-white truncate group-hover:text-[#0070F3] transition-colors">
                    {p.name}
                  </span>
                  <span className="text-[10px] font-mono text-gray-600 flex-shrink-0 bg-[rgba(255,255,255,0.04)] px-1.5 py-0.5 rounded-[3px] border border-[rgba(255,255,255,0.06)]">
                    {p.environment}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusDot status="ready" />
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <GitBranch size={9} className="text-gray-700" />
                    {p.gitBranch}
                  </span>
                  {p.supabaseStudioUrl && (
                    <>
                      <span className="text-gray-800">·</span>
                      <Database size={10} className="text-gray-600" />
                      <span className="text-[10px] text-gray-600">Supabase</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-gray-600 truncate">{p.gitRepo || 'Kein Repository'}</p>
                <p className="text-[10px] text-gray-700">{relativeTime(p.createdAt)}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Deployments + Servers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Recent Deployments */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Letzte Deployments</h2>
            <button
              onClick={() => navigate('/deployments')}
              className="text-[10px] text-gray-600 hover:text-white transition-colors"
            >
              Alle →
            </button>
          </div>
          {depsLoading ? (
            <div className="space-y-1.5">{[1, 2, 3].map(i => <Skeleton key={i} className="h-10" />)}</div>
          ) : deployments?.length ? (
            <div className="border border-[rgba(255,255,255,0.08)] rounded-[8px] divide-y divide-[rgba(255,255,255,0.04)]">
              {deployments.map(dep => (
                <div
                  key={dep.uuid}
                  className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                  onClick={() => navigate(`/deployments/${dep.uuid}`)}
                >
                  <StatusDot status={dep.status} />
                  <span className="text-xs flex-1 truncate text-gray-300">
                    {dep.commit_message || 'Deployment'}
                  </span>
                  {dep.commit_hash && (
                    <span className="text-[10px] text-gray-700 font-mono">{dep.commit_hash.slice(0, 7)}</span>
                  )}
                  <span className="text-[10px] text-gray-700 flex-shrink-0">{relativeTime(dep.created_at)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-[rgba(255,255,255,0.08)] rounded-[8px] p-6 text-center">
              <p className="text-sm text-gray-600">Noch keine Deployments.</p>
            </div>
          )}
        </section>

        {/* Server Status */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Server Status</h2>
            <button
              onClick={() => navigate('/servers')}
              className="text-[10px] text-gray-600 hover:text-white transition-colors"
            >
              Details →
            </button>
          </div>
          {serversLoading ? (
            <div className="space-y-1.5">{[1, 2].map(i => <Skeleton key={i} className="h-14" />)}</div>
          ) : (
            <div className="border border-[rgba(255,255,255,0.08)] rounded-[8px] divide-y divide-[rgba(255,255,255,0.04)]">
              {servers?.map(server => (
                <div
                  key={server.uuid}
                  className="flex items-center gap-3 px-3 py-3 cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                  onClick={() => navigate('/servers')}
                >
                  <StatusDot status={server.is_reachable ? 'running' : 'stopped'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{server.name === 'localhost' ? 'infra-01' : server.name}</p>
                    <p className="text-[10px] text-gray-600">{server.ip}</p>
                  </div>
                  <span className={`text-[11px] font-medium ${server.is_reachable ? 'text-[#00C853]' : 'text-[#EE0000]'}`}>
                    {server.is_reachable ? 'Online' : 'Offline'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Supabase Instances */}
      {supabaseCount > 0 && (
        <section>
          <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Supabase Instanzen</h2>
          <div className="border border-[rgba(255,255,255,0.08)] rounded-[8px] divide-y divide-[rgba(255,255,255,0.04)]">
            {projects?.filter(p => p.supabaseStudioUrl).map(p => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                <StatusDot status="running" />
                <span className="text-xs flex-1 text-gray-300">{p.name}-supabase-{p.environment}</span>
                <a
                  href={p.supabaseStudioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#0070F3] hover:underline flex items-center gap-1"
                  onClick={e => e.stopPropagation()}
                >
                  Studio <ExternalLink size={10} />
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      <ImportModal open={showImport} onClose={() => setShowImport(false)} />
      <ProjectQuickView project={selectedProject} onClose={() => setSelectedProject(null)} />
    </div>
  );
}
