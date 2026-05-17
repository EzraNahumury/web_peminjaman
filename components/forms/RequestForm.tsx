'use client';
import { useActionState, useState, useTransition } from 'react';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { checkAvailability, createFacilityRequest, updateRevisionRequest, type RequestFormState } from '@/app/actions/requests';
import type { Facility, FacilityRequest } from '@/types';

type Props = {
  facilities: Facility[];
  mode: 'create' | 'edit';
  initial?: FacilityRequest;
};

export function RequestForm({ facilities, mode, initial }: Props) {
  const action = mode === 'create'
    ? createFacilityRequest
    : updateRevisionRequest.bind(null, initial!.id);
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
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fasilitas" error={errs.facilityId}>
          <Select name="facilityId" value={facilityId} onChange={(e) => setFacilityId(e.target.value)} required>
            <option value="">-- Pilih fasilitas --</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} — {f.category} {f.capacity ? `(kap. ${f.capacity})` : ''}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nama Kegiatan" error={errs.activityName}>
          <Input name="activityName" defaultValue={initial?.activityName} required />
        </Field>
        <Field label="Nama Organisasi / LK / OK" error={errs.organizationName}>
          <Input name="organizationName" defaultValue={initial?.organizationName} required />
        </Field>
        <Field label="Penanggung Jawab" error={errs.personInCharge}>
          <Input name="personInCharge" defaultValue={initial?.personInCharge} required />
        </Field>
        <Field label="NIM/NIDN/ID PIC" error={errs.identityNumber}>
          <Input name="identityNumber" defaultValue={initial?.identityNumber ?? ''} />
        </Field>
        <Field label="Email" error={errs.email}>
          <Input type="email" name="email" defaultValue={initial?.email} required />
        </Field>
        <Field label="No HP" error={errs.phone}>
          <Input name="phone" defaultValue={initial?.phone} required />
        </Field>
        <Field label="Perkiraan Jumlah Peserta" error={errs.participantCount}>
          <Input type="number" name="participantCount" defaultValue={initial?.participantCount ?? ''} min={0} />
        </Field>
        <Field label="Tanggal & Jam Mulai" error={errs.startDateTime}>
          <Input type="datetime-local" name="startDateTime" value={start} onChange={(e) => setStart(e.target.value)} required />
        </Field>
        <Field label="Tanggal & Jam Selesai" error={errs.endDateTime}>
          <Input type="datetime-local" name="endDateTime" value={end} onChange={(e) => setEnd(e.target.value)} required />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="secondary" onClick={doCheck} disabled={checking}>
          {checking ? 'Mengecek...' : 'Cek Ketersediaan'}
        </Button>
        {avail && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              avail.available ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {avail.available ? 'Fasilitas tersedia' : 'Fasilitas tidak tersedia pada jadwal tersebut'}
          </span>
        )}
      </div>

      {avail && !avail.available && avail.alternatives.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-medium text-amber-800">Saran fasilitas alternatif (kategori sama, jadwal kosong):</p>
          <ul className="mt-2 list-inside list-disc text-sm text-amber-900">
            {avail.alternatives.map((a) => (
              <li key={a.id}>
                {a.name} — {a.location ?? '-'} {a.capacity ? `(kap. ${a.capacity})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Field label="Tujuan Kegiatan" error={errs.purpose}>
        <Textarea name="purpose" defaultValue={initial?.purpose} rows={2} required />
      </Field>
      <Field label="Deskripsi Kegiatan" error={errs.description}>
        <Textarea name="description" defaultValue={initial?.description} rows={3} required />
      </Field>
      <Field label="Kebutuhan Tambahan" error={errs.additionalNeeds}>
        <Textarea name="additionalNeeds" defaultValue={initial?.additionalNeeds ?? ''} rows={2} />
      </Field>
      <Field label="Lampiran (URL surat/proposal, opsional)" error={errs.attachmentUrl}>
        <Input name="attachmentUrl" defaultValue={initial?.attachmentUrl ?? ''} placeholder="https://..." />
      </Field>
      <Field label="Catatan Tambahan" error={errs.notes}>
        <Textarea name="notes" defaultValue={initial?.notes ?? ''} rows={2} />
      </Field>

      {state?.error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
          {state.alternatives && state.alternatives.length > 0 && (
            <ul className="mt-2 list-inside list-disc">
              {state.alternatives.map((a) => (
                <li key={a.id}>
                  Alternatif: {a.name} — {a.location ?? '-'} {a.capacity ? `(kap. ${a.capacity})` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Mengirim...' : mode === 'create' ? 'Ajukan Peminjaman' : 'Submit Ulang Revisi'}
        </Button>
      </div>
    </form>
  );
}

function toLocal(d: Date | string): string {
  const x = new Date(d);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}
