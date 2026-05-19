import { verifySession } from '@/lib/auth';
import { getNotifications } from '@/lib/notifications';
import { Button } from '@/components/ui/Button';
import { EmptyState, PageHeader } from '@/components/ui/Card';
import { markAllNotificationsAsRead } from '@/app/actions/notifications';
import { NotificationList } from '@/components/dashboard/NotificationList';

export default async function NotificationsPage() {
  const session = await verifySession();
  const items = await getNotifications(session.userId);
  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifikasi"
        subtitle={unread > 0 ? `${unread} notifikasi belum dibaca.` : 'Semua notifikasi sudah dibaca.'}
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
        <EmptyState
          icon="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"
          title="Belum ada notifikasi"
          description="Pemberitahuan tentang pengajuan Anda akan muncul di sini."
        />
      ) : (
        <NotificationList items={items} />
      )}
    </div>
  );
}
