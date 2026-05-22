'use client';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Check, ChevronDown, Repeat, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { adminOverrideApproved } from '@/app/actions/approvals';
import type { Facility } from '@/types';

/* ------------------------------------------------------------------ */
/* Dropdown fasilitas — tema kustom, mengembang in-flow tepat di bawah  */
/* tombolnya (tanpa popover/portal, posisi tidak mungkin meleset).      */
/* ------------------------------------------------------------------ */
function FacilitySelect({
  facilities,
  value,
  onChange,
}: {
  facilities: Facility[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  const selected = useMemo(
    () => facilities.find((f) => String(f.id) === value) ?? null,
    [facilities, value]
  );

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const map = new Map<string, Facility[]>();
    for (const f of facilities) {
      if (
        needle &&
        !f.name.toLowerCase().includes(needle) &&
        !(f.location ?? '').toLowerCase().includes(needle) &&
        !f.category.toLowerCase().includes(needle)
      ) {
        continue;
      }
      const key = f.category?.trim() || 'Lainnya';
      const list = map.get(key);
      if (list) list.push(f);
      else map.set(key, [f]);
    }
    for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name, 'id'));
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'id'));
  }, [facilities, q]);

  function pick(id: string) {
    onChange(id);
    setOpen(false);
    setQ('');
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex h-10 w-full items-center gap-2 rounded-[var(--radius-md)] border border-[var(--neutral-300)] bg-white px-3.5 text-left text-sm shadow-[var(--shadow-xs)] outline-none transition-all hover:border-[var(--neutral-400)] focus-visible:border-[var(--primary-600)] focus-visible:ring-[3px] focus-visible:ring-[var(--primary-100)]"
      >
        <span className={`min-w-0 flex-1 truncate ${selected ? 'text-[var(--neutral-900)]' : 'text-[var(--neutral-400)]'}`}>
          {selected ? (
            <>
              <span className="font-medium">{selected.name}</span>
              {selected.location && (
                <span className="ml-1.5 text-[12px] text-[var(--neutral-500)]">· {selected.location}</span>
              )}
            </>
          ) : (
            '— Pilih fasilitas —'
          )}
        </span>
        <ChevronDown
          size={15}
          className={`shrink-0 text-[var(--neutral-400)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="mt-1.5 overflow-hidden rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-sm)]">
          <div className="border-b border-[var(--neutral-100)] p-2">
            <div className="relative">
              <Search
                size={13}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--neutral-400)]"
              />
              <input
                type="search"
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari fasilitas…"
                className="h-8 w-full rounded-[var(--radius-sm)] border border-[var(--neutral-200)] bg-[var(--neutral-50)] pl-7 pr-2.5 text-[12px] text-[var(--neutral-900)] outline-none placeholder:text-[var(--neutral-400)] focus:border-[var(--primary-600)] focus:bg-white focus:ring-2 focus:ring-[var(--primary-100)]"
              />
            </div>
          </div>

          <div className="max-h-[230px] overflow-y-auto p-1">
            {groups.length === 0 ? (
              <p className="px-3 py-5 text-center text-[12px] text-[var(--neutral-500)]">
                Tidak ada fasilitas cocok.
              </p>
            ) : (
              groups.map(([category, items]) => (
                <div key={category} className="mb-1 last:mb-0">
                  <p className="px-2.5 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--primary-700)]">
                    {category}
                  </p>
                  {items.map((f) => {
                    const active = String(f.id) === value;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => pick(String(f.id))}
                        className={
                          active
                            ? 'flex w-full items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--primary-50)] px-2.5 py-1.5 text-left text-[12.5px] ring-1 ring-[var(--primary-100)]'
                            : 'flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-left text-[12.5px] transition-colors hover:bg-[var(--neutral-50)]'
                        }
                      >
                        <span className="min-w-0 flex-1">
                          <span className="font-medium text-[var(--neutral-900)]">{f.name}</span>
                          <span className="block truncate text-[10.5px] text-[var(--neutral-500)]">
                            {[f.location, f.capacity != null ? `Kap. ${f.capacity}` : null]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        </span>
                        {active && <Check size={14} className="shrink-0 text-[var(--primary-700)]" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Modal Override — mandiri (tanpa Radix Dialog). Pola: fixed overlay   */
/* + flexbox center, di-render via React Portal ke <body> sehingga      */
/* tidak terpengaruh overflow/transform parent mana pun.                */
/* ------------------------------------------------------------------ */
export function AdminOverrideButton({
  requestId,
  facilities,
  defaultFacilityId,
  defaultStart,
  defaultEnd,
}: {
  requestId: number;
  facilities: Facility[];
  defaultFacilityId?: string;
  defaultStart?: string;
  defaultEnd?: string;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [facilityId, setFacilityId] = useState(defaultFacilityId ?? '');
  const [start, setStart] = useState(defaultStart ?? '');
  const [end, setEnd] = useState(defaultEnd ?? '');
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [pending, startTx] = useTransition();

  useEffect(() => setMounted(true), []);

  // Kunci scroll body & tutup dengan ESC saat modal terbuka.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !pending) close();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, pending]);

  function reset() {
    setFacilityId(defaultFacilityId ?? '');
    setStart(defaultStart ?? '');
    setEnd(defaultEnd ?? '');
    setReason('');
    setErr(null);
  }

  function openModal() {
    reset();
    setOpen(true);
  }

  function close() {
    setOpen(false);
    reset();
  }

  function submit() {
    if (!facilityId) {
      setErr('Pilih fasilitas pengganti terlebih dahulu.');
      return;
    }
    if (!start || start.length < 16 || !end || end.length < 16) {
      setErr('Tanggal & jam mulai serta selesai wajib diisi lengkap.');
      return;
    }
    if (end <= start) {
      setErr('Waktu selesai harus setelah waktu mulai.');
      return;
    }
    if (!reason.trim()) {
      setErr('Alasan urgensi wajib diisi.');
      return;
    }
    startTx(async () => {
      try {
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
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Terjadi kesalahan tidak terduga';
        setErr(msg);
        toast.error('Gagal override', { description: msg });
      }
    });
  }

  return (
    <>
      <Button variant="danger" onClick={openModal}>
        <Repeat />
        Override Karena Urgent
      </Button>

      {mounted &&
        open &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Tawarkan Pergantian Ruangan"
          >
            <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-lg)]">
              {/* Header */}
              <div className="flex items-start gap-3 border-b border-[var(--neutral-100)] px-6 py-4">
                <div className="min-w-0 flex-1">
                  <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-[var(--neutral-900)]">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    Tawarkan Pergantian Ruangan
                  </h2>
                  <p className="mt-1 text-xs text-[var(--neutral-500)]">
                    Pengajuan sudah disetujui. Jika ruangan ini dibutuhkan untuk keperluan
                    mendesak, ajukan pergantian. Pengaju akan diminta menerima atau menolak.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  disabled={pending}
                  className="shrink-0 rounded-[var(--radius-sm)] p-1 text-[var(--neutral-500)] opacity-70 transition-opacity hover:bg-[var(--neutral-100)] hover:opacity-100 disabled:opacity-40"
                  aria-label="Tutup"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
                <Field label="Fasilitas pengganti" required>
                  <FacilitySelect facilities={facilities} value={facilityId} onChange={setFacilityId} />
                </Field>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Mulai" required>
                    <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
                  </Field>
                  <Field label="Selesai" required>
                    <Input
                      type="datetime-local"
                      value={end}
                      min={start || undefined}
                      onChange={(e) => setEnd(e.target.value)}
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

              {/* Footer */}
              <div className="flex justify-end gap-2 border-t border-[var(--neutral-100)] bg-[var(--neutral-50)] px-6 py-3">
                <Button variant="outline" onClick={close} disabled={pending}>
                  Batal
                </Button>
                <Button variant="danger" onClick={submit} disabled={pending}>
                  {pending ? 'Mengirim…' : 'Kirim Tawaran ke Pengaju'}
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
