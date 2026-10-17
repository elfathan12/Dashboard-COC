import { Skeleton } from "@/components/ui/skeleton";

export function StatGridSkeleton({ count = 7 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-2xl border border-white/5 bg-card p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-32" />
            </div>
            <Skeleton className="size-10 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ className = "h-72" }: { className?: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-card p-5">
      <Skeleton className="mb-4 h-4 w-40" />
      <Skeleton className={className} />
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-2 rounded-2xl border border-white/5 bg-card p-4">
      <Skeleton className="h-9 w-full" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-11 w-full" />
      ))}
    </div>
  );
}
