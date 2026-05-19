import { CardGridSkeleton } from '@/components/ui/Skeletons';
export default function Loading() {
  return <CardGridSkeleton count={8} columns={4} />;
}
