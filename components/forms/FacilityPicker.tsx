'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  DoorOpen,
  FlaskConical,
  Camera,
  Car,
  ChevronDown,
  Search,
  MapPin,
  Users as UsersIcon,
  Check,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MANAGING_UNIT_DESC, MANAGING_UNIT_LABEL, type Facility, type ManagingUnit } from '@/types';

const UNIT_ORDER: ManagingUnit[] = ['BIRO_I', 'BIRO_IV', 'PPLK', 'KRT', 'LPAIP'];

const UNIT_ICON: Record<ManagingUnit, LucideIcon> = {
  BIRO_I: DoorOpen,
  BIRO_IV: Building2,
  PPLK: FlaskConical,
  KRT: Car,
  LPAIP: Camera,
};

const UNIT_ACCENT: Record<ManagingUnit, { fg: string; bg: string; bar: string }> = {
  BIRO_I:  { fg: 'text-sky-700',     bg: 'bg-sky-50',     bar: 'bg-sky-400' },
  BIRO_IV: { fg: 'text-violet-700',  bg: 'bg-violet-50',  bar: 'bg-violet-400' },
  PPLK:    { fg: 'text-emerald-700', bg: 'bg-emerald-50', bar: 'bg-emerald-400' },
  KRT:     { fg: 'text-amber-700',   bg: 'bg-amber-50',   bar: 'bg-amber-400' },
  LPAIP:   { fg: 'text-rose-700',    bg: 'bg-rose-50',    bar: 'bg-rose-400' },
};

export function FacilityPicker({
  facilities,
  value,
  onChange,
}: {
  facilities: Facility[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const selected = useMemo(
    () => facilities.find((f) => String(f.id) === value),
    [facilities, value]
  );

  const filtered = useMemo(() => {
    const grouped: Record<ManagingUnit, Facility[]> = {
      BIRO_I: [], BIRO_IV: [], PPLK: [], KRT: [], LPAIP: [],
    };
    const needle = q.trim().toLowerCase();
    for (const f of facilities) {
      if (needle) {
        if (
          !f.name.toLowerCase().includes(needle) &&
          !(f.location ?? '').toLowerCase().includes(needle) &&
          !f.category.toLowerCase().includes(needle)
        )
          continue;
      }
      grouped[f.managingUnit].push(f);
    }
    return grouped;
  }, [facilities, q]);

  function pick(f: Facility) {
    onChange(String(f.id));
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
        {selected ? (
          <>
            <span className="min-w-0 flex-1 truncate text-[var(--neutral-900)]">
              <span className="font-medium">{selected.name}</span>
              {selected.location && (
                <span className="ml-1.5 text-[12px] text-[var(--neutral-500)]">· {selected.location}</span>
              )}
            </span>
            <span className="shrink-0 rounded-full bg-[var(--neutral-100)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--neutral-600)]">
              {MANAGING_UNIT_LABEL[selected.managingUnit]}
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

      {open && (
        <div
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-lg,0_10px_25px_-5px_rgba(0,0,0,0.15))]"
          role="listbox"
        >
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

          <div className="max-h-[320px] overflow-y-auto">
            {UNIT_ORDER.map((unit, idx) => {
              const items = filtered[unit];
              const UnitIcon = UNIT_ICON[unit];
              const a = UNIT_ACCENT[unit];
              return (
                <details
                  key={unit}
                  open
                  className={`group ${idx > 0 ? 'border-t border-[var(--neutral-200)]' : ''}`}
                >
                  <summary className={`relative flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] ${a.fg} transition-colors hover:bg-[var(--neutral-50)]`}>
                    <span className={`absolute left-0 top-0 h-full w-[3px] ${a.bar}`} />
                    <span className="flex items-center gap-1.5 pl-1">
                      <UnitIcon size={12} />
                      {MANAGING_UNIT_LABEL[unit]}
                      <span className="font-normal text-[var(--neutral-400)] normal-case tracking-normal">
                        — {MANAGING_UNIT_DESC[unit]}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className={`rounded-full ${a.bg} ${a.fg} px-1.5 text-[10px] font-bold tabular-nums`}>
                        {items.length}
                      </span>
                      <ChevronDown size={11} className="text-[var(--neutral-400)] transition-transform group-open:rotate-180" />
                    </span>
                  </summary>
                  {items.length === 0 ? (
                    <p className="px-3 py-2 pl-4 text-[11px] text-[var(--neutral-400)]">
                      {q ? 'Tidak ada fasilitas cocok.' : 'Belum ada fasilitas aktif.'}
                    </p>
                  ) : (
                    <ul className="relative pb-1.5 pl-1 pr-1">
                      <span className={`absolute left-0 top-0 h-full w-[3px] ${a.bar} opacity-50`} />
                      {items.map((f) => {
                        const isSelected = String(f.id) === value;
                        return (
                          <li key={f.id}>
                            <button
                              type="button"
                              onClick={() => pick(f)}
                              className={
                                isSelected
                                  ? 'flex w-full items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--primary-50)] px-2.5 py-1.5 text-left text-[12px] ring-1 ring-[var(--primary-100)]'
                                  : 'flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-left text-[12px] transition-colors hover:bg-[var(--neutral-50)]'
                              }
                            >
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
                  )}
                </details>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
