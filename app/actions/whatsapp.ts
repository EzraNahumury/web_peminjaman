'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { getWAState, logoutWA, startWA } from '@/lib/baileys';

export async function getWhatsAppStatus() {
  await requireRole('ADMIN_UNIT', 'SUPER_ADMIN');
  return getWAState();
}

export async function connectWhatsApp() {
  await requireRole('ADMIN_UNIT', 'SUPER_ADMIN');
  const state = await startWA();
  revalidatePath('/dashboard/admin-unit/whatsapp');
  revalidatePath('/dashboard/super-admin/whatsapp');
  return state;
}

export async function disconnectWhatsApp() {
  await requireRole('ADMIN_UNIT', 'SUPER_ADMIN');
  await logoutWA();
  revalidatePath('/dashboard/admin-unit/whatsapp');
  revalidatePath('/dashboard/super-admin/whatsapp');
}
