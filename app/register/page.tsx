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
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(99,102,241,0.12),transparent_60%)]" />
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M20 8v6M23 11h-6" /><circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Daftar Pengurus LK/OK</h1>
              <p className="text-sm text-slate-500">Khusus untuk Pengurus LK/OK.</p>
            </div>
          </div>

          <form action={action} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama Lengkap" error={errs.name} required>
              <Input name="name" required />
            </Field>
            <Field label="Email" error={errs.email} required>
              <Input type="email" name="email" required autoComplete="email" />
            </Field>
            <Field label="Nama Organisasi / LK / OK" error={errs.organizationName} required>
              <Input name="organizationName" required />
            </Field>
            <Field label="Nomor HP" error={errs.phone} required>
              <Input name="phone" required />
            </Field>
            <Field label="Password" error={errs.password} hint="Minimal 6 karakter" required>
              <Input type="password" name="password" required autoComplete="new-password" />
            </Field>
            <Field label="Konfirmasi Password" error={errs.confirmPassword} required>
              <Input type="password" name="confirmPassword" required autoComplete="new-password" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="NIM / NIDN / ID PIC (opsional)" error={errs.identityNumber}>
                <Input name="identityNumber" />
              </Field>
            </div>

            {state?.error && (
              <div className="sm:col-span-2 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                </svg>
                {state.error}
              </div>
            )}

            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? 'Mendaftarkan...' : 'Daftar Sekarang'}
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
              Masuk
            </Link>
          </p>
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-700">← Kembali ke beranda</Link>
        </p>
      </div>
    </main>
  );
}
