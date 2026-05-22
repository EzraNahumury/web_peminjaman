-- Migration script: Apply this to an EXISTING database that was created from the old schema.
-- Run this ONLY if your database is missing the new columns/enum values.
-- It is safe to run multiple times (uses IF NOT EXISTS / IGNORE patterns).

-- =====================================================
-- 1. Add missing columns to `users` table
-- =====================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS bureauScope ENUM('BIRO_I','BIRO_IV','PPLK','KRT','LPAIP') NULL AFTER userScope;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS signatureUrl VARCHAR(255) NULL AFTER organizationLogoUrl;

-- =====================================================
-- 2. Add missing columns to `facility_requests` table
-- =====================================================
ALTER TABLE facility_requests
  ADD COLUMN IF NOT EXISTS activityLevel ENUM('AKADEMIK','INSTITUSIONAL','KEMAHASISWAAN') NOT NULL DEFAULT 'KEMAHASISWAAN' AFTER activityScope;

ALTER TABLE facility_requests
  ADD COLUMN IF NOT EXISTS proposedFacilityId INT NULL AFTER notes;

ALTER TABLE facility_requests
  ADD COLUMN IF NOT EXISTS proposedStartDateTime DATETIME NULL AFTER proposedFacilityId;

ALTER TABLE facility_requests
  ADD COLUMN IF NOT EXISTS proposedEndDateTime DATETIME NULL AFTER proposedStartDateTime;

ALTER TABLE facility_requests
  ADD COLUMN IF NOT EXISTS overrideReason TEXT NULL AFTER proposedEndDateTime;

-- Add foreign key for proposedFacilityId (ignore if already exists)
-- Note: You may need to adjust this if the constraint name conflicts
ALTER TABLE facility_requests
  ADD CONSTRAINT fk_fr_proposed_facility
  FOREIGN KEY (proposedFacilityId) REFERENCES facilities(id) ON DELETE SET NULL;

-- =====================================================
-- 3. Update ENUM for facility_requests.status
--    Add 'OVERRIDE_OFFERED' to the status enum
-- =====================================================
ALTER TABLE facility_requests
  MODIFY COLUMN status ENUM('DRAFT','SUBMITTED','WAITING_BIRO_III','REJECTED_BY_BIRO_III','WAITING_WR3_WD3','REJECTED_BY_WR3_WD3','WAITING_ADMIN_UNIT','REVISION_REQUESTED','ON_HOLD','OVERRIDE_OFFERED','APPROVED','REJECTED','CANCELLED') NOT NULL;

-- =====================================================
-- 4. Update ENUM for approval_logs.action
--    Add 'ADMIN_OVERRIDE', 'ACCEPT_OVERRIDE', 'REJECT_OVERRIDE'
-- =====================================================
ALTER TABLE approval_logs
  MODIFY COLUMN action ENUM('REGISTER','LOGIN','SUBMIT','APPROVE_BIRO_III','REJECT_BIRO_III','APPROVE_WR3_WD3','REJECT_WR3_WD3','APPROVE_ADMIN','REJECT_ADMIN','REQUEST_REVISION','RESUBMIT_REVISION','OFFER_ALTERNATIVE','HOLD','RESUME','ADMIN_OVERRIDE','ACCEPT_OVERRIDE','REJECT_OVERRIDE','CANCEL') NOT NULL;

-- =====================================================
-- Done! Verify with:
--   DESCRIBE users;
--   DESCRIBE facility_requests;
--   DESCRIBE approval_logs;
-- =====================================================
