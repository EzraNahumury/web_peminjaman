import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Building2,
  DoorOpen,
  FlaskConical,
  Layers,
  MapPin,
  Mic2,
  Monitor,
  Trophy,
  Users as UsersIcon,
  Wrench,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Tag,
  Info,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { query, queryOne } from '@/lib/db';
import { formatWIBDate, formatWIBTime } from '@/utils/date';
import { MANAGING_UNIT_LABEL, type Facility, type FacilityRequest, type RequestStatus } from '@/types';
import { FacilityAvailabilityCalendar, type DayBooking } from '@/components/dashboard/FacilityAvailabilityCalendar';

const CATEGORY_ICON: Record<string, LucideIcon> = {
  Aula: Building2,
  Auditorium: Building2,
  Ruangan: DoorOpen,
  'Ruang Kelas': DoorOpen,
  'Ruang Tutorial': DoorOpen,
  Laboratorium: FlaskConical,
  Studio: Mic2,
  Peralatan: Wrench,
  Lapangan: Trophy,
  Kendaraan: Wrench,
  'Sound System': Mic2,
  Proyektor: Monitor,
  Multimedia: Monitor,
};

export default async function FacilityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const facility = await queryOne<Facility>(
    'SELECT * FROM facilities WHERE id = ? AND isActive = 1',
    [Number(id)]
  );
  if (!facility) notFound();

  // Bookings: load 3-month window centered on current month for calendar context
  const today = new Date();
  const winStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const winEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0, 23, 59, 59);

  const bookings = await query<FacilityRequest>(
    `SELECT * FROM facility_requests
     WHERE facilityId = ?
       AND status IN ('APPROVED','WAITING_BIRO_III','WAITING_WR3_WD3','WAITING_ADMIN_UNIT','REVISION_REQUESTED','ON_HOLD')
       AND startDateTime <= ?
       AND endDateTime >= ?
     ORDER BY startDateTime ASC`,
    [facility.id, winEnd, winStart]
  );

  const upcomingApproved = bookings
    .filter((b) => b.status === 'APPROVED' && new Date(b.endDateTime) >= today)
    .slice(0, 5);

  const dayBookings: DayBooking[] = bookings.map((b) => ({
    id: b.id,
    requestCode: b.requestCode,
    activityName: b.activityName,
    organizationName: b.organizationName,
    start: new Date(b.startDateTime).toISOString(),
    end: new Date(b.endDateTime).toISOString(),
    status: b.status as RequestStatus,
  }));

  const Icon = CATEGORY_ICON[facility.category] ?? Layers;
  const isPengurus = user.role === 'PENGURUS';

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/facilities"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--neutral-500)] hover:text-[var(--neutral-800)]"
      >
        <ArrowLeft size={13} />
        Kembali ke daftar fasilitas
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Hero card */}
          <section
            className="relative overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]"
            style={{ background: 'linear-gradient(135deg, var(--primary-800) 0%, var(--primary-900) 100%)' }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.13]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 95% 10%, rgba(255,255,255,0.7) 0%, transparent 45%)',
              }}
            />
            <div className="relative flex flex-col gap-5 px-6 py-8 text-white sm:flex-row sm:items-center sm:gap-6 sm:px-8">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-white/12 ring-1 ring-white/20">
                <Icon size={56} strokeWidth={1.6} className="opacity-95" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
                  {facility.category}
                </p>
                <h1 className="mt-1.5 text-[24px] font-bold leading-tight tracking-tight sm:text-[26px]">
                  {facility.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-white/80">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin size={13} />
                    {facility.location ?? '—'}
                  </span>
                  {facility.capacity != null && (
                    <span className="inline-flex items-center gap-1.5">
                      <UsersIcon size={13} />
                      Kapasitas {facility.capacity} orang
                    </span>
                  )}
                </div>
              </div>
              <span className="inline-flex h-7 shrink-0 items-center gap-1.5 self-start rounded-full bg-[var(--primary-500)] px-2.5 text-[11px] font-semibold uppercase tracking-wider text-white shadow-[var(--shadow-sm)] sm:self-center">
                <CheckCircle2 size={11} />
                Tersedia
              </span>
            </div>
          </section>

          {/* Description */}
          <section className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)]">
            <header className="border-b border-[var(--neutral-100)] px-6 py-4">
              <h2 className="text-[14px] font-semibold tracking-tight text-[var(--neutral-900)]">
                Tentang fasilitas
              </h2>
            </header>
            <div className="space-y-5 px-6 py-5">
              {facility.description ? (
                <p className="whitespace-pre-line text-[13px] leading-relaxed text-[var(--neutral-700)]">
                  {facility.description}
                </p>
              ) : (
                <p className="text-[13px] italic text-[var(--neutral-500)]">
                  Tidak ada deskripsi tambahan.
                </p>
              )}

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--neutral-500)]">
                  Aturan penggunaan
                </p>
                <ul className="mt-2 space-y-1.5 text-[13px] text-[var(--neutral-700)]">
                  <Rule>Pengajuan dikirim minimal 3 hari sebelum kegiatan.</Rule>
                  <Rule>Penanggung jawab wajib mengambil kunci/perlengkapan sebelum kegiatan.</Rule>
                  <Rule>Fasilitas wajib dikembalikan dalam kondisi seperti semula.</Rule>
                  <Rule>Pelanggaran dapat mempengaruhi pengajuan berikutnya.</Rule>
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatBox icon={<UsersIcon size={13} />} label="Kapasitas" value={facility.capacity ?? '—'} />
                <StatBox icon={<Tag size={13} />} label="Kategori" value={facility.category} />
                <StatBox icon={<MapPin size={13} />} label="Lokasi" value={facility.location ?? '—'} />
                <StatBox icon={<Layers size={13} />} label="Unit Pengelola" value={MANAGING_UNIT_LABEL[facility.managingUnit]} />
              </div>
            </div>
          </section>
        </div>

        {/* Right column: calendar + CTA */}
        <aside className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)]">
            <div className="px-5 py-4">
              <FacilityAvailabilityCalendar bookings={dayBookings} />
            </div>
            {isPengurus && (
              <div className="border-t border-[var(--neutral-100)] px-5 py-4">
                <Link
                  href={`/dashboard/pengurus/requests/new?facility=${facility.id}`}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary-800)] text-[13px] font-semibold text-white shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--primary-900)]"
                >
                  Ajukan Peminjaman
                  <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>

          {/* Upcoming bookings */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)]">
            <header className="border-b border-[var(--neutral-100)] px-5 py-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--neutral-500)]">
                Jadwal mendatang
              </p>
              <h2 className="mt-0.5 text-[14px] font-semibold tracking-tight text-[var(--neutral-900)]">
                {upcomingApproved.length > 0 ? `${upcomingApproved.length} kegiatan terjadwal` : 'Belum ada jadwal'}
              </h2>
            </header>
            {upcomingApproved.length === 0 ? (
              <div className="flex items-start gap-2 px-5 py-4 text-[12px] text-[var(--neutral-600)]">
                <Info size={13} className="mt-0.5 shrink-0 text-[var(--neutral-400)]" />
                Belum ada peminjaman disetujui untuk fasilitas ini.
              </div>
            ) : (
              <ul className="divide-y divide-[var(--neutral-100)]">
                {upcomingApproved.map((b) => (
                  <li key={b.id} className="flex items-start gap-3 px-5 py-3">
                    <div className="mt-0.5 flex h-2 w-2 shrink-0 rounded-full bg-[var(--primary-500)]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-[var(--neutral-900)]">{b.activityName}</p>
                      <p className="mt-0.5 text-[11.5px] text-[var(--neutral-500)]">
                        {formatWIBDate(b.startDateTime)} · {formatWIBTime(b.startDateTime)}–{formatWIBTime(b.endDateTime)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-700" />
              <p className="text-[12px] leading-relaxed text-amber-900">
                Jadwal akhir bergantung pada validasi Biro III, WR3/WD3, dan Admin Unit. Sistem memblok overlap otomatis.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-3">
      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--neutral-500)]">
        <span className="text-[var(--neutral-400)]">{icon}</span>
        {label}
      </p>
      <p className="mt-1 truncate text-[13px] font-semibold text-[var(--neutral-900)]">{value}</p>
    </div>
  );
}

function Rule({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary-500)]" />
      <span>{children}</span>
    </li>
  );
}
