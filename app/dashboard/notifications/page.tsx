import Link from 'next/link';
import { verifySession } from '@/lib/auth';
import { getNotifications } from '@/lib/notifications';
import { fmtDateTime } from '@/lib/request-code';
import { Button } from '@/components/ui/Button';
import { markAllNotificationsAsRead, markNotificationAsRead } from '@/app/actions/notifications';

export default async function NotificationsPage() {
  const session = await verifySession();
  const items = await getNotifications(session.userId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
        <form action={markAllNotificationsAsRead}>
          <Button type="submit" variant="secondary">Tandai semua dibaca</Button>
        </form>
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          Belum ada notifikasi.
        </div>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
          {items.map((n) => (
            <li key={n.id} className={`p-4 ${n.isRead ? '' : 'bg-blue-50/40'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                  <p className="mt-0.5 text-sm text-gray-600">{n.message}</p>
                  <p className="mt-1 text-xs text-gray-400">{fmtDateTime(n.createdAt)}</p>
                  {n.link && (
                    <Link href={n.link} className="mt-1 inline-block text-xs font-medium text-blue-600 hover:text-blue-700">
                      Buka detail →
                    </Link>
                  )}
                </div>
                {!n.isRead && (
                  <form action={markNotificationAsRead.bind(null, n.id)}>
                    <Button type="submit" variant="ghost">Tandai</Button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
