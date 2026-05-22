'use client';
import { useMemo, useRef, useState } from 'react';
import { FloatingPanel } from '@/components/ui/FloatingPanel';
import {
  ChevronDown,
  Search,
  MapPin,
  Users as UsersIcon,
  Check,
} from 'lucide-react';
import { getFacilityIcon, getFilterIcon } from '@/lib/facility-icons';
import { buildFilterOptions, resolveFacilityFilterKey } from '@/lib/facility-filters';
import type { Facility } from '@/types';

const GROUP_ACCENT = {
  fg: 'text-[var(--primary-800)]',
  bg: 'bg-[var(--primary-50)]',
  bar: 'bg-[var(--primary-500)]',
};

function facilityMatchesQuery(f: Facility, needle: string): boolean {
  if (!needle) return true;
  const key = resolveFacilityFilterKey(f);
  return (
    f.name.toLowerCase().includes(needle) ||
    (f.location ?? '').toLowerCase().includes(needle) ||
    f.category.toLowerCase().includes(needle) ||
    key.toLowerCase().includes(needle)
  );
}

export function FacilityPicker({
  facilities,
  value,
  onChange,
  allowAll = false,
  allLabel = 'Semua Fasilitas (block kampus-wide)',
  allValue = 'ALL',
  inline = false,
}: {
  facilities: Facility[];
  value: string;
  onChange: (id: string) => void;
  /** Opsi blokir seluruh kampus (form admin) */
  allowAll?: boolean;
  allLabel?: string;
  allValue?: string;
  /** Render dropdown di dalam DOM (bukan portal) & buka ke atas — untuk pemakaian di dalam Dialog/modal. */
  inline?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  const isAllSelected = allowAll && value === allValue;

  const selected = useMemo(
    () => (isAllSelected ? null : facilities.find((f) => String(f.id) === value)),
    [facilities, value, isAllSelected]
  );

  const categoryOrder = useMemo(() => buildFilterOptions(facilities), [facilities]);

  const { grouped, visibleKeys } = useMemo(() => {
    const map = new Map<string, Facility[]>();
    const needle = q.trim().toLowerCase();

    for (const f of facilities) {
      if (!facilityMatchesQuery(f, needle)) continue;
      const key = resolveFacilityFilterKey(f);
      const list = map.get(key) ?? [];
      list.push(f);
      map.set(key, list);
    }

    for (const items of map.values()) {
      items.sort((a, b) => a.name.localeCompare(b.name, 'id'));
    }

    const ordered = categoryOrder.filter((k) => (map.get(k)?.length ?? 0) > 0);
    const extra = [...map.keys()]
      .filter((k) => !categoryOrder.includes(k))
      .sort((a, b) => a.localeCompare(b, 'id'));

    return { grouped: map, visibleKeys: [...ordered, ...extra] };
  }, [facilities, q, categoryOrder]);

  function pickId(id: string) {
    onChange(id);
    setOpen(false);
    setQ('');
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-10 w-full items-center gap-2 rounded-[var(--radius-md)] border border-[var(--neutral-300)] bg-white px-3.5 text-left text-sm shadow-[var(--shadow-xs)] outline-none transition-all hover:border-[var(--neutral-400)] focus-visible:border-[var(--primary-600)] focus-visible:ring-[3px] focus-visible:ring-[var(--primary-100)]"
      >
        {isAllSelected ? (
          <span className="min-w-0 flex-1 truncate font-medium text-[var(--neutral-900)]">{allLabel}</span>
        ) : selected ? (
          <>
            {(() => {
              const SelIcon = getFacilityIcon(selected);
              return (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-50)] text-[var(--primary-700)] ring-1 ring-[var(--primary-100)]">
                  <SelIcon size={16} strokeWidth={1.75} />
                </span>
              );
            })()}
            <span className="min-w-0 flex-1 truncate text-[var(--neutral-900)]">
              <span className="font-medium">{selected.name}</span>
              {selected.location && (
                <span className="ml-1.5 text-[12px] text-[var(--neutral-500)]">· {selected.location}</span>
              )}
            </span>
            <span className="shrink-0 rounded-full bg-[var(--neutral-100)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--neutral-600)]">
              {resolveFacilityFilterKey(selected)}
            </span>
          </>
        ) : (
          <span className="flex-1 text-[var(--neutral-400)]">— Pilih fasilitas —</span>
        )}
        <ChevronDown
          size={15}
          className={`shrink-0 text-[var(--neutral-400)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <FloatingPanel
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={wrapRef}
        inline={inline}
        className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-lg,0_10px_25px_-5px_rgba(0,0,0,0.15))]"
      >
        <div role="listbox">
          <div className="border-b border-[var(--neutral-100)] p-2">
            <div className="relative">
              <Search size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--neutral-400)]" />
              <input
                type="search"
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari nama, lokasi, atau kategori…"
                className="h-8 w-full rounded-[var(--radius-sm)] border border-[var(--neutral-200)] bg-[var(--neutral-50)] pl-7 pr-2.5 text-[12px] text-[var(--neutral-900)] placeholder:text-[var(--neutral-400)] outline-none focus:border-[var(--primary-600)] focus:bg-white focus:ring-2 focus:ring-[var(--primary-100)]"
              />
            </div>
          </div>

          <div className={inline ? 'max-h-[240px] overflow-y-auto' : 'max-h-[320px] overflow-y-auto'}>
            {allowAll && (
              <div className="border-b border-[var(--neutral-100)] p-1">
                <button
                  type="button"
                  onClick={() => pickId(allValue)}
                  className={
                    isAllSelected
                      ? 'flex w-full items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--primary-50)] px-2.5 py-2 text-left text-[12px] font-medium text-[var(--primary-900)] ring-1 ring-[var(--primary-100)]'
                      : 'flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-[12px] font-medium text-[var(--neutral-800)] transition-colors hover:bg-[var(--neutral-50)]'
                  }
                >
                  <span className="flex-1">{allLabel}</span>
                  {isAllSelected && <Check size={13} className="shrink-0 text-[var(--primary-700)]" />}
                </button>
              </div>
            )}
            {visibleKeys.length === 0 && !allowAll ? (
              <p className="px-3 py-4 text-center text-[12px] text-[var(--neutral-500)]">
                {q ? 'Tidak ada fasilitas cocok.' : 'Belum ada fasilitas aktif.'}
              </p>
            ) : visibleKeys.length === 0 ? (
              q ? (
                <p className="px-3 py-4 text-center text-[12px] text-[var(--neutral-500)]">Tidak ada fasilitas cocok.</p>
              ) : null
            ) : (
              visibleKeys.map((categoryKey, idx) => {
                const items = grouped.get(categoryKey) ?? [];
                const CatIcon = getFilterIcon(categoryKey);
                const a = GROUP_ACCENT;
                return (
                  <div
                    key={categoryKey}
                    className={idx > 0 ? 'border-t border-[var(--neutral-200)]' : ''}
                  >
                    <div
                      className={`relative flex items-center justify-between gap-2 px-3 py-2 text-[11px] font-semibold ${a.fg}`}
                    >
                      <span className={`absolute left-0 top-0 h-full w-[3px] ${a.bar}`} />
                      <span className="flex items-center gap-1.5 pl-1 normal-case tracking-normal">
                        <CatIcon size={12} />
                        {categoryKey}
                      </span>
                      <span className={`rounded-full ${a.bg} ${a.fg} px-1.5 text-[10px] font-bold tabular-nums`}>
                        {items.length}
                      </span>
                    </div>
                    <ul className="relative pb-1.5 pl-1 pr-1">
                      <span className={`absolute left-0 top-0 h-full w-[3px] ${a.bar} opacity-50`} />
                      {items.map((f) => {
                        const isSelected = String(f.id) === value;
                        const FIcon = getFacilityIcon(f);
                        return (
                          <li key={f.id}>
                            <button
                              type="button"
                              onClick={() => pickId(String(f.id))}
                              className={
                                isSelected
                                  ? 'flex w-full items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--primary-50)] px-2.5 py-1.5 text-left text-[12px] ring-1 ring-[var(--primary-100)]'
                                  : 'flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-left text-[12px] transition-colors hover:bg-[var(--neutral-50)]'
                              }
                            >
                              <span
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ${
                                  isSelected
                                    ? 'bg-white text-[var(--primary-700)] ring-[var(--primary-100)]'
                                    : 'bg-[var(--neutral-100)] text-[var(--neutral-600)] ring-[var(--neutral-200)]'
                                }`}
                              >
                                <FIcon size={15} strokeWidth={1.75} />
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-[var(--neutral-900)]">{f.name}</p>
                                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 truncate text-[10.5px] text-[var(--neutral-500)]">
                                  {f.location && (
                                    <span className="inline-flex items-center gap-0.5">
                                      <MapPin size={9} className="text-[var(--neutral-400)]" />
                                      {f.location}
                                    </span>
                                  )}
                                  {f.capacity != null && (
                                    <span className="inline-flex items-center gap-0.5">
                                      <UsersIcon size={9} className="text-[var(--neutral-400)]" />
                                      Kap. {f.capacity}
                                    </span>
                                  )}
                                  <span>{f.category}</span>
                                </p>
                              </div>
                              {isSelected && <Check size={13} className="shrink-0 text-[var(--primary-700)]" />}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </FloatingPanel>
    </div>
  );
}
