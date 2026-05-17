import { verifySession } from '@/lib/auth';
import { query } from '@/lib/db';
import type { Facility } from '@/types';

export default async function FacilitiesPage() {
  await verifySession();
  const facilities = await query<Facility>('SELECT * FROM facilities WHERE isActive = 1 ORDER BY name');

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Daftar Fasilitas</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {facilities.map((f) => (
          <div key={f.id} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wider text-blue-600">{f.category}</p>
            <h3 className="mt-1 text-lg font-semibold text-gray-900">{f.name}</h3>
            <p className="mt-1 text-sm text-gray-500">{f.location ?? '-'}</p>
            <p className="mt-2 text-sm text-gray-700">Kapasitas: {f.capacity ?? '-'}</p>
            {f.description && <p className="mt-2 text-xs text-gray-500">{f.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
