import type { RequestStatus } from '@/types';

const MAP: Record<RequestStatus, { label: string; cls: string }> = {
  DRAFT: { label: 'Draft', cls: 'bg-gray-100 text-gray-700' },
  SUBMITTED: { label: 'Terkirim', cls: 'bg-blue-100 text-blue-700' },
  WAITING_BIRO_III: { label: 'Menunggu Biro III', cls: 'bg-amber-100 text-amber-800' },
  REJECTED_BY_BIRO_III: { label: 'Ditolak', cls: 'bg-red-100 text-red-700' },
  WAITING_WR3_WD3: { label: 'Menunggu WR3/WD3', cls: 'bg-amber-100 text-amber-800' },
  REJECTED_BY_WR3_WD3: { label: 'Ditolak', cls: 'bg-red-100 text-red-700' },
  WAITING_ADMIN_UNIT: { label: 'Menunggu Admin Unit', cls: 'bg-amber-100 text-amber-800' },
  REVISION_REQUESTED: { label: 'Perlu Revisi', cls: 'bg-blue-100 text-blue-700' },
  APPROVED: { label: 'Disetujui', cls: 'bg-emerald-100 text-emerald-700' },
  REJECTED: { label: 'Ditolak', cls: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Dibatalkan', cls: 'bg-gray-200 text-gray-600' },
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const m = MAP[status] ?? MAP.DRAFT;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${m.cls}`}>
      {m.label}
    </span>
  );
}
