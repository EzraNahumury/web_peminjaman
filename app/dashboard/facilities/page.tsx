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
  Search,
  MapPin,
  Users as UsersIcon,
  ArrowRight,
  ChevronRight,
  Camera,
  Car,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import {
  MANAGING_UNIT_DESC,
  MANAGING_UNIT_LABEL,
  type Facility,
  type ManagingUnit,
} from '@/types';

const UNIT_ORDER: ManagingUnit[] = ['BIRO_I', 'BIRO_IV', 'PPLK', 'KRT', 'LPAIP'];

const UNIT_ICON: Record<ManagingUnit, LucideIcon> = {
  BIRO_I: DoorOpen,
  BIRO_IV: Building2,
  PPLK: FlaskConical,
  KRT: Car,
  LPAIP: Camera,
};

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
  searchParams: Promise<{ q?: string; open?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const sp = await searchParams;
  const q = sp.q?.trim() || '';
  const openUnits = sp.open ? sp.open.split(',').filter((u) => UNIT_ORDER.includes(u as ManagingUnit)) : [];

  const adminBureau = user.role === 'ADMIN_UNIT' ? (user.bureauScope as ManagingUnit | null) : null;
  const facilities = adminBureau
    ? await query<Facility>(
        'SELECT * FROM facilities WHERE isActive = 1 AND managingUnit = ? ORDER BY name',
        [adminBureau]
      )
    : await query<Facility>('SELECT * FROM facilities WHERE isActive = 1 ORDER BY name');

  const grouped: Record<ManagingUnit, Facility[]> = {
    BIRO_I: [], BIRO_IV: [], PPLK: [], KRT: [], LPAIP: [],
  };
  for (const f of facilities) {
    if (!q) {
      grouped[f.managingUnit].push(f);
      continue;
    }
    const needle = q.toLowerCase();
    if (
      f.name.toLowerCase().includes(needle) ||
      (f.location ?? '').toLowerCase().includes(needle) ||
      f.category.toLowerCase().includes(needle)
    ) {
      grouped[f.managingUnit].push(f);
    }
  }

  const totalMatch = UNIT_ORDER.reduce((acc, u) => acc + grouped[u].length, 0);
  const isPengurus = user.role === 'PENGURUS';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-[var(--neutral-900)]">Daftar Fasilitas</h1>
          <p className="mt-1 text-sm text-[var(--neutral-500)]">
            {facilities.length} fasilitas aktif dikelola 5 unit. Pilih fasilitas untuk melihat detail atau langsung ajukan.
          </p>
        </div>
        <form className="relative w-full sm:w-72" action="" method="get">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--neutral-400)]" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Cari fasilitas, lokasi, kategori…"
            className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--neutral-300)] bg-white pl-9 pr-3 text-sm text-[var(--neutral-900)] placeholder:text-[var(--neutral-400)] shadow-[var(--shadow-xs)] outline-none transition-all focus:border-[var(--primary-600)] focus:ring-[3px] focus:ring-[var(--primary-100)]"
          />
        </form>
      </div>

      {q && (
        <p className="text-[12.5px] text-[var(--neutral-500)]">
          Menampilkan <strong className="font-semibold text-[var(--neutral-900)]">{totalMatch}</strong> fasilitas yang
          cocok dengan <em className="not-italic">&ldquo;{q}&rdquo;</em>.{' '}
          <Link href="?" className="font-medium text-[var(--primary-700)] hover:text-[var(--primary-800)]">
            Reset pencarian
          </Link>
        </p>
      )}

      {/* Accordion per unit */}
      <div className="space-y-3">
        {UNIT_ORDER.map((unit) => {
          const items = grouped[unit];
          if (items.length === 0) return null;
          const UnitIcon = UNIT_ICON[unit];
          return (
            <details
              key={unit}
              open
              data-open-units={openUnits.length}
              className="group overflow-hidden rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)] transition-shadow open:shadow-[var(--shadow-sm)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-[var(--neutral-50)]">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] text-white shadow-[var(--shadow-sm)]"
                    style={{ background: 'linear-gradient(135deg, var(--primary-700) 0%, var(--primary-900) 100%)' }}
                  >
                    <UnitIcon size={18} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14.5px] font-bold tracking-tight text-[var(--neutral-900)]">
                      {MANAGING_UNIT_LABEL[unit]}
                    </p>
                    <p className="mt-0.5 truncate text-[11.5px] text-[var(--neutral-500)]">
                      {MANAGING_UNIT_DESC[unit]}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="inline-flex h-6 min-w-[40px] items-center justify-center rounded-full bg-[var(--primary-50)] px-2 text-[11px] font-bold tabular-nums text-[var(--primary-800)] ring-1 ring-[var(--primary-100)]">
                    {items.length}
                  </span>
                  <ChevronRight
                    size={16}
                    className="text-[var(--neutral-400)] transition-transform duration-200 group-open:rotate-90"
                  />
                </div>
              </summary>

              <div className="border-t border-[var(--neutral-100)] bg-[var(--neutral-50)]/40">
                {items.length === 0 ? (
                  <div className="px-5 py-8 text-center text-[12.5px] text-[var(--neutral-500)]">
                    {q ? 'Tidak ada fasilitas yang cocok di unit ini.' : 'Belum ada fasilitas aktif di unit ini.'}
                  </div>
                ) : (
                  <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((f) => {
                      const Icon = iconFor(f.category);
                      return (
                        <article
                          key={f.id}
                          className="group/card flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
                        >
                          <div
                            className="relative flex h-24 items-center justify-center overflow-hidden p-4 text-white"
                            style={{
                              background:
                                'linear-gradient(135deg, var(--primary-800) 0%, var(--primary-900) 100%)',
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
                            {f.capacity != null && (
                              <p className="flex items-center gap-1 text-[11px] text-[var(--neutral-600)]">
                                <UsersIcon size={10} className="text-[var(--neutral-400)]" />
                                Kap. <strong className="font-semibold text-[var(--neutral-800)]">{f.capacity}</strong>
                              </p>
                            )}
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
            </details>
          );
        })}
      </div>
    </div>
  );
}
