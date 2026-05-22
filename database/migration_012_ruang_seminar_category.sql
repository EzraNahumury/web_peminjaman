-- Migration 012: Ruang Harun & Ruang Rudi Budiman → Ruang Seminar

UPDATE facilities
SET category = 'Ruang Seminar'
WHERE name IN ('Ruang Harun', 'Ruang Rudi Budiman');
