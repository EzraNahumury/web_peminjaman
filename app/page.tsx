import Link from 'next/link';
import { getSession } from '@/lib/session';
import { dashboardPathForRole } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getSession();
  if (session?.userId) redirect(dashboardPathForRole(session.role));

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(99,102,241,0.15),transparent_60%),radial-gradient(60%_50%_at_100%_100%,rgba(59,130,246,0.12),transparent_60%)]" />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21V11M15 21V11" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-slate-900">Peminjaman Fasilitas</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            Masuk
          </Link>
          <Link href="/register" className="rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Daftar
          </Link>
        </div>
      </header>

      <section className="mx-auto flex max-w-6xl flex-col items-center justify-center px-6 py-20 text-center sm:py-28">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-700 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Approval Chain Otomatis
        </span>
        <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          {process.env.NEXT_PUBLIC_APP_NAME || 'Sistem Peminjaman Fasilitas Kampus'}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
          Platform digital pengajuan peminjaman fasilitas untuk Lembaga Kemahasiswaan & Organisasi Kemahasiswaan. Alur Pengurus → Biro III → WR3/WD3 → Admin Biro/Unit.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Masuk Sekarang
          </Link>
          <Link
            href="/register"
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Daftar sebagai Pengurus LK/OK
          </Link>
        </div>

        <div className="mt-16 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
          <Feature
            title="Cek Ketersediaan"
            desc="Kalender real-time + deteksi overlap otomatis dengan saran fasilitas alternatif."
            icon="M8 2v3M16 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
          />
          <Feature
            title="Approval Chain"
            desc="3 tahap review berurutan dengan notifikasi otomatis ke role berikutnya."
            icon="M9 12 11 14 15 10M21 12C21 16.97 16.97 21 12 21 7.03 21 3 16.97 3 12 3 7.03 7.03 3 12 3 16.97 3 21 7.03 21 12Z"
          />
          <Feature
            title="Audit Log Lengkap"
            desc="Riwayat lengkap aksi approval, revisi, penolakan, dengan timestamp."
            icon="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"
          />
        </div>
      </section>
    </main>
  );
}

function Feature({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/70 p-5 text-left shadow-sm backdrop-blur">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">{desc}</p>
    </div>
  );
}
