'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { registerPengurus, type FormState } from '@/app/actions/auth';
import { Field, Input } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(registerPengurus, undefined);
  const errs = state?.fieldErrors ?? {};

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 0%, rgba(26,122,60,0.08) 0%, transparent 70%)',
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-lg"
      >
        <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-8 shadow-[var(--shadow-lg)]">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-700)] text-white shadow-[var(--shadow-sm)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M20 8v6M23 11h-6" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-[var(--neutral-900)]">Daftar Pengurus LK/OK</h1>
              <p className="text-[13px] text-[var(--neutral-500)]">Akun akan aktif setelah disetujui Super Admin.</p>
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
              <PasswordInput name="password" required autoComplete="new-password" />
            </Field>
            <Field label="Konfirmasi Password" error={errs.confirmPassword} required>
              <PasswordInput name="confirmPassword" required autoComplete="new-password" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="NIM / NIDN / ID PIC (opsional)" error={errs.identityNumber}>
                <Input name="identityNumber" />
              </Field>
            </div>

            {state?.error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="sm:col-span-2 flex items-start gap-2 rounded-[var(--radius-md)] border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                {state.error}
              </motion.div>
            )}

            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending} size="lg" className="w-full">
                {pending ? 'Mendaftarkan…' : 'Daftar Sekarang'}
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--neutral-600)]">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-semibold text-[var(--primary-700)] hover:text-[var(--primary-800)]">
              Masuk
            </Link>
          </p>
        </div>
        <p className="mt-4 text-center text-xs text-[var(--neutral-500)]">
          <Link href="/" className="hover:text-[var(--neutral-700)]">← Kembali ke beranda</Link>
        </p>
      </motion.div>
    </main>
  );
}
