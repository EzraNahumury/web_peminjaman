import Link from 'next/link';
import { logout } from '@/app/actions/auth';

const ROLE_LABEL: Record<string, string> = {
  PENGURUS: 'Pengurus LK/OK',
  BIRO_III: 'Biro III Kemahasiswaan',
  WR3_WD3: 'WR3 / WD3',
  ADMIN_UNIT: 'Admin Biro/Unit',
  SUPER_ADMIN: 'Super Admin',
};

const ROLE_COLOR: Record<string, string> = {
  PENGURUS: 'bg-blue-100 text-blue-700',
  BIRO_III: 'bg-purple-100 text-purple-700',
  WR3_WD3: 'bg-amber-100 text-amber-700',
  ADMIN_UNIT: 'bg-emerald-100 text-emerald-700',
  SUPER_ADMIN: 'bg-rose-100 text-rose-700',
};

export function Navbar({ name, role, unread }: { name: string; role: string; unread: number }) {
  const initials = name
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21V11M15 21V11" />
          </svg>
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-slate-900">
            {process.env.NEXT_PUBLIC_APP_NAME || 'Peminjaman Fasilitas'}
          </p>
          <p className="text-[11px] text-slate-500">Sistem Approval Chain</p>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
          title="Notifikasi"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-semibold text-white">
            {initials || 'U'}
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight text-slate-900">{name}</p>
            <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${ROLE_COLOR[role] ?? 'bg-slate-100 text-slate-700'}`}>
              {ROLE_LABEL[role] || role}
            </span>
          </div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </form>
      </div>
    </header>
  );
}
