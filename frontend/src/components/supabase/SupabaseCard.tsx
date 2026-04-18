import { ExternalLink, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { VercelifyProject } from '../../types';
import { StatusDot } from '../ui/StatusDot';
import { Button } from '../ui/Button';

export function SupabaseCard({ project }: { project: VercelifyProject }) {
  const [showKey, setShowKey] = useState(false);
  if (!project.supabaseServiceUuid) return null;

  return (
    <div className="border border-[rgba(255,255,255,0.08)] rounded-[8px] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-base">🗄</span>
        <span className="text-sm font-medium">Supabase</span>
      </div>
      <p className="text-xs text-gray-500">{project.name}-supabase-{project.environment}</p>
      <div className="flex items-center gap-2">
        <StatusDot status="running" />
        <span className="text-xs text-gray-400">Running (healthy)</span>
      </div>
      {project.supabaseAnonKey && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-mono flex-1 truncate">
            {showKey ? project.supabaseAnonKey : '••••••••••••••••'}
          </span>
          <button onClick={() => setShowKey(!showKey)} className="text-gray-600 hover:text-white">
            {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>
      )}
      <div className="flex gap-2">
        {project.supabaseStudioUrl && (
          <a href={project.supabaseStudioUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="sm">
              Open Studio <ExternalLink size={10} />
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}
