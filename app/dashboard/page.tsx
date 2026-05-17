import { redirect } from 'next/navigation';
import { getCurrentUser, dashboardPathForRole } from '@/lib/auth';
import { PageHeader, StatCard } from '@/components/ui/Card';
import { query } from '@/lib/db';

export default async function DashboardIndex() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'SUPER_ADMIN') redirect(dashboardPathForRole(user.role));

  const [{ c: totalUsers }] = await query<{ c: number }>('SELECT COUNT(*) c FROM users');
  const [{ c: totalReq }] = await query<{ c: number }>('SELECT COUNT(*) c FROM facility_requests');
  const [{ c: totalAppr }] = await query<{ c: number }>("SELECT COUNT(*) c FROM facility_requests WHERE status='APPROVED'");
  const [{ c: totalPending }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM facility_requests WHERE status IN ('WAITING_BIRO_III','WAITING_WR3_WD3','WAITING_ADMIN_UNIT')"
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard Super Admin" subtitle="Ringkasan sistem peminjaman fasilitas." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total User" value={totalUsers} tone="violet" />
        <StatCard label="Total Pengajuan" value={totalReq} tone="slate" />
        <StatCard label="Sedang Diproses" value={totalPending} tone="amber" />
        <StatCard label="Disetujui" value={totalAppr} tone="emerald" />
      </div>
    </div>
  );
}
