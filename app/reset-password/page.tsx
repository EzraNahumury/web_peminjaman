'use client';
import { Suspense, useActionState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, KeyRound, ShieldAlert } from 'lucide-react';
import { resetPassword, type ResetPasswordState } from '@/app/actions/auth';
import { Field } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';

function ResetPasswordForm() {
  const token = useSearchParams().get('token') ?? '';
  const [state, action, pending] = useActionState<ResetPasswordState, FormData>(
    resetPassword,
    undefined
  );
  const errs = state?.fieldErrors ?? {};

  return (
    <div className="w-full max-w-[400px]">
      <div className="rounded-3xl border border-[var(--neutral-200)] bg-white px-8 py-10 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.18)] sm:px-9">
        {state?.done ? (
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-50)] text-[var(--primary-700)] ring-1 ring-[var(--primary-100)]">
              <CheckCircle2 size={22} />
            </div>
            <h1 className="mt-4 text-[20px] font-bold tracking-tight text-[var(--neutral-900)]">
              Password berhasil diubah
            </h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--neutral-600)]">
              Silakan masuk kembali dengan password baru Anda.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary-700)] to-[var(--primary-900)] text-[14px] font-semibold text-white shadow-[0_6px_20px_rgba(26,122,60,0.35)]"
            >
              Masuk Sekarang
            </Link>
          </div>
        ) : !token ? (
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">
              <ShieldAlert size={22} />
            </div>
            <h1 className="mt-4 text-[20px] font-bold tracking-tight text-[var(--neutral-900)]">
              Tautan tidak lengkap
            </h1>
            <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--neutral-600)]">
              Token reset tidak ditemukan pada tautan. Silakan minta tautan reset yang baru.
            </p>
            <Link
              href="/forgot-password"
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary-700)] to-[var(--primary-900)] text-[14px] font-semibold text-white shadow-[0_6px_20px_rgba(26,122,60,0.35)]"
            >
              Minta Tautan Baru
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-7">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-50)] text-[var(--primary-700)] ring-1 ring-[var(--primary-100)]">
                <KeyRound size={20} />
              </div>
              <h1 className="mt-4 text-[22px] font-bold leading-tight tracking-tight text-[var(--neutral-900)]">
                Buat password baru
              </h1>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--neutral-500)]">
                Masukkan password baru untuk akun Anda. Minimal 6 karakter.
              </p>
            </div>

            <form action={action} className="space-y-5">
              <input type="hidden" name="token" value={token} />
              <Field label="Password baru" error={errs.password}>
                <PasswordInput
                  name="password"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="h-11 rounded-xl"
                />
              </Field>
              <Field label="Konfirmasi password" error={errs.confirmPassword}>
                <PasswordInput
                  name="confirmPassword"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                  className="h-11 rounded-xl"
                />
              </Field>

              {state?.error && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50/80 px-3.5 py-2.5 text-sm text-rose-700">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  {state.error}
                </div>
              )}

              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary-700)] to-[var(--primary-900)] text-[15px] font-semibold text-white shadow-[0_6px_20px_rgba(26,122,60,0.38)] transition-all hover:shadow-[0_10px_28px_rgba(26,122,60,0.45)] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {pending ? 'Menyimpan…' : 'Simpan password baru'}
              </button>
            </form>
          </>
        )}
      </div>

      <p className="mt-5 text-center text-xs text-[var(--neutral-500)]">
        <Link
          href="/login"
          className="group inline-flex items-center gap-1 transition-colors hover:text-[var(--neutral-800)]"
        >
          <ArrowLeft size={11} className="transition-transform group-hover:-translate-x-0.5" />
          Kembali ke Login
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[var(--neutral-50)] px-4 py-10">
      <Suspense fallback={<div className="text-sm text-[var(--neutral-500)]">Memuat…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
