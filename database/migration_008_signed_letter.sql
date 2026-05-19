-- Migration 008: signed letter upload after WR3/WD3 approval
ALTER TABLE facility_requests
  ADD COLUMN signedLetterUrl VARCHAR(255) NULL AFTER attachmentUrl;
