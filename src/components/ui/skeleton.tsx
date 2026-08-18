import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md', className)} />;
}

export function TaskCardSkeleton() {
  return (
    <div className="glass rounded-lg p-5 h-full flex flex-col justify-between">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-10 w-full mt-5" />
    </div>
  );
}

export function LeaderboardRowSkeleton() {
  return (
    <div className="glass rounded-lg px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-4 w-12" />
    </div>
  );
}
