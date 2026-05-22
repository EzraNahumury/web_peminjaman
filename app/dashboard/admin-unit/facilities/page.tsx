import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireRole, getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { PageHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AdminFacilitiesList } from '@/components/dashboard/AdminFacilitiesList';
import { deleteFacility, toggleFacilityActive } from '@/app/actions/facilities';
import { MANAGING_UNIT_LABEL, type Facility, type ManagingUnit } from '@/types';

export default async function AdminFacilitiesPage() {
  await requireRole('ADMIN_UNIT');
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const bureau = (user.bureauScope ?? null) as ManagingUnit | null;

  const facilities = bureau
    ? await query<Facility>(
        'SELECT * FROM facilities WHERE managingUnit = ? ORDER BY id DESC',
        [bureau]
      )
    : await query<Facility>('SELECT * FROM facilities ORDER BY id DESC');

  const activeCount = facilities.filter((f) => f.isActive).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kelola Fasilitas"
        subtitle={
          bureau
            ? `${facilities.length} fasilitas di ${MANAGING_UNIT_LABEL[bureau]} · ${activeCount} aktif`
            : `${facilities.length} fasilitas · ${activeCount} aktif`
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

      <AdminFacilitiesList
        facilities={facilities}
        toggleFacilityActive={toggleFacilityActive}
        deleteFacility={deleteFacility}
      />
    </div>
  );
}
