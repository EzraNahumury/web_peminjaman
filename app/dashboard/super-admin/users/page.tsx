import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { activateUser, deactivateUser, getUsers } from '@/app/actions/users';
import { AdminBureauForm, Wr3ScopeForm } from '@/components/dashboard/StaffUserForms';
import type { ManagingUnit } from '@/types';
import { PageHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { fmtDateTime } from '@/lib/request-code';

const ROLE_LABEL: Record<string, string> = {
  PENGURUS: 'Pengurus LK/OK',
  BIRO_III: 'Biro III',
  WR3_WD3: 'WR3 / WD3',
  ADMIN_UNIT: 'Admin Unit',
  SUPER_ADMIN: 'Super Admin',
};

export default async function SuperAdminUsersPage() {
  await requireRole('SUPER_ADMIN');
  const users = await getUsers();
  const pending = users.filter((u) => !u.isActive);
  const active = users.filter((u) => u.isActive);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manajemen User"
        subtitle={`${users.length} akun terdaftar · ${pending.length} menunggu aktivasi pengurus.`}
      />

      <section className="rounded-xl border border-amber-200 bg-amber-50/40 shadow-sm">
        <div className="border-b border-amber-200 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Menunggu Aktivasi</h2>
          <p className="mt-0.5 text-xs text-slate-600">
            Akun pengurus baru yang menunggu persetujuan. Aktifkan agar mereka bisa login.
          </p>
        </div>
        {pending.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">Tidak ada akun yang menunggu aktivasi.</div>
        ) : (
          <ul className="divide-y divide-amber-100">
            {pending.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{u.name}</p>
                  <p className="text-xs text-slate-600">{u.email}</p>
                  {u.organizationName && <p className="text-xs text-slate-500">{u.organizationName}</p>}
                  <p className="mt-1 text-[11px] text-slate-400">Daftar {fmtDateTime(u.createdAt)}</p>
                </div>
                <form action={activateUser.bind(null, u.id)}>
                  <Button type="submit" variant="success" size="sm">
                    Aktivasi Akun
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--primary-200)] bg-[var(--primary-50)]/50 px-5 py-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Akun Validator / Admin Unit</p>
          <p className="text-xs text-slate-600">
            Buat akun Biro III, WR3/WD3, atau Admin Unit untuk tiap biro pengelola fasilitas.
          </p>
        </div>
        <Link href="/dashboard/super-admin/users/new">
          <Button>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Tambah Akun
          </Button>
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Semua Akun Aktif</h2>
          <p className="mt-0.5 text-xs text-slate-500">{active.length} akun aktif.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Nama</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Scope / Unit</th>
                <th className="px-5 py-3">Organisasi</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {active.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">{u.name}</td>
                  <td className="px-5 py-3 text-slate-700">{u.email}</td>
                  <td className="px-5 py-3 text-slate-700">{ROLE_LABEL[u.role] ?? u.role}</td>
                  <td className="px-5 py-3 text-xs text-slate-600">
                    {u.role === 'WR3_WD3' ? (
                      <Wr3ScopeForm userId={u.id} initialScope={u.userScope} />
                    ) : u.role === 'ADMIN_UNIT' ? (
                      <AdminBureauForm
                        userId={u.id}
                        initialBureau={(u.bureauScope as ManagingUnit | null) ?? null}
                      />
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-600">{u.organizationName ?? '-'}</td>
                  <td className="px-5 py-3 text-right">
                    {u.role !== 'SUPER_ADMIN' && (
                      <form action={deactivateUser.bind(null, u.id)}>
                        <Button type="submit" variant="outline" size="sm">
                          Non-aktifkan
                        </Button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
