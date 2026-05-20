'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronRight, User } from 'lucide-react';
import type { Role } from '@/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';

const SEGMENT_LABEL: Record<string, string> = {
  dashboard: 'FASKO',
  pengurus: 'Beranda',
  'biro-iii': 'Beranda',
  'wr3-wd3': 'Beranda',
  'admin-unit': 'Beranda',
  'super-admin': 'Super Admin',
  facilities: 'Daftar Fasilitas',
  requests: 'Status Peminjaman',
  calendar: 'Kalender Fasilitas',
  notifications: 'Notifikasi',
  profile: 'Profil',
  new: 'Baru',
  edit: 'Edit',
  blocks: 'Blokir Jadwal',
  users: 'Manajemen User',
};

function buildBreadcrumb(path: string): { label: string; href: string | null }[] {
  const parts = path.split('/').filter(Boolean);
  const crumbs: { label: string; href: string | null }[] = [];
  let acc = '';
  for (let i = 0; i < parts.length; i++) {
    acc += '/' + parts[i];
    const seg = parts[i];
    const label =
      SEGMENT_LABEL[seg] ||
      (/^\d+$/.test(seg) || /^[a-f0-9-]{8,}$/i.test(seg) ? 'Detail' : seg.replace(/-/g, ' '));
    const isLast = i === parts.length - 1;
    crumbs.push({ label, href: isLast ? null : acc });
  }
  // Drop the auto-generated role segment when it duplicates "Beranda"
  return crumbs;
}

export function Navbar({ unread }: { role: Role; unread: number }) {
  const path = usePathname() || '/';
  const crumbs = buildBreadcrumb(path);

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between gap-4 border-b border-[var(--neutral-200)] bg-white/85 px-6 backdrop-blur supports-[backdrop-filter]:bg-white/70 lg:px-10">
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
        {crumbs.map((c, i) => (
          <span key={i} className="flex min-w-0 items-center gap-1.5">
            {i > 0 && <ChevronRight size={13} className="text-[var(--neutral-300)]" />}
            {c.href ? (
              <Link href={c.href} className="truncate text-[var(--neutral-500)] hover:text-[var(--neutral-800)]">
                {c.label}
              </Link>
            ) : (
              <span className="truncate font-semibold text-[var(--neutral-900)]">{c.label}</span>
            )}
          </span>
        ))}
      </nav>

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
                <span className="absolute -right-1 -top-1 inline-flex h-2.5 w-2.5 rounded-full bg-[var(--status-rejected-fg)] ring-2 ring-white" />
              )}
            </Link>
          </TooltipTrigger>
          <TooltipContent>Notifikasi</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/dashboard/profile"
              className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-white text-[var(--neutral-700)] transition-colors hover:border-[var(--neutral-300)] hover:bg-[var(--neutral-50)]"
              aria-label="Profil"
            >
              <User className="h-4 w-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>Profil</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
