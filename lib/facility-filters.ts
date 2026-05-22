import type { Facility } from '@/types';

/** Pill filter — ringkas, tidak terlalu banyak */
export const FILTER_DISPLAY_ORDER: string[] = [
  'Ruang Kuliah',
  'Ruang Seminar',
  'Ruangan',
  'Auditorium',
  'Laboratorium',
  'Studio',
  'Kamera',
  'Peralatan',
  'Kendaraan',
];

const RUANG_KULIAH_CATEGORIES = new Set(['Ruang Kelas', 'Ruang Tutorial', 'Ruang Hybrid']);

export type FacilityFilterSource = Pick<Facility, 'name' | 'category'>;

/**
 * Kunci filter untuk pill & `?kategori=`.
 * Hanya memecah: ruang kuliah (gabungan), kamera, sisanya ikut kategori DB / Peralatan.
 */
export function resolveFacilityFilterKey(facility: FacilityFilterSource): string {
  const name = facility.name.trim();
  const category = facility.category.trim();

  if (RUANG_KULIAH_CATEGORIES.has(category)) return 'Ruang Kuliah';
  if (category === 'Ruang Seminar') return 'Ruang Seminar';

  if (category === 'Peralatan' || category === 'Multimedia' || category === 'Kamera') {
    if (/kamera|camera|stabilizer|gimbal|tripod/i.test(name)) return 'Kamera';
    return 'Peralatan';
  }

  if (category === 'Sound System' || category === 'Proyektor') return 'Peralatan';

  return category;
}

export function facilityMatchesFilter(facility: FacilityFilterSource, filterKey: string): boolean {
  if (!filterKey) return true;
  return resolveFacilityFilterKey(facility) === filterKey;
}

export function buildFilterOptions(facilities: FacilityFilterSource[]): string[] {
  const keys = new Set(facilities.map(resolveFacilityFilterKey));
  const ordered = FILTER_DISPLAY_ORDER.filter((k) => keys.has(k));
  const rest = [...keys]
    .filter((k) => !FILTER_DISPLAY_ORDER.includes(k))
    .sort((a, b) => a.localeCompare(b, 'id'));
  return [...ordered, ...rest];
}
