export type Role = 'PENGURUS' | 'BIRO_III' | 'WR3_WD3' | 'ADMIN_UNIT' | 'SUPER_ADMIN';

export type ActivityScope = 'UNIVERSITAS' | 'FAKULTAS';

export const ACTIVITY_SCOPE_LABEL: Record<ActivityScope, string> = {
  UNIVERSITAS: 'Tingkat Universitas',
  FAKULTAS: 'Tingkat Fakultas',
};

export type ActivityLevel = 'AKADEMIK' | 'INSTITUSIONAL' | 'KEMAHASISWAAN';

export const ACTIVITY_LEVEL_LABEL: Record<ActivityLevel, string> = {
  AKADEMIK: 'Akademik',
  INSTITUSIONAL: 'Institusional',
  KEMAHASISWAAN: 'Kemahasiswaan',
};

export const ACTIVITY_LEVEL_DESC: Record<ActivityLevel, string> = {
  AKADEMIK: 'Kuliah, ujian, P3DM, kegiatan resmi akademik.',
  INSTITUSIONAL: 'Kegiatan resmi institusi kampus.',
  KEMAHASISWAAN: 'Kegiatan organisasi/lembaga kemahasiswaan.',
};

export type RequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'WAITING_BIRO_III'
  | 'REJECTED_BY_BIRO_III'
  | 'WAITING_WR3_WD3'
  | 'REJECTED_BY_WR3_WD3'
  | 'WAITING_ADMIN_UNIT'
  | 'REVISION_REQUESTED'
  | 'ON_HOLD'
  | 'OVERRIDE_OFFERED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type LogAction =
  | 'REGISTER'
  | 'LOGIN'
  | 'SUBMIT'
  | 'APPROVE_BIRO_III'
  | 'REJECT_BIRO_III'
  | 'APPROVE_WR3_WD3'
  | 'REJECT_WR3_WD3'
  | 'APPROVE_ADMIN'
  | 'REJECT_ADMIN'
  | 'REQUEST_REVISION'
  | 'RESUBMIT_REVISION'
  | 'OFFER_ALTERNATIVE'
  | 'HOLD'
  | 'RESUME'
  | 'ADMIN_OVERRIDE'
  | 'ACCEPT_OVERRIDE'
  | 'REJECT_OVERRIDE'
  | 'CANCEL';

export const BLOCKING_STATUSES: RequestStatus[] = [
  'APPROVED',
  'SUBMITTED',
  'WAITING_BIRO_III',
  'WAITING_WR3_WD3',
  'WAITING_ADMIN_UNIT',
  'REVISION_REQUESTED',
  'ON_HOLD',
];

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean | number;
  userScope: ActivityScope | null;
  bureauScope: ManagingUnit | null;
  organizationName: string | null;
  phone: string | null;
  identityNumber: string | null;
  organizationLogoUrl: string | null;
  signatureUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ManagingUnit = 'BIRO_I' | 'BIRO_IV' | 'PPLK' | 'KRT' | 'LPAIP';

export const MANAGING_UNIT_LABEL: Record<ManagingUnit, string> = {
  BIRO_I: 'Biro I',
  BIRO_IV: 'Biro IV',
  PPLK: 'PPLK',
  KRT: 'KRT / Kerumahtanggaan',
  LPAIP: 'LPAIP',
};

export const MANAGING_UNIT_DESC: Record<ManagingUnit, string> = {
  BIRO_I: 'Ruang Pembelajaran',
  BIRO_IV: 'Ruangan & Peralatan Pendukung',
  PPLK: 'Peralatan Pembelajaran & Lab',
  KRT: 'Ruangan, Kendaraan & Perlengkapan Acara',
  LPAIP: 'Dokumentasi & Multimedia',
};

export const MANAGING_UNIT_HEAD: Record<ManagingUnit, string> = {
  BIRO_I: 'Kepala Biro I — Akademik & Administrasi',
  BIRO_IV: 'Kepala Biro IV — Sarana Prasarana',
  PPLK: 'Kepala Pusat Pengembangan & Layanan Kemahasiswaan (PPLK)',
  KRT: 'Kepala Bagian Kerumahtanggaan (KRT)',
  LPAIP: 'Kepala Lembaga Pengembangan Akademik dan Inovasi Pembelajaran (LPAIP)',
};

export interface Facility {
  id: number;
  name: string;
  category: string;
  managingUnit: ManagingUnit;
  location: string | null;
  capacity: number | null;
  description: string | null;
  isActive: boolean | number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FacilityRequest {
  id: number;
  requestCode: string;
  userId: number;
  facilityId: number;
  activityName: string;
  organizationName: string;
  personInCharge: string;
  identityNumber: string | null;
  email: string;
  phone: string;
  startDateTime: Date;
  endDateTime: Date;
  participantCount: number | null;
  purpose: string;
  description: string;
  activityScope: ActivityScope;
  activityLevel: ActivityLevel;
  additionalNeeds: string | null;
  attachmentUrl: string | null;
  signedLetterUrl: string | null;
  notes: string | null;
  proposedFacilityId: number | null;
  proposedStartDateTime: Date | null;
  proposedEndDateTime: Date | null;
  overrideReason: string | null;
  status: RequestStatus;
  currentStep: string | null;
  submittedAt: Date | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApprovalLog {
  id: number;
  requestId: number;
  actorId: number | null;
  action: LogAction;
  fromStatus: string | null;
  toStatus: string | null;
  note: string | null;
  createdAt: Date;
}

export interface FacilityBlock {
  id: number;
  facilityId: number | null;
  startDateTime: Date;
  endDateTime: Date;
  reason: string;
  createdBy: number | null;
  createdAt: Date;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean | number;
  createdAt: Date;
}

export interface SessionPayload {
  userId: number;
  role: Role;
  email: string;
  name: string;
  isActive: boolean;
  userScope?: ActivityScope | null;
  bureauScope?: ManagingUnit | null;
  expiresAt: number;
  [key: string]: unknown;
}
