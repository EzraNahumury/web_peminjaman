import Link from 'next/link';
import { fmtDateTime } from '@/lib/request-code';
import type { FacilityRequest, RequestStatus } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';

type Row = FacilityRequest & { facilityName?: string; userName?: string };

export function RequestTable({
  rows,
  baseHref,
  showUser = false,
}: {
  rows: Row[];
  baseHref: string;
  showUser?: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-700">Belum ada pengajuan</p>
        <p className="mt-1 text-xs text-slate-500">Data akan muncul di sini setelah ada pengajuan.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            <th className="px-5 py-3.5">Kode</th>
            <th className="px-5 py-3.5">Kegiatan</th>
            <th className="px-5 py-3.5">Fasilitas</th>
            {showUser && <th className="px-5 py-3.5">Pengaju</th>}
            <th className="px-5 py-3.5">Jadwal</th>
            <th className="px-5 py-3.5">Status</th>
            <th className="px-5 py-3.5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id} className="transition hover:bg-slate-50">
              <td className="px-5 py-4 font-mono text-xs text-slate-600">{r.requestCode}</td>
              <td className="px-5 py-4">
                <p className="font-medium text-slate-900">{r.activityName}</p>
                <p className="text-xs text-slate-500">{r.organizationName}</p>
              </td>
              <td className="px-5 py-4 text-slate-700">{r.facilityName}</td>
              {showUser && <td className="px-5 py-4 text-slate-700">{r.userName}</td>}
              <td className="px-5 py-4 text-xs text-slate-600">
                <p>{fmtDateTime(r.startDateTime)}</p>
                <p className="text-slate-400">s/d {fmtDateTime(r.endDateTime)}</p>
              </td>
              <td className="px-5 py-4">
                <StatusBadge status={r.status as RequestStatus} />
              </td>
              <td className="px-5 py-4">
                <Link
                  href={`${baseHref}/${r.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Detail
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
