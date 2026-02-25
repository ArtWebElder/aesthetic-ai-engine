import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonCardProps {
  lines?: number;
  className?: string;
}

export function SkeletonCard({ lines = 3, className = '' }: SkeletonCardProps) {
  return (
    <div className={`bg-card border border-border/50 rounded-xl p-5 space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === 0 ? 'w-1/3' : i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}
