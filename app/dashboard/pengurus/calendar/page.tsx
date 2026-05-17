import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { FacilityCalendar } from '@/components/dashboard/FacilityCalendar';
import { PageHeader } from '@/components/ui/Card';
import type { Facility, FacilityRequest } from '@/types';

export default async function PengurusCalendar() {
  await requireRole('PENGURUS');
  const facilities = await query<Facility>('SELECT * FROM facilities WHERE isActive = 1 ORDER BY name');
  const rows = await query<FacilityRequest & { facilityName: string }>(
    `SELECT fr.*, f.name AS facilityName FROM facility_requests fr
     JOIN facilities f ON f.id = fr.facilityId
     WHERE fr.status IN ('APPROVED','WAITING_BIRO_III','WAITING_WR3_WD3','WAITING_ADMIN_UNIT')
     ORDER BY fr.startDateTime ASC`
  );
  return (
    <div className="space-y-6">
      <PageHeader title="Kalender Fasilitas" subtitle="Jadwal fasilitas yang sudah dibooking atau sedang diproses." />
      <FacilityCalendar facilities={facilities} rows={rows} />
    </div>
  );
}
