import { requireRole } from '@/lib/auth';
import { getRequestsForRole } from '@/app/actions/approvals';
import { RequestTable } from '@/components/dashboard/RequestTable';
import { PageHeader } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';

type SearchProps = { searchParams: Promise<{ page?: string }> };

export default async function AdminUnitRequestsList({ searchParams }: SearchProps) {
  await requireRole('ADMIN_UNIT');
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? '1'));
  const { items, total, pageSize } = await getRequestsForRole('WAITING_ADMIN_UNIT', { page });
  return (
    <div className="space-y-6">
      <PageHeader title="Pengajuan Menunggu Admin Unit" subtitle={`${total} pengajuan menanti review akhir.`} />
      <RequestTable rows={items} baseHref="/dashboard/admin-unit/requests" showUser />
      <Pagination total={total} page={page} pageSize={pageSize} />
    </div>
  );
}
