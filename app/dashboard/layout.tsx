import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { unreadCount } from '@/lib/notifications';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Navbar } from '@/components/dashboard/Navbar';
import { PageTransition } from '@/components/ui/PageTransition';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const unread = await unreadCount(user.id);

  return (
    <div className="flex min-h-screen bg-[var(--neutral-50)]">
      <Sidebar role={user.role} name={user.name} identityNumber={user.identityNumber} unread={unread} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar role={user.role} unread={unread} />
        <main className="flex-1 px-6 py-8 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
