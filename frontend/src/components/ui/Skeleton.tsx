interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`bg-gray-800 animate-pulse rounded-[4px] ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="border border-[rgba(255,255,255,0.08)] rounded-[8px] p-4 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}
