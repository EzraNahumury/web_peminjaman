import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { PageHeader, StatCard } from '@/components/ui/Card';

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
      <PageHeader title="Dashboard Admin Biro / Unit" subtitle="Review akhir & finalisasi booking fasilitas." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Menunggu Review Akhir" value={waiting} tone="amber" />
        <StatCard label="Disetujui Anda" value={approved} tone="emerald" />
        <StatCard label="Diminta Revisi" value={revision} tone="blue" />
      </div>
    </div>
  );
}
