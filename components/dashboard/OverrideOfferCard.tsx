'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Check, X } from 'lucide-react';
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
import { acceptOverride, rejectOverride } from '@/app/actions/approvals';
import { fmtDateTime } from '@/lib/request-code';

type Props = {
  requestId: number;
  oldFacility: string;
  newFacility: string;
  newStart: Date | string;
  newEnd: Date | string;
  reason: string | null;
};

export function OverrideOfferCard({ requestId, oldFacility, newFacility, newStart, newEnd, reason }: Props) {
  const router = useRouter();
  const [showReject, setShowReject] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [pending, start] = useTransition();

  function handleAccept() {
    if (!confirm('Terima tawaran perpindahan? Fasilitas dan jadwal pengajuan akan diperbarui.')) return;
    start(async () => {
      const res = await acceptOverride(requestId);
      if (res?.error) {
        toast.error('Gagal menerima', { description: res.error });
        return;
      }
      toast.success('Tawaran diterima', { description: 'Booking baru telah dibuat.' });
      router.refresh();
    });
  }

  function handleReject() {
    start(async () => {
      const res = await rejectOverride(requestId, rejectNote.trim() || null);
      if (res?.error) {
        toast.error('Gagal menolak', { description: res.error });
        return;
      }
      toast.success('Tawaran ditolak', { description: 'Pengajuan dibatalkan.' });
      setShowReject(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50/60 shadow-[var(--shadow-xs)]">
        <div className="flex items-start gap-3 border-b border-amber-200 px-6 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-white text-amber-700 ring-1 ring-amber-200">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-amber-900">Admin meminta perpindahan ruangan</h2>
            <p className="mt-0.5 text-xs text-amber-800">
              Ada keperluan mendesak yang memakai ruangan Anda. Admin menawarkan pengganti di bawah ini.
              Anda dapat menerima atau menolak.
            </p>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-white p-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--neutral-500)]">
              Fasilitas semula
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--neutral-900)] line-through decoration-rose-400/70">
              {oldFacility}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--primary-200)] bg-[var(--primary-50)]/60 p-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--primary-700)]">
              Fasilitas pengganti
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--neutral-900)]">{newFacility}</p>
            <p className="mt-2 text-xs text-[var(--neutral-700)]">
              <span className="font-medium">Mulai:</span> {fmtDateTime(newStart)}
            </p>
            <p className="text-xs text-[var(--neutral-700)]">
              <span className="font-medium">Selesai:</span> {fmtDateTime(newEnd)}
            </p>
          </div>

          {reason && (
            <div className="sm:col-span-2 rounded-[var(--radius-md)] bg-white p-4 ring-1 ring-amber-200">
              <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--neutral-500)]">
                Alasan dari admin
              </p>
              <p className="mt-1 text-sm text-[var(--neutral-800)]">{reason}</p>
            </div>
          )}

          <div className="sm:col-span-2 flex flex-wrap justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowReject(true)} disabled={pending}>
              <X />
              Tolak (Batalkan Peminjaman)
            </Button>
            <Button variant="success" onClick={handleAccept} disabled={pending}>
              <Check />
              {pending ? 'Memproses…' : 'Terima Tawaran'}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showReject} onOpenChange={(v) => !pending && setShowReject(v)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tolak tawaran perpindahan?</DialogTitle>
            <DialogDescription>
              Pengajuan akan dibatalkan dan slot pengganti dilepas. Beri alasan agar admin tahu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 p-6">
            <Textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
              placeholder="Alasan menolak (opsional)"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReject(false)} disabled={pending}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleReject} disabled={pending}>
              {pending ? 'Memproses…' : 'Konfirmasi Tolak'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
