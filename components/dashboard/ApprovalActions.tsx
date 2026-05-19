'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';

type Mode = 'approve' | 'reject' | 'revision';
type ActionFn = (id: number, note: string | null) => Promise<{ ok?: boolean; error?: string }>;

const COPY: Record<Mode, { title: string; placeholder: string; confirm: string; tone: 'success' | 'danger' | 'primary'; description: string }> = {
  approve: {
    title: 'Setujui pengajuan',
    placeholder: 'Catatan untuk pengaju (opsional)',
    confirm: 'Setujui',
    tone: 'success',
    description: 'Pengajuan akan diteruskan ke tahap berikutnya dan pengaju mendapat notifikasi.',
  },
  reject: {
    title: 'Tolak pengajuan',
    placeholder: 'Jelaskan alasan penolakan dengan ringkas',
    confirm: 'Tolak',
    tone: 'danger',
    description: 'Status akan berubah menjadi ditolak dan pengaju tidak dapat mengubah pengajuan ini.',
  },
  revision: {
    title: 'Minta revisi',
    placeholder: 'Jelaskan apa yang perlu direvisi oleh pengaju',
    confirm: 'Kirim permintaan revisi',
    tone: 'primary',
    description: 'Pengaju akan dapat memperbaiki pengajuan, lalu dimasukkan kembali ke antrian Biro III.',
  },
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
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Setujui
          </Button>
        )}
        {revision && (
          <Button variant="outline" onClick={() => trigger('revision')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
            </svg>
            Minta Revisi
          </Button>
        )}
        {reject && (
          <Button variant="danger" onClick={() => trigger('reject')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
            Tolak
          </Button>
        )}
      </div>

      <AnimatePresence>
        {open && copy && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--neutral-900)]/40 p-4 backdrop-blur-sm"
            onClick={() => !isPending && setOpen(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-[var(--shadow-lg)]"
            >
              <div className="border-b border-[var(--neutral-100)] px-6 py-4">
                <h3 className="text-base font-semibold text-[var(--neutral-900)]">{copy.title}</h3>
                <p className="mt-1 text-xs text-[var(--neutral-500)]">{copy.description}</p>
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
                  <div className="rounded-[var(--radius-md)] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {err}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 border-t border-[var(--neutral-100)] bg-[var(--neutral-50)] px-6 py-3">
                <Button variant="outline" onClick={() => setOpen(null)} disabled={isPending}>
                  Batal
                </Button>
                <Button variant={copy.tone} onClick={submit} disabled={isPending}>
                  {isPending ? 'Memproses…' : copy.confirm}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
