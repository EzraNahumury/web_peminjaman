'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { execute, query, queryOne } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { z } from 'zod';
import type { ActivityScope, ManagingUnit, Role, User } from '@/types';

const BUREAUS: ManagingUnit[] = ['BIRO_I', 'BIRO_IV', 'PPLK', 'KRT', 'LPAIP'];

const CreateStaffUserSchema = z
  .object({
    name: z.string().trim().min(2, 'Nama minimal 2 karakter'),
    email: z.string().trim().toLowerCase().email('Email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    confirmPassword: z.string().min(6, 'Konfirmasi password wajib'),
    role: z.enum(['BIRO_III', 'WR3_WD3', 'ADMIN_UNIT']),
    phone: z.string().trim().min(6, 'No HP minimal 6 karakter').optional().or(z.literal('')),
    userScope: z.enum(['UNIVERSITAS', 'FAKULTAS']).optional(),
    bureauScope: z.enum(['BIRO_I', 'BIRO_IV', 'PPLK', 'KRT', 'LPAIP']).optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirmPassword'],
  })
  .refine((d) => d.role !== 'WR3_WD3' || !!d.userScope, {
    message: 'Pilih lingkup WR3 atau WD3',
    path: ['userScope'],
  })
  .refine((d) => d.role !== 'ADMIN_UNIT' || !!d.bureauScope, {
    message: 'Pilih unit pengelola',
    path: ['bureauScope'],
  });

export type StaffUserFormState =
  | { error?: string; success?: string; fieldErrors?: Record<string, string[]> }
  | undefined;

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
    `SELECT id, name, email, role, isActive, userScope, bureauScope, organizationName, phone, identityNumber, organizationLogoUrl, createdAt, updatedAt
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

export async function updateUserScope(
  userId: number,
  scope: ActivityScope
): Promise<{ ok: true } | { error: string }> {
  await requireRole('SUPER_ADMIN');
  const result = await execute('UPDATE users SET userScope = ? WHERE id = ? AND role = ?', [
    scope,
    userId,
    'WR3_WD3',
  ]);
  if (result.affectedRows === 0) return { error: 'Gagal menyimpan — akun bukan role WR3/WD3.' };
  revalidatePath('/dashboard/super-admin/users');
  return { ok: true };
}

export async function updateAdminBureau(
  userId: number,
  bureau: ManagingUnit
): Promise<{ ok: true } | { error: string }> {
  await requireRole('SUPER_ADMIN');
  if (!BUREAUS.includes(bureau)) return { error: 'Unit tidak valid.' };
  const result = await execute('UPDATE users SET bureauScope = ? WHERE id = ? AND role = ?', [
    bureau,
    userId,
    'ADMIN_UNIT',
  ]);
  if (result.affectedRows === 0) return { error: 'Gagal menyimpan — akun bukan role Admin Unit.' };
  revalidatePath('/dashboard/super-admin/users');
  return { ok: true };
}

export async function createStaffUser(
  _prev: StaffUserFormState,
  formData: FormData
): Promise<StaffUserFormState> {
  await requireRole('SUPER_ADMIN');

  const parsed = CreateStaffUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    role: formData.get('role'),
    phone: formData.get('phone'),
    userScope: formData.get('userScope') || undefined,
    bureauScope: formData.get('bureauScope') || undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const existing = await queryOne<{ id: number }>('SELECT id FROM users WHERE email = ?', [d.email]);
  if (existing) return { fieldErrors: { email: ['Email sudah terdaftar'] } };

  const hash = await bcrypt.hash(d.password, 10);
  const userScope = d.role === 'WR3_WD3' ? d.userScope! : null;
  const bureauScope = d.role === 'ADMIN_UNIT' ? d.bureauScope! : null;

  await execute(
    `INSERT INTO users (name, email, password, role, isActive, userScope, bureauScope, organizationName, phone, identityNumber)
     VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [
      d.name,
      d.email,
      hash,
      d.role,
      1,
      userScope,
      bureauScope,
      null,
      d.phone || null,
      null,
    ]
  );

  revalidatePath('/dashboard/super-admin/users');
  revalidatePath('/dashboard/super-admin/users/new');
  revalidatePath('/dashboard');
  return { success: `Akun ${d.name} berhasil dibuat dan langsung aktif.` };
}
