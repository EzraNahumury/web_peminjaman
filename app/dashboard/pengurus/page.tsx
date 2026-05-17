import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { StatCard } from '@/components/ui/Card';

export default async function PengurusDashboard() {
  const session = await requireRole('PENGURUS');
  const [{ c: total }] = await query<{ c: number }>('SELECT COUNT(*) c FROM facility_requests WHERE userId = ?', [session.userId]);
  const [{ c: pending }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM facility_requests WHERE userId = ? AND status IN ('WAITING_BIRO_III','WAITING_WR3_WD3','WAITING_ADMIN_UNIT')",
    [session.userId]
  );
  const [{ c: approved }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM facility_requests WHERE userId = ? AND status='APPROVED'",
    [session.userId]
  );
  const [{ c: revision }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM facility_requests WHERE userId = ? AND status='REVISION_REQUESTED'",
    [session.userId]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Pengurus</h1>
          <p className="text-sm text-gray-500">Selamat datang, {session.name}</p>
        </div>
        <Link
          href="/dashboard/pengurus/requests/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Ajukan Peminjaman
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Pengajuan" value={total} />
        <StatCard label="Dalam Proses" value={pending} />
        <StatCard label="Disetujui" value={approved} />
        <StatCard label="Perlu Revisi" value={revision} />
      </div>
    </div>
  );
}
