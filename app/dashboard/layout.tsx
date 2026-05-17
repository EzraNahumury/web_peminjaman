import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { unreadCount } from '@/lib/notifications';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Navbar } from '@/components/dashboard/Navbar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const unread = await unreadCount(user.id);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar name={user.name} role={user.role} unread={unread} />
      <div className="flex flex-1">
        <Sidebar role={user.role} />
        <main className="flex-1 bg-slate-50 px-6 py-8 lg:px-10">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
