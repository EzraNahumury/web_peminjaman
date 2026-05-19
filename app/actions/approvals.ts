'use server';

import { revalidatePath } from 'next/cache';
import { execute, queryOne, query } from '@/lib/db';
import { requireRole } from '@/lib/auth';
import { createNotification, createNotificationForRole } from '@/lib/notifications';
import { findBlocks, findOverlap } from '@/lib/availability';
import { PRIORITY_ORDER_SQL } from '@/utils/priority';
import { toMysqlDateTime } from '@/lib/request-code';
import type { FacilityRequest, RequestStatus } from '@/types';

async function loadRequest(id: number) {
  return queryOne<FacilityRequest>('SELECT * FROM facility_requests WHERE id = ?', [id]);
}

async function notifyOwner(
  req: FacilityRequest,
  title: string,
  message: string,
  opts?: { skipWA?: boolean }
) {
  await createNotification(
    req.userId,
    title,
    message,
    `/dashboard/pengurus/requests/${req.id}`,
    opts
  );
}

async function notifyValidatorsByScope(scope: string, title: string, message: string, link: string) {
  const users = await query<{ id: number }>(
    'SELECT id FROM users WHERE role = ? AND isActive = 1 AND userScope = ?',
    ['WR3_WD3', scope]
  );
  await Promise.all(users.map((u) => createNotification(u.id, title, message, link)));
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

  const scopeLabel = req.activityScope === 'FAKULTAS' ? 'WD3 (Fakultas)' : 'WR3 (Universitas)';
  await notifyValidatorsByScope(
    req.activityScope,
    `Pengajuan menunggu validasi ${scopeLabel}`,
    `Pengajuan ${req.requestCode} - ${req.activityName}`,
    `/dashboard/wr3-wd3/requests/${requestId}`
  );
  await notifyOwner(
    req,
    `Pengajuan disetujui Biro III`,
    `Pengajuan ${req.requestCode} diteruskan ke ${scopeLabel}`,
    { skipWA: true }
  );
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
  await notifyOwner(req, 'Pengajuan ditolak', `Pengajuan ${req.requestCode} ditolak oleh Biro III`, { skipWA: true });
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
  await notifyOwner(
    req,
    'Pengajuan disetujui oleh Biro III dan WR3/WD3',
    `Pengajuan ${req.requestCode} telah disetujui. Silakan upload surat yang sudah divalidasi pada halaman detail pengajuan untuk diteruskan ke Admin Unit.`
  );
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

export async function offerAlternativeByAdminUnit(
  requestId: number,
  params: {
    alternativeFacilityId?: number | null;
    alternativeStart?: string | null;
    alternativeEnd?: string | null;
    note: string | null;
  }
) {
  const session = await requireRole('ADMIN_UNIT');
  const req = await loadRequest(requestId);
  if (!req) return { error: 'Pengajuan tidak ditemukan' };
  if (req.status !== 'WAITING_ADMIN_UNIT') return { error: 'Status tidak valid' };

  let altFacilityName: string | null = null;
  if (params.alternativeFacilityId) {
    const f = await queryOne<{ name: string }>(
      'SELECT name FROM facilities WHERE id = ? AND isActive = 1',
      [params.alternativeFacilityId]
    );
    if (!f) return { error: 'Fasilitas alternatif tidak ditemukan' };
    altFacilityName = f.name;
  }

  const parts: string[] = ['ALTERNATIF DARI ADMIN UNIT:'];
  if (altFacilityName) parts.push(`- Fasilitas: ${altFacilityName}`);
  if (params.alternativeStart) parts.push(`- Mulai: ${params.alternativeStart}`);
  if (params.alternativeEnd) parts.push(`- Selesai: ${params.alternativeEnd}`);
  if (params.note?.trim()) parts.push('', params.note.trim());
  const finalNote = parts.join('\n');

  await execute(
    'UPDATE facility_requests SET status = ?, currentStep = ? WHERE id = ?',
    ['REVISION_REQUESTED', 'PENGURUS_REVISION', requestId]
  );
  await execute(
    'INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note) VALUES (?,?,?,?,?,?)',
    [requestId, session.userId, 'OFFER_ALTERNATIVE', 'WAITING_ADMIN_UNIT', 'REVISION_REQUESTED', finalNote]
  );
  await notifyOwner(
    req,
    'Alternatif ditawarkan',
    `Admin Unit menawarkan alternatif untuk ${req.requestCode}. Tinjau dan revisi pengajuan.`
  );
  revalidatePath(`/dashboard/admin-unit/requests/${requestId}`);
  return { ok: true };
}

export async function holdByAdminUnit(requestId: number, note: string | null) {
  const session = await requireRole('ADMIN_UNIT');
  const req = await loadRequest(requestId);
  if (!req) return { error: 'Pengajuan tidak ditemukan' };
  if (req.status !== 'WAITING_ADMIN_UNIT') return { error: 'Status tidak valid' };
  await execute(
    'UPDATE facility_requests SET status = ?, currentStep = ? WHERE id = ?',
    ['ON_HOLD', 'ADMIN_UNIT', requestId]
  );
  await execute(
    'INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note) VALUES (?,?,?,?,?,?)',
    [requestId, session.userId, 'HOLD', 'WAITING_ADMIN_UNIT', 'ON_HOLD', note]
  );
  await notifyOwner(
    req,
    'Pengajuan ditahan sementara',
    note || `Pengajuan ${req.requestCode} ditahan oleh Admin Unit untuk peninjauan tambahan.`
  );
  revalidatePath(`/dashboard/admin-unit/requests/${requestId}`);
  return { ok: true };
}

export async function resumeByAdminUnit(requestId: number, note: string | null) {
  const session = await requireRole('ADMIN_UNIT');
  const req = await loadRequest(requestId);
  if (!req) return { error: 'Pengajuan tidak ditemukan' };
  if (req.status !== 'ON_HOLD') return { error: 'Status tidak valid' };
  await execute(
    'UPDATE facility_requests SET status = ?, currentStep = ? WHERE id = ?',
    ['WAITING_ADMIN_UNIT', 'ADMIN_UNIT', requestId]
  );
  await execute(
    'INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note) VALUES (?,?,?,?,?,?)',
    [requestId, session.userId, 'RESUME', 'ON_HOLD', 'WAITING_ADMIN_UNIT', note]
  );
  await notifyOwner(
    req,
    'Pengajuan dilanjutkan',
    `Pengajuan ${req.requestCode} kembali ditinjau Admin Unit.`
  );
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

export async function getRequestsForRole(
  status: RequestStatus,
  options?: { scope?: 'UNIVERSITAS' | 'FAKULTAS'; page?: number; pageSize?: number }
) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 10;
  const offset = (page - 1) * pageSize;

  const where: string[] = ['fr.status = ?'];
  const params: (string | number)[] = [status];
  if (options?.scope) {
    where.push('fr.activityScope = ?');
    params.push(options.scope);
  }
  const whereSql = where.join(' AND ');

  const [{ total }] = await query<{ total: number }>(
    `SELECT COUNT(*) AS total FROM facility_requests fr WHERE ${whereSql}`,
    params
  );
  const items = await query<FacilityRequest & { facilityName: string; userName: string; priorityScore: number }>(
    `SELECT fr.*, f.name AS facilityName, u.name AS userName,
       (CASE fr.activityLevel
          WHEN 'AKADEMIK' THEN 3
          WHEN 'INSTITUSIONAL' THEN 2
          ELSE 1
        END + 0.1 * TIMESTAMPDIFF(HOUR, fr.submittedAt, NOW())) AS priorityScore
     FROM facility_requests fr
     JOIN facilities f ON f.id = fr.facilityId
     JOIN users u ON u.id = fr.userId
     WHERE ${whereSql}
     ORDER BY ${PRIORITY_ORDER_SQL}
     LIMIT ${pageSize} OFFSET ${offset}`,
    params
  );
  return { items, total, page, pageSize };
}

