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
            return (
              <article
                key={f.id}
                className="group/card flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
              >
                {/* Hero */}
                <div
                  className="relative flex h-32 items-center justify-center overflow-hidden text-white"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary-800) 0%, var(--primary-900) 100%)',
                  }}
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-[0.18]"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle at 90% 10%, rgba(255,255,255,0.6) 0%, transparent 50%), radial-gradient(circle at 10% 100%, rgba(255,255,255,0.4) 0%, transparent 50%)',
                    }}
                  />

                  <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-white/12 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em] text-white/90 ring-1 ring-white/15 backdrop-blur">
                    {f.category}
                  </span>

                  {tanggal && (
                    <span
                      className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        unavailable
                          ? 'bg-rose-500/95 text-white ring-1 ring-rose-300/60'
                          : 'bg-emerald-500/95 text-white ring-1 ring-emerald-300/60'
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      {unavailable ? 'Tidak Tersedia' : 'Tersedia'}
                    </span>
                  )}

                  <Icon
                    size={50}
                    strokeWidth={1.5}
                    className="opacity-95 drop-shadow-lg transition-transform group-hover/card:scale-110"
                  />
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col gap-2.5 p-4">
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-[14.5px] font-bold leading-snug text-[var(--neutral-900)]">
                      {f.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-[var(--neutral-500)]">
                      <MapPin size={11} className="text-[var(--neutral-400)]" />
                      {f.location ?? '—'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-[var(--primary-50)] px-2 py-0.5 text-[10px] font-semibold text-[var(--primary-800)] ring-1 ring-[var(--primary-100)]">
                      Dikelola {MANAGING_UNIT_LABEL[f.managingUnit]}
                    </span>
                    {f.capacity != null && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--neutral-100)] px-2 py-0.5 text-[10px] font-medium text-[var(--neutral-700)]">
                        <UsersIcon size={10} className="text-[var(--neutral-500)]" />
                        Kap. {f.capacity}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--neutral-100)] pt-3">
                    <Link
                      href={`/dashboard/facilities/${f.id}`}
                      className="inline-flex items-center gap-1 text-[12px] font-semibold text-[var(--primary-700)] hover:text-[var(--primary-800)]"
                    >
                      Lihat detail
                      <ArrowRight size={11} className="transition-transform group-hover/card:translate-x-0.5" />
                    </Link>
                    {isPengurus &&
                      (unavailable ? (
                        <button
                          type="button"
                          disabled
                          className="inline-flex h-8 cursor-not-allowed items-center gap-1 rounded-[var(--radius-md)] bg-[var(--neutral-200)] px-3 text-[11.5px] font-semibold text-[var(--neutral-500)]"
                        >
                          Tidak Tersedia
                        </button>
                      ) : (
                        <Link
                          href={`/dashboard/pengurus/requests/new?facility=${f.id}`}
                          className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-md)] bg-[var(--primary-700)] px-3.5 text-[11.5px] font-semibold text-white shadow-[var(--shadow-xs)] transition-colors hover:bg-[var(--primary-800)]"
                        >
                          Pinjam
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
