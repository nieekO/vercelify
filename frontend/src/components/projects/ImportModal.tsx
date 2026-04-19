import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, GitBranch, Globe } from 'lucide-react';
import api from '../../services/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useToast } from '../ui/Toast';

interface CoolifyApp {
  uuid: string;
  name: string;
  git_repository?: string;
  git_branch?: string;
  status?: string;
  fqdn?: string;
  project_uuid?: string;
}

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

export function ImportModal({ open, onClose }: ImportModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [importing, setImporting] = useState<string | null>(null);

  const { data: apps, isLoading } = useQuery<CoolifyApp[]>({
    queryKey: ['importable-apps'],
    queryFn: () => api.get('/projects/importable').then(r => r.data),
    enabled: open,
  });

  const handleImport = async (app: CoolifyApp) => {
    setImporting(app.uuid);
    try {
      await api.post('/projects/import', app);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['importable-apps'] });
      toast(`"${app.name}" importiert`);
    } catch {
      toast('Import fehlgeschlagen', 'error');
    } finally {
      setImporting(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Aus Coolify importieren">
      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : !apps?.length ? (
        <p className="text-sm text-gray-500 py-6 text-center">
          Alle Coolify-Apps sind bereits in Vercelify importiert.
        </p>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto -mx-1 px-1">
          {apps.map(app => (
            <div
              key={app.uuid}
              className="flex items-center gap-3 p-3 border border-[rgba(255,255,255,0.08)] rounded-[6px] hover:border-[rgba(255,255,255,0.15)] transition-colors"
            >
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-sm font-medium truncate">{app.name}</p>
                {app.git_repository && (
                  <div className="flex items-center gap-1.5">
                    <GitBranch size={10} className="text-gray-600 flex-shrink-0" />
                    <span className="text-xs text-gray-500 truncate">
                      {app.git_repository.replace('https://github.com/', '')}
                      {app.git_branch ? ` · ${app.git_branch}` : ''}
                    </span>
                  </div>
                )}
                {app.fqdn && (
                  <div className="flex items-center gap-1.5">
                    <Globe size={10} className="text-gray-600 flex-shrink-0" />
                    <span className="text-xs text-gray-600 truncate">{app.fqdn}</span>
                  </div>
                )}
              </div>
              <Button
                variant="secondary"
                size="sm"
                loading={importing === app.uuid}
                onClick={() => handleImport(app)}
              >
                <Download size={11} /> Import
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)] flex justify-end">
        <Button variant="ghost" size="sm" onClick={onClose}>Schließen</Button>
      </div>
    </Modal>
  );
}
