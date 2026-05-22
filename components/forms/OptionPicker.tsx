'use client';

import { useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { FloatingPanel } from '@/components/ui/FloatingPanel';

export type OptionPickerItem = { value: string; label: string };

export type OptionPickerGroup = {
  label: string;
  options: OptionPickerItem[];
};

export function OptionPicker({
  value,
  onChange,
  options,
  groups,
  placeholder = '— Pilih —',
  searchable = false,
  name,
  required,
  disabled,
  inline = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options?: OptionPickerItem[];
  groups?: OptionPickerGroup[];
  placeholder?: string;
  searchable?: boolean;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  /** Render dropdown inline (di dalam Dialog/modal) agar bisa diklik. */
  inline?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  const flatOptions = useMemo(() => {
    if (options) return options;
    return (groups ?? []).flatMap((g) => g.options);
  }, [options, groups]);

  const selected = flatOptions.find((o) => o.value === value);

  const filteredGroups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (groups) {
      return groups
        .map((g) => ({
          ...g,
          options: g.options.filter(
            (o) =>
              !needle ||
              o.label.toLowerCase().includes(needle) ||
              o.value.toLowerCase().includes(needle)
          ),
        }))
        .filter((g) => g.options.length > 0);
    }
    const list = (options ?? []).filter(
      (o) =>
        !needle ||
        o.label.toLowerCase().includes(needle) ||
        o.value.toLowerCase().includes(needle)
    );
    return list.length ? [{ label: '', options: list }] : [];
  }, [groups, options, q]);

  function pick(v: string) {
    onChange(v);
    setOpen(false);
    setQ('');
  }

  const showSearch = searchable && flatOptions.length > 8;

  return (
    <div ref={wrapRef} className="relative">
      {name && <input type="hidden" name={name} value={value} required={required} />}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-10 w-full items-center gap-2 rounded-[var(--radius-md)] border border-[var(--neutral-300)] bg-white px-3.5 text-left text-sm shadow-[var(--shadow-xs)] outline-none transition-all hover:border-[var(--neutral-400)] focus-visible:border-[var(--primary-600)] focus-visible:ring-[3px] focus-visible:ring-[var(--primary-100)] disabled:cursor-not-allowed disabled:border-[var(--neutral-200)] disabled:bg-[var(--neutral-50)] disabled:text-[var(--neutral-500)]"
      >
        <span className={`min-w-0 flex-1 truncate ${selected ? 'text-[var(--neutral-900)]' : 'text-[var(--neutral-400)]'}`}>
          {selected?.label ?? placeholder}
        </span>
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
          {showSearch && (
            <div className="border-b border-[var(--neutral-100)] p-2">
              <div className="relative">
                <Search size={12} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--neutral-400)]" />
                <input
                  type="search"
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cari…"
                  className="h-8 w-full rounded-[var(--radius-sm)] border border-[var(--neutral-200)] bg-[var(--neutral-50)] pl-7 pr-2.5 text-[12px] text-[var(--neutral-900)] placeholder:text-[var(--neutral-400)] outline-none focus:border-[var(--primary-600)] focus:bg-white focus:ring-2 focus:ring-[var(--primary-100)]"
                />
              </div>
            </div>
          )}

          <ul className="max-h-[280px] overflow-y-auto py-1">
            {filteredGroups.length === 0 ? (
              <li className="px-3 py-3 text-center text-[12px] text-[var(--neutral-500)]">Tidak ada pilihan.</li>
            ) : (
              filteredGroups.map((group, gi) => (
                <li key={group.label || `g-${gi}`}>
                  {group.label && (
                    <p className="sticky top-0 z-[1] border-b border-[var(--neutral-100)] bg-[var(--neutral-50)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--primary-800)]">
                      {group.label}
                    </p>
                  )}
                  <ul>
                    {group.options.map((opt) => {
                      const isSelected = opt.value === value;
                      return (
                        <li key={opt.value}>
                          <button
                            type="button"
                            onClick={() => pick(opt.value)}
                            className={
                              isSelected
                                ? 'flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] bg-[var(--primary-50)] text-[var(--primary-900)] ring-1 ring-inset ring-[var(--primary-100)]'
                                : 'flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[var(--neutral-800)] transition-colors hover:bg-[var(--neutral-50)]'
                            }
                          >
                            <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                            {isSelected && <Check size={14} className="shrink-0 text-[var(--primary-700)]" />}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))
            )}
          </ul>
        </div>
      </FloatingPanel>
    </div>
  );
}
