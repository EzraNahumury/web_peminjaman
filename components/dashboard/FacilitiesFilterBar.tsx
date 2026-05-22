'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { ChevronDown, MapPin, X } from 'lucide-react';
import { FacilitySearchInput } from '@/components/dashboard/FacilitySearchInput';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { DatePicker } from '@/components/forms/DatePicker';
import { getFilterIcon } from '@/lib/facility-icons';

type Props = {
  filterOptions: string[];
  locations: string[];
  total: number;
  search: string;
  onSearchChange: (value: string) => void;
};

export function FacilitiesFilterBar({ filterOptions, locations, total, search, onSearchChange }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const kategori = sp.get('kategori') ?? '';
  const lokasi = sp.get('lokasi') ?? '';
  const tanggal = sp.get('tanggal') ?? '';
  const hasFilter = !!(kategori || lokasi || tanggal || search.trim());

  function update(patch: Partial<Record<'kategori' | 'lokasi' | 'tanggal', string>>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    startTransition(() => router.replace(`?${params.toString()}`));
  }

  function clearAll() {
    onSearchChange('');
    startTransition(() => router.replace('?'));
  }

  return (
    <div className="relative z-30 space-y-3" data-pending={isPending ? '' : undefined}>
      <div className="flex items-stretch gap-0.5 overflow-visible rounded-[var(--radius-xl)] bg-white p-1.5 ring-1 ring-[var(--neutral-200)] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.06)]">
        {/* Pencarian — memenuhi sisa lebar */}
        <FacilitySearchInput
          value={search}
          onChange={onSearchChange}
          embedded
          placeholder="Cari nama, kategori, lokasi, atau unit…"
          className="min-w-0 flex-1"
        />

        {/* Filter kanan: lokasi · tanggal · reset · jumlah */}
        <div className="ml-auto flex shrink-0 items-stretch gap-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="group flex h-11 min-w-[9rem] items-center gap-2 rounded-[var(--radius-md)] px-3 text-[13px] text-[var(--neutral-700)] outline-none transition-colors hover:bg-[var(--neutral-50)] data-[state=open]:bg-[var(--neutral-50)] sm:min-w-[11rem]"
              >
                <span className="relative inline-flex shrink-0">
                  <MapPin
                    size={15}
                    className={lokasi ? 'text-[var(--primary-700)]' : 'text-[var(--neutral-500)]'}
                  />
                  {lokasi && (
                    <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[var(--primary-600)] ring-2 ring-white" />
                  )}
                </span>
                <span className="hidden text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--neutral-500)] md:inline">
                  Lokasi
                </span>
                <span className="min-w-0 flex-1 truncate text-left font-semibold text-[var(--neutral-900)]">
                  {lokasi || 'Semua lokasi'}
                </span>
                <ChevronDown
                  size={13}
                  className="shrink-0 opacity-50 transition-transform group-data-[state=open]:rotate-180"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="z-[200] max-h-[300px] w-[260px] overflow-y-auto"
            >
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

          <div aria-hidden className="my-2 w-px shrink-0 bg-[var(--neutral-200)]" />

          <div className="relative shrink-0">
            <DatePicker
              value={tanggal}
              onChange={(v) => update({ tanggal: v })}
              placeholder="Pilih tanggal"
              variant="ghost"
              popoverAlign="end"
            />
          </div>

          <div aria-hidden className="my-2 w-px shrink-0 bg-[var(--neutral-200)]" />

          <div className="flex items-center gap-1.5 px-1">
            {hasFilter && (
              <button
                type="button"
                onClick={clearAll}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold text-[var(--neutral-600)] transition-colors hover:bg-[var(--neutral-100)] hover:text-[var(--neutral-900)]"
              >
                <X size={12} />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
            <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--neutral-50)] px-3 py-1.5 ring-1 ring-inset ring-[var(--neutral-200)]">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full ${
                    isPending ? 'animate-ping bg-[var(--primary-500)] opacity-75' : 'bg-[var(--primary-500)]'
                  }`}
                />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--primary-600)]" />
              </span>
              <span className="text-[13px] font-bold tabular-nums text-[var(--neutral-900)]">{total}</span>
              <span className="hidden text-[12px] text-[var(--neutral-500)] sm:inline">fasilitas</span>
            </div>
          </div>
        </div>
      </div>

      <div className="-mx-1 overflow-x-auto px-1">
        <div className="flex items-center gap-1.5 pb-1">
          <CategoryPill label="Semua" active={!kategori} onClick={() => update({ kategori: '' })} />
          {filterOptions.map((c) => (
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
  const isAll = label === 'Semua';
  const Icon = isAll ? null : getFilterIcon(label);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold transition-all ${
        active
          ? 'bg-[var(--neutral-900)] text-white shadow-[0_1px_2px_rgba(15,23,42,0.12),0_4px_12px_-4px_rgba(15,23,42,0.2)]'
          : 'bg-white text-[var(--neutral-600)] ring-1 ring-[var(--neutral-200)] hover:bg-[var(--neutral-50)] hover:text-[var(--neutral-900)] hover:ring-[var(--neutral-300)]'
      }`}
    >
      {Icon && <Icon size={13} strokeWidth={2} className={active ? 'opacity-90' : 'text-[var(--neutral-500)]'} />}
      {label}
    </button>
  );
}
