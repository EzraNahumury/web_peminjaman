import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { PageHeader } from '@/components/ui/Card';
import { FacilityForm } from '@/components/forms/FacilityForm';
import type { Facility } from '@/types';

export default async function EditFacilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole('ADMIN_UNIT');
  const facility = await queryOne<Facility>('SELECT * FROM facilities WHERE id = ?', [Number(id)]);
  if (!facility) notFound();
  return (
    <div className="space-y-6">
      <PageHeader title={`Edit: ${facility.name}`} subtitle="Perbarui data fasilitas." />
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <FacilityForm mode="edit" initial={facility} />
      </div>
    </div>
  );
}
