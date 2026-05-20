import { getSession } from '@/lib/session';
import { dashboardPathForRole, getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LandingShell from './_landing/LandingShell';

export default async function Home() {
  const session = await getSession();
  if (session?.userId) {
    // Only redirect when the user actually exists in DB & is active.
    // Stale JWTs (e.g. after re-seed) fall through to the login form,
    // and the next successful login overwrites the cookie.
    const user = await getCurrentUser();
    if (user && user.isActive) {
      redirect(dashboardPathForRole(user.role));
    }
  }

  return <LandingShell />;
}
