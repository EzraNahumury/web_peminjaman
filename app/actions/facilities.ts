'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { execute, queryOne } from '@/lib/db';
import { getCurrentUser, requireRole } from '@/lib/auth';
import type { ManagingUnit } from '@/types';

const FacilitySchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter'),
  category: z.string().trim().min(2, 'Kategori wajib diisi'),
  managingUnit: z.enum(['BIRO_I', 'BIRO_IV', 'PPLK', 'KRT', 'LPAIP']),
  location: z.string().trim().optional().or(z.literal('')),
  capacity: z.string().optional(),
  description: z.string().trim().optional().or(z.literal('')),
  isActive: z.string().optional(),
});

export type FacilityFormState =
  | { error?: string; fieldErrors?: Record<string, string[]> }
  | undefined;

function parseCapacity(v: string | undefined): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

async function resolveBureau(): Promise<{
  role: 'ADMIN_UNIT' | 'SUPER_ADMIN';
  bureau: ManagingUnit | null;
}> {
  const session = await requireRole('ADMIN_UNIT', 'SUPER_ADMIN');
  if (session.role === 'SUPER_ADMIN') return { role: 'SUPER_ADMIN', bureau: null };
  const user = await getCurrentUser();
  return { role: 'ADMIN_UNIT', bureau: (user?.bureauScope ?? null) as ManagingUnit | null };
}

export async function createFacility(_prev: FacilityFormState, formData: FormData): Promise<FacilityFormState> {
  const { role, bureau } = await resolveBureau();
  const parsed = FacilitySchema.safeParse({
    name: formData.get('name'),
    category: formData.get('category'),
    managingUnit: formData.get('managingUnit'),
    location: formData.get('location'),
    capacity: formData.get('capacity') as string | null ?? undefined,
    description: formData.get('description'),
    isActive: formData.get('isActive') as string | null ?? undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const d = parsed.data;
  const effectiveUnit = role === 'ADMIN_UNIT' ? (bureau ?? d.managingUnit) : d.managingUnit;
  if (role === 'ADMIN_UNIT' && bureau && d.managingUnit !== bureau) {
    return { error: `Admin Unit hanya dapat menambah fasilitas untuk unit ${bureau}` };
  }
  await execute(
    'INSERT INTO facilities (name, category, managingUnit, location, capacity, description, isActive) VALUES (?,?,?,?,?,?,?)',
    [
      d.name,
      d.category,
      effectiveUnit,
      d.location || null,
      parseCapacity(d.capacity),
      d.description || null,
      d.isActive === 'on' || d.isActive === 'true' || d.isActive === undefined ? 1 : 0,
    ]
  );
  revalidatePath('/dashboard/admin-unit/facilities');
  revalidatePath('/dashboard/facilities');
  redirect('/dashboard/admin-unit/facilities');
}

export async function updateFacility(id: number, _prev: FacilityFormState, formData: FormData): Promise<FacilityFormState> {
  const { role, bureau } = await resolveBureau();
  const existing = await queryOne<{ id: number; managingUnit: ManagingUnit }>(
    'SELECT id, managingUnit FROM facilities WHERE id = ?',
    [id]
  );
  if (!existing) return { error: 'Fasilitas tidak ditemukan' };
  if (role === 'ADMIN_UNIT' && bureau && existing.managingUnit !== bureau) {
    return { error: 'Fasilitas ini tidak dikelola unit Anda' };
  }

  const parsed = FacilitySchema.safeParse({
    name: formData.get('name'),
    category: formData.get('category'),
    managingUnit: formData.get('managingUnit'),
    location: formData.get('location'),
    capacity: formData.get('capacity') as string | null ?? undefined,
    description: formData.get('description'),
    isActive: formData.get('isActive') as string | null ?? undefined,
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };
  const d = parsed.data;
  const effectiveUnit = role === 'ADMIN_UNIT' && bureau ? bureau : d.managingUnit;
  await execute(
    `UPDATE facilities SET
       name = ?, category = ?, managingUnit = ?, location = ?, capacity = ?, description = ?, isActive = ?
     WHERE id = ?`,
    [
      d.name,
      d.category,
      effectiveUnit,
      d.location || null,
      parseCapacity(d.capacity),
      d.description || null,
      d.isActive === 'on' || d.isActive === 'true' ? 1 : 0,
      id,
    ]
  );
  revalidatePath('/dashboard/admin-unit/facilities');
  revalidatePath(`/dashboard/admin-unit/facilities/${id}/edit`);
  revalidatePath('/dashboard/facilities');
  redirect('/dashboard/admin-unit/facilities');
}

export async function toggleFacilityActive(id: number) {
  const { role, bureau } = await resolveBureau();
  if (role === 'ADMIN_UNIT' && bureau) {
    const f = await queryOne<{ managingUnit: ManagingUnit }>(
      'SELECT managingUnit FROM facilities WHERE id = ?',
      [id]
    );
    if (!f || f.managingUnit !== bureau) return;
  }
  await execute('UPDATE facilities SET isActive = NOT isActive WHERE id = ?', [id]);
  revalidatePath('/dashboard/admin-unit/facilities');
  revalidatePath('/dashboard/facilities');
}

export async function deleteFacility(id: number): Promise<void> {
  const { role, bureau } = await resolveBureau();
  if (role === 'ADMIN_UNIT' && bureau) {
    const f = await queryOne<{ managingUnit: ManagingUnit }>(
      'SELECT managingUnit FROM facilities WHERE id = ?',
      [id]
    );
    if (!f || f.managingUnit !== bureau) return;
  }
  const inUse = await queryOne<{ c: number }>(
    'SELECT COUNT(*) c FROM facility_requests WHERE facilityId = ?',
    [id]
  );
  if (inUse && inUse.c > 0) {
    await execute('UPDATE facilities SET isActive = 0 WHERE id = ?', [id]);
  } else {
    await execute('DELETE FROM facilities WHERE id = ?', [id]);
  }
  revalidatePath('/dashboard/admin-unit/facilities');
  revalidatePath('/dashboard/facilities');
}
