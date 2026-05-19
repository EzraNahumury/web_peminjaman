import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { SessionPayload } from '@/types';

const COOKIE = 'session';
const secret = process.env.JWT_SECRET || 'dev_secret_change_me_please_minimum_32_chars';
const encoded = new TextEncoder().encode(secret);
const EXPIRES_IN_MS = 7 * 24 * 60 * 60 * 1000;

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encoded);
}

export async function decryptSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encoded, { algorithms: ['HS256'] });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(user: {
  id: number;
  role: SessionPayload['role'];
  email: string;
  name: string;
  isActive: boolean;
  userScope?: SessionPayload['userScope'];
  bureauScope?: SessionPayload['bureauScope'];
}) {
  const expiresAt = Date.now() + EXPIRES_IN_MS;
  const token = await encryptSession({
    userId: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    isActive: user.isActive,
    userScope: user.userScope ?? null,
    bureauScope: user.bureauScope ?? null,
    expiresAt,
  });
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(expiresAt),
    path: '/',
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  return decryptSession(token);
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}
