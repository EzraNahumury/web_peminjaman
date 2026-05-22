'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { execute, query, queryOne } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { toMysqlDateTime } from '@/lib/request-code';
import type { FacilityBlock, ManagingUnit } from '@/types';

const BlockSchema = z
  .object({
    facilityId: z.string().optional(),
    startDateTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Tanggal/jam mulai tidak valid',
    }),
    endDateTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Tanggal/jam selesai tidak valid',
    }),
    reason: z.string().trim().min(3, 'Alasan minimal 3 karakter'),
  })
  .refine((d) => {
    const s = new Date(d.startDateTime);
    const e = new Date(d.endDateTime);
    return !isNaN(s.getTime()) && !isNaN(e.getTime()) && e > s;
  }, {
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

  // Scope enforcement for ADMIN_UNIT: cannot block kampus-wide, cannot block other units
  if (session.role === 'ADMIN_UNIT') {
    const bureau = (session.bureauScope ?? null) as ManagingUnit | null;
    if (!bureau) return { error: 'Akun belum memiliki unit pengelola' };
    if (facilityId == null) {
      return { error: 'Admin Unit tidak dapat memblokir seluruh kampus' };
    }
    const f = await queryOne<{ managingUnit: ManagingUnit }>(
      'SELECT managingUnit FROM facilities WHERE id = ?',
      [facilityId]
    );
    if (!f) return { error: 'Fasilitas tidak ditemukan' };
    if (f.managingUnit !== bureau) {
      return { error: 'Fasilitas di luar lingkup unit Anda' };
    }
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
  const session = await requireRole('ADMIN_UNIT', 'SUPER_ADMIN');

  if (session.role === 'ADMIN_UNIT') {
    const bureau = (session.bureauScope ?? null) as ManagingUnit | null;
    if (!bureau) return;
    const row = await queryOne<{ facilityId: number | null; managingUnit: ManagingUnit | null }>(
      `SELECT b.facilityId, f.managingUnit
       FROM facility_blocks b
       LEFT JOIN facilities f ON f.id = b.facilityId
       WHERE b.id = ?`,
      [id]
    );
    if (!row) return;
    // Cannot delete kampus-wide blocks or blocks for other units
    if (row.facilityId == null || row.managingUnit !== bureau) return;
  }

  await execute('DELETE FROM facility_blocks WHERE id = ?', [id]);
  revalidatePath('/dashboard/admin-unit/blocks');
}

export async function getBlocks(bureau?: ManagingUnit | null) {
  await requireRole('ADMIN_UNIT', 'SUPER_ADMIN');
  if (bureau) {
    return query<FacilityBlock & { facilityName: string | null; createdByName: string | null }>(
      `SELECT b.*, f.name AS facilityName, u.name AS createdByName
       FROM facility_blocks b
       JOIN facilities f ON f.id = b.facilityId
       LEFT JOIN users u ON u.id = b.createdBy
       WHERE f.managingUnit = ?
       ORDER BY b.createdAt DESC, b.id DESC`,
      [bureau]
    );
  }
  return query<FacilityBlock & { facilityName: string | null; createdByName: string | null }>(
    `SELECT b.*, f.name AS facilityName, u.name AS createdByName
     FROM facility_blocks b
     LEFT JOIN facilities f ON f.id = b.facilityId
     LEFT JOIN users u ON u.id = b.createdBy
     ORDER BY b.createdAt DESC, b.id DESC`
  );
}
