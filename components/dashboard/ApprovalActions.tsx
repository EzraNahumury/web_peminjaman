'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';

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
    description: 'Pengaju akan dapat memperbaiki pengajuan lalu masuk kembali ke antrian Biro III.',
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
    const copy = COPY[open];
    start(async () => {
      const res = await fn(requestId, note.trim() || null);
      if (res?.error) {
        setErr(res.error);
        toast.error('Gagal memproses', { description: res.error });
      } else {
        setOpen(null);
        toast.success(copy.confirm + ' berhasil', { description: 'Status pengajuan telah diperbarui.' });
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
            <Check />
            Setujui
          </Button>
        )}
        {revision && (
          <Button variant="outline" onClick={() => trigger('revision')}>
            <Pencil />
            Minta Revisi
          </Button>
        )}
        {reject && (
          <Button variant="danger" onClick={() => trigger('reject')}>
            <X />
            Tolak
          </Button>
        )}
      </div>

      <Dialog open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        {copy && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{copy.title}</DialogTitle>
              <DialogDescription>{copy.description}</DialogDescription>
            </DialogHeader>
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(null)} disabled={isPending}>
                Batal
              </Button>
              <Button variant={copy.tone} onClick={submit} disabled={isPending}>
                {isPending ? 'Memproses…' : copy.confirm}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
