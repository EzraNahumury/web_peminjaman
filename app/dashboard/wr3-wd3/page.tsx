import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { StatCard } from '@/components/ui/Card';

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard WR3 / WD3</h1>
        <p className="text-sm text-gray-500">Validasi digital pengajuan.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Menunggu Validasi" value={waiting} />
        <StatCard label="Disetujui Anda" value={approved} />
        <StatCard label="Ditolak Anda" value={rejected} />
      </div>
    </div>
  );
}
