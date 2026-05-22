import Link from 'next/link';
import { Clock, CheckCircle2, XCircle, FileBarChart, ArrowRight, MapPin, Users as UsersIcon, Calendar as CalendarIcon, ChevronRight, Building2 } from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatWIBDate, formatWIBTime } from '@/utils/date';
import type { FacilityRequest, RequestStatus } from '@/types';
import { REQUEST_LIST_ORDER_SQL } from '@/utils/priority';

const ID_MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

function dateChip(d: Date | string) {
  const date = new Date(d);
  return { day: String(date.getDate()).padStart(2, '0'), month: ID_MONTH[date.getMonth()] };
}

function timeRange(start: Date | string, end: Date | string) {
  return `${formatWIBTime(start)}–${formatWIBTime(end)}`;
}

export default async function PengurusDashboard() {
  const session = await requireRole('PENGURUS');

  const [
    [{ c: total }],
    [{ c: pending }],
    [{ c: approved }],
    [{ c: rejected }],
    active,
    recent,
    popularFacilities,
  ] = await Promise.all([
    query<{ c: number }>('SELECT COUNT(*) c FROM facility_requests WHERE userId = ?', [session.userId]),
    query<{ c: number }>(
      "SELECT COUNT(*) c FROM facility_requests WHERE userId = ? AND status IN ('SUBMITTED','WAITING_BIRO_III','WAITING_WR3_WD3','WAITING_ADMIN_UNIT','REVISION_REQUESTED','ON_HOLD')",
      [session.userId]
    ),
    query<{ c: number }>("SELECT COUNT(*) c FROM facility_requests WHERE userId = ? AND status='APPROVED'", [session.userId]),
    query<{ c: number }>(
      "SELECT COUNT(*) c FROM facility_requests WHERE userId = ? AND status IN ('REJECTED','REJECTED_BY_BIRO_III','REJECTED_BY_WR3_WD3')",
      [session.userId]
    ),
    query<FacilityRequest & { facilityName: string }>(
      `SELECT fr.*, f.name AS facilityName
       FROM facility_requests fr JOIN facilities f ON f.id = fr.facilityId
       WHERE fr.userId = ?
         AND fr.status IN ('SUBMITTED','WAITING_BIRO_III','WAITING_WR3_WD3','WAITING_ADMIN_UNIT','REVISION_REQUESTED','ON_HOLD','APPROVED')
         AND fr.endDateTime >= NOW()
       ORDER BY fr.startDateTime ASC LIMIT 4`,
      [session.userId]
    ),
    query<FacilityRequest & { facilityName: string }>(
      `SELECT fr.*, f.name AS facilityName
       FROM facility_requests fr JOIN facilities f ON f.id = fr.facilityId
       WHERE fr.userId = ?
       ORDER BY ${REQUEST_LIST_ORDER_SQL} LIMIT 5`,
      [session.userId]
    ),
    query<{ id: number; name: string; category: string; location: string | null; capacity: number | null; usageCount: number }>(
      `SELECT f.id, f.name, f.category, f.location, f.capacity, COUNT(fr.id) AS usageCount
       FROM facilities f
       LEFT JOIN facility_requests fr ON fr.facilityId = f.id AND fr.status = 'APPROVED'
       WHERE f.isActive = 1
       GROUP BY f.id
       ORDER BY usageCount DESC, f.name ASC
       LIMIT 4`
    ),
  ]);

  const firstName = session.name.split(' ')[0];
  const heroLine =
    pending > 0 || approved > 0
      ? `${pending} peminjaman menunggu persetujuan dan ${approved} jadwal akan datang.`
      : 'Belum ada peminjaman aktif. Yuk ajukan peminjaman fasilitas pertamamu.';

  const stats = [
    { label: 'Menunggu', value: pending, icon: Clock, tone: 'amber' as const },
    { label: 'Disetujui', value: approved, icon: CheckCircle2, tone: 'primary' as const },
    { label: 'Ditolak', value: rejected, icon: XCircle, tone: 'rose' as const },
    { label: 'Total', value: total, icon: FileBarChart, tone: 'slate' as const },
  ];

  return (
    <div className="space-y-7">
      {/* Hero greeting */}
      <section
        className="relative overflow-hidden rounded-[var(--radius-lg)] px-6 py-6 text-white shadow-[var(--shadow-md)] sm:px-8 sm:py-7"
        style={{ background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-700) 100%)' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 100% 0%, rgba(255,255,255,0.6) 0%, transparent 40%), radial-gradient(circle at 0% 100%, rgba(255,255,255,0.4) 0%, transparent 35%)',
          }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
              {formatWIBDate(new Date())}
            </p>
            <h1 className="mt-1.5 text-[26px] font-bold leading-tight tracking-tight sm:text-[28px]">
              Halo, {firstName} <span className="inline-block"></span>
            </h1>
            <p className="mt-1.5 max-w-xl text-[13.5px] text-white/75">{heroLine}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/pengurus/requests"
              className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-white/20 bg-white/10 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-white/15"
            >
              Cek Status
            </Link>
            <Link
              href="/dashboard/facilities"
              className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-white px-4 text-[13px] font-semibold text-[var(--primary-800)] shadow-[var(--shadow-sm)] transition-colors hover:bg-white/95"
            >
              Pinjam Fasilitas
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          const toneMap: Record<string, string> = {
            amber: 'bg-amber-50 text-amber-700 ring-amber-100',
            primary: 'bg-[var(--primary-50)] text-[var(--primary-700)] ring-[var(--primary-100)]',
            rose: 'bg-rose-50 text-rose-700 ring-rose-100',
            slate: 'bg-slate-50 text-slate-700 ring-slate-200',
          };
          return (
            <div
              key={s.label}
              className="group relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-5 shadow-[var(--shadow-xs)] transition-shadow hover:shadow-[var(--shadow-md)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-medium text-[var(--neutral-500)]">{s.label}</p>
                  <p className="mt-2 text-[28px] font-bold tracking-tight tabular-nums text-[var(--neutral-900)]">
                    {s.value}
                  </p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] ring-1 ${toneMap[s.tone]}`}>
                  <Icon size={18} strokeWidth={2} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Active + Recent */}
      <section className="grid gap-5 lg:grid-cols-3">
        {/* Peminjaman aktif */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)] lg:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--neutral-100)] px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--neutral-500)]">Aktif & Mendatang</p>
              <h2 className="mt-0.5 text-[15px] font-semibold tracking-tight text-[var(--neutral-900)]">
                Peminjaman aktif Anda
              </h2>
            </div>
            <Link
              href="/dashboard/pengurus/requests"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--primary-700)] hover:text-[var(--primary-800)]"
            >
              Lihat semua
              <ChevronRight size={13} />
            </Link>
          </div>
          {active.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--neutral-100)] text-[var(--neutral-400)]">
                <CalendarIcon size={20} />
              </div>
              <p className="mt-3 text-sm font-medium text-[var(--neutral-800)]">Belum ada peminjaman aktif</p>
              <p className="mt-1 text-xs text-[var(--neutral-500)]">Ajukan peminjaman untuk memulai.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--neutral-100)]">
              {active.map((r) => {
                const chip = dateChip(r.startDateTime);
                return (
                  <li key={r.id}>
                    <Link
                      href={`/dashboard/pengurus/requests/${r.id}`}
                      className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--neutral-50)]"
                    >
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-[var(--radius-md)] border border-[var(--primary-100)] bg-[var(--primary-50)] text-[var(--primary-800)]">
                        <span className="text-[15px] font-bold leading-none">{chip.day}</span>
                        <span className="mt-0.5 text-[9.5px] font-semibold uppercase tracking-wider">{chip.month}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-semibold text-[var(--neutral-900)]">{r.activityName}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-[var(--neutral-500)]">
                          <MapPin size={11} className="text-[var(--neutral-400)]" />
                          {r.facilityName} · {timeRange(r.startDateTime, r.endDateTime)}
                        </p>
                      </div>
                      <StatusBadge status={r.status as RequestStatus} size="sm" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Peminjaman terbaru */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)]">
          <div className="border-b border-[var(--neutral-100)] px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--neutral-500)]">Riwayat</p>
            <h2 className="mt-0.5 text-[15px] font-semibold tracking-tight text-[var(--neutral-900)]">
              Peminjaman terbaru
            </h2>
          </div>
          {recent.length === 0 ? (
            <div className="px-5 py-10 text-center text-xs text-[var(--neutral-500)]">Belum ada riwayat.</div>
          ) : (
            <ul className="divide-y divide-[var(--neutral-100)]">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/dashboard/pengurus/requests/${r.id}`}
                    className="block px-5 py-3 transition-colors hover:bg-[var(--neutral-50)]"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: 'var(--primary-500)' }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-[var(--neutral-900)]">{r.activityName}</p>
                        <p className="mt-0.5 truncate text-[11.5px] text-[var(--neutral-500)]">
                          {r.facilityName} · {formatWIBDate(r.submittedAt ?? r.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Popular facilities */}
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--neutral-500)]">Populer</p>
            <h2 className="mt-0.5 text-[15px] font-semibold tracking-tight text-[var(--neutral-900)]">
              Fasilitas paling sering dipinjam
            </h2>
          </div>
          <Link
            href="/dashboard/facilities"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--primary-700)] hover:text-[var(--primary-800)]"
          >
            Semua fasilitas
            <ChevronRight size={13} />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popularFacilities.map((f) => (
            <Link
              key={f.id}
              href={`/dashboard/facilities`}
              className="group relative flex h-[150px] flex-col justify-between overflow-hidden rounded-[var(--radius-lg)] p-4 text-white shadow-[var(--shadow-sm)] transition-transform hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
              style={{
                background: 'linear-gradient(135deg, var(--primary-800) 0%, var(--primary-900) 100%)',
              }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.18]"
                style={{
                  backgroundImage: 'radial-gradient(circle at 90% 10%, rgba(255,255,255,0.7) 0%, transparent 50%)',
                }}
              />
              <div className="relative flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-white/12 ring-1 ring-white/15">
                <Building2 size={17} strokeWidth={2.1} />
              </div>
              <div className="relative">
                <p className="line-clamp-2 text-[14px] font-semibold leading-snug">{f.name}</p>
                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-white/65">
                  <UsersIcon size={11} />
                  {f.capacity ? `${f.capacity} orang` : f.category}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
