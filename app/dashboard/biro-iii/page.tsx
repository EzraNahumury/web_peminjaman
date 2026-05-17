import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { PageHeader, StatCard } from '@/components/ui/Card';

export default async function BiroIIIDashboard() {
  const session = await requireRole('BIRO_III');
  const [{ c: waiting }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM facility_requests WHERE status = 'WAITING_BIRO_III'"
  );
  const [{ c: approved }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM approval_logs WHERE actorId = ? AND action = 'APPROVE_BIRO_III'",
    [session.userId]
  );
  const [{ c: rejected }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM approval_logs WHERE actorId = ? AND action = 'REJECT_BIRO_III'",
    [session.userId]
  );
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard Biro III" subtitle="Review tahap 1 pengajuan peminjaman fasilitas." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Menunggu Review" value={waiting} tone="amber" />
        <StatCard label="Disetujui Anda" value={approved} tone="emerald" />
        <StatCard label="Ditolak Anda" value={rejected} tone="rose" />
      </div>
    </div>
  );
}
