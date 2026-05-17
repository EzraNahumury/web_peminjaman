'use client';
import { useActionState } from 'react';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import {
  createFacility,
  updateFacility,
  type FacilityFormState,
} from '@/app/actions/facilities';
import { MANAGING_UNIT_LABEL, type Facility, type ManagingUnit } from '@/types';

const UNIT_ORDER: ManagingUnit[] = ['BIRO_I', 'BIRO_IV', 'PPLK', 'KRT', 'LPAIP'];
const COMMON_CATEGORIES = [
  'Ruang Kelas',
  'Ruang Tutorial',
  'Ruangan',
  'Auditorium',
  'Aula',
  'Laboratorium',
  'Studio',
  'Peralatan',
  'Kendaraan',
];

export function FacilityForm({ mode, initial }: { mode: 'create' | 'edit'; initial?: Facility }) {
  const action = mode === 'create' ? createFacility : updateFacility.bind(null, initial!.id);
  const [state, formAction, pending] = useActionState<FacilityFormState, FormData>(action, undefined);
  const errs = state?.fieldErrors ?? {};
  const isActive = initial?.isActive ?? 1;

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama Fasilitas" error={errs.name} required>
          <Input name="name" defaultValue={initial?.name} required />
        </Field>
        <Field label="Kategori" error={errs.category} required>
          <Input name="category" defaultValue={initial?.category} list="cat-list" required />
          <datalist id="cat-list">
            {COMMON_CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Unit Pengelola" error={errs.managingUnit} required>
          <Select name="managingUnit" defaultValue={initial?.managingUnit ?? 'BIRO_I'} required>
            {UNIT_ORDER.map((u) => (
              <option key={u} value={u}>
                {MANAGING_UNIT_LABEL[u]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Kapasitas" error={errs.capacity} hint="Kosongkan untuk fasilitas peralatan.">
          <Input type="number" name="capacity" defaultValue={initial?.capacity ?? ''} min={0} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Lokasi" error={errs.location}>
            <Input name="location" defaultValue={initial?.location ?? ''} placeholder="Gedung A Lt.2" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Deskripsi" error={errs.description}>
            <Textarea name="description" defaultValue={initial?.description ?? ''} rows={3} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={Boolean(isActive)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="font-medium text-slate-700">Fasilitas Aktif</span>
            <span className="text-xs text-slate-500">— Jika non-aktif, tidak muncul untuk dipinjam.</span>
          </label>
        </div>
      </div>

      {state?.error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {state.error}
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? 'Menyimpan...' : mode === 'create' ? 'Tambah Fasilitas' : 'Simpan Perubahan'}
        </Button>
      </div>
    </form>
  );
}
