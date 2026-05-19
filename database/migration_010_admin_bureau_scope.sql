-- Migration 010: per-bureau Admin Unit accounts
-- Each ADMIN_UNIT user owns one of 5 bureaus.

ALTER TABLE users
  ADD COLUMN bureauScope ENUM('BIRO_I','BIRO_IV','PPLK','KRT','LPAIP') NULL AFTER userScope,
  ADD INDEX idx_users_bureau (bureauScope);
