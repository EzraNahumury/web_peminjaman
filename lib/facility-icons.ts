import {
  Armchair,
  BookOpen,
  Cable,
  Camera,
  CarFront,
  Clapperboard,
  Cpu,
  HardDrive,
  Landmark,
  Laptop,
  Layers,
  MemoryStick,
  Mic2,
  MonitorPlay,
  Podcast,
  Presentation,
  Projector,
  School,
  Speaker,
  Theater,
  Trophy,
  Users,
  Video,
  type LucideIcon,
} from 'lucide-react';

/** Ikon per kategori DB */
const CATEGORY_ICON: Record<string, LucideIcon> = {
  Aula: Landmark,
  Auditorium: Theater,
  Ruangan: Armchair,
  'Ruang Seminar': Users,
  'Ruang Kelas': School,
  'Ruang Tutorial': BookOpen,
  'Ruang Hybrid': MonitorPlay,
  Laboratorium: Cpu,
  Studio: Podcast,
  Lapangan: Trophy,
  Kendaraan: CarFront,
  'Sound System': Speaker,
  Proyektor: Projector,
  Multimedia: Clapperboard,
  Kamera: Camera,
  Peralatan: Presentation,
};

/** Ikon pill filter */
const FILTER_ICON: Record<string, LucideIcon> = {
  ...CATEGORY_ICON,
  'Ruang Kuliah': School,
  Kamera: Camera,
  Peralatan: Presentation,
};

/** Peralatan & perangkat — prioritas dari nama */
const EQUIPMENT_NAME_RULES: { pattern: RegExp; icon: LucideIcon }[] = [
  { pattern: /sound\s*system|speaker\s*aktif/i, icon: Speaker },
  { pattern: /proyektor|layar\s*viewer|layar/i, icon: Projector },
  { pattern: /laptop/i, icon: Laptop },
  { pattern: /streaming/i, icon: Video },
  { pattern: /kamera|camera/i, icon: Camera },
  { pattern: /stabilizer|gimbal|tripod/i, icon: Video },
  { pattern: /mikrofon|microphone|saramonic/i, icon: Mic2 },
  { pattern: /soundcard/i, icon: Speaker },
  { pattern: /hdmi|kabel/i, icon: Cable },
  { pattern: /flash\s*memory|memory\s*stick/i, icon: MemoryStick },
  { pattern: /hard\s*drive/i, icon: HardDrive },
  { pattern: /podcast/i, icon: Podcast },
];

/** Ruang & fasilitas — setelah kategori ruangan */
const SPACE_NAME_RULES: { pattern: RegExp; icon: LucideIcon }[] = [
  { pattern: /auditorium/i, icon: Theater },
  { pattern: /aula/i, icon: Landmark },
  { pattern: /lab(?:oratorium)?\s*komputer|komputer\s*lab/i, icon: Cpu },
  { pattern: /hybrid/i, icon: MonitorPlay },
  { pattern: /tutorial/i, icon: BookOpen },
  { pattern: /seminar/i, icon: Users },
  { pattern: /serbaguna/i, icon: Armchair },
  { pattern: /^ruang\s+[a-z]\.\d/i, icon: School },
  { pattern: /lapangan/i, icon: Trophy },
  { pattern: /kendaraan|mobil/i, icon: CarFront },
  { pattern: /studio/i, icon: Clapperboard },
];

export type FacilityIconSource = {
  name: string;
  category: string;
};

export function getFacilityIcon(facility: FacilityIconSource): LucideIcon {
  const name = facility.name.trim();
  const category = facility.category.trim();

  for (const { pattern, icon } of EQUIPMENT_NAME_RULES) {
    if (pattern.test(name)) return icon;
  }

  if (CATEGORY_ICON[category]) return CATEGORY_ICON[category];

  for (const { pattern, icon } of SPACE_NAME_RULES) {
    if (pattern.test(name)) return icon;
  }

  const catLower = category.toLowerCase();
  if (catLower.includes('kelas')) return School;
  if (catLower.includes('tutorial')) return BookOpen;
  if (catLower.includes('hybrid')) return MonitorPlay;
  if (catLower.includes('lab')) return Cpu;
  if (catLower.includes('studio')) return Podcast;
  if (catLower.includes('aula')) return Landmark;
  if (catLower.includes('auditorium')) return Theater;
  if (catLower.includes('seminar')) return Users;
  if (catLower.includes('ruang')) return Armchair;

  return Layers;
}

/** Ikon untuk pill filter kategori */
export function getFilterIcon(filterKey: string): LucideIcon {
  const key = filterKey.trim();
  if (FILTER_ICON[key]) return FILTER_ICON[key];
  return getCategoryIcon(key);
}

export function getCategoryIcon(category: string): LucideIcon {
  return getFilterIcon(category);
}

export { CATEGORY_ICON };
