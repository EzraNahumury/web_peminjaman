import { Skeleton } from '@/components/ui/Card';
import { StatsSkeleton } from '@/components/ui/Skeletons';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-56" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <Skeleton className="h-20 w-full" />
      <StatsSkeleton count={4} />
    </div>
  );
}
