import { NextResponse, type NextRequest } from 'next/server';
import { decryptSession } from '@/lib/session';
import { dashboardPathForRole } from '@/lib/auth';
import type { Role } from '@/types';

const PUBLIC = new Set(['/login', '/register', '/']);

const PATH_ROLE: { prefix: string; allowed: Role[] }[] = [
  { prefix: '/dashboard/pengurus', allowed: ['PENGURUS'] },
  { prefix: '/dashboard/biro-iii', allowed: ['BIRO_III'] },
  { prefix: '/dashboard/wr3-wd3', allowed: ['WR3_WD3'] },
  { prefix: '/dashboard/admin-unit', allowed: ['ADMIN_UNIT'] },
  { prefix: '/dashboard/super-admin', allowed: ['SUPER_ADMIN'] },
];

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get('session')?.value;
  const session = await decryptSession(token);

  const protectedPath = path.startsWith('/dashboard') || path.startsWith('/surat');

  if (protectedPath && !session?.userId) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  if (protectedPath && session && session.isActive === false) {
    const url = new URL('/login', req.nextUrl);
    url.searchParams.set('error', 'inactive');
    const res = NextResponse.redirect(url);
    res.cookies.delete('session');
    return res;
  }

  if (protectedPath && session?.role) {
    for (const rule of PATH_ROLE) {
      if (path.startsWith(rule.prefix) && !rule.allowed.includes(session.role)) {
        return NextResponse.redirect(new URL(dashboardPathForRole(session.role), req.nextUrl));
      }
    }
  }

  if (PUBLIC.has(path) && session?.userId && session.isActive !== false && path !== '/') {
    return NextResponse.redirect(new URL(dashboardPathForRole(session.role), req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$|.*\\.png$).*)'],
};
