import { requireRole } from '@/lib/auth';
import { getRequestsForRole } from '@/app/actions/approvals';
import { RequestTable } from '@/components/dashboard/RequestTable';

export default async function WR3RequestsList() {
  await requireRole('WR3_WD3');
  const rows = await getRequestsForRole('WAITING_WR3_WD3');
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Pengajuan Menunggu WR3/WD3</h1>
      <RequestTable rows={rows} baseHref="/dashboard/wr3-wd3/requests" showUser />
    </div>
  );
}
