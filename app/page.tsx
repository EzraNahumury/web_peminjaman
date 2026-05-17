import Link from 'next/link';
import { getSession } from '@/lib/session';
import { dashboardPathForRole } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getSession();
  if (session?.userId) redirect(dashboardPathForRole(session.role));

  return (
    <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-6 py-16">
      <div className="w-full max-w-xl rounded-2xl bg-white p-10 shadow-lg ring-1 ring-gray-100">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          {process.env.NEXT_PUBLIC_APP_NAME || 'Sistem Peminjaman Fasilitas Kampus'}
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          Platform pengajuan peminjaman fasilitas kampus untuk Lembaga Kemahasiswaan (LK) dan Organisasi Kemahasiswaan (OK).
          Alur persetujuan: Pengurus → Biro III → WR3/WD3 → Admin Biro/Unit.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Daftar Pengurus LK/OK
          </Link>
        </div>
      </div>
    </main>
  );
}
