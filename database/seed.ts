import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

type FacilityRow = [
  name: string,
  category: string,
  managingUnit: 'BIRO_I' | 'BIRO_IV' | 'PPLK' | 'KRT' | 'LPAIP',
  location: string | null,
  capacity: number | null,
  description: string | null
];

const FACILITIES: FacilityRow[] = [
  // BIRO I — Ruang Pembelajaran (per ruangan)
  // Gedung B
  ['Ruang B.3.1', 'Ruang Kelas', 'BIRO_I', 'Gedung B Lt.3', 40, 'Ruang Kelas Biasa'],
  ['Ruang B.3.2', 'Ruang Kelas', 'BIRO_I', 'Gedung B Lt.3', 40, 'Ruang Kelas Biasa'],
  ['Ruang B.3.3', 'Ruang Kelas', 'BIRO_I', 'Gedung B Lt.3', 40, 'Ruang Kelas Biasa'],
  ['Ruang B.3.4', 'Ruang Kelas', 'BIRO_I', 'Gedung B Lt.3', 40, 'Ruang Kelas Biasa'],
  // Gedung C
  ['Ruang C.3.7', 'Ruang Kelas', 'BIRO_I', 'Gedung C Lt.3', 40, 'Ruang Kelas Biasa'],
  ['Ruang C.3.8', 'Ruang Kelas', 'BIRO_I', 'Gedung C Lt.3', 40, 'Ruang Kelas Biasa'],
  ['Ruang C.3.9', 'Ruang Kelas', 'BIRO_I', 'Gedung C Lt.3', 40, 'Ruang Kelas Biasa'],
  // Gedung D
  ['Ruang D.1.1', 'Ruang Hybrid', 'BIRO_I', 'Gedung D Lt.1', 40, 'Hybrid'],
  ['Ruang D.1.2', 'Ruang Tutorial', 'BIRO_I', 'Gedung D Lt.1', 25, 'Ruang Tutorial'],
  ['Ruang D.1.3', 'Ruang Tutorial', 'BIRO_I', 'Gedung D Lt.1', 25, 'Ruang Tutorial'],
  ['Ruang D.2.1', 'Ruang Kelas', 'BIRO_I', 'Gedung D Lt.2', 40, 'Ruang Kelas Biasa'],
  ['Ruang D.2.2', 'Ruang Kelas', 'BIRO_I', 'Gedung D Lt.2', 40, 'Ruang Kelas Biasa'],
  ['Ruang D.2.3', 'Ruang Kelas', 'BIRO_I', 'Gedung D Lt.2', 40, 'Ruang Kelas Biasa'],
  ['Ruang D.2.4', 'Ruang Kelas', 'BIRO_I', 'Gedung D Lt.2', 40, 'Ruang Kelas Biasa'],
  ['Ruang D.2.5', 'Ruang Kelas', 'BIRO_I', 'Gedung D Lt.2', 40, 'Ruang Kelas Biasa'],
  ['Ruang D.3.1', 'Ruang Kelas', 'BIRO_I', 'Gedung D Lt.3', 40, 'Ruang Kelas Biasa'],
  ['Ruang D.3.2', 'Ruang Kelas', 'BIRO_I', 'Gedung D Lt.3', 40, 'Ruang Kelas Biasa'],
  ['Ruang D.3.4', 'Ruang Kelas', 'BIRO_I', 'Gedung D Lt.3', 40, 'Ruang Kelas Biasa'],
  ['Ruang D.3.5', 'Ruang Kelas', 'BIRO_I', 'Gedung D Lt.3', 40, 'Ruang Kelas Biasa'],
  // Gedung E
  ['Ruang E.1.2', 'Ruang Kelas', 'BIRO_I', 'Gedung E Lt.1', 40, 'Ruang Kelas Biasa'],
  ['Ruang E.2.1', 'Ruang Kelas', 'BIRO_I', 'Gedung E Lt.2', 40, 'Ruang Kelas Biasa'],
  ['Ruang E.2.2', 'Ruang Kelas', 'BIRO_I', 'Gedung E Lt.2', 40, 'Ruang Kelas Biasa'],
  ['Ruang E.2.3', 'Ruang Kelas', 'BIRO_I', 'Gedung E Lt.2', 40, 'Ruang Kelas Biasa'],
  ['Ruang E.2.4', 'Ruang Kelas', 'BIRO_I', 'Gedung E Lt.2', 40, 'Ruang Kelas Biasa'],
  ['Ruang E.2.5', 'Ruang Kelas', 'BIRO_I', 'Gedung E Lt.2', 40, 'Ruang Kelas Biasa'],
  ['Ruang E.3.1', 'Ruang Kelas', 'BIRO_I', 'Gedung E Lt.3', 40, 'Ruang Kelas Biasa'],
  ['Ruang E.3.2', 'Ruang Kelas', 'BIRO_I', 'Gedung E Lt.3', 40, 'Ruang Kelas Biasa'],
  ['Ruang E.3.3', 'Ruang Kelas', 'BIRO_I', 'Gedung E Lt.3', 40, 'Ruang Kelas Biasa'],
  ['Ruang E.3.4', 'Ruang Kelas', 'BIRO_I', 'Gedung E Lt.3', 40, 'Ruang Kelas Biasa'],
  ['Ruang E.3.5', 'Ruang Kelas', 'BIRO_I', 'Gedung E Lt.3', 40, 'Ruang Kelas Biasa'],
  ['Ruang E.3.6', 'Ruang Kelas', 'BIRO_I', 'Gedung E Lt.3', 40, 'Ruang Kelas Biasa'],
  // Gedung G
  ['Ruang G.3.4', 'Ruang Kelas', 'BIRO_I', 'Gedung G Lt.3', 40, 'Ruang Kelas Biasa'],
  // Gedung H
  ['Ruang H.2.1', 'Ruang Kelas', 'BIRO_I', 'Gedung H Lt.2', 40, 'Ruang Kelas Biasa'],
  ['Ruang H.2.2', 'Ruang Kelas', 'BIRO_I', 'Gedung H Lt.2', 40, 'Ruang Kelas Biasa'],
  ['Ruang H.2.3', 'Ruang Kelas', 'BIRO_I', 'Gedung H Lt.2', 40, 'Ruang Kelas Biasa'],
  ['Ruang H.2.4', 'Ruang Kelas', 'BIRO_I', 'Gedung H Lt.2', 40, 'Ruang Kelas Biasa'],
  ['Ruang H.2.5', 'Ruang Kelas', 'BIRO_I', 'Gedung H Lt.2', 40, 'Ruang Kelas Biasa'],

  // BIRO IV — Ruangan & Peralatan Pendukung
  ['Ruang H.1.1', 'Ruangan', 'BIRO_IV', 'Gedung H Lt.1', 60, 'Ruang serbaguna'],
  ['Studio Podcast', 'Studio', 'BIRO_IV', 'Gedung Biro IV', 6, 'Fasilitas podcast lengkap untuk produksi audio'],
  ['Kamera Foto', 'Peralatan', 'BIRO_IV', 'Inventaris Biro IV', null, 'Kamera DSLR untuk dokumentasi acara'],
  ['Kamera Streaming', 'Peralatan', 'BIRO_IV', 'Inventaris Biro IV', null, 'Kamera streaming untuk siaran live'],
  ['Perlengkapan Mikrofon (Biro IV)', 'Peralatan', 'BIRO_IV', 'Inventaris Biro IV', null, 'Set mikrofon untuk kegiatan dokumentasi'],
  ['Flash Memory', 'Peralatan', 'BIRO_IV', 'Inventaris Biro IV', null, 'Media penyimpanan untuk transfer data acara'],

  // PPLK — Peralatan Pembelajaran/Teknis
  ['Proyektor', 'Peralatan', 'PPLK', 'Inventaris PPLK', null, 'Proyektor untuk presentasi dan kegiatan'],
  ['Laptop (Peminjaman Khusus)', 'Peralatan', 'PPLK', 'Inventaris PPLK', null, 'Laptop dengan syarat peminjaman khusus'],
  ['Kabel HDMI', 'Peralatan', 'PPLK', 'Inventaris PPLK', null, 'Kabel HDMI untuk koneksi proyektor/display'],
  ['Speaker Aktif', 'Peralatan', 'PPLK', 'Inventaris PPLK', null, 'Speaker aktif portabel'],
  ['Soundcard', 'Peralatan', 'PPLK', 'Inventaris PPLK', null, 'Soundcard untuk produksi audio'],
  ['Mikrofon (PPLK)', 'Peralatan', 'PPLK', 'Inventaris PPLK', null, 'Mikrofon untuk kegiatan unit/lintas unit'],
  ['Laboratorium Komputer Lantai 2', 'Laboratorium', 'PPLK', 'Gedung Lab Lt.2', 40, 'Lab komputer utama'],
  ['Lab Komputer A', 'Laboratorium', 'PPLK', 'Gedung Lab', 30, 'Lab komputer A'],
  ['Lab Komputer B', 'Laboratorium', 'PPLK', 'Gedung Lab', 30, 'Lab komputer B'],
  ['Lab Komputer C', 'Laboratorium', 'PPLK', 'Gedung Lab', 30, 'Lab komputer C'],
  ['Lab Komputer D', 'Laboratorium', 'PPLK', 'Gedung Lab', 30, 'Lab komputer D'],
  ['Lab Komputer E', 'Laboratorium', 'PPLK', 'Gedung Lab', 30, 'Lab komputer E'],
  ['Lab Komputer F', 'Laboratorium', 'PPLK', 'Gedung Lab', 30, 'Lab komputer F'],
  ['Lab Komputer G', 'Laboratorium', 'PPLK', 'Gedung Lab', 30, 'Lab komputer G'],
  ['Lab Komputer H', 'Laboratorium', 'PPLK', 'Gedung Lab', 30, 'Lab komputer H'],
  ['Lab Komputer I', 'Laboratorium', 'PPLK', 'Gedung Lab', 30, 'Lab komputer I'],

  // KRT — Kerumahtanggaan
  ['Auditorium Koinonia', 'Auditorium', 'KRT', 'Gedung Koinonia', 500, 'Auditorium utama kampus'],
  ['Ruang Rudi Budiman', 'Ruangan', 'KRT', 'Gedung Utama', 80, 'Ruangan serbaguna Rudi Budiman'],
  ['Ruang Harun', 'Ruangan', 'KRT', 'Gedung Utama', 80, 'Ruangan serbaguna Harun'],
  ['Kendaraan', 'Kendaraan', 'KRT', 'Pool Kendaraan KRT', null, 'Kendaraan operasional kampus'],
  ['Sound System', 'Peralatan', 'KRT', 'Inventaris KRT', null, 'Sound system untuk acara besar'],
  ['Layar Viewer Proyektor', 'Peralatan', 'KRT', 'Inventaris KRT', null, 'Layar untuk proyektor'],

  // LPAIP — Dokumentasi & Multimedia
  ['Kamera (LPAIP)', 'Peralatan', 'LPAIP', 'Inventaris LPAIP', null, 'Kamera dokumentasi multimedia'],
  ['Stabilizer Kamera', 'Peralatan', 'LPAIP', 'Inventaris LPAIP', null, 'Gimbal/stabilizer untuk video shooting'],
  ['Tripod', 'Peralatan', 'LPAIP', 'Inventaris LPAIP', null, 'Tripod kamera untuk shooting stabil'],
  ['Saramonic', 'Peralatan', 'LPAIP', 'Inventaris LPAIP', null, 'Mikrofon Saramonic untuk recording audio'],
];

type OrgRow = {
  org: string;
  scope: 'UNIVERSITAS' | 'FAKULTAS';
  pic: string;
  email: string;
  nim: string;
  phone: string;
};

// Real-ish LK/OK UKDW (BEM, HMPS, UKM)
const ORGS: OrgRow[] = [
  // UKM tingkat Universitas
  { org: 'BEMU UKDW', scope: 'UNIVERSITAS', pic: 'Damar Wicaksono', email: 'damar.wicaksono@students.ukdw.ac.id', nim: '72220001', phone: '081234560001' },
  { org: 'UKM Paduan Suara Mahasiswa', scope: 'UNIVERSITAS', pic: 'Naomi Hartanto', email: 'naomi.hartanto@students.ukdw.ac.id', nim: '72220012', phone: '081234560002' },
  { org: 'UKM Persekutuan Mahasiswa Kristen', scope: 'UNIVERSITAS', pic: 'Yohanes Saputra', email: 'yohanes.saputra@students.ukdw.ac.id', nim: '72220020', phone: '081234560003' },
  { org: 'UKM Mapasadha (Pecinta Alam)', scope: 'UNIVERSITAS', pic: 'Bagas Pratama', email: 'bagas.pratama@students.ukdw.ac.id', nim: '72220033', phone: '081234560004' },
  { org: 'UKM Fotografi Lensa', scope: 'UNIVERSITAS', pic: 'Cindy Wijaya', email: 'cindy.wijaya@students.ukdw.ac.id', nim: '72220045', phone: '081234560005' },
  { org: 'UKM KSR PMI Unit UKDW', scope: 'UNIVERSITAS', pic: 'Adrian Tanu', email: 'adrian.tanu@students.ukdw.ac.id', nim: '72220051', phone: '081234560006' },
  // BEM Fakultas
  { org: 'BEM Fakultas Teknologi Informasi', scope: 'FAKULTAS', pic: 'Stevanus Karunia', email: 'stevanus.karunia@students.ukdw.ac.id', nim: '71210011', phone: '081234560011' },
  { org: 'BEM Fakultas Bisnis', scope: 'FAKULTAS', pic: 'Maria Kristanti', email: 'maria.kristanti@students.ukdw.ac.id', nim: '11210021', phone: '081234560012' },
  { org: 'BEM Fakultas Bioteknologi', scope: 'FAKULTAS', pic: 'Daniel Susanto', email: 'daniel.susanto@students.ukdw.ac.id', nim: '31210031', phone: '081234560013' },
  { org: 'BEM Fakultas Kedokteran', scope: 'FAKULTAS', pic: 'Vania Halim', email: 'vania.halim@students.ukdw.ac.id', nim: '41210041', phone: '081234560014' },
  // HMPS
  { org: 'HMPS Informatika', scope: 'FAKULTAS', pic: 'Rafael Limanto', email: 'rafael.limanto@students.ukdw.ac.id', nim: '71210101', phone: '081234560101' },
  { org: 'HMPS Sistem Informasi', scope: 'FAKULTAS', pic: 'Inez Hadinata', email: 'inez.hadinata@students.ukdw.ac.id', nim: '72210111', phone: '081234560102' },
  { org: 'HMPS Akuntansi', scope: 'FAKULTAS', pic: 'Kevin Wijaya', email: 'kevin.wijaya@students.ukdw.ac.id', nim: '11210121', phone: '081234560103' },
  { org: 'HMPS Manajemen', scope: 'FAKULTAS', pic: 'Sarah Lim', email: 'sarah.lim@students.ukdw.ac.id', nim: '12210131', phone: '081234560104' },
  { org: 'HMPS Arsitektur', scope: 'FAKULTAS', pic: 'Garry Hutomo', email: 'garry.hutomo@students.ukdw.ac.id', nim: '61210141', phone: '081234560105' },
];

type ActivityTemplate = {
  name: string;
  purpose: string;
  description: string;
  participants: number;
  facilityName: string; // must match a FACILITIES name
  hours: number;
};

// 18 dummy requests — varied facilities, activities, durations
const ACTIVITIES: ActivityTemplate[] = [
  { name: 'Workshop AI & Pendidikan', purpose: 'Seminar / Workshop', description: 'Workshop pengenalan AI untuk pendidikan dengan pembicara dosen FTI dan praktisi industri.', participants: 120, facilityName: 'Auditorium Koinonia', hours: 4 },
  { name: 'Latihan Rutin Paduan Suara', purpose: 'Latihan rutin', description: 'Latihan vokal mingguan persiapan konser semester.', participants: 35, facilityName: 'Ruang H.1.1', hours: 2 },
  { name: 'Rapat Koordinasi Pengurus', purpose: 'Rapat internal', description: 'Rapat program kerja bulanan pengurus harian.', participants: 18, facilityName: 'Ruang D.1.2', hours: 2 },
  { name: 'Persekutuan Doa Mahasiswa', purpose: 'Ibadah / Persekutuan', description: 'Persekutuan doa rutin mingguan untuk seluruh mahasiswa.', participants: 60, facilityName: 'Ruang Rudi Budiman', hours: 2 },
  { name: 'Pelatihan Public Speaking', purpose: 'Pelatihan', description: 'Pelatihan komunikasi publik untuk pengurus organisasi.', participants: 25, facilityName: 'Ruang D.1.3', hours: 3 },
  { name: 'Pemutaran Film Dokumenter', purpose: 'Screening film', description: 'Pemutaran film dokumenter lingkungan dilanjutkan diskusi panel.', participants: 80, facilityName: 'Ruang Harun', hours: 3 },
  { name: 'Open Recruitment Pengurus', purpose: 'Rekrutmen', description: 'Sesi seleksi calon pengurus periode 2026/2027.', participants: 40, facilityName: 'Ruang D.1.1', hours: 4 },
  { name: 'Seminar Nasional Teknologi', purpose: 'Seminar', description: 'Seminar nasional menghadirkan pembicara industri & akademisi.', participants: 200, facilityName: 'Auditorium Koinonia', hours: 5 },
  { name: 'Workshop Fotografi Dasar', purpose: 'Workshop', description: 'Pengenalan dasar komposisi & pengoperasian kamera.', participants: 22, facilityName: 'Ruang D.1.2', hours: 3 },
  { name: 'Recording Podcast Episode 8', purpose: 'Dokumentasi audio', description: 'Recording episode podcast organisasi.', participants: 4, facilityName: 'Studio Podcast', hours: 2 },
  { name: 'Bedah Buku & Diskusi', purpose: 'Diskusi', description: 'Bedah buku karya alumni dengan moderator dosen.', participants: 50, facilityName: 'Ruang Rudi Budiman', hours: 3 },
  { name: 'Pelatihan Programming Web', purpose: 'Pelatihan teknis', description: 'Pelatihan dasar pengembangan web menggunakan framework modern.', participants: 28, facilityName: 'Lab Komputer A', hours: 4 },
  { name: 'Kompetisi Coding Internal', purpose: 'Kompetisi', description: 'Lomba pemrograman antar angkatan dengan hadiah sertifikat.', participants: 30, facilityName: 'Lab Komputer B', hours: 5 },
  { name: 'Sosialisasi Program Kerja', purpose: 'Sosialisasi', description: 'Sosialisasi program kerja kepada anggota baru.', participants: 45, facilityName: 'Ruang H.1.1', hours: 2 },
  { name: 'Pelatihan Kewirausahaan', purpose: 'Pelatihan', description: 'Pelatihan wirausaha bersama pelaku UMKM Yogyakarta.', participants: 35, facilityName: 'Ruang Harun', hours: 4 },
  { name: 'Bazar UKM Tengah Tahun', purpose: 'Bazar', description: 'Bazar produk anggota UKM dan kegiatan amal.', participants: 150, facilityName: 'Auditorium Koinonia', hours: 6 },
  { name: 'Dokumentasi Acara Wisuda Mini', purpose: 'Dokumentasi', description: 'Peliputan video dan foto untuk acara wisuda mini fakultas.', participants: 6, facilityName: 'Kamera (LPAIP)', hours: 5 },
  { name: 'Pelatihan Sound Engineering', purpose: 'Pelatihan teknis', description: 'Workshop dasar audio engineering untuk crew acara.', participants: 12, facilityName: 'Sound System', hours: 3 },
];

type RequestStatus =
  | 'SUBMITTED' | 'WAITING_BIRO_III' | 'REJECTED_BY_BIRO_III'
  | 'WAITING_WR3_WD3' | 'REJECTED_BY_WR3_WD3'
  | 'WAITING_ADMIN_UNIT' | 'REVISION_REQUESTED' | 'ON_HOLD'
  | 'APPROVED' | 'REJECTED' | 'CANCELLED';

// status distribution for 18 requests
const STATUS_PLAN: RequestStatus[] = [
  'APPROVED', 'APPROVED', 'APPROVED', 'APPROVED', 'APPROVED',
  'WAITING_BIRO_III', 'WAITING_BIRO_III', 'WAITING_BIRO_III',
  'WAITING_WR3_WD3', 'WAITING_WR3_WD3',
  'WAITING_ADMIN_UNIT', 'WAITING_ADMIN_UNIT',
  'REVISION_REQUESTED',
  'ON_HOLD',
  'REJECTED_BY_BIRO_III',
  'REJECTED_BY_WR3_WD3',
  'REJECTED',
  'CANCELLED',
];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toMysql(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

function makeRequestCode(d: Date, i: number): string {
  return `PJM-${d.getFullYear()}-${pad(d.getMonth() + 1)}${pad(d.getDate())}-${String(i).padStart(3, '0')}`;
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campus_facility_booking',
    multipleStatements: true,
  });

  const hash = await bcrypt.hash('password123', 10);

  await conn.query('DELETE FROM facility_bookings');
  await conn.query('DELETE FROM notifications');
  await conn.query('DELETE FROM approval_logs');
  await conn.query('DELETE FROM facility_requests');
  await conn.query('DELETE FROM users');
  await conn.query('DELETE FROM facilities');

  // Insert facilities
  for (const [name, category, unit, location, capacity, description] of FACILITIES) {
    await conn.execute(
      'INSERT INTO facilities (name, category, managingUnit, location, capacity, description) VALUES (?,?,?,?,?,?)',
      [name, category, unit, location, capacity, description]
    );
  }
  const [facRows] = await conn.query<{ id: number; name: string }[] & mysql.RowDataPacket[]>(
    'SELECT id, name FROM facilities'
  );
  const facilityIdByName: Record<string, number> = {};
  for (const f of facRows as unknown as { id: number; name: string }[]) {
    facilityIdByName[f.name] = f.id;
  }

  // Insert staff & demo users
  type UserRow = {
    name: string;
    email: string;
    role: 'PENGURUS' | 'BIRO_III' | 'WR3_WD3' | 'ADMIN_UNIT' | 'SUPER_ADMIN';
    org: string | null;
    phone: string;
    idnum: string | null;
    isActive: 0 | 1;
    scope: 'UNIVERSITAS' | 'FAKULTAS' | null;
    bureau: 'BIRO_I' | 'BIRO_IV' | 'PPLK' | 'KRT' | 'LPAIP' | null;
  };
  const staff: UserRow[] = [
    { name: 'Pengurus Demo', email: 'pengurus@kampus.test', role: 'PENGURUS', org: 'BEM Universitas', phone: '081234567890', idnum: '2021001', isActive: 1, scope: null, bureau: null },
    { name: 'Biro III Demo', email: 'biro3@kampus.test', role: 'BIRO_III', org: null, phone: '081234567891', idnum: null, isActive: 1, scope: null, bureau: null },
    { name: 'WR3 Demo', email: 'wr3@kampus.test', role: 'WR3_WD3', org: null, phone: '081234567892', idnum: null, isActive: 1, scope: 'UNIVERSITAS', bureau: null },
    { name: 'WD3 Demo', email: 'wd3@kampus.test', role: 'WR3_WD3', org: null, phone: '081234567895', idnum: null, isActive: 1, scope: 'FAKULTAS', bureau: null },
    { name: 'Admin Biro I', email: 'biro1@kampus.test', role: 'ADMIN_UNIT', org: null, phone: '081234567910', idnum: null, isActive: 1, scope: null, bureau: 'BIRO_I' },
    { name: 'Admin Biro IV', email: 'biro4@kampus.test', role: 'ADMIN_UNIT', org: null, phone: '081234567911', idnum: null, isActive: 1, scope: null, bureau: 'BIRO_IV' },
    { name: 'Admin PPLK', email: 'pplk@kampus.test', role: 'ADMIN_UNIT', org: null, phone: '081234567912', idnum: null, isActive: 1, scope: null, bureau: 'PPLK' },
    { name: 'Admin KRT', email: 'krt@kampus.test', role: 'ADMIN_UNIT', org: null, phone: '081234567913', idnum: null, isActive: 1, scope: null, bureau: 'KRT' },
    { name: 'Admin LPAIP', email: 'lpaip@kampus.test', role: 'ADMIN_UNIT', org: null, phone: '081234567914', idnum: null, isActive: 1, scope: null, bureau: 'LPAIP' },
    { name: 'Super Admin', email: 'superadmin@kampus.test', role: 'SUPER_ADMIN', org: null, phone: '081234567894', idnum: null, isActive: 1, scope: null, bureau: null },
  ];
  for (const u of staff) {
    await conn.execute(
      'INSERT INTO users (name, email, password, role, isActive, userScope, bureauScope, organizationName, phone, identityNumber) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [u.name, u.email, hash, u.role, u.isActive, u.scope, u.bureau, u.org, u.phone, u.idnum]
    );
  }

  // Insert org pengurus
  for (const o of ORGS) {
    await conn.execute(
      'INSERT INTO users (name, email, password, role, isActive, userScope, organizationName, phone, identityNumber) VALUES (?,?,?, "PENGURUS", 1, NULL, ?, ?, ?)',
      [o.pic, o.email, hash, o.org, o.phone, o.nim]
    );
  }

  const [orgUserRows] = await conn.query<{ id: number; email: string }[] & mysql.RowDataPacket[]>(
    'SELECT id, email FROM users WHERE role = "PENGURUS"'
  );
  const userIdByEmail: Record<string, number> = {};
  for (const u of orgUserRows as unknown as { id: number; email: string }[]) {
    userIdByEmail[u.email] = u.id;
  }

  // Build requests
  // "Today" anchor for the dummy data
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // dayOffset map per i (spread across -10..+45 days)
  const dayOffsets = [-12, -7, -3, -1, 1, 2, 3, 5, 7, 9, 12, 15, 18, 21, 24, 28, 32, 40];

  for (let i = 0; i < ACTIVITIES.length; i++) {
    const act = ACTIVITIES[i];
    const org = ORGS[i % ORGS.length];
    const status = STATUS_PLAN[i % STATUS_PLAN.length];

    const startHour = 8 + (i % 8); // 8..15
    const start = new Date(today);
    start.setDate(start.getDate() + dayOffsets[i]);
    start.setHours(startHour, 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + act.hours);

    const userId = userIdByEmail[org.email];
    const facilityId = facilityIdByName[act.facilityName];
    if (!userId || !facilityId) continue;

    const requestCode = makeRequestCode(start, i + 1);
    const submittedAt = new Date(start);
    submittedAt.setDate(submittedAt.getDate() - 7);
    const approvedAt = status === 'APPROVED' ? new Date(submittedAt.getTime() + 2 * 86400000) : null;
    const rejectedAt =
      status.startsWith('REJECT') || status === 'REJECTED'
        ? new Date(submittedAt.getTime() + 2 * 86400000)
        : null;

    let currentStep: string | null = null;
    switch (status) {
      case 'WAITING_BIRO_III': currentStep = 'BIRO_III'; break;
      case 'WAITING_WR3_WD3': currentStep = 'WR3_WD3'; break;
      case 'WAITING_ADMIN_UNIT': currentStep = 'ADMIN_UNIT'; break;
      case 'REVISION_REQUESTED': currentStep = 'PENGURUS_REVISION'; break;
      case 'ON_HOLD': currentStep = 'ADMIN_UNIT'; break;
      case 'APPROVED': currentStep = 'COMPLETED'; break;
    }

    await conn.execute(
      `INSERT INTO facility_requests (
        requestCode, userId, facilityId, activityName, organizationName, personInCharge,
        identityNumber, email, phone, startDateTime, endDateTime, participantCount,
        purpose, description, activityScope, additionalNeeds, attachmentUrl, notes,
        status, currentStep, submittedAt, approvedAt, rejectedAt
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        requestCode, userId, facilityId, act.name, org.org, org.pic,
        org.nim, org.email, org.phone, toMysql(start), toMysql(end), act.participants,
        act.purpose, act.description, org.scope, null, null, null,
        status, currentStep,
        toMysql(submittedAt),
        approvedAt ? toMysql(approvedAt) : null,
        rejectedAt ? toMysql(rejectedAt) : null,
      ]
    );

    const [reqRow] = await conn.query<{ id: number }[] & mysql.RowDataPacket[]>(
      'SELECT id FROM facility_requests WHERE requestCode = ?',
      [requestCode]
    );
    const requestId = (reqRow as unknown as { id: number }[])[0]?.id;
    if (!requestId) continue;

    // Insert booking when APPROVED
    if (status === 'APPROVED') {
      await conn.execute(
        `INSERT INTO facility_bookings (requestId, facilityId, startDateTime, endDateTime, status)
         VALUES (?,?,?,?,'ACTIVE')`,
        [requestId, facilityId, toMysql(start), toMysql(end)]
      );
    }

    // Minimal approval log trail
    await conn.execute(
      `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
       VALUES (?,?,?,?,?,?)`,
      [requestId, userId, 'SUBMIT', 'DRAFT', 'WAITING_BIRO_III', null]
    );

    if (
      status === 'WAITING_WR3_WD3' || status === 'WAITING_ADMIN_UNIT' ||
      status === 'REVISION_REQUESTED' || status === 'ON_HOLD' ||
      status === 'REJECTED_BY_WR3_WD3' || status === 'REJECTED' || status === 'APPROVED'
    ) {
      await conn.execute(
        `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
         VALUES (?,?,?,?,?,?)`,
        [requestId, null, 'APPROVE_BIRO_III', 'WAITING_BIRO_III', 'WAITING_WR3_WD3', 'OK dari Biro III']
      );
    }
    if (
      status === 'WAITING_ADMIN_UNIT' || status === 'REVISION_REQUESTED' ||
      status === 'ON_HOLD' || status === 'REJECTED' || status === 'APPROVED'
    ) {
      await conn.execute(
        `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
         VALUES (?,?,?,?,?,?)`,
        [requestId, null, 'APPROVE_WR3_WD3', 'WAITING_WR3_WD3', 'WAITING_ADMIN_UNIT', 'Lanjutkan ke admin unit']
      );
    }
    if (status === 'APPROVED') {
      await conn.execute(
        `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
         VALUES (?,?,?,?,?,?)`,
        [requestId, null, 'APPROVE_ADMIN', 'WAITING_ADMIN_UNIT', 'APPROVED', 'Disetujui — silakan ambil kunci 30 menit sebelum acara.']
      );
    }
    if (status === 'REJECTED_BY_BIRO_III') {
      await conn.execute(
        `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
         VALUES (?,?,?,?,?,?)`,
        [requestId, null, 'REJECT_BIRO_III', 'WAITING_BIRO_III', 'REJECTED_BY_BIRO_III', 'Proposal belum lengkap, mohon lengkapi surat tugas.']
      );
    }
    if (status === 'REJECTED_BY_WR3_WD3') {
      await conn.execute(
        `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
         VALUES (?,?,?,?,?,?)`,
        [requestId, null, 'REJECT_WR3_WD3', 'WAITING_WR3_WD3', 'REJECTED_BY_WR3_WD3', 'Bertabrakan dengan agenda fakultas.']
      );
    }
    if (status === 'REJECTED') {
      await conn.execute(
        `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
         VALUES (?,?,?,?,?,?)`,
        [requestId, null, 'REJECT_ADMIN', 'WAITING_ADMIN_UNIT', 'REJECTED', 'Fasilitas sedang maintenance pada tanggal tersebut.']
      );
    }
    if (status === 'REVISION_REQUESTED') {
      await conn.execute(
        `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
         VALUES (?,?,?,?,?,?)`,
        [requestId, null, 'REQUEST_REVISION', 'WAITING_ADMIN_UNIT', 'REVISION_REQUESTED', 'Tolong sertakan rincian kebutuhan tambahan.']
      );
    }
    if (status === 'ON_HOLD') {
      await conn.execute(
        `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
         VALUES (?,?,?,?,?,?)`,
        [requestId, null, 'HOLD', 'WAITING_ADMIN_UNIT', 'ON_HOLD', 'Menunggu konfirmasi pengelola gedung.']
      );
    }
    if (status === 'CANCELLED') {
      await conn.execute(
        `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
         VALUES (?,?,?,?,?,?)`,
        [requestId, userId, 'CANCEL', 'APPROVED', 'CANCELLED', 'Dibatalkan oleh pengaju karena perubahan jadwal.']
      );
    }
  }

  console.log(
    `Seed selesai. ${FACILITIES.length} fasilitas, ${staff.length + ORGS.length} user, ${ACTIVITIES.length} peminjaman.`
  );
  console.log('Login dengan password: password123');
  console.log('Akun org: gunakan email seperti damar.wicaksono@students.ukdw.ac.id');
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
