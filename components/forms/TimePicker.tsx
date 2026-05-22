'use client';

import { useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Clock } from 'lucide-react';
import { FloatingPanel } from '@/components/ui/FloatingPanel';

const HOURS = Array.from({ length: 24 }, (_, i) => pad(i));
const MINUTES = Array.from({ length: 12 }, (_, i) => pad(i * 5));

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return -1;
  return h * 60 + m;
}

export function TimePicker({
  value,
  onChange,
  min,
  placeholder = 'Pilih jam',
  name,
  required,
  disabled,
  inline = false,
}: {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  placeholder?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  /** Render dropdown inline (di dalam Dialog/modal). */
  inline?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const minMinutes = min ? toMinutes(min) : -1;

  const [hour, minute] = useMemo(() => {
    if (!value) return ['', ''];
    const [h, m] = value.split(':');
    return [h ?? '', (m ?? '').slice(0, 2)];
  }, [value]);

  function isDisabled(h: string, m: string) {
    if (minMinutes < 0) return false;
    return toMinutes(`${h}:${m}`) < minMinutes;
  }

  function pick(h: string, m: string) {
    if (isDisabled(h, m)) return;
    onChange(`${h}:${m}`);
    setOpen(false);
  }

  const display = value ? value : placeholder;

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
        <Clock size={14} className="shrink-0 text-[var(--neutral-400)]" />
        <span className={`flex-1 truncate ${value ? 'text-[var(--neutral-900)]' : 'text-[var(--neutral-400)]'}`}>
          {display}
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
        minWidth={220}
        inline={inline}
        className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-lg,0_10px_25px_-5px_rgba(0,0,0,0.15))]"
      >
        <div>
          <div className="border-b border-[var(--neutral-100)] bg-gradient-to-br from-[var(--primary-50)] to-white px-3 py-2">
            <p className="text-[11px] font-semibold text-[var(--neutral-600)]">Pilih jam (WIB)</p>
            {value && (
              <p className="text-[13px] font-bold text-[var(--primary-800)]">{value}</p>
            )}
          </div>
          <div className="grid grid-cols-2 divide-x divide-[var(--neutral-100)]">
            <div className="max-h-[200px] overflow-y-auto py-1">
              <p className="sticky top-0 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-400)]">
                Jam
              </p>
              {HOURS.map((h) => {
                const active = hour === h;
                const allDisabled = MINUTES.every((m) => isDisabled(h, m));
                return (
                  <button
                    key={h}
                    type="button"
                    disabled={allDisabled}
                    onClick={() => {
                      const m = minute && !isDisabled(h, minute) ? minute : MINUTES.find((x) => !isDisabled(h, x)) ?? '00';
                      pick(h, m);
                    }}
                    className={
                      active
                        ? 'flex w-full items-center justify-between px-3 py-1.5 text-[13px] font-semibold bg-[var(--primary-50)] text-[var(--primary-900)]'
                        : 'flex w-full items-center justify-between px-3 py-1.5 text-[13px] text-[var(--neutral-700)] transition-colors hover:bg-[var(--neutral-50)] disabled:cursor-not-allowed disabled:text-[var(--neutral-300)]'
                    }
                  >
                    {h}
                    {active && <Check size={12} className="text-[var(--primary-700)]" />}
                  </button>
                );
              })}
            </div>
            <div className="max-h-[200px] overflow-y-auto py-1">
              <p className="sticky top-0 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--neutral-400)]">
                Menit
              </p>
              {MINUTES.map((m) => {
                const active = minute === m;
                const h = hour || '00';
                const dis = isDisabled(h, m);
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={dis || !hour}
                    onClick={() => hour && pick(hour, m)}
                    className={
                      active
                        ? 'flex w-full items-center justify-between px-3 py-1.5 text-[13px] font-semibold bg-[var(--primary-50)] text-[var(--primary-900)]'
                        : 'flex w-full items-center justify-between px-3 py-1.5 text-[13px] text-[var(--neutral-700)] transition-colors hover:bg-[var(--neutral-50)] disabled:cursor-not-allowed disabled:text-[var(--neutral-300)]'
                    }
                  >
                    {m}
                    {active && <Check size={12} className="text-[var(--primary-700)]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </FloatingPanel>
    </div>
  );
}
