import { Link } from 'react-router-dom';
import { GitBranch } from 'lucide-react';
import { StatusDot } from '../ui/StatusDot';
import { CoolifyDeployment } from '../../types';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function duration(start: string, end?: string): string {
  if (!end) return '—';
  const s = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function DeploymentRow({ dep }: { dep: CoolifyDeployment }) {
  return (
    <Link
      to={`/deployments/${dep.uuid}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-950 transition-colors"
    >
      <StatusDot status={dep.status} />
      <span className="text-sm flex-1 truncate">{dep.commit_message || 'Deployment'}</span>
      <span className="flex items-center gap-1 text-xs text-gray-500">
        <GitBranch size={10} />{dep.branch || 'main'}
      </span>
      <span className="text-xs text-gray-600 font-mono">{dep.commit_hash?.slice(0,7)}</span>
      <span className="text-xs text-gray-500">{duration(dep.created_at, dep.finished_at)}</span>
      <span className="text-xs text-gray-600">{relativeTime(dep.created_at)}</span>
    </Link>
  );
}
