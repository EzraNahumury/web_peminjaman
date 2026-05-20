import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';

async function main() {
  const [, , emailArg, passwordArg] = process.argv;

  if (!emailArg || !passwordArg) {
    console.error('Usage: tsx scripts/reset-password.ts <email> <newPassword>');
    console.error('       tsx scripts/reset-password.ts --all <newPassword>   (reset SEMUA user)');
    process.exit(1);
  }

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campus_facility_booking',
  });

  const hash = await bcrypt.hash(passwordArg, 10);

  if (emailArg === '--all') {
    const [result] = await conn.execute('UPDATE users SET password = ?', [hash]);
    const affected = (result as { affectedRows: number }).affectedRows;
    console.log(`Password ${affected} user di-reset ke: ${passwordArg}`);
  } else {
    const [rows] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT id, email FROM users WHERE email = ?',
      [emailArg]
    );
    if (rows.length === 0) {
      console.error(`Akun "${emailArg}" tidak ditemukan.`);
      await conn.end();
      process.exit(1);
    }
    await conn.execute('UPDATE users SET password = ? WHERE email = ?', [hash, emailArg]);
    console.log(`Password "${emailArg}" di-reset ke: ${passwordArg}`);
  }

  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
