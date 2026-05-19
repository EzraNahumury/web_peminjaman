import { requireRole } from '@/lib/auth';
import { getRequestsForRole } from '@/app/actions/approvals';
import { RequestTable } from '@/components/dashboard/RequestTable';
import { PageHeader } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';

type SearchProps = { searchParams: Promise<{ page?: string; holdPage?: string; approvedPage?: string; offeredPage?: string }> };

export default async function AdminUnitRequestsList({ searchParams }: SearchProps) {
  await requireRole('ADMIN_UNIT');
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? '1'));
  const holdPage = Math.max(1, Number(sp.holdPage ?? '1'));
  const approvedPage = Math.max(1, Number(sp.approvedPage ?? '1'));
  const offeredPage = Math.max(1, Number(sp.offeredPage ?? '1'));

  const [waiting, onHold, approved, offered] = await Promise.all([
    getRequestsForRole('WAITING_ADMIN_UNIT', { page }),
    getRequestsForRole('ON_HOLD', { page: holdPage }),
    getRequestsForRole('APPROVED', { page: approvedPage }),
    getRequestsForRole('OVERRIDE_OFFERED', { page: offeredPage }),
  ]);

  return (
    <div className="space-y-10">
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

      {offered.total > 0 && (
        <div className="space-y-6">
          <PageHeader
            title="Menunggu Respons Override"
            subtitle={`${offered.total} pengajuan sedang menanti pengaju menerima/menolak tawaran perpindahan.`}
          />
          <RequestTable rows={offered.items} baseHref="/dashboard/admin-unit/requests" showUser />
          <Pagination
            total={offered.total}
            page={offered.page}
            pageSize={offered.pageSize}
            paramName="offeredPage"
          />
        </div>
      )}

      <div className="space-y-6">
        <PageHeader
          title="Booking Disetujui"
          subtitle={`${approved.total} pengajuan sudah disetujui. Klik detail untuk override jika ada keadaan mendesak.`}
        />
        <RequestTable rows={approved.items} baseHref="/dashboard/admin-unit/requests" showUser />
        <Pagination
          total={approved.total}
          page={approved.page}
          pageSize={approved.pageSize}
          paramName="approvedPage"
        />
      </div>
    </div>
  );
}
