'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  ListTodo,
  Building2,
  Inbox,
  Lock,
  Settings,
  Users,
  User,
  LogOut,
  MessageCircle,
  Mail,
  PenTool,
  type LucideIcon,
} from 'lucide-react';
import { UkdwLogo } from '@/components/brand/UkdwLogo';
import type { Role } from '@/types';
import { cn } from '@/lib/cn';
import { logout } from '@/app/actions/auth';

type MenuItem = { label: string; href: string; icon: LucideIcon; badgeKey?: 'unread' };

const MENUS: Record<Role, MenuItem[]> = {
  PENGURUS: [
    { label: 'Beranda', href: '/dashboard/pengurus', icon: Home },
    { label: 'Daftar Fasilitas', href: '/dashboard/facilities', icon: Building2 },
    { label: 'Status Peminjaman', href: '/dashboard/pengurus/requests', icon: ListTodo },
  ],
  BIRO_III: [
    { label: 'Beranda', href: '/dashboard/biro-iii', icon: Home },
    { label: 'Antrian Validasi', href: '/dashboard/biro-iii/requests', icon: Inbox },
    { label: 'Daftar Fasilitas', href: '/dashboard/facilities', icon: Building2 },
    { label: 'Upload TTD', href: '/dashboard/profile', icon: PenTool },
  ],
  WR3_WD3: [
    { label: 'Beranda', href: '/dashboard/wr3-wd3', icon: Home },
    { label: 'Antrian Validasi', href: '/dashboard/wr3-wd3/requests', icon: Inbox },
    { label: 'Daftar Fasilitas', href: '/dashboard/facilities', icon: Building2 },
    { label: 'Upload TTD', href: '/dashboard/profile', icon: PenTool },
  ],
  ADMIN_UNIT: [
    { label: 'Beranda', href: '/dashboard/admin-unit', icon: Home },
    { label: 'Pengajuan Masuk', href: '/dashboard/admin-unit/requests', icon: Inbox },
    { label: 'Blokir Jadwal', href: '/dashboard/admin-unit/blocks', icon: Lock },
    { label: 'Kelola Fasilitas', href: '/dashboard/admin-unit/facilities', icon: Settings },
    { label: 'Integrasi WhatsApp', href: '/dashboard/admin-unit/whatsapp', icon: MessageCircle },
    { label: 'Daftar Fasilitas', href: '/dashboard/facilities', icon: Building2 },
  ],
  SUPER_ADMIN: [
    { label: 'Beranda', href: '/dashboard', icon: Home },
    { label: 'Manajemen User', href: '/dashboard/super-admin/users', icon: Users },
    { label: 'Integrasi Email', href: '/dashboard/super-admin/email', icon: Mail },
    { label: 'Daftar Fasilitas', href: '/dashboard/facilities', icon: Building2 },
  ],
};

const SECTION_LABEL: Record<Role, string> = {
  PENGURUS: 'Pengurus LK/OK',
  BIRO_III: 'Validator',
  WR3_WD3: 'Validator',
  ADMIN_UNIT: 'Admin Biro/Unit',
  SUPER_ADMIN: 'Super Admin',
};

export function Sidebar({
  role,
  name,
  identityNumber,
  unread,
}: {
  role: Role;
  name: string;
  identityNumber: string | null;
  unread: number;
}) {
  const path = usePathname();
  const menu = MENUS[role] || [];
  const initials = name
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const [pending, startLogout] = useTransition();

  return (
    <aside className="hidden w-64 shrink-0 md:block">
      <div
        className="sticky top-0 flex h-screen flex-col text-white"
        style={{
          background: 'linear-gradient(180deg, var(--primary-900) 0%, var(--primary-800) 100%)',
        }}
      >
        <div className="flex h-[60px] shrink-0 items-center gap-3 px-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] bg-white/12 p-1.5 ring-1 ring-white/15">
            <UkdwLogo width={28} height={28} className="h-full w-full" priority />
          </div>
          <div className="min-w-0">
            <p className="text-[14px] font-bold leading-tight tracking-tight text-white">FASKO</p>
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-white/60">
              Peminjaman Fasilitas
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-3">
          <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
            {SECTION_LABEL[role]}
          </p>
          <ul className="space-y-0.5">
            {(() => {
              const longest = menu
                .filter((m) => path === m.href || path.startsWith(m.href + '/'))
                .reduce<string>((acc, m) => (m.href.length > acc.length ? m.href : acc), '');
              return menu.map((m) => {
              const active = m.href === longest;
              const Icon = m.icon;
              const badge = m.badgeKey === 'unread' && unread > 0 ? unread : null;
              return (
                <li key={m.href}>
                  <Link
                    href={m.href}
                    className="group relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-[13px] font-medium text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white"
                  >
                    {active && (
                      <motion.span
                        layoutId="sidebar-active"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        className="absolute inset-0 rounded-[var(--radius-md)] bg-[var(--primary-600)]"
                      />
                    )}
                    <Icon
                      size={17}
                      strokeWidth={1.9}
                      className={cn('relative z-10', active ? 'text-white' : 'text-white/55 group-hover:text-white/85')}
                    />
                    <span className={cn('relative z-10 flex-1', active ? 'text-white' : '')}>{m.label}</span>
                    {badge !== null && (
                      <span
                        className={cn(
                          'relative z-10 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
                          active
                            ? 'bg-white/20 text-white ring-1 ring-white/20'
                            : 'bg-[var(--accent-gold)] text-white'
                        )}
                      >
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            });
            })()}
          </ul>
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-1 rounded-[var(--radius-md)] bg-white/[0.04] p-1.5 ring-1 ring-white/[0.06]">
            <Link
              href="/dashboard/profile"
              className="group flex min-w-0 flex-1 items-center gap-2.5 rounded-[var(--radius-sm)] px-2 py-2 transition-colors hover:bg-white/[0.08]"
              title="Profil & pengaturan"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] text-[11px] font-bold text-white ring-1 ring-white/10 transition-transform group-hover:scale-[1.02]">
                {initials || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold leading-tight text-white group-hover:text-white">
                  {name}
                </p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-[10.5px] leading-tight text-white/55">
                  <User size={10} className="shrink-0 opacity-70" />
                  <span className="truncate">{identityNumber || SECTION_LABEL[role]}</span>
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => startLogout(() => logout())}
              disabled={pending}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-white/55 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
              aria-label="Keluar"
              title="Keluar"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
