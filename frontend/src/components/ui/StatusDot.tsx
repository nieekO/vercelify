interface StatusDotProps {
  status: string;
  className?: string;
}

const colorMap: Record<string, string> = {
  running:   '#00C853',
  healthy:   '#00C853',
  ready:     '#00C853',
  success:   '#00C853',
  building:  '#F5A623',
  deploying: '#F5A623',
  starting:  '#F5A623',
  error:     '#EE0000',
  failed:    '#EE0000',
  stopped:   '#737373',
  idle:      '#737373',
};

function getColor(status: string): string {
  const s = status.toLowerCase();
  for (const [key, color] of Object.entries(colorMap)) {
    if (s.includes(key)) return color;
  }
  return '#737373';
}

export function StatusDot({ status, className = '' }: StatusDotProps) {
  const color = getColor(status);
  const isPulsing = color === '#F5A623';
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${isPulsing ? 'animate-pulse' : ''} ${className}`}
      style={{ backgroundColor: color }}
    />
  );
}
