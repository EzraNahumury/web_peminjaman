'use client';
import Link from 'next/link';
import { useTransition } from 'react';
import { Bell, LogOut, User, ChevronDown, Building2 } from 'lucide-react';
import { logout } from '@/app/actions/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';

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
  const [, startLogout] = useTransition();

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-[var(--neutral-200)] bg-white/85 px-6 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="flex items-center gap-2 text-sm text-[var(--neutral-500)]">
        <Link href="/dashboard" className="flex items-center gap-1.5 font-medium text-[var(--neutral-700)] hover:text-[var(--neutral-900)]">
          <Building2 className="h-4 w-4 text-[var(--primary-700)]" />
          FASKO
        </Link>
        <span className="text-[var(--neutral-300)]">/</span>
        <span className="font-medium text-[var(--neutral-900)]">{ROLE_LABEL[role] || role}</span>
      </div>

      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/dashboard/notifications"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-white text-[var(--neutral-700)] transition-colors hover:border-[var(--neutral-300)] hover:bg-[var(--neutral-50)]"
              aria-label="Notifikasi"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--status-rejected-fg)] px-1 text-[10px] font-semibold text-white ring-2 ring-white">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </Link>
          </TooltipTrigger>
          <TooltipContent>Notifikasi</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-white pl-1 pr-2 py-1 transition-colors hover:border-[var(--neutral-300)] hover:bg-[var(--neutral-50)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-500)] focus-visible:ring-offset-2"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary-700)] to-[var(--primary-900)] text-[11px] font-semibold text-white">
                {initials || 'U'}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-[12px] font-medium leading-tight text-[var(--neutral-900)]">{name.split(' ')[0]}</p>
                <p className="text-[10px] leading-tight text-[var(--neutral-500)]">{ROLE_LABEL[role] || role}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-[var(--neutral-500)]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Akun</DropdownMenuLabel>
            <div className="px-2.5 py-1.5 text-xs">
              <p className="font-medium text-[var(--neutral-900)]">{name}</p>
              <p className="text-[var(--neutral-500)]">{ROLE_LABEL[role] || role}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="flex items-center gap-2">
                <User className="h-4 w-4 text-[var(--neutral-500)]" />
                Profil saya
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-[var(--neutral-500)]" />
                Notifikasi
                {unread > 0 && (
                  <span className="ml-auto rounded-full bg-[var(--primary-50)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--primary-700)]">
                    {unread}
                  </span>
                )}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-[var(--status-rejected-fg)] focus:bg-rose-50 focus:text-[var(--status-rejected-fg)]"
              onSelect={(e) => {
                e.preventDefault();
                startLogout(() => logout());
              }}
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
