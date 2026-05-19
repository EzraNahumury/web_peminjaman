import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { PageHeader, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { fmtDateTime } from '@/lib/request-code';
import type { FacilityRequest, RequestStatus } from '@/types';

export default async function PengurusDashboard() {
  const session = await requireRole('PENGURUS');
  const [{ c: total }] = await query<{ c: number }>(
    'SELECT COUNT(*) c FROM facility_requests WHERE userId = ?',
    [session.userId]
  );
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
  const recent = await query<FacilityRequest & { facilityName: string }>(
    `SELECT fr.*, f.name AS facilityName
     FROM facility_requests fr JOIN facilities f ON f.id = fr.facilityId
     WHERE fr.userId = ?
     ORDER BY fr.createdAt DESC LIMIT 5`,
    [session.userId]
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Halo, ${session.name.split(' ')[0]}`}
        subtitle="Pantau status pengajuan peminjaman fasilitas Anda."
        action={
          <Link href="/dashboard/pengurus/requests/new">
            <Button>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Ajukan Peminjaman
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard index={0} label="Total Pengajuan" value={total} tone="slate" />
        <StatCard index={1} label="Sedang Diproses" value={pending} tone="amber" />
        <StatCard index={2} label="Disetujui" value={approved} tone="primary" />
        <StatCard index={3} label="Perlu Revisi" value={revision} tone="blue" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)] lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[var(--neutral-100)] px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--neutral-900)]">Pengajuan Terbaru</h2>
              <p className="mt-0.5 text-xs text-[var(--neutral-500)]">5 pengajuan terakhir Anda.</p>
            </div>
            <Link href="/dashboard/pengurus/requests" className="text-xs font-medium text-[var(--primary-700)] hover:text-[var(--primary-800)]">
              Lihat semua →
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-[var(--neutral-500)]">Belum ada pengajuan.</p>
              <Link href="/dashboard/pengurus/requests/new" className="mt-3 inline-block">
                <Button variant="outline" size="sm">Buat pengajuan pertama</Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--neutral-100)]">
              {recent.map((r) => (
                <li key={r.id} className="group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-[var(--neutral-50)]">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--neutral-900)]">{r.activityName}</p>
                    <p className="mt-0.5 text-xs text-[var(--neutral-500)]">
                      {r.facilityName} · {fmtDateTime(r.startDateTime)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={r.status as RequestStatus} size="sm" />
                    <Link
                      href={`/dashboard/pengurus/requests/${r.id}`}
                      className="text-xs font-medium text-[var(--primary-700)] opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      Detail →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <div
            className="rounded-[var(--radius-lg)] p-6 text-white shadow-[var(--shadow-sm)]"
            style={{
              background: 'linear-gradient(135deg, var(--primary-700) 0%, var(--primary-900) 100%)',
            }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/60">Alur Approval</p>
            <p className="mt-1 text-sm leading-relaxed text-white/90">
              Pengajuan dikirim ke <span className="font-semibold text-white">Biro III</span>, lalu{' '}
              <span className="font-semibold text-white">WR3/WD3</span>, terakhir{' '}
              <span className="font-semibold text-white">Admin Biro/Unit</span>.
            </p>
            <ol className="mt-4 space-y-2.5">
              {['Biro III Kemahasiswaan', 'WR3 / WD3', 'Admin Biro / Unit'].map((s, i) => (
                <li key={s} className="flex items-center gap-2.5 text-sm">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15 text-[10px] font-semibold text-white ring-1 ring-white/20">
                    {i + 1}
                  </span>
                  <span className="text-white/85">{s}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-6 shadow-[var(--shadow-xs)]">
            <h3 className="text-sm font-semibold text-[var(--neutral-900)]">Aksi Cepat</h3>
            <div className="mt-3 grid gap-2">
              <Link
                href="/dashboard/pengurus/calendar"
                className="group flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--neutral-200)] px-3 py-2.5 transition-colors hover:border-[var(--primary-300)] hover:bg-[var(--primary-50)]"
              >
                <span className="flex items-center gap-2.5 text-sm text-[var(--neutral-800)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary-700)]">
                    <path d="M8 2v3M16 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
                  </svg>
                  Cek ketersediaan
                </span>
                <span className="text-[var(--neutral-400)] transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
              <Link
                href="/dashboard/facilities"
                className="group flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--neutral-200)] px-3 py-2.5 transition-colors hover:border-[var(--primary-300)] hover:bg-[var(--primary-50)]"
              >
                <span className="flex items-center gap-2.5 text-sm text-[var(--neutral-800)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary-700)]">
                    <path d="M3 21h18M5 21V7l7-4 7 4v14" />
                  </svg>
                  Telusuri fasilitas
                </span>
                <span className="text-[var(--neutral-400)] transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
