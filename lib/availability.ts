import 'server-only';
import { query, type SqlParam } from '@/lib/db';
import type { Facility, FacilityBlock, FacilityRequest } from '@/types';

const BLOCKING_SQL = "('APPROVED','WAITING_BIRO_III','WAITING_WR3_WD3','WAITING_ADMIN_UNIT')";

export async function findOverlap(
  facilityId: number,
  start: Date,
  end: Date,
  excludeRequestId?: number
): Promise<FacilityRequest[]> {
  const params: SqlParam[] = [facilityId, end, start];
  let sql = `SELECT * FROM facility_requests
             WHERE facilityId = ?
               AND status IN ${BLOCKING_SQL}
               AND startDateTime < ?
               AND endDateTime > ?`;
  if (excludeRequestId) {
    sql += ' AND id <> ?';
    params.push(excludeRequestId);
  }
  return query<FacilityRequest>(sql, params);
}

export async function findBlocks(facilityId: number, start: Date, end: Date): Promise<FacilityBlock[]> {
  return query<FacilityBlock>(
    `SELECT * FROM facility_blocks
     WHERE (facilityId = ? OR facilityId IS NULL)
       AND startDateTime < ?
       AND endDateTime > ?`,
    [facilityId, end, start]
  );
}

export async function isAvailable(facilityId: number, start: Date, end: Date, excludeRequestId?: number) {
  const [overlaps, blocks] = await Promise.all([
    findOverlap(facilityId, start, end, excludeRequestId),
    findBlocks(facilityId, start, end),
  ]);
  return overlaps.length === 0 && blocks.length === 0;
}

export async function getAlternatives(facilityId: number, start: Date, end: Date): Promise<Facility[]> {
  const facility = await query<Facility>('SELECT * FROM facilities WHERE id = ? LIMIT 1', [facilityId]);
  if (!facility[0]) return [];
  const category = facility[0].category;
  const rows = await query<Facility>(
    `SELECT f.* FROM facilities f
     WHERE f.isActive = 1
       AND f.id <> ?
       AND f.category = ?
       AND NOT EXISTS (
         SELECT 1 FROM facility_requests fr
         WHERE fr.facilityId = f.id
           AND fr.status IN ${BLOCKING_SQL}
           AND fr.startDateTime < ?
           AND fr.endDateTime > ?
       )
       AND NOT EXISTS (
         SELECT 1 FROM facility_blocks fb
         WHERE (fb.facilityId = f.id OR fb.facilityId IS NULL)
           AND fb.startDateTime < ?
           AND fb.endDateTime > ?
       )
     ORDER BY f.capacity DESC
     LIMIT 5`,
    [facilityId, category, end, start, end, start]
  );
  return rows;
}
