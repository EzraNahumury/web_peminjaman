'use client';
import { useMemo, useState } from 'react';
import { fmtDateTime } from '@/lib/request-code';
import type { Facility, FacilityRequest, RequestStatus } from '@/types';
import { Select } from '@/components/ui/Field';
import { StatusBadge } from '@/components/ui/StatusBadge';

type Row = FacilityRequest & { facilityName: string };

export function FacilityCalendar({
  facilities,
  rows,
}: {
  facilities: Facility[];
  rows: Row[];
}) {
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Filter Fasilitas</label>
          <Select value={facId} onChange={(e) => setFacId(e.target.value)}>
            <option value="">Semua fasilitas</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.category})
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Filter Tanggal</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500">Tidak ada jadwal pada filter ini.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-4 p-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{r.facilityName}</p>
                  <p className="text-xs text-gray-500">{r.activityName} — {r.organizationName}</p>
                  <p className="mt-1 text-xs text-gray-600">
                    {fmtDateTime(r.startDateTime)} — {fmtDateTime(r.endDateTime)}
                  </p>
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
