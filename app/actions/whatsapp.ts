'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth';
import { getWAState, logoutWA, startWA } from '@/lib/baileys';

export async function getWhatsAppStatus() {
  await requireRole('SUPER_ADMIN');
  return getWAState();
}

export async function connectWhatsApp() {
  await requireRole('SUPER_ADMIN');
  const state = await startWA();
  revalidatePath('/dashboard/super-admin/whatsapp');
  return state;
}

export async function disconnectWhatsApp() {
  await requireRole('SUPER_ADMIN');
  await logoutWA();
  revalidatePath('/dashboard/super-admin/whatsapp');
}
