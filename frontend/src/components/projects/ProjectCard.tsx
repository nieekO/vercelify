import { Link } from 'react-router-dom';
import { ExternalLink, GitBranch } from 'lucide-react';
import { VercelifyProject } from '../../types';
import { StatusDot } from '../ui/StatusDot';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function ProjectCard({ project }: { project: VercelifyProject }) {
  return (
    <div className="border border-[rgba(255,255,255,0.08)] rounded-[8px] p-4 space-y-3 hover:border-[rgba(255,255,255,0.15)] transition-colors">
      <div className="flex items-start justify-between gap-2">
        <Link to={`/projects/${project.id}`} className="text-sm font-semibold text-white hover:underline truncate">
          {project.name}
        </Link>
        <span className="text-xs text-gray-600 flex-shrink-0">{project.environment}</span>
      </div>

      <div className="flex items-center gap-2">
        <StatusDot status="ready" />
        <span className="text-xs text-gray-400">Ready</span>
        <span className="text-gray-700">·</span>
        <GitBranch size={10} className="text-gray-600" />
        <span className="text-xs text-gray-500">{project.gitBranch}</span>
      </div>

      <p className="text-xs text-gray-500 truncate">{project.gitRepo}</p>
      <p className="text-xs text-gray-600">{relativeTime(project.createdAt)}</p>

      {project.supabaseStudioUrl && (
        <a
          href={project.supabaseStudioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-[#0070F3] hover:underline"
          onClick={e => e.stopPropagation()}
        >
          Open Studio <ExternalLink size={10} />
        </a>
      )}
    </div>
  );
}
