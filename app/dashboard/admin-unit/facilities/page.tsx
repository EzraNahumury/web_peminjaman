import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireRole, getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { PageHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { deleteFacility, toggleFacilityActive } from '@/app/actions/facilities';
import {
  MANAGING_UNIT_LABEL,
  type Facility,
  type ManagingUnit,
} from '@/types';

const UNIT_ORDER: ManagingUnit[] = ['BIRO_I', 'BIRO_IV', 'PPLK', 'KRT', 'LPAIP'];

const UNIT_GRADIENT: Record<ManagingUnit, string> = {
  BIRO_I: 'from-sky-500 to-blue-600',
  BIRO_IV: 'from-violet-500 to-purple-600',
  PPLK: 'from-emerald-500 to-teal-600',
  KRT: 'from-amber-500 to-orange-600',
  LPAIP: 'from-rose-500 to-pink-600',
};

export default async function AdminFacilitiesPage() {
  await requireRole('ADMIN_UNIT');
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const bureau = (user.bureauScope ?? null) as ManagingUnit | null;

  const facilities = bureau
    ? await query<Facility>(
        'SELECT * FROM facilities WHERE managingUnit = ? ORDER BY name',
        [bureau]
      )
    : await query<Facility>('SELECT * FROM facilities ORDER BY managingUnit, name');

  const grouped: Record<ManagingUnit, Facility[]> = {
    BIRO_I: [], BIRO_IV: [], PPLK: [], KRT: [], LPAIP: [],
  };
  for (const f of facilities) grouped[f.managingUnit].push(f);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Fasilitas"
        subtitle={
          bureau
            ? `${facilities.length} fasilitas di ${MANAGING_UNIT_LABEL[bureau]} (termasuk non-aktif).`
            : `${facilities.length} fasilitas (termasuk non-aktif).`
        }
        action={
          <Link href="/dashboard/admin-unit/facilities/new">
            <Button>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Tambah Fasilitas
            </Button>
          </Link>
        }
      />

      {UNIT_ORDER.map((unit) => {
        const items = grouped[unit];
        if (items.length === 0) return null;
        return (
          <section key={unit} className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${UNIT_GRADIENT[unit]} text-white shadow-sm`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21V11M15 21V11" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">{MANAGING_UNIT_LABEL[unit]}</h2>
                <p className="text-xs text-slate-500">{items.length} item</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3">Nama</th>
                    <th className="px-5 py-3">Kategori</th>
                    <th className="px-5 py-3">Lokasi</th>
                    <th className="px-5 py-3">Kap.</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((f) => {
                    const active = Boolean(f.isActive);
                    return (
                      <tr key={f.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-900">{f.name}</td>
                        <td className="px-5 py-3 text-slate-700">{f.category}</td>
                        <td className="px-5 py-3 text-xs text-slate-600">{f.location ?? '-'}</td>
                        <td className="px-5 py-3 text-slate-700">{f.capacity ?? '-'}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                              active
                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                : 'bg-slate-100 text-slate-600 ring-slate-200'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {active ? 'Aktif' : 'Non-Aktif'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Link href={`/dashboard/admin-unit/facilities/${f.id}/edit`}>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </Link>
                            <form action={toggleFacilityActive.bind(null, f.id)}>
                              <Button type="submit" variant="ghost" size="sm">
                                {active ? 'Non-aktifkan' : 'Aktifkan'}
                              </Button>
                            </form>
                            <form action={deleteFacility.bind(null, f.id)}>
                              <Button type="submit" variant="danger" size="sm">
                                Hapus
                              </Button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
