import type { RequestStatus } from '@/types';

const MAP: Record<RequestStatus, { label: string; bg: string; fg: string; dot: string }> = {
  DRAFT: { label: 'Draft', bg: 'var(--status-draft-bg)', fg: 'var(--status-draft-fg)', dot: '#3b82f6' },
  SUBMITTED: { label: 'Terkirim', bg: 'var(--status-info-bg)', fg: 'var(--status-info-fg)', dot: '#0284c7' },
  WAITING_BIRO_III: { label: 'Menunggu Biro III', bg: 'var(--status-pending-bg)', fg: 'var(--status-pending-fg)', dot: '#d97706' },
  REJECTED_BY_BIRO_III: { label: 'Ditolak', bg: 'var(--status-rejected-bg)', fg: 'var(--status-rejected-fg)', dot: '#dc2626' },
  WAITING_WR3_WD3: { label: 'Menunggu WR3/WD3', bg: 'var(--status-pending-bg)', fg: 'var(--status-pending-fg)', dot: '#d97706' },
  REJECTED_BY_WR3_WD3: { label: 'Ditolak', bg: 'var(--status-rejected-bg)', fg: 'var(--status-rejected-fg)', dot: '#dc2626' },
  WAITING_ADMIN_UNIT: { label: 'Menunggu Pengumpulan Surat', bg: 'var(--status-pending-bg)', fg: 'var(--status-pending-fg)', dot: '#d97706' },
  REVISION_REQUESTED: { label: 'Perlu Revisi', bg: 'var(--status-info-bg)', fg: 'var(--status-info-fg)', dot: '#0284c7' },
  ON_HOLD: { label: 'Ditahan', bg: 'var(--status-pending-bg)', fg: 'var(--status-pending-fg)', dot: '#a16207' },
  OVERRIDE_OFFERED: { label: 'Tawaran Admin', bg: 'var(--status-info-bg)', fg: 'var(--status-info-fg)', dot: '#0284c7' },
  APPROVED: { label: 'Disetujui', bg: 'var(--status-approved-bg)', fg: 'var(--status-approved-fg)', dot: '#16a34a' },
  REJECTED: { label: 'Ditolak', bg: 'var(--status-rejected-bg)', fg: 'var(--status-rejected-fg)', dot: '#dc2626' },
  CANCELLED: { label: 'Dibatalkan', bg: 'var(--status-cancelled-bg)', fg: 'var(--status-cancelled-fg)', dot: '#6b7280' },
};

export function StatusBadge({ status, size = 'md' }: { status: RequestStatus; size?: 'sm' | 'md' }) {
  const m = MAP[status] ?? MAP.DRAFT;
  const isPending = status.startsWith('WAITING_');
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-[11px]';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ${padding} font-medium`}
      style={{ background: m.bg, color: m.fg }}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isPending ? 'animate-pulse' : ''}`}
        style={{ background: m.dot }}
      />
      {m.label}
    </span>
  );
}
