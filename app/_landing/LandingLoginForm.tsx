'use client';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { login, type FormState } from '@/app/actions/auth';
import { Field, Input } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';

export default function LandingLoginForm() {
  const sp = useSearchParams();
  const registered = sp.get('registered');
  const isPending = registered === 'pending';
  const [state, action, pending] = useActionState<FormState, FormData>(login, undefined);
  const errs = state?.fieldErrors ?? {};

  return (
    <>
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
          <PasswordInput name="password" placeholder="••••••••" required autoComplete="current-password" />
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
    </>
  );
}
