import { requireRole } from '@/lib/auth';
import { getRequestsForRole } from '@/app/actions/approvals';
import { RequestTable } from '@/components/dashboard/RequestTable';
import { PageHeader } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';

type SearchProps = { searchParams: Promise<{ page?: string }> };

export default async function BiroIIIRequestsList({ searchParams }: SearchProps) {
  await requireRole('BIRO_III');
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? '1'));
  const { items, total, pageSize } = await getRequestsForRole('WAITING_BIRO_III', { page });
  return (
    <div className="space-y-6">
      <PageHeader title="Pengajuan Menunggu Biro III" subtitle={`${total} pengajuan menanti review tahap 1.`} />
      <RequestTable rows={items} baseHref="/dashboard/biro-iii/requests" showUser />
      <Pagination total={total} page={page} pageSize={pageSize} />
    </div>
  );
}
