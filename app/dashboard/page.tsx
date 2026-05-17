import { redirect } from 'next/navigation';
import { getCurrentUser, dashboardPathForRole } from '@/lib/auth';
import { StatCard } from '@/components/ui/Card';
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Super Admin</h1>
        <p className="text-sm text-gray-500">Ringkasan sistem peminjaman fasilitas.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total User" value={totalUsers} />
        <StatCard label="Total Pengajuan" value={totalReq} />
        <StatCard label="Sedang Diproses" value={totalPending} />
        <StatCard label="Disetujui" value={totalAppr} />
      </div>
    </div>
  );
}
