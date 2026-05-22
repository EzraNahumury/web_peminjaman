'use server';

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { execute, queryOne } from '@/lib/db';
import { createSession, destroySession } from '@/lib/session';
import { LoginSchema, RegisterSchema } from '@/lib/validations';
import { dashboardPathForRole } from '@/lib/auth';
import { createNotificationForRole } from '@/lib/notifications';
import { sendEmail } from '@/lib/mailer';
import { resetTestcaseAccount, TESTCASE_EMAIL } from '@/lib/testcase-seed';
import type { ActivityScope, ManagingUnit, Role } from '@/types';

/** `reason` membedakan jenis kegagalan login agar UI bisa memilih field mana yang direset. */
export type LoginReason = 'EMAIL_NOT_FOUND' | 'WRONG_PASSWORD' | 'INACTIVE';
export type FormState =
  | { error?: string; fieldErrors?: Record<string, string[]>; reason?: LoginReason }
  | undefined;

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
    [d.name, d.email, hash, 'PENGURUS', 1, d.organizationName, d.phone, d.identityNumber || null]
  );
  await createNotificationForRole(
    'SUPER_ADMIN',
    'Pengurus baru mendaftar',
    `${d.name} (${d.email}) dari ${d.organizationName} mendaftar dan langsung aktif.`,
    `/dashboard/super-admin/users`
  );
  void result;
  redirect('/login?registered=1');
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
  // Email tidak ditemukan → reset kedua field.
  if (!user) {
    return { error: 'Email tidak terdaftar di sistem.', reason: 'EMAIL_NOT_FOUND' };
  }
  // Password salah → biarkan email tetap terisi, hanya password direset.
  const ok = await bcrypt.compare(parsed.data.password, user.password);
  if (!ok) {
    return { error: 'Password salah. Silakan coba lagi.', reason: 'WRONG_PASSWORD' };
  }
  if (!user.isActive) {
    return {
      error: 'Akun belum diaktivasi. Mohon tunggu konfirmasi dari Super Admin.',
      reason: 'INACTIVE',
    };
  }

  // Akun uji test case: kembalikan 6 skenario ke kondisi awal SETIAP login,
  // supaya pergantian tester tidak perlu reset manual. Dibungkus try/catch
  // agar kegagalan reset tidak menghalangi login. HANYA akun ini yang
  // terdampak — akun lain berjalan normal.
  if (user.email.toLowerCase() === TESTCASE_EMAIL) {
    try {
      await resetTestcaseAccount();
    } catch (e) {
      console.error('Gagal auto-reset akun test case:', e);
    }
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

/* ------------------------------------------------------------------ */
/* Lupa password                                                       */
/* ------------------------------------------------------------------ */

export type ResetRequestState =
  | { error?: string; sent?: boolean; email?: string }
  | undefined;

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 jam

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/** Langkah 1 — pengguna memasukkan email, sistem mengirim tautan reset. */
export async function requestPasswordReset(
  _prev: ResetRequestState,
  formData: FormData
): Promise<ResetRequestState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: 'Masukkan alamat email yang valid.' };
  }

  const user = await queryOne<{ id: number; name: string }>(
    'SELECT id, name FROM users WHERE email = ?',
    [email]
  );

  // Kirim email hanya bila akun ada — tapi respons selalu sama
  // (tidak membocorkan apakah email terdaftar).
  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await execute('UPDATE users SET resetTokenHash = ?, resetTokenExpiry = ? WHERE id = ?', [
      hashToken(rawToken),
      expiry,
      user.id,
    ]);
    await sendEmail({
      to: email,
      subject: 'Reset Password — FASKO UKDW',
      title: 'Permintaan Reset Password',
      body:
        `Halo ${user.name},\n\n` +
        'Kami menerima permintaan untuk mengatur ulang password akun FASKO Anda. ' +
        'Klik tombol di bawah untuk membuat password baru. Tautan berlaku 1 jam.\n\n' +
        'Jika Anda tidak meminta ini, abaikan email ini — password Anda tetap aman.',
      link: `/reset-password?token=${rawToken}`,
    });
  }

  return { sent: true, email };
}

export type ResetPasswordState =
  | { error?: string; fieldErrors?: Record<string, string[]>; done?: boolean }
  | undefined;

/** Langkah 2 — pengguna membuka tautan & mengisi password baru. */
export async function resetPassword(
  _prev: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const token = String(formData.get('token') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (!token) return { error: 'Token reset tidak ditemukan. Minta tautan baru.' };

  const fieldErrors: Record<string, string[]> = {};
  if (password.length < 6) fieldErrors.password = ['Password minimal 6 karakter'];
  if (password !== confirmPassword) fieldErrors.confirmPassword = ['Konfirmasi password tidak cocok'];
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  const user = await queryOne<{ id: number }>(
    'SELECT id FROM users WHERE resetTokenHash = ? AND resetTokenExpiry > NOW()',
    [hashToken(token)]
  );
  if (!user) {
    return { error: 'Tautan reset tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru.' };
  }

  const hash = await bcrypt.hash(password, 10);
  await execute(
    'UPDATE users SET password = ?, resetTokenHash = NULL, resetTokenExpiry = NULL WHERE id = ?',
    [hash, user.id]
  );
  return { done: true };
}
