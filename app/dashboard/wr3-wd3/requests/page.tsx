import { requireRole } from '@/lib/auth';
import { getRequestsForRole } from '@/app/actions/approvals';
import { RequestTable } from '@/components/dashboard/RequestTable';
import { PageHeader } from '@/components/ui/Card';

export default async function WR3RequestsList() {
  await requireRole('WR3_WD3');
  const rows = await getRequestsForRole('WAITING_WR3_WD3');
  return (
    <div className="space-y-6">
      <PageHeader title="Pengajuan Menunggu WR3/WD3" subtitle={`${rows.length} pengajuan menanti validasi.`} />
      <RequestTable rows={rows} baseHref="/dashboard/wr3-wd3/requests" showUser />
    </div>
  );
}
