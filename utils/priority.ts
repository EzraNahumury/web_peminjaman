import type { ActivityLevel } from '@/types';

export const PRIORITY_LEVELS: Record<ActivityLevel, number> = {
  AKADEMIK: 3,
  INSTITUSIONAL: 2,
  KEMAHASISWAAN: 1,
} as const;

export const AGING_RATE = 0.1;

function diffHours(a: Date, b: Date): number {
  return Math.max(0, (a.getTime() - b.getTime()) / 3_600_000);
}

export function calculatePriorityScore(req: {
  activityLevel: ActivityLevel;
  submittedAt: Date | string | null;
}): number {
  const base = PRIORITY_LEVELS[req.activityLevel] ?? 1;
  if (!req.submittedAt) return base;
  const submitted = new Date(req.submittedAt);
  const waitHours = diffHours(new Date(), submitted);
  return base + AGING_RATE * waitHours;
}

export function resolveConflict<T extends { activityLevel: ActivityLevel; submittedAt: Date | string | null }>(
  a: T,
  b: T
): T {
  const sa = calculatePriorityScore(a);
  const sb = calculatePriorityScore(b);
  if (sa > sb) return a;
  if (sb > sa) return b;
  const ta = a.submittedAt ? new Date(a.submittedAt).getTime() : Infinity;
  const tb = b.submittedAt ? new Date(b.submittedAt).getTime() : Infinity;
  return ta <= tb ? a : b;
}

export const PRIORITY_ORDER_SQL = `
  (CASE fr.activityLevel
    WHEN 'AKADEMIK' THEN 3
    WHEN 'INSTITUSIONAL' THEN 2
    ELSE 1
  END + ${AGING_RATE} * TIMESTAMPDIFF(HOUR, fr.submittedAt, NOW())) DESC,
  fr.submittedAt ASC
`;

/** Urutan tabel daftar pengajuan: yang baru masuk tampil paling atas. */
export const REQUEST_LIST_ORDER_SQL = 'COALESCE(fr.submittedAt, fr.createdAt) DESC, fr.id DESC';
