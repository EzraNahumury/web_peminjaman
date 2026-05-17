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
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-medium text-slate-500">{req.requestCode}</p>
            <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{req.activityName}</h1>
            <p className="mt-1 text-sm text-slate-600">
              <span className="font-medium">{req.organizationName}</span> · diajukan oleh{' '}
              <span className="font-medium text-slate-700">{req.userName}</span>
            </p>
          </div>
          <StatusBadge status={req.status as RequestStatus} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
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
              <Item label="Catatan Pengaju" value={req.notes ?? '-'} full />
            </dl>
          </div>
          {actions && (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="text-sm font-semibold text-slate-900">Aksi</h2>
              </div>
              <div className="p-6">{actions}</div>
            </div>
          )}
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
