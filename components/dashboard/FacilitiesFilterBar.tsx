'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Calendar as CalendarIcon, Layers, MapPin, X } from 'lucide-react';

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

  function update(patch: Partial<Record<'kategori' | 'lokasi' | 'tanggal', string>>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    startTransition(() => router.replace(`?${params.toString()}`));
  }

  const activeCount = [kategori, lokasi, tanggal].filter(Boolean).length;

  return (
    <div
      className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)]"
      data-pending={isPending ? '' : undefined}
    >
      <div className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <FilterField
          icon={<Layers size={14} />}
          label="Kategori"
          value={kategori}
          options={categories}
          onChange={(v) => update({ kategori: v })}
        />
        <FilterField
          icon={<MapPin size={14} />}
          label="Lokasi"
          value={lokasi}
          options={locations}
          onChange={(v) => update({ lokasi: v })}
        />
        <DateField value={tanggal} onChange={(v) => update({ tanggal: v })} />

        <div className="flex items-center justify-end gap-3">
          <p className="text-[11.5px] text-[var(--neutral-500)]">
            <span className="text-[15px] font-bold tabular-nums text-[var(--neutral-900)]">{total}</span>
            <span className="ml-1">fasilitas</span>
          </p>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => update({ kategori: '', lokasi: '', tanggal: '' })}
              className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-white px-3 text-[12px] font-medium text-[var(--neutral-700)] transition-colors hover:border-[var(--neutral-300)] hover:bg-[var(--neutral-50)]"
            >
              <X size={13} />
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterField({
  icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label
      className={`group relative flex items-center gap-2 rounded-[var(--radius-md)] border bg-white px-3 transition-colors ${
        value
          ? 'border-[var(--primary-300)] ring-2 ring-[var(--primary-100)]/60'
          : 'border-[var(--neutral-200)] hover:border-[var(--neutral-300)]'
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] ${
          value
            ? 'bg-[var(--primary-50)] text-[var(--primary-700)] ring-1 ring-[var(--primary-100)]'
            : 'bg-[var(--neutral-100)] text-[var(--neutral-500)]'
        }`}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--neutral-500)]">
          {label}
        </span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="-ml-0.5 cursor-pointer truncate border-0 bg-transparent py-1.5 pl-0 pr-6 text-[13px] font-semibold text-[var(--neutral-900)] outline-none focus:ring-0"
        >
          <option value="">Semua {label.toLowerCase()}</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </span>
      {value && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onChange('');
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--neutral-400)] hover:bg-[var(--neutral-100)] hover:text-[var(--neutral-700)]"
          aria-label="Hapus filter"
        >
          <X size={11} />
        </button>
      )}
    </label>
  );
}

function DateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label
      className={`group relative flex items-center gap-2 rounded-[var(--radius-md)] border bg-white px-3 transition-colors ${
        value
          ? 'border-[var(--primary-300)] ring-2 ring-[var(--primary-100)]/60'
          : 'border-[var(--neutral-200)] hover:border-[var(--neutral-300)]'
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] ${
          value
            ? 'bg-[var(--primary-50)] text-[var(--primary-700)] ring-1 ring-[var(--primary-100)]'
            : 'bg-[var(--neutral-100)] text-[var(--neutral-500)]'
        }`}
      >
        <CalendarIcon size={14} />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--neutral-500)]">
          Tersedia tanggal
        </span>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="-ml-0.5 cursor-pointer border-0 bg-transparent py-1.5 pl-0 pr-6 text-[13px] font-semibold text-[var(--neutral-900)] outline-none focus:ring-0"
        />
      </span>
      {value && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onChange('');
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--neutral-400)] hover:bg-[var(--neutral-100)] hover:text-[var(--neutral-700)]"
          aria-label="Hapus tanggal"
        >
          <X size={11} />
        </button>
      )}
    </label>
  );
}
