import { requireRole } from '@/lib/auth';
import { getRequestsForRole } from '@/app/actions/approvals';
import { RequestTable } from '@/components/dashboard/RequestTable';
import { PageHeader } from '@/components/ui/Card';

export default async function AdminUnitRequestsList() {
  await requireRole('ADMIN_UNIT');
  const rows = await getRequestsForRole('WAITING_ADMIN_UNIT');
  return (
    <div className="space-y-6">
      <PageHeader title="Pengajuan Menunggu Admin Unit" subtitle={`${rows.length} pengajuan menanti review akhir.`} />
      <RequestTable rows={rows} baseHref="/dashboard/admin-unit/requests" showUser />
    </div>
  );
}
