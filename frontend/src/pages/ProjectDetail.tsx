import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Eye, EyeOff, Plus, Trash2, RefreshCw } from 'lucide-react';
import { useProject, useDeleteProject } from '../hooks/useProjects';
import api from '../services/api';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SupabaseCard } from '../components/supabase/SupabaseCard';
import { DeploymentRow } from '../components/deployments/DeploymentRow';
import { ConfirmDeleteModal } from '../components/ui/Modal';
import { Skeleton } from '../components/ui/Skeleton';
import { Toggle } from '../components/ui/Toggle';
import { Input } from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { EnvVar, CoolifyDeployment } from '../types';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'deployments', label: 'Deployments' },
  { id: 'env', label: 'Environment Variables' },
  { id: 'settings', label: 'Settings' },
];

function EnvTable({ appUuid }: { appUuid: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: vars, isLoading } = useQuery<EnvVar[]>({
    queryKey: ['env', appUuid],
    queryFn: () => api.get(`/applications/${appUuid}/environment`).then(r => r.data),
  });
  const [reveals, setReveals] = useState<Record<string, boolean>>({});
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');

  const addVar = async () => {
    if (!newKey) return;
    try {
      await api.put(`/applications/${appUuid}/environment`, { key: newKey, value: newVal });
      qc.invalidateQueries({ queryKey: ['env', appUuid] });
      setNewKey(''); setNewVal('');
      toast('Variable added');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } }).response?.data?.error || 'Failed';
      toast(msg, 'error');
    }
  };

  if (isLoading) return <Skeleton className="h-40" />;

  return (
    <div className="space-y-4">
      <div className="border border-[rgba(255,255,255,0.08)] rounded-[8px] divide-y divide-[rgba(255,255,255,0.04)]">
        {vars?.map(v => (
          <div key={v.key} className="flex items-center gap-3 px-4 py-3">
            <span className="text-sm font-mono text-gray-300 w-56 flex-shrink-0 truncate">{v.key}</span>
            <span className="text-sm font-mono text-gray-500 flex-1 truncate">
              {reveals[v.key] ? v.value : '••••••••'}
            </span>
            <button onClick={() => setReveals(r => ({ ...r, [v.key]: !r[v.key] }))} className="text-gray-600 hover:text-white">
              {reveals[v.key] ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
            {v.isManaged && (
              <span className="text-xs text-gray-600 italic">Managed by Vercelify</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input placeholder="KEY" value={newKey} onChange={e => setNewKey(e.target.value)} className="flex-1" />
        <Input placeholder="value" value={newVal} onChange={e => setNewVal(e.target.value)} className="flex-1" />
        <Button variant="secondary" size="sm" onClick={addVar}>
          <Plus size={12} /> Add
        </Button>
      </div>
    </div>
  );
}

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState('overview');
  const [showDelete, setShowDelete] = useState(false);
  const { data: project, isLoading } = useProject(id!);
  const deleteProject = useDeleteProject();

  const { data: deployments } = useQuery<CoolifyDeployment[]>({
    queryKey: ['deployments', project?.appServiceUuid],
    queryFn: () => api.get(`/deployments?app=${project?.appServiceUuid}&limit=20`)
      .then(r => Array.isArray(r.data) ? r.data : r.data?.data || []),
    enabled: !!project?.appServiceUuid,
    refetchInterval: 30000,
  });

  const deploy = useMutation({
    mutationFn: () => api.post(`/applications/${project!.appServiceUuid}/deploy`),
    onSuccess: () => toast('Deployment started'),
    onError: () => toast('Deploy failed', 'error'),
  });

  if (isLoading) return <div className="p-6"><Skeleton className="h-20" /></div>;
  if (!project) return <div className="p-6 text-gray-500">Project not found.</div>;

  return (
    <div className="p-6 max-w-5xl space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
            <Badge status="ready" />
          </div>
          <div className="flex gap-2">
            {project.appUrl && (
              <a href={project.appUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm"><ExternalLink size={12} /> Visit</Button>
              </a>
            )}
            <Button variant="secondary" size="sm" loading={deploy.isPending} onClick={() => deploy.mutate()}>
              <RefreshCw size={12} /> Redeploy
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-500">{project.gitRepo} · {project.gitBranch} · {project.environment}</p>
        {project.supabaseStudioUrl && (
          <a href={project.supabaseStudioUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#0070F3] hover:underline">
            🔗 Supabase Studio <ExternalLink size={10} />
          </a>
        )}
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <SupabaseCard project={project} />
          <div className="border border-[rgba(255,255,255,0.08)] rounded-[8px] divide-y divide-[rgba(255,255,255,0.04)]">
            {deployments?.slice(0, 5).map(d => <DeploymentRow key={d.uuid} dep={d} />)}
            {!deployments?.length && <p className="p-4 text-sm text-gray-600">No deployments yet.</p>}
          </div>
        </div>
      )}

      {/* Deployments Tab */}
      {tab === 'deployments' && (
        <div className="border border-[rgba(255,255,255,0.08)] rounded-[8px] divide-y divide-[rgba(255,255,255,0.04)]">
          {deployments?.map(d => <DeploymentRow key={d.uuid} dep={d} />)}
          {!deployments?.length && <p className="p-4 text-sm text-gray-600">No deployments yet.</p>}
        </div>
      )}

      {/* Env Vars Tab */}
      {tab === 'env' && <EnvTable appUuid={project.appServiceUuid} />}

      {/* Settings Tab */}
      {tab === 'settings' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Git</h3>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm">Auto-Deploy</p>
                <p className="text-xs text-gray-500">Deploy automatically on push</p>
              </div>
              <Toggle checked={true} onChange={() => {}} />
            </div>
          </div>

          <div className="border-t border-[rgba(255,255,255,0.08)] pt-6 space-y-3">
            <h3 className="text-sm font-medium text-red-500">Danger Zone</h3>
            <div className="flex items-center justify-between border border-red-900 rounded-[8px] p-4">
              <div>
                <p className="text-sm">Delete Project</p>
                <p className="text-xs text-gray-500">Deletes app and Supabase instance from Coolify</p>
              </div>
              <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>
                <Trash2 size={12} /> Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        projectName={project.name}
        loading={deleteProject.isPending}
        onConfirm={async () => {
          await deleteProject.mutateAsync(project.id);
          navigate('/projects');
        }}
      />
    </div>
  );
}
