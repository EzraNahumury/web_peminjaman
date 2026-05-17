-- Migration: add organizationLogoUrl to users for pengurus org logo upload
ALTER TABLE users
  ADD COLUMN organizationLogoUrl VARCHAR(255) NULL AFTER identityNumber;
