-- Migration 011: replace Biro I facilities with full per-room list.
-- WARNING: destructive — drops all existing Biro I facilities including
-- their bookings/requests/blocks. Run only when current Biro I data
-- is seed/test data that you do not need to keep.

START TRANSACTION;

-- Resolve target facility ids once
SET @biroIds = (
  SELECT GROUP_CONCAT(id) FROM facilities WHERE managingUnit = 'BIRO_I'
);

-- Drop dependent rows first (FKs without ON DELETE CASCADE on facilities)
-- Capture target request ids into a temp table to avoid mutating-source issues
CREATE TEMPORARY TABLE _biroI_requests AS
  SELECT fr.id AS id
  FROM facility_requests fr
  JOIN facilities f ON f.id = fr.facilityId
  WHERE f.managingUnit = 'BIRO_I';

DELETE FROM facility_bookings
  WHERE requestId IN (SELECT id FROM _biroI_requests)
     OR facilityId IN (SELECT id FROM facilities WHERE managingUnit = 'BIRO_I');

DELETE FROM approval_logs
  WHERE requestId IN (SELECT id FROM _biroI_requests);

DELETE FROM facility_requests
  WHERE id IN (SELECT id FROM _biroI_requests);

DROP TEMPORARY TABLE _biroI_requests;

-- facility_blocks has ON DELETE CASCADE — handled automatically
DELETE FROM facilities WHERE managingUnit = 'BIRO_I';

-- Insert canonical Biro I rooms
INSERT INTO facilities (name, category, managingUnit, location, capacity, description) VALUES
  ('Ruang B.3.1','Ruang Kelas','BIRO_I','Gedung B Lt.3',40,'Ruang Kelas Biasa'),
  ('Ruang B.3.2','Ruang Kelas','BIRO_I','Gedung B Lt.3',40,'Ruang Kelas Biasa'),
  ('Ruang B.3.3','Ruang Kelas','BIRO_I','Gedung B Lt.3',40,'Ruang Kelas Biasa'),
  ('Ruang B.3.4','Ruang Kelas','BIRO_I','Gedung B Lt.3',40,'Ruang Kelas Biasa'),
  ('Ruang C.3.7','Ruang Kelas','BIRO_I','Gedung C Lt.3',40,'Ruang Kelas Biasa'),
  ('Ruang C.3.8','Ruang Kelas','BIRO_I','Gedung C Lt.3',40,'Ruang Kelas Biasa'),
  ('Ruang C.3.9','Ruang Kelas','BIRO_I','Gedung C Lt.3',40,'Ruang Kelas Biasa'),
  ('Ruang D.1.1','Ruang Hybrid','BIRO_I','Gedung D Lt.1',40,'Hybrid'),
  ('Ruang D.1.2','Ruang Tutorial','BIRO_I','Gedung D Lt.1',25,'Ruang Tutorial'),
  ('Ruang D.1.3','Ruang Tutorial','BIRO_I','Gedung D Lt.1',25,'Ruang Tutorial'),
  ('Ruang D.2.1','Ruang Kelas','BIRO_I','Gedung D Lt.2',40,'Ruang Kelas Biasa'),
  ('Ruang D.2.2','Ruang Kelas','BIRO_I','Gedung D Lt.2',40,'Ruang Kelas Biasa'),
  ('Ruang D.2.3','Ruang Kelas','BIRO_I','Gedung D Lt.2',40,'Ruang Kelas Biasa'),
  ('Ruang D.2.4','Ruang Kelas','BIRO_I','Gedung D Lt.2',40,'Ruang Kelas Biasa'),
  ('Ruang D.2.5','Ruang Kelas','BIRO_I','Gedung D Lt.2',40,'Ruang Kelas Biasa'),
  ('Ruang D.3.1','Ruang Kelas','BIRO_I','Gedung D Lt.3',40,'Ruang Kelas Biasa'),
  ('Ruang D.3.2','Ruang Kelas','BIRO_I','Gedung D Lt.3',40,'Ruang Kelas Biasa'),
  ('Ruang D.3.4','Ruang Kelas','BIRO_I','Gedung D Lt.3',40,'Ruang Kelas Biasa'),
  ('Ruang D.3.5','Ruang Kelas','BIRO_I','Gedung D Lt.3',40,'Ruang Kelas Biasa'),
  ('Ruang E.1.2','Ruang Kelas','BIRO_I','Gedung E Lt.1',40,'Ruang Kelas Biasa'),
  ('Ruang E.2.1','Ruang Kelas','BIRO_I','Gedung E Lt.2',40,'Ruang Kelas Biasa'),
  ('Ruang E.2.2','Ruang Kelas','BIRO_I','Gedung E Lt.2',40,'Ruang Kelas Biasa'),
  ('Ruang E.2.3','Ruang Kelas','BIRO_I','Gedung E Lt.2',40,'Ruang Kelas Biasa'),
  ('Ruang E.2.4','Ruang Kelas','BIRO_I','Gedung E Lt.2',40,'Ruang Kelas Biasa'),
  ('Ruang E.2.5','Ruang Kelas','BIRO_I','Gedung E Lt.2',40,'Ruang Kelas Biasa'),
  ('Ruang E.3.1','Ruang Kelas','BIRO_I','Gedung E Lt.3',40,'Ruang Kelas Biasa'),
  ('Ruang E.3.2','Ruang Kelas','BIRO_I','Gedung E Lt.3',40,'Ruang Kelas Biasa'),
  ('Ruang E.3.3','Ruang Kelas','BIRO_I','Gedung E Lt.3',40,'Ruang Kelas Biasa'),
  ('Ruang E.3.4','Ruang Kelas','BIRO_I','Gedung E Lt.3',40,'Ruang Kelas Biasa'),
  ('Ruang E.3.5','Ruang Kelas','BIRO_I','Gedung E Lt.3',40,'Ruang Kelas Biasa'),
  ('Ruang E.3.6','Ruang Kelas','BIRO_I','Gedung E Lt.3',40,'Ruang Kelas Biasa'),
  ('Ruang G.3.4','Ruang Kelas','BIRO_I','Gedung G Lt.3',40,'Ruang Kelas Biasa'),
  ('Ruang H.2.1','Ruang Kelas','BIRO_I','Gedung H Lt.2',40,'Ruang Kelas Biasa'),
  ('Ruang H.2.2','Ruang Kelas','BIRO_I','Gedung H Lt.2',40,'Ruang Kelas Biasa'),
  ('Ruang H.2.3','Ruang Kelas','BIRO_I','Gedung H Lt.2',40,'Ruang Kelas Biasa'),
  ('Ruang H.2.4','Ruang Kelas','BIRO_I','Gedung H Lt.2',40,'Ruang Kelas Biasa'),
  ('Ruang H.2.5','Ruang Kelas','BIRO_I','Gedung H Lt.2',40,'Ruang Kelas Biasa');

COMMIT;
