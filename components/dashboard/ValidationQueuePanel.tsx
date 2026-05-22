import Link from 'next/link';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { fmtDateTime } from '@/lib/request-code';
import type { RequestStatus } from '@/types';

export type ValidationQueueItem = {
  id: number;
  activityName: string;
  organizationName: string;
  userName: string;
  facilityName: string;
  startDateTime: Date | string;
  status: RequestStatus;
};

type Props = {
  title: string;
  subtitle: string;
  listHref: string;
  detailHrefPrefix: string;
  items: ValidationQueueItem[];
};

export function ValidationQueuePanel({ title, subtitle, listHref, detailHrefPrefix, items }: Props) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)]">
      <div className="flex items-center justify-between border-b border-[var(--neutral-100)] px-6 py-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--neutral-900)]">{title}</h2>
          <p className="mt-0.5 text-xs text-[var(--neutral-500)]">{subtitle}</p>
        </div>
        <Link href={listHref} className="text-xs font-medium text-[var(--primary-700)] hover:text-[var(--primary-800)]">
          Lihat semua →
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-[var(--neutral-500)]">Tidak ada pengajuan menunggu.</div>
      ) : (
        <ul className="divide-y divide-[var(--neutral-100)]">
          {items.map((r) => (
            <li
              key={r.id}
              className="group flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-[var(--neutral-50)]"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-[var(--neutral-900)]">{r.activityName}</p>
                <p className="mt-0.5 text-xs text-[var(--neutral-500)]">
                  {r.organizationName} · {r.userName} · {r.facilityName} · {fmtDateTime(r.startDateTime)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge status={r.status} size="sm" />
                <Link
                  href={`${detailHrefPrefix}/${r.id}`}
                  className="text-xs font-medium text-[var(--primary-700)] hover:text-[var(--primary-800)]"
                >
                  Review →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
