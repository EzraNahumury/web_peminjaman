import { requireRole } from '@/lib/auth';
import { getRequestsForRole } from '@/app/actions/approvals';
import { RequestTable } from '@/components/dashboard/RequestTable';
import { PageHeader } from '@/components/ui/Card';

export default async function BiroIIIRequestsList() {
  await requireRole('BIRO_III');
  const rows = await getRequestsForRole('WAITING_BIRO_III');
  return (
    <div className="space-y-6">
      <PageHeader title="Pengajuan Menunggu Biro III" subtitle={`${rows.length} pengajuan menanti review tahap 1.`} />
      <RequestTable rows={rows} baseHref="/dashboard/biro-iii/requests" showUser />
    </div>
  );
}
