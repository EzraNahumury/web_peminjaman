import { requireRole } from '@/lib/auth';
import { getRequestsForRole } from '@/app/actions/approvals';
import { RequestTable } from '@/components/dashboard/RequestTable';
import { PageHeader } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';

type SearchProps = { searchParams: Promise<{ page?: string; holdPage?: string }> };

export default async function AdminUnitRequestsList({ searchParams }: SearchProps) {
  await requireRole('ADMIN_UNIT');
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? '1'));
  const holdPage = Math.max(1, Number(sp.holdPage ?? '1'));

  const [waiting, onHold] = await Promise.all([
    getRequestsForRole('WAITING_ADMIN_UNIT', { page }),
    getRequestsForRole('ON_HOLD', { page: holdPage }),
  ]);

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <PageHeader
          title="Pengajuan Menunggu Admin Unit"
          subtitle={`${waiting.total} pengajuan menanti review akhir.`}
        />
        <RequestTable rows={waiting.items} baseHref="/dashboard/admin-unit/requests" showUser />
        <Pagination total={waiting.total} page={waiting.page} pageSize={waiting.pageSize} />
      </div>

      {onHold.total > 0 && (
        <div className="space-y-6">
          <PageHeader
            title="Pengajuan Ditahan"
            subtitle={`${onHold.total} pengajuan sedang ditahan dan menunggu untuk dilanjutkan.`}
          />
          <RequestTable rows={onHold.items} baseHref="/dashboard/admin-unit/requests" showUser />
          <Pagination
            total={onHold.total}
            page={onHold.page}
            pageSize={onHold.pageSize}
            paramName="holdPage"
          />
        </div>
      )}
    </div>
  );
}
