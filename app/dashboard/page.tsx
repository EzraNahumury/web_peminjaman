import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser, dashboardPathForRole } from '@/lib/auth';
import { PageHeader, StatCard } from '@/components/ui/Card';
import { query } from '@/lib/db';
import { Button } from '@/components/ui/Button';
import { BookingsTrendChart, CategoryBreakdownChart } from '@/components/dashboard/BookingsTrendChart';
import { RequestStatusDonut } from '@/components/dashboard/OrgRequestsChart';
import {
  DASHBOARD_ORG_DAYS,
  DASHBOARD_TREND_DAYS,
  fetchBureauBreakdown,
  fetchStatusTotals,
  fetchTrendData,
  fetchUsersByRole,
} from '@/lib/dashboard-stats';

export default async function DashboardIndex() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'SUPER_ADMIN') redirect(dashboardPathForRole(user.role));

  const filter = { kind: 'all' as const };

  const [
    [{ c: totalUsers }],
    [{ c: pendingUsers }],
    [{ c: activePengurus }],
    [{ c: staffAccounts }],
    [{ c: totalReq }],
    [{ c: totalAppr }],
    [{ c: totalPending }],
    trendData,
    statusTotals,
    usersByRole,
    bureauData,
  ] = await Promise.all([
    query<{ c: number }>('SELECT COUNT(*) c FROM users'),
    query<{ c: number }>('SELECT COUNT(*) c FROM users WHERE isActive = 0'),
    query<{ c: number }>("SELECT COUNT(*) c FROM users WHERE role = 'PENGURUS' AND isActive = 1"),
    query<{ c: number }>(
      "SELECT COUNT(*) c FROM users WHERE role IN ('BIRO_III','WR3_WD3','ADMIN_UNIT') AND isActive = 1"
    ),
    query<{ c: number }>('SELECT COUNT(*) c FROM facility_requests'),
    query<{ c: number }>("SELECT COUNT(*) c FROM facility_requests WHERE status='APPROVED'"),
    query<{ c: number }>(
      "SELECT COUNT(*) c FROM facility_requests WHERE status IN ('WAITING_BIRO_III','WAITING_WR3_WD3','WAITING_ADMIN_UNIT')"
    ),
    fetchTrendData(filter, DASHBOARD_TREND_DAYS),
    fetchStatusTotals(filter, DASHBOARD_ORG_DAYS),
    fetchUsersByRole(),
    fetchBureauBreakdown(DASHBOARD_TREND_DAYS),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard Super Admin"
        subtitle="Pemantauan sistem, aktivasi pengurus, dan statistik peminjaman fasilitas kampus."
      />

      {pendingUsers > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 9v4M12 17h.01M5.07 19h13.86A2 2 0 0 0 20.66 16L13.73 4a2 2 0 0 0-3.46 0L3.34 16A2 2 0 0 0 5.07 19Z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">
                {pendingUsers} akun pengurus menunggu aktivasi
              </p>
              <p className="text-xs text-amber-800">
                Pengurus baru tidak dapat login sampai akun mereka diaktifkan.
              </p>
            </div>
          </div>
          <Link href="/dashboard/super-admin/users">
            <Button>Tinjau Sekarang →</Button>
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          index={0}
          label="Total User"
          value={totalUsers}
          tone="violet"
          hint={`${pendingUsers} menunggu aktivasi`}
        />
        <StatCard index={1} label="Pengurus LK/OK Aktif" value={activePengurus} tone="primary" />
        <StatCard
          index={2}
          label="Akun Validator / Admin"
          value={staffAccounts}
          tone="slate"
          hint="Biro III, WR3/WD3, Admin Unit"
        />
        <StatCard
          index={3}
          label="Pengajuan Diproses"
          value={totalPending}
          tone="amber"
          hint={`${totalAppr} disetujui · ${totalReq} total`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BookingsTrendChart
            data={trendData}
            title="Tren Pengajuan Sistem"
            subtitle={`${DASHBOARD_TREND_DAYS} hari terakhir · seluruh unit & organisasi`}
          />
        </div>
        <RequestStatusDonut
          approved={statusTotals.approved}
          pending={statusTotals.pending}
          rejected={statusTotals.rejected}
          title="Komposisi Status Pengajuan"
          subtitle={`${DASHBOARD_ORG_DAYS} hari terakhir · semua peminjaman`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryBreakdownChart
          data={usersByRole}
          title="Distribusi Akun per Role"
          subtitle="Akun aktif di sistem · pemantauan beban validator"
        />
        <CategoryBreakdownChart
          data={bureauData}
          title="Pengajuan per Unit Pengelola"
          subtitle={`${DASHBOARD_TREND_DAYS} hari terakhir · Biro I, Biro IV, PPLK, KRT, LPAIP`}
        />
      </div>
    </div>
  );
}
