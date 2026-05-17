import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { ApproverRequestDetail } from '@/components/dashboard/ApproverRequestDetail';
import { ApprovalActions } from '@/components/dashboard/ApprovalActions';
import { approveByWR3WD3, rejectByWR3WD3 } from '@/app/actions/approvals';
import type { ApprovalLog, FacilityRequest } from '@/types';

export default async function WR3Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole('WR3_WD3');
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
  const canAct = req.status === 'WAITING_WR3_WD3';
  return (
    <ApproverRequestDetail
      req={req}
      logs={logs}
      actions={
        canAct ? (
          <ApprovalActions requestId={req.id} approve={approveByWR3WD3} reject={rejectByWR3WD3} />
        ) : (
          <p className="text-sm text-gray-500">Pengajuan sudah diproses pada tahap ini.</p>
        )
      }
    />
  );
}
