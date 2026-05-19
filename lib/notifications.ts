import 'server-only';
import { execute, query } from '@/lib/db';
import { sendWhatsApp } from '@/lib/baileys';
import { sendEmail } from '@/lib/mailer';
import type { Notification, Role } from '@/types';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'FASKO';

function buildWAMessage(name: string | null, title: string, message: string): string {
  const hi = name ? `Halo ${name},\n` : '';
  return `${hi}*${APP_NAME}* — ${title}\n\n${message}`;
}

export async function createNotification(
  userId: number,
  title: string,
  message: string,
  link?: string | null,
  options?: { skipWA?: boolean; skipEmail?: boolean }
) {
  await execute(
    'INSERT INTO notifications (userId, title, message, link) VALUES (?,?,?,?)',
    [userId, title, message, link ?? null]
  );
  if (options?.skipWA && options?.skipEmail) return;
  const user = await query<{ name: string; email: string; phone: string | null }>(
    'SELECT name, email, phone FROM users WHERE id = ?',
    [userId]
  );
  if (!user[0]) return;

  if (!options?.skipWA && user[0].phone) {
    void sendWhatsApp(user[0].phone, buildWAMessage(user[0].name, title, message)).catch(() => {});
  }
  if (!options?.skipEmail && user[0].email) {
    void sendEmail({
      to: user[0].email,
      subject: `[${APP_NAME}] ${title}`,
      title,
      body: message,
      link: link ?? null,
    }).catch(() => {});
  }
}

export async function createNotificationForRole(role: Role, title: string, message: string, link?: string | null) {
  const users = await query<{ id: number }>('SELECT id FROM users WHERE role = ? AND isActive = 1', [role]);
  // staff: in-app + email, but never WA blast
  await Promise.all(
    users.map((u) => createNotification(u.id, title, message, link, { skipWA: true }))
  );
}

export async function createNotificationForBureau(
  bureau: 'BIRO_I' | 'BIRO_IV' | 'PPLK' | 'KRT' | 'LPAIP',
  title: string,
  message: string,
  link?: string | null
) {
  const users = await query<{ id: number }>(
    'SELECT id FROM users WHERE role = ? AND bureauScope = ? AND isActive = 1',
    ['ADMIN_UNIT', bureau]
  );
  await Promise.all(
    users.map((u) => createNotification(u.id, title, message, link, { skipWA: true }))
  );
}

export async function createNotificationForUserScope(
  scope: 'UNIVERSITAS' | 'FAKULTAS',
  title: string,
  message: string,
  link?: string | null
) {
  const users = await query<{ id: number }>(
    'SELECT id FROM users WHERE role = ? AND userScope = ? AND isActive = 1',
    ['WR3_WD3', scope]
  );
  await Promise.all(
    users.map((u) => createNotification(u.id, title, message, link, { skipWA: true }))
  );
}

export async function markAsRead(notificationId: number, userId: number) {
  await execute('UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?', [notificationId, userId]);
}

export async function markAllAsRead(userId: number) {
  await execute('UPDATE notifications SET isRead = 1 WHERE userId = ?', [userId]);
}

export async function getNotifications(userId: number): Promise<Notification[]> {
  return query<Notification>(
    'SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 50',
    [userId]
  );
}

export async function unreadCount(userId: number): Promise<number> {
  const rows = await query<{ c: number }>(
    'SELECT COUNT(*) AS c FROM notifications WHERE userId = ? AND isRead = 0',
    [userId]
  );
  return Number(rows[0]?.c ?? 0);
}
