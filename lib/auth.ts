import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { queryOne } from '@/lib/db';
import type { Role, SessionPayload, User } from '@/types';

export const verifySession = cache(async (): Promise<SessionPayload> => {
  const session = await getSession();
  if (!session?.userId) redirect('/login');
  return session;
});

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const session = await getSession();
  if (!session?.userId) return null;
  return queryOne<User>(
    'SELECT id, name, email, role, isActive, userScope, bureauScope, organizationName, phone, identityNumber, organizationLogoUrl, createdAt, updatedAt FROM users WHERE id = ?',
    [session.userId]
  );
});

export async function requireRole(...allowed: Role[]): Promise<SessionPayload> {
  const session = await verifySession();
  if (!allowed.includes(session.role)) redirect('/dashboard');
  return session;
}

export function dashboardPathForRole(role: Role): string {
  switch (role) {
    case 'PENGURUS': return '/dashboard/pengurus';
    case 'BIRO_III': return '/dashboard/biro-iii';
    case 'WR3_WD3': return '/dashboard/wr3-wd3';
    case 'ADMIN_UNIT': return '/dashboard/admin-unit';
    case 'SUPER_ADMIN': return '/dashboard';
  }
}
