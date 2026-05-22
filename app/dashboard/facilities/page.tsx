import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { FacilitiesCatalog } from '@/components/dashboard/FacilitiesCatalog';
import { buildFilterOptions, facilityMatchesFilter } from '@/lib/facility-filters';
import { type Facility, type ManagingUnit } from '@/types';

export default async function FacilitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; lokasi?: string; tanggal?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const sp = await searchParams;
  const kategori = sp.kategori?.trim() || '';
  const lokasi = sp.lokasi?.trim() || '';
  const tanggal = sp.tanggal?.trim() || '';

  const adminBureau = user.role === 'ADMIN_UNIT' ? (user.bureauScope as ManagingUnit | null) : null;
  const allFacilities = adminBureau
    ? await query<Facility>(
        'SELECT * FROM facilities WHERE isActive = 1 AND managingUnit = ? ORDER BY id DESC',
        [adminBureau]
      )
    : await query<Facility>('SELECT * FROM facilities WHERE isActive = 1 ORDER BY id DESC');

  const filterOptions = buildFilterOptions(allFacilities);
  const locations = Array.from(
    new Set(allFacilities.map((f) => f.location).filter((l): l is string => !!l))
  ).sort();

  const unavailableIds = new Set<number>();
  if (tanggal && /^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    const dayStart = `${tanggal} 00:00:00`;
    const dayEnd = `${tanggal} 23:59:59`;
    const [bookedRows, blockedRows] = await Promise.all([
      query<{ facilityId: number }>(
        `SELECT DISTINCT facilityId FROM facility_bookings
         WHERE status = 'ACTIVE' AND startDateTime < ? AND endDateTime > ?`,
        [dayEnd, dayStart]
      ),
      query<{ facilityId: number | null }>(
        `SELECT DISTINCT facilityId FROM facility_blocks
         WHERE startDateTime < ? AND endDateTime > ?`,
        [dayEnd, dayStart]
      ),
    ]);
    for (const r of bookedRows) unavailableIds.add(r.facilityId);
    const hasGlobalBlock = blockedRows.some((r) => r.facilityId === null);
    for (const r of blockedRows) {
      if (r.facilityId != null) unavailableIds.add(r.facilityId);
    }
    if (hasGlobalBlock) {
      for (const f of allFacilities) unavailableIds.add(f.id);
    }
  }

  const filtered = allFacilities.filter((f) => {
    if (kategori && !facilityMatchesFilter(f, kategori)) return false;
    if (lokasi && f.location !== lokasi) return false;
    return true;
  });

  const isPengurus = user.role === 'PENGURUS';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-[var(--neutral-900)]">Daftar Fasilitas</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--neutral-500)]">
            {allFacilities.length} fasilitas aktif tersedia. Gunakan pencarian real-time atau filter kategori,
            lokasi, dan tanggal.
          </p>
        </div>
      </div>

      <FacilitiesCatalog
        facilities={filtered}
        filterOptions={filterOptions}
        locations={locations}
        unavailableIds={Array.from(unavailableIds)}
        tanggal={tanggal}
        isPengurus={isPengurus}
      />
    </div>
  );
}
