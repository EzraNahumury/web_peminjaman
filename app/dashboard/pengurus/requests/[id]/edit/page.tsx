import { notFound, redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { RequestForm } from '@/components/forms/RequestForm';
import type { Facility, FacilityRequest } from '@/types';

export default async function EditRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireRole('PENGURUS');
  const req = await queryOne<FacilityRequest>(
    'SELECT * FROM facility_requests WHERE id = ? AND userId = ?',
    [Number(id), session.userId]
  );
  if (!req) notFound();
  if (req.status !== 'REVISION_REQUESTED') redirect(`/dashboard/pengurus/requests/${req.id}`);

  const facility = await queryOne<Facility>(
    'SELECT * FROM facilities WHERE id = ? AND isActive = 1',
    [req.facilityId]
  );
  if (!facility) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-[var(--neutral-900)]">Edit & Submit Ulang</h1>
        <p className="mt-1 text-sm text-[var(--neutral-500)]">
          Setelah submit, status kembali ke <span className="font-medium text-[var(--neutral-900)]">menunggu Biro III</span> dan chain di-reset.
        </p>
      </div>
      <RequestForm mode="edit" lockedFacility={facility} initial={req} />
    </div>
  );
}
