import { requireRole } from '@/lib/auth';
import { getRequestsForRole } from '@/app/actions/approvals';
import { RequestTable } from '@/components/dashboard/RequestTable';

export default async function AdminUnitRequestsList() {
  await requireRole('ADMIN_UNIT');
  const rows = await getRequestsForRole('WAITING_ADMIN_UNIT');
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Pengajuan Menunggu Admin Unit</h1>
      <RequestTable rows={rows} baseHref="/dashboard/admin-unit/requests" showUser />
    </div>
  );
}
