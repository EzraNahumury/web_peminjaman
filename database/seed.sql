-- Seed data (run after schema.sql)
-- NOTE: prefer running `npm run db:seed` which hashes passwords with bcrypt.
-- This SQL file uses a pre-generated bcrypt hash for "password123".
-- bcrypt hash for "password123" (cost 10):
--   $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

USE campus_facility_booking;

INSERT INTO facilities (name, category, location, capacity, description) VALUES
 ('Aula Kampus','Aula','Gedung Utama Lt.1',300,'Aula utama untuk acara besar'),
 ('Ruang Seminar','Ruangan','Gedung A Lt.2',100,'Ruang seminar dengan AC dan proyektor'),
 ('Laboratorium Komputer','Laboratorium','Gedung B Lt.3',40,'Lab dengan 40 PC'),
 ('Lapangan','Outdoor','Area Belakang Kampus',500,'Lapangan terbuka untuk kegiatan outdoor'),
 ('Ruang Rapat','Ruangan','Gedung Rektorat Lt.2',30,'Ruang rapat eksekutif'),
 ('Auditorium','Aula','Gedung Utama Lt.3',500,'Auditorium besar berkapasitas 500');

INSERT INTO users (name, email, password, role, organizationName, phone, identityNumber) VALUES
 ('Pengurus Demo','pengurus@kampus.test','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','PENGURUS','BEM Universitas','081234567890','2021001'),
 ('Biro III Demo','biro3@kampus.test','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','BIRO_III',NULL,'081234567891',NULL),
 ('WR3 Demo','wr3@kampus.test','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','WR3_WD3',NULL,'081234567892',NULL),
 ('Admin Unit Demo','adminunit@kampus.test','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','ADMIN_UNIT',NULL,'081234567893',NULL),
 ('Super Admin','superadmin@kampus.test','$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy','SUPER_ADMIN',NULL,'081234567894',NULL);
