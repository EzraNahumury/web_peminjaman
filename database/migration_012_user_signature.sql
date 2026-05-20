-- Migration 012: per-user signature image
-- Used in generated surat template (Pengurus, Biro III, WR3/WD3, Admin Unit).

ALTER TABLE users
  ADD COLUMN signatureUrl VARCHAR(255) NULL AFTER organizationLogoUrl;
