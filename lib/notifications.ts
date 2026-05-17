import 'server-only';
import { execute, query } from '@/lib/db';
import type { Notification, Role } from '@/types';

export async function createNotification(userId: number, title: string, message: string, link?: string | null) {
  await execute(
    'INSERT INTO notifications (userId, title, message, link) VALUES (?,?,?,?)',
    [userId, title, message, link ?? null]
  );
}

export async function createNotificationForRole(role: Role, title: string, message: string, link?: string | null) {
  const users = await query<{ id: number }>('SELECT id FROM users WHERE role = ?', [role]);
  await Promise.all(users.map((u) => createNotification(u.id, title, message, link)));
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
