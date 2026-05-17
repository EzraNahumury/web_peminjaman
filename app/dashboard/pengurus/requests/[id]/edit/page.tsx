import { notFound, redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
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

  const facilities = await query<Facility>('SELECT * FROM facilities WHERE isActive = 1 ORDER BY name');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit & Revisi Pengajuan</h1>
        <p className="text-sm text-gray-500">Setelah submit, status kembali ke WAITING_BIRO_III.</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <RequestForm mode="edit" facilities={facilities} initial={req} />
      </div>
    </div>
  );
}
