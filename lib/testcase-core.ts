/**
 * Inti pembangun data 6 test case peminjaman fasilitas.
 *
 * Modul ini SENGAJA tidak mengimpor driver database tertentu — ia menerima
 * fungsi `exec` & `q` dari pemanggil. Dengan begitu logika yang sama dipakai
 * oleh:
 *   - script standalone `scripts/reset-testcase.ts` (koneksi mysql2 langsung)
 *   - hook login di server action (lewat `lib/db`)
 *
 * Efek hanya pada akun uji TESTCASE_EMAIL — akun lain tidak disentuh.
 */

export const TESTCASE_EMAIL = 'tester.case@students.ukdw.ac.id';
export const TESTCASE_PASSWORD = 'password123';

const PREPARED_NAME = 'Tester Case Skripsi';
const PREPARED_ORG = 'UKM Tester Skripsi';
const PREPARED_PHONE = '081200000000';
const PREPARED_IDNUM = '72209999';

// Fasilitas yang dipakai (harus ada & aktif dari hasil `npm run db:seed`).
const FAC_MAIN = 'Ruang B.3.1';
const FAC_ALT = 'Ruang B.3.2';
const FAC_PREP = 'Ruang B.3.3';
const FAC_PREP_ALT = 'Ruang C.3.7';

/* eslint-disable @typescript-eslint/no-explicit-any */
/** Menjalankan INSERT/UPDATE/DELETE. */
export type Exec = (sql: string, params: any[]) => Promise<unknown>;
/** Menjalankan SELECT, mengembalikan array baris. */
export type QueryFn = <T = Record<string, unknown>>(sql: string, params: any[]) => Promise<T[]>;
/* eslint-enable @typescript-eslint/no-explicit-any */

export type ResetResult = { userId: number; requestCount: number };

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toMysql(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

/**
 * Membangun ulang data 6 test case pada akun uji.
 *
 * @param exec          fungsi untuk INSERT/UPDATE/DELETE
 * @param q             fungsi untuk SELECT
 * @param passwordHash  hash bcrypt password akun uji (dipakai bila akun belum ada / perlu disinkronkan)
 */
export async function resetTestcaseData(exec: Exec, q: QueryFn, passwordHash: string): Promise<ResetResult> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Helper waktu ──
  function slot(dayOffset: number, hour: number, durationHours: number) {
    const start = new Date(today);
    start.setDate(start.getDate() + dayOffset);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + durationHours);
    return { start, end };
  }

  let codeSeq = 0;
  const codeBase = Date.now();
  const makeCode = () => `TC-${codeBase}-${pad(++codeSeq)}`;

  // Timestamp log dinaikkan bertahap (1 menit) agar urutan riwayat benar.
  let logSeq = 0;
  const logBase = Date.now() - 6 * 60 * 60 * 1000; // mulai 6 jam lalu

  async function getOne<T>(sql: string, params: unknown[]): Promise<T | null> {
    const rows = await q<T>(sql, params);
    return rows[0] ?? null;
  }

  // ── Resolusi fasilitas & staf (prasyarat seed) ──
  async function facId(name: string): Promise<number> {
    const f = await getOne<{ id: number }>(
      'SELECT id FROM facilities WHERE name = ? AND isActive = 1',
      [name]
    );
    if (!f) throw new Error(`Fasilitas "${name}" tidak ada / non-aktif. Jalankan "npm run db:seed" dulu.`);
    return f.id;
  }
  async function staffId(email: string, label: string): Promise<number> {
    const u = await getOne<{ id: number }>('SELECT id FROM users WHERE email = ?', [email]);
    if (!u) throw new Error(`Akun staf ${label} (${email}) tidak ada. Jalankan "npm run db:seed" dulu.`);
    return u.id;
  }

  const fac = {
    main: await facId(FAC_MAIN),
    alt: await facId(FAC_ALT),
    prep: await facId(FAC_PREP),
    prepAlt: await facId(FAC_PREP_ALT),
  };
  const actors = {
    biroIII: await staffId('biro3@kampus.test', 'Biro III'),
    wr3: await staffId('wr3@kampus.test', 'WR3'),
    admin: await staffId('biro1@kampus.test', 'Admin Unit BIRO_I'),
  };

  // ── Pastikan akun uji ada (buat bila belum) ──
  let acc = await getOne<{
    id: number; name: string; email: string; phone: string | null;
    org: string | null; idnum: string | null;
  }>(
    'SELECT id, name, email, phone, organizationName AS org, identityNumber AS idnum FROM users WHERE email = ?',
    [TESTCASE_EMAIL]
  );
  if (!acc) {
    await exec(
      `INSERT INTO users (name, email, password, role, isActive, organizationName, phone, identityNumber)
       VALUES (?,?,?,'PENGURUS',1,?,?,?)`,
      [PREPARED_NAME, TESTCASE_EMAIL, passwordHash, PREPARED_ORG, PREPARED_PHONE, PREPARED_IDNUM]
    );
    acc = await getOne(
      'SELECT id, name, email, phone, organizationName AS org, identityNumber AS idnum FROM users WHERE email = ?',
      [TESTCASE_EMAIL]
    );
  } else {
    // Sinkronkan password & status aktif setiap reset.
    await exec('UPDATE users SET password = ?, isActive = 1 WHERE id = ?', [passwordHash, acc.id]);
  }
  const userId = acc!.id;
  const owner = {
    org: acc!.org || PREPARED_ORG,
    pic: acc!.name || PREPARED_NAME,
    idnum: acc!.idnum,
    email: acc!.email,
    phone: acc!.phone || PREPARED_PHONE,
  };

  // ── Hapus data lama akun uji (idempoten) ──
  // approval_logs ikut terhapus otomatis (ON DELETE CASCADE).
  await exec(
    'DELETE FROM facility_bookings WHERE requestId IN (SELECT id FROM facility_requests WHERE userId = ?)',
    [userId]
  );
  await exec('DELETE FROM notifications WHERE userId = ?', [userId]);
  await exec('DELETE FROM facility_requests WHERE userId = ?', [userId]);

  // ── Builder ──
  type ReqInput = {
    facilityId: number;
    activityName: string;
    purpose: string;
    description: string;
    participants: number;
    start: Date;
    end: Date;
    status: string;
    currentStep: string | null;
    approvedAt?: Date | null;
    proposedFacilityId?: number | null;
    proposedStart?: Date | null;
    proposedEnd?: Date | null;
    overrideReason?: string | null;
  };

  async function insertRequest(r: ReqInput): Promise<number> {
    const code = makeCode();
    const submittedAt = new Date(r.start);
    submittedAt.setDate(submittedAt.getDate() - 7);
    await exec(
      `INSERT INTO facility_requests (
         requestCode, userId, facilityId, activityName, organizationName, personInCharge,
         identityNumber, email, phone, startDateTime, endDateTime, participantCount,
         purpose, description, activityScope, activityLevel, status, currentStep,
         submittedAt, approvedAt, proposedFacilityId, proposedStartDateTime,
         proposedEndDateTime, overrideReason
       ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        code, userId, r.facilityId, r.activityName, owner.org, owner.pic,
        owner.idnum, owner.email, owner.phone, toMysql(r.start), toMysql(r.end), r.participants,
        r.purpose, r.description, 'UNIVERSITAS', 'KEMAHASISWAAN', r.status, r.currentStep,
        toMysql(submittedAt), r.approvedAt ? toMysql(r.approvedAt) : null,
        r.proposedFacilityId ?? null,
        r.proposedStart ? toMysql(r.proposedStart) : null,
        r.proposedEnd ? toMysql(r.proposedEnd) : null,
        r.overrideReason ?? null,
      ]
    );
    const row = await getOne<{ id: number }>(
      'SELECT id FROM facility_requests WHERE requestCode = ?',
      [code]
    );
    return row!.id;
  }

  async function addLog(
    requestId: number, actorId: number | null, action: string,
    fromStatus: string, toStatus: string, note: string | null
  ) {
    const ts = new Date(logBase + ++logSeq * 60000);
    await exec(
      `INSERT INTO approval_logs (requestId, actorId, action, fromStatus, toStatus, note, createdAt)
       VALUES (?,?,?,?,?,?,?)`,
      [requestId, actorId, action, fromStatus, toStatus, note, toMysql(ts)]
    );
  }

  async function addBooking(requestId: number, facilityId: number, start: Date, end: Date) {
    await exec(
      `INSERT INTO facility_bookings (requestId, facilityId, startDateTime, endDateTime, status)
       VALUES (?,?,?,?,'ACTIVE')`,
      [requestId, facilityId, toMysql(start), toMysql(end)]
    );
  }

  async function addNotif(title: string, message: string, requestId: number) {
    await exec(
      `INSERT INTO notifications (userId, title, message, link, isRead)
       VALUES (?,?,?,?,0)`,
      [userId, title, message, `/dashboard/pengurus/requests/${requestId}`]
    );
  }

  // Rantai: SUBMIT -> Biro III -> WR3/WD3.
  async function chainToAdmin(requestId: number) {
    await addLog(requestId, userId, 'SUBMIT', 'DRAFT', 'WAITING_BIRO_III', null);
    await addLog(requestId, actors.biroIII, 'APPROVE_BIRO_III', 'WAITING_BIRO_III', 'WAITING_WR3_WD3', 'Berkas lengkap — diteruskan ke WR3/WD3.');
    await addLog(requestId, actors.wr3, 'APPROVE_WR3_WD3', 'WAITING_WR3_WD3', 'WAITING_ADMIN_UNIT', 'Disetujui — diteruskan ke Admin Unit.');
  }

  // ── TC1 — Revisi Diminta ──
  {
    const { start, end } = slot(10, 9, 3);
    const id = await insertRequest({
      facilityId: fac.main, activityName: 'Seminar Kepemimpinan Mahasiswa',
      purpose: 'Seminar', description: 'Seminar kepemimpinan untuk pengurus organisasi.',
      participants: 35, start, end, status: 'REVISION_REQUESTED', currentStep: 'PENGURUS_REVISION',
    });
    await chainToAdmin(id);
    await addLog(id, actors.admin, 'REQUEST_REVISION', 'WAITING_ADMIN_UNIT', 'REVISION_REQUESTED',
      'Mohon lengkapi rincian kebutuhan tambahan dan perbaiki jumlah peserta final.');
    await addNotif('Revisi Diminta',
      'Admin Unit meminta revisi pada pengajuan "Seminar Kepemimpinan Mahasiswa". Silakan perbaiki lalu kirim ulang.', id);
  }

  // ── TC2 — Tawaran fasilitas/jadwal alternatif ──
  {
    const { start, end } = slot(12, 13, 3);
    const prop = slot(13, 9, 3);
    const id = await insertRequest({
      facilityId: fac.main, activityName: 'Workshop Desain Poster',
      purpose: 'Workshop', description: 'Workshop desain poster digital untuk anggota organisasi.',
      participants: 30, start, end, status: 'OVERRIDE_OFFERED', currentStep: 'PENGURUS_OVERRIDE',
      approvedAt: new Date(start.getTime() - 2 * 86400000),
      proposedFacilityId: fac.alt, proposedStart: prop.start, proposedEnd: prop.end,
      overrideReason: 'Ruang semula dipakai agenda rektorat — ditawarkan ruang & jam pengganti.',
    });
    await chainToAdmin(id);
    await addLog(id, actors.admin, 'APPROVE_ADMIN', 'WAITING_ADMIN_UNIT', 'APPROVED', 'Disetujui.');
    await addLog(id, actors.admin, 'ADMIN_OVERRIDE', 'APPROVED', 'OVERRIDE_OFFERED',
      'Ruang semula dipakai agenda rektorat — ditawarkan ruang & jam pengganti.');
    await addBooking(id, fac.main, start, end);
    await addNotif('Tawaran Fasilitas/Jadwal Alternatif',
      'Admin Unit menawarkan fasilitas & jadwal pengganti untuk "Workshop Desain Poster". Buka untuk menerima tawaran.', id);
  }

  // ── TC3 — Pengajuan sedang berjalan (progres + riwayat) ──
  {
    const { start, end } = slot(14, 9, 2);
    const id = await insertRequest({
      facilityId: fac.main, activityName: 'Rapat Koordinasi Program Kerja',
      purpose: 'Rapat', description: 'Rapat koordinasi program kerja semester pengurus organisasi.',
      participants: 20, start, end, status: 'WAITING_ADMIN_UNIT', currentStep: 'ADMIN_UNIT',
    });
    await chainToAdmin(id);
    await addNotif('Pengajuan Diproses',
      'Pengajuan "Rapat Koordinasi Program Kerja" sudah disetujui Biro III & WR3, kini menunggu Admin Unit.', id);
  }

  // ── TC4 — Disetujui (buka & cetak surat) ──
  {
    const { start, end } = slot(16, 13, 2);
    const id = await insertRequest({
      facilityId: fac.main, activityName: 'Pelatihan Public Speaking',
      purpose: 'Pelatihan', description: 'Pelatihan public speaking untuk anggota baru organisasi.',
      participants: 28, start, end, status: 'APPROVED', currentStep: 'COMPLETED',
      approvedAt: new Date(start.getTime() - 2 * 86400000),
    });
    await chainToAdmin(id);
    await addLog(id, actors.admin, 'APPROVE_ADMIN', 'WAITING_ADMIN_UNIT', 'APPROVED',
      'Disetujui — ambil kunci 30 menit sebelum acara.');
    await addBooking(id, fac.main, start, end);
    await addNotif('Pengajuan Disetujui',
      'Pengajuan "Pelatihan Public Speaking" telah DISETUJUI. Surat peminjaman digital sudah dapat dibuka & dicetak.', id);
  }

  // ── TC5 — Masih berjalan -> dibatalkan tester ──
  {
    const { start, end } = slot(18, 9, 3);
    const id = await insertRequest({
      facilityId: fac.prep, activityName: 'Latihan Persiapan Lomba',
      purpose: 'Latihan', description: 'Latihan rutin persiapan lomba antar organisasi.',
      participants: 18, start, end, status: 'WAITING_BIRO_III', currentStep: 'BIRO_III',
    });
    await addLog(id, userId, 'SUBMIT', 'DRAFT', 'WAITING_BIRO_III', null);
    await addNotif('Pengajuan Terkirim',
      'Pengajuan "Latihan Persiapan Lomba" terkirim & menunggu validasi Biro III. Dapat dibatalkan selama masih berjalan.', id);
  }

  // ── TC6 — Notifikasi override -> terima jadwal baru / batalkan ──
  {
    const { start, end } = slot(20, 13, 3);
    const prop = slot(21, 9, 3);
    const id = await insertRequest({
      facilityId: fac.prep, activityName: 'Gladi Bersih Pentas Seni',
      purpose: 'Gladi bersih', description: 'Gladi bersih pentas seni tahunan organisasi.',
      participants: 40, start, end, status: 'OVERRIDE_OFFERED', currentStep: 'PENGURUS_OVERRIDE',
      approvedAt: new Date(start.getTime() - 2 * 86400000),
      proposedFacilityId: fac.prepAlt, proposedStart: prop.start, proposedEnd: prop.end,
      overrideReason: 'Terjadi bentrok jadwal mendadak — Admin Unit menawarkan pemindahan ruang & waktu.',
    });
    await chainToAdmin(id);
    await addLog(id, actors.admin, 'APPROVE_ADMIN', 'WAITING_ADMIN_UNIT', 'APPROVED', 'Disetujui.');
    await addLog(id, actors.admin, 'ADMIN_OVERRIDE', 'APPROVED', 'OVERRIDE_OFFERED',
      'Terjadi bentrok jadwal mendadak — Admin Unit menawarkan pemindahan ruang & waktu.');
    await addBooking(id, fac.prep, start, end);
    await addNotif('Pemberitahuan Override Jadwal',
      'Admin Unit menawarkan pemindahan jadwal untuk "Gladi Bersih Pentas Seni". Buka untuk menerima jadwal baru atau membatalkan.', id);
  }

  return { userId, requestCount: 6 };
}
