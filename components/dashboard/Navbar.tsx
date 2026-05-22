'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

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
  return crumbs;
}

export function Navbar({ unread }: { unread: number }) {
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

      <Link
        href="/dashboard/notifications"
        className={cn(
          'relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all',
          unread > 0
            ? 'bg-[var(--primary-700)] text-white shadow-[0_4px_14px_-4px_rgba(6,48,26,0.45)] hover:bg-[var(--primary-800)]'
            : 'bg-[var(--primary-50)] text-[var(--primary-800)] ring-1 ring-[var(--primary-200)] hover:bg-[var(--primary-100)] hover:ring-[var(--primary-300)]'
        )}
        aria-label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : 'Notifikasi'}
        title="Notifikasi"
      >
        <Bell className="h-5 w-5" strokeWidth={2.25} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold tabular-nums text-[var(--primary-800)] shadow-sm ring-1 ring-[var(--primary-200)]">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </Link>
    </header>
  );
}
