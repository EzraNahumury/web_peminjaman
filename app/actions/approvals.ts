'use server';

import { revalidatePath } from 'next/cache';
import { execute, queryOne, query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { createNotification, createNotificationForRole } from '@/lib/notifications';
import { findBlocks, findOverlap } from '@/lib/availability';
import type { FacilityRequest, RequestStatus } from '@/types';

async function loadRequest(id: number) {
  return queryOne<FacilityRequest>('SELECT * FROM facility_requests WHERE id = ?', [id]);
}

async function notifyOwner(req: FacilityRequest, title: string, message: string) {
  await createNotification(req.userId, title, message, `/dashboard/pengurus/requests/${req.id}`);
}

export async function approveByBiroIII(requestId: number, note: string | null) {
  const session = await requireRole('BIRO_III');
  const req = await loadRequest(requestId);
  if (!req) return { error: 'Pengajuan tidak ditemukan' };
  if (req.status !== 'WAITING_BIRO_III') return { error: 'Status tidak valid untuk aksi ini' };

  await execute('UPDATE facility_requests SET status = ?, currentStep = ? WHERE id = ?', ['WAITING_WR3_WD3', 'WR3_WD3', requestId]);
  await execute(
    'INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note) VALUES (?,?,?,?,?,?)',
    [requestId, session.userId, 'APPROVE_BIRO_III', 'WAITING_BIRO_III', 'WAITING_WR3_WD3', note]
  );
  await createNotificationForRole(
    'WR3_WD3',
    'Pengajuan menunggu validasi WR3/WD3',
    `Pengajuan ${req.requestCode} - ${req.activityName}`,
    `/dashboard/wr3-wd3/requests/${requestId}`
  );
  await notifyOwner(req, 'Pengajuan disetujui Biro III', `Pengajuan ${req.requestCode} diteruskan ke WR3/WD3`);
  revalidatePath(`/dashboard/biro-iii/requests/${requestId}`);
  return { ok: true };
}

export async function rejectByBiroIII(requestId: number, note: string | null) {
  const session = await requireRole('BIRO_III');
  const req = await loadRequest(requestId);
  if (!req) return { error: 'Pengajuan tidak ditemukan' };
  if (req.status !== 'WAITING_BIRO_III') return { error: 'Status tidak valid' };
  await execute(
    'UPDATE facility_requests SET status = ?, currentStep = NULL, rejectedAt = NOW() WHERE id = ?',
    ['REJECTED_BY_BIRO_III', requestId]
  );
  await execute(
    'INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note) VALUES (?,?,?,?,?,?)',
    [requestId, session.userId, 'REJECT_BIRO_III', 'WAITING_BIRO_III', 'REJECTED_BY_BIRO_III', note]
  );
  await notifyOwner(req, 'Pengajuan ditolak', `Pengajuan ${req.requestCode} ditolak oleh Biro III`);
  revalidatePath(`/dashboard/biro-iii/requests/${requestId}`);
  return { ok: true };
}

export async function approveByWR3WD3(requestId: number, note: string | null) {
  const session = await requireRole('WR3_WD3');
  const req = await loadRequest(requestId);
  if (!req) return { error: 'Pengajuan tidak ditemukan' };
  if (req.status !== 'WAITING_WR3_WD3') return { error: 'Status tidak valid' };
  await execute('UPDATE facility_requests SET status = ?, currentStep = ? WHERE id = ?', ['WAITING_ADMIN_UNIT', 'ADMIN_UNIT', requestId]);
  await execute(
    'INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note) VALUES (?,?,?,?,?,?)',
    [requestId, session.userId, 'APPROVE_WR3_WD3', 'WAITING_WR3_WD3', 'WAITING_ADMIN_UNIT', note]
  );
  await createNotificationForRole(
    'ADMIN_UNIT',
    'Pengajuan menunggu review akhir',
    `Pengajuan ${req.requestCode} - ${req.activityName}`,
    `/dashboard/admin-unit/requests/${requestId}`
  );
  await notifyOwner(req, 'Pengajuan disetujui WR3/WD3', `Pengajuan ${req.requestCode} diteruskan ke Admin Unit`);
  revalidatePath(`/dashboard/wr3-wd3/requests/${requestId}`);
  return { ok: true };
}

export async function rejectByWR3WD3(requestId: number, note: string | null) {
  const session = await requireRole('WR3_WD3');
  const req = await loadRequest(requestId);
  if (!req) return { error: 'Pengajuan tidak ditemukan' };
  if (req.status !== 'WAITING_WR3_WD3') return { error: 'Status tidak valid' };
  await execute(
    'UPDATE facility_requests SET status = ?, currentStep = NULL, rejectedAt = NOW() WHERE id = ?',
    ['REJECTED_BY_WR3_WD3', requestId]
  );
  await execute(
    'INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note) VALUES (?,?,?,?,?,?)',
    [requestId, session.userId, 'REJECT_WR3_WD3', 'WAITING_WR3_WD3', 'REJECTED_BY_WR3_WD3', note]
  );
  await notifyOwner(req, 'Pengajuan ditolak', `Pengajuan ${req.requestCode} ditolak oleh WR3/WD3`);
  revalidatePath(`/dashboard/wr3-wd3/requests/${requestId}`);
  return { ok: true };
}

export async function approveByAdminUnit(requestId: number, note: string | null) {
  const session = await requireRole('ADMIN_UNIT');
  const req = await loadRequest(requestId);
  if (!req) return { error: 'Pengajuan tidak ditemukan' };
  if (req.status !== 'WAITING_ADMIN_UNIT') return { error: 'Status tidak valid' };

  const start = new Date(req.startDateTime);
  const end = new Date(req.endDateTime);
  const [overlaps, blocks] = await Promise.all([
    findOverlap(req.facilityId, start, end, requestId),
    findBlocks(req.facilityId, start, end),
  ]);
  if (blocks.length > 0) return { error: `Fasilitas diblokir admin: ${blocks[0].reason}` };
  if (overlaps.length > 0) return { error: 'Terdapat bentrok jadwal — tidak dapat disetujui' };

  await execute(
    'UPDATE facility_requests SET status = ?, currentStep = ?, approvedAt = NOW() WHERE id = ?',
    ['APPROVED', 'COMPLETED', requestId]
  );
  await execute(
    `INSERT INTO facility_bookings (requestId, facilityId, startDateTime, endDateTime, status)
     VALUES (?,?,?,?, 'ACTIVE')`,
    [requestId, req.facilityId, req.startDateTime, req.endDateTime]
  );
  await execute(
    'INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note) VALUES (?,?,?,?,?,?)',
    [requestId, session.userId, 'APPROVE_ADMIN', 'WAITING_ADMIN_UNIT', 'APPROVED', note]
  );
  await notifyOwner(req, 'Pengajuan disetujui', `Pengajuan ${req.requestCode} resmi disetujui dan dijadwalkan`);
  for (const role of ['BIRO_III', 'WR3_WD3', 'ADMIN_UNIT'] as const) {
    await createNotificationForRole(role, 'Pengajuan disetujui', `Pengajuan ${req.requestCode} resmi APPROVED`, null);
  }
  revalidatePath(`/dashboard/admin-unit/requests/${requestId}`);
  return { ok: true };
}

export async function rejectByAdminUnit(requestId: number, note: string | null) {
  const session = await requireRole('ADMIN_UNIT');
  const req = await loadRequest(requestId);
  if (!req) return { error: 'Pengajuan tidak ditemukan' };
  if (req.status !== 'WAITING_ADMIN_UNIT') return { error: 'Status tidak valid' };
  await execute(
    'UPDATE facility_requests SET status = ?, currentStep = NULL, rejectedAt = NOW() WHERE id = ?',
    ['REJECTED', requestId]
  );
  await execute(
    'INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note) VALUES (?,?,?,?,?,?)',
    [requestId, session.userId, 'REJECT_ADMIN', 'WAITING_ADMIN_UNIT', 'REJECTED', note]
  );
  await notifyOwner(req, 'Pengajuan ditolak', `Pengajuan ${req.requestCode} ditolak oleh Admin Unit`);
  revalidatePath(`/dashboard/admin-unit/requests/${requestId}`);
  return { ok: true };
}

export async function requestRevisionByAdminUnit(requestId: number, note: string | null) {
  const session = await requireRole('ADMIN_UNIT');
  const req = await loadRequest(requestId);
  if (!req) return { error: 'Pengajuan tidak ditemukan' };
  if (req.status !== 'WAITING_ADMIN_UNIT') return { error: 'Status tidak valid' };
  await execute(
    'UPDATE facility_requests SET status = ?, currentStep = ? WHERE id = ?',
    ['REVISION_REQUESTED', 'PENGURUS_REVISION', requestId]
  );
  await execute(
    'INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note) VALUES (?,?,?,?,?,?)',
    [requestId, session.userId, 'REQUEST_REVISION', 'WAITING_ADMIN_UNIT', 'REVISION_REQUESTED', note]
  );
  await notifyOwner(req, 'Pengajuan butuh revisi', note || `Pengajuan ${req.requestCode} perlu direvisi`);
  revalidatePath(`/dashboard/admin-unit/requests/${requestId}`);
  return { ok: true };
}

export async function getRequestsForRole(status: RequestStatus) {
  return query<FacilityRequest & { facilityName: string; userName: string }>(
    `SELECT fr.*, f.name AS facilityName, u.name AS userName
     FROM facility_requests fr
     JOIN facilities f ON f.id = fr.facilityId
     JOIN users u ON u.id = fr.userId
     WHERE fr.status = ?
     ORDER BY fr.createdAt DESC`,
    [status]
  );
}
