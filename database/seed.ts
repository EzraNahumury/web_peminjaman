import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// ─── Dummy image generators ────────────────────────────────────────
// Generates a tiny PNG programmatically (no external deps needed).
// We use the simplest valid PNG: an 8x8 uncompressed RGBA image.

function makeTinyPng(r: number, g: number, b: number, width = 80, height = 80): Buffer {
  // Create a minimal valid PNG with a solid color
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0); // chunk length
  ihdr.write('IHDR', 4);
  ihdr.writeUInt32BE(width, 8);
  ihdr.writeUInt32BE(height, 12);
  ihdr.writeUInt8(8, 16); // bit depth
  ihdr.writeUInt8(2, 17); // RGB
  ihdr.writeUInt8(0, 18); // compression
  ihdr.writeUInt8(0, 19); // filter
  ihdr.writeUInt8(0, 20); // interlace
  const ihdrData = ihdr.subarray(4, 21);
  ihdr.writeUInt32BE(crc32(ihdrData) >>> 0, 21);

  // IDAT chunk - raw image data with zlib wrapper
  const rawRow = Buffer.alloc(1 + width * 3); // filter byte + RGB per pixel
  rawRow[0] = 0; // no filter
  for (let x = 0; x < width; x++) {
    rawRow[1 + x * 3] = r;
    rawRow[1 + x * 3 + 1] = g;
    rawRow[1 + x * 3 + 2] = b;
  }
  // Build uncompressed deflate blocks
  const rawData = Buffer.alloc(height * rawRow.length);
  for (let y = 0; y < height; y++) {
    rawRow.copy(rawData, y * rawRow.length);
  }

  // Zlib: header(2) + deflate blocks + adler32(4)
  const zlibHeader = Buffer.from([0x78, 0x01]); // zlib header (no compression)

  // Split raw data into deflate stored blocks (max 65535 bytes each)
  const blocks: Buffer[] = [];
  let offset = 0;
  while (offset < rawData.length) {
    const remaining = rawData.length - offset;
    const blockSize = Math.min(remaining, 65535);
    const isLast = offset + blockSize >= rawData.length;
    const blockHeader = Buffer.alloc(5);
    blockHeader[0] = isLast ? 0x01 : 0x00;
    blockHeader.writeUInt16LE(blockSize, 1);
    blockHeader.writeUInt16LE(blockSize ^ 0xFFFF, 3);
    blocks.push(blockHeader);
    blocks.push(rawData.subarray(offset, offset + blockSize));
    offset += blockSize;
  }

  const adler = adler32(rawData);
  const adlerBuf = Buffer.alloc(4);
  adlerBuf.writeUInt32BE(adler >>> 0, 0);

  const compressedData = Buffer.concat([zlibHeader, ...blocks, adlerBuf]);

  const idatChunkLen = Buffer.alloc(4);
  idatChunkLen.writeUInt32BE(compressedData.length, 0);
  const idatType = Buffer.from('IDAT');
  const idatCrcData = Buffer.concat([idatType, compressedData]);
  const idatCrc = Buffer.alloc(4);
  idatCrc.writeUInt32BE(crc32(idatCrcData) >>> 0, 0);

  const idat = Buffer.concat([idatChunkLen, idatType, compressedData, idatCrc]);

  // IEND chunk
  const iend = Buffer.alloc(12);
  iend.writeUInt32BE(0, 0);
  iend.write('IEND', 4);
  const iendData = iend.subarray(4, 8);
  iend.writeUInt32BE(crc32(iendData) >>> 0, 8);

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function crc32(buf: Buffer): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) | 0;
}

function adler32(buf: Buffer): number {
  let a = 1, b = 0;
  for (let i = 0; i < buf.length; i++) {
    a = (a + buf[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ─── Facilities ────────────────────────────────────────────────────

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
  ['Ruang B.3.1', 'Ruang Kelas', 'BIRO_I', 'Gedung B Lt.3', 40, 'Ruang Kelas Biasa'],
  ['Ruang B.3.2', 'Ruang Kelas', 'BIRO_I', 'Gedung B Lt.3', 40, 'Ruang Kelas Biasa'],
  ['Ruang B.3.3', 'Ruang Kelas', 'BIRO_I', 'Gedung B Lt.3', 40, 'Ruang Kelas Biasa'],
  ['Ruang B.3.4', 'Ruang Kelas', 'BIRO_I', 'Gedung B Lt.3', 40, 'Ruang Kelas Biasa'],
  ['Ruang C.3.7', 'Ruang Kelas', 'BIRO_I', 'Gedung C Lt.3', 40, 'Ruang Kelas Biasa'],
  ['Ruang C.3.8', 'Ruang Kelas', 'BIRO_I', 'Gedung C Lt.3', 40, 'Ruang Kelas Biasa'],
  ['Ruang C.3.9', 'Ruang Kelas', 'BIRO_I', 'Gedung C Lt.3', 40, 'Ruang Kelas Biasa'],
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
  ['Ruang G.3.4', 'Ruang Kelas', 'BIRO_I', 'Gedung G Lt.3', 40, 'Ruang Kelas Biasa'],
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
  ['Ruang Rudi Budiman', 'Ruang Seminar', 'KRT', 'Gedung Utama', 80, 'Ruang seminar Rudi Budiman'],
  ['Ruang Harun', 'Ruang Seminar', 'KRT', 'Gedung Utama', 80, 'Ruang seminar Harun'],
  ['Kendaraan', 'Kendaraan', 'KRT', 'Pool Kendaraan KRT', null, 'Kendaraan operasional kampus'],
  ['Sound System', 'Peralatan', 'KRT', 'Inventaris KRT', null, 'Sound system untuk acara besar'],
  ['Layar Viewer Proyektor', 'Peralatan', 'KRT', 'Inventaris KRT', null, 'Layar untuk proyektor'],

  // LPAIP — Dokumentasi & Multimedia
  ['Kamera (LPAIP)', 'Peralatan', 'LPAIP', 'Inventaris LPAIP', null, 'Kamera dokumentasi multimedia'],
  ['Stabilizer Kamera', 'Peralatan', 'LPAIP', 'Inventaris LPAIP', null, 'Gimbal/stabilizer untuk video shooting'],
  ['Tripod', 'Peralatan', 'LPAIP', 'Inventaris LPAIP', null, 'Tripod kamera untuk shooting stabil'],
  ['Saramonic', 'Peralatan', 'LPAIP', 'Inventaris LPAIP', null, 'Mikrofon Saramonic untuk recording audio'],
];

// ─── Organization / Pengurus ───────────────────────────────────────

type OrgRow = {
  org: string;
  scope: 'UNIVERSITAS' | 'FAKULTAS';
  pic: string;
  email: string;
  nim: string;
  phone: string;
};

const ORGS: OrgRow[] = [
  // UKM tingkat Universitas
  { org: 'BEMU UKDW', scope: 'UNIVERSITAS', pic: 'Damar Wicaksono', email: 'damar.wicaksono@students.ukdw.ac.id', nim: '72220001', phone: '081234560001' },
  { org: 'UKM Paduan Suara Mahasiswa', scope: 'UNIVERSITAS', pic: 'Naomi Hartanto', email: 'naomi.hartanto@students.ukdw.ac.id', nim: '72220012', phone: '081234560002' },
  { org: 'UKM Persekutuan Mahasiswa Kristen', scope: 'UNIVERSITAS', pic: 'Yohanes Saputra', email: 'yohanes.saputra@students.ukdw.ac.id', nim: '72220020', phone: '081234560003' },
  { org: 'UKM Mapasadha (Pecinta Alam)', scope: 'UNIVERSITAS', pic: 'Bagas Pratama', email: 'bagas.pratama@students.ukdw.ac.id', nim: '72220033', phone: '081234560004' },
  { org: 'UKM Fotografi Lensa', scope: 'UNIVERSITAS', pic: 'Cindy Wijaya', email: 'cindy.wijaya@students.ukdw.ac.id', nim: '72220045', phone: '081234560005' },
  { org: 'UKM KSR PMI Unit UKDW', scope: 'UNIVERSITAS', pic: 'Adrian Tanu', email: 'adrian.tanu@students.ukdw.ac.id', nim: '72220051', phone: '081234560006' },
  { org: 'UKM Teater Serambi', scope: 'UNIVERSITAS', pic: 'Elisa Wibowo', email: 'elisa.wibowo@students.ukdw.ac.id', nim: '72220060', phone: '081234560007' },
  { org: 'UKM Badminton Duta', scope: 'UNIVERSITAS', pic: 'Ricky Setiawan', email: 'ricky.setiawan@students.ukdw.ac.id', nim: '72220071', phone: '081234560008' },
  { org: 'UKM English Club', scope: 'UNIVERSITAS', pic: 'Jessica Tan', email: 'jessica.tan@students.ukdw.ac.id', nim: '72220082', phone: '081234560009' },
  { org: 'UKM Robotika', scope: 'UNIVERSITAS', pic: 'Farhan Hidayat', email: 'farhan.hidayat@students.ukdw.ac.id', nim: '72220093', phone: '081234560010' },
  // BEM Fakultas
  { org: 'BEM Fakultas Teknologi Informasi', scope: 'FAKULTAS', pic: 'Stevanus Karunia', email: 'stevanus.karunia@students.ukdw.ac.id', nim: '71210011', phone: '081234560011' },
  { org: 'BEM Fakultas Bisnis', scope: 'FAKULTAS', pic: 'Maria Kristanti', email: 'maria.kristanti@students.ukdw.ac.id', nim: '11210021', phone: '081234560012' },
  { org: 'BEM Fakultas Bioteknologi', scope: 'FAKULTAS', pic: 'Daniel Susanto', email: 'daniel.susanto@students.ukdw.ac.id', nim: '31210031', phone: '081234560013' },
  { org: 'BEM Fakultas Kedokteran', scope: 'FAKULTAS', pic: 'Vania Halim', email: 'vania.halim@students.ukdw.ac.id', nim: '41210041', phone: '081234560014' },
  { org: 'BEM Fakultas Arsitektur', scope: 'FAKULTAS', pic: 'Hendro Prasetyo', email: 'hendro.prasetyo@students.ukdw.ac.id', nim: '61210051', phone: '081234560015' },
  // HMPS
  { org: 'HMPS Informatika', scope: 'FAKULTAS', pic: 'Rafael Limanto', email: 'rafael.limanto@students.ukdw.ac.id', nim: '71210101', phone: '081234560101' },
  { org: 'HMPS Sistem Informasi', scope: 'FAKULTAS', pic: 'Inez Hadinata', email: 'inez.hadinata@students.ukdw.ac.id', nim: '72210111', phone: '081234560102' },
  { org: 'HMPS Akuntansi', scope: 'FAKULTAS', pic: 'Kevin Wijaya', email: 'kevin.wijaya@students.ukdw.ac.id', nim: '11210121', phone: '081234560103' },
  { org: 'HMPS Manajemen', scope: 'FAKULTAS', pic: 'Sarah Lim', email: 'sarah.lim@students.ukdw.ac.id', nim: '12210131', phone: '081234560104' },
  { org: 'HMPS Arsitektur', scope: 'FAKULTAS', pic: 'Garry Hutomo', email: 'garry.hutomo@students.ukdw.ac.id', nim: '61210141', phone: '081234560105' },
];

// ─── Activity templates — grouped per managing unit ────────────────

type ActivityTemplate = {
  name: string;
  purpose: string;
  description: string;
  participants: number;
  facilityName: string;
  hours: number;
  level: 'AKADEMIK' | 'INSTITUSIONAL' | 'KEMAHASISWAAN';
};

// ---- BIRO_I activities (classrooms) ----
const BIRO_I_ACTIVITIES: ActivityTemplate[] = [
  { name: 'Rapat Koordinasi Pengurus', purpose: 'Rapat internal', description: 'Rapat program kerja bulanan pengurus harian BEM.', participants: 18, facilityName: 'Ruang D.1.2', hours: 2, level: 'KEMAHASISWAAN' },
  { name: 'Pelatihan Public Speaking', purpose: 'Pelatihan', description: 'Pelatihan komunikasi publik untuk pengurus organisasi.', participants: 25, facilityName: 'Ruang D.1.3', hours: 3, level: 'KEMAHASISWAAN' },
  { name: 'Open Recruitment Pengurus', purpose: 'Rekrutmen', description: 'Sesi seleksi calon pengurus periode 2026/2027.', participants: 40, facilityName: 'Ruang D.1.1', hours: 4, level: 'KEMAHASISWAAN' },
  { name: 'Diskusi Kelompok Studi', purpose: 'Diskusi akademik', description: 'Diskusi kelompok studi untuk mata kuliah Algoritma.', participants: 30, facilityName: 'Ruang B.3.1', hours: 2, level: 'AKADEMIK' },
  { name: 'Kelas Tambahan Kalkulus', purpose: 'Tutorial', description: 'Tutorial tambahan kalkulus oleh asisten dosen.', participants: 35, facilityName: 'Ruang B.3.2', hours: 2, level: 'AKADEMIK' },
  { name: 'Workshop UI/UX Design', purpose: 'Workshop', description: 'Workshop pengenalan design thinking dan prototyping.', participants: 28, facilityName: 'Ruang D.2.1', hours: 3, level: 'KEMAHASISWAAN' },
  { name: 'Rapat Panitia Dies Natalis', purpose: 'Rapat koordinasi', description: 'Rapat persiapan perayaan dies natalis UKDW.', participants: 20, facilityName: 'Ruang E.2.1', hours: 2, level: 'INSTITUSIONAL' },
  { name: 'Seminar Etika Profesi', purpose: 'Seminar', description: 'Seminar etika profesi menghadirkan praktisi industri.', participants: 40, facilityName: 'Ruang H.2.1', hours: 3, level: 'AKADEMIK' },
  { name: 'Latihan Presentasi Tugas Akhir', purpose: 'Latihan', description: 'Mahasiswa berlatih presentasi tugas akhir semester.', participants: 15, facilityName: 'Ruang D.1.2', hours: 3, level: 'AKADEMIK' },
  { name: 'Sosialisasi Beasiswa', purpose: 'Sosialisasi', description: 'Sosialisasi program beasiswa internal dan eksternal kampus.', participants: 40, facilityName: 'Ruang E.3.1', hours: 2, level: 'INSTITUSIONAL' },
  { name: 'Focus Group Discussion', purpose: 'Diskusi', description: 'FGD penelitian dosen tentang adopsi teknologi AI.', participants: 12, facilityName: 'Ruang D.1.3', hours: 3, level: 'AKADEMIK' },
  { name: 'Rapat Pengurus Harian', purpose: 'Rapat', description: 'Rapat mingguan pengurus harian BEMU.', participants: 10, facilityName: 'Ruang B.3.3', hours: 2, level: 'KEMAHASISWAAN' },
  { name: 'Workshop Penulisan Ilmiah', purpose: 'Pelatihan', description: 'Pelatihan penulisan paper dan jurnal ilmiah.', participants: 25, facilityName: 'Ruang D.3.1', hours: 4, level: 'AKADEMIK' },
];

// ---- BIRO_IV activities (ruangan & peralatan pendukung) ----
const BIRO_IV_ACTIVITIES: ActivityTemplate[] = [
  { name: 'Latihan Rutin Paduan Suara', purpose: 'Latihan rutin', description: 'Latihan vokal mingguan persiapan konser semester.', participants: 35, facilityName: 'Ruang H.1.1', hours: 2, level: 'KEMAHASISWAAN' },
  { name: 'Sosialisasi Program Kerja', purpose: 'Sosialisasi', description: 'Sosialisasi proker kepada anggota baru UKM.', participants: 45, facilityName: 'Ruang H.1.1', hours: 2, level: 'KEMAHASISWAAN' },
  { name: 'Recording Podcast Episode 8', purpose: 'Dokumentasi audio', description: 'Recording episode podcast organisasi.', participants: 4, facilityName: 'Studio Podcast', hours: 2, level: 'KEMAHASISWAAN' },
  { name: 'Recording Podcast Episode 9', purpose: 'Dokumentasi audio', description: 'Recording episode podcast alumni spesial.', participants: 5, facilityName: 'Studio Podcast', hours: 3, level: 'KEMAHASISWAAN' },
  { name: 'Dokumentasi Kegiatan Ospek', purpose: 'Dokumentasi foto', description: 'Peminjaman kamera untuk dokumentasi kegiatan ospek.', participants: 3, facilityName: 'Kamera Foto', hours: 8, level: 'INSTITUSIONAL' },
  { name: 'Live Streaming Seminar Online', purpose: 'Streaming', description: 'Streaming seminar nasional secara online.', participants: 2, facilityName: 'Kamera Streaming', hours: 4, level: 'KEMAHASISWAAN' },
  { name: 'Dokumentasi Rapat Kerja', purpose: 'Dokumentasi audio', description: 'Rekaman audio rapat kerja tahunan.', participants: 3, facilityName: 'Perlengkapan Mikrofon (Biro IV)', hours: 3, level: 'INSTITUSIONAL' },
  { name: 'Transfer Data Dokumentasi', purpose: 'Operasional', description: 'Peminjaman flash memory untuk transfer file acara.', participants: 1, facilityName: 'Flash Memory', hours: 4, level: 'KEMAHASISWAAN' },
  { name: 'Rehearsal Drama Musikal', purpose: 'Latihan', description: 'Rehearsal penuh drama musikal untuk acara natal kampus.', participants: 50, facilityName: 'Ruang H.1.1', hours: 4, level: 'KEMAHASISWAAN' },
  { name: 'Recording Podcast Dosen Tamu', purpose: 'Dokumentasi audio', description: 'Wawancara podcast dengan dosen tamu dari luar negeri.', participants: 4, facilityName: 'Studio Podcast', hours: 2, level: 'AKADEMIK' },
  { name: 'Dokumentasi Wisuda', purpose: 'Dokumentasi', description: 'Dokumentasi foto untuk wisuda semester gasal.', participants: 5, facilityName: 'Kamera Foto', hours: 6, level: 'INSTITUSIONAL' },
  { name: 'Streaming Ibadah Kampus', purpose: 'Ibadah', description: 'Live streaming ibadah mingguan kampus UKDW.', participants: 3, facilityName: 'Kamera Streaming', hours: 3, level: 'INSTITUSIONAL' },
];

// ---- PPLK activities (lab & peralatan teknis) ----
const PPLK_ACTIVITIES: ActivityTemplate[] = [
  { name: 'Pelatihan Programming Web', purpose: 'Pelatihan teknis', description: 'Pelatihan dasar pengembangan web menggunakan framework modern.', participants: 28, facilityName: 'Lab Komputer A', hours: 4, level: 'KEMAHASISWAAN' },
  { name: 'Kompetisi Coding Internal', purpose: 'Kompetisi', description: 'Lomba pemrograman antar angkatan dengan hadiah sertifikat.', participants: 30, facilityName: 'Lab Komputer B', hours: 5, level: 'KEMAHASISWAAN' },
  { name: 'Workshop Cyber Security', purpose: 'Workshop', description: 'Workshop keamanan siber dasar untuk mahasiswa.', participants: 25, facilityName: 'Lab Komputer C', hours: 4, level: 'KEMAHASISWAAN' },
  { name: 'Ujian Praktikum Basis Data', purpose: 'Ujian', description: 'Ujian praktikum basis data semester genap.', participants: 30, facilityName: 'Lab Komputer D', hours: 3, level: 'AKADEMIK' },
  { name: 'Peminjaman Proyektor Seminar', purpose: 'Presentasi', description: 'Proyektor untuk seminar nasional di auditorium.', participants: 1, facilityName: 'Proyektor', hours: 5, level: 'KEMAHASISWAAN' },
  { name: 'Peminjaman Laptop Presentasi', purpose: 'Presentasi', description: 'Laptop untuk presentasi guest lecture.', participants: 1, facilityName: 'Laptop (Peminjaman Khusus)', hours: 4, level: 'AKADEMIK' },
  { name: 'Peminjaman Speaker Workshop', purpose: 'Peralatan audio', description: 'Speaker aktif untuk workshop di area terbuka.', participants: 1, facilityName: 'Speaker Aktif', hours: 3, level: 'KEMAHASISWAAN' },
  { name: 'Hackathon UKDW 2026', purpose: 'Kompetisi', description: 'Hackathon 24 jam untuk mahasiswa seluruh Indonesia.', participants: 30, facilityName: 'Lab Komputer E', hours: 8, level: 'KEMAHASISWAAN' },
  { name: 'Praktikum Jaringan Komputer', purpose: 'Praktikum', description: 'Praktikum mata kuliah jaringan komputer semester 5.', participants: 28, facilityName: 'Lab Komputer F', hours: 3, level: 'AKADEMIK' },
  { name: 'Workshop Data Science', purpose: 'Workshop', description: 'Workshop analisis data menggunakan Python dan Pandas.', participants: 25, facilityName: 'Lab Komputer G', hours: 4, level: 'KEMAHASISWAAN' },
  { name: 'Pelatihan IoT Dasar', purpose: 'Pelatihan', description: 'Pelatihan Internet of Things menggunakan Arduino.', participants: 20, facilityName: 'Lab Komputer H', hours: 4, level: 'KEMAHASISWAAN' },
  { name: 'Ujian Susulan Pemrograman', purpose: 'Ujian', description: 'Ujian susulan mata kuliah pemrograman dasar.', participants: 15, facilityName: 'Lab Komputer I', hours: 2, level: 'AKADEMIK' },
];

// ---- KRT activities (auditorium, seminar, kendaraan, sound) ----
const KRT_ACTIVITIES: ActivityTemplate[] = [
  { name: 'Workshop AI & Pendidikan', purpose: 'Seminar / Workshop', description: 'Workshop pengenalan AI untuk pendidikan dengan pembicara dosen FTI dan praktisi industri.', participants: 120, facilityName: 'Auditorium Koinonia', hours: 4, level: 'KEMAHASISWAAN' },
  { name: 'Persekutuan Doa Mahasiswa', purpose: 'Ibadah / Persekutuan', description: 'Persekutuan doa rutin mingguan untuk seluruh mahasiswa.', participants: 60, facilityName: 'Ruang Rudi Budiman', hours: 2, level: 'KEMAHASISWAAN' },
  { name: 'Pemutaran Film Dokumenter', purpose: 'Screening film', description: 'Pemutaran film dokumenter lingkungan dilanjutkan diskusi panel.', participants: 80, facilityName: 'Ruang Harun', hours: 3, level: 'KEMAHASISWAAN' },
  { name: 'Seminar Nasional Teknologi', purpose: 'Seminar', description: 'Seminar nasional menghadirkan pembicara industri & akademisi.', participants: 200, facilityName: 'Auditorium Koinonia', hours: 5, level: 'KEMAHASISWAAN' },
  { name: 'Bedah Buku & Diskusi', purpose: 'Diskusi', description: 'Bedah buku karya alumni dengan moderator dosen.', participants: 50, facilityName: 'Ruang Rudi Budiman', hours: 3, level: 'KEMAHASISWAAN' },
  { name: 'Pelatihan Kewirausahaan', purpose: 'Pelatihan', description: 'Pelatihan wirausaha bersama pelaku UMKM Yogyakarta.', participants: 35, facilityName: 'Ruang Harun', hours: 4, level: 'KEMAHASISWAAN' },
  { name: 'Bazar UKM Tengah Tahun', purpose: 'Bazar', description: 'Bazar produk anggota UKM dan kegiatan amal.', participants: 150, facilityName: 'Auditorium Koinonia', hours: 6, level: 'KEMAHASISWAAN' },
  { name: 'Pelatihan Sound Engineering', purpose: 'Pelatihan teknis', description: 'Workshop dasar audio engineering untuk crew acara.', participants: 12, facilityName: 'Sound System', hours: 3, level: 'KEMAHASISWAAN' },
  { name: 'Transport Studi Banding', purpose: 'Studi banding', description: 'Kendaraan untuk studi banding ke kampus mitra.', participants: 15, facilityName: 'Kendaraan', hours: 10, level: 'INSTITUSIONAL' },
  { name: 'Konser Natal Kampus', purpose: 'Pertunjukan', description: 'Konser natal tahunan kampus UKDW di Auditorium.', participants: 300, facilityName: 'Auditorium Koinonia', hours: 5, level: 'INSTITUSIONAL' },
  { name: 'Wisuda Mini Fakultas', purpose: 'Upacara', description: 'Acara wisuda mini untuk fakultas bisnis.', participants: 100, facilityName: 'Auditorium Koinonia', hours: 4, level: 'INSTITUSIONAL' },
  { name: 'Seminar Kesehatan Mental', purpose: 'Seminar', description: 'Seminar kesehatan mental mahasiswa dengan psikolog.', participants: 70, facilityName: 'Ruang Rudi Budiman', hours: 3, level: 'KEMAHASISWAAN' },
  { name: 'Peminjaman Layar Proyektor', purpose: 'Peralatan', description: 'Layar proyektor untuk seminar ruangan kelas.', participants: 1, facilityName: 'Layar Viewer Proyektor', hours: 4, level: 'KEMAHASISWAAN' },
];

// ---- LPAIP activities (kamera, stabilizer, tripod, saramonic) ----
const LPAIP_ACTIVITIES: ActivityTemplate[] = [
  { name: 'Dokumentasi Acara Wisuda Mini', purpose: 'Dokumentasi', description: 'Peliputan video dan foto untuk acara wisuda mini fakultas.', participants: 6, facilityName: 'Kamera (LPAIP)', hours: 5, level: 'INSTITUSIONAL' },
  { name: 'Workshop Fotografi Dasar', purpose: 'Workshop', description: 'Pengenalan dasar komposisi & pengoperasian kamera.', participants: 15, facilityName: 'Kamera (LPAIP)', hours: 3, level: 'KEMAHASISWAAN' },
  { name: 'Video Profil Organisasi', purpose: 'Produksi video', description: 'Shooting video profil untuk BEM Fakultas.', participants: 5, facilityName: 'Stabilizer Kamera', hours: 4, level: 'KEMAHASISWAAN' },
  { name: 'Dokumentasi Seminar Nasional', purpose: 'Dokumentasi', description: 'Dokumentasi video seminar nasional teknologi.', participants: 3, facilityName: 'Tripod', hours: 5, level: 'KEMAHASISWAAN' },
  { name: 'Recording Wawancara Alumni', purpose: 'Produksi audio', description: 'Recording audio wawancara alumni sukses.', participants: 4, facilityName: 'Saramonic', hours: 2, level: 'KEMAHASISWAAN' },
  { name: 'Dokumentasi Acara Natal', purpose: 'Dokumentasi', description: 'Shooting video dan foto perayaan natal kampus.', participants: 5, facilityName: 'Kamera (LPAIP)', hours: 6, level: 'INSTITUSIONAL' },
  { name: 'Produksi Konten Media Sosial', purpose: 'Konten kreasi', description: 'Pembuatan konten promosi untuk media sosial kampus.', participants: 3, facilityName: 'Stabilizer Kamera', hours: 4, level: 'KEMAHASISWAAN' },
  { name: 'Live Interview Dosen', purpose: 'Dokumentasi', description: 'Wawancara video dengan dosen berprestasi.', participants: 4, facilityName: 'Tripod', hours: 3, level: 'INSTITUSIONAL' },
  { name: 'Recording Narasi Dokumenter', purpose: 'Produksi audio', description: 'Recording narasi untuk film dokumenter kampus.', participants: 2, facilityName: 'Saramonic', hours: 3, level: 'KEMAHASISWAAN' },
  { name: 'Dokumentasi Pengabdian Masyarakat', purpose: 'Dokumentasi', description: 'Dokumentasi kegiatan pengabdian masyarakat dosen.', participants: 4, facilityName: 'Kamera (LPAIP)', hours: 5, level: 'AKADEMIK' },
  { name: 'Shooting Video Orientasi Mahasiswa', purpose: 'Produksi video', description: 'Pembuatan video orientasi untuk mahasiswa baru.', participants: 6, facilityName: 'Stabilizer Kamera', hours: 4, level: 'INSTITUSIONAL' },
  { name: 'Recording Audio Drama Radio', purpose: 'Produksi audio', description: 'Recording drama radio untuk event seni kampus.', participants: 8, facilityName: 'Saramonic', hours: 3, level: 'KEMAHASISWAAN' },
];

// ─── Status distribution per admin unit ────────────────────────────
// Ensure every admin unit sees ALL status types

type RequestStatus =
  | 'SUBMITTED' | 'WAITING_BIRO_III' | 'REJECTED_BY_BIRO_III'
  | 'WAITING_WR3_WD3' | 'REJECTED_BY_WR3_WD3'
  | 'WAITING_ADMIN_UNIT' | 'REVISION_REQUESTED' | 'ON_HOLD'
  | 'OVERRIDE_OFFERED'
  | 'APPROVED' | 'REJECTED' | 'CANCELLED';

const STATUS_PER_UNIT: RequestStatus[] = [
  'APPROVED',
  'APPROVED',
  'APPROVED',
  'WAITING_BIRO_III',
  'WAITING_WR3_WD3',
  'WAITING_ADMIN_UNIT',
  'WAITING_ADMIN_UNIT',
  'REVISION_REQUESTED',
  'ON_HOLD',
  'REJECTED_BY_BIRO_III',
  'REJECTED_BY_WR3_WD3',
  'REJECTED',
  'CANCELLED',
];

// ─── Helpers ───────────────────────────────────────────────────────

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toMysql(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

function makeRequestCode(d: Date, i: number): string {
  return `PJM-${d.getFullYear()}-${pad(d.getMonth() + 1)}${pad(d.getDate())}-${String(i).padStart(3, '0')}`;
}

// ─── Generate dummy images for logos & signatures ──────────────────

function generateDummyImages(projectRoot: string) {
  const logosDir = path.join(projectRoot, 'public', 'uploads', 'logos');
  const sigsDir = path.join(projectRoot, 'public', 'uploads', 'signatures');
  ensureDir(logosDir);
  ensureDir(sigsDir);

  // Color palette for logos (distinct colors for each org)
  const logoColors: [number, number, number][] = [
    [41, 98, 255],    // blue
    [0, 150, 136],     // teal
    [255, 87, 34],     // deep orange
    [156, 39, 176],    // purple
    [76, 175, 80],     // green
    [233, 30, 99],     // pink
    [255, 152, 0],     // orange
    [63, 81, 181],     // indigo
    [0, 188, 212],     // cyan
    [139, 195, 74],    // light green
    [121, 85, 72],     // brown
    [96, 125, 139],    // blue grey
    [255, 193, 7],     // amber
    [103, 58, 183],    // deep purple
    [0, 121, 107],     // teal dark
    [244, 67, 54],     // red
    [33, 150, 243],    // light blue
    [205, 220, 57],    // lime
    [158, 158, 158],   // grey
    [255, 111, 0],     // amber dark
  ];

  // Signature colors (darker, like ink)
  const sigColors: [number, number, number][] = [
    [25, 25, 112],     // midnight blue
    [0, 0, 139],       // dark blue
    [47, 47, 47],      // dark grey (pen)
    [0, 100, 0],       // dark green
    [139, 0, 0],       // dark red
  ];

  const generatedLogos: Record<string, string> = {};
  const generatedSigs: Record<string, string> = {};

  // Generate logos for each org
  ORGS.forEach((org, i) => {
    const color = logoColors[i % logoColors.length];
    const fileName = `seed-logo-${i + 1}.png`;
    const filePath = path.join(logosDir, fileName);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, makeTinyPng(color[0], color[1], color[2], 80, 80));
    }
    generatedLogos[org.email] = `/uploads/logos/${fileName}`;
  });

  // Generate signatures for all users
  const allEmails = [
    ...ORGS.map(o => o.email),
    'pengurus@kampus.test',
    'biro3@kampus.test',
    'wr3@kampus.test',
    'wd3@kampus.test',
    'biro1@kampus.test',
    'biro4@kampus.test',
    'pplk@kampus.test',
    'krt@kampus.test',
    'lpaip@kampus.test',
    'superadmin@kampus.test',
  ];

  allEmails.forEach((email, i) => {
    const color = sigColors[i % sigColors.length];
    const fileName = `seed-sig-${i + 1}.png`;
    const filePath = path.join(sigsDir, fileName);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, makeTinyPng(color[0], color[1], color[2], 120, 50));
    }
    generatedSigs[email] = `/uploads/signatures/${fileName}`;
  });

  return { generatedLogos, generatedSigs };
}

// ─── Main seed function ────────────────────────────────────────────

async function main() {
  const projectRoot = process.cwd();
  const { generatedLogos, generatedSigs } = generateDummyImages(projectRoot);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campus_facility_booking',
    multipleStatements: true,
  });

  const hash = await bcrypt.hash('password123', 10);

  // ── Clean existing data ──
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  await conn.query('DELETE FROM facility_bookings');
  await conn.query('DELETE FROM notifications');
  await conn.query('DELETE FROM approval_logs');
  await conn.query('DELETE FROM facility_requests');
  await conn.query('DELETE FROM facility_blocks');
  await conn.query('DELETE FROM users');
  await conn.query('DELETE FROM facilities');
  await conn.query('SET FOREIGN_KEY_CHECKS = 1');

  // ── Insert facilities ──
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

  // ── Mark some facilities as inactive (tidak tersedia) ──
  const INACTIVE_FACILITIES = [
    'Ruang B.3.4',           // BIRO_I  — sedang renovasi
    'Ruang D.3.5',           // BIRO_I  — AC rusak
    'Ruang E.3.6',           // BIRO_I  — dipakai untuk gudang sementara
    'Flash Memory',          // BIRO_IV — unit hilang
    'Kamera Streaming',      // BIRO_IV — sedang diservis
    'Soundcard',             // PPLK   — rusak
    'Lab Komputer I',        // PPLK   — renovasi jaringan
    'Kendaraan',             // KRT    — sedang maintenance
    'Layar Viewer Proyektor',// KRT    — layar sobek
    'Stabilizer Kamera',     // LPAIP  — gimbal error
  ];
  for (const fname of INACTIVE_FACILITIES) {
    if (facilityIdByName[fname]) {
      await conn.execute('UPDATE facilities SET isActive = 0 WHERE id = ?', [facilityIdByName[fname]]);
      console.log(`  [INACTIVE] ${fname}`);
    }
  }

  // ── Insert staff & demo users (with signatures) ──
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
    const sigUrl = generatedSigs[u.email] || null;
    const logoUrl = u.role === 'PENGURUS' ? (generatedLogos[u.email] || null) : null;
    await conn.execute(
      `INSERT INTO users (name, email, password, role, isActive, userScope, bureauScope, organizationName, phone, identityNumber, organizationLogoUrl, signatureUrl)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [u.name, u.email, hash, u.role, u.isActive, u.scope, u.bureau, u.org, u.phone, u.idnum, logoUrl, sigUrl]
    );
  }

  // ── Insert org pengurus (with logo + signature) ──
  for (const o of ORGS) {
    const logoUrl = generatedLogos[o.email] || null;
    const sigUrl = generatedSigs[o.email] || null;
    await conn.execute(
      `INSERT INTO users (name, email, password, role, isActive, userScope, organizationName, phone, identityNumber, organizationLogoUrl, signatureUrl)
       VALUES (?,?,?, 'PENGURUS', 1, NULL, ?, ?, ?, ?, ?)`,
      [o.pic, o.email, hash, o.org, o.phone, o.nim, logoUrl, sigUrl]
    );
  }

  // ── Build user ID lookup maps ──
  const [allUserRows] = await conn.query<{ id: number; email: string; role: string; bureauScope: string | null }[] & mysql.RowDataPacket[]>(
    'SELECT id, email, role, bureauScope FROM users'
  );

  const userIdByEmail: Record<string, number> = {};
  const staffIdByRole: Record<string, number> = {};
  const adminIdByBureau: Record<string, number> = {};

  for (const u of allUserRows as unknown as { id: number; email: string; role: string; bureauScope: string | null }[]) {
    userIdByEmail[u.email] = u.id;
    if (u.role === 'BIRO_III') staffIdByRole['BIRO_III'] = u.id;
    if (u.role === 'WR3_WD3') {
      // Use the first WR3/WD3 we find — wr3@kampus.test (UNIVERSITAS)
      if (!staffIdByRole['WR3_WD3']) staffIdByRole['WR3_WD3'] = u.id;
      if (u.email === 'wd3@kampus.test') staffIdByRole['WD3'] = u.id;
    }
    if (u.role === 'ADMIN_UNIT' && u.bureauScope) {
      adminIdByBureau[u.bureauScope] = u.id;
    }
  }

  // ── Build requests across ALL units ──
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  type UnitBlock = {
    unit: 'BIRO_I' | 'BIRO_IV' | 'PPLK' | 'KRT' | 'LPAIP';
    activities: ActivityTemplate[];
  };

  const unitBlocks: UnitBlock[] = [
    { unit: 'BIRO_I', activities: BIRO_I_ACTIVITIES },
    { unit: 'BIRO_IV', activities: BIRO_IV_ACTIVITIES },
    { unit: 'PPLK', activities: PPLK_ACTIVITIES },
    { unit: 'KRT', activities: KRT_ACTIVITIES },
    { unit: 'LPAIP', activities: LPAIP_ACTIVITIES },
  ];

  let globalIdx = 0;
  let totalRequests = 0;
  let totalBookings = 0;
  let totalLogs = 0;

  for (const block of unitBlocks) {
    const activities = block.activities;
    const adminId = adminIdByBureau[block.unit];
    const biroIIIId = staffIdByRole['BIRO_III'];
    const wr3Id = staffIdByRole['WR3_WD3'];
    const wd3Id = staffIdByRole['WD3'];

    for (let i = 0; i < activities.length; i++) {
      const act = activities[i];
      const org = ORGS[(globalIdx) % ORGS.length];
      const status = STATUS_PER_UNIT[i % STATUS_PER_UNIT.length];

      // Spread dates: some past, mostly future
      const dayOffset = -15 + (globalIdx * 3) % 90;
      const startHour = 8 + (globalIdx % 8);
      const start = new Date(today);
      start.setDate(start.getDate() + dayOffset);
      start.setHours(startHour, 0, 0, 0);
      const end = new Date(start);
      end.setHours(start.getHours() + act.hours);

      const userId = userIdByEmail[org.email];
      const facilityId = facilityIdByName[act.facilityName];
      if (!userId || !facilityId) {
        console.warn(`Skipping: user=${org.email} facility="${act.facilityName}" not found`);
        continue;
      }

      const requestCode = makeRequestCode(start, globalIdx + 1);
      const submittedAt = new Date(start);
      submittedAt.setDate(submittedAt.getDate() - 7);
      const approvedAt = status === 'APPROVED' ? new Date(submittedAt.getTime() + 2 * 86400000) : null;
      const rejectedAt =
        status.startsWith('REJECT') || status === 'REJECTED'
          ? new Date(submittedAt.getTime() + 2 * 86400000)
          : null;

      // Use the correct WR3 or WD3 based on scope
      const wr3ActorId = org.scope === 'FAKULTAS' ? (wd3Id || wr3Id) : wr3Id;

      let currentStep: string | null = null;
      switch (status) {
        case 'WAITING_BIRO_III': currentStep = 'BIRO_III'; break;
        case 'WAITING_WR3_WD3': currentStep = 'WR3_WD3'; break;
        case 'WAITING_ADMIN_UNIT': currentStep = 'ADMIN_UNIT'; break;
        case 'REVISION_REQUESTED': currentStep = 'PENGURUS_REVISION'; break;
        case 'ON_HOLD': currentStep = 'ADMIN_UNIT'; break;
        case 'OVERRIDE_OFFERED': currentStep = 'PENGURUS_OVERRIDE'; break;
        case 'APPROVED': currentStep = 'COMPLETED'; break;
      }

      await conn.execute(
        `INSERT INTO facility_requests (
          requestCode, userId, facilityId, activityName, organizationName, personInCharge,
          identityNumber, email, phone, startDateTime, endDateTime, participantCount,
          purpose, description, activityScope, activityLevel, additionalNeeds, attachmentUrl, notes,
          status, currentStep, submittedAt, approvedAt, rejectedAt
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          requestCode, userId, facilityId, act.name, org.org, org.pic,
          org.nim, org.email, org.phone, toMysql(start), toMysql(end), act.participants,
          act.purpose, act.description, org.scope, act.level, null, null, null,
          status, currentStep,
          toMysql(submittedAt),
          approvedAt ? toMysql(approvedAt) : null,
          rejectedAt ? toMysql(rejectedAt) : null,
        ]
      );
      totalRequests++;

      const [reqRow] = await conn.query<{ id: number }[] & mysql.RowDataPacket[]>(
        'SELECT id FROM facility_requests WHERE requestCode = ?',
        [requestCode]
      );
      const requestId = (reqRow as unknown as { id: number }[])[0]?.id;
      if (!requestId) continue;

      // ── Insert booking when APPROVED ──
      if (status === 'APPROVED') {
        await conn.execute(
          `INSERT INTO facility_bookings (requestId, facilityId, startDateTime, endDateTime, status)
           VALUES (?,?,?,?,'ACTIVE')`,
          [requestId, facilityId, toMysql(start), toMysql(end)]
        );
        totalBookings++;
      }

      // ── Approval log trail with real actor IDs ──

      // 1. Submit log always present
      await conn.execute(
        `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
         VALUES (?,?,?,?,?,?)`,
        [requestId, userId, 'SUBMIT', 'DRAFT', 'WAITING_BIRO_III', null]
      );
      totalLogs++;

      // 2. Biro III approval (for statuses that passed Biro III)
      const passedBiroIII = [
        'WAITING_WR3_WD3', 'WAITING_ADMIN_UNIT',
        'REVISION_REQUESTED', 'ON_HOLD', 'OVERRIDE_OFFERED',
        'REJECTED_BY_WR3_WD3', 'REJECTED', 'APPROVED'
      ].includes(status);

      if (passedBiroIII && biroIIIId) {
        await conn.execute(
          `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
           VALUES (?,?,?,?,?,?)`,
          [requestId, biroIIIId, 'APPROVE_BIRO_III', 'WAITING_BIRO_III', 'WAITING_WR3_WD3', 'OK dari Biro III — berkas lengkap.']
        );
        totalLogs++;
      }

      // 3. WR3/WD3 approval (for statuses that passed WR3)
      const passedWR3 = [
        'WAITING_ADMIN_UNIT', 'REVISION_REQUESTED', 'ON_HOLD',
        'OVERRIDE_OFFERED', 'REJECTED', 'APPROVED'
      ].includes(status);

      if (passedWR3 && wr3ActorId) {
        await conn.execute(
          `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
           VALUES (?,?,?,?,?,?)`,
          [requestId, wr3ActorId, 'APPROVE_WR3_WD3', 'WAITING_WR3_WD3', 'WAITING_ADMIN_UNIT', 'Disetujui — lanjutkan ke admin unit.']
        );
        totalLogs++;
      }

      // 4. Admin Unit actions
      if (status === 'APPROVED' && adminId) {
        await conn.execute(
          `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
           VALUES (?,?,?,?,?,?)`,
          [requestId, adminId, 'APPROVE_ADMIN', 'WAITING_ADMIN_UNIT', 'APPROVED', 'Disetujui — silakan ambil kunci 30 menit sebelum acara.']
        );
        totalLogs++;
      }

      if (status === 'REJECTED_BY_BIRO_III' && biroIIIId) {
        await conn.execute(
          `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
           VALUES (?,?,?,?,?,?)`,
          [requestId, biroIIIId, 'REJECT_BIRO_III', 'WAITING_BIRO_III', 'REJECTED_BY_BIRO_III', 'Proposal belum lengkap, mohon lengkapi surat tugas.']
        );
        totalLogs++;
      }

      if (status === 'REJECTED_BY_WR3_WD3' && wr3ActorId) {
        await conn.execute(
          `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
           VALUES (?,?,?,?,?,?)`,
          [requestId, wr3ActorId, 'REJECT_WR3_WD3', 'WAITING_WR3_WD3', 'REJECTED_BY_WR3_WD3', 'Bertabrakan dengan agenda fakultas.']
        );
        totalLogs++;
      }

      if (status === 'REJECTED' && adminId) {
        await conn.execute(
          `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
           VALUES (?,?,?,?,?,?)`,
          [requestId, adminId, 'REJECT_ADMIN', 'WAITING_ADMIN_UNIT', 'REJECTED', 'Fasilitas sedang maintenance pada tanggal tersebut.']
        );
        totalLogs++;
      }

      if (status === 'REVISION_REQUESTED' && adminId) {
        await conn.execute(
          `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
           VALUES (?,?,?,?,?,?)`,
          [requestId, adminId, 'REQUEST_REVISION', 'WAITING_ADMIN_UNIT', 'REVISION_REQUESTED', 'Tolong sertakan rincian kebutuhan tambahan dan jumlah peserta final.']
        );
        totalLogs++;
      }

      if (status === 'ON_HOLD' && adminId) {
        await conn.execute(
          `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
           VALUES (?,?,?,?,?,?)`,
          [requestId, adminId, 'HOLD', 'WAITING_ADMIN_UNIT', 'ON_HOLD', 'Menunggu konfirmasi pengelola gedung terkait jadwal maintenance.']
        );
        totalLogs++;
      }

      if (status === 'CANCELLED') {
        // First approve fully, then cancel
        if (biroIIIId) {
          await conn.execute(
            `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
             VALUES (?,?,?,?,?,?)`,
            [requestId, biroIIIId, 'APPROVE_BIRO_III', 'WAITING_BIRO_III', 'WAITING_WR3_WD3', 'OK dari Biro III.']
          );
          totalLogs++;
        }
        await conn.execute(
          `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note)
           VALUES (?,?,?,?,?,?)`,
          [requestId, userId, 'CANCEL', 'WAITING_WR3_WD3', 'CANCELLED', 'Dibatalkan oleh pengaju karena perubahan jadwal internal.']
        );
        totalLogs++;
      }

      globalIdx++;
    }
  }

  // ── Summary ──
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  SEED SELESAI');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Fasilitas     : ${FACILITIES.length}`);
  console.log(`  Users         : ${staff.length + ORGS.length}`);
  console.log(`  Peminjaman    : ${totalRequests}`);
  console.log(`  Bookings      : ${totalBookings}`);
  console.log(`  Approval Logs : ${totalLogs}`);
  console.log('');
  console.log('  Per Admin Unit:');
  for (const block of unitBlocks) {
    const count = block.activities.length;
    console.log(`    ${block.unit.padEnd(8)} — ${count} pengajuan`);
  }
  console.log('');
  console.log('  Logo & TTD: Semua pengurus memiliki logo organisasi & tanda tangan.');
  console.log('  Staff TTD:  Biro III, WR3, WD3, semua Admin Unit, Super Admin.');
  console.log('');
  console.log('  Login password: password123');
  console.log('  Contoh akun org: damar.wicaksono@students.ukdw.ac.id');
  console.log('═══════════════════════════════════════════════════════════');

  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
