'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { ChevronDown, MapPin, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { DatePicker } from '@/components/forms/DatePicker';

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
  const hasFilter = !!(kategori || lokasi || tanggal);

  function update(patch: Partial<Record<'kategori' | 'lokasi' | 'tanggal', string>>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    startTransition(() => router.replace(`?${params.toString()}`));
  }

  function clearAll() {
    startTransition(() => router.replace('?'));
  }

  return (
    <div className="space-y-3.5" data-pending={isPending ? '' : undefined}>
      {/* Segmented filter bar */}
      <div className="flex items-stretch gap-1 rounded-[var(--radius-xl)] bg-white p-1.5 ring-1 ring-[var(--neutral-200)] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.06)]">
        {/* Location segment */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="group flex h-11 min-w-[200px] items-center gap-2.5 rounded-[var(--radius-md)] px-3.5 text-[13px] text-[var(--neutral-700)] outline-none transition-colors hover:bg-[var(--neutral-50)] data-[state=open]:bg-[var(--neutral-50)]"
            >
              <span className="relative inline-flex">
                <MapPin
                  size={15}
                  className={lokasi ? 'text-[var(--primary-700)]' : 'text-[var(--neutral-500)]'}
                />
                {lokasi && (
                  <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[var(--primary-600)] ring-2 ring-white" />
                )}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--neutral-500)]">
                Lokasi
              </span>
              <span className="flex-1 truncate text-left font-semibold text-[var(--neutral-900)]">
                {lokasi || 'Semua lokasi'}
              </span>
              <ChevronDown
                size={13}
                className="opacity-50 transition-transform group-data-[state=open]:rotate-180 group-data-[state=open]:opacity-80"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={8} className="max-h-[300px] w-[260px] overflow-y-auto">
            <DropdownMenuLabel>Lokasi</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => update({ lokasi: '' })}>Semua lokasi</DropdownMenuItem>
            <DropdownMenuSeparator />
            {locations.map((l) => (
              <DropdownMenuItem
                key={l}
                onSelect={() => update({ lokasi: l })}
                className={l === lokasi ? 'bg-[var(--primary-50)] font-semibold text-[var(--primary-800)]' : ''}
              >
                {l}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Divider */}
        <div aria-hidden className="my-2 w-px shrink-0 bg-[var(--neutral-200)]" />

        {/* Date segment */}
        <div className="min-w-[220px]">
          <DatePicker
            value={tanggal}
            onChange={(v) => update({ tanggal: v })}
            placeholder="Pilih tanggal"
            variant="ghost"
          />
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2 pr-2 pl-3">
          {hasFilter && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold text-[var(--neutral-600)] transition-colors hover:bg-[var(--neutral-100)] hover:text-[var(--neutral-900)]"
            >
              <X size={12} />
              Reset
            </button>
          )}
          <div className="flex items-center gap-1.5 rounded-full bg-[var(--neutral-50)] px-3.5 py-1.5 ring-1 ring-inset ring-[var(--neutral-200)]">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span
                className={`absolute inline-flex h-full w-full rounded-full ${
                  isPending ? 'animate-ping bg-[var(--primary-500)] opacity-75' : 'bg-[var(--primary-500)]'
                }`}
              />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--primary-600)]" />
            </span>
            <span className="text-[13px] font-bold tabular-nums text-[var(--neutral-900)]">{total}</span>
            <span className="text-[12px] text-[var(--neutral-500)]">fasilitas</span>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="-mx-1 overflow-x-auto px-1">
        <div className="flex items-center gap-1.5 pb-1">
          <CategoryPill label="Semua" active={!kategori} onClick={() => update({ kategori: '' })} />
          {categories.map((c) => (
            <CategoryPill
              key={c}
              label={c}
              active={c === kategori}
              onClick={() => update({ kategori: c === kategori ? '' : c })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 shrink-0 items-center rounded-full px-3.5 text-[12.5px] font-semibold transition-all ${
        active
          ? 'bg-[var(--neutral-900)] text-white shadow-[0_1px_2px_rgba(15,23,42,0.12),0_4px_12px_-4px_rgba(15,23,42,0.2)]'
          : 'bg-white text-[var(--neutral-600)] ring-1 ring-[var(--neutral-200)] hover:bg-[var(--neutral-50)] hover:text-[var(--neutral-900)] hover:ring-[var(--neutral-300)]'
      }`}
    >
      {label}
    </button>
  );
}
