'use server';

import { requireRole } from '@/lib/auth';
import { getMailerState, sendEmail, verifyMailer } from '@/lib/mailer';

export async function getEmailStatus() {
  await requireRole('ADMIN_UNIT', 'SUPER_ADMIN');
  return getMailerState();
}

export async function verifyEmailConnection() {
  await requireRole('ADMIN_UNIT', 'SUPER_ADMIN');
  return verifyMailer();
}

export async function sendTestEmail(to: string) {
  await requireRole('ADMIN_UNIT', 'SUPER_ADMIN');
  return sendEmail({
    to,
    subject: '[FASKO] Tes Email',
    title: 'Tes Konfigurasi Email',
    body: 'Email ini dikirim untuk memastikan SMTP FASKO bekerja. Jika Anda menerima pesan ini, integrasi email berfungsi normal.',
    link: '/dashboard/admin-unit',
  });
}
