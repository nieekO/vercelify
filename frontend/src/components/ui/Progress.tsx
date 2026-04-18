interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  showText?: boolean;
}

export function Progress({ value, max = 100, label, showText = true }: ProgressProps) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct > 85 ? '#EE0000' : pct > 60 ? '#F5A623' : '#737373';

  return (
    <div className="flex flex-col gap-1">
      {(label || showText) && (
        <div className="flex justify-between items-center">
          {label && <span className="text-xs text-gray-400">{label}</span>}
          {showText && <span className="text-xs text-gray-400">{value.toFixed(1)} / {max.toFixed(1)}</span>}
        </div>
      )}
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
