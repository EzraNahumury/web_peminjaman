'use client';
import { Suspense, useActionState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { login, type FormState } from '@/app/actions/auth';
import { Field, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

function LoginForm() {
  const sp = useSearchParams();
  const registered = sp.get('registered');
  const isPending = registered === 'pending';
  const [state, action, pending] = useActionState<FormState, FormData>(login, undefined);
  const errs = state?.fieldErrors ?? {};

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21V11M15 21V11" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Selamat Datang Kembali</h1>
            <p className="text-sm text-slate-500">Masuk ke akun Anda untuk melanjutkan.</p>
          </div>
        </div>

        {registered && (
          <div
            className={`mb-5 flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-sm ${
              isPending
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
              <path d={isPending ? 'M12 9v4M12 17h.01M5.07 19h13.86A2 2 0 0 0 20.66 16L13.73 4a2 2 0 0 0-3.46 0L3.34 16A2 2 0 0 0 5.07 19Z' : 'M20 6 9 17l-5-5'} />
            </svg>
            {isPending
              ? 'Pendaftaran berhasil. Akun Anda menunggu aktivasi Super Admin. Anda akan dapat login setelah disetujui.'
              : 'Pendaftaran berhasil. Silakan masuk.'}
          </div>
        )}

        <form action={action} className="space-y-4">
          <Field label="Email" error={errs.email}>
            <Input type="email" name="email" placeholder="nama@kampus.test" required autoComplete="email" />
          </Field>
          <Field label="Password" error={errs.password}>
            <Input type="password" name="password" placeholder="••••••••" required autoComplete="current-password" />
          </Field>
          {state?.error && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
              </svg>
              {state.error}
            </div>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Memproses...' : 'Masuk'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Belum punya akun?{' '}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-700">
            Daftar Pengurus
          </Link>
        </p>
      </div>
      <p className="mt-4 text-center text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-700">← Kembali ke beranda</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(99,102,241,0.12),transparent_60%)]" />
      <Suspense fallback={<div className="text-sm text-slate-500">Memuat...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
