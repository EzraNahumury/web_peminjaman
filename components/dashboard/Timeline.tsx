import { fmtDateTime } from '@/lib/request-code';
import type { ApprovalLog } from '@/types';

const ACTION: Record<string, { label: string; tone: 'blue' | 'emerald' | 'rose' | 'amber' | 'slate' }> = {
  SUBMIT: { label: 'Pengajuan disubmit', tone: 'blue' },
  APPROVE_BIRO_III: { label: 'Disetujui Biro III', tone: 'emerald' },
  REJECT_BIRO_III: { label: 'Ditolak Biro III', tone: 'rose' },
  APPROVE_WR3_WD3: { label: 'Disetujui WR3/WD3', tone: 'emerald' },
  REJECT_WR3_WD3: { label: 'Ditolak WR3/WD3', tone: 'rose' },
  APPROVE_ADMIN: { label: 'Disetujui Admin Unit', tone: 'emerald' },
  REJECT_ADMIN: { label: 'Ditolak Admin Unit', tone: 'rose' },
  REQUEST_REVISION: { label: 'Diminta revisi', tone: 'amber' },
  RESUBMIT_REVISION: { label: 'Disubmit ulang', tone: 'blue' },
  CANCEL: { label: 'Dibatalkan', tone: 'slate' },
};

const DOT: Record<string, string> = {
  blue: 'bg-blue-500 ring-blue-100',
  emerald: 'bg-emerald-500 ring-emerald-100',
  rose: 'bg-rose-500 ring-rose-100',
  amber: 'bg-amber-500 ring-amber-100',
  slate: 'bg-slate-400 ring-slate-100',
};

export function Timeline({ logs }: { logs: (ApprovalLog & { actorName?: string | null })[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-slate-500">Belum ada riwayat.</p>;
  }
  return (
    <ol className="relative space-y-5 border-l-2 border-slate-100 pl-6">
      {logs.map((l) => {
        const a = ACTION[l.action] ?? { label: l.action, tone: 'slate' as const };
        return (
          <li key={l.id} className="relative">
            <span className={`absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full ring-4 ${DOT[a.tone]}`} />
            <p className="text-sm font-semibold text-slate-900">{a.label}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {fmtDateTime(l.createdAt)}
              {l.actorName ? ` · ${l.actorName}` : ''}
            </p>
            {l.note && (
              <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700 ring-1 ring-slate-100">{l.note}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
