import Link from 'next/link';
import { fmtDateTime } from '@/lib/request-code';
import type { FacilityRequest, RequestStatus } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/Card';

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
      <EmptyState
        title="Belum ada pengajuan"
        description="Data pengajuan peminjaman akan muncul di sini."
      />
    );
  }
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--neutral-100)] text-sm">
          <thead className="bg-[var(--neutral-50)]">
            <tr className="text-left text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--neutral-500)]">
              <th className="px-5 py-3.5">Kode</th>
              <th className="px-5 py-3.5">Kegiatan</th>
              <th className="px-5 py-3.5">Fasilitas</th>
              {showUser && <th className="px-5 py-3.5">Pengaju</th>}
              <th className="px-5 py-3.5">Jadwal</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--neutral-100)]">
            {rows.map((r) => (
              <tr key={r.id} className="group transition-colors hover:bg-[var(--primary-50)]/40">
                <td className="px-5 py-3.5 font-[var(--font-mono)] text-[11px] text-[var(--neutral-600)]">
                  {r.requestCode}
                </td>
                <td className="px-5 py-3.5">
                  <p className="font-medium text-[var(--neutral-900)]">{r.activityName}</p>
                  <p className="text-xs text-[var(--neutral-500)]">{r.organizationName}</p>
                </td>
                <td className="px-5 py-3.5 text-[var(--neutral-700)]">{r.facilityName}</td>
                {showUser && <td className="px-5 py-3.5 text-[var(--neutral-700)]">{r.userName}</td>}
                <td className="px-5 py-3.5 text-xs text-[var(--neutral-600)]">
                  <p>{fmtDateTime(r.startDateTime)}</p>
                  <p className="text-[var(--neutral-400)]">s/d {fmtDateTime(r.endDateTime)}</p>
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={r.status as RequestStatus} />
                </td>
                <td className="px-5 py-3.5">
                  <Link
                    href={`${baseHref}/${r.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium text-[var(--primary-700)] transition-all group-hover:text-[var(--primary-800)]"
                  >
                    Detail
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-transform group-hover:translate-x-0.5"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
