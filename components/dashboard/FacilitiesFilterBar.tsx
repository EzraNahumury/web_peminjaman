'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';
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

  function update(patch: Partial<Record<'kategori' | 'lokasi' | 'tanggal', string>>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    startTransition(() => router.replace(`?${params.toString()}`));
  }

  return (
    <div className="space-y-3" data-pending={isPending ? '' : undefined}>
      {/* Top row: location + date + summary */}
      <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white px-4 py-3 shadow-[var(--shadow-xs)]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={`group inline-flex h-9 min-w-[180px] items-center justify-between gap-2 rounded-[var(--radius-md)] border bg-white px-3 text-[13px] transition-colors ${
                lokasi
                  ? 'border-[var(--primary-300)] bg-[var(--primary-50)] text-[var(--primary-900)]'
                  : 'border-[var(--neutral-200)] text-[var(--neutral-700)] hover:border-[var(--neutral-300)]'
              }`}
            >
              <span className="flex items-center gap-2">
                <MapPin
                  size={14}
                  className={lokasi ? 'text-[var(--primary-700)]' : 'text-[var(--neutral-500)]'}
                />
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--neutral-500)]">
                  Lokasi:
                </span>
                <span className="truncate font-semibold">{lokasi || 'Semua lokasi'}</span>
              </span>
              <ChevronDown size={13} className="opacity-60 transition-transform group-data-[state=open]:rotate-180" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-[300px] w-[240px] overflow-y-auto">
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

        <div className="w-[200px]">
          <DatePicker value={tanggal} onChange={(v) => update({ tanggal: v })} placeholder="Tanggal" />
        </div>

        <p className="ml-auto text-[12px] text-[var(--neutral-500)]">
          <span className="text-[14px] font-bold tabular-nums text-[var(--neutral-900)]">{total}</span>
          <span className="ml-1">fasilitas ditemukan</span>
        </p>
      </div>

      {/* Category tabs */}
      <div className="-mx-1 overflow-x-auto px-1">
        <div className="flex items-center gap-2 pb-1">
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
      className={`inline-flex h-8 shrink-0 items-center rounded-full px-4 text-[12.5px] font-semibold transition-colors ${
        active
          ? 'bg-[var(--primary-700)] text-white shadow-[var(--shadow-sm)]'
          : 'bg-white text-[var(--neutral-700)] ring-1 ring-[var(--neutral-200)] hover:bg-[var(--neutral-50)] hover:text-[var(--neutral-900)]'
      }`}
    >
      {label}
    </button>
  );
}
