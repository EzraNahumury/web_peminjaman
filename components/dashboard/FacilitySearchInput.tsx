'use client';

import { Search, X } from 'lucide-react';
import { resolveFacilityFilterKey } from '@/lib/facility-filters';
import { MANAGING_UNIT_LABEL, type ManagingUnit } from '@/types';

export function FacilitySearchInput({
  value,
  onChange,
  placeholder = 'Cari nama, kategori, lokasi, atau unit…',
  className = '',
  embedded = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Tanpa border sendiri — dipakai di dalam filter bar */
  embedded?: boolean;
}) {
  return (
    <div className={`relative min-w-0 flex-1 ${className}`}>
      <Search
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--neutral-400)]"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={
          embedded
            ? 'h-11 w-full rounded-[var(--radius-md)] bg-transparent pl-9 pr-8 text-[13px] text-[var(--neutral-900)] placeholder:text-[var(--neutral-400)] outline-none transition-colors hover:bg-[var(--neutral-50)] focus:bg-[var(--neutral-50)] focus:ring-2 focus:ring-[var(--primary-100)]'
            : 'h-11 w-full rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-[var(--neutral-50)]/80 pl-10 pr-9 text-[13px] text-[var(--neutral-900)] placeholder:text-[var(--neutral-400)] outline-none transition-all focus:border-[var(--primary-500)] focus:bg-white focus:ring-[3px] focus:ring-[var(--primary-100)]'
        }
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Hapus pencarian"
          className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--neutral-400)] transition-colors hover:bg-[var(--neutral-200)] hover:text-[var(--neutral-700)]"
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}

export function facilityMatchesQuery(
  f: { id: number; name: string; category: string; location: string | null; managingUnit: ManagingUnit },
  q: string
): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const code = `f-${String(f.id).padStart(2, '0')}`;
  const unitLabel = MANAGING_UNIT_LABEL[f.managingUnit];
  const filterKey = resolveFacilityFilterKey(f);
  const haystack = [f.name, f.category, filterKey, f.location ?? '', unitLabel, code]
    .join(' ')
    .toLowerCase();
  return haystack.includes(needle);
}
