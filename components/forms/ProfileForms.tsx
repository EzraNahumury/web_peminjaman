'use client';
import Image from 'next/image';
import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Field, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import {
  changePassword,
  removeOrganizationLogo,
  updateProfile,
  uploadOrganizationLogo,
  type ProfileFormState,
} from '@/app/actions/profile';
import type { User } from '@/types';

function Alert({ state }: { state: ProfileFormState }) {
  if (state?.error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
        {state.error}
      </div>
    );
  }
  if (state?.success) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">
        {state.success}
      </div>
    );
  }
  return null;
}

export function ProfileEditForm({ user }: { user: User }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(updateProfile, undefined);
  const errs = state?.fieldErrors ?? {};
  const isPengurus = user.role === 'PENGURUS';

  useEffect(() => {
    if (state?.success) {
      toast.success('Profil disimpan', { description: state.success });
      router.refresh();
    } else if (state?.error) {
      toast.error('Gagal menyimpan', { description: state.error });
    }
  }, [state, router]);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama Lengkap" error={errs.name} required>
          <Input name="name" defaultValue={user.name} required />
        </Field>
        <Field label="Email" error={errs.email} hint="Email dipakai untuk login dan notifikasi." required>
          <Input type="email" name="email" defaultValue={user.email} required autoComplete="email" />
        </Field>
        <Field label="No HP" error={errs.phone} required>
          <Input name="phone" defaultValue={user.phone ?? ''} required />
        </Field>
        <Field label={isPengurus ? 'NIM / NIDN / ID' : 'ID'} error={errs.identityNumber}>
          <Input name="identityNumber" defaultValue={user.identityNumber ?? ''} />
        </Field>
        {isPengurus && (
          <div className="sm:col-span-2">
            <Field label="Nama Organisasi / LK / OK" error={errs.organizationName}>
              <Input name="organizationName" defaultValue={user.organizationName ?? ''} />
            </Field>
          </div>
        )}
      </div>
      <Alert state={state} />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(changePassword, undefined);
  const errs = state?.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Password Lama" error={errs.currentPassword} required>
          <Input type="password" name="currentPassword" required autoComplete="current-password" />
        </Field>
        <Field label="Password Baru" error={errs.newPassword} hint="Minimal 6 karakter" required>
          <Input type="password" name="newPassword" required autoComplete="new-password" />
        </Field>
        <Field label="Konfirmasi" error={errs.confirmPassword} required>
          <Input type="password" name="confirmPassword" required autoComplete="new-password" />
        </Field>
      </div>
      <Alert state={state} />
      <div className="flex justify-end">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? 'Memproses...' : 'Ganti Password'}
        </Button>
      </div>
    </form>
  );
}

export function LogoUploadForm({ user }: { user: User }) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(uploadOrganizationLogo, undefined);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-slate-200">
          {user.organizationLogoUrl ? (
            <Image
              src={user.organizationLogoUrl}
              alt="Logo organisasi"
              width={80}
              height={80}
              className="h-full w-full object-contain"
              unoptimized
            />
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            {user.organizationLogoUrl ? 'Logo aktif' : 'Belum ada logo'}
          </p>
          <p className="text-xs text-slate-500">Format PNG / JPG / WEBP, maks 2 MB. Logo akan muncul di header surat.</p>
        </div>
        {user.organizationLogoUrl && (
          <form action={removeOrganizationLogo}>
            <Button type="submit" variant="outline" size="sm">Hapus</Button>
          </form>
        )}
      </div>
      <form action={action} className="space-y-3">
        <input
          type="file"
          name="logo"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          required
          className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
        />
        <Alert state={state} />
        <div className="flex justify-end">
          <Button type="submit" disabled={pending}>
            {pending ? 'Mengunggah...' : 'Unggah Logo'}
          </Button>
        </div>
      </form>
    </div>
  );
}
