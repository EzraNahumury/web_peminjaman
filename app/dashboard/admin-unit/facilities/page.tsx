import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireRole, getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { PageHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { deleteFacility, toggleFacilityActive } from '@/app/actions/facilities';
import {
  MANAGING_UNIT_LABEL,
  type Facility,
  type ManagingUnit,
} from '@/types';

const UNIT_ORDER: ManagingUnit[] = ['BIRO_I', 'BIRO_IV', 'PPLK', 'KRT', 'LPAIP'];

const UNIT_GRADIENT: Record<ManagingUnit, string> = {
  BIRO_I: 'from-sky-500 to-blue-600',
  BIRO_IV: 'from-violet-500 to-purple-600',
  PPLK: 'from-emerald-500 to-teal-600',
  KRT: 'from-amber-500 to-orange-600',
  LPAIP: 'from-rose-500 to-pink-600',
};

const UNIT_GLOW: Record<ManagingUnit, string> = {
  BIRO_I: 'rgba(14,165,233,0.12)',
  BIRO_IV: 'rgba(139,92,246,0.12)',
  PPLK: 'rgba(16,185,129,0.12)',
  KRT: 'rgba(245,158,11,0.12)',
  LPAIP: 'rgba(244,63,94,0.12)',
};

export default async function AdminFacilitiesPage() {
  await requireRole('ADMIN_UNIT');
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const bureau = (user.bureauScope ?? null) as ManagingUnit | null;

  const facilities = bureau
    ? await query<Facility>(
        'SELECT * FROM facilities WHERE managingUnit = ? ORDER BY name',
        [bureau]
      )
    : await query<Facility>('SELECT * FROM facilities ORDER BY managingUnit, name');

  const grouped: Record<ManagingUnit, Facility[]> = {
    BIRO_I: [], BIRO_IV: [], PPLK: [], KRT: [], LPAIP: [],
  };
  for (const f of facilities) grouped[f.managingUnit].push(f);
  const activeCount = facilities.filter((f) => f.isActive).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Fasilitas"
        subtitle={
          bureau
            ? `${facilities.length} fasilitas di ${MANAGING_UNIT_LABEL[bureau]} · ${activeCount} aktif`
            : `${facilities.length} fasilitas · ${activeCount} aktif`
        }
        action={
          <Link href="/dashboard/admin-unit/facilities/new">
            <Button>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Tambah Fasilitas
            </Button>
          </Link>
        }
      />

      {UNIT_ORDER.map((unit) => {
        const items = grouped[unit];
        if (items.length === 0) return null;
        const unitActive = items.filter((i) => i.isActive).length;
        return (
          <section
            key={unit}
            className="overflow-hidden rounded-2xl bg-white ring-1 ring-[var(--neutral-200)] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.08)]"
          >
            {/* Unit header */}
            <div
              className="relative flex items-center gap-3 border-b border-[var(--neutral-100)] px-6 py-5"
              style={{
                background: `linear-gradient(135deg, ${UNIT_GLOW[unit]} 0%, transparent 60%)`,
              }}
            >
              <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${UNIT_GRADIENT[unit]} text-white shadow-[0_4px_12px_-2px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.2)]`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21V11M15 21V11" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-bold tracking-tight text-[var(--neutral-900)]">{MANAGING_UNIT_LABEL[unit]}</h2>
                  <span className="inline-flex items-center rounded-full bg-[var(--neutral-100)] px-2 py-0.5 text-[10.5px] font-semibold text-[var(--neutral-700)]">
                    {items.length}
                  </span>
                </div>
                <p className="mt-0.5 text-[11.5px] text-[var(--neutral-500)]">
                  {unitActive} aktif · {items.length - unitActive} non-aktif
                </p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--neutral-100)] bg-[var(--neutral-50)]/60 text-left text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--neutral-500)]">
                    <th className="px-6 py-3">Nama</th>
                    <th className="px-6 py-3">Kategori</th>
                    <th className="px-6 py-3">Lokasi</th>
                    <th className="px-6 py-3 text-center">Kap.</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--neutral-100)]">
                  {items.map((f) => {
                    const active = Boolean(f.isActive);
                    return (
                      <tr
                        key={f.id}
                        className="group/row relative transition-colors hover:bg-[var(--neutral-50)]/70"
                      >
                        <td className="relative px-6 py-4">
                          {/* Active row left accent */}
                          <span
                            aria-hidden
                            className={`absolute inset-y-2 left-0 w-0.5 origin-center scale-y-0 rounded-full bg-gradient-to-b ${UNIT_GRADIENT[unit]} transition-transform group-hover/row:scale-y-100`}
                          />
                          <p className="font-semibold text-[var(--neutral-900)]">{f.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-md bg-[var(--neutral-100)] px-2 py-0.5 text-[11px] font-medium text-[var(--neutral-700)]">
                            {f.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[12.5px] text-[var(--neutral-600)]">
                          <span className="inline-flex items-center gap-1.5">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--neutral-400)]">
                              <path d="M20 10c0 7-8 13-8 13s-8-6-8-13a8 8 0 0 1 16 0Z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            {f.location ?? '—'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-semibold tabular-nums text-[var(--neutral-800)]">
                          {f.capacity ?? '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                              active
                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                : 'bg-[var(--neutral-100)] text-[var(--neutral-600)] ring-[var(--neutral-200)]'
                            }`}
                          >
                            <span className="relative inline-flex h-1.5 w-1.5">
                              {active && (
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                              )}
                              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-[var(--neutral-400)]'}`} />
                            </span>
                            {active ? 'Aktif' : 'Non-Aktif'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-70 transition-opacity group-hover/row:opacity-100">
                            <Link
                              href={`/dashboard/admin-unit/facilities/${f.id}/edit`}
                              className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-[11.5px] font-semibold text-[var(--neutral-700)] ring-1 ring-[var(--neutral-200)] transition-colors hover:bg-[var(--neutral-50)] hover:text-[var(--neutral-900)] hover:ring-[var(--neutral-300)]"
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
                              </svg>
                              Edit
                            </Link>
                            <form action={toggleFacilityActive.bind(null, f.id)}>
                              <button
                                type="submit"
                                className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-[11.5px] font-semibold text-[var(--neutral-600)] transition-colors hover:bg-[var(--neutral-100)] hover:text-[var(--neutral-900)]"
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  {active ? (
                                    <>
                                      <circle cx="12" cy="12" r="10" />
                                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                    </>
                                  ) : (
                                    <path d="m9 12 2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                  )}
                                </svg>
                                {active ? 'Non-aktifkan' : 'Aktifkan'}
                              </button>
                            </form>
                            <form action={deleteFacility.bind(null, f.id)}>
                              <button
                                type="submit"
                                className="inline-flex h-8 items-center gap-1 rounded-md bg-rose-50 px-2.5 text-[11.5px] font-semibold text-rose-700 ring-1 ring-rose-200 transition-colors hover:bg-rose-100 hover:text-rose-800 hover:ring-rose-300"
                              >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" />
                                </svg>
                                Hapus
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
