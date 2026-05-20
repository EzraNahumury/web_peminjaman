'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { SlidersHorizontal, Calendar } from 'lucide-react';

type Props = {
  categories: string[];
  locations: string[];
  total: number;
};

export function FacilitiesFilterBar({ categories, locations, total }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const kategori = sp.get('kategori') ?? '';
  const lokasi = sp.get('lokasi') ?? '';
  const tanggal = sp.get('tanggal') ?? '';

  function update(key: 'kategori' | 'lokasi' | 'tanggal', value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => {
      router.replace(`?${params.toString()}`);
    });
  }

  const controlClass =
    'h-9 rounded-[var(--radius-md)] border border-[var(--neutral-300)] bg-white px-2.5 text-[12.5px] text-[var(--neutral-900)] shadow-[var(--shadow-xs)] outline-none transition-all focus:border-[var(--primary-600)] focus:ring-[3px] focus:ring-[var(--primary-100)]';

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-white px-3 py-2.5 shadow-[var(--shadow-xs)]"
      data-pending={isPending ? '' : undefined}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-1 text-[12.5px] font-semibold text-[var(--neutral-700)]">
          <SlidersHorizontal size={14} className="text-[var(--neutral-500)]" />
          Filter
        </span>

        <label className="inline-flex items-center gap-1.5">
          <span className="text-[12px] text-[var(--neutral-500)]">Kategori:</span>
          <select
            value={kategori}
            onChange={(e) => update('kategori', e.target.value)}
            className={controlClass}
          >
            <option value="">Semua</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="inline-flex items-center gap-1.5">
          <span className="text-[12px] text-[var(--neutral-500)]">Lokasi:</span>
          <select
            value={lokasi}
            onChange={(e) => update('lokasi', e.target.value)}
            className={controlClass}
          >
            <option value="">Semua</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>

        <label className="inline-flex items-center gap-1.5">
          <Calendar size={13} className="text-[var(--neutral-500)]" />
          <span className="text-[12px] text-[var(--neutral-500)]">Tanggal</span>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => update('tanggal', e.target.value)}
            className={controlClass}
          />
        </label>
      </div>

      <p className="text-[12.5px] text-[var(--neutral-500)]">
        <strong className="font-semibold tabular-nums text-[var(--neutral-900)]">{total}</strong> fasilitas ditemukan
      </p>
    </div>
  );
}
