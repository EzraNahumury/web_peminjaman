'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { execute, query, queryOne } from '@/lib/db';
import { requireRole, verifySession } from '@/lib/auth';
import { findBlocks, findOverlap, getAlternatives, isAvailable } from '@/lib/availability';
import { createNotificationForRole } from '@/lib/notifications';
import { FacilityRequestSchema } from '@/lib/validations';
import { generateRequestCode, toMysqlDateTime } from '@/lib/request-code';
import type { Facility, FacilityRequest } from '@/types';

export type RequestFormState =
  | { error?: string; fieldErrors?: Record<string, string[]>; alternatives?: Facility[] }
  | undefined;

export async function checkAvailability(facilityId: number, start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e <= s) {
    return { ok: false, available: false, reason: 'Tanggal/jam tidak valid', blocked: false, blockReason: null, alternatives: [] };
  }
  const blocks = await findBlocks(facilityId, s, e);
  if (blocks.length > 0) {
    const alts = await getAlternatives(facilityId, s, e);
    return { ok: true, available: false, blocked: true, blockReason: blocks[0].reason, alternatives: alts };
  }
  const ok = await isAvailable(facilityId, s, e);
  if (ok) return { ok: true, available: true, blocked: false, blockReason: null, alternatives: [] };
  const alts = await getAlternatives(facilityId, s, e);
  return { ok: true, available: false, blocked: false, blockReason: null, alternatives: alts };
}

export async function createFacilityRequest(_prev: RequestFormState, formData: FormData): Promise<RequestFormState> {
  const session = await requireRole('PENGURUS');
  const parsed = FacilityRequestSchema.safeParse({
    facilityId: formData.get('facilityId'),
    activityName: formData.get('activityName'),
    organizationName: formData.get('organizationName'),
    personInCharge: formData.get('personInCharge'),
    identityNumber: formData.get('identityNumber'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    startDateTime: formData.get('startDateTime'),
    endDateTime: formData.get('endDateTime'),
    participantCount: formData.get('participantCount') || undefined,
    purpose: formData.get('purpose'),
    description: formData.get('description'),
    activityScope: formData.get('activityScope') || 'UNIVERSITAS',
    activityLevel: formData.get('activityLevel') || 'KEMAHASISWAAN',
    additionalNeeds: formData.get('additionalNeeds'),
    attachmentUrl: formData.get('attachmentUrl'),
    notes: formData.get('notes'),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const facility = await queryOne<Facility>('SELECT * FROM facilities WHERE id = ? AND isActive = 1', [d.facilityId]);
  if (!facility) return { error: 'Fasilitas tidak ditemukan / non-aktif' };

  const start = new Date(d.startDateTime);
  const end = new Date(d.endDateTime);
  const blocks = await findBlocks(d.facilityId, start, end);
  if (blocks.length > 0) {
    const alts = await getAlternatives(d.facilityId, start, end);
    return { error: `Fasilitas diblokir admin pada jadwal tersebut: ${blocks[0].reason}`, alternatives: alts };
  }
  const overlaps = await findOverlap(d.facilityId, start, end);
  if (overlaps.length > 0) {
    const alts = await getAlternatives(d.facilityId, start, end);
    return { error: 'Fasilitas tidak tersedia pada jadwal tersebut', alternatives: alts };
  }

  const code = generateRequestCode();
  const result = await execute(
    `INSERT INTO facility_requests
     (requestCode, userId, facilityId, activityName, organizationName, personInCharge, identityNumber,
      email, phone, startDateTime, endDateTime, participantCount, purpose, description, activityScope, activityLevel,
      additionalNeeds, attachmentUrl, notes, status, currentStep, submittedAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())`,
    [
      code, session.userId, d.facilityId, d.activityName, d.organizationName, d.personInCharge,
      d.identityNumber || null, d.email, d.phone, toMysqlDateTime(start), toMysqlDateTime(end),
      d.participantCount ?? null, d.purpose, d.description, d.activityScope, d.activityLevel,
      d.additionalNeeds || null, d.attachmentUrl || null, d.notes || null, 'WAITING_BIRO_III', 'BIRO_III',
    ]
  );

  await execute(
    `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
     VALUES (?,?,?,?,?,?)`,
    [result.insertId, session.userId, 'SUBMIT', null, 'WAITING_BIRO_III', null]
  );

  void code;
  await createNotificationForRole(
    'BIRO_III',
    'Pengajuan baru menunggu review',
    `${facility.name} — ${d.activityName} (${d.organizationName})`,
    `/dashboard/biro-iii/requests/${result.insertId}`
  );

  revalidatePath('/dashboard/pengurus');
  redirect(`/dashboard/pengurus/requests/${result.insertId}`);
}

export async function updateRevisionRequest(
  requestId: number,
  _prev: RequestFormState,
  formData: FormData
): Promise<RequestFormState> {
  const session = await requireRole('PENGURUS');
  const current = await queryOne<FacilityRequest>(
    'SELECT * FROM facility_requests WHERE id = ? AND userId = ?',
    [requestId, session.userId]
  );
  if (!current) return { error: 'Pengajuan tidak ditemukan' };
  if (current.status !== 'REVISION_REQUESTED') return { error: 'Hanya bisa diedit saat status REVISION_REQUESTED' };

  const parsed = FacilityRequestSchema.safeParse({
    facilityId: formData.get('facilityId'),
    activityName: formData.get('activityName'),
    organizationName: formData.get('organizationName'),
    personInCharge: formData.get('personInCharge'),
    identityNumber: formData.get('identityNumber'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    startDateTime: formData.get('startDateTime'),
    endDateTime: formData.get('endDateTime'),
    participantCount: formData.get('participantCount') || undefined,
    purpose: formData.get('purpose'),
    description: formData.get('description'),
    activityScope: formData.get('activityScope') || current.activityScope || 'UNIVERSITAS',
    activityLevel: formData.get('activityLevel') || current.activityLevel || 'KEMAHASISWAAN',
    additionalNeeds: formData.get('additionalNeeds'),
    attachmentUrl: formData.get('attachmentUrl'),
    notes: formData.get('notes'),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const start = new Date(d.startDateTime);
  const end = new Date(d.endDateTime);
  const blocks = await findBlocks(d.facilityId, start, end);
  if (blocks.length > 0) {
    const alts = await getAlternatives(d.facilityId, start, end);
    return { error: `Fasilitas diblokir admin pada jadwal tersebut: ${blocks[0].reason}`, alternatives: alts };
  }
  const overlaps = await findOverlap(d.facilityId, start, end, requestId);
  if (overlaps.length > 0) {
    const alts = await getAlternatives(d.facilityId, start, end);
    return { error: 'Fasilitas tidak tersedia pada jadwal tersebut', alternatives: alts };
  }

  await execute(
    `UPDATE facility_requests SET
       facilityId=?, activityName=?, organizationName=?, personInCharge=?, identityNumber=?,
       email=?, phone=?, startDateTime=?, endDateTime=?, participantCount=?, purpose=?,
       description=?, activityScope=?, activityLevel=?, additionalNeeds=?, attachmentUrl=?, notes=?, status=?, currentStep=?, submittedAt=NOW()
     WHERE id = ?`,
    [
      d.facilityId, d.activityName, d.organizationName, d.personInCharge, d.identityNumber || null,
      d.email, d.phone, toMysqlDateTime(start), toMysqlDateTime(end), d.participantCount ?? null,
      d.purpose, d.description, d.activityScope, d.activityLevel, d.additionalNeeds || null,
      d.attachmentUrl || null, d.notes || null, 'WAITING_BIRO_III', 'BIRO_III', requestId,
    ]
  );

  await execute(
    `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
     VALUES (?,?,?,?,?,?)`,
    [requestId, session.userId, 'RESUBMIT_REVISION', 'REVISION_REQUESTED', 'WAITING_BIRO_III', null]
  );

  const facilityForResubmit = await queryOne<{ name: string }>(
    'SELECT name FROM facilities WHERE id = ?',
    [d.facilityId]
  );
  const facLabelResubmit = facilityForResubmit?.name ?? current.activityName;
  await createNotificationForRole(
    'BIRO_III',
    'Revisi pengajuan disubmit ulang',
    `Peminjaman ${facLabelResubmit} — ${d.activityName} disubmit ulang setelah revisi.`,
    `/dashboard/biro-iii/requests/${requestId}`
  );

  revalidatePath(`/dashboard/pengurus/requests/${requestId}`);
  redirect(`/dashboard/pengurus/requests/${requestId}`);
}

export async function cancelRequest(requestId: number, reason?: string | null) {
  const session = await requireRole('PENGURUS');
  const current = await queryOne<FacilityRequest>(
    'SELECT * FROM facility_requests WHERE id = ? AND userId = ?',
    [requestId, session.userId]
  );
  if (!current) return { error: 'Pengajuan tidak ditemukan' };
  if (['REJECTED', 'REJECTED_BY_BIRO_III', 'REJECTED_BY_WR3_WD3', 'CANCELLED'].includes(current.status)) {
    return { error: 'Pengajuan sudah dalam status final, tidak bisa dibatalkan' };
  }

  const wasApproved = current.status === 'APPROVED';

  await execute('UPDATE facility_requests SET status = ?, currentStep = NULL WHERE id = ?', ['CANCELLED', requestId]);

  if (wasApproved) {
    await execute(
      "UPDATE facility_bookings SET status = 'CANCELLED' WHERE requestId = ?",
      [requestId]
    );
  }

  await execute(
    `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
     VALUES (?,?,?,?,?,?)`,
    [requestId, session.userId, 'CANCEL', current.status, 'CANCELLED', reason || null]
  );

  if (wasApproved) {
    const facilityForCancel = await queryOne<{ name: string }>(
      'SELECT name FROM facilities WHERE id = ?',
      [current.facilityId]
    );
    const facLabelCancel = facilityForCancel?.name ?? current.activityName;
    const msg = `Peminjaman ${facLabelCancel} — ${current.activityName} dibatalkan oleh pengaju${reason ? `: ${reason}` : ''}.`;
    for (const role of ['BIRO_III', 'WR3_WD3', 'ADMIN_UNIT'] as const) {
      await createNotificationForRole(role, 'Pengajuan dibatalkan', msg, null);
    }
  }

  revalidatePath(`/dashboard/pengurus/requests/${requestId}`);
  revalidatePath('/dashboard/pengurus/requests');
  revalidatePath('/dashboard/pengurus/calendar');
  return { ok: true };
}

export async function getMyRequests() {
  const session = await verifySession();
  return query<FacilityRequest & { facilityName: string }>(
    `SELECT fr.*, f.name AS facilityName
     FROM facility_requests fr JOIN facilities f ON f.id = fr.facilityId
     WHERE fr.userId = ?
     ORDER BY fr.createdAt DESC`,
    [session.userId]
  );
}
