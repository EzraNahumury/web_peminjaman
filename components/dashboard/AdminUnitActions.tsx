'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Pencil, Shuffle, PauseCircle, PlayCircle } from 'lucide-react';
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
import {
  approveByAdminUnit,
  rejectByAdminUnit,
  requestRevisionByAdminUnit,
  offerAlternativeByAdminUnit,
  holdByAdminUnit,
  resumeByAdminUnit,
} from '@/app/actions/approvals';

type Mode = 'approve' | 'reject' | 'revision' | 'offer' | 'hold' | 'resume';

const COPY: Record<
  Mode,
  { title: string; placeholder: string; confirm: string; tone: 'success' | 'danger' | 'primary' | 'outline'; description: string }
> = {
  approve: {
    title: 'Setujui pengajuan',
    placeholder: 'Catatan untuk pengaju (opsional)',
    confirm: 'Setujui',
    tone: 'success',
    description: 'Pengajuan resmi disetujui dan dibooking pada jadwal yang dipilih.',
  },
  reject: {
    title: 'Tolak pengajuan',
    placeholder: 'Jelaskan alasan penolakan dengan ringkas',
    confirm: 'Tolak',
    tone: 'danger',
    description: 'Status berubah menjadi ditolak dan pengaju tidak dapat melanjutkan.',
  },
  revision: {
    title: 'Minta revisi',
    placeholder: 'Jelaskan apa yang perlu direvisi oleh pengaju',
    confirm: 'Kirim permintaan revisi',
    tone: 'primary',
    description: 'Pengaju akan mendapat kesempatan memperbaiki pengajuan.',
  },
  offer: {
    title: 'Tawarkan alternatif',
    placeholder: 'Catatan tambahan untuk pengaju (opsional)',
    confirm: 'Tawarkan alternatif',
    tone: 'primary',
    description:
      'Berikan fasilitas atau slot pengganti. Status menjadi "Perlu Revisi" — pengaju dapat menerima alternatif atau memperbaiki pengajuan.',
  },
  hold: {
    title: 'Tahan pengajuan',
    placeholder: 'Alasan menahan (mis. menunggu konfirmasi pihak lain)',
    confirm: 'Tahan',
    tone: 'outline',
    description:
      'Pengajuan ditahan sementara. Slot tetap dipesan, tidak diproses sampai dilanjutkan kembali.',
  },
  resume: {
    title: 'Lanjutkan pengajuan',
    placeholder: 'Catatan (opsional)',
    confirm: 'Lanjutkan',
    tone: 'primary',
    description: 'Pengajuan dikembalikan ke antrian "Menunggu Admin Unit" untuk diproses.',
  },
};

type FacilityOption = { id: number; name: string };

export function AdminUnitActions({
  requestId,
  status,
  facilityOptions,
}: {
  requestId: number;
  status: 'WAITING_ADMIN_UNIT' | 'ON_HOLD';
  facilityOptions: FacilityOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState<Mode | null>(null);
  const [note, setNote] = useState('');
  const [altFacilityId, setAltFacilityId] = useState<string>('');
  const [altStart, setAltStart] = useState<string>('');
  const [altEnd, setAltEnd] = useState<string>('');
  const [err, setErr] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  function trigger(mode: Mode) {
    setErr(null);
    setNote('');
    setAltFacilityId('');
    setAltStart('');
    setAltEnd('');
    setOpen(mode);
  }

  function submit() {
    if (!open) return;
    const trimmedNote = note.trim() || null;
    const copy = COPY[open];
    start(async () => {
      let res: { ok?: boolean; error?: string };
      if (open === 'approve') res = await approveByAdminUnit(requestId, trimmedNote);
      else if (open === 'reject') res = await rejectByAdminUnit(requestId, trimmedNote);
      else if (open === 'revision') res = await requestRevisionByAdminUnit(requestId, trimmedNote);
      else if (open === 'hold') res = await holdByAdminUnit(requestId, trimmedNote);
      else if (open === 'resume') res = await resumeByAdminUnit(requestId, trimmedNote);
      else {
        if (!altFacilityId && !altStart && !altEnd && !trimmedNote) {
          setErr('Isi minimal salah satu: fasilitas alternatif, jadwal, atau catatan.');
          return;
        }
        res = await offerAlternativeByAdminUnit(requestId, {
          alternativeFacilityId: altFacilityId ? Number(altFacilityId) : null,
          alternativeStart: altStart || null,
          alternativeEnd: altEnd || null,
          note: trimmedNote,
        });
      }
      if (res?.error) {
        setErr(res.error);
        toast.error('Gagal memproses', { description: res.error });
      } else {
        setOpen(null);
        toast.success(copy.confirm + ' berhasil');
        router.refresh();
      }
    });
  }

  const copy = open ? COPY[open] : null;
  const canDecide = status === 'WAITING_ADMIN_UNIT';

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canDecide && (
          <>
            <Button variant="success" onClick={() => trigger('approve')}>
              <Check />
              Setujui
            </Button>
            <Button variant="outline" onClick={() => trigger('revision')}>
              <Pencil />
              Minta Revisi
            </Button>
            <Button variant="outline" onClick={() => trigger('offer')}>
              <Shuffle />
              Tawarkan Alternatif
            </Button>
            <Button variant="outline" onClick={() => trigger('hold')}>
              <PauseCircle />
              Tahan
            </Button>
            <Button variant="danger" onClick={() => trigger('reject')}>
              <X />
              Tolak
            </Button>
          </>
        )}
        {status === 'ON_HOLD' && (
          <Button variant="primary" onClick={() => trigger('resume')}>
            <PlayCircle />
            Lanjutkan
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
              {open === 'offer' && (
                <>
                  <Field label="Fasilitas alternatif" hint="Opsional — kosongkan jika tetap fasilitas asal.">
                    <Select value={altFacilityId} onChange={(e) => setAltFacilityId(e.target.value)}>
                      <option value="">— tidak ada —</option>
                      {facilityOptions.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Mulai alternatif">
                      <Input
                        type="datetime-local"
                        value={altStart}
                        onChange={(e) => setAltStart(e.target.value)}
                      />
                    </Field>
                    <Field label="Selesai alternatif">
                      <Input
                        type="datetime-local"
                        value={altEnd}
                        onChange={(e) => setAltEnd(e.target.value)}
                      />
                    </Field>
                  </div>
                </>
              )}
              <Field label={open === 'offer' ? 'Catatan' : undefined}>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  placeholder={copy.placeholder}
                  autoFocus={open !== 'offer'}
                />
              </Field>
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
