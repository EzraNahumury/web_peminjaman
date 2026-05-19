-- Migration 006: priority scheduling (G5) + admin decisions extras (G7)

ALTER TABLE facility_requests
  ADD COLUMN activityLevel ENUM('AKADEMIK','INSTITUSIONAL','KEMAHASISWAAN') NOT NULL DEFAULT 'KEMAHASISWAAN' AFTER activityScope,
  ADD INDEX idx_fr_priority (activityLevel, submittedAt);

ALTER TABLE approval_logs
  MODIFY COLUMN action ENUM(
    'REGISTER','LOGIN','SUBMIT',
    'APPROVE_BIRO_III','REJECT_BIRO_III',
    'APPROVE_WR3_WD3','REJECT_WR3_WD3',
    'APPROVE_ADMIN','REJECT_ADMIN',
    'REQUEST_REVISION','RESUBMIT_REVISION','CANCEL',
    'OFFER_ALTERNATIVE','PENDING'
  ) NOT NULL;
