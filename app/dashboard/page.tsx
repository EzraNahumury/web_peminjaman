import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser, dashboardPathForRole } from '@/lib/auth';
import { PageHeader, StatCard } from '@/components/ui/Card';
import { query } from '@/lib/db';
import { Button } from '@/components/ui/Button';

export default async function DashboardIndex() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'SUPER_ADMIN') redirect(dashboardPathForRole(user.role));

  const [{ c: totalUsers }] = await query<{ c: number }>('SELECT COUNT(*) c FROM users');
  const [{ c: pendingUsers }] = await query<{ c: number }>('SELECT COUNT(*) c FROM users WHERE isActive = 0');
  const [{ c: totalReq }] = await query<{ c: number }>('SELECT COUNT(*) c FROM facility_requests');
  const [{ c: totalAppr }] = await query<{ c: number }>("SELECT COUNT(*) c FROM facility_requests WHERE status='APPROVED'");
  const [{ c: totalPending }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM facility_requests WHERE status IN ('WAITING_BIRO_III','WAITING_WR3_WD3','WAITING_ADMIN_UNIT')"
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard Super Admin" subtitle="Ringkasan sistem peminjaman fasilitas." />

      {pendingUsers > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <StatCard label="Total User" value={totalUsers} tone="violet" hint={`${pendingUsers} menunggu aktivasi`} />
        <StatCard label="Total Pengajuan" value={totalReq} tone="slate" />
        <StatCard label="Sedang Diproses" value={totalPending} tone="amber" />
        <StatCard label="Disetujui" value={totalAppr} tone="primary" />
      </div>
    </div>
  );
}
