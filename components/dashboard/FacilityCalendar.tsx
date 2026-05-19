'use client';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { fmtDateTime } from '@/lib/request-code';
import {
  MANAGING_UNIT_LABEL,
  type Facility,
  type FacilityBlock,
  type FacilityRequest,
  type ManagingUnit,
  type RequestStatus,
} from '@/types';
import { Select } from '@/components/ui/Field';
import { StatusBadge } from '@/components/ui/StatusBadge';

const UNIT_ORDER: ManagingUnit[] = ['BIRO_I', 'BIRO_IV', 'PPLK', 'KRT', 'LPAIP'];

function toLocalDate(d: Date | string): string {
  const x = new Date(d);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

type BookingRow = FacilityRequest & { facilityName: string };
type BlockRow = FacilityBlock & { facilityName: string | null };
type Item =
  | { type: 'booking'; row: BookingRow; start: string; end: string; facilityId: number | null }
  | { type: 'block'; row: BlockRow; start: string; end: string; facilityId: number | null };

export function FacilityCalendar({
  facilities,
  rows,
  blocks = [],
}: {
  facilities: Facility[];
  rows: BookingRow[];
  blocks?: BlockRow[];
}) {
  const [facId, setFacId] = useState<string>('');
  const [date, setDate] = useState<string>('');

  const items = useMemo<Item[]>(() => {
    const a: Item[] = rows.map((r) => ({
      type: 'booking',
      row: r,
      start: String(r.startDateTime),
      end: String(r.endDateTime),
      facilityId: r.facilityId,
    }));
    const b: Item[] = blocks.map((r) => ({
      type: 'block',
      row: r,
      start: String(r.startDateTime),
      end: String(r.endDateTime),
      facilityId: r.facilityId,
    }));
    return [...a, ...b].sort((x, y) => new Date(x.start).getTime() - new Date(y.start).getTime());
  }, [rows, blocks]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (facId) {
        const selected = Number(facId);
        if (it.type === 'booking' && it.facilityId !== selected) return false;
        if (it.type === 'block' && it.facilityId !== null && it.facilityId !== selected) return false;
      }
      if (date) {
        const dStart = toLocalDate(it.start);
        const dEnd = toLocalDate(it.end);
        if (date < dStart || date > dEnd) return false;
      }
      return true;
    });
  }, [items, facId, date]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Filter Fasilitas</label>
            <Select value={facId} onChange={(e) => setFacId(e.target.value)}>
              <option value="">Semua fasilitas</option>
              {UNIT_ORDER.map((unit) => {
                const list = facilities.filter((f) => f.managingUnit === unit);
                if (list.length === 0) return null;
                return (
                  <optgroup key={unit} label={MANAGING_UNIT_LABEL[unit]}>
                    {list.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.category})
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Filter Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" /> Booking aktif/menunggu
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> Diblokir Admin
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <path d="M8 2v3M16 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-700">Tidak ada jadwal</p>
            <p className="mt-1 text-xs text-slate-500">Belum ada booking atau blokir aktif untuk filter ini.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--neutral-100)]">
            {filtered.map((it, idx) =>
              it.type === 'booking' ? (
                <motion.li
                  key={`b-${it.row.id}`}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.35, ease: 'easeOut', delay: Math.min(idx, 8) * 0.025 }}
                  className="flex items-start justify-between gap-4 p-5 transition-colors hover:bg-[var(--neutral-50)]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-50)] text-[var(--primary-700)] ring-1 ring-[var(--primary-100)]">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21V11M15 21V11" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--neutral-900)]">{it.row.facilityName}</p>
                      <p className="text-xs text-[var(--neutral-500)]">
                        {it.row.activityName} — {it.row.organizationName}
                      </p>
                      <p className="mt-1 text-xs font-medium text-[var(--neutral-600)]">
                        {fmtDateTime(it.row.startDateTime)} — {fmtDateTime(it.row.endDateTime)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={it.row.status as RequestStatus} />
                </motion.li>
              ) : (
                <motion.li
                  key={`x-${it.row.id}`}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.35, ease: 'easeOut', delay: Math.min(idx, 8) * 0.025 }}
                  className="flex items-start justify-between gap-4 p-5 transition-colors hover:bg-rose-50/40"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--neutral-900)]">
                        {it.row.facilityName ?? 'Semua Fasilitas'}
                      </p>
                      <p className="text-xs text-rose-700">Diblokir Admin: {it.row.reason}</p>
                      <p className="mt-1 text-xs font-medium text-[var(--neutral-600)]">
                        {fmtDateTime(it.row.startDateTime)} — {fmtDateTime(it.row.endDateTime)}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    Diblokir
                  </span>
                </motion.li>
              )
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
