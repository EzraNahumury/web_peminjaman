'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { execute, query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { toMysqlDateTime } from '@/lib/request-code';
import type { FacilityBlock } from '@/types';

const BlockSchema = z
  .object({
    facilityId: z.string().optional(),
    startDateTime: z.string().min(1),
    endDateTime: z.string().min(1),
    reason: z.string().trim().min(3, 'Alasan minimal 3 karakter'),
  })
  .refine((d) => new Date(d.endDateTime) > new Date(d.startDateTime), {
    message: 'Tanggal/jam selesai harus setelah mulai',
    path: ['endDateTime'],
  });

export type BlockFormState =
  | { error?: string; fieldErrors?: Record<string, string[]> }
  | undefined;

export async function createFacilityBlock(_prev: BlockFormState, formData: FormData): Promise<BlockFormState> {
  const session = await requireRole('ADMIN_UNIT', 'SUPER_ADMIN');
  const parsed = BlockSchema.safeParse({
    facilityId: formData.get('facilityId') || undefined,
    startDateTime: formData.get('startDateTime'),
    endDateTime: formData.get('endDateTime'),
    reason: formData.get('reason'),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const facilityId = d.facilityId && d.facilityId !== 'ALL' ? Number(d.facilityId) : null;
  if (facilityId != null && !Number.isFinite(facilityId)) {
    return { error: 'Fasilitas tidak valid' };
  }

  await execute(
    'INSERT INTO facility_blocks (facilityId, startDateTime, endDateTime, reason, createdBy) VALUES (?,?,?,?,?)',
    [
      facilityId,
      toMysqlDateTime(new Date(d.startDateTime)),
      toMysqlDateTime(new Date(d.endDateTime)),
      d.reason,
      session.userId,
    ]
  );
  revalidatePath('/dashboard/admin-unit/blocks');
  return { error: undefined };
}

export async function deleteFacilityBlock(id: number) {
  await requireRole('ADMIN_UNIT', 'SUPER_ADMIN');
  await execute('DELETE FROM facility_blocks WHERE id = ?', [id]);
  revalidatePath('/dashboard/admin-unit/blocks');
}

export async function getBlocks() {
  await requireRole('ADMIN_UNIT', 'SUPER_ADMIN');
  return query<FacilityBlock & { facilityName: string | null; createdByName: string | null }>(
    `SELECT b.*, f.name AS facilityName, u.name AS createdByName
     FROM facility_blocks b
     LEFT JOIN facilities f ON f.id = b.facilityId
     LEFT JOIN users u ON u.id = b.createdBy
     ORDER BY b.startDateTime DESC`
  );
}
