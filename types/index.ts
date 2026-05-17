export type Role = 'PENGURUS' | 'BIRO_III' | 'WR3_WD3' | 'ADMIN_UNIT' | 'SUPER_ADMIN';

export type RequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'WAITING_BIRO_III'
  | 'REJECTED_BY_BIRO_III'
  | 'WAITING_WR3_WD3'
  | 'REJECTED_BY_WR3_WD3'
  | 'WAITING_ADMIN_UNIT'
  | 'REVISION_REQUESTED'
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
  | 'CANCEL';

export const BLOCKING_STATUSES: RequestStatus[] = [
  'APPROVED',
  'WAITING_BIRO_III',
  'WAITING_WR3_WD3',
  'WAITING_ADMIN_UNIT',
];

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  organizationName: string | null;
  phone: string | null;
  identityNumber: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Facility {
  id: number;
  name: string;
  category: string;
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
  additionalNeeds: string | null;
  attachmentUrl: string | null;
  notes: string | null;
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
  expiresAt: number;
  [key: string]: unknown;
}
