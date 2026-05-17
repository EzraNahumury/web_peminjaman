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
      <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
        <p className="text-sm text-gray-500">Belum ada pengajuan.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
          <tr>
            <th className="px-4 py-3">Kode</th>
            <th className="px-4 py-3">Kegiatan</th>
            <th className="px-4 py-3">Fasilitas</th>
            {showUser && <th className="px-4 py-3">Pengaju</th>}
            <th className="px-4 py-3">Jadwal</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs">{r.requestCode}</td>
              <td className="px-4 py-3">{r.activityName}</td>
              <td className="px-4 py-3">{r.facilityName}</td>
              {showUser && <td className="px-4 py-3">{r.userName}</td>}
              <td className="px-4 py-3 text-xs text-gray-600">
                {fmtDateTime(r.startDateTime)}
                <br />s/d {fmtDateTime(r.endDateTime)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={r.status as RequestStatus} />
              </td>
              <td className="px-4 py-3">
                <Link href={`${baseHref}/${r.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                  Detail →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
