import Link from 'next/link';
import { logout } from '@/app/actions/auth';

const ROLE_LABEL: Record<string, string> = {
  PENGURUS: 'Pengurus LK/OK',
  BIRO_III: 'Biro III',
  WR3_WD3: 'WR3 / WD3',
  ADMIN_UNIT: 'Admin Biro/Unit',
  SUPER_ADMIN: 'Super Admin',
};

export function Navbar({ name, role, unread }: { name: string; role: string; unread: number }) {
  const initials = name
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <header className="sticky top-0 z-30 flex h-15 items-center justify-between border-b border-[var(--neutral-200)] bg-white/85 px-6 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="flex items-center gap-2 text-sm text-[var(--neutral-500)]">
        <Link href="/dashboard" className="font-medium text-[var(--neutral-700)] hover:text-[var(--neutral-900)]">
          FASKO
        </Link>
        <span className="text-[var(--neutral-300)]">/</span>
        <span className="text-[var(--neutral-900)]">{ROLE_LABEL[role] || role}</span>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/notifications"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-white text-[var(--neutral-700)] transition-colors hover:border-[var(--neutral-300)] hover:bg-[var(--neutral-50)]"
          aria-label="Notifikasi"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--status-rejected-fg)] px-1 text-[10px] font-semibold text-white ring-2 ring-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Link>

        <Link
          href="/dashboard/profile"
          className="group flex items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-white px-2 py-1 pr-3 transition-colors hover:border-[var(--neutral-300)] hover:bg-[var(--neutral-50)]"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary-700)] to-[var(--primary-900)] text-[11px] font-semibold text-white">
            {initials || 'U'}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-[12px] font-medium leading-tight text-[var(--neutral-900)]">{name.split(' ')[0]}</p>
            <p className="text-[10px] leading-tight text-[var(--neutral-500)]">{ROLE_LABEL[role] || role}</p>
          </div>
        </Link>

        <form action={logout}>
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-white px-3 text-sm font-medium text-[var(--neutral-700)] transition-colors hover:border-[var(--neutral-300)] hover:bg-[var(--neutral-50)]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </form>
      </div>
    </header>
  );
}
