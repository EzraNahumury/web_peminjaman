import { fmtDateTime } from '@/lib/request-code';
import type { ApprovalLog } from '@/types';

type ToneKey = 'submit' | 'approved' | 'rejected' | 'revision' | 'cancelled' | 'hold';

const ACTION: Record<string, { label: string; tone: ToneKey; icon: string }> = {
  SUBMIT: {
    label: 'Pengajuan disubmit',
    tone: 'submit',
    icon: 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z',
  },
  APPROVE_BIRO_III: { label: 'Disetujui Biro III', tone: 'approved', icon: 'M20 6 9 17l-5-5' },
  REJECT_BIRO_III: { label: 'Ditolak Biro III', tone: 'rejected', icon: 'M18 6 6 18M6 6l12 12' },
  APPROVE_WR3_WD3: { label: 'Disetujui WR3/WD3', tone: 'approved', icon: 'M20 6 9 17l-5-5' },
  REJECT_WR3_WD3: { label: 'Ditolak WR3/WD3', tone: 'rejected', icon: 'M18 6 6 18M6 6l12 12' },
  APPROVE_ADMIN: { label: 'Disetujui Admin Unit', tone: 'approved', icon: 'M20 6 9 17l-5-5' },
  REJECT_ADMIN: { label: 'Ditolak Admin Unit', tone: 'rejected', icon: 'M18 6 6 18M6 6l12 12' },
  REQUEST_REVISION: {
    label: 'Diminta revisi',
    tone: 'revision',
    icon: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z',
  },
  RESUBMIT_REVISION: {
    label: 'Disubmit ulang',
    tone: 'submit',
    icon: 'M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74M21 3v6h-6',
  },
  OFFER_ALTERNATIVE: {
    label: 'Ditawarkan alternatif',
    tone: 'revision',
    icon: 'M7 17 17 7M7 7h10v10',
  },
  HOLD: {
    label: 'Ditahan Admin Unit',
    tone: 'hold',
    icon: 'M10 4H6v16h4zM18 4h-4v16h4z',
  },
  RESUME: {
    label: 'Dilanjutkan kembali',
    tone: 'submit',
    icon: 'm6 4 14 8L6 20z',
  },
  CANCEL: { label: 'Dibatalkan', tone: 'cancelled', icon: 'M18 6 6 18M6 6l12 12' },
};

const TONE: Record<ToneKey, string> = {
  submit: 'bg-sky-50 text-sky-700 ring-sky-100',
  approved: 'bg-[var(--primary-50)] text-[var(--primary-700)] ring-[var(--primary-100)]',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-100',
  revision: 'bg-amber-50 text-amber-700 ring-amber-100',
  cancelled: 'bg-slate-100 text-slate-700 ring-slate-200',
  hold: 'bg-amber-50 text-amber-800 ring-amber-100',
};

export function Timeline({ logs }: { logs: (ApprovalLog & { actorName?: string | null })[] }) {
  if (logs.length === 0) {
    return <p className="text-sm text-[var(--neutral-500)]">Belum ada riwayat.</p>;
  }
  return (
    <ol className="relative space-y-5">
      <span className="absolute left-[15px] top-2 bottom-2 w-px bg-[var(--neutral-200)]" />
      {logs.map((l) => {
        const a = ACTION[l.action] ?? { label: l.action, tone: 'submit' as ToneKey, icon: 'M5 12h14' };
        return (
          <li key={l.id} className="relative flex items-start gap-4 pl-0">
            <span
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${TONE[a.tone]}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d={a.icon} />
              </svg>
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm font-semibold text-[var(--neutral-900)]">{a.label}</p>
              <p className="mt-0.5 text-xs text-[var(--neutral-500)]">
                {fmtDateTime(l.createdAt)}
                {l.actorName ? ` · ${l.actorName}` : ''}
              </p>
              {l.note && (
                <p className="mt-2 rounded-[var(--radius-md)] bg-[var(--neutral-50)] px-3 py-2 text-xs text-[var(--neutral-700)] ring-1 ring-[var(--neutral-100)]">
                  {l.note}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
