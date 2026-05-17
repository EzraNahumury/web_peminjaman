import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

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

  await conn.query(
    `INSERT INTO facilities (name, category, location, capacity, description) VALUES
     ('Aula Kampus','Aula','Gedung Utama Lt.1',300,'Aula utama untuk acara besar'),
     ('Ruang Seminar','Ruangan','Gedung A Lt.2',100,'Ruang seminar dengan AC dan proyektor'),
     ('Laboratorium Komputer','Laboratorium','Gedung B Lt.3',40,'Lab dengan 40 PC'),
     ('Lapangan','Outdoor','Area Belakang Kampus',500,'Lapangan terbuka untuk kegiatan outdoor'),
     ('Ruang Rapat','Ruangan','Gedung Rektorat Lt.2',30,'Ruang rapat eksekutif'),
     ('Auditorium','Aula','Gedung Utama Lt.3',500,'Auditorium besar berkapasitas 500');`
  );

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

  console.log('Seed selesai. Login dengan password: password123');
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
