import { NextResponse } from 'next/server';

/**
 * Route Handler to clear an invalid session cookie and redirect to login.
 * Needed because Server Components cannot modify cookies directly.
 */
export async function GET() {
  const res = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  res.cookies.delete('session');
  return res;
}
