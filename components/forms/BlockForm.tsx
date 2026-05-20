'use client';
import { useActionState } from 'react';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { createFacilityBlock, type BlockFormState } from '@/app/actions/blocks';
import { MANAGING_UNIT_LABEL, type Facility, type ManagingUnit } from '@/types';

const UNIT_ORDER: ManagingUnit[] = ['BIRO_I', 'BIRO_IV', 'PPLK', 'KRT', 'LPAIP'];

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

  return (
    <form action={action} className="space-y-4">
      <Field
        label="Fasilitas"
        error={errs.facilityId}
        hint={canBlockAll ? "Pilih 'Semua Fasilitas' untuk memblokir seluruh kampus." : 'Hanya fasilitas dalam lingkup unit Anda.'}
      >
        <Select name="facilityId" defaultValue={defaultFacilityId}>
          {canBlockAll && <option value="ALL">Semua Fasilitas (block kampus-wide)</option>}
          {UNIT_ORDER.map((unit) => {
            const items = facilities.filter((f) => f.managingUnit === unit);
            if (items.length === 0) return null;
            return (
              <optgroup key={unit} label={MANAGING_UNIT_LABEL[unit]}>
                {items.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} — {f.category}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mulai" error={errs.startDateTime} required>
          <Input type="datetime-local" name="startDateTime" required />
        </Field>
        <Field label="Selesai" error={errs.endDateTime} required>
          <Input type="datetime-local" name="endDateTime" required />
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
