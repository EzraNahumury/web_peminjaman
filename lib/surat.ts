import type { ActivityScope, ManagingUnit, Role } from '@/types';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

export function generateSuratNumber(requestId: number, createdAt: Date | string): string {
  const d = new Date(createdAt);
  const num = String(requestId).padStart(3, '0');
  const month = ROMAN[d.getMonth()];
  const year = d.getFullYear();
  return `${num}/SPP/UKDW/${month}/${year}`;
}

export function fmtSuratDateRange(start: Date | string, end: Date | string): string {
  const s = new Date(start);
  const e = new Date(end);
  const sameDay =
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth() &&
    s.getDate() === e.getDate();
  const dateOpts: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
  if (sameDay) {
    return `${s.toLocaleDateString('id-ID', dateOpts)}, ${s.toLocaleTimeString('id-ID', timeOpts)} – ${e.toLocaleTimeString('id-ID', timeOpts)} WIB`;
  }
  return `${s.toLocaleDateString('id-ID', dateOpts)} ${s.toLocaleTimeString('id-ID', timeOpts)} s.d. ${e.toLocaleDateString('id-ID', dateOpts)} ${e.toLocaleTimeString('id-ID', timeOpts)} WIB`;
}

export function fmtSuratLongDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function normalizeRequestStatus(status: unknown): string {
  return String(status ?? '').trim();
}

/** Path surat digital yang divalidasi WR3/WD3 (disimpan di signedLetterUrl). */
export function validatedSuratPath(requestId: number): string {
  return `/surat/${requestId}`;
}

export function isSystemValidatedSurat(url: string | null | undefined): boolean {
  return !!url && /^\/surat\/\d+$/.test(url.trim());
}

function normalizeAssetHref(href: string): string {
  const t = href.trim();
  if (t.startsWith('http://') || t.startsWith('https://') || t.startsWith('/')) return t;
  return `/${t}`;
}

/** Tautan surat untuk ditinjau (digital atau upload scan). */
export function resolveSuratHref(
  requestId: number,
  signedLetterUrl: string | null | undefined,
  status: unknown
): string | null {
  const s = normalizeRequestStatus(status);
  if (!s || s === 'DRAFT' || s === 'CANCELLED') return null;
  if (signedLetterUrl?.trim() && !isSystemValidatedSurat(signedLetterUrl)) {
    return normalizeAssetHref(signedLetterUrl);
  }
  return validatedSuratPath(requestId);
}

/** @deprecated Gunakan resolveSuratHref */
export function resolveValidatedSuratHref(
  requestId: number,
  signedLetterUrl: string | null | undefined,
  opts?: { status?: string }
): string | null {
  return resolveSuratHref(requestId, signedLetterUrl, opts?.status);
}

export type SuratRequest = {
  id: number;
  userId: number;
  status: unknown;
  activityScope: unknown;
  managingUnit?: ManagingUnit | string | null;
};

export type SuratViewer = {
  id: number;
  role: Role | string;
  userScope?: ActivityScope | string | null;
  bureauScope?: ManagingUnit | string | null;
};

export function canViewSuratPage(viewer: SuratViewer, req: SuratRequest): boolean {
  const s = normalizeRequestStatus(req.status);
  if (!s || s === 'DRAFT' || s === 'CANCELLED') return false;

  const scope = (viewer.userScope ?? 'UNIVERSITAS') as ActivityScope;
  const reqScope = String(req.activityScope ?? 'UNIVERSITAS').trim() as ActivityScope;

  switch (viewer.role) {
    case 'PENGURUS':
      return req.userId === viewer.id && ['WAITING_ADMIN_UNIT', 'APPROVED'].includes(s);
    case 'BIRO_III':
      return true;
    case 'WR3_WD3':
      return reqScope === scope;
    case 'ADMIN_UNIT': {
      const bureau = viewer.bureauScope as ManagingUnit | null | undefined;
      if (bureau && req.managingUnit && req.managingUnit !== bureau) return false;
      return true;
    }
    case 'SUPER_ADMIN':
      return true;
    default:
      return false;
  }
}

export function suratBackHref(role: string, requestId: number): string {
  switch (role) {
    case 'ADMIN_UNIT':
      return `/dashboard/admin-unit/requests/${requestId}`;
    case 'WR3_WD3':
      return `/dashboard/wr3-wd3/requests/${requestId}`;
    case 'BIRO_III':
      return `/dashboard/biro-iii/requests/${requestId}`;
    default:
      return `/dashboard/pengurus/requests/${requestId}`;
  }
}
