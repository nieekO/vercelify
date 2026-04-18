import { StatusDot } from './StatusDot';

interface BadgeProps {
  status: string;
  label?: string;
}

export function Badge({ status, label }: BadgeProps) {
  const text = label || status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-gray-900 border border-[rgba(255,255,255,0.08)] text-xs font-medium">
      <StatusDot status={status} />
      {text}
    </span>
  );
}
