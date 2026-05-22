'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FacilitySearchInput, facilityMatchesQuery } from '@/components/dashboard/FacilitySearchInput';
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

export function AdminFacilitiesList({
  facilities,
  toggleFacilityActive,
  deleteFacility,
}: {
  facilities: Facility[];
  toggleFacilityActive: (id: number) => Promise<void>;
  deleteFacility: (id: number) => Promise<void>;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => facilities.filter((f) => facilityMatchesQuery(f, search)),
    [facilities, search]
  );

  const grouped = useMemo(() => {
    const g: Record<ManagingUnit, Facility[]> = {
      BIRO_I: [],
      BIRO_IV: [],
      PPLK: [],
      KRT: [],
      LPAIP: [],
    };
    for (const f of filtered) g[f.managingUnit].push(f);
    return g;
  }, [filtered]);

  const visibleCount = filtered.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FacilitySearchInput
          value={search}
          onChange={setSearch}
          placeholder="Cari nama, kategori, lokasi…"
          className="max-w-xl"
        />
        <p className="text-[12px] text-[var(--neutral-500)]">
          Menampilkan{' '}
          <span className="font-bold tabular-nums text-[var(--neutral-900)]">{visibleCount}</span>
          {' '}dari {facilities.length} fasilitas
        </p>
      </div>

      {visibleCount === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--neutral-300)] bg-white px-6 py-14 text-center">
          <p className="text-[13px] font-medium text-[var(--neutral-700)]">
            {search.trim()
              ? `Tidak ada fasilitas yang cocok dengan “${search.trim()}”.`
              : 'Belum ada fasilitas terdaftar.'}
          </p>
          {search.trim() && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="mt-3 text-[12px] font-semibold text-[var(--primary-700)] hover:underline"
            >
              Hapus pencarian
            </button>
          )}
        </div>
      ) : (
        UNIT_ORDER.map((unit) => {
          const items = grouped[unit];
          if (items.length === 0) return null;
          const unitActive = items.filter((i) => i.isActive).length;
          return (
            <section
              key={unit}
              className="overflow-hidden rounded-2xl bg-white ring-1 ring-[var(--neutral-200)] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.08)]"
            >
              <div
                className="relative flex items-center gap-3 border-b border-[var(--neutral-100)] px-6 py-5"
                style={{
                  background: `linear-gradient(135deg, ${UNIT_GLOW[unit]} 0%, transparent 60%)`,
                }}
              >
                <div
                  className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${UNIT_GRADIENT[unit]} text-white shadow-[0_4px_12px_-2px_rgba(15,23,42,0.18),inset_0_1px_0_rgba(255,255,255,0.2)]`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21V11M15 21V11" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[15px] font-bold tracking-tight text-[var(--neutral-900)]">
                      {MANAGING_UNIT_LABEL[unit]}
                    </h2>
                    <span className="inline-flex items-center rounded-full bg-[var(--neutral-100)] px-2 py-0.5 text-[10.5px] font-semibold text-[var(--neutral-700)]">
                      {items.length}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11.5px] text-[var(--neutral-500)]">
                    {unitActive} aktif · {items.length - unitActive} non-aktif
                  </p>
                </div>
              </div>

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
                            {f.location ?? '—'}
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
                              {active ? 'Aktif' : 'Non-Aktif'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1 opacity-70 transition-opacity group-hover/row:opacity-100">
                              <Link
                                href={`/dashboard/admin-unit/facilities/${f.id}/edit`}
                                className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 text-[11.5px] font-semibold text-[var(--neutral-700)] ring-1 ring-[var(--neutral-200)] transition-colors hover:bg-[var(--neutral-50)]"
                              >
                                Edit
                              </Link>
                              <form action={toggleFacilityActive.bind(null, f.id)}>
                                <button
                                  type="submit"
                                  className="inline-flex h-8 items-center rounded-md px-2.5 text-[11.5px] font-semibold text-[var(--neutral-600)] hover:bg-[var(--neutral-100)]"
                                >
                                  {active ? 'Non-aktifkan' : 'Aktifkan'}
                                </button>
                              </form>
                              <form action={deleteFacility.bind(null, f.id)}>
                                <button
                                  type="submit"
                                  className="inline-flex h-8 items-center rounded-md bg-rose-50 px-2.5 text-[11.5px] font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100"
                                >
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
        })
      )}
    </div>
  );
}
