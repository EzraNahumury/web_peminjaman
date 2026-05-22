'use client';
import { Suspense, useActionState, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { login, type FormState } from '@/app/actions/auth';
import { Field, Input } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';
function LoginForm() {
  const sp = useSearchParams();
  const registered = sp.get('registered');
  const isPending = registered === 'pending';
  const [state, action, pending] = useActionState<FormState, FormData>(login, undefined);
  const errs = state?.fieldErrors ?? {};

  // Field email & password dikontrol agar reset-nya bisa diatur sesuai jenis error:
  // - password salah  → kosongkan password saja, email tetap.
  // - email tidak ada → kosongkan keduanya.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  useEffect(() => {
    if (state?.reason === 'WRONG_PASSWORD') {
      setPassword('');
    } else if (state?.reason === 'EMAIL_NOT_FOUND') {
      setEmail('');
      setPassword('');
    }
  }, [state]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-[400px]"
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

      <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/85 px-8 py-10 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.25),0_0_0_1px_rgba(15,23,42,0.04)] backdrop-blur-xl sm:px-9 sm:py-11">
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
          className="relative mb-9"
        >
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--primary-700)]">
            <Sparkles size={12} className="text-[var(--primary-600)]" />
            Login
          </p>
          <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-tight text-[var(--neutral-900)]">
            Selamat datang
          </h1>
          <p className="mt-2.5 text-[14px] leading-relaxed text-[var(--neutral-500)]">
            Masuk dengan akun UKDW untuk mulai mengajukan peminjaman.
          </p>
        </motion.div>

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

        <form action={action} className="relative space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.35 }}
          >
            <Field label="Email" error={errs.email}>
              <Input
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@students.ukdw.ac.id"
                required
                autoComplete="email"
                className="h-11 rounded-xl"
              />
            </Field>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.35 }}
          >
            <Field label="Password" error={errs.password}>
              <PasswordInput
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="h-11 rounded-xl"
              />
            </Field>
            <div className="mt-1.5 flex justify-end">
              <Link
                href="/forgot-password"
                className="text-[12.5px] font-medium text-[var(--primary-700)] underline-offset-2 transition-colors hover:text-[var(--primary-800)] hover:underline"
              >
                Lupa password?
              </Link>
            </div>
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
            className="pt-2"
          >
            <button
              type="submit"
              disabled={pending}
              className="group/btn relative inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-br from-[var(--primary-700)] to-[var(--primary-900)] px-4 text-[15px] font-semibold text-white shadow-[0_6px_20px_rgba(26,122,60,0.38),inset_0_1px_0_rgba(255,255,255,0.18)] transition-all duration-200 hover:shadow-[0_10px_28px_rgba(26,122,60,0.45),inset_0_1px_0_rgba(255,255,255,0.22)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {/* Shine sweep */}
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

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="relative mt-8 flex items-center gap-3"
        >
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--neutral-200)]" />
          <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--neutral-500)]">
            <ShieldCheck size={11} className="text-[var(--primary-600)]" />
            Koneksi aman & terenkripsi
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--neutral-200)]" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="mt-6 text-center text-sm text-[var(--neutral-600)]"
        >
          Belum punya akun?{' '}
          <Link
            href="/register"
            className="font-semibold text-[var(--primary-700)] underline-offset-4 transition-colors hover:text-[var(--primary-800)] hover:underline"
          >
            Daftar Pengurus
          </Link>
        </motion.p>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.4 }}
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
  );
}

export default function LoginPage() {
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

      <Suspense fallback={<div className="text-sm text-[var(--neutral-500)]">Memuat…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
