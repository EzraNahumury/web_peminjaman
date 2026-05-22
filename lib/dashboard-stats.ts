import 'server-only';

import { query } from '@/lib/db';
import type { OrgRow } from '@/components/dashboard/OrgRequestsChart';
import { MANAGING_UNIT_LABEL, type ActivityScope, type ManagingUnit } from '@/types';

export const DASHBOARD_TREND_DAYS = 30;
export const DASHBOARD_ORG_DAYS = 90;

export type DashboardFilter =
  | { kind: 'all' }
  | { kind: 'scope'; scope: ActivityScope }
  | { kind: 'bureau'; bureau: ManagingUnit };

export function fmtDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function whereClause(filter: DashboardFilter, frAlias = 'fr'): { sql: string; params: (string | number)[] } {
  switch (filter.kind) {
    case 'all':
      return { sql: '1=1', params: [] };
    case 'scope':
      return { sql: `${frAlias}.activityScope = ?`, params: [filter.scope] };
    case 'bureau':
      return {
        sql: `EXISTS (SELECT 1 FROM facilities f WHERE f.id = ${frAlias}.facilityId AND f.managingUnit = ?)`,
        params: [filter.bureau],
      };
  }
}

export function buildTrendSeries(
  rows: { d: string | Date; total: number; approved: number }[],
  days = DASHBOARD_TREND_DAYS
): { date: string; total: number; approved: number }[] {
  const map = new Map<string, { total: number; approved: number }>();
  for (const r of rows) {
    const key = typeof r.d === 'string' ? r.d.slice(0, 10) : fmtDateKey(r.d);
    map.set(key, { total: Number(r.total), approved: Number(r.approved) });
  }
  const out: { date: string; total: number; approved: number }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = fmtDateKey(d);
    const row = map.get(key);
    out.push({ date: key, total: row?.total ?? 0, approved: row?.approved ?? 0 });
  }
  return out;
}

export async function fetchTrendData(
  filter: DashboardFilter,
  days = DASHBOARD_TREND_DAYS
): Promise<{ date: string; total: number; approved: number }[]> {
  const w = whereClause(filter);
  const rows = await query<{ d: string | Date; total: number; approved: number }>(
    `SELECT DATE(fr.createdAt) d,
            COUNT(*) total,
            SUM(CASE WHEN fr.status = 'APPROVED' THEN 1 ELSE 0 END) approved
     FROM facility_requests fr
     WHERE ${w.sql}
       AND fr.createdAt >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY DATE(fr.createdAt)
     ORDER BY d`,
    [...w.params, days]
  );
  return buildTrendSeries(rows, days);
}

export async function fetchOrgBreakdown(
  filter: DashboardFilter,
  days = DASHBOARD_ORG_DAYS,
  limit = 10
): Promise<OrgRow[]> {
  const w = whereClause(filter);
  const rows = await query<{
    organization: string;
    total: number;
    approved: number;
    rejected: number;
    pending: number;
  }>(
    `SELECT fr.organizationName AS organization,
            COUNT(*) AS total,
            SUM(CASE WHEN fr.status = 'APPROVED' THEN 1 ELSE 0 END) AS approved,
            SUM(CASE WHEN fr.status IN ('REJECTED','REJECTED_BY_BIRO_III','REJECTED_BY_WR3_WD3','CANCELLED') THEN 1 ELSE 0 END) AS rejected,
            SUM(CASE WHEN fr.status IN ('SUBMITTED','WAITING_BIRO_III','WAITING_WR3_WD3','WAITING_ADMIN_UNIT','REVISION_REQUESTED','ON_HOLD') THEN 1 ELSE 0 END) AS pending
     FROM facility_requests fr
     WHERE ${w.sql}
       AND fr.createdAt >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY fr.organizationName
     ORDER BY total DESC
     LIMIT ${limit}`,
    [...w.params, days]
  );
  return rows.map((r) => ({
    organization: r.organization,
    total: Number(r.total),
    approved: Number(r.approved),
    rejected: Number(r.rejected),
    pending: Number(r.pending),
  }));
}

export async function fetchStatusTotals(
  filter: DashboardFilter,
  days = DASHBOARD_ORG_DAYS
): Promise<{ approved: number; pending: number; rejected: number }> {
  const w = whereClause(filter);
  const [row] = await query<{ approved: number; pending: number; rejected: number }>(
    `SELECT
       SUM(CASE WHEN fr.status = 'APPROVED' THEN 1 ELSE 0 END) AS approved,
       SUM(CASE WHEN fr.status IN ('SUBMITTED','WAITING_BIRO_III','WAITING_WR3_WD3','WAITING_ADMIN_UNIT','REVISION_REQUESTED','ON_HOLD') THEN 1 ELSE 0 END) AS pending,
       SUM(CASE WHEN fr.status IN ('REJECTED','REJECTED_BY_BIRO_III','REJECTED_BY_WR3_WD3','CANCELLED') THEN 1 ELSE 0 END) AS rejected
     FROM facility_requests fr
     WHERE ${w.sql}
       AND fr.createdAt >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
    [...w.params, days]
  );
  return {
    approved: Number(row?.approved ?? 0),
    pending: Number(row?.pending ?? 0),
    rejected: Number(row?.rejected ?? 0),
  };
}

export async function fetchCategoryBreakdown(
  filter: DashboardFilter,
  days = DASHBOARD_TREND_DAYS,
  limit = 6
): Promise<{ label: string; value: number }[]> {
  const w = whereClause(filter);
  const rows = await query<{ label: string; value: number }>(
    `SELECT f.category AS label, COUNT(*) AS value
     FROM facility_requests fr
     JOIN facilities f ON f.id = fr.facilityId
     WHERE ${w.sql}
       AND fr.createdAt >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY f.category
     ORDER BY value DESC
     LIMIT ${limit}`,
    [...w.params, days]
  );
  return rows.map((r) => ({ label: r.label, value: Number(r.value) }));
}

const ROLE_LABEL: Record<string, string> = {
  PENGURUS: 'Pengurus LK/OK',
  BIRO_III: 'Biro III',
  WR3_WD3: 'WR3 / WD3',
  ADMIN_UNIT: 'Admin Unit',
  SUPER_ADMIN: 'Super Admin',
};

export async function fetchUsersByRole(): Promise<{ label: string; value: number }[]> {
  const rows = await query<{ role: string; value: number }>(
    `SELECT role, COUNT(*) AS value FROM users WHERE isActive = 1 GROUP BY role ORDER BY value DESC`
  );
  return rows.map((r) => ({
    label: ROLE_LABEL[r.role] ?? r.role,
    value: Number(r.value),
  }));
}

export async function fetchBureauBreakdown(
  days = DASHBOARD_TREND_DAYS
): Promise<{ label: string; value: number }[]> {
  const rows = await query<{ unit: string; value: number }>(
    `SELECT f.managingUnit AS unit, COUNT(*) AS value
     FROM facility_requests fr
     JOIN facilities f ON f.id = fr.facilityId
     WHERE fr.createdAt >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     GROUP BY f.managingUnit
     ORDER BY value DESC`,
    [days]
  );
  return rows.map((r) => ({
    label: MANAGING_UNIT_LABEL[r.unit as ManagingUnit] ?? r.unit,
    value: Number(r.value),
  }));
}
