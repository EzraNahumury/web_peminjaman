'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';

type Mode = 'approve' | 'reject' | 'revision';
type ActionFn = (id: number, note: string | null) => Promise<{ ok?: boolean; error?: string }>;

const COPY: Record<Mode, { title: string; placeholder: string; confirm: string; tone: 'success' | 'danger' | 'primary' }> = {
  approve: { title: 'Setujui Pengajuan', placeholder: 'Catatan (opsional)', confirm: 'Setujui', tone: 'success' },
  reject: { title: 'Tolak Pengajuan', placeholder: 'Alasan penolakan wajib diisi', confirm: 'Tolak', tone: 'danger' },
  revision: { title: 'Minta Revisi', placeholder: 'Detail revisi yang diperlukan', confirm: 'Kirim Permintaan Revisi', tone: 'primary' },
};

export function ApprovalActions({
  requestId,
  approve,
  reject,
  revision,
}: {
  requestId: number;
  approve?: ActionFn;
  reject?: ActionFn;
  revision?: ActionFn;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<Mode | null>(null);
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  function trigger(mode: Mode) {
    setErr(null);
    setNote('');
    setOpen(mode);
  }

  function submit() {
    if (!open) return;
    const fn = open === 'approve' ? approve : open === 'reject' ? reject : revision;
    if (!fn) return;
    start(async () => {
      const res = await fn(requestId, note.trim() || null);
      if (res?.error) {
        setErr(res.error);
      } else {
        setOpen(null);
        router.refresh();
      }
    });
  }

  const copy = open ? COPY[open] : null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {approve && (
          <Button variant="success" onClick={() => trigger('approve')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Setujui
          </Button>
        )}
        {revision && (
          <Button variant="primary" onClick={() => trigger('revision')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
            </svg>
            Minta Revisi
          </Button>
        )}
        {reject && (
          <Button variant="danger" onClick={() => trigger('reject')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
            Tolak
          </Button>
        )}
      </div>

      {open && copy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">{copy.title}</h3>
            </div>
            <div className="space-y-3 p-6">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                placeholder={copy.placeholder}
                autoFocus
              />
              {err && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-3">
              <Button variant="outline" onClick={() => setOpen(null)} disabled={isPending}>
                Batal
              </Button>
              <Button variant={copy.tone} onClick={submit} disabled={isPending}>
                {isPending ? 'Memproses...' : copy.confirm}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
