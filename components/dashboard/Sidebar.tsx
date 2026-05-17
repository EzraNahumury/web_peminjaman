'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Role } from '@/types';

const MENUS: Record<Role, { label: string; href: string }[]> = {
  PENGURUS: [
    { label: 'Dashboard', href: '/dashboard/pengurus' },
    { label: 'Kalender Fasilitas', href: '/dashboard/pengurus/calendar' },
    { label: 'Pengajuan Saya', href: '/dashboard/pengurus/requests' },
    { label: 'Ajukan Baru', href: '/dashboard/pengurus/requests/new' },
    { label: 'Daftar Fasilitas', href: '/dashboard/facilities' },
    { label: 'Notifikasi', href: '/dashboard/notifications' },
  ],
  BIRO_III: [
    { label: 'Dashboard', href: '/dashboard/biro-iii' },
    { label: 'Pengajuan Masuk', href: '/dashboard/biro-iii/requests' },
    { label: 'Daftar Fasilitas', href: '/dashboard/facilities' },
    { label: 'Notifikasi', href: '/dashboard/notifications' },
  ],
  WR3_WD3: [
    { label: 'Dashboard', href: '/dashboard/wr3-wd3' },
    { label: 'Pengajuan Masuk', href: '/dashboard/wr3-wd3/requests' },
    { label: 'Daftar Fasilitas', href: '/dashboard/facilities' },
    { label: 'Notifikasi', href: '/dashboard/notifications' },
  ],
  ADMIN_UNIT: [
    { label: 'Dashboard', href: '/dashboard/admin-unit' },
    { label: 'Pengajuan Masuk', href: '/dashboard/admin-unit/requests' },
    { label: 'Daftar Fasilitas', href: '/dashboard/facilities' },
    { label: 'Notifikasi', href: '/dashboard/notifications' },
  ],
  SUPER_ADMIN: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Daftar Fasilitas', href: '/dashboard/facilities' },
    { label: 'Notifikasi', href: '/dashboard/notifications' },
  ],
};

export function Sidebar({ role }: { role: Role }) {
  const path = usePathname();
  const menu = MENUS[role] || [];
  return (
    <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white md:block">
      <nav className="flex flex-col gap-1 p-4">
        {menu.map((m) => {
          const active = path === m.href || (m.href !== '/dashboard' && path.startsWith(m.href));
          return (
            <Link
              key={m.href}
              href={m.href}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {m.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
