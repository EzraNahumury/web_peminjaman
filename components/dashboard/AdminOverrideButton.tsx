'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Repeat } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { adminOverrideApproved } from '@/app/actions/approvals';
import { MANAGING_UNIT_LABEL, type Facility, type ManagingUnit } from '@/types';

const UNIT_ORDER: ManagingUnit[] = ['BIRO_I', 'BIRO_IV', 'PPLK', 'KRT', 'LPAIP'];

export function AdminOverrideButton({
  requestId,
  facilities,
}: {
  requestId: number;
  facilities: Facility[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [facilityId, setFacilityId] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTx] = useTransition();

  function reset() {
    setFacilityId('');
    setStart('');
    setEnd('');
    setReason('');
    setErr(null);
  }

  function submit() {
    if (!facilityId || !start || !end || !reason.trim()) {
      setErr('Fasilitas, jadwal, dan alasan wajib diisi');
      return;
    }
    startTx(async () => {
      const res = await adminOverrideApproved(requestId, {
        proposedFacilityId: Number(facilityId),
        proposedStart: start,
        proposedEnd: end,
        reason,
      });
      if (res?.error) {
        setErr(res.error);
        toast.error('Gagal override', { description: res.error });
        return;
      }
      toast.success('Tawaran perpindahan dikirim ke pengaju');
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <>
      <Button
        variant="danger"
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        <Repeat />
        Override Karena Urgent
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!pending) {
            setOpen(v);
            if (!v) reset();
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Tawarkan Pergantian Ruangan
            </DialogTitle>
            <DialogDescription>
              Pengajuan sudah disetujui. Jika ruangan ini dibutuhkan untuk keperluan mendesak,
              ajukan pergantian. Pengaju akan diminta menerima atau menolak.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-6">
            <Field label="Fasilitas pengganti" required>
              <Select value={facilityId} onChange={(e) => setFacilityId(e.target.value)} required>
                <option value="">— Pilih fasilitas —</option>
                {UNIT_ORDER.map((unit) => {
                  const items = facilities.filter((f) => f.managingUnit === unit);
                  if (items.length === 0) return null;
                  return (
                    <optgroup key={unit} label={MANAGING_UNIT_LABEL[unit]}>
                      {items.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} — {f.category}
                          {f.capacity ? ` (kap. ${f.capacity})` : ''}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Mulai" required>
                <Input
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  required
                />
              </Field>
              <Field label="Selesai" required>
                <Input
                  type="datetime-local"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  required
                />
              </Field>
            </div>
            <Field
              label="Alasan urgensi"
              required
              hint="Akan terkirim ke pengaju via notifikasi. Jelaskan kenapa harus diganti."
            >
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Contoh: Auditorium Koinonia digunakan rapat senat mendesak hari yang sama."
              />
            </Field>
            {err && (
              <div className="rounded-[var(--radius-md)] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {err}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Batal
            </Button>
            <Button variant="danger" onClick={submit} disabled={pending}>
              {pending ? 'Mengirim…' : 'Kirim Tawaran ke Pengaju'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
