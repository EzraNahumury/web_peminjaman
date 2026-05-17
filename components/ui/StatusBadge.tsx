import type { RequestStatus } from '@/types';

const MAP: Record<RequestStatus, { label: string; cls: string; dot: string }> = {
  DRAFT: { label: 'Draft', cls: 'bg-slate-100 text-slate-700 ring-slate-200', dot: 'bg-slate-400' },
  SUBMITTED: { label: 'Terkirim', cls: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-500' },
  WAITING_BIRO_III: { label: 'Menunggu Biro III', cls: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  REJECTED_BY_BIRO_III: { label: 'Ditolak', cls: 'bg-rose-50 text-rose-700 ring-rose-200', dot: 'bg-rose-500' },
  WAITING_WR3_WD3: { label: 'Menunggu WR3/WD3', cls: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  REJECTED_BY_WR3_WD3: { label: 'Ditolak', cls: 'bg-rose-50 text-rose-700 ring-rose-200', dot: 'bg-rose-500' },
  WAITING_ADMIN_UNIT: { label: 'Menunggu Admin Unit', cls: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  REVISION_REQUESTED: { label: 'Perlu Revisi', cls: 'bg-blue-50 text-blue-700 ring-blue-200', dot: 'bg-blue-500' },
  APPROVED: { label: 'Disetujui', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { label: 'Ditolak', cls: 'bg-rose-50 text-rose-700 ring-rose-200', dot: 'bg-rose-500' },
  CANCELLED: { label: 'Dibatalkan', cls: 'bg-slate-100 text-slate-600 ring-slate-200', dot: 'bg-slate-400' },
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const m = MAP[status] ?? MAP.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${m.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}
