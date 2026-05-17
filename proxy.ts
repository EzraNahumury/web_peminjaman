import { NextResponse, type NextRequest } from 'next/server';
import { decryptSession } from '@/lib/session';

const PUBLIC = new Set(['/login', '/register', '/']);

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get('session')?.value;
  const session = await decryptSession(token);

  if ((path.startsWith('/dashboard') || path.startsWith('/surat')) && !session?.userId) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }
  if (PUBLIC.has(path) && session?.userId && path !== '/') {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$|.*\\.png$).*)'],
};
