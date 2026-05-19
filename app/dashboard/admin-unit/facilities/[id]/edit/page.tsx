import { notFound, redirect } from 'next/navigation';
import { requireRole, getCurrentUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { PageHeader } from '@/components/ui/Card';
import { FacilityForm } from '@/components/forms/FacilityForm';
import type { Facility, ManagingUnit } from '@/types';

export default async function EditFacilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole('ADMIN_UNIT');
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const bureau = (user.bureauScope ?? null) as ManagingUnit | null;
  const facility = await queryOne<Facility>('SELECT * FROM facilities WHERE id = ?', [Number(id)]);
  if (!facility) notFound();
  if (bureau && facility.managingUnit !== bureau) {
    redirect('/dashboard/admin-unit/facilities');
  }
  return (
    <div className="space-y-6">
      <PageHeader title={`Edit: ${facility.name}`} subtitle="Perbarui data fasilitas." />
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <FacilityForm mode="edit" initial={facility} lockUnit={bureau ?? undefined} />
      </div>
    </div>
  );
}
