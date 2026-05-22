/**
 * Test script: simulasi Admin Override pada pengajuan yang sudah APPROVED.
 *
 * Cara pakai:
 *   node scripts/test-override-action.js <requestId> <proposedFacilityId>
 *
 * Contoh:
 *   node scripts/test-override-action.js 5 10
 *
 * Script ini langsung query database untuk memvalidasi alur override:
 *   1. Cek request yang sudah APPROVED
 *   2. Cek apakah fasilitas pengganti tersedia
 *   3. Tampilkan data yang akan dikirim ke adminOverrideApproved()
 */
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const [, , requestIdArg, proposedFacilityIdArg] = process.argv;

  if (!requestIdArg) {
    console.error('Usage: node scripts/test-override-action.js <requestId> [proposedFacilityId]');
    console.error('  requestId           — ID pengajuan yang sudah APPROVED');
    console.error('  proposedFacilityId  — (opsional) ID fasilitas pengganti');
    process.exit(1);
  }

  const requestId = Number(requestIdArg);
  const proposedFacilityId = proposedFacilityIdArg ? Number(proposedFacilityIdArg) : null;

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campus_facility_booking',
  });

  try {
    // 1. Ambil data request
    const [requests] = await connection.query(
      `SELECT fr.*, f.name AS facilityName, f.managingUnit
       FROM facility_requests fr
       JOIN facilities f ON f.id = fr.facilityId
       WHERE fr.id = ?`,
      [requestId]
    );

    if (requests.length === 0) {
      console.error(`❌ Request #${requestId} tidak ditemukan.`);
      process.exit(1);
    }

    const req = requests[0];
    console.log('\n📋 Data Pengajuan:');
    console.log('  ID         :', req.id);
    console.log('  Kode       :', req.requestCode);
    console.log('  Kegiatan   :', req.activityName);
    console.log('  Organisasi :', req.organizationName);
    console.log('  Fasilitas  :', req.facilityName, `(ID: ${req.facilityId})`);
    console.log('  Jadwal     :', req.startDateTime, '—', req.endDateTime);
    console.log('  Status     :', req.status);
    console.log('  Level      :', req.activityLevel);

    if (req.status !== 'APPROVED') {
      console.warn(`\n⚠️  Status adalah "${req.status}" — override hanya berlaku untuk APPROVED.`);
    }

    // 2. Cek booking aktif
    const [bookings] = await connection.query(
      `SELECT * FROM facility_bookings WHERE requestId = ? AND status = 'ACTIVE'`,
      [requestId]
    );
    console.log(`\n📅 Booking aktif: ${bookings.length}`);
    for (const b of bookings) {
      console.log(`  Booking #${b.id}: ${b.startDateTime} — ${b.endDateTime} (${b.status})`);
    }

    // 3. Jika ada fasilitas pengganti, cek ketersediaannya
    if (proposedFacilityId) {
      const [facilities] = await connection.query(
        'SELECT id, name, capacity, managingUnit FROM facilities WHERE id = ? AND isActive = 1',
        [proposedFacilityId]
      );

      if (facilities.length === 0) {
        console.error(`\n❌ Fasilitas pengganti #${proposedFacilityId} tidak ditemukan atau non-aktif.`);
      } else {
        const altFac = facilities[0];
        console.log('\n🔄 Fasilitas Pengganti:');
        console.log('  ID       :', altFac.id);
        console.log('  Nama     :', altFac.name);
        console.log('  Kapasitas:', altFac.capacity ?? '-');
        console.log('  Unit     :', altFac.managingUnit);

        // Cek overlap di fasilitas pengganti
        const [overlaps] = await connection.query(
          `SELECT id, activityName, startDateTime, endDateTime, status
           FROM facility_requests
           WHERE facilityId = ?
             AND status IN ('APPROVED','SUBMITTED','WAITING_BIRO_III','WAITING_WR3_WD3','WAITING_ADMIN_UNIT','REVISION_REQUESTED','ON_HOLD')
             AND startDateTime < ?
             AND endDateTime > ?
             AND id <> ?`,
          [proposedFacilityId, req.endDateTime, req.startDateTime, requestId]
        );

        if (overlaps.length > 0) {
          console.warn(`\n⚠️  Ada ${overlaps.length} bentrok di fasilitas pengganti:`);
          for (const o of overlaps) {
            console.warn(`  - #${o.id} "${o.activityName}" (${o.status}): ${o.startDateTime} — ${o.endDateTime}`);
          }
        } else {
          console.log('\n✅ Tidak ada bentrok — fasilitas pengganti tersedia pada jadwal yang sama.');
        }

        // Cek blokir admin
        const [blocks] = await connection.query(
          `SELECT id, reason, startDateTime, endDateTime
           FROM facility_blocks
           WHERE (facilityId = ? OR facilityId IS NULL)
             AND startDateTime < ?
             AND endDateTime > ?`,
          [proposedFacilityId, req.endDateTime, req.startDateTime]
        );

        if (blocks.length > 0) {
          console.warn(`\n⚠️  Fasilitas pengganti diblokir:`);
          for (const b of blocks) {
            console.warn(`  - Block #${b.id}: "${b.reason}" (${b.startDateTime} — ${b.endDateTime})`);
          }
        }
      }
    }

    // 4. Approval logs
    const [logs] = await connection.query(
      `SELECT al.*, u.name AS actorName
       FROM approval_logs al
       LEFT JOIN users u ON u.id = al.actorId
       WHERE al.requestId = ?
       ORDER BY al.createdAt ASC`,
      [requestId]
    );
    console.log(`\n📜 Riwayat Approval (${logs.length} entries):`);
    for (const l of logs) {
      const actor = l.actorName || 'sistem';
      console.log(`  [${l.createdAt}] ${l.action} oleh ${actor}: ${l.fromStatus} → ${l.toStatus}${l.note ? ` — "${l.note}"` : ''}`);
    }

    // 5. Ringkasan payload override
    if (req.status === 'APPROVED' && proposedFacilityId) {
      console.log('\n─────────────────────────────────────');
      console.log('📦 Payload untuk adminOverrideApproved():');
      console.log(JSON.stringify({
        requestId,
        params: {
          proposedFacilityId,
          proposedStart: new Date(req.startDateTime).toISOString(),
          proposedEnd: new Date(req.endDateTime).toISOString(),
          reason: '(isi alasan urgensi di sini)',
        },
      }, null, 2));
    }

    console.log('\n✅ Selesai.\n');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

run();
