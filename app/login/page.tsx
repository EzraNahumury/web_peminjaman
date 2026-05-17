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
  const [state, action, pending] = useActionState<FormState, FormData>(login, undefined);
  const errs = state?.fieldErrors ?? {};

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg ring-1 ring-gray-100">
      <h1 className="text-2xl font-bold text-gray-900">Masuk</h1>
      <p className="mt-1 text-sm text-gray-500">Gunakan akun yang sudah terdaftar.</p>

      {registered && (
        <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          Pendaftaran berhasil. Silakan masuk.
        </div>
      )}

      <form action={action} className="mt-6 space-y-4">
        <Field label="Email" error={errs.email}>
          <Input type="email" name="email" required />
        </Field>
        <Field label="Password" error={errs.password}>
          <Input type="password" name="password" required />
        </Field>
        {state?.error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.error}</div>
        )}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Memproses...' : 'Masuk'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Belum punya akun?{' '}
        <Link href="/register" className="font-medium text-blue-600 hover:text-blue-700">
          Daftar Pengurus
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <Suspense fallback={<div className="text-sm text-gray-500">Memuat...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
