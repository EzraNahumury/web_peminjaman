import 'server-only';
import bcrypt from 'bcryptjs';
import { execute, query } from '@/lib/db';
import { resetTestcaseData, TESTCASE_EMAIL, TESTCASE_PASSWORD } from '@/lib/testcase-core';

export { TESTCASE_EMAIL };

/**
 * Mengembalikan data 6 test case milik akun uji ke kondisi awal.
 * Dipanggil dari hook login — HANYA untuk akun TESTCASE_EMAIL.
 */
export async function resetTestcaseAccount() {
  const hash = await bcrypt.hash(TESTCASE_PASSWORD, 10);
  return resetTestcaseData(execute, query, hash);
}
