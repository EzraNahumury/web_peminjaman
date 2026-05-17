import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { PageHeader, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function PengurusDashboard() {
  const session = await requireRole('PENGURUS');
  const [{ c: total }] = await query<{ c: number }>('SELECT COUNT(*) c FROM facility_requests WHERE userId = ?', [session.userId]);
  const [{ c: pending }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM facility_requests WHERE userId = ? AND status IN ('WAITING_BIRO_III','WAITING_WR3_WD3','WAITING_ADMIN_UNIT')",
    [session.userId]
  );
  const [{ c: approved }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM facility_requests WHERE userId = ? AND status='APPROVED'",
    [session.userId]
  );
  const [{ c: revision }] = await query<{ c: number }>(
    "SELECT COUNT(*) c FROM facility_requests WHERE userId = ? AND status='REVISION_REQUESTED'",
    [session.userId]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Halo, ${session.name.split(' ')[0]} 👋`}
        subtitle="Ringkasan pengajuan peminjaman fasilitas Anda."
        action={
          <Link href="/dashboard/pengurus/requests/new">
            <Button>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Ajukan Peminjaman
            </Button>
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Pengajuan" value={total} tone="slate" />
        <StatCard label="Dalam Proses" value={pending} tone="amber" />
        <StatCard label="Disetujui" value={approved} tone="emerald" />
        <StatCard label="Perlu Revisi" value={revision} tone="blue" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Mulai Cepat</h3>
          <p className="mt-1 text-sm text-slate-500">Akses fitur utama dengan satu klik.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link href="/dashboard/pengurus/calendar" className="group flex items-center gap-3 rounded-lg border border-slate-200 p-3 transition hover:border-blue-300 hover:bg-blue-50/40">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v3M16 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Cek Kalender</p>
                <p className="text-xs text-slate-500">Lihat ketersediaan fasilitas</p>
              </div>
            </Link>
            <Link href="/dashboard/pengurus/requests" className="group flex items-center gap-3 rounded-lg border border-slate-200 p-3 transition hover:border-blue-300 hover:bg-blue-50/40">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Pengajuan Saya</p>
                <p className="text-xs text-slate-500">Pantau status pengajuan</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-sm">
          <h3 className="text-sm font-semibold opacity-90">Alur Approval</h3>
          <p className="mt-1 text-sm opacity-80">Pengajuan melewati 3 tahap review.</p>
          <ol className="mt-4 space-y-2 text-sm">
            <li className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">1</span> Biro III Kemahasiswaan</li>
            <li className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">2</span> WR3 / WD3</li>
            <li className="flex items-center gap-2"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">3</span> Admin Biro / Unit</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
