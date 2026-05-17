import { verifySession } from '@/lib/auth';
import { query } from '@/lib/db';
import { PageHeader } from '@/components/ui/Card';
import type { Facility } from '@/types';

const CAT_TONE: Record<string, string> = {
  Aula: 'bg-violet-50 text-violet-700 ring-violet-200',
  Ruangan: 'bg-blue-50 text-blue-700 ring-blue-200',
  Laboratorium: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Outdoor: 'bg-amber-50 text-amber-700 ring-amber-200',
};

export default async function FacilitiesPage() {
  await verifySession();
  const facilities = await query<Facility>('SELECT * FROM facilities WHERE isActive = 1 ORDER BY name');
  return (
    <div className="space-y-6">
      <PageHeader title="Daftar Fasilitas" subtitle={`${facilities.length} fasilitas aktif tersedia.`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {facilities.map((f) => (
          <div key={f.id} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21V11M15 21V11" />
                </svg>
              </div>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${CAT_TONE[f.category] ?? 'bg-slate-50 text-slate-700 ring-slate-200'}`}>
                {f.category}
              </span>
            </div>
            <h3 className="mt-3 text-base font-semibold text-slate-900">{f.name}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{f.location ?? '-'}</p>
            <div className="mt-3 flex items-center gap-1.5 text-sm text-slate-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                <circle cx="9" cy="7" r="4" />
              </svg>
              Kapasitas: <span className="font-medium">{f.capacity ?? '-'}</span>
            </div>
            {f.description && <p className="mt-3 text-xs leading-relaxed text-slate-500">{f.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
