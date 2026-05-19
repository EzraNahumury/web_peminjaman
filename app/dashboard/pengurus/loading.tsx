import { Skeleton } from '@/components/ui/Card';
import { StatsSkeleton } from '@/components/ui/Skeletons';

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>
      <StatsSkeleton count={4} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-72 w-full lg:col-span-2" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}
