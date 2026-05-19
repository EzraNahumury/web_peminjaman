import Link from 'next/link';
import { getSession } from '@/lib/session';
import { dashboardPathForRole } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getSession();
  if (session?.userId && session.isActive !== false) {
    redirect(dashboardPathForRole(session.role));
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[var(--neutral-50)]">
      <div
        className="absolute inset-x-0 top-0 -z-10 h-[480px]"
        style={{
          background:
            'radial-gradient(60% 80% at 50% 0%, rgba(26,122,60,0.10) 0%, transparent 65%)',
        }}
      />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-700)] text-white shadow-[var(--shadow-sm)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21V11M15 21V11" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-[var(--neutral-900)]">FASKO</p>
            <p className="text-[10px] text-[var(--neutral-500)]">Fasilitas Kampus Online · UKDW</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="inline-flex h-9 items-center rounded-[var(--radius-md)] px-3 text-sm font-medium text-[var(--neutral-700)] hover:bg-[var(--neutral-100)]"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="inline-flex h-9 items-center rounded-[var(--radius-md)] bg-[var(--primary-700)] px-4 text-sm font-medium text-white shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--primary-800)]"
          >
            Daftar Pengurus
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--neutral-200)] bg-white/80 px-3 py-1 text-[11px] font-medium text-[var(--neutral-700)] backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary-500)] animate-pulse" />
            Sistem digital approval chain · UKDW
          </span>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-[var(--neutral-900)] sm:text-5xl">
            Peminjaman fasilitas kampus,<br />
            <span className="text-[var(--primary-700)]">tanpa repot tanda tangan fisik.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--neutral-600)]">
            Ajukan, lacak, dan dapatkan persetujuan peminjaman fasilitas UKDW dalam hitungan jam. Dari Pengurus LK/OK ke
            Biro III, WR3/WD3, dan Admin Biro — semua di satu platform.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-[var(--radius-md)] bg-[var(--primary-700)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--primary-800)]"
            >
              Masuk ke akun
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="ml-1.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/register"
              className="inline-flex h-11 items-center rounded-[var(--radius-md)] border border-[var(--neutral-300)] bg-white px-5 text-sm font-semibold text-[var(--neutral-800)] transition-colors hover:bg-[var(--neutral-50)]"
            >
              Daftar Pengurus LK/OK
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-4 sm:grid-cols-3">
          <Feature
            title="Kalender real-time"
            desc="Cek ketersediaan fasilitas dengan deteksi overlap jadwal otomatis sebelum mengajukan."
            icon="M8 2v3M16 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
          />
          <Feature
            title="Approval chain digital"
            desc="Tiga tahap validasi otomatis: Biro III → WR3/WD3 → Admin Biro/Unit dengan notifikasi instan."
            icon="M9 12 11 14 15 10M21 12C21 16.97 16.97 21 12 21 7.03 21 3 16.97 3 12 3 7.03 7.03 3 12 3 16.97 3 21 7.03 21 12Z"
          />
          <Feature
            title="Audit trail lengkap"
            desc="Riwayat tiap aksi tersimpan: siapa, kapan, dan dengan catatan apa. Surat resmi otomatis."
            icon="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"
          />
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-10 text-center text-[11px] text-[var(--neutral-500)]">
        © {new Date().getFullYear()} Universitas Kristen Duta Wacana
      </footer>
    </main>
  );
}

function Feature({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <div className="group rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-5 text-left shadow-[var(--shadow-xs)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-50)] text-[var(--primary-700)] ring-1 ring-[var(--primary-100)]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </div>
      <h3 className="mt-3.5 text-[15px] font-semibold tracking-tight text-[var(--neutral-900)]">{title}</h3>
      <p className="mt-1 text-[13px] leading-relaxed text-[var(--neutral-600)]">{desc}</p>
    </div>
  );
}
