import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { StatCard } from '@/components/ui/Card';

export default async function AdminUnitDashboard() {
  const session = await requireRole('ADMIN_UNIT');
  const [{ c: waiting }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM facility_requests WHERE status = 'WAITING_ADMIN_UNIT'"
  );
  const [{ c: approved }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM approval_logs WHERE actorId = ? AND action = 'APPROVE_ADMIN'",
    [session.userId]
  );
  const [{ c: revision }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM approval_logs WHERE actorId = ? AND action = 'REQUEST_REVISION'",
    [session.userId]
  );
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin Biro/Unit</h1>
        <p className="text-sm text-gray-500">Review akhir & finalisasi booking fasilitas.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Menunggu Review Akhir" value={waiting} />
        <StatCard label="Disetujui Anda" value={approved} />
        <StatCard label="Diminta Revisi" value={revision} />
      </div>
    </div>
  );
}
