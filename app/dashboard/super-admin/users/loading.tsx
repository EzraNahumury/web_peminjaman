import { ListSkeleton, TableSkeleton } from '@/components/ui/Skeletons';
export default function Loading() {
  return (
    <div className="space-y-6">
      <ListSkeleton rows={3} />
      <TableSkeleton rows={5} />
    </div>
  );
}
