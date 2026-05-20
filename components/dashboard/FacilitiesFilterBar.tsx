'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Calendar as CalendarIcon, ChevronDown, Layers, MapPin, RotateCcw, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';

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
  const q = sp.get('q') ?? '';

  function update(patch: Partial<Record<'kategori' | 'lokasi' | 'tanggal' | 'q', string>>) {
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
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--neutral-400)]" />
          <input
            type="search"
            defaultValue={q}
            onChange={(e) => update({ q: e.target.value })}
            placeholder="Cari fasilitas, lokasi, kategori…"
            className="h-9 w-full rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-white pl-9 pr-3 text-[13px] text-[var(--neutral-900)] placeholder:text-[var(--neutral-400)] outline-none transition-colors focus:border-[var(--primary-500)] focus:ring-[3px] focus:ring-[var(--primary-100)]"
          />
        </div>

        <FilterChip
          icon={<Layers size={13} />}
          label="Kategori"
          value={kategori}
          options={categories}
          allLabel="Semua kategori"
          onPick={(v) => update({ kategori: v })}
        />
        <FilterChip
          icon={<MapPin size={13} />}
          label="Lokasi"
          value={lokasi}
          options={locations}
          allLabel="Semua lokasi"
          onPick={(v) => update({ lokasi: v })}
        />

        <label
          className={`relative inline-flex h-9 items-center gap-2 rounded-[var(--radius-md)] border px-3 text-[12.5px] transition-colors ${
            tanggal
              ? 'border-[var(--primary-300)] bg-[var(--primary-50)] text-[var(--primary-900)]'
              : 'border-[var(--neutral-200)] bg-white text-[var(--neutral-700)] hover:border-[var(--neutral-300)]'
          }`}
        >
          <CalendarIcon size={13} className={tanggal ? 'text-[var(--primary-700)]' : 'text-[var(--neutral-500)]'} />
          {tanggal ? (
            <span className="font-semibold">
              {new Date(tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          ) : (
            <span className="text-[var(--neutral-500)]">Tanggal</span>
          )}
          <input
            type="date"
            value={tanggal}
            onChange={(e) => update({ tanggal: e.target.value })}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Filter tanggal"
          />
        </label>

        <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-[var(--neutral-100)] px-3 py-1 text-[11px] text-[var(--neutral-600)]">
          <span className="text-[13px] font-bold tabular-nums text-[var(--neutral-900)]">{total}</span>
          fasilitas
        </span>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => update({ kategori: '', lokasi: '', tanggal: '' })}
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-white px-3 text-[12px] font-medium text-[var(--neutral-700)] transition-colors hover:border-[var(--neutral-300)] hover:bg-[var(--neutral-50)]"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

function FilterChip({
  icon,
  label,
  value,
  options,
  allLabel,
  onPick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  options: string[];
  allLabel: string;
  onPick: (v: string) => void;
}) {
  const active = Boolean(value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`group inline-flex h-9 items-center gap-2 rounded-[var(--radius-md)] border px-3 text-[12.5px] transition-colors ${
            active
              ? 'border-[var(--primary-300)] bg-[var(--primary-50)] text-[var(--primary-900)] hover:bg-[var(--primary-100)]'
              : 'border-[var(--neutral-200)] bg-white text-[var(--neutral-700)] hover:border-[var(--neutral-300)]'
          }`}
        >
          <span className={active ? 'text-[var(--primary-700)]' : 'text-[var(--neutral-500)]'}>{icon}</span>
          {active ? (
            <span className="font-semibold">
              <span className="text-[10.5px] font-medium uppercase tracking-wider text-[var(--primary-700)]/70">
                {label}:
              </span>{' '}
              {value}
            </span>
          ) : (
            <span className="text-[var(--neutral-600)]">{label}</span>
          )}
          <ChevronDown
            size={12}
            className={`opacity-60 transition-transform group-data-[state=open]:rotate-180 ${
              active ? 'text-[var(--primary-700)]' : ''
            }`}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-[300px] w-[220px] overflow-y-auto">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuItem
          onSelect={() => onPick('')}
          className={value === '' ? 'bg-[var(--neutral-100)] font-semibold' : ''}
        >
          {allLabel}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt}
            onSelect={() => onPick(opt)}
            className={opt === value ? 'bg-[var(--primary-50)] font-semibold text-[var(--primary-800)]' : ''}
          >
            {opt}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
