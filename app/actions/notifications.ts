'use server';

import { revalidatePath } from 'next/cache';
import { verifySession } from '@/lib/auth';
import { markAllAsRead, markAsRead } from '@/lib/notifications';

export async function markNotificationAsRead(id: number) {
  const s = await verifySession();
  await markAsRead(id, s.userId);
  revalidatePath('/dashboard/notifications');
}

export async function markAllNotificationsAsRead() {
  const s = await verifySession();
  await markAllAsRead(s.userId);
  revalidatePath('/dashboard/notifications');
}
