'use server';

import { promises as fs } from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { execute, queryOne } from '@/lib/db';
import { verifySession } from '@/lib/auth';

const ProfileSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter'),
  email: z.string().trim().toLowerCase().email('Email tidak valid'),
  phone: z.string().trim().min(6, 'No HP minimal 6 karakter'),
  organizationName: z.string().trim().nullish().transform((v) => v ?? ''),
  identityNumber: z.string().trim().nullish().transform((v) => v ?? ''),
});

const PasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Password lama wajib diisi'),
    newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
    confirmPassword: z.string().min(6, 'Konfirmasi minimal 6 karakter'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Konfirmasi password tidak cocok',
    path: ['confirmPassword'],
  });

export type ProfileFormState = { error?: string; success?: string; fieldErrors?: Record<string, string[]> } | undefined;

export async function updateProfile(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const session = await verifySession();
  const parsed = ProfileSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    organizationName: formData.get('organizationName'),
    identityNumber: formData.get('identityNumber'),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const d = parsed.data;

  const dup = await queryOne<{ id: number }>('SELECT id FROM users WHERE email = ? AND id <> ?', [d.email, session.userId]);
  if (dup) return { fieldErrors: { email: ['Email sudah digunakan akun lain'] } };

  await execute(
    'UPDATE users SET name = ?, email = ?, phone = ?, organizationName = ?, identityNumber = ? WHERE id = ?',
    [d.name, d.email, d.phone, d.organizationName || null, d.identityNumber || null, session.userId]
  );
  revalidatePath('/dashboard/profile');
  return { success: 'Profil berhasil diperbarui. Jika email diubah, gunakan email baru saat login berikutnya.' };
}

export async function changePassword(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const session = await verifySession();
  const parsed = PasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const user = await queryOne<{ password: string }>('SELECT password FROM users WHERE id = ?', [session.userId]);
  if (!user) return { error: 'User tidak ditemukan' };
  const ok = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!ok) return { error: 'Password lama salah' };

  const hash = await bcrypt.hash(parsed.data.newPassword, 10);
  await execute('UPDATE users SET password = ? WHERE id = ?', [hash, session.userId]);
  return { success: 'Password berhasil diubah.' };
}

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
const MAX_BYTES = 2 * 1024 * 1024;

export async function uploadOrganizationLogo(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const session = await verifySession();
  if (session.role !== 'PENGURUS') return { error: 'Hanya Pengurus yang dapat mengunggah logo organisasi' };

  const file = formData.get('logo');
  if (!(file instanceof File) || file.size === 0) return { error: 'Pilih file logo terlebih dahulu' };
  if (!ALLOWED_MIME.has(file.type)) return { error: 'Format harus PNG / JPG / WEBP' };
  if (file.size > MAX_BYTES) return { error: 'Ukuran file maksimal 2 MB' };

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const fileName = `org-${session.userId}-${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logos');
  await fs.mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadDir, fileName), buffer);

  const url = `/uploads/logos/${fileName}`;
  const existing = await queryOne<{ organizationLogoUrl: string | null }>(
    'SELECT organizationLogoUrl FROM users WHERE id = ?',
    [session.userId]
  );
  if (existing?.organizationLogoUrl) {
    const old = path.join(process.cwd(), 'public', existing.organizationLogoUrl.replace(/^\//, ''));
    fs.unlink(old).catch(() => {});
  }
  await execute('UPDATE users SET organizationLogoUrl = ? WHERE id = ?', [url, session.userId]);
  revalidatePath('/dashboard/profile');
  return { success: 'Logo organisasi berhasil diunggah.' };
}

export async function removeOrganizationLogo(): Promise<void> {
  const session = await verifySession();
  if (session.role !== 'PENGURUS') return;
  const existing = await queryOne<{ organizationLogoUrl: string | null }>(
    'SELECT organizationLogoUrl FROM users WHERE id = ?',
    [session.userId]
  );
  if (existing?.organizationLogoUrl) {
    const old = path.join(process.cwd(), 'public', existing.organizationLogoUrl.replace(/^\//, ''));
    fs.unlink(old).catch(() => {});
  }
  await execute('UPDATE users SET organizationLogoUrl = NULL WHERE id = ?', [session.userId]);
  revalidatePath('/dashboard/profile');
}
