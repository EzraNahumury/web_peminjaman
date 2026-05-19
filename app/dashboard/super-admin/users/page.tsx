import { requireRole } from '@/lib/auth';
import { activateUser, deactivateUser, getUsers, updateUserScope } from '@/app/actions/users';
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
      <PageHeader title="Manajemen User" subtitle={`${users.length} akun terdaftar · ${pending.length} menunggu aktivasi.`} />

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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    Aktivasi Akun
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

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
                <th className="px-5 py-3">Scope</th>
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
                      <form action={async (formData: FormData) => {
                        'use server';
                        const v = String(formData.get('scope') ?? '');
                        if (v === 'UNIVERSITAS' || v === 'FAKULTAS') await updateUserScope(u.id, v);
                      }}>
                        <select
                          name="scope"
                          defaultValue={u.userScope ?? 'UNIVERSITAS'}
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs"
                        >
                          <option value="UNIVERSITAS">WR3 (Universitas)</option>
                          <option value="FAKULTAS">WD3 (Fakultas)</option>
                        </select>
                        <button type="submit" className="ml-1 text-xs font-medium text-blue-600 hover:text-blue-700">
                          Simpan
                        </button>
                      </form>
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
