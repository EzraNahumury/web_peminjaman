-- Migration: add managingUnit to facilities (for existing databases)
-- Run once via phpMyAdmin SQL tab on campus_facility_booking database.

ALTER TABLE facilities
  ADD COLUMN managingUnit ENUM('BIRO_I','BIRO_IV','PPLK','KRT','LPAIP') NOT NULL DEFAULT 'BIRO_I' AFTER category,
  ADD INDEX idx_fac_unit (managingUnit);
