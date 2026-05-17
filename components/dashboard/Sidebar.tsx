'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Role } from '@/types';

type MenuItem = { label: string; href: string; icon: string };

const ICONS = {
  home: 'M3 12 12 4l9 8M5 10v10h4v-6h6v6h4V10',
  calendar: 'M8 2v3M16 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  plus: 'M12 5v14M5 12h14',
  building: 'M3 21h18M5 21V7l7-4 7 4v14M9 21V11M15 21V11M9 7h.01M15 7h.01',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',
  inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z',
  lock: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.3l2-1.5-2-3.4-2.3.9a7.5 7.5 0 0 0-2.3-1.3l-.3-2.4h-4l-.3 2.4a7.5 7.5 0 0 0-2.3 1.3l-2.3-.9-2 3.4 2 1.5a7.4 7.4 0 0 0 0 2.6l-2 1.5 2 3.4 2.3-.9a7.5 7.5 0 0 0 2.3 1.3l.3 2.4h4l.3-2.4a7.5 7.5 0 0 0 2.3-1.3l2.3.9 2-3.4-2-1.5c.1-.4.1-.9.1-1.3Z',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
};

const MENUS: Record<Role, MenuItem[]> = {
  PENGURUS: [
    { label: 'Dashboard', href: '/dashboard/pengurus', icon: ICONS.home },
    { label: 'Kalender Fasilitas', href: '/dashboard/pengurus/calendar', icon: ICONS.calendar },
    { label: 'Pengajuan Saya', href: '/dashboard/pengurus/requests', icon: ICONS.list },
    { label: 'Ajukan Baru', href: '/dashboard/pengurus/requests/new', icon: ICONS.plus },
    { label: 'Daftar Fasilitas', href: '/dashboard/facilities', icon: ICONS.building },
    { label: 'Notifikasi', href: '/dashboard/notifications', icon: ICONS.bell },
    { label: 'Profil', href: '/dashboard/profile', icon: ICONS.user },
  ],
  BIRO_III: [
    { label: 'Dashboard', href: '/dashboard/biro-iii', icon: ICONS.home },
    { label: 'Pengajuan Masuk', href: '/dashboard/biro-iii/requests', icon: ICONS.inbox },
    { label: 'Daftar Fasilitas', href: '/dashboard/facilities', icon: ICONS.building },
    { label: 'Notifikasi', href: '/dashboard/notifications', icon: ICONS.bell },
    { label: 'Profil', href: '/dashboard/profile', icon: ICONS.user },
  ],
  WR3_WD3: [
    { label: 'Dashboard', href: '/dashboard/wr3-wd3', icon: ICONS.home },
    { label: 'Pengajuan Masuk', href: '/dashboard/wr3-wd3/requests', icon: ICONS.inbox },
    { label: 'Daftar Fasilitas', href: '/dashboard/facilities', icon: ICONS.building },
    { label: 'Notifikasi', href: '/dashboard/notifications', icon: ICONS.bell },
    { label: 'Profil', href: '/dashboard/profile', icon: ICONS.user },
  ],
  ADMIN_UNIT: [
    { label: 'Dashboard', href: '/dashboard/admin-unit', icon: ICONS.home },
    { label: 'Pengajuan Masuk', href: '/dashboard/admin-unit/requests', icon: ICONS.inbox },
    { label: 'Blokir Jadwal', href: '/dashboard/admin-unit/blocks', icon: ICONS.lock },
    { label: 'Kelola Fasilitas', href: '/dashboard/admin-unit/facilities', icon: ICONS.settings },
    { label: 'Daftar Fasilitas', href: '/dashboard/facilities', icon: ICONS.building },
    { label: 'Notifikasi', href: '/dashboard/notifications', icon: ICONS.bell },
    { label: 'Profil', href: '/dashboard/profile', icon: ICONS.user },
  ],
  SUPER_ADMIN: [
    { label: 'Dashboard', href: '/dashboard', icon: ICONS.home },
    { label: 'Daftar Fasilitas', href: '/dashboard/facilities', icon: ICONS.building },
    { label: 'Notifikasi', href: '/dashboard/notifications', icon: ICONS.bell },
    { label: 'Profil', href: '/dashboard/profile', icon: ICONS.user },
  ],
};

export function Sidebar({ role }: { role: Role }) {
  const path = usePathname();
  const menu = MENUS[role] || [];
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:block">
      <nav className="flex flex-col gap-1 p-4">
        <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Menu</p>
        {menu.map((m) => {
          const active = path === m.href || (m.href !== '/dashboard' && path.startsWith(m.href));
          return (
            <Link
              key={m.href}
              href={m.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}
              >
                <path d={m.icon} />
              </svg>
              {m.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
