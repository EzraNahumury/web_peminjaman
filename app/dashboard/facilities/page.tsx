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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { MANAGING_UNIT_LABEL, type Facility, type ManagingUnit } from '@/types';
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

  let unavailableIds = new Set<number>();
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
    if (tanggal && unavailableIds.has(f.id)) return false;
    return true;
  });

  const isPengurus = user.role === 'PENGURUS';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-50)] px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--primary-700)] ring-1 ring-[var(--primary-100)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary-500)]" />
            Katalog Fasilitas
          </span>
          <h1 className="mt-2 text-[26px] font-bold tracking-tight text-[var(--neutral-900)]">Daftar Fasilitas</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--neutral-500)]">
            {allFacilities.length} fasilitas aktif tersedia. Saring berdasarkan kategori, lokasi, atau ketersediaan
            di tanggal tertentu.
          </p>
        </div>
      </div>

      <FacilitiesFilterBar categories={categories} locations={locations} total={filtered.length} />

      {filtered.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--neutral-300)] bg-white px-5 py-12 text-center">
          <p className="text-[13px] font-medium text-[var(--neutral-700)]">Tidak ada fasilitas yang cocok dengan filter saat ini.</p>
          {tanggal && (
            <p className="mt-1 text-[12px] text-[var(--neutral-500)]">
              Coba pilih tanggal lain atau hapus filter tanggal.
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((f) => {
            const Icon = iconFor(f.category);
            return (
              <article
                key={f.id}
                className="group/card flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
              >
                <div
                  className="relative flex h-24 items-center justify-center overflow-hidden p-4 text-white"
                  style={{
                    background: 'linear-gradient(135deg, var(--primary-800) 0%, var(--primary-900) 100%)',
                  }}
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 opacity-[0.15]"
                    style={{
                      backgroundImage:
                        'radial-gradient(circle at 90% 10%, rgba(255,255,255,0.6) 0%, transparent 50%)',
                    }}
                  />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/12 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-white/85 ring-1 ring-white/15">
                    {f.category}
                  </span>
                  <Icon size={36} strokeWidth={1.6} className="opacity-90 transition-transform group-hover/card:scale-105" />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="min-w-0">
                    <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-[var(--neutral-900)]">
                      {f.name}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[var(--neutral-500)]">
                      <MapPin size={10} className="text-[var(--neutral-400)]" />
                      {f.location ?? '—'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-[var(--primary-50)] px-2 py-0.5 text-[10px] font-semibold text-[var(--primary-800)] ring-1 ring-[var(--primary-100)]">
                      Dikelola {MANAGING_UNIT_LABEL[f.managingUnit]}
                    </span>
                    {f.capacity != null && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--neutral-100)] px-2 py-0.5 text-[10px] font-medium text-[var(--neutral-700)]">
                        <UsersIcon size={9} className="text-[var(--neutral-500)]" />
                        Kap. {f.capacity}
                      </span>
                    )}
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                    <Link
                      href={`/dashboard/facilities/${f.id}`}
                      className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[var(--primary-700)] hover:text-[var(--primary-800)]"
                    >
                      Lihat detail
                      <ArrowRight size={11} />
                    </Link>
                    {isPengurus && (
                      <Link
                        href={`/dashboard/pengurus/requests/new?facility=${f.id}`}
                        className="inline-flex h-7 items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--primary-800)] px-2.5 text-[11px] font-semibold text-white shadow-[var(--shadow-xs)] transition-colors hover:bg-[var(--primary-900)]"
                      >
                        Pinjam
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
