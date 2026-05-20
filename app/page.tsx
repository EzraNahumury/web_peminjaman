import Link from 'next/link';
import { Suspense } from 'react';
import { getSession } from '@/lib/session';
import { dashboardPathForRole, getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LandingLoginForm from './_landing/LandingLoginForm';

export default async function Home() {
  const session = await getSession();
  if (session?.userId) {
    // Only redirect when the user actually exists in DB & is active.
    // Stale JWTs (e.g. after re-seed) just fall through to the login form,
    // and the next successful login will overwrite the cookie.
    const user = await getCurrentUser();
    if (user && user.isActive) {
      redirect(dashboardPathForRole(user.role));
    }
  }

  return (
    <main className="min-h-screen lg:grid lg:grid-cols-2">
      <section
        className="relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex"
        style={{
          background:
            'linear-gradient(160deg, var(--primary-900) 0%, var(--primary-800) 55%, var(--primary-700) 100%)',
        }}
      >
        <div
          className="pointer-events-none absolute -left-24 top-1/3 h-[420px] w-[420px] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(52,196,111,0.45) 0%, transparent 60%)' }}
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-[360px] w-[360px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(109,220,151,0.5) 0%, transparent 60%)' }}
        />

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-white/15 ring-1 ring-white/25 backdrop-blur">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21V11M15 21V11" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">FASKO</p>
            <p className="text-[10px] text-white/65">Fasilitas Kampus Online · UKDW</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/85 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary-300)]" />
            Portal Peminjaman
          </span>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight">
            Pinjam fasilitas kampus,<br />
            secepat menjadwalkan kuliah.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-white/75">
            Aula, ruang rapat, laboratorium, lapangan, perlengkapan multimedia —
            semua bisa diajukan, dijadwalkan, dan disetujui dari satu portal terpadu.
          </p>
        </div>

        <div className="relative grid max-w-md grid-cols-3 gap-6 border-t border-white/15 pt-6">
          <Stat value="108+" label="fasilitas terdaftar" />
          <Stat value="4.2k" label="peminjaman diproses" />
          <Stat value="97%" label="disetujui tepat waktu" />
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center bg-white px-6 py-12 sm:px-10">
        <div className="absolute right-6 top-6 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-700)] text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21V11M15 21V11" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-[var(--neutral-900)]">FASKO</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-7">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--neutral-900)]">Masuk ke akun</h2>
            <p className="mt-1.5 text-sm text-[var(--neutral-500)]">
              Gunakan akun UKDW Anda untuk mulai mengajukan peminjaman.
            </p>
          </div>

          <Suspense fallback={<div className="text-sm text-[var(--neutral-500)]">Memuat…</div>}>
            <LandingLoginForm />
          </Suspense>

          <p className="mt-6 text-center text-sm text-[var(--neutral-600)]">
            Belum punya akun?{' '}
            <Link href="/register" className="font-semibold text-[var(--primary-700)] hover:text-[var(--primary-800)]">
              Daftar Pengurus LK/OK
            </Link>
          </p>
        </div>

        <p className="absolute bottom-4 left-0 right-0 text-center text-[11px] text-[var(--neutral-400)]">
          © {new Date().getFullYear()} Universitas Kristen Duta Wacana
        </p>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-wide text-white/60">{label}</p>
    </div>
  );
}
