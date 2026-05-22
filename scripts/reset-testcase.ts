/**
 * Reset data uji 6 test case peminjaman fasilitas (mode manual).
 *
 * Cara pakai:
 *   npm run db:reset-testcase
 *
 * Seluruh 6 test case (TC1-TC6) ditempatkan pada SATU akun uji tetap
 * (lihat TESTCASE_EMAIL di lib/testcase-core.ts). Akun dibuat otomatis
 * bila belum ada. Sifatnya IDEMPOTEN — jalankan berapa kali pun, hasilnya
 * sama.
 *
 * Catatan: akun uji ini juga AUTO-RESET setiap kali login (lihat hook di
 * app/actions/auth.ts). Script ini berguna untuk reset tanpa harus login,
 * atau saat menyiapkan database pertama kali.
 *
 * Prasyarat: `npm run db:seed` sudah pernah dijalankan.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { resetTestcaseData, TESTCASE_EMAIL, TESTCASE_PASSWORD } from '../lib/testcase-core';

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campus_facility_booking',
  });

  const hash = await bcrypt.hash(TESTCASE_PASSWORD, 10);

  try {
    const res = await resetTestcaseData(
      async (sql, params) => { await conn.execute(sql, params); },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (sql, params) => { const [rows] = await conn.query(sql, params); return rows as any; },
      hash
    );

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  RESET TEST CASE SELESAI');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Akun uji      : ${TESTCASE_EMAIL}`);
    console.log(`  Password      : ${TESTCASE_PASSWORD}`);
    console.log(`  Total request : ${res.requestCount} (TC1-TC6)`);
    console.log('    TC1 Revisi Diminta');
    console.log('    TC2 Tawaran fasilitas/jadwal alternatif');
    console.log('    TC3 Status berjalan + riwayat persetujuan');
    console.log('    TC4 Disetujui + surat digital');
    console.log('    TC5 Batalkan pengajuan berjalan');
    console.log('    TC6 Override jadwal');
    console.log('');
    console.log('  Akun ini juga otomatis ter-reset setiap login.');
    console.log('═══════════════════════════════════════════════════════════');
  } catch (e) {
    console.error('Gagal reset test case:', e instanceof Error ? e.message : e);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
