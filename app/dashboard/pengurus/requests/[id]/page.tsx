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
  const canCancel = !['APPROVED', 'REJECTED', 'CANCELLED', 'REJECTED_BY_BIRO_III', 'REJECTED_BY_WR3_WD3'].includes(req.status);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/dashboard/pengurus/requests" className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Kembali ke daftar
            </Link>
            <p className="font-mono text-xs font-medium text-slate-500">{req.requestCode}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{req.activityName}</h1>
            <p className="mt-1 text-sm text-slate-600">{req.organizationName}</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <StatusBadge status={displayStatus} />
            <div className="flex flex-wrap justify-end gap-2">
              {req.status === 'APPROVED' && (
                <Link href={`/surat/${req.id}`} target="_blank">
                  <Button variant="success">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    Download Surat
                  </Button>
                </Link>
              )}
              {req.status === 'REVISION_REQUESTED' && (
                <Link href={`/dashboard/pengurus/requests/${req.id}/edit`}>
                  <Button>Edit & Submit Ulang</Button>
                </Link>
              )}
              {canCancel && (
                <form action={cancelRequest.bind(null, req.id)}>
                  <Button type="submit" variant="outline">
                    Batalkan
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Detail Kegiatan</h2>
          </div>
          <dl className="grid gap-5 p-6 sm:grid-cols-2">
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
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Riwayat Approval</h2>
          </div>
          <div className="p-6">
            <Timeline logs={logs} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Item({ label, value, full }: { label: string; value: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value}</dd>
    </div>
  );
}
