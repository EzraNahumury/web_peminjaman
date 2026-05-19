import { redirect } from 'next/navigation';
import { requireRole, getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { PageHeader, StatCard } from '@/components/ui/Card';
import { MANAGING_UNIT_LABEL, type ManagingUnit } from '@/types';

export default async function AdminUnitDashboard() {
  const session = await requireRole('ADMIN_UNIT');
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const bureau = (user.bureauScope ?? null) as ManagingUnit | null;
  const bureauLabel = bureau ? MANAGING_UNIT_LABEL[bureau] : 'Semua Unit';

  const waitingSql = bureau
    ? `SELECT COUNT(*) c FROM facility_requests fr JOIN facilities f ON f.id = fr.facilityId
       WHERE fr.status = 'WAITING_ADMIN_UNIT' AND f.managingUnit = ?`
    : "SELECT COUNT(*) c FROM facility_requests WHERE status = 'WAITING_ADMIN_UNIT'";
  const [{ c: waiting }] = await query<{ c: number }>(waitingSql, bureau ? [bureau] : []);

  const [{ c: approved }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM approval_logs WHERE actorId = ? AND action = 'APPROVE_ADMIN'",
    [session.userId]
  );
  const [{ c: revision }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM approval_logs WHERE actorId = ? AND action = 'REQUEST_REVISION'",
    [session.userId]
  );

  const blocksSql = bureau
    ? `SELECT COUNT(*) c FROM facility_blocks b LEFT JOIN facilities f ON f.id = b.facilityId
       WHERE b.facilityId IS NULL OR f.managingUnit = ?`
    : 'SELECT COUNT(*) c FROM facility_blocks';
  const [{ c: blocks }] = await query<{ c: number }>(blocksSql, bureau ? [bureau] : []);

  const facilitiesSql = bureau
    ? 'SELECT COUNT(*) c FROM facilities WHERE isActive = 1 AND managingUnit = ?'
    : 'SELECT COUNT(*) c FROM facilities WHERE isActive = 1';
  const [{ c: facilities }] = await query<{ c: number }>(facilitiesSql, bureau ? [bureau] : []);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Dashboard Admin ${bureauLabel}`}
        subtitle="Keputusan akhir & pengelolaan fasilitas unit Anda."
      />
      {!bureau && (
        <div className="rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Akun Admin Unit Anda belum memiliki unit pengelola. Hubungi Super Admin untuk menetapkan unit.
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard index={0} label="Menunggu Review Akhir" value={waiting} tone="amber" />
        <StatCard index={1} label="Disetujui Anda" value={approved} tone="primary" />
        <StatCard index={2} label="Diminta Revisi" value={revision} tone="blue" />
        <StatCard
          index={3}
          label={`Fasilitas Aktif ${bureauLabel}`}
          value={facilities}
          tone="slate"
          hint={`${blocks} jadwal terblokir`}
        />
      </div>
    </div>
  );
}
