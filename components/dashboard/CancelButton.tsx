'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
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
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={() => { setErr(null); setReason(''); setOpen(true); }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
        Batalkan Peminjaman
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">Batalkan Peminjaman</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {approved
                  ? 'Pengajuan sudah disetujui. Pembatalan akan melepas slot booking dan notifikasi dikirim ke approver.'
                  : 'Pengajuan akan diubah ke status CANCELLED dan tidak dapat dilanjutkan.'}
              </p>
            </div>
            <div className="space-y-3 p-6">
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Alasan pembatalan (opsional)"
                autoFocus
              />
              {err && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-3">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                Tutup
              </Button>
              <Button variant="danger" onClick={submit} disabled={isPending}>
                {isPending ? 'Memproses...' : 'Konfirmasi Batalkan'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
