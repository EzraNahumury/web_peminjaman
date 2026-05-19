-- Migration 004: G1 (account activation) + G3 (validator scope)
-- - users.isActive : pengurus baru default FALSE, perlu aktivasi SuperAdmin
-- - users.userScope: untuk WR3_WD3 split UNIVERSITAS (WR3) vs FAKULTAS (WD3)

ALTER TABLE users
  ADD COLUMN isActive BOOLEAN NOT NULL DEFAULT FALSE AFTER role,
  ADD COLUMN userScope ENUM('UNIVERSITAS','FAKULTAS') NULL AFTER isActive,
  ADD INDEX idx_users_active (isActive);

UPDATE users SET isActive = TRUE WHERE role IN ('BIRO_III','WR3_WD3','ADMIN_UNIT','SUPER_ADMIN');
UPDATE users SET userScope = 'UNIVERSITAS' WHERE role = 'WR3_WD3' AND userScope IS NULL;
