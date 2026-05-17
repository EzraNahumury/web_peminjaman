import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Timeline } from '@/components/dashboard/Timeline';
import { Button } from '@/components/ui/Button';
import { fmtDateTime } from '@/lib/request-code';
import { cancelRequest } from '@/app/actions/requests';
import type { ApprovalLog, FacilityRequest, RequestStatus } from '@/types';

const DISPLAY_REJECT: RequestStatus[] = ['REJECTED_BY_BIRO_III', 'REJECTED_BY_WR3_WD3'];

export default async function PengurusRequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireRole('PENGURUS');
  const req = await queryOne<FacilityRequest & { facilityName: string }>(
    `SELECT fr.*, f.name AS facilityName FROM facility_requests fr
     JOIN facilities f ON f.id = fr.facilityId
     WHERE fr.id = ? AND fr.userId = ?`,
    [Number(id), session.userId]
  );
  if (!req) notFound();
  const logs = await query<ApprovalLog & { actorName: string | null }>(
    `SELECT al.*, u.name AS actorName FROM approval_logs al
     LEFT JOIN users u ON u.id = al.actorId
     WHERE al.requestId = ? ORDER BY al.createdAt ASC`,
    [req.id]
  );

  const displayStatus: RequestStatus = DISPLAY_REJECT.includes(req.status) ? 'REJECTED' : req.status;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-gray-500">{req.requestCode}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{req.activityName}</h1>
          <p className="text-sm text-gray-500">{req.organizationName}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={displayStatus} />
          {req.status === 'REVISION_REQUESTED' && (
            <Link
              href={`/dashboard/pengurus/requests/${req.id}/edit`}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Edit & Submit Ulang
            </Link>
          )}
          {!['APPROVED', 'REJECTED', 'CANCELLED'].includes(req.status) && (
            <form action={cancelRequest.bind(null, req.id)}>
              <Button type="submit" variant="ghost">Batalkan</Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-gray-900">Detail Kegiatan</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Item label="Fasilitas" value={req.facilityName} />
              <Item label="Jumlah Peserta" value={req.participantCount ?? '-'} />
              <Item label="Mulai" value={fmtDateTime(req.startDateTime)} />
              <Item label="Selesai" value={fmtDateTime(req.endDateTime)} />
              <Item label="Penanggung Jawab" value={req.personInCharge} />
              <Item label="ID PIC" value={req.identityNumber ?? '-'} />
              <Item label="Email" value={req.email} />
              <Item label="No HP" value={req.phone} />
              <Item label="Tujuan" value={req.purpose} full />
              <Item label="Deskripsi" value={req.description} full />
              <Item label="Kebutuhan Tambahan" value={req.additionalNeeds ?? '-'} full />
              <Item label="Lampiran" value={req.attachmentUrl ?? '-'} full />
              <Item label="Catatan" value={req.notes ?? '-'} full />
            </dl>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-900">Riwayat Approval</h2>
          <Timeline logs={logs} />
        </div>
      </div>
    </div>
  );
}

function Item({ label, value, full }: { label: string; value: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <dt className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
    </div>
  );
}
