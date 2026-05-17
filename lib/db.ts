import 'server-only';
import mysql from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var __mysqlPool: mysql.Pool | undefined;
}

export const pool: mysql.Pool =
  global.__mysqlPool ??
  mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campus_facility_booking',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: false,
    timezone: 'local',
  });

if (process.env.NODE_ENV !== 'production') {
  global.__mysqlPool = pool;
}

export type SqlParam = string | number | boolean | Date | null;

export async function query<T = unknown>(sql: string, params: SqlParam[] = []): Promise<T[]> {
  const [rows] = await pool.execute<mysql.RowDataPacket[]>(sql, params);
  return rows as unknown as T[];
}

export async function queryOne<T = unknown>(sql: string, params: SqlParam[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params: SqlParam[] = []) {
  const [result] = await pool.execute<mysql.ResultSetHeader>(sql, params);
  return result;
}
