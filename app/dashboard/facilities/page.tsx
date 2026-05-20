import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Building2,
  DoorOpen,
  FlaskConical,
  Layers,
  Mic2,
  Monitor,
  Trophy,
  Wrench,
  MapPin,
  Users as UsersIcon,
  ArrowRight,
  Camera,
  Car,
  CalendarRange,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { type Facility, type ManagingUnit, MANAGING_UNIT_LABEL } from '@/types';
import { FacilitiesFilterBar } from '@/components/dashboard/FacilitiesFilterBar';

const CATEGORY_ICON: Record<string, LucideIcon> = {
  Aula: Building2,
  Auditorium: Building2,
  Ruangan: DoorOpen,
  'Ruang Kelas': DoorOpen,
  'Ruang Tutorial': DoorOpen,
  'Ruang Hybrid': DoorOpen,
  Laboratorium: FlaskConical,
  Studio: Mic2,
  Peralatan: Wrench,
  Lapangan: Trophy,
  Kendaraan: Car,
  'Sound System': Mic2,
  Proyektor: Monitor,
  Multimedia: Monitor,
  Kamera: Camera,
};

function iconFor(category: string): LucideIcon {
  return CATEGORY_ICON[category] ?? Layers;
}

export default async function FacilitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; lokasi?: string; tanggal?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const sp = await searchParams;
  const kategori = sp.kategori?.trim() || '';
  const lokasi = sp.lokasi?.trim() || '';
  const tanggal = sp.tanggal?.trim() || '';

  const adminBureau = user.role === 'ADMIN_UNIT' ? (user.bureauScope as ManagingUnit | null) : null;
  const allFacilities = adminBureau
    ? await query<Facility>(
        'SELECT * FROM facilities WHERE isActive = 1 AND managingUnit = ? ORDER BY name',
        [adminBureau]
      )
    : await query<Facility>('SELECT * FROM facilities WHERE isActive = 1 ORDER BY name');

  const categories = Array.from(new Set(allFacilities.map((f) => f.category))).sort();
  const locations = Array.from(
    new Set(allFacilities.map((f) => f.location).filter((l): l is string => !!l))
  ).sort();

  const unavailableIds = new Set<number>();
  if (tanggal && /^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    const dayStart = `${tanggal} 00:00:00`;
    const dayEnd = `${tanggal} 23:59:59`;
    const [bookedRows, blockedRows] = await Promise.all([
      query<{ facilityId: number }>(
        `SELECT DISTINCT facilityId FROM facility_bookings
         WHERE status = 'ACTIVE' AND startDateTime < ? AND endDateTime > ?`,
        [dayEnd, dayStart]
      ),
      query<{ facilityId: number | null }>(
        `SELECT DISTINCT facilityId FROM facility_blocks
         WHERE startDateTime < ? AND endDateTime > ?`,
        [dayEnd, dayStart]
      ),
    ]);
    for (const r of bookedRows) unavailableIds.add(r.facilityId);
    const hasGlobalBlock = blockedRows.some((r) => r.facilityId === null);
    for (const r of blockedRows) {
      if (r.facilityId != null) unavailableIds.add(r.facilityId);
    }
    if (hasGlobalBlock) {
      for (const f of allFacilities) unavailableIds.add(f.id);
    }
  }

  const filtered = allFacilities.filter((f) => {
    if (kategori && f.category !== kategori) return false;
    if (lokasi && f.location !== lokasi) return false;
    return true;
  });

  const isPengurus = user.role === 'PENGURUS';
  const dateLabel = tanggal
    ? new Date(tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-[var(--neutral-900)]">Daftar Fasilitas</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--neutral-500)]">
            {allFacilities.length} fasilitas aktif tersedia. Saring berdasarkan kategori, lokasi, atau ketersediaan
            di tanggal tertentu.
          </p>
        </div>
      </div>

      <FacilitiesFilterBar categories={categories} locations={locations} total={filtered.length} />

      {filtered.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--neutral-300)] bg-white px-5 py-12 text-center">
          <p className="text-[13px] font-medium text-[var(--neutral-700)]">
            Tidak ada fasilitas yang cocok dengan filter saat ini.
          </p>
          {tanggal && (
            <p className="mt-1 text-[12px] text-[var(--neutral-500)]">
              Coba pilih tanggal lain atau hapus filter tanggal.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((f) => {
            const Icon = iconFor(f.category);
            const unavailable = Boolean(tanggal) && unavailableIds.has(f.id);
            const code = `F-${String(f.id).padStart(2, '0')}`;
            return (
              <article
                key={f.id}
                className="group/card flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-[var(--neutral-200)] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_-12px_rgba(15,23,42,0.18)] hover:ring-[var(--neutral-300)]"
              >
                {/* Hero */}
                <div
                  className="relative flex h-44 items-center justify-center overflow-hidden text-white"
                  style={{
                    background:
                      unavailable && tanggal
                        ? 'linear-gradient(135deg, #475569 0%, #1e293b 100%)'
                        : 'linear-gradient(135deg, var(--primary-800) 0%, var(--primary-900) 100%)',
                  }}
                >
                  {/* Decorative arcs */}
                  <svg
                    aria-hidden
                    className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 opacity-[0.13]"
                    viewBox="0 0 200 200"
                    fill="none"
                  >
                    <circle cx="100" cy="100" r="90" stroke="white" strokeWidth="1.5" />
                    <circle cx="100" cy="100" r="65" stroke="white" strokeWidth="1.5" />
                    <circle cx="100" cy="100" r="40" stroke="white" strokeWidth="1.5" />
                  </svg>
                  <svg
                    aria-hidden
                    className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 opacity-[0.10]"
                    viewBox="0 0 200 200"
                    fill="none"
                  >
                    <circle cx="100" cy="100" r="90" stroke="white" strokeWidth="1.5" />
                    <circle cx="100" cy="100" r="60" stroke="white" strokeWidth="1.5" />
                  </svg>

                  {/* Status pill */}
                  <span
                    className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10.5px] font-semibold shadow-[0_2px_8px_rgba(15,23,42,0.12)] ${
                      unavailable && tanggal ? 'text-rose-600' : 'text-emerald-700'
                    }`}
                  >
                    <span className="relative inline-flex h-1.5 w-1.5">
                      <span
                        className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${
                          unavailable && tanggal ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                      />
                      <span
                        className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                          unavailable && tanggal ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                      />
                    </span>
                    {unavailable && tanggal ? 'Tidak Tersedia' : 'Tersedia'}
                  </span>

                  <Icon
                    size={68}
                    strokeWidth={1.4}
                    className="relative opacity-95 drop-shadow-[0_6px_16px_rgba(0,0,0,0.25)] transition-transform duration-500 group-hover/card:scale-110"
                  />

                  {/* Category chip */}
                  <span className="absolute bottom-3 left-3 inline-flex items-center rounded-md bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white ring-1 ring-white/20 backdrop-blur-sm">
                    {f.category}
                  </span>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col gap-1 p-5">
                  <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--neutral-400)]">
                    {code}
                  </p>
                  <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-[var(--neutral-900)]">
                    {f.name}
                  </h3>

                  <div className="mt-2 space-y-1.5">
                    <p className="flex items-center gap-1.5 text-[12px] text-[var(--neutral-600)]">
                      <MapPin size={12} className="shrink-0 text-[var(--neutral-400)]" />
                      <span className="truncate">{f.location ?? '—'}</span>
                    </p>
                    {f.capacity != null && (
                      <p className="flex items-center gap-1.5 text-[12px] text-[var(--neutral-600)]">
                        <UsersIcon size={12} className="shrink-0 text-[var(--neutral-400)]" />
                        Kapasitas {f.capacity} orang
                      </p>
                    )}
                    <p className="flex items-center gap-1.5 text-[12px] text-[var(--neutral-600)]">
                      <Building2 size={12} className="shrink-0 text-[var(--neutral-400)]" />
                      <span className="truncate">{MANAGING_UNIT_LABEL[f.managingUnit]}</span>
                    </p>
                  </div>

                  {/* Footer: two buttons */}
                  <div className={`mt-4 grid gap-2 ${isPengurus ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <Link
                      href={`/dashboard/facilities/${f.id}`}
                      className="inline-flex h-9 items-center justify-center rounded-lg bg-white px-3 text-[12px] font-semibold text-[var(--neutral-900)] ring-1 ring-[var(--neutral-200)] transition-colors hover:bg-[var(--neutral-50)] hover:ring-[var(--neutral-300)]"
                    >
                      Lihat detail
                    </Link>
                    {isPengurus &&
                      (unavailable ? (
                        <button
                          type="button"
                          disabled
                          className="inline-flex h-9 cursor-not-allowed items-center justify-center rounded-lg bg-[var(--neutral-200)] px-3 text-[12px] font-semibold text-[var(--neutral-500)]"
                        >
                          Tidak Tersedia
                        </button>
                      ) : (
                        <Link
                          href={`/dashboard/pengurus/requests/new?facility=${f.id}`}
                          className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-[var(--primary-800)] px-3 text-[12px] font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.12)] transition-colors hover:bg-[var(--primary-900)]"
                        >
                          Pinjam
                          <ArrowRight size={12} className="transition-transform group-hover/card:translate-x-0.5" />
                        </Link>
                      ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {dateLabel && (
        <p className="flex items-center justify-center gap-1.5 text-[11.5px] text-[var(--neutral-500)]">
          <CalendarRange size={12} className="text-[var(--neutral-400)]" />
          Menampilkan ketersediaan untuk tanggal {dateLabel}.
        </p>
      )}
    </div>
  );
}
