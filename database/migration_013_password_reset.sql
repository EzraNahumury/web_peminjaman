-- Migration 013: kolom token reset password (fitur lupa password)
ALTER TABLE users
  ADD COLUMN resetTokenHash VARCHAR(64) NULL,
  ADD COLUMN resetTokenExpiry DATETIME NULL;
