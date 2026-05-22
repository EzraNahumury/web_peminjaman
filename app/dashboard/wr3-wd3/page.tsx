import { redirect } from 'next/navigation';
import { requireRole, getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { PageHeader, StatCard } from '@/components/ui/Card';
import { BookingsTrendChart } from '@/components/dashboard/BookingsTrendChart';
import { OrgRequestsChart, RequestStatusDonut } from '@/components/dashboard/OrgRequestsChart';
import { ValidationQueuePanel } from '@/components/dashboard/ValidationQueuePanel';
import {
  DASHBOARD_ORG_DAYS,
  DASHBOARD_TREND_DAYS,
  fetchOrgBreakdown,
  fetchStatusTotals,
  fetchTrendData,
} from '@/lib/dashboard-stats';
import type { ActivityScope, FacilityRequest, RequestStatus } from '@/types';
import { REQUEST_LIST_ORDER_SQL } from '@/utils/priority';

export default async function WR3Dashboard() {
  const session = await requireRole('WR3_WD3');
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const scope = (user.userScope ?? 'UNIVERSITAS') as ActivityScope;
  const isFakultas = scope === 'FAKULTAS';
  const label = isFakultas ? 'WD3 (Tingkat Fakultas)' : 'WR3 (Tingkat Universitas)';
  const filter = { kind: 'scope' as const, scope };
  const scopeLabel = isFakultas ? 'Fakultas' : 'Universitas';

  const [
    [{ c: waiting }],
    [{ c: approved }],
    [{ c: rejected }],
    trendData,
    orgData,
    statusTotals,
    queue,
  ] = await Promise.all([
    query<{ c: number }>(
      "SELECT COUNT(*) c FROM facility_requests WHERE status = 'WAITING_WR3_WD3' AND activityScope = ?",
      [scope]
    ),
    query<{ c: number }>(
      "SELECT COUNT(*) c FROM approval_logs WHERE actorId = ? AND action = 'APPROVE_WR3_WD3'",
      [session.userId]
    ),
    query<{ c: number }>(
      "SELECT COUNT(*) c FROM approval_logs WHERE actorId = ? AND action = 'REJECT_WR3_WD3'",
      [session.userId]
    ),
    fetchTrendData(filter, DASHBOARD_TREND_DAYS),
    fetchOrgBreakdown(filter, DASHBOARD_ORG_DAYS, 10),
    fetchStatusTotals(filter, DASHBOARD_ORG_DAYS),
    query<FacilityRequest & { facilityName: string; userName: string }>(
      `SELECT fr.*, f.name AS facilityName, u.name AS userName
       FROM facility_requests fr
       JOIN facilities f ON f.id = fr.facilityId
       JOIN users u ON u.id = fr.userId
       WHERE fr.status = 'WAITING_WR3_WD3' AND fr.activityScope = ?
       ORDER BY ${REQUEST_LIST_ORDER_SQL} LIMIT 5`,
      [scope]
    ),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Dashboard ${label}`}
        subtitle={`Penanggung jawab kegiatan tingkat ${scopeLabel} — validasi digital tahap 2 pengajuan peminjaman yang Anda ketahui.`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard index={0} label="Menunggu Validasi" value={waiting} tone="amber" />
        <StatCard index={1} label="Disetujui Anda" value={approved} tone="primary" />
        <StatCard index={2} label="Ditolak Anda" value={rejected} tone="rose" />
      </div>

      <ValidationQueuePanel
        title={`Antrian Validasi ${isFakultas ? 'WD3' : 'WR3'}`}
        subtitle={`5 pengajuan terbaru tingkat ${scopeLabel} yang menunggu Anda — prioritas review di sini.`}
        listHref="/dashboard/wr3-wd3/requests"
        detailHrefPrefix="/dashboard/wr3-wd3/requests"
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
            title="Tren Pengajuan Masuk"
            subtitle={`${DASHBOARD_TREND_DAYS} hari terakhir · tingkat ${scopeLabel} · kegiatan dalam lingkup Anda`}
          />
        </div>
        <RequestStatusDonut
          approved={statusTotals.approved}
          pending={statusTotals.pending}
          rejected={statusTotals.rejected}
          title="Komposisi Status"
          subtitle={`${DASHBOARD_ORG_DAYS} hari terakhir · lingkup ${scopeLabel}`}
        />
      </div>

      <OrgRequestsChart
        data={orgData}
        title="Organisasi dalam Lingkup Anda"
        subtitle={`Top 10 organisasi · ${DASHBOARD_ORG_DAYS} hari · hanya kegiatan tingkat ${scopeLabel}`}
      />
    </div>
  );
}
