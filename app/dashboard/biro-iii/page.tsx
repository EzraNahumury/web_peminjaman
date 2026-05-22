import { requireRole } from '@/lib/auth';
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
import type { FacilityRequest, RequestStatus } from '@/types';
import { REQUEST_LIST_ORDER_SQL } from '@/utils/priority';

export default async function BiroIIIDashboard() {
  const session = await requireRole('BIRO_III');
  const filter = { kind: 'all' as const };

  const [
    [{ c: waiting }],
    [{ c: approved }],
    [{ c: rejected }],
    [{ c: inPipeline }],
    trendData,
    orgData,
    statusTotals,
    queue,
  ] = await Promise.all([
    query<{ c: number }>("SELECT COUNT(*) c FROM facility_requests WHERE status = 'WAITING_BIRO_III'"),
    query<{ c: number }>(
      "SELECT COUNT(*) c FROM approval_logs WHERE actorId = ? AND action = 'APPROVE_BIRO_III'",
      [session.userId]
    ),
    query<{ c: number }>(
      "SELECT COUNT(*) c FROM approval_logs WHERE actorId = ? AND action = 'REJECT_BIRO_III'",
      [session.userId]
    ),
    query<{ c: number }>(
      `SELECT COUNT(*) c FROM facility_requests
       WHERE status IN ('WAITING_WR3_WD3','WAITING_ADMIN_UNIT','REVISION_REQUESTED','ON_HOLD')`
    ),
    fetchTrendData(filter, DASHBOARD_TREND_DAYS),
    fetchOrgBreakdown(filter, DASHBOARD_ORG_DAYS, 10),
    fetchStatusTotals(filter, DASHBOARD_ORG_DAYS),
    query<FacilityRequest & { facilityName: string; userName: string }>(
      `SELECT fr.*, f.name AS facilityName, u.name AS userName
       FROM facility_requests fr
       JOIN facilities f ON f.id = fr.facilityId
       JOIN users u ON u.id = fr.userId
       WHERE fr.status = 'WAITING_BIRO_III'
       ORDER BY ${REQUEST_LIST_ORDER_SQL} LIMIT 5`
    ),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard Biro III Kemahasiswaan"
        subtitle="Memantau dan memvalidasi seluruh kegiatan peminjaman fasilitas dari Lembaga/Kegiatan Kemahasiswaan (LK/OK)."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard index={0} label="Menunggu Review Biro III" value={waiting} tone="amber" />
        <StatCard index={1} label="Disetujui Anda" value={approved} tone="primary" />
        <StatCard index={2} label="Ditolak Anda" value={rejected} tone="rose" />
        <StatCard
          index={3}
          label="Lanjut ke WR3 / Admin"
          value={inPipeline}
          tone="slate"
          hint="Pengajuan yang sudah melewati tahap Biro III"
        />
      </div>

      <ValidationQueuePanel
        title="Antrian Validasi Tahap 1"
        subtitle="5 pengajuan terbaru yang menunggu Anda — prioritas review di sini."
        listHref="/dashboard/biro-iii/requests"
        detailHrefPrefix="/dashboard/biro-iii/requests"
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
            title="Tren Pengajuan LK/OK"
            subtitle={`${DASHBOARD_TREND_DAYS} hari terakhir · seluruh organisasi kemahasiswaan`}
          />
        </div>
        <RequestStatusDonut
          approved={statusTotals.approved}
          pending={statusTotals.pending}
          rejected={statusTotals.rejected}
          title="Komposisi Status"
          subtitle={`${DASHBOARD_ORG_DAYS} hari terakhir · semua pengajuan`}
        />
      </div>

      <OrgRequestsChart
        data={orgData}
        title="Volume per Organisasi LK/OK"
        subtitle={`Top 10 organisasi · ${DASHBOARD_ORG_DAYS} hari · Biro III sebagai unit pengetahui kegiatan kemahasiswaan`}
      />
    </div>
  );
}
