'use client';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { RequestStatus } from '@/types';

export type DayBooking = {
  id: number;
  requestCode: string;
  activityName: string;
  organizationName: string;
  start: string;
  end: string;
  status: RequestStatus;
};

const ID_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const ID_DAYS_SHORT = ['Mn', 'Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb'];
const ID_DAYS_FULL = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const HOLIDAYS_2026: Record<string, string> = {
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

function ymd(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export function FacilityAvailabilityCalendar({ bookings }: { bookings: DayBooking[] }) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [cursor, setCursor] = useState<{ year: number; month: number }>({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  const byDay = useMemo(() => {
    const map = new Map<string, DayBooking[]>();
    for (const b of bookings) {
      const s = new Date(b.start);
      const e = new Date(b.end);
      const cur = new Date(s.getFullYear(), s.getMonth(), s.getDate());
      const last = new Date(e.getFullYear(), e.getMonth(), e.getDate());
      while (cur <= last) {
        const k = ymd(cur);
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(b);
        cur.setDate(cur.getDate() + 1);
      }
    }
    return map;
  }, [bookings]);

  const { year, month } = cursor;
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startCol = (firstDay.getDay() + 6) % 7;

  type Cell = {
    day: number;
    key: string;
    date: Date;
    bookingsCount: number;
    isToday: boolean;
    isHoliday: boolean;
    isWeekend: boolean;
  } | null;
  const cells: Cell[] = [];
  for (let i = 0; i < startCol; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const key = ymd(date);
    cells.push({
      day: d,
      key,
      date,
      bookingsCount: byDay.get(key)?.length ?? 0,
      isToday: ymd(date) === ymd(today),
      isHoliday: !!HOLIDAYS_2026[key],
      isWeekend: date.getDay() === 0,
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  function go(delta: number) {
    setCursor((c) => {
      const m = c.month + delta;
      const ny = c.year + Math.floor(m / 12);
      const nm = ((m % 12) + 12) % 12;
      return { year: ny, month: nm };
    });
  }

  return (
    <TooltipPrimitive.Provider delayDuration={120} skipDelayDuration={80}>
      <div>
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--neutral-500)]">
              Cek ketersediaan
            </p>
            <p className="mt-0.5 text-[14px] font-semibold tracking-tight text-[var(--neutral-900)]">
              {ID_MONTHS[month]} {year}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => go(-1)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--neutral-200)] text-[var(--neutral-600)] transition-colors hover:bg-[var(--neutral-50)] hover:text-[var(--neutral-900)]"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--neutral-200)] text-[var(--neutral-600)] transition-colors hover:bg-[var(--neutral-50)] hover:text-[var(--neutral-900)]"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {ID_DAYS_SHORT.map((d, i) => (
            <span
              key={d}
              className={`text-[10px] font-semibold uppercase tracking-wider ${i === 6 ? 'text-rose-500' : 'text-[var(--neutral-400)]'}`}
            >
              {d}
            </span>
          ))}
          {cells.map((c, i) => {
            if (!c) return <span key={i} />;
            const labelColor = c.isHoliday || c.isWeekend ? 'text-rose-600' : 'text-[var(--neutral-700)]';
            const busy = c.bookingsCount > 0;
            let bg = 'bg-transparent hover:bg-[var(--primary-50)]';
            if (busy) bg = 'bg-rose-50 ring-1 ring-rose-100 hover:bg-rose-100';
            if (c.isToday) bg = '!bg-[var(--primary-700)] !text-white !font-semibold ring-2 ring-[var(--primary-600)]';

            const dayBookings = byDay.get(c.key) ?? [];
            const holidayName = HOLIDAYS_2026[c.key];

            const cellEl = (
              <button
                type="button"
                className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[11.5px] tabular-nums transition-colors ${labelColor} ${bg}`}
              >
                {c.day}
                {busy && !c.isToday && (
                  <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-rose-500" />
                )}
                {c.isHoliday && !c.isToday && !busy && (
                  <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-rose-400" />
                )}
              </button>
            );

            // Only show tooltip if there's content worth showing
            const hasContent = busy || c.isHoliday || c.isWeekend;
            if (!hasContent) {
              return <span key={i}>{cellEl}</span>;
            }

            return (
              <TooltipPrimitive.Root key={i}>
                <TooltipPrimitive.Trigger asChild>{cellEl}</TooltipPrimitive.Trigger>
                <TooltipPrimitive.Portal>
                  <TooltipPrimitive.Content
                    side="top"
                    sideOffset={6}
                    align="center"
                    collisionPadding={12}
                    className="z-50 w-[260px] overflow-hidden rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-white p-3 text-left shadow-[var(--shadow-lg,0_10px_25px_-5px_rgba(0,0,0,0.18))] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95"
                  >
                    <div>
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--neutral-500)]">
                        {ID_DAYS_FULL[c.date.getDay()]}
                      </p>
                      <p className="mt-0.5 text-[13px] font-bold text-[var(--neutral-900)]">
                        {c.day} {ID_MONTHS[month]} {year}
                      </p>
                      {holidayName && (
                        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10.5px] font-semibold text-rose-700 ring-1 ring-rose-100">
                          <AlertTriangle size={10} />
                          {holidayName}
                        </span>
                      )}
                    </div>
                    {dayBookings.length === 0 ? (
                      <div className="mt-2.5 flex items-start gap-2 rounded-[var(--radius-sm)] bg-[var(--neutral-50)] px-2.5 py-2 text-[11px] text-[var(--neutral-600)]">
                        <CalendarIcon size={11} className="mt-0.5 shrink-0 text-[var(--neutral-400)]" />
                        {holidayName
                          ? 'Hari libur — fasilitas mungkin tidak tersedia.'
                          : 'Tidak ada agenda. Slot kemungkinan tersedia.'}
                      </div>
                    ) : (
                      <ul className="mt-2.5 space-y-1.5">
                        {dayBookings.slice(0, 4).map((b) => (
                          <li
                            key={b.id}
                            className="rounded-[var(--radius-sm)] border border-[var(--neutral-100)] bg-[var(--neutral-50)] p-2"
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <p className="min-w-0 flex-1 text-[11.5px] font-semibold leading-tight text-[var(--neutral-900)]">
                                {b.activityName}
                              </p>
                              <StatusBadge status={b.status} size="sm" />
                            </div>
                            <p className="mt-0.5 truncate text-[10.5px] text-[var(--neutral-500)]">{b.organizationName}</p>
                            <p className="mt-0.5 text-[10.5px] tabular-nums text-[var(--neutral-700)]">
                              {fmtTime(b.start)} – {fmtTime(b.end)} WIB
                            </p>
                          </li>
                        ))}
                        {dayBookings.length > 4 && (
                          <p className="px-1 text-[10.5px] text-[var(--neutral-500)]">
                            +{dayBookings.length - 4} agenda lainnya
                          </p>
                        )}
                      </ul>
                    )}
                    <TooltipPrimitive.Arrow className="fill-white" width={11} height={6} />
                  </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
              </TooltipPrimitive.Root>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-between text-[10px] text-[var(--neutral-600)]">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-300" />
            Terisi
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Hari libur
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[var(--primary-700)]" />
            Hari ini
          </span>
        </div>
      </div>
    </TooltipPrimitive.Provider>
  );
}
