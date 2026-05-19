import { Skeleton } from '@/components/ui/Card';
import { StatsSkeleton } from '@/components/ui/Skeletons';

export default function Loading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-7 w-56" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <StatsSkeleton count={4} />
    </div>
  );
}
