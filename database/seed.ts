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
  // BIRO I — Ruang Pembelajaran
  ['Ruang Kelas Biasa', 'Ruang Kelas', 'BIRO_I', 'Gedung Akademik', 40, 'Ruang kelas standar untuk perkuliahan reguler'],
  ['Ruang Hybrid', 'Ruang Kelas', 'BIRO_I', 'Gedung Akademik', 40, 'Ruang kelas dengan dukungan kuliah hybrid (online + offline)'],
  ['Ruang Tutorial', 'Ruang Tutorial', 'BIRO_I', 'Gedung Akademik', 25, 'Ruang tutorial untuk sesi pembelajaran kelompok kecil'],

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

  for (const [name, category, unit, location, capacity, description] of FACILITIES) {
    await conn.execute(
      'INSERT INTO facilities (name, category, managingUnit, location, capacity, description) VALUES (?,?,?,?,?,?)',
      [name, category, unit, location, capacity, description]
    );
  }

  const users: [string, string, string, string | null, string, string | null][] = [
    ['Pengurus Demo', 'pengurus@kampus.test', 'PENGURUS', 'BEM Universitas', '081234567890', '2021001'],
    ['Biro III Demo', 'biro3@kampus.test', 'BIRO_III', null, '081234567891', null],
    ['WR3 Demo', 'wr3@kampus.test', 'WR3_WD3', null, '081234567892', null],
    ['Admin Unit Demo', 'adminunit@kampus.test', 'ADMIN_UNIT', null, '081234567893', null],
    ['Super Admin', 'superadmin@kampus.test', 'SUPER_ADMIN', null, '081234567894', null],
  ];

  for (const [name, email, role, org, phone, idnum] of users) {
    await conn.execute(
      'INSERT INTO users (name, email, password, role, organizationName, phone, identityNumber) VALUES (?,?,?,?,?,?,?)',
      [name, email, hash, role, org, phone, idnum]
    );
  }

  console.log(`Seed selesai. ${FACILITIES.length} fasilitas, ${users.length} user.`);
  console.log('Login dengan password: password123');
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
