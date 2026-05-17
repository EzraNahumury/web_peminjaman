'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';

type Mode = 'approve' | 'reject' | 'revision';
type ActionFn = (id: number, note: string | null) => Promise<{ ok?: boolean; error?: string }>;

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

  return (
    <div className="flex flex-wrap gap-2">
      {approve && (
        <Button variant="success" onClick={() => trigger('approve')}>
          Setujui
        </Button>
      )}
      {revision && (
        <Button variant="primary" onClick={() => trigger('revision')}>
          Minta Revisi
        </Button>
      )}
      {reject && (
        <Button variant="danger" onClick={() => trigger('reject')}>
          Tolak
        </Button>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              {open === 'approve' ? 'Setujui Pengajuan' : open === 'reject' ? 'Tolak Pengajuan' : 'Minta Revisi'}
            </h3>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder={open === 'approve' ? 'Catatan (opsional)' : 'Alasan / catatan'}
            />
            {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(null)} disabled={isPending}>
                Batal
              </Button>
              <Button
                variant={open === 'reject' ? 'danger' : open === 'approve' ? 'success' : 'primary'}
                onClick={submit}
                disabled={isPending}
              >
                {isPending ? 'Memproses...' : 'Konfirmasi'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
