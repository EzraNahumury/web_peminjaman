import { StatusBadge } from '@/components/ui/StatusBadge';
import { Timeline } from '@/components/dashboard/Timeline';
import { fmtDateTime } from '@/lib/request-code';
import type { ApprovalLog, FacilityRequest, RequestStatus } from '@/types';

type Props = {
  req: FacilityRequest & { facilityName: string; userName: string };
  logs: (ApprovalLog & { actorName: string | null })[];
  actions?: React.ReactNode;
};

export function ApproverRequestDetail({ req, logs, actions }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-xs text-gray-500">{req.requestCode}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{req.activityName}</h1>
          <p className="text-sm text-gray-500">{req.organizationName} · diajukan oleh {req.userName}</p>
        </div>
        <StatusBadge status={req.status as RequestStatus} />
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
              <Item label="Catatan Pengaju" value={req.notes ?? '-'} full />
            </dl>
          </div>
          {actions && (
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-gray-900">Aksi</h2>
              {actions}
            </div>
          )}
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
