'use client';
import { useMemo, useState } from 'react';
import { fmtDateTime } from '@/lib/request-code';
import { MANAGING_UNIT_LABEL, type Facility, type FacilityRequest, type ManagingUnit, type RequestStatus } from '@/types';
import { Select } from '@/components/ui/Field';
import { StatusBadge } from '@/components/ui/StatusBadge';

const UNIT_ORDER: ManagingUnit[] = ['BIRO_I', 'BIRO_IV', 'PPLK', 'KRT', 'LPAIP'];

type Row = FacilityRequest & { facilityName: string };

export function FacilityCalendar({ facilities, rows }: { facilities: Facility[]; rows: Row[] }) {
  const [facId, setFacId] = useState<string>('');
  const [date, setDate] = useState<string>('');

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (facId && String(r.facilityId) !== facId) return false;
      if (date) {
        const dStart = new Date(r.startDateTime).toISOString().slice(0, 10);
        const dEnd = new Date(r.endDateTime).toISOString().slice(0, 10);
        if (date < dStart || date > dEnd) return false;
      }
      return true;
    });
  }, [facId, date, rows]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Filter Fasilitas</label>
            <Select value={facId} onChange={(e) => setFacId(e.target.value)}>
              <option value="">Semua fasilitas</option>
              {UNIT_ORDER.map((unit) => {
                const items = facilities.filter((f) => f.managingUnit === unit);
                if (items.length === 0) return null;
                return (
                  <optgroup key={unit} label={MANAGING_UNIT_LABEL[unit]}>
                    {items.map((f) => (
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
            <p className="mt-1 text-xs text-slate-500">Belum ada booking aktif untuk filter yang dipilih.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-4 p-5 transition hover:bg-slate-50">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21V11M15 21V11" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{r.facilityName}</p>
                    <p className="text-xs text-slate-500">
                      {r.activityName} — {r.organizationName}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-600">
                      {fmtDateTime(r.startDateTime)} — {fmtDateTime(r.endDateTime)}
                    </p>
                  </div>
                </div>
                <StatusBadge status={r.status as RequestStatus} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
