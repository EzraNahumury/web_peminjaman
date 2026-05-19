'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
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
import { cancelRequest } from '@/app/actions/requests';

export function CancelButton({ requestId, approved }: { requestId: number; approved: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  function submit() {
    start(async () => {
      const res = await cancelRequest(requestId, reason.trim() || null);
      if (res?.error) {
        setErr(res.error);
        toast.error('Gagal membatalkan', { description: res.error });
      } else {
        setOpen(false);
        toast.success('Peminjaman dibatalkan', {
          description: approved ? 'Slot booking dilepas dan approver telah diberitahu.' : 'Status diubah menjadi dibatalkan.',
        });
        router.refresh();
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setErr(null);
          setReason('');
          setOpen(true);
        }}
      >
        <X />
        Batalkan Peminjaman
      </Button>

      <Dialog open={open} onOpenChange={(v) => !isPending && setOpen(v)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Batalkan peminjaman?</DialogTitle>
            <DialogDescription>
              {approved
                ? 'Pengajuan sudah disetujui. Pembatalan akan melepas slot booking dan approver mendapat notifikasi.'
                : 'Pengajuan akan diubah ke status CANCELLED dan tidak dapat dilanjutkan.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 p-6">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Alasan pembatalan (opsional)"
              autoFocus
            />
            {err && (
              <div className="rounded-[var(--radius-md)] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Tutup
            </Button>
            <Button variant="danger" onClick={submit} disabled={isPending}>
              {isPending ? 'Memproses…' : 'Konfirmasi batalkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
