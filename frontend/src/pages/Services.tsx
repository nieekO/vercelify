import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, ChevronDown, ChevronRight, RefreshCw, Square } from 'lucide-react';
import api from '../services/api';
import { useProjects } from '../hooks/useProjects';
import { StatusDot } from '../components/ui/StatusDot';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { CoolifyService } from '../types';

export function Services() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: projects } = useProjects();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data: services, isLoading } = useQuery<CoolifyService[]>({
    queryKey: ['services'],
    queryFn: () => api.get('/services').then(r => Array.isArray(r.data) ? r.data : r.data?.data || []),
    refetchInterval: 30000,
  });

  const restart = useMutation({
    mutationFn: (uuid: string) => api.post(`/services/${uuid}/restart`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); toast('Restarting...'); },
  });

  const stop = useMutation({
    mutationFn: (uuid: string) => api.post(`/services/${uuid}/stop`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['services'] }); toast('Stopped'); },
  });

  const vercelifyServices = services?.filter(s =>
    projects?.some(p => p.supabaseServiceUuid === s.uuid)
  ) || services || [];

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Supabase Instances</h1>
      {isLoading ? (
        <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : vercelifyServices.length ? (
        <div className="border border-[rgba(255,255,255,0.08)] rounded-[8px] divide-y divide-[rgba(255,255,255,0.04)]">
          {vercelifyServices.map(svc => {
            const linked = projects?.find(p => p.supabaseServiceUuid === svc.uuid);
            const isOpen = expanded[svc.uuid];
            return (
              <div key={svc.uuid}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => setExpanded(e => ({ ...e, [svc.uuid]: !e[svc.uuid] }))} className="text-gray-600 hover:text-white">
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  <StatusDot status={svc.status || 'running'} />
                  <span className="text-sm font-medium flex-1">{svc.name}</span>
                  {linked?.supabaseStudioUrl && (
                    <a href={linked.supabaseStudioUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm">
                        Open Studio <ExternalLink size={10} />
                      </Button>
                    </a>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => restart.mutate(svc.uuid)}>
                    <RefreshCw size={10} /> Restart
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => stop.mutate(svc.uuid)}>
                    <Square size={10} /> Stop
                  </Button>
                </div>
                {isOpen && (
                  <div className="px-10 pb-3 space-y-1">
                    {linked && (
                      <p className="text-xs text-gray-500">
                        Linked to: {linked.name} ({linked.environment})
                      </p>
                    )}
                    <p className="text-xs text-gray-600">UUID: {svc.uuid}</p>
                    {svc.fqdn && <p className="text-xs text-gray-600">URL: {svc.fqdn}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-600">No Supabase instances yet. Create a project to auto-provision one.</p>
      )}
    </div>
  );
}
