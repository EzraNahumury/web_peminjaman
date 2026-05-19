-- Migration 009: Admin Unit override for already-APPROVED bookings
-- Use case: emergency higher-priority activity needs same room.

ALTER TABLE facility_requests
  ADD COLUMN proposedFacilityId INT NULL AFTER facilityId,
  ADD COLUMN proposedStartDateTime DATETIME NULL AFTER endDateTime,
  ADD COLUMN proposedEndDateTime DATETIME NULL AFTER proposedStartDateTime,
  ADD COLUMN overrideReason TEXT NULL AFTER notes,
  MODIFY COLUMN status ENUM(
    'DRAFT','SUBMITTED',
    'WAITING_BIRO_III','REJECTED_BY_BIRO_III',
    'WAITING_WR3_WD3','REJECTED_BY_WR3_WD3',
    'WAITING_ADMIN_UNIT','REVISION_REQUESTED','ON_HOLD',
    'OVERRIDE_OFFERED',
    'APPROVED','REJECTED','CANCELLED'
  ) NOT NULL,
  ADD CONSTRAINT fk_fr_proposed_facility FOREIGN KEY (proposedFacilityId) REFERENCES facilities(id) ON DELETE SET NULL;

ALTER TABLE approval_logs
  MODIFY COLUMN action ENUM(
    'REGISTER','LOGIN','SUBMIT',
    'APPROVE_BIRO_III','REJECT_BIRO_III',
    'APPROVE_WR3_WD3','REJECT_WR3_WD3',
    'APPROVE_ADMIN','REJECT_ADMIN',
    'REQUEST_REVISION','RESUBMIT_REVISION',
    'OFFER_ALTERNATIVE','HOLD','RESUME',
    'ADMIN_OVERRIDE','ACCEPT_OVERRIDE','REJECT_OVERRIDE',
    'CANCEL'
  ) NOT NULL;
