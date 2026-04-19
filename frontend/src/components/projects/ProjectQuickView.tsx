import { X, ExternalLink, GitBranch, Database, Globe, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { VercelifyProject } from '../../types';
import { Button } from '../ui/Button';
import { StatusDot } from '../ui/StatusDot';
import { useToast } from '../ui/Toast';
import api from '../../services/api';

interface ProjectQuickViewProps {
  project: VercelifyProject | null;
  onClose: () => void;
}

export function ProjectQuickView({ project, onClose }: ProjectQuickViewProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const deploy = useMutation({
    mutationFn: () => api.post(`/applications/${project?.appServiceUuid}/deploy`),
    onSuccess: () => { toast('Deployment gestartet'); onClose(); },
    onError: () => toast('Deployment fehlgeschlagen', 'error'),
  });

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/75" />
      <div
        className="relative bg-[#0a0a0a] border border-[rgba(255,255,255,0.12)] rounded-[10px] w-full max-w-lg shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <StatusDot status="ready" />
            <span className="font-semibold text-sm">{project.name}</span>
            <span className="text-[10px] font-mono bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] text-gray-400 px-1.5 py-0.5 rounded-[4px]">
              {project.environment}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-white transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* App URL */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">App URL</p>
            {project.appUrl ? (
              <a
                href={project.appUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#0070F3] hover:underline"
              >
                <Globe size={13} className="flex-shrink-0" />
                {project.appUrl}
                <ExternalLink size={11} />
              </a>
            ) : (
              <p className="text-sm text-gray-600">Noch kein URL konfiguriert</p>
            )}
          </div>

          {/* Repository */}
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Repository</p>
            <div className="flex items-center gap-2 text-sm">
              <GitBranch size={13} className="text-gray-600 flex-shrink-0" />
              <span className="font-mono text-xs text-gray-300">{project.gitBranch}</span>
              <span className="text-gray-700">·</span>
              <span className="text-xs text-gray-400 truncate">{project.gitRepo}</span>
            </div>
          </div>

          {/* Supabase */}
          {project.supabaseStudioUrl && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-gray-600 font-medium">Supabase</p>
              <a
                href={project.supabaseStudioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-[#0070F3] hover:underline"
              >
                <Database size={13} className="flex-shrink-0" />
                Supabase Studio öffnen
                <ExternalLink size={11} />
              </a>
              {project.supabaseSchemas?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {project.supabaseSchemas.map(s => (
                    <span
                      key={s}
                      className="text-[10px] font-mono bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-gray-400 px-1.5 py-0.5 rounded-[3px]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Created */}
          <p className="text-[11px] text-gray-700">
            Erstellt: {new Date(project.createdAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-[rgba(255,255,255,0.08)] flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            loading={deploy.isPending}
            onClick={() => deploy.mutate()}
          >
            <Zap size={12} /> Deploy
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => { navigate(`/projects/${project.id}`); onClose(); }}
          >
            Details <ArrowRight size={12} />
          </Button>
        </div>
      </div>
    </div>
  );
}
