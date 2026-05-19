'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { execute, queryOne } from '@/lib/db';
import { createSession, destroySession } from '@/lib/session';
import { LoginSchema, RegisterSchema } from '@/lib/validations';
import { dashboardPathForRole } from '@/lib/auth';
import { createNotificationForRole } from '@/lib/notifications';
import type { ActivityScope, ManagingUnit, Role } from '@/types';

export type FormState = { error?: string; fieldErrors?: Record<string, string[]> } | undefined;

export async function registerPengurus(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = RegisterSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    organizationName: formData.get('organizationName'),
    phone: formData.get('phone'),
    identityNumber: formData.get('identityNumber'),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const d = parsed.data;
  const existing = await queryOne('SELECT id FROM users WHERE email = ?', [d.email]);
  if (existing) return { error: 'Email sudah terdaftar' };
  const hash = await bcrypt.hash(d.password, 10);
  const result = await execute(
    'INSERT INTO users (name, email, password, role, isActive, organizationName, phone, identityNumber) VALUES (?,?,?,?,?,?,?,?)',
    [d.name, d.email, hash, 'PENGURUS', 0, d.organizationName, d.phone, d.identityNumber || null]
  );
  await createNotificationForRole(
    'SUPER_ADMIN',
    'Akun pengurus baru menunggu aktivasi',
    `${d.name} (${d.email}) dari ${d.organizationName} mendaftar dan menunggu aktivasi.`,
    `/dashboard/super-admin/users`
  );
  void result;
  redirect('/login?registered=pending');
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const user = await queryOne<{
    id: number;
    name: string;
    email: string;
    password: string;
    role: Role;
    isActive: number;
    userScope: ActivityScope | null;
    bureauScope: ManagingUnit | null;
  }>(
    'SELECT id, name, email, password, role, isActive, userScope, bureauScope FROM users WHERE email = ?',
    [parsed.data.email]
  );
  if (!user) return { error: 'Email atau password salah' };
  const ok = await bcrypt.compare(parsed.data.password, user.password);
  if (!ok) return { error: 'Email atau password salah' };
  if (!user.isActive) {
    return { error: 'Akun belum diaktivasi. Mohon tunggu konfirmasi dari Super Admin.' };
  }

  await createSession({
    id: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    isActive: Boolean(user.isActive),
    userScope: user.userScope ?? null,
    bureauScope: user.bureauScope ?? null,
  });
  redirect(dashboardPathForRole(user.role));
}

export async function logout() {
  await destroySession();
  redirect('/login');
}
