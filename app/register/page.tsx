'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { registerPengurus, type FormState } from '@/app/actions/auth';
import { Field, Input } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';

export default function RegisterPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(registerPengurus, undefined);
  const errs = state?.fieldErrors ?? {};

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Animated mesh background */}
      <div className="absolute inset-0 -z-20 bg-[var(--neutral-50)]" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.4]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(15,23,42,0.06) 1px, transparent 0)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 100%)',
        }}
      />

      {/* Floating blobs */}
      <motion.div
        aria-hidden
        className="absolute -top-32 left-1/4 -z-10 h-[420px] w-[420px] rounded-full opacity-50 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(52,196,111,0.35), transparent 65%)' }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-0 right-1/4 -z-10 h-[480px] w-[480px] rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(26,122,60,0.35), transparent 65%)' }}
        animate={{ x: [0, -50, 0], y: [0, -40, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="absolute left-10 top-1/2 -z-10 h-72 w-72 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(109,220,151,0.4), transparent 65%)' }}
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg"
      >
        {/* Glow behind card */}
        <div
          aria-hidden
          className="absolute -inset-1 -z-10 rounded-[28px] opacity-60 blur-2xl"
          style={{
            background:
              'conic-gradient(from 180deg at 50% 50%, rgba(26,122,60,0.18), rgba(52,196,111,0.12), rgba(26,122,60,0.18))',
          }}
        />

        <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/85 p-8 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.25),0_0_0_1px_rgba(15,23,42,0.04)] backdrop-blur-xl">
          {/* Top gradient accent */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-px left-1/2 h-px w-3/4 -translate-x-1/2"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(26,122,60,0.6), transparent)',
            }}
          />
          {/* Decorative corner blob */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-40 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(52,196,111,0.55), transparent 65%)' }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.35, 0.5, 0.35] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="relative mb-7 flex items-center gap-3"
          >
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-1 rounded-2xl opacity-70 blur-md"
                style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-800))' }}
              />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary-600)] to-[var(--primary-800)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_12px_rgba(26,122,60,0.35)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M20 8v6M23 11h-6" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="flex items-center gap-1.5 text-[19px] font-bold tracking-tight text-[var(--neutral-900)]">
                Daftar Pengurus LK/OK
                <Sparkles size={13} className="text-[var(--primary-600)]" />
              </h1>
              <p className="text-[13px] text-[var(--neutral-500)]">
                Akun aktif setelah disetujui Super Admin.
              </p>
            </div>
          </motion.div>

          <form action={action} className="relative grid gap-4 sm:grid-cols-2">
            {[
              <Field key="name" label="Nama Lengkap" error={errs.name} required>
                <Input name="name" required />
              </Field>,
              <Field
                key="email"
                label="Email"
                error={errs.email}
                hint="Wajib pakai email kampus @students.ukdw.ac.id"
                required
              >
                <Input
                  type="email"
                  name="email"
                  placeholder="nama@students.ukdw.ac.id"
                  required
                  autoComplete="email"
                />
              </Field>,
              <Field key="org" label="Nama Organisasi / LK / OK" error={errs.organizationName} required>
                <Input name="organizationName" required />
              </Field>,
              <Field key="phone" label="Nomor HP" error={errs.phone} required>
                <Input name="phone" required />
              </Field>,
              <Field key="pw" label="Password" error={errs.password} hint="Minimal 6 karakter" required>
                <PasswordInput name="password" required autoComplete="new-password" />
              </Field>,
              <Field key="cpw" label="Konfirmasi Password" error={errs.confirmPassword} required>
                <PasswordInput name="confirmPassword" required autoComplete="new-password" />
              </Field>,
            ].map((node, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.05, duration: 0.32 }}
              >
                {node}
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42, duration: 0.32 }}
              className="sm:col-span-2"
            >
              <Field label="NIM / NIDN / ID PIC (opsional)" error={errs.identityNumber}>
                <Input name="identityNumber" />
              </Field>
            </motion.div>

            {state?.error && (
              <motion.div
                initial={{ opacity: 0, y: -6, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="sm:col-span-2 flex items-start gap-2 overflow-hidden rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-2.5 text-sm text-rose-700"
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
              transition={{ delay: 0.5, duration: 0.32 }}
              className="sm:col-span-2 pt-1"
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
                    Mendaftarkan…
                  </>
                ) : (
                  <>
                    Daftar Sekarang
                    <ArrowRight size={15} className="transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                  </>
                )}
              </button>
            </motion.div>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.58, duration: 0.4 }}
            className="relative mt-6 flex items-center gap-3"
          >
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--neutral-200)]" />
            <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--neutral-500)]">
              <ShieldCheck size={11} className="text-[var(--primary-600)]" />
              Data Anda terlindungi
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--neutral-200)]" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.62, duration: 0.4 }}
            className="mt-5 text-center text-sm text-[var(--neutral-600)]"
          >
            Sudah punya akun?{' '}
            <Link
              href="/login"
              className="font-semibold text-[var(--primary-700)] underline-offset-4 transition-colors hover:text-[var(--primary-800)] hover:underline"
            >
              Masuk
            </Link>
          </motion.p>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="mt-5 text-center text-xs text-[var(--neutral-500)]"
        >
          <Link
            href="/"
            className="group/back inline-flex items-center gap-1 transition-colors hover:text-[var(--neutral-800)]"
          >
            <ArrowLeft size={11} className="transition-transform group-hover/back:-translate-x-0.5" />
            Kembali ke beranda
          </Link>
        </motion.p>
      </motion.div>
    </main>
  );
}
