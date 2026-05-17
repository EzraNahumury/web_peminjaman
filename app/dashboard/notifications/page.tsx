import Link from 'next/link';
import { verifySession } from '@/lib/auth';
import { getNotifications } from '@/lib/notifications';
import { fmtDateTime } from '@/lib/request-code';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/Card';
import { markAllNotificationsAsRead, markNotificationAsRead } from '@/app/actions/notifications';

export default async function NotificationsPage() {
  const session = await verifySession();
  const items = await getNotifications(session.userId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifikasi"
        subtitle={`${items.filter((n) => !n.isRead).length} notifikasi belum dibaca.`}
        action={
          items.length > 0 && (
            <form action={markAllNotificationsAsRead}>
              <Button type="submit" variant="outline">
                Tandai semua dibaca
              </Button>
            </form>
          )
        }
      />
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-700">Belum ada notifikasi</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-xl border bg-white p-4 shadow-sm transition ${
                n.isRead ? 'border-slate-200' : 'border-blue-200 bg-blue-50/30'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${n.isRead ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-600'}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                    <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>
                    <p className="mt-1 text-xs text-slate-400">{fmtDateTime(n.createdAt)}</p>
                    {n.link && (
                      <Link href={n.link} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
                        Buka detail
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>
                {!n.isRead && (
                  <form action={markNotificationAsRead.bind(null, n.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      Tandai dibaca
                    </Button>
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
