import { Skeleton } from "@/components/ui/skeleton";

function StatCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-5 flex items-center gap-4 shadow-sm">
      <Skeleton className="h-11 w-11 rounded-full shrink-0" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
