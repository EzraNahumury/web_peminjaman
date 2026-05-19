import { redirect } from 'next/navigation';
import { requireRole, getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { PageHeader, StatCard } from '@/components/ui/Card';
import type { ActivityScope } from '@/types';

export default async function WR3Dashboard() {
  const session = await requireRole('WR3_WD3');
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const scope = (user.userScope ?? 'UNIVERSITAS') as ActivityScope;
  const label = scope === 'FAKULTAS' ? 'WD3 (Tingkat Fakultas)' : 'WR3 (Tingkat Universitas)';

  const [{ c: waiting }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM facility_requests WHERE status = 'WAITING_WR3_WD3' AND activityScope = ?",
    [scope]
  );
  const [{ c: approved }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM approval_logs WHERE actorId = ? AND action = 'APPROVE_WR3_WD3'",
    [session.userId]
  );
  const [{ c: rejected }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM approval_logs WHERE actorId = ? AND action = 'REJECT_WR3_WD3'",
    [session.userId]
  );

  return (
    <div className="space-y-8">
      <PageHeader title={`Dashboard ${label}`} subtitle="Validasi digital tahap 2 pengajuan peminjaman." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard index={0} label="Menunggu Validasi" value={waiting} tone="amber" />
        <StatCard index={1} label="Disetujui Anda" value={approved} tone="primary" />
        <StatCard index={2} label="Ditolak Anda" value={rejected} tone="rose" />
      </div>
    </div>
  );
}
