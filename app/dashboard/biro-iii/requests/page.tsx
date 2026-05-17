import { requireRole } from '@/lib/auth';
import { getRequestsForRole } from '@/app/actions/approvals';
import { RequestTable } from '@/components/dashboard/RequestTable';

export default async function BiroIIIRequestsList() {
  await requireRole('BIRO_III');
  const rows = await getRequestsForRole('WAITING_BIRO_III');
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Pengajuan Menunggu Biro III</h1>
      <RequestTable rows={rows} baseHref="/dashboard/biro-iii/requests" showUser />
    </div>
  );
}
