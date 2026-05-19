-- Migration 005: G3 (activity scope on facility requests)
-- Drives WR3 vs WD3 routing based on activity scope (UNIVERSITAS / FAKULTAS).

ALTER TABLE facility_requests
  ADD COLUMN activityScope ENUM('UNIVERSITAS','FAKULTAS') NOT NULL DEFAULT 'UNIVERSITAS' AFTER description,
  ADD INDEX idx_fr_scope (activityScope);
