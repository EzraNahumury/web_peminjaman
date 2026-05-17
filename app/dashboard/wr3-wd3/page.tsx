import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { PageHeader, StatCard } from '@/components/ui/Card';

export default async function WR3Dashboard() {
  const session = await requireRole('WR3_WD3');
  const [{ c: waiting }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM facility_requests WHERE status = 'WAITING_WR3_WD3'"
  );
  const [{ c: approved }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM approval_logs WHERE actorId = ? AND action = 'APPROVE_WR3_WD3'",
    [session.userId]
  );
  const [{ c: rejected }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM approval_logs WHERE actorId = ? AND action = 'REJECT_WR3_WD3'",
    [session.userId]
  );
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard WR3 / WD3" subtitle="Validasi digital pengajuan tahap 2." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Menunggu Validasi" value={waiting} tone="amber" />
        <StatCard label="Disetujui Anda" value={approved} tone="emerald" />
        <StatCard label="Ditolak Anda" value={rejected} tone="rose" />
      </div>
    </div>
  );
}
