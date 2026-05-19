import { redirect } from 'next/navigation';
import { requireRole, getCurrentUser } from '@/lib/auth';
import { getRequestsForRole } from '@/app/actions/approvals';
import { RequestTable } from '@/components/dashboard/RequestTable';
import { PageHeader } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { MANAGING_UNIT_LABEL, type ManagingUnit } from '@/types';

type SearchProps = { searchParams: Promise<{ page?: string; holdPage?: string; approvedPage?: string; offeredPage?: string }> };

export default async function AdminUnitRequestsList({ searchParams }: SearchProps) {
  await requireRole('ADMIN_UNIT');
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const bureau = (user.bureauScope ?? null) as ManagingUnit | null;
  const bureauLabel = bureau ? MANAGING_UNIT_LABEL[bureau] : 'Semua Unit';

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? '1'));
  const holdPage = Math.max(1, Number(sp.holdPage ?? '1'));
  const approvedPage = Math.max(1, Number(sp.approvedPage ?? '1'));
  const offeredPage = Math.max(1, Number(sp.offeredPage ?? '1'));

  const baseOpts = bureau ? { bureau } : {};

  const [waiting, onHold, approved, offered] = await Promise.all([
    getRequestsForRole('WAITING_ADMIN_UNIT', { ...baseOpts, page }),
    getRequestsForRole('ON_HOLD', { ...baseOpts, page: holdPage }),
    getRequestsForRole('APPROVED', { ...baseOpts, page: approvedPage }),
    getRequestsForRole('OVERRIDE_OFFERED', { ...baseOpts, page: offeredPage }),
  ]);

  return (
    <div className="space-y-10">
      {!bureau && (
        <div className="rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Akun Admin Unit Anda belum memiliki unit pengelola. Hubungi Super Admin untuk menetapkan unit.
        </div>
      )}

      <div className="space-y-6">
        <PageHeader
          title="Pengajuan Menunggu Admin Unit"
          subtitle={`${waiting.total} pengajuan ${bureauLabel} menanti review akhir.`}
        />
        <RequestTable rows={waiting.items} baseHref="/dashboard/admin-unit/requests" showUser />
        <Pagination total={waiting.total} page={waiting.page} pageSize={waiting.pageSize} />
      </div>

      {onHold.total > 0 && (
        <div className="space-y-6">
          <PageHeader
            title="Pengajuan Ditahan"
            subtitle={`${onHold.total} pengajuan ${bureauLabel} ditahan.`}
          />
          <RequestTable rows={onHold.items} baseHref="/dashboard/admin-unit/requests" showUser />
          <Pagination total={onHold.total} page={onHold.page} pageSize={onHold.pageSize} paramName="holdPage" />
        </div>
      )}

      {offered.total > 0 && (
        <div className="space-y-6">
          <PageHeader
            title="Menunggu Respons Override"
            subtitle={`${offered.total} pengajuan ${bureauLabel} menunggu respons pengaju.`}
          />
          <RequestTable rows={offered.items} baseHref="/dashboard/admin-unit/requests" showUser />
          <Pagination total={offered.total} page={offered.page} pageSize={offered.pageSize} paramName="offeredPage" />
        </div>
      )}

      <div className="space-y-6">
        <PageHeader
          title="Booking Disetujui"
          subtitle={`${approved.total} pengajuan ${bureauLabel} sudah disetujui.`}
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
