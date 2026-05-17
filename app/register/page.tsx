'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { registerPengurus, type FormState } from '@/app/actions/auth';
import { Field, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(registerPengurus, undefined);
  const errs = state?.fieldErrors ?? {};

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">Daftar Pengurus LK/OK</h1>
        <p className="mt-1 text-sm text-gray-500">Hanya untuk Pengurus LK/OK. Role lain dibuat oleh Super Admin.</p>

        <form action={action} className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Nama Lengkap" error={errs.name}>
            <Input name="name" required />
          </Field>
          <Field label="Email" error={errs.email}>
            <Input type="email" name="email" required />
          </Field>
          <Field label="Nama Organisasi / LK / OK" error={errs.organizationName}>
            <Input name="organizationName" required />
          </Field>
          <Field label="Nomor HP" error={errs.phone}>
            <Input name="phone" required />
          </Field>
          <Field label="Password" error={errs.password} hint="Minimal 6 karakter">
            <Input type="password" name="password" required />
          </Field>
          <Field label="Konfirmasi Password" error={errs.confirmPassword}>
            <Input type="password" name="confirmPassword" required />
          </Field>
          <div className="sm:col-span-2">
            <Field label="NIM/NIDN/ID PIC (opsional)" error={errs.identityNumber}>
              <Input name="identityNumber" />
            </Field>
          </div>

          {state?.error && (
            <div className="sm:col-span-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? 'Mendaftarkan...' : 'Daftar'}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
            Masuk
          </Link>
        </p>
      </div>
    </main>
  );
}
