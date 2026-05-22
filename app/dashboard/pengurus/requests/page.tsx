import { Fragment } from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Info, CheckCircle2, AlertTriangle, XCircle, ArrowRight, MapPin, Plus } from 'lucide-react';
import { formatWIBDate, formatWIBTime } from '@/utils/date';
import type { FacilityRequest, RequestStatus } from '@/types';
import { REQUEST_LIST_ORDER_SQL } from '@/utils/priority';

type Row = FacilityRequest & {
  facilityName: string;
  facilityLocation: string | null;
  latestNote: string | null;
  latestAction: string | null;
};

type Tab = 'semua' | 'menunggu' | 'disetujui' | 'revisi' | 'ditolak' | 'selesai';

const TABS: { key: Tab; label: string }[] = [
  { key: 'semua', label: 'Semua' },
  { key: 'menunggu', label: 'Menunggu' },
  { key: 'disetujui', label: 'Disetujui' },
  { key: 'revisi', label: 'Perlu Revisi' },
  { key: 'ditolak', label: 'Ditolak' },
  { key: 'selesai', label: 'Selesai' },
];

const PENDING_STATUSES: RequestStatus[] = [
  'SUBMITTED',
  'WAITING_BIRO_III',
  'WAITING_WR3_WD3',
  'WAITING_ADMIN_UNIT',
  'ON_HOLD',
];
const REJECTED_STATUSES: RequestStatus[] = ['REJECTED', 'REJECTED_BY_BIRO_III', 'REJECTED_BY_WR3_WD3'];

function isInTab(r: Row, tab: Tab): boolean {
  const now = new Date();
  switch (tab) {
    case 'semua':
      return true;
    case 'menunggu':
      return PENDING_STATUSES.includes(r.status);
    case 'disetujui':
      return r.status === 'APPROVED' && new Date(r.endDateTime) >= now;
    case 'revisi':
      return r.status === 'REVISION_REQUESTED';
    case 'ditolak':
      return REJECTED_STATUSES.includes(r.status);
    case 'selesai':
      return r.status === 'APPROVED' && new Date(r.endDateTime) < now;
  }
}

function inlineBanner(r: Row): React.ReactNode {
  if (r.status === 'APPROVED') {
    return (
      <Banner tone="success" icon={<CheckCircle2 size={14} />}>
        <strong className="font-semibold">Disetujui.</strong> Lihat detail untuk membuka surat persetujuan.
      </Banner>
    );
  }
  if (r.status === 'REVISION_REQUESTED' && r.latestNote) {
    const isAlt = r.latestAction === 'OFFER_ALTERNATIVE';
    return (
      <Banner tone="info" icon={<Info size={14} />}>
        <strong className="font-semibold">{isAlt ? 'Admin menawarkan alternatif:' : 'Admin meminta revisi:'}</strong>{' '}
        <span className="whitespace-pre-line">{r.latestNote}</span>
      </Banner>
    );
  }
  if (r.status === 'ON_HOLD') {
    return (
      <Banner tone="warning" icon={<AlertTriangle size={14} />}>
        <strong className="font-semibold">Ditahan Admin Unit.</strong>{' '}
        {r.latestNote || 'Sedang ditinjau lebih lanjut, slot tetap dipesan.'}
      </Banner>
    );
  }
  if (REJECTED_STATUSES.includes(r.status)) {
    return (
      <Banner tone="danger" icon={<XCircle size={14} />}>
        <strong className="font-semibold">Alasan penolakan:</strong>{' '}
        {r.latestNote || 'Tidak ada alasan dituliskan oleh validator.'}
      </Banner>
    );
  }
  return null;
}

export default async function MyRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireRole('PENGURUS');
  const sp = await searchParams;
  const tab = (TABS.find((t) => t.key === sp.tab)?.key ?? 'semua') as Tab;

  const rows = await query<Row>(
    `SELECT fr.*, f.name AS facilityName, f.location AS facilityLocation,
            latest.note AS latestNote, latest.action AS latestAction
     FROM facility_requests fr
     JOIN facilities f ON f.id = fr.facilityId
     LEFT JOIN (
       SELECT al.requestId, al.note, al.action
       FROM approval_logs al
       INNER JOIN (
         SELECT requestId, MAX(id) AS maxId FROM approval_logs
         WHERE action IN ('REQUEST_REVISION','OFFER_ALTERNATIVE','REJECT_BIRO_III','REJECT_WR3_WD3','REJECT_ADMIN','HOLD')
         GROUP BY requestId
       ) m ON m.requestId = al.requestId AND m.maxId = al.id
     ) latest ON latest.requestId = fr.id
     WHERE fr.userId = ?
     ORDER BY ${REQUEST_LIST_ORDER_SQL}`,
    [session.userId]
  );

  const counts: Record<Tab, number> = {
    semua: rows.length,
    menunggu: rows.filter((r) => isInTab(r, 'menunggu')).length,
    disetujui: rows.filter((r) => isInTab(r, 'disetujui')).length,
    revisi: rows.filter((r) => isInTab(r, 'revisi')).length,
    ditolak: rows.filter((r) => isInTab(r, 'ditolak')).length,
    selesai: rows.filter((r) => isInTab(r, 'selesai')).length,
  };

  const filtered = rows.filter((r) => isInTab(r, tab));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-[var(--neutral-900)]">Status Peminjaman</h1>
          <p className="mt-1 text-sm text-[var(--neutral-500)]">
            Pantau perkembangan setiap pengajuan dan tindak lanjut bila ada permintaan dari admin.
          </p>
        </div>
        <Link
          href="/dashboard/facilities"
          className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--primary-800)] px-4 text-[13px] font-semibold text-white shadow-[var(--shadow-sm)] hover:bg-[var(--primary-900)]"
        >
          <Plus size={15} strokeWidth={2.4} />
          Pinjam
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1 rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-1.5 shadow-[var(--shadow-xs)]">
        {TABS.map((t) => {
          const active = t.key === tab;
          const c = counts[t.key];
          return (
            <Link
              key={t.key}
              href={t.key === 'semua' ? '?' : `?tab=${t.key}`}
              className={
                active
                  ? 'inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--primary-800)] px-3.5 py-1.5 text-[12.5px] font-semibold text-white shadow-[var(--shadow-sm)]'
                  : 'inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-3.5 py-1.5 text-[12.5px] font-medium text-[var(--neutral-600)] transition-colors hover:bg-[var(--neutral-50)] hover:text-[var(--neutral-900)]'
              }
            >
              {t.label}
              <span
                className={
                  active
                    ? 'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/20 px-1.5 text-[10.5px] font-bold tabular-nums'
                    : 'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--neutral-100)] px-1.5 text-[10.5px] font-bold tabular-nums text-[var(--neutral-600)]'
                }
              >
                {c}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)]">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-[var(--neutral-800)]">Belum ada pengajuan pada kategori ini.</p>
            <p className="mt-1 text-xs text-[var(--neutral-500)]">Coba pilih tab lain atau ajukan peminjaman baru.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[var(--neutral-50)]">
                <tr className="text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--neutral-500)]">
                  <th className="px-5 py-3.5">Kode</th>
                  <th className="px-5 py-3.5">Fasilitas & Kegiatan</th>
                  <th className="px-5 py-3.5">Tanggal</th>
                  <th className="px-5 py-3.5">Waktu</th>
                  <th className="px-5 py-3.5">Peserta</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, idx) => {
                  const banner = inlineBanner(r);
                  return (
                    <Fragment key={r.id}>
                      <tr className={idx === 0 ? '' : 'border-t border-[var(--neutral-100)]'}>
                        <td className="whitespace-nowrap px-5 py-3.5 align-top font-[var(--font-mono)] text-[11px] text-[var(--neutral-700)]">
                          {r.requestCode}
                        </td>
                        <td className="px-5 py-3.5 align-top">
                          <p className="font-medium text-[var(--neutral-900)]">{r.activityName}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-[var(--neutral-500)]">
                            <MapPin size={11} className="text-[var(--neutral-400)]" />
                            {r.facilityName}
                            {r.facilityLocation ? ` · ${r.facilityLocation}` : ''}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 align-top text-[12.5px] text-[var(--neutral-700)]">
                          {formatWIBDate(r.startDateTime)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 align-top text-[12.5px] tabular-nums text-[var(--neutral-700)]">
                          {formatWIBTime(r.startDateTime)}–{formatWIBTime(r.endDateTime)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 align-top text-[12.5px] tabular-nums text-[var(--neutral-700)]">
                          {r.participantCount ?? '-'}
                        </td>
                        <td className="px-5 py-3.5 align-top">
                          <StatusBadge status={r.status as RequestStatus} size="sm" />
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 align-top text-right">
                          {r.status === 'REVISION_REQUESTED' ? (
                            <Link
                              href={`/dashboard/pengurus/requests/${r.id}/edit`}
                              className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--primary-800)] px-3 text-[12px] font-semibold text-white hover:bg-[var(--primary-900)]"
                            >
                              Tanggapi
                            </Link>
                          ) : (
                            <Link
                              href={`/dashboard/pengurus/requests/${r.id}`}
                              className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[var(--primary-700)] hover:text-[var(--primary-800)]"
                            >
                              Detail
                              <ArrowRight size={12} />
                            </Link>
                          )}
                        </td>
                      </tr>
                      {banner && (
                        <tr className="bg-transparent">
                          <td colSpan={7} className="px-5 pb-3">
                            {banner}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Banner({
  tone,
  icon,
  children,
}: {
  tone: 'success' | 'info' | 'warning' | 'danger';
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const toneMap: Record<string, string> = {
    success: 'bg-[var(--primary-50)] text-[var(--primary-800)] ring-[var(--primary-100)]',
    info: 'bg-sky-50 text-sky-800 ring-sky-100',
    warning: 'bg-amber-50 text-amber-800 ring-amber-100',
    danger: 'bg-rose-50 text-rose-800 ring-rose-100',
  };
  return (
    <div className={`flex items-start gap-2 rounded-[var(--radius-md)] px-3 py-2 text-[12.5px] ring-1 ${toneMap[tone]}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <p className="min-w-0 flex-1 leading-relaxed">{children}</p>
    </div>
  );
}
