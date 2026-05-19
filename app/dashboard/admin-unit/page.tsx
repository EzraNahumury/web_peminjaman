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
  const [{ c: blocks }] = await query<{ c: number }>('SELECT COUNT(*) c FROM facility_blocks');
  const [{ c: facilities }] = await query<{ c: number }>('SELECT COUNT(*) c FROM facilities WHERE isActive = 1');

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard Admin Biro / Unit" subtitle="Keputusan akhir & pengelolaan fasilitas." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard index={0} label="Menunggu Review Akhir" value={waiting} tone="amber" />
        <StatCard index={1} label="Disetujui Anda" value={approved} tone="primary" />
        <StatCard index={2} label="Diminta Revisi" value={revision} tone="blue" />
        <StatCard index={3} label="Fasilitas Aktif" value={facilities} tone="slate" hint={`${blocks} jadwal terblokir`} />
      </div>
    </div>
  );
}
