import { fmtDateTime } from '@/lib/request-code';
import type { ApprovalLog } from '@/types';

const ACTION_LABEL: Record<string, string> = {
  SUBMIT: 'Pengajuan disubmit',
  APPROVE_BIRO_III: 'Disetujui Biro III',
  REJECT_BIRO_III: 'Ditolak Biro III',
  APPROVE_WR3_WD3: 'Disetujui WR3/WD3',
  REJECT_WR3_WD3: 'Ditolak WR3/WD3',
  APPROVE_ADMIN: 'Disetujui Admin Unit',
  REJECT_ADMIN: 'Ditolak Admin Unit',
  REQUEST_REVISION: 'Diminta revisi',
  RESUBMIT_REVISION: 'Disubmit ulang',
  CANCEL: 'Dibatalkan',
};

export function Timeline({ logs }: { logs: (ApprovalLog & { actorName?: string | null })[] }) {
  if (logs.length === 0) return <p className="text-sm text-gray-500">Belum ada riwayat.</p>;
  return (
    <ol className="relative space-y-4 border-l-2 border-gray-200 pl-5">
      {logs.map((l) => (
        <li key={l.id} className="relative">
          <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-blue-500" />
          <p className="text-sm font-medium text-gray-900">{ACTION_LABEL[l.action] || l.action}</p>
          <p className="text-xs text-gray-500">
            {fmtDateTime(l.createdAt)}
            {l.actorName ? ` · oleh ${l.actorName}` : ''}
          </p>
          {l.note && <p className="mt-1 rounded bg-gray-50 p-2 text-xs text-gray-700">{l.note}</p>}
        </li>
      ))}
    </ol>
  );
}
