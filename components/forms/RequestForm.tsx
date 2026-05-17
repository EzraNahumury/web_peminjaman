'use client';
import { useActionState, useState, useTransition } from 'react';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import {
  checkAvailability,
  createFacilityRequest,
  updateRevisionRequest,
  type RequestFormState,
} from '@/app/actions/requests';
import type { Facility, FacilityRequest } from '@/types';

type Props = {
  facilities: Facility[];
  mode: 'create' | 'edit';
  initial?: FacilityRequest;
};

export function RequestForm({ facilities, mode, initial }: Props) {
  const action =
    mode === 'create' ? createFacilityRequest : updateRevisionRequest.bind(null, initial!.id);
  const [state, formAction, pending] = useActionState<RequestFormState, FormData>(action, undefined);
  const errs = state?.fieldErrors ?? {};

  const [facilityId, setFacilityId] = useState<string>(initial ? String(initial.facilityId) : '');
  const [start, setStart] = useState<string>(initial ? toLocal(initial.startDateTime) : '');
  const [end, setEnd] = useState<string>(initial ? toLocal(initial.endDateTime) : '');
  const [avail, setAvail] = useState<null | { available: boolean; alternatives: Facility[] }>(null);
  const [checking, startChecking] = useTransition();

  function doCheck() {
    if (!facilityId || !start || !end) return;
    startChecking(async () => {
      const res = await checkAvailability(Number(facilityId), start, end);
      setAvail({ available: res.available, alternatives: res.alternatives });
    });
  }

  return (
    <form action={formAction} className="space-y-7">
      <Section title="Data Kegiatan" desc="Informasi umum kegiatan yang akan dilaksanakan.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fasilitas" error={errs.facilityId} required>
            <Select name="facilityId" value={facilityId} onChange={(e) => setFacilityId(e.target.value)} required>
              <option value="">-- Pilih fasilitas --</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} — {f.category}
                  {f.capacity ? ` (kap. ${f.capacity})` : ''}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Nama Kegiatan" error={errs.activityName} required>
            <Input name="activityName" defaultValue={initial?.activityName} required />
          </Field>
          <Field label="Nama Organisasi / LK / OK" error={errs.organizationName} required>
            <Input name="organizationName" defaultValue={initial?.organizationName} required />
          </Field>
          <Field label="Perkiraan Jumlah Peserta" error={errs.participantCount}>
            <Input type="number" name="participantCount" defaultValue={initial?.participantCount ?? ''} min={0} />
          </Field>
        </div>
      </Section>

      <Section title="Jadwal & Ketersediaan" desc="Pilih waktu mulai dan selesai, lalu cek ketersediaan.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tanggal & Jam Mulai" error={errs.startDateTime} required>
            <Input
              type="datetime-local"
              name="startDateTime"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </Field>
          <Field label="Tanggal & Jam Selesai" error={errs.endDateTime} required>
            <Input
              type="datetime-local"
              name="endDateTime"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" onClick={doCheck} disabled={checking}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 21l-4.35-4.35M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" />
            </svg>
            {checking ? 'Mengecek...' : 'Cek Ketersediaan'}
          </Button>
          {avail && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ${
                avail.available
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                  : 'bg-rose-50 text-rose-700 ring-rose-200'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${avail.available ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              {avail.available ? 'Fasilitas tersedia' : 'Tidak tersedia pada jadwal tersebut'}
            </span>
          )}
        </div>
        {avail && !avail.available && avail.alternatives.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">Saran fasilitas alternatif (kategori sama, jadwal kosong)</p>
            <ul className="mt-2 space-y-1 text-sm text-amber-900">
              {avail.alternatives.map((a) => (
                <li key={a.id} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-amber-600" />
                  {a.name} — {a.location ?? '-'}
                  {a.capacity ? ` (kap. ${a.capacity})` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <Section title="Penanggung Jawab & Kontak" desc="Data PIC yang dapat dihubungi.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Penanggung Jawab" error={errs.personInCharge} required>
            <Input name="personInCharge" defaultValue={initial?.personInCharge} required />
          </Field>
          <Field label="NIM / NIDN / ID PIC" error={errs.identityNumber}>
            <Input name="identityNumber" defaultValue={initial?.identityNumber ?? ''} />
          </Field>
          <Field label="Email" error={errs.email} required>
            <Input type="email" name="email" defaultValue={initial?.email} required />
          </Field>
          <Field label="No HP" error={errs.phone} required>
            <Input name="phone" defaultValue={initial?.phone} required />
          </Field>
        </div>
      </Section>

      <Section title="Tujuan & Deskripsi" desc="Jelaskan tujuan dan rangkaian kegiatan.">
        <div className="space-y-4">
          <Field label="Tujuan Kegiatan" error={errs.purpose} required>
            <Textarea name="purpose" defaultValue={initial?.purpose} rows={2} required />
          </Field>
          <Field label="Deskripsi Kegiatan" error={errs.description} required>
            <Textarea name="description" defaultValue={initial?.description} rows={3} required />
          </Field>
          <Field label="Kebutuhan Tambahan" error={errs.additionalNeeds} hint="Contoh: sound system, kursi tambahan, dll.">
            <Textarea name="additionalNeeds" defaultValue={initial?.additionalNeeds ?? ''} rows={2} />
          </Field>
          <Field label="Lampiran (URL surat/proposal, opsional)" error={errs.attachmentUrl}>
            <Input name="attachmentUrl" defaultValue={initial?.attachmentUrl ?? ''} placeholder="https://..." />
          </Field>
          <Field label="Catatan Tambahan" error={errs.notes}>
            <Textarea name="notes" defaultValue={initial?.notes ?? ''} rows={2} />
          </Field>
        </div>
      </Section>

      {state?.error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-medium text-rose-800">{state.error}</p>
          {state.alternatives && state.alternatives.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-rose-900">
              {state.alternatives.map((a) => (
                <li key={a.id} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-rose-600" />
                  Alternatif: {a.name} — {a.location ?? '-'}
                  {a.capacity ? ` (kap. ${a.capacity})` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? 'Mengirim...' : mode === 'create' ? 'Ajukan Peminjaman' : 'Submit Ulang Revisi'}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-4 border-b border-slate-100 pb-6 sm:grid-cols-3">
      <div className="sm:col-span-1">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {desc && <p className="mt-1 text-xs text-slate-500">{desc}</p>}
      </div>
      <div className="sm:col-span-2">{children}</div>
    </div>
  );
}

function toLocal(d: Date | string): string {
  const x = new Date(d);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}
