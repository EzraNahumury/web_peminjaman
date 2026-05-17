import Link from 'next/link';
import { logout } from '@/app/actions/auth';
import { Button } from '@/components/ui/Button';

const ROLE_LABEL: Record<string, string> = {
  PENGURUS: 'Pengurus LK/OK',
  BIRO_III: 'Biro III Kemahasiswaan',
  WR3_WD3: 'WR3 / WD3',
  ADMIN_UNIT: 'Admin Biro/Unit',
  SUPER_ADMIN: 'Super Admin',
};

export function Navbar({
  name,
  role,
  unread,
}: {
  name: string;
  role: string;
  unread: number;
}) {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
      <Link href="/dashboard" className="text-base font-semibold text-gray-900">
        {process.env.NEXT_PUBLIC_APP_NAME || 'Sistem Peminjaman Fasilitas Kampus'}
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/dashboard/notifications" className="relative text-sm text-gray-600 hover:text-gray-900">
          Notifikasi
          {unread > 0 && (
            <span className="absolute -right-3 -top-2 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {unread}
            </span>
          )}
        </Link>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{name}</p>
          <p className="text-xs text-gray-500">{ROLE_LABEL[role] || role}</p>
        </div>
        <form action={logout}>
          <Button variant="secondary" type="submit">
            Keluar
          </Button>
        </form>
      </div>
    </header>
  );
}
