'use client';
import { useActionState, useState } from 'react';
import { Field, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { createFacilityBlock, type BlockFormState } from '@/app/actions/blocks';
import { FacilityPicker } from '@/components/forms/FacilityPicker';
import { DateTimePicker } from '@/components/forms/DateTimePicker';
import type { Facility } from '@/types';

export function BlockForm({
  facilities,
  canBlockAll = true,
}: {
  facilities: Facility[];
  canBlockAll?: boolean;
}) {
  const [state, action, pending] = useActionState<BlockFormState, FormData>(createFacilityBlock, undefined);
  const errs = state?.fieldErrors ?? {};

  const defaultFacilityId = canBlockAll
    ? 'ALL'
    : facilities[0]
      ? String(facilities[0].id)
      : '';

  const [facilityId, setFacilityId] = useState(defaultFacilityId);
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');

  return (
    <form action={action} className="space-y-4">
      <Field
        label="Fasilitas"
        error={errs.facilityId}
        hint={canBlockAll ? "Pilih 'Semua Fasilitas' untuk memblokir seluruh kampus." : 'Hanya fasilitas dalam lingkup unit Anda.'}
      >
        <input type="hidden" name="facilityId" value={facilityId} />
        <FacilityPicker
          facilities={facilities}
          value={facilityId}
          onChange={setFacilityId}
          allowAll={canBlockAll}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mulai" error={errs.startDateTime} required>
          <DateTimePicker
            name="startDateTime"
            value={startDateTime}
            onChange={setStartDateTime}
            required
            datePlaceholder="Tanggal mulai"
            timePlaceholder="Jam mulai"
          />
        </Field>
        <Field label="Selesai" error={errs.endDateTime} required>
          <DateTimePicker
            name="endDateTime"
            value={endDateTime}
            onChange={setEndDateTime}
            min={startDateTime || undefined}
            required
            datePlaceholder="Tanggal selesai"
            timePlaceholder="Jam selesai"
          />
        </Field>
      </div>
      <Field label="Alasan / Keterangan" error={errs.reason} required hint="Contoh: Rapat Senat, Pemeliharaan, Kegiatan Internal.">
        <Textarea name="reason" rows={3} required />
      </Field>
      {state?.error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{state.error}</div>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Menyimpan...' : 'Blokir Jadwal'}
        </Button>
      </div>
    </form>
  );
}
