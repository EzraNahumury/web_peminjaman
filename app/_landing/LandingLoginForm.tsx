'use client';
import { useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { login, type FormState } from '@/app/actions/auth';
import { Field, Input } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';

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
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          transition={{ duration: 0.35 }}
          className={`relative mb-5 flex items-start gap-2 overflow-hidden rounded-xl border px-3.5 py-2.5 text-sm ${
            isPending
              ? 'border-amber-200 bg-amber-50/80 text-amber-800'
              : 'border-[var(--primary-200)] bg-[var(--primary-50)]/80 text-[var(--primary-800)]'
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

      <form action={action} className="relative space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.35 }}
        >
          <Field label="Email" error={errs.email}>
            <Input type="email" name="email" placeholder="nama@students.ukdw.ac.id" required autoComplete="email" />
          </Field>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.35 }}
        >
          <Field label="Password" error={errs.password}>
            <PasswordInput name="password" placeholder="••••••••" required autoComplete="current-password" />
          </Field>
        </motion.div>

        {state?.error && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-2.5 text-sm text-rose-700"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            {state.error}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
          className="pt-1"
        >
          <button
            type="submit"
            disabled={pending}
            className="group/btn relative inline-flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-[var(--primary-700)] to-[var(--primary-900)] px-4 text-[14px] font-semibold text-white shadow-[0_4px_14px_rgba(26,122,60,0.35),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-200 hover:shadow-[0_8px_22px_rgba(26,122,60,0.45),inset_0_1px_0_rgba(255,255,255,0.22)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-all duration-700 group-hover/btn:left-[110%] group-hover/btn:opacity-100"
            />
            {pending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Memproses…
              </>
            ) : (
              <>
                Masuk
                <ArrowRight size={15} className="transition-transform duration-200 group-hover/btn:translate-x-0.5" />
              </>
            )}
          </button>
        </motion.div>
      </form>
    </>
  );
}
