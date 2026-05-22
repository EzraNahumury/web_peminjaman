'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateAdminBureau, updateUserScope, createStaffUser, type StaffUserFormState } from '@/app/actions/users';
import { Field, Input, Select } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { MANAGING_UNIT_LABEL, type ActivityScope, type ManagingUnit } from '@/types';

const BUREAUS: ManagingUnit[] = ['BIRO_I', 'BIRO_IV', 'PPLK', 'KRT', 'LPAIP'];

export function AdminBureauForm({
  userId,
  initialBureau,
}: {
  userId: number;
  initialBureau: ManagingUnit | null;
}) {
  const router = useRouter();
  const [bureau, setBureau] = useState<ManagingUnit>(initialBureau ?? 'BIRO_I');
  const [pending, start] = useTransition();

  function onSave() {
    start(async () => {
      const res = await updateAdminBureau(userId, bureau);
      if ('error' in res) {
        toast.error('Gagal menyimpan', { description: res.error });
        return;
      }
      toast.success('Unit pengelola disimpan');
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        size="sm"
        fullWidth={false}
        value={bureau}
        onChange={(e) => setBureau(e.target.value as ManagingUnit)}
        className="min-w-[10.5rem]"
      >
        {BUREAUS.map((b) => (
          <option key={b} value={b}>
            {MANAGING_UNIT_LABEL[b]}
          </option>
        ))}
      </Select>
      <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onSave}>
        {pending ? 'Menyimpan…' : 'Simpan'}
      </Button>
    </div>
  );
}

export function Wr3ScopeForm({
  userId,
  initialScope,
}: {
  userId: number;
  initialScope: ActivityScope | null;
}) {
  const router = useRouter();
  const [scope, setScope] = useState<ActivityScope>(initialScope ?? 'UNIVERSITAS');
  const [pending, start] = useTransition();

  function onSave() {
    start(async () => {
      const res = await updateUserScope(userId, scope);
      if ('error' in res) {
        toast.error('Gagal menyimpan', { description: res.error });
        return;
      }
      toast.success('Lingkup WR3/WD3 disimpan');
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        size="sm"
        fullWidth={false}
        value={scope}
        onChange={(e) => setScope(e.target.value as ActivityScope)}
        className="min-w-[11rem]"
      >
        <option value="UNIVERSITAS">WR3 (Universitas)</option>
        <option value="FAKULTAS">WD3 (Fakultas)</option>
      </Select>
      <Button type="button" size="sm" variant="outline" disabled={pending} onClick={onSave}>
        {pending ? 'Menyimpan…' : 'Simpan'}
      </Button>
    </div>
  );
}

export function CreateStaffUserForm() {
  const router = useRouter();
  const [role, setRole] = useState<'BIRO_III' | 'WR3_WD3' | 'ADMIN_UNIT'>('ADMIN_UNIT');
  const [userScope, setUserScope] = useState<ActivityScope>('UNIVERSITAS');
  const [bureauScope, setBureauScope] = useState<ManagingUnit>('BIRO_I');
  const [pending, start] = useTransition();
  const [errs, setErrs] = useState<Record<string, string[]>>({});

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set('role', role);
    if (role === 'WR3_WD3') fd.set('userScope', userScope);
    if (role === 'ADMIN_UNIT') fd.set('bureauScope', bureauScope);

    setErrs({});
    start(async () => {
      const res: StaffUserFormState = await createStaffUser(undefined, fd);
      if (res?.fieldErrors) {
        setErrs(res.fieldErrors);
        toast.error('Periksa isian form');
        return;
      }
      if (res?.error) {
        toast.error('Gagal membuat akun', { description: res.error });
        return;
      }
      toast.success('Akun dibuat', { description: res?.success });
      router.push('/dashboard/super-admin/users');
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama Lengkap" error={errs.name} required>
          <Input name="name" required placeholder="Nama pegawai / validator" />
        </Field>
        <Field label="Email Login" error={errs.email} required>
          <Input type="email" name="email" required placeholder="nama@ukdw.ac.id" autoComplete="off" />
        </Field>
        <Field label="Password" error={errs.password} required>
          <PasswordInput name="password" required autoComplete="new-password" />
        </Field>
        <Field label="Konfirmasi Password" error={errs.confirmPassword} required>
          <PasswordInput name="confirmPassword" required autoComplete="new-password" />
        </Field>
        <Field label="No HP" error={errs.phone}>
          <Input name="phone" placeholder="08xxxxxxxxxx" />
        </Field>
        <Field label="Role" required>
          <Select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
          >
            <option value="BIRO_III">Biro III Kemahasiswaan</option>
            <option value="WR3_WD3">WR3 / WD3</option>
            <option value="ADMIN_UNIT">Admin Unit (Biro / PPLK / KRT / LPAIP)</option>
          </Select>
        </Field>
        {role === 'WR3_WD3' && (
          <Field label="Lingkup" error={errs.userScope} required>
            <Select
              value={userScope}
              onChange={(e) => setUserScope(e.target.value as ActivityScope)}
            >
              <option value="UNIVERSITAS">Tingkat Universitas (WR3)</option>
              <option value="FAKULTAS">Tingkat Fakultas (WD3)</option>
            </Select>
          </Field>
        )}
        {role === 'ADMIN_UNIT' && (
          <Field label="Unit Pengelola" error={errs.bureauScope} required>
            <Select
              value={bureauScope}
              onChange={(e) => setBureauScope(e.target.value as ManagingUnit)}
            >
              {BUREAUS.map((b) => (
                <option key={b} value={b}>
                  {MANAGING_UNIT_LABEL[b]}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Akun validator langsung aktif setelah dibuat. Pengurus LK/OK tetap mendaftar sendiri lalu menunggu aktivasi.
      </p>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Membuat akun…' : 'Buat Akun'}
        </Button>
      </div>
    </form>
  );
}
