'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { FloatingPanel } from '@/components/ui/FloatingPanel';

const ID_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const ID_MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
const ID_DAYS_SHORT = ['Mn', 'Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb'];

const HOLIDAYS_ID: Record<string, string> = {
  '2026-01-01': 'Tahun Baru Masehi',
  '2026-02-17': 'Tahun Baru Imlek',
  '2026-03-19': 'Hari Suci Nyepi',
  '2026-04-03': 'Wafat Isa Al Masih',
  '2026-04-10': 'Hari Raya Idul Fitri',
  '2026-04-11': 'Hari Raya Idul Fitri',
  '2026-05-01': 'Hari Buruh Internasional',
  '2026-05-14': 'Kenaikan Isa Al Masih',
  '2026-05-31': 'Hari Raya Waisak',
  '2026-06-01': 'Hari Lahir Pancasila',
  '2026-06-17': 'Hari Raya Idul Adha',
  '2026-08-17': 'Hari Kemerdekaan RI',
  '2026-12-25': 'Hari Raya Natal',
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function parseISO(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function DatePicker({
  value,
  onChange,
  min,
  placeholder = 'Pilih tanggal',
  variant = 'default',
  popoverAlign = 'start',
  dayMarkers,
  inline = false,
}: {
  value: string; // yyyy-mm-dd
  onChange: (v: string) => void;
  min?: string;
  placeholder?: string;
  variant?: 'default' | 'ghost';
  /** Penjajaran popup kalender (end = buka ke kiri, untuk filter di pojok kanan) */
  popoverAlign?: 'start' | 'end';
  /** Tanggal yang sudah terisi: yyyy-mm-dd → 'booking' (ada peminjaman) | 'block' (diblokir admin) */
  dayMarkers?: Record<string, 'booking' | 'block'>;
  /** Render popup inline (di dalam Dialog/modal). */
  inline?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);
  const selectedDate = useMemo(() => parseISO(value), [value]);
  const minDate = useMemo(() => (min ? parseISO(min) : null), [min]);

  const [cursor, setCursor] = useState<{ year: number; month: number }>(() => {
    const base = selectedDate ?? today;
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  // Reset cursor when value changes externally
  useEffect(() => {
    if (selectedDate) {
      setCursor({ year: selectedDate.getFullYear(), month: selectedDate.getMonth() });
    }
  }, [selectedDate]);

  const { year, month } = cursor;
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startCol = (firstDay.getDay() + 6) % 7;
  const prevMonthDays = new Date(year, month, 0).getDate();

  type Cell = { date: Date; inMonth: boolean; disabled: boolean };
  const cells: Cell[] = [];
  // Trailing days from previous month (subtle)
  for (let i = startCol - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthDays - i);
    cells.push({ date: d, inMonth: false, disabled: !!minDate && d < minDate });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    cells.push({ date, inMonth: true, disabled: !!minDate && date < minDate });
  }
  // Trailing next month days to fill grid
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
    cells.push({ date: next, inMonth: next.getMonth() === month, disabled: !!minDate && next < minDate });
  }
  // Ensure 6 rows for stable height
  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const next = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
    cells.push({ date: next, inMonth: false, disabled: !!minDate && next < minDate });
  }

  function go(delta: number) {
    setCursor((c) => {
      const m = c.month + delta;
      const ny = c.year + Math.floor(m / 12);
      const nm = ((m % 12) + 12) % 12;
      return { year: ny, month: nm };
    });
  }

  function goToday() {
    setCursor({ year: today.getFullYear(), month: today.getMonth() });
    if (!minDate || today >= minDate) {
      onChange(toISODate(today));
      setOpen(false);
    }
  }

  function pick(d: Date) {
    onChange(toISODate(d));
    setOpen(false);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
  }

  // Display value
  const display = selectedDate
    ? `${pad(selectedDate.getDate())} ${ID_MONTHS_SHORT[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
    : placeholder;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={
          variant === 'ghost'
            ? `flex h-11 w-full items-center gap-2.5 rounded-[var(--radius-md)] px-3.5 text-left text-[13px] outline-none transition-colors hover:bg-[var(--neutral-50)] focus-visible:bg-[var(--neutral-50)] ${
                open ? 'bg-[var(--neutral-50)]' : ''
              } ${selectedDate ? 'text-[var(--neutral-900)]' : 'text-[var(--neutral-500)]'}`
            : `flex h-10 w-full items-center gap-2 rounded-[var(--radius-md)] border border-[var(--neutral-300)] bg-white px-3.5 text-left text-sm shadow-[var(--shadow-xs)] outline-none transition-all hover:border-[var(--neutral-400)] focus-visible:border-[var(--primary-600)] focus-visible:ring-[3px] focus-visible:ring-[var(--primary-100)] ${
                open ? 'border-[var(--primary-600)] ring-[3px] ring-[var(--primary-100)]' : ''
              }`
        }
      >
        {variant === 'ghost' ? (
          <>
            <CalendarIcon
              size={15}
              className={selectedDate ? 'shrink-0 text-[var(--primary-700)]' : 'shrink-0 text-[var(--neutral-500)]'}
            />
            <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--neutral-500)]">
              Tanggal
            </span>
            <span className="flex-1 truncate font-semibold">{selectedDate ? display : '—'}</span>
            {selectedDate ? (
              <span
                role="button"
                tabIndex={-1}
                onClick={clear}
                className="-mr-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[var(--neutral-400)] hover:bg-[var(--neutral-200)] hover:text-[var(--neutral-700)]"
                aria-label="Hapus tanggal"
              >
                <X size={11} />
              </span>
            ) : (
              <ChevronRight size={13} className="rotate-90 opacity-50" />
            )}
          </>
        ) : (
          <>
            <CalendarIcon size={14} className="shrink-0 text-[var(--neutral-400)]" />
            <span className={`flex-1 truncate ${selectedDate ? 'text-[var(--neutral-900)]' : 'text-[var(--neutral-400)]'}`}>
              {display}
            </span>
            {selectedDate && (
              <span
                role="button"
                tabIndex={-1}
                onClick={clear}
                className="-mr-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--neutral-400)] hover:bg-[var(--neutral-100)] hover:text-[var(--neutral-700)]"
                aria-label="Hapus tanggal"
              >
                <X size={11} />
              </span>
            )}
          </>
        )}
      </button>

      <FloatingPanel
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={wrapRef}
        fixedWidth={320}
        align={popoverAlign}
        inline={inline}
        className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-lg,0_10px_25px_-5px_rgba(0,0,0,0.18))]"
      >
        <div className="w-full">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-[var(--neutral-100)] bg-gradient-to-br from-[var(--primary-50)] to-white px-3 py-2.5">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => go(-12)}
                title="Tahun sebelumnya"
                className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--neutral-500)] transition-colors hover:bg-white hover:text-[var(--neutral-900)]"
              >
                <ChevronLeft size={12} />
                <ChevronLeft size={12} className="-ml-1.5" />
              </button>
              <button
                type="button"
                onClick={() => go(-1)}
                title="Bulan sebelumnya"
                className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--neutral-600)] transition-colors hover:bg-white hover:text-[var(--neutral-900)]"
              >
                <ChevronLeft size={14} />
              </button>
            </div>
            <p className="flex-1 text-center text-[12.5px] font-bold text-[var(--neutral-900)]">
              {ID_MONTHS[month]} {year}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => go(1)}
                title="Bulan berikutnya"
                className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--neutral-600)] transition-colors hover:bg-white hover:text-[var(--neutral-900)]"
              >
                <ChevronRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => go(12)}
                title="Tahun berikutnya"
                className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--neutral-500)] transition-colors hover:bg-white hover:text-[var(--neutral-900)]"
              >
                <ChevronRight size={12} />
                <ChevronRight size={12} className="-ml-1.5" />
              </button>
            </div>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 gap-0.5 px-3 pt-2">
            {ID_DAYS_SHORT.map((d, i) => (
              <span
                key={d}
                className={`flex h-6 items-center justify-center text-[10px] font-semibold uppercase tracking-wider ${i === 6 ? 'text-rose-400' : 'text-[var(--neutral-400)]'}`}
              >
                {d}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-0.5 px-3 pb-2">
            {cells.map((c, i) => {
              const iso = toISODate(c.date);
              const isSelected = selectedDate && sameDay(c.date, selectedDate);
              const isToday = sameDay(c.date, today);
              const isSunday = c.date.getDay() === 0;
              const marker = !c.disabled ? dayMarkers?.[iso] : undefined;
              const holidayName = HOLIDAYS_ID[iso];
              const isHoliday = !!holidayName;
              let cls =
                'relative flex h-9 w-full items-center justify-center rounded-[var(--radius-sm)] text-[12px] tabular-nums transition-all';
              if (c.disabled) cls += ' cursor-not-allowed text-[var(--neutral-300)]';
              else if (isSelected)
                cls += ' bg-[var(--primary-700)] text-white font-semibold shadow-[var(--shadow-sm)] ring-2 ring-[var(--primary-300)] hover:bg-[var(--primary-800)]';
              else if (isToday)
                cls += ' bg-[var(--primary-700)] text-white font-semibold shadow-[var(--shadow-sm)] hover:bg-[var(--primary-800)]';
              else if (marker)
                cls += ` bg-rose-50 ring-1 ring-rose-100 hover:bg-rose-100 ${isHoliday || isSunday ? 'text-rose-600' : 'text-rose-900'}`;
              else if (!c.inMonth) cls += ' text-[var(--neutral-300)] hover:bg-[var(--neutral-50)]';
              else if (isHoliday || isSunday) cls += ' text-rose-500 hover:bg-rose-50 hover:text-rose-700';
              else cls += ' text-[var(--neutral-700)] hover:bg-[var(--primary-50)] hover:text-[var(--primary-900)]';

              const showBookingDot = !!marker && !isSelected && !isToday;
              const showHolidayDot = isHoliday && !marker && !isSelected && !isToday;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={c.disabled}
                  onClick={() => !c.disabled && pick(c.date)}
                  className={cls}
                  title={
                    marker === 'block'
                      ? 'Diblokir admin pada tanggal ini'
                      : marker === 'booking'
                        ? 'Sudah ada peminjaman pada tanggal ini'
                        : holidayName
                  }
                >
                  {c.date.getDate()}
                  {showBookingDot && (
                    <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-rose-500" />
                  )}
                  {showHolidayDot && (
                    <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-rose-400" />
                  )}
                </button>
              );
            })}
          </div>

          {dayMarkers && (
            <div className="flex items-center justify-between border-t border-[var(--neutral-100)] px-4 py-2 text-[10px] text-[var(--neutral-600)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-300" />
                Terisi
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Hari libur
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[var(--primary-700)]" />
                Hari ini
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 border-t border-[var(--neutral-100)] bg-[var(--neutral-50)] px-3 py-2 text-[11px]">
            <button
              type="button"
              onClick={goToday}
              className="font-semibold text-[var(--primary-700)] hover:text-[var(--primary-800)]"
            >
              Hari ini
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="font-medium text-[var(--neutral-500)] hover:text-[var(--neutral-700)]"
            >
              Tutup
            </button>
          </div>
        </div>
      </FloatingPanel>
    </div>
  );
}
