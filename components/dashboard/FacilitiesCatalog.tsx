'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, MapPin, Users as UsersIcon, ArrowRight, CalendarRange } from 'lucide-react';
import { FacilitiesFilterBar } from '@/components/dashboard/FacilitiesFilterBar';
import { facilityMatchesQuery } from '@/components/dashboard/FacilitySearchInput';
import { getFacilityIcon } from '@/lib/facility-icons';
import { type Facility, MANAGING_UNIT_LABEL } from '@/types';

type Props = {
  facilities: Facility[];
  filterOptions: string[];
  locations: string[];
  unavailableIds: number[];
  tanggal: string;
  isPengurus: boolean;
};

export function FacilitiesCatalog({
  facilities,
  filterOptions,
  locations,
  unavailableIds,
  tanggal,
  isPengurus,
}: Props) {
  const [search, setSearch] = useState('');
  const unavailableSet = useMemo(() => new Set(unavailableIds), [unavailableIds]);

  const displayed = useMemo(
    () => facilities.filter((f) => facilityMatchesQuery(f, search)),
    [facilities, search]
  );

  const dateLabel = tanggal
    ? new Date(tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="relative space-y-5">
      <FacilitiesFilterBar
        filterOptions={filterOptions}
        locations={locations}
        total={displayed.length}
        search={search}
        onSearchChange={setSearch}
      />

      {displayed.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--neutral-300)] bg-white px-5 py-12 text-center">
          <p className="text-[13px] font-medium text-[var(--neutral-700)]">
            {search.trim()
              ? `Tidak ada fasilitas yang cocok dengan “${search.trim()}”.`
              : 'Tidak ada fasilitas yang cocok dengan filter saat ini.'}
          </p>
          {search.trim() ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="mt-3 text-[12px] font-semibold text-[var(--primary-700)] hover:underline"
            >
              Hapus kata kunci pencarian
            </button>
          ) : tanggal ? (
            <p className="mt-1 text-[12px] text-[var(--neutral-500)]">
              Coba pilih tanggal lain atau hapus filter tanggal.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="relative z-0 grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((f) => {
            const Icon = getFacilityIcon(f);
            const unavailable = Boolean(tanggal) && unavailableSet.has(f.id);
            const headerBg =
              unavailable && tanggal
                ? 'radial-gradient(ellipse 90% 70% at 0% 100%, rgba(255,255,255,0.12), transparent 55%), radial-gradient(ellipse 70% 55% at 100% 0%, rgba(148,163,184,0.35), transparent 50%), linear-gradient(145deg, #64748b 0%, #475569 42%, #1e293b 100%)'
                : 'radial-gradient(ellipse 95% 75% at 8% 100%, rgba(167,243,208,0.28), transparent 58%), radial-gradient(ellipse 65% 50% at 92% 8%, rgba(255,255,255,0.18), transparent 52%), radial-gradient(ellipse 45% 40% at 50% 50%, rgba(16,185,129,0.12), transparent 70%), linear-gradient(152deg, #0d5c4a 0%, var(--primary-800) 48%, #0c3d34 100%)';

            return (
              <article
                key={f.id}
                className="group/card flex h-full flex-col overflow-hidden rounded-[1.25rem] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-[var(--neutral-200)]/90 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_48px_-20px_rgba(15,23,42,0.22)] hover:ring-[var(--primary-200)]"
              >
                <div
                  className="relative flex h-48 shrink-0 items-center justify-center overflow-hidden text-white sm:h-[12.75rem]"
                  style={{ background: headerBg }}
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -left-8 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-white/10 blur-2xl"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-emerald-300/20 blur-2xl"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(0,0,0,0.18)_100%)]"
                  />

                  <span
                    className={`absolute right-3.5 top-3.5 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/95 px-3 py-1 text-[11px] font-semibold shadow-[0_4px_14px_rgba(15,23,42,0.12)] backdrop-blur-sm ${
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

                  <div className="relative z-[1] flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_12px_28px_rgba(0,0,0,0.2)] backdrop-blur-sm transition-transform duration-500 group-hover/card:scale-[1.04]">
                    <Icon size={40} strokeWidth={1.5} className="opacity-95" />
                  </div>

                  <span className="absolute bottom-3.5 left-3.5 z-10 inline-flex items-center rounded-lg border border-white/20 bg-black/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md">
                    {f.category}
                  </span>
                </div>

                <div className="flex min-h-[11.5rem] flex-1 flex-col p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <h3 className="min-h-[2.75rem] flex-1 line-clamp-2 text-base font-bold leading-snug tracking-tight text-[var(--neutral-900)] sm:min-h-[3rem] sm:text-[17px]">
                      {f.name}
                    </h3>
                    <div
                      className="flex w-[4.25rem] shrink-0 flex-col items-center justify-center rounded-xl border border-[var(--neutral-100)] bg-[var(--neutral-50)] px-2 py-2.5 text-center ring-1 ring-inset ring-[var(--neutral-100)]"
                      title={f.capacity != null ? `Kapasitas ${f.capacity} orang` : 'Kapasitas tidak dicantumkan'}
                    >
                      <UsersIcon size={14} className="mb-1 text-[var(--neutral-400)]" />
                      {f.capacity != null ? (
                        <>
                          <span className="text-lg font-bold leading-none tabular-nums text-[var(--neutral-900)]">
                            {f.capacity}
                          </span>
                          <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--neutral-500)]">
                            orang
                          </span>
                        </>
                      ) : (
                        <span className="text-[11px] font-medium text-[var(--neutral-400)]">—</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 min-h-[4.25rem] flex-1 space-y-2.5">
                    <p className="flex min-h-[1.25rem] items-center gap-2 text-[13px] leading-snug text-[var(--neutral-600)]">
                      <MapPin size={14} className="shrink-0 text-[var(--neutral-400)]" />
                      <span className="line-clamp-1">{f.location ?? '—'}</span>
                    </p>
                    <p className="flex min-h-[1.25rem] items-center gap-2 text-[13px] leading-snug text-[var(--neutral-600)]">
                      <Building2 size={14} className="shrink-0 text-[var(--neutral-400)]" />
                      <span className="line-clamp-1">{MANAGING_UNIT_LABEL[f.managingUnit]}</span>
                    </p>
                  </div>

                  <div className={`mt-auto grid gap-2.5 pt-5 ${isPengurus ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <Link
                      href={`/dashboard/facilities/${f.id}`}
                      className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-3 text-[13px] font-semibold text-[var(--primary-800)] ring-1 ring-[var(--neutral-200)] transition-colors hover:bg-[var(--neutral-50)] hover:ring-[var(--primary-200)]"
                    >
                      Lihat detail
                    </Link>
                    {isPengurus &&
                      (unavailable ? (
                        <button
                          type="button"
                          disabled
                          className="inline-flex h-10 cursor-not-allowed items-center justify-center rounded-xl bg-[var(--neutral-100)] px-3 text-[13px] font-semibold text-[var(--neutral-400)]"
                        >
                          Tidak Tersedia
                        </button>
                      ) : (
                        <Link
                          href={`/dashboard/pengurus/requests/new?facility=${f.id}`}
                          className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-[var(--primary-800)] px-3 text-[13px] font-semibold text-white shadow-[0_4px_14px_-4px_rgba(15,23,42,0.35)] transition-all hover:bg-[var(--primary-900)] hover:shadow-[0_6px_18px_-4px_rgba(15,23,42,0.4)]"
                        >
                          Pinjam
                          <ArrowRight size={13} className="transition-transform group-hover/card:translate-x-0.5" />
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
