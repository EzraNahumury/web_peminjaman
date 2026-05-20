import { redirect } from 'next/navigation';
import { requireRole, getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { PageHeader, StatCard } from '@/components/ui/Card';
import { OrgRequestsChart, type OrgRow } from '@/components/dashboard/OrgRequestsChart';
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

  const orgRows = await query<{
    organization: string;
    total: number;
    approved: number;
    rejected: number;
    pending: number;
  }>(
    `SELECT organizationName AS organization,
            COUNT(*) AS total,
            SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) AS approved,
            SUM(CASE WHEN status IN ('REJECTED','REJECTED_BY_BIRO_III','REJECTED_BY_WR3_WD3','CANCELLED') THEN 1 ELSE 0 END) AS rejected,
            SUM(CASE WHEN status IN ('SUBMITTED','WAITING_BIRO_III','WAITING_WR3_WD3','WAITING_ADMIN_UNIT','REVISION_REQUESTED','ON_HOLD') THEN 1 ELSE 0 END) AS pending
     FROM facility_requests
     WHERE activityScope = ?
       AND createdAt >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
     GROUP BY organizationName
     ORDER BY total DESC
     LIMIT 10`,
    [scope]
  );

  const orgData: OrgRow[] = orgRows.map((r) => ({
    organization: r.organization,
    total: Number(r.total),
    approved: Number(r.approved),
    rejected: Number(r.rejected),
    pending: Number(r.pending),
  }));

  return (
    <div className="space-y-8">
      <PageHeader title={`Dashboard ${label}`} subtitle="Validasi digital tahap 2 pengajuan peminjaman." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard index={0} label="Menunggu Validasi" value={waiting} tone="amber" />
        <StatCard index={1} label="Disetujui Anda" value={approved} tone="primary" />
        <StatCard index={2} label="Ditolak Anda" value={rejected} tone="rose" />
      </div>

      <OrgRequestsChart
        data={orgData}
        title="Peminjaman per Organisasi"
        subtitle={`Top 10 organisasi · 90 hari terakhir · lingkup ${scope === 'FAKULTAS' ? 'Fakultas' : 'Universitas'}`}
      />
    </div>
  );
}
