'use server';

import { revalidatePath } from 'next/cache';
import { execute, query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import type { ActivityScope, Role, User } from '@/types';

export async function getUsers(filter?: { role?: Role; isActive?: boolean }) {
  await requireRole('SUPER_ADMIN');
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (filter?.role) {
    where.push('role = ?');
    params.push(filter.role);
  }
  if (typeof filter?.isActive === 'boolean') {
    where.push('isActive = ?');
    params.push(filter.isActive ? 1 : 0);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return query<User>(
    `SELECT id, name, email, role, isActive, userScope, organizationName, phone, identityNumber, organizationLogoUrl, createdAt, updatedAt
     FROM users ${whereSql} ORDER BY isActive ASC, createdAt DESC`,
    params
  );
}

export async function activateUser(userId: number): Promise<void> {
  await requireRole('SUPER_ADMIN');
  await execute('UPDATE users SET isActive = 1 WHERE id = ?', [userId]);
  await createNotification(
    userId,
    'Akun Anda telah diaktivasi',
    'Akun Anda telah disetujui oleh Super Admin. Silakan login untuk mulai menggunakan sistem.',
    null
  );
  revalidatePath('/dashboard/super-admin/users');
  revalidatePath('/dashboard');
}

export async function deactivateUser(userId: number): Promise<void> {
  await requireRole('SUPER_ADMIN');
  await execute('UPDATE users SET isActive = 0 WHERE id = ?', [userId]);
  revalidatePath('/dashboard/super-admin/users');
}

export async function updateUserScope(userId: number, scope: ActivityScope): Promise<void> {
  await requireRole('SUPER_ADMIN');
  await execute('UPDATE users SET userScope = ? WHERE id = ? AND role = ?', [scope, userId, 'WR3_WD3']);
  revalidatePath('/dashboard/super-admin/users');
}
