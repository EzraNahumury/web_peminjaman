import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { ApproverRequestDetail } from '@/components/dashboard/ApproverRequestDetail';
import { AdminUnitActions } from '@/components/dashboard/AdminUnitActions';
import { AdminOverrideButton } from '@/components/dashboard/AdminOverrideButton';
import { getAlternatives } from '@/lib/availability';
import type { ApprovalLog, Facility, FacilityRequest } from '@/types';

export default async function AdminUnitDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole('ADMIN_UNIT');
  const req = await queryOne<FacilityRequest & { facilityName: string; userName: string }>(
    `SELECT fr.*, f.name AS facilityName, u.name AS userName
     FROM facility_requests fr
     JOIN facilities f ON f.id = fr.facilityId
     JOIN users u ON u.id = fr.userId
     WHERE fr.id = ?`,
    [Number(id)]
  );
  if (!req) notFound();
  const logs = await query<ApprovalLog & { actorName: string | null }>(
    `SELECT al.*, u.name AS actorName FROM approval_logs al
     LEFT JOIN users u ON u.id = al.actorId
     WHERE al.requestId = ? ORDER BY al.createdAt ASC`,
    [req.id]
  );

  const actionable = req.status === 'WAITING_ADMIN_UNIT' || req.status === 'ON_HOLD';
  const isApproved = req.status === 'APPROVED';
  const alternatives = actionable
    ? await getAlternatives(req.facilityId, new Date(req.startDateTime), new Date(req.endDateTime))
    : [];
  const allFacilities = isApproved
    ? await query<Facility>('SELECT * FROM facilities WHERE isActive = 1 ORDER BY managingUnit, name')
    : [];

  return (
    <ApproverRequestDetail
      req={req}
      logs={logs}
      actions={
        actionable ? (
          <AdminUnitActions
            requestId={req.id}
            status={req.status as 'WAITING_ADMIN_UNIT' | 'ON_HOLD'}
            facilityOptions={alternatives.map((f) => ({ id: f.id, name: f.name }))}
          />
        ) : isApproved ? (
          <div className="space-y-3">
            <p className="text-sm text-[var(--neutral-600)]">
              Pengajuan sudah disetujui. Gunakan tombol di bawah hanya untuk keadaan mendesak —
              pengaju akan diminta menerima atau menolak penggantian.
            </p>
            <AdminOverrideButton requestId={req.id} facilities={allFacilities} />
          </div>
        ) : req.status === 'OVERRIDE_OFFERED' ? (
          <p className="text-sm text-[var(--neutral-600)]">
            Menunggu respons pengaju atas tawaran perpindahan.
          </p>
        ) : (
          <p className="text-sm text-gray-500">Pengajuan sudah diproses pada tahap ini.</p>
        )
      }
    />
  );
}
