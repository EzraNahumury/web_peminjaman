'use server';

import { revalidatePath } from 'next/cache';
import { execute, query, queryOne } from '@/lib/db';
import { requireRole, verifySession } from '@/lib/auth';
import { findBlocks, findOverlap, getAlternatives, isAvailable } from '@/lib/availability';
import { createNotificationForBureau, createNotificationForRole } from '@/lib/notifications';
import { FacilityRequestSchema } from '@/lib/validations';
import { generateRequestCode, toMysqlDateTime } from '@/lib/request-code';
import { isSystemValidatedSurat } from '@/lib/surat';
import { REQUEST_LIST_ORDER_SQL } from '@/utils/priority';
import type { Facility, FacilityRequest } from '@/types';

export type RequestFormState =
  | { error?: string; fieldErrors?: Record<string, string[]>; alternatives?: Facility[] }
  | { ok: true; requestId: number }
  | undefined;

/** Payload serializable dari client (FormData manual tidak terkirim ke server action). */
export type RequestFormPayload = {
  facilityId: string | number;
  activityName: string;
  organizationName: string;
  personInCharge: string;
  identityNumber?: string;
  email: string;
  phone: string;
  startDateTime: string;
  endDateTime: string;
  participantCount?: string | number;
  purpose: string;
  description?: string;
  activityScope?: string;
  activityLevel?: string;
  additionalNeeds?: string;
  attachmentUrl?: string;
  notes?: string;
};

function parseRequestPayload(input: RequestFormPayload) {
  return {
    facilityId: input.facilityId,
    activityName: input.activityName,
    organizationName: input.organizationName,
    personInCharge: input.personInCharge,
    identityNumber: input.identityNumber ?? '',
    email: input.email,
    phone: input.phone,
    startDateTime: input.startDateTime,
    endDateTime: input.endDateTime,
    participantCount: input.participantCount ?? undefined,
    purpose: input.purpose,
    description: input.description,
    activityScope: input.activityScope || 'UNIVERSITAS',
    activityLevel: input.activityLevel || 'KEMAHASISWAAN',
    additionalNeeds: input.additionalNeeds,
    attachmentUrl: input.attachmentUrl,
    notes: input.notes,
  };
}

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

export type FacilityScheduleItem = {
  start: string;
  end: string;
  label: string;
  kind: 'booking' | 'block';
};

/**
 * Jadwal terisi (booking aktif + blokir admin) untuk satu fasilitas, jendela
 * ~7 bulan ke depan. Dipakai DatePicker form untuk menandai tanggal yang sudah dipesan.
 */
export async function getFacilitySchedule(facilityId: number): Promise<FacilityScheduleItem[]> {
  if (!facilityId || Number.isNaN(facilityId)) return [];
  await verifySession();
  const now = new Date();
  const winStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const winEnd = new Date(now.getFullYear(), now.getMonth() + 7, 0, 23, 59, 59);

  const bookings = await query<{ startDateTime: string; endDateTime: string; activityName: string }>(
    `SELECT startDateTime, endDateTime, activityName FROM facility_requests
     WHERE facilityId = ?
       AND status IN ('APPROVED','WAITING_BIRO_III','WAITING_WR3_WD3','WAITING_ADMIN_UNIT','REVISION_REQUESTED','ON_HOLD')
       AND startDateTime <= ? AND endDateTime >= ?
     ORDER BY startDateTime ASC`,
    [facilityId, winEnd, winStart]
  );
  const blocks = await query<{ startDateTime: string; endDateTime: string; reason: string }>(
    `SELECT startDateTime, endDateTime, reason FROM facility_blocks
     WHERE (facilityId = ? OR facilityId IS NULL)
       AND startDateTime <= ? AND endDateTime >= ?
     ORDER BY startDateTime ASC`,
    [facilityId, winEnd, winStart]
  );

  return [
    ...bookings.map((b) => ({
      start: new Date(b.startDateTime).toISOString(),
      end: new Date(b.endDateTime).toISOString(),
      label: b.activityName,
      kind: 'booking' as const,
    })),
    ...blocks.map((b) => ({
      start: new Date(b.startDateTime).toISOString(),
      end: new Date(b.endDateTime).toISOString(),
      label: b.reason,
      kind: 'block' as const,
    })),
  ];
}

export async function createFacilityRequest(
  _prev: RequestFormState,
  input: RequestFormPayload
): Promise<RequestFormState> {
  const session = await requireRole('PENGURUS');
  const parsed = FacilityRequestSchema.safeParse(parseRequestPayload(input));
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const facility = await queryOne<Facility>('SELECT * FROM facilities WHERE id = ? AND isActive = 1', [d.facilityId]);
  if (!facility) return { error: 'Fasilitas tidak ditemukan / non-aktif' };

  if (facility.capacity != null && d.participantCount != null && d.participantCount > facility.capacity) {
    return {
      fieldErrors: {
        participantCount: [
          `Jumlah peserta ${d.participantCount} melebihi kapasitas ${facility.name} (${facility.capacity}).`,
        ],
      },
    };
  }

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
  await createNotificationForBureau(
    facility.managingUnit as 'BIRO_I' | 'BIRO_IV' | 'PPLK' | 'KRT' | 'LPAIP',
    'Pengajuan baru untuk unit Anda',
    `${facility.name} — ${d.activityName} (${d.organizationName}) sedang dalam validasi Biro III. Akan diteruskan ke unit Anda setelah lolos validasi tahap 1 dan 2.`,
    `/dashboard/admin-unit/requests`
  );

  revalidatePath('/dashboard/pengurus');
  revalidatePath('/dashboard/pengurus/requests');
  return { ok: true, requestId: result.insertId };
}

export async function updateRevisionRequest(
  requestId: number,
  _prev: RequestFormState,
  input: RequestFormPayload
): Promise<RequestFormState> {
  const session = await requireRole('PENGURUS');
  const current = await queryOne<FacilityRequest>(
    'SELECT * FROM facility_requests WHERE id = ? AND userId = ?',
    [requestId, session.userId]
  );
  if (!current) return { error: 'Pengajuan tidak ditemukan' };
  if (current.status !== 'REVISION_REQUESTED') return { error: 'Hanya bisa diedit saat status REVISION_REQUESTED' };

  const raw = parseRequestPayload(input);
  const parsed = FacilityRequestSchema.safeParse({
    ...raw,
    activityScope: raw.activityScope || current.activityScope || 'UNIVERSITAS',
    activityLevel: raw.activityLevel || current.activityLevel || 'KEMAHASISWAAN',
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const d = parsed.data;
  const facility = await queryOne<Facility>('SELECT * FROM facilities WHERE id = ? AND isActive = 1', [d.facilityId]);
  if (!facility) return { error: 'Fasilitas tidak ditemukan / non-aktif' };
  if (facility.capacity != null && d.participantCount != null && d.participantCount > facility.capacity) {
    return {
      fieldErrors: {
        participantCount: [
          `Jumlah peserta ${d.participantCount} melebihi kapasitas ${facility.name} (${facility.capacity}).`,
        ],
      },
    };
  }

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
      d.attachmentUrl || null, d.notes || null, 'WAITING_ADMIN_UNIT', 'ADMIN_UNIT', requestId,
    ]
  );

  // Revisi diminta oleh Admin Unit (terjadi setelah Biro III & WR3/WD3
  // sudah menyetujui). Maka setelah disubmit ulang, alur langsung kembali
  // ke Admin Unit — tidak mengulang validasi Biro III & WR3/WD3.
  await execute(
    `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
     VALUES (?,?,?,?,?,?)`,
    [requestId, session.userId, 'RESUBMIT_REVISION', 'REVISION_REQUESTED', 'WAITING_ADMIN_UNIT', null]
  );

  const facilityForResubmit = await queryOne<{ name: string; managingUnit: string }>(
    'SELECT name, managingUnit FROM facilities WHERE id = ?',
    [d.facilityId]
  );
  const facLabelResubmit = facilityForResubmit?.name ?? current.activityName;
  if (facilityForResubmit) {
    await createNotificationForBureau(
      facilityForResubmit.managingUnit as 'BIRO_I' | 'BIRO_IV' | 'PPLK' | 'KRT' | 'LPAIP',
      'Revisi pengajuan disubmit ulang',
      `Peminjaman ${facLabelResubmit} — ${d.activityName} telah direvisi pengaju dan kembali menunggu persetujuan unit Anda.`,
      `/dashboard/admin-unit/requests/${requestId}`
    );
  }

  revalidatePath(`/dashboard/pengurus/requests/${requestId}`);
  revalidatePath('/dashboard/pengurus/requests');
  return { ok: true, requestId };
}

/** @deprecated Surat otomatis dari sistem setelah WR3/WD3 — upload manual tidak dipakai. */
export async function uploadSignedLetter(
  requestId: number,
  _formData: FormData
): Promise<{ ok?: boolean; error?: string; url?: string }> {
  const session = await requireRole('PENGURUS');
  const current = await queryOne<FacilityRequest>(
    'SELECT id, status FROM facility_requests WHERE id = ? AND userId = ?',
    [requestId, session.userId]
  );
  if (!current) return { error: 'Pengajuan tidak ditemukan' };
  return {
    error:
      'Surat otomatis diteruskan ke Admin Unit setelah disetujui WR3/WD3. Tidak perlu upload manual.',
  };
}

export async function removeSignedLetter(requestId: number): Promise<void> {
  const { promises: fs } = await import('node:fs');
  const path = await import('node:path');
  const session = await requireRole('PENGURUS');
  const current = await queryOne<FacilityRequest>(
    'SELECT * FROM facility_requests WHERE id = ? AND userId = ?',
    [requestId, session.userId]
  );
  if (!current) return;
  if (current.status !== 'WAITING_ADMIN_UNIT') return;
  if (isSystemValidatedSurat(current.signedLetterUrl)) return;
  if (current.signedLetterUrl) {
    const old = path.join(process.cwd(), 'public', current.signedLetterUrl.replace(/^\//, ''));
    fs.unlink(old).catch(() => {});
  }
  await execute('UPDATE facility_requests SET signedLetterUrl = NULL WHERE id = ?', [requestId]);
  revalidatePath(`/dashboard/pengurus/requests/${requestId}`);
  revalidatePath(`/dashboard/admin-unit/requests/${requestId}`);
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
     ORDER BY ${REQUEST_LIST_ORDER_SQL}`,
    [session.userId]
  );
}
