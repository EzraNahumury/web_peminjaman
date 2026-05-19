'use client';
import { Suspense, useActionState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full max-w-md"
    >
      <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-8 shadow-[var(--shadow-lg)]">
        <div className="mb-7 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-700)] text-white shadow-[var(--shadow-sm)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21V11M15 21V11" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-[var(--neutral-900)]">Masuk ke FASKO</h1>
            <p className="text-[13px] text-[var(--neutral-500)]">Gunakan akun terdaftar Anda.</p>
          </div>
        </div>

        {registered && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-5 flex items-start gap-2 rounded-[var(--radius-md)] border px-3.5 py-2.5 text-sm ${
              isPending
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-[var(--primary-200)] bg-[var(--primary-50)] text-[var(--primary-700)]'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
              <path d={isPending ? 'M12 9v4M12 17h.01M5.07 19h13.86A2 2 0 0 0 20.66 16L13.73 4a2 2 0 0 0-3.46 0L3.34 16A2 2 0 0 0 5.07 19Z' : 'M20 6 9 17l-5-5'} />
            </svg>
            {isPending
              ? 'Pendaftaran berhasil. Akun Anda menunggu aktivasi Super Admin.'
              : 'Pendaftaran berhasil. Silakan masuk.'}
          </motion.div>
        )}

        <form action={action} className="space-y-4">
          <Field label="Email" error={errs.email}>
            <Input type="email" name="email" placeholder="nama@students.ukdw.ac.id" required autoComplete="email" />
          </Field>
          <Field label="Password" error={errs.password}>
            <Input type="password" name="password" placeholder="••••••••" required autoComplete="current-password" />
          </Field>
          {state?.error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 rounded-[var(--radius-md)] border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              {state.error}
            </motion.div>
          )}
          <Button type="submit" disabled={pending} size="lg" className="w-full">
            {pending ? 'Memproses…' : 'Masuk'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--neutral-600)]">
          Belum punya akun?{' '}
          <Link href="/register" className="font-semibold text-[var(--primary-700)] hover:text-[var(--primary-800)]">
            Daftar Pengurus
          </Link>
        </p>
      </div>
      <p className="mt-4 text-center text-xs text-[var(--neutral-500)]">
        <Link href="/" className="hover:text-[var(--neutral-700)]">← Kembali ke beranda</Link>
      </p>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 0%, rgba(26,122,60,0.08) 0%, transparent 70%)',
        }}
      />
      <Suspense fallback={<div className="text-sm text-[var(--neutral-500)]">Memuat…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
