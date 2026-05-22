import { redirect } from 'next/navigation';
import { requireRole, getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { PageHeader, StatCard } from '@/components/ui/Card';
import { BookingsTrendChart, CategoryBreakdownChart } from '@/components/dashboard/BookingsTrendChart';
import { ValidationQueuePanel } from '@/components/dashboard/ValidationQueuePanel';
import { MANAGING_UNIT_LABEL, type FacilityRequest, type ManagingUnit, type RequestStatus } from '@/types';
import { REQUEST_LIST_ORDER_SQL } from '@/utils/priority';

const TREND_DAYS = 30;

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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

  // Trend last 30 days
  const trendSql = bureau
    ? `SELECT DATE(fr.createdAt) d,
              COUNT(*) total,
              SUM(CASE WHEN fr.status = 'APPROVED' THEN 1 ELSE 0 END) approved
       FROM facility_requests fr
       JOIN facilities f ON f.id = fr.facilityId
       WHERE fr.createdAt >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         AND f.managingUnit = ?
       GROUP BY DATE(fr.createdAt)
       ORDER BY d`
    : `SELECT DATE(createdAt) d,
              COUNT(*) total,
              SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) approved
       FROM facility_requests
       WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(createdAt)
       ORDER BY d`;
  const trendRows = await query<{ d: string | Date; total: number; approved: number }>(
    trendSql,
    bureau ? [TREND_DAYS, bureau] : [TREND_DAYS]
  );

  const trendMap = new Map<string, { total: number; approved: number }>();
  for (const r of trendRows) {
    const key = typeof r.d === 'string' ? r.d.slice(0, 10) : fmtDate(r.d);
    trendMap.set(key, { total: Number(r.total), approved: Number(r.approved) });
  }
  const trendData: { date: string; total: number; approved: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = fmtDate(d);
    const v = trendMap.get(key);
    trendData.push({ date: key, total: v?.total ?? 0, approved: v?.approved ?? 0 });
  }

  // Category breakdown
  const catSql = bureau
    ? `SELECT f.category label, COUNT(*) value
       FROM facility_requests fr
       JOIN facilities f ON f.id = fr.facilityId
       WHERE fr.createdAt >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         AND f.managingUnit = ?
       GROUP BY f.category
       ORDER BY value DESC
       LIMIT 6`
    : `SELECT f.category label, COUNT(*) value
       FROM facility_requests fr
       JOIN facilities f ON f.id = fr.facilityId
       WHERE fr.createdAt >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY f.category
       ORDER BY value DESC
       LIMIT 6`;
  const catRows = await query<{ label: string; value: number }>(
    catSql,
    bureau ? [TREND_DAYS, bureau] : [TREND_DAYS]
  );
  const catData = catRows.map((r) => ({ label: r.label, value: Number(r.value) }));

  const queueSql = bureau
    ? `SELECT fr.*, f.name AS facilityName, u.name AS userName
       FROM facility_requests fr
       JOIN facilities f ON f.id = fr.facilityId
       JOIN users u ON u.id = fr.userId
       WHERE fr.status = 'WAITING_ADMIN_UNIT' AND f.managingUnit = ?
       ORDER BY ${REQUEST_LIST_ORDER_SQL} LIMIT 5`
    : `SELECT fr.*, f.name AS facilityName, u.name AS userName
       FROM facility_requests fr
       JOIN facilities f ON f.id = fr.facilityId
       JOIN users u ON u.id = fr.userId
       WHERE fr.status = 'WAITING_ADMIN_UNIT'
       ORDER BY ${REQUEST_LIST_ORDER_SQL} LIMIT 5`;
  const queue = await query<FacilityRequest & { facilityName: string; userName: string }>(
    queueSql,
    bureau ? [bureau] : []
  );

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

      <ValidationQueuePanel
        title="Antrian Review Akhir"
        subtitle={`5 pengajuan terbaru menunggu ${bureauLabel} — prioritas review di sini.`}
        listHref="/dashboard/admin-unit/requests"
        detailHrefPrefix="/dashboard/admin-unit/requests"
        items={queue.map((r) => ({
          id: r.id,
          activityName: r.activityName,
          organizationName: r.organizationName,
          userName: r.userName,
          facilityName: r.facilityName,
          startDateTime: r.startDateTime,
          status: r.status as RequestStatus,
        }))}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BookingsTrendChart
            data={trendData}
            title="Tren Peminjaman 30 Hari Terakhir"
            subtitle={`Pengajuan masuk per hari untuk ${bureauLabel}`}
          />
        </div>
        <div className="lg:col-span-1">
          <CategoryBreakdownChart
            data={catData}
            title="Top Kategori"
            subtitle="Distribusi 30 hari terakhir"
          />
        </div>
      </div>
    </div>
  );
}
