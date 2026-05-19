import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { PageHeader, StatCard } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { fmtDateTime } from '@/lib/request-code';
import type { FacilityRequest, RequestStatus } from '@/types';

export default async function BiroIIIDashboard() {
  const session = await requireRole('BIRO_III');
  const [{ c: waiting }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM facility_requests WHERE status = 'WAITING_BIRO_III'"
  );
  const [{ c: approved }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM approval_logs WHERE actorId = ? AND action = 'APPROVE_BIRO_III'",
    [session.userId]
  );
  const [{ c: rejected }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM approval_logs WHERE actorId = ? AND action = 'REJECT_BIRO_III'",
    [session.userId]
  );
  const queue = await query<FacilityRequest & { facilityName: string; userName: string }>(
    `SELECT fr.*, f.name AS facilityName, u.name AS userName
     FROM facility_requests fr
     JOIN facilities f ON f.id = fr.facilityId
     JOIN users u ON u.id = fr.userId
     WHERE fr.status = 'WAITING_BIRO_III'
     ORDER BY fr.createdAt ASC LIMIT 5`
  );
  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard Biro III" subtitle="Review tahap 1 pengajuan peminjaman fasilitas." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard index={0} label="Menunggu Review" value={waiting} tone="amber" />
        <StatCard index={1} label="Disetujui Anda" value={approved} tone="primary" />
        <StatCard index={2} label="Ditolak Anda" value={rejected} tone="rose" />
      </div>
      <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)]">
        <div className="flex items-center justify-between border-b border-[var(--neutral-100)] px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-[var(--neutral-900)]">Antrian Validasi</h2>
            <p className="mt-0.5 text-xs text-[var(--neutral-500)]">5 pengajuan terlama yang menunggu Anda.</p>
          </div>
          <Link href="/dashboard/biro-iii/requests" className="text-xs font-medium text-[var(--primary-700)]">
            Lihat semua →
          </Link>
        </div>
        {queue.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-[var(--neutral-500)]">Tidak ada pengajuan menunggu.</div>
        ) : (
          <ul className="divide-y divide-[var(--neutral-100)]">
            {queue.map((r) => (
              <li key={r.id} className="group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-[var(--neutral-50)]">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--neutral-900)]">{r.activityName}</p>
                  <p className="mt-0.5 text-xs text-[var(--neutral-500)]">
                    {r.userName} · {r.facilityName} · {fmtDateTime(r.startDateTime)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={r.status as RequestStatus} size="sm" />
                  <Link href={`/dashboard/biro-iii/requests/${r.id}`} className="text-xs font-medium text-[var(--primary-700)]">
                    Review →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
