import { verifySession } from '@/lib/auth';
import { query } from '@/lib/db';
import { PageHeader } from '@/components/ui/Card';
import { MANAGING_UNIT_DESC, MANAGING_UNIT_LABEL, type Facility, type ManagingUnit } from '@/types';

const CAT_TONE: Record<string, string> = {
  Auditorium: 'bg-violet-50 text-violet-700 ring-violet-200',
  Aula: 'bg-violet-50 text-violet-700 ring-violet-200',
  Ruangan: 'bg-blue-50 text-blue-700 ring-blue-200',
  'Ruang Kelas': 'bg-sky-50 text-sky-700 ring-sky-200',
  'Ruang Tutorial': 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  Laboratorium: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Studio: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200',
  Peralatan: 'bg-amber-50 text-amber-700 ring-amber-200',
  Kendaraan: 'bg-rose-50 text-rose-700 ring-rose-200',
};

const UNIT_GRADIENT: Record<ManagingUnit, string> = {
  BIRO_I: 'from-sky-500 to-blue-600',
  BIRO_IV: 'from-violet-500 to-purple-600',
  PPLK: 'from-emerald-500 to-teal-600',
  KRT: 'from-amber-500 to-orange-600',
  LPAIP: 'from-rose-500 to-pink-600',
};

const UNIT_ORDER: ManagingUnit[] = ['BIRO_I', 'BIRO_IV', 'PPLK', 'KRT', 'LPAIP'];

export default async function FacilitiesPage() {
  await verifySession();
  const facilities = await query<Facility>('SELECT * FROM facilities WHERE isActive = 1 ORDER BY managingUnit, name');

  const grouped: Record<ManagingUnit, Facility[]> = {
    BIRO_I: [], BIRO_IV: [], PPLK: [], KRT: [], LPAIP: [],
  };
  for (const f of facilities) grouped[f.managingUnit].push(f);

  return (
    <div className="space-y-8">
      <PageHeader title="Daftar Fasilitas" subtitle={`${facilities.length} fasilitas aktif, dikelola oleh 5 unit.`} />

      {UNIT_ORDER.map((unit) => {
        const items = grouped[unit];
        if (items.length === 0) return null;
        return (
          <section key={unit} className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${UNIT_GRADIENT[unit]} text-white shadow-sm`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21V11M15 21V11" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{MANAGING_UNIT_LABEL[unit]}</h2>
                  <p className="text-xs text-slate-500">{MANAGING_UNIT_DESC[unit]} · {items.length} item</p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((f) => (
                <div key={f.id} className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{f.name}</h3>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${CAT_TONE[f.category] ?? 'bg-slate-50 text-slate-700 ring-slate-200'}`}>
                      {f.category}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{f.location ?? '-'}</p>
                  {f.capacity != null && (
                    <div className="mt-2 inline-flex items-center gap-1 text-xs text-slate-700">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                      Kap. <span className="font-medium">{f.capacity}</span>
                    </div>
                  )}
                  {f.description && <p className="mt-2 text-xs leading-relaxed text-slate-500">{f.description}</p>}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
