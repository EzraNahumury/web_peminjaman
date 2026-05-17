import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { StatCard } from '@/components/ui/Card';

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Biro III</h1>
        <p className="text-sm text-gray-500">Review pengajuan tahap 1.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Menunggu Review" value={waiting} />
        <StatCard label="Disetujui Anda" value={approved} />
        <StatCard label="Ditolak Anda" value={rejected} />
      </div>
    </div>
  );
}
