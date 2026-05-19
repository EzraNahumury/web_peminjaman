import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Pencil,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users as UsersIcon,
  User as UserIcon,
  Mail,
  Phone,
  FileText,
  Tag,
  AlertCircle,
  CheckCircle2,
  Info,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { requireRole } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Timeline } from '@/components/dashboard/Timeline';
import { Button } from '@/components/ui/Button';
import { CancelButton } from '@/components/dashboard/CancelButton';
import { formatWIBDate, formatWIBTime } from '@/utils/date';
import { ACTIVITY_SCOPE_LABEL } from '@/types';
import type { ApprovalLog, FacilityRequest, RequestStatus } from '@/types';

const DISPLAY_REJECT: RequestStatus[] = ['REJECTED_BY_BIRO_III', 'REJECTED_BY_WR3_WD3'];

function bannerFor(status: RequestStatus, latestNote: string | null, latestAction: string | null) {
  if (status === 'APPROVED') {
    return {
      tone: 'success' as const,
      icon: <CheckCircle2 size={16} />,
      title: 'Pengajuan disetujui',
      body: 'Silakan unduh surat persetujuan dan ambil kunci/perlengkapan sesuai instruksi pengelola fasilitas.',
    };
  }
  if (status === 'REVISION_REQUESTED') {
    const isAlt = latestAction === 'OFFER_ALTERNATIVE';
    return {
      tone: 'info' as const,
      icon: <Info size={16} />,
      title: isAlt ? 'Admin menawarkan alternatif' : 'Admin meminta revisi',
      body: latestNote || 'Tidak ada catatan tambahan dari admin.',
    };
  }
  if (status === 'ON_HOLD') {
    return {
      tone: 'warning' as const,
      icon: <AlertTriangle size={16} />,
      title: 'Pengajuan ditahan sementara',
      body: latestNote || 'Slot tetap dipesan, admin akan melanjutkan proses setelah peninjauan.',
    };
  }
  if (status === 'REJECTED' || DISPLAY_REJECT.includes(status)) {
    return {
      tone: 'danger' as const,
      icon: <XCircle size={16} />,
      title: 'Pengajuan ditolak',
      body: latestNote || 'Tidak ada alasan dituliskan oleh validator.',
    };
  }
  if (status === 'CANCELLED') {
    return {
      tone: 'neutral' as const,
      icon: <AlertCircle size={16} />,
      title: 'Pengajuan dibatalkan',
      body: latestNote || 'Pengajuan ini telah dibatalkan.',
    };
  }
  return null;
}

export default async function PengurusRequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireRole('PENGURUS');
  const req = await queryOne<FacilityRequest & { facilityName: string; facilityLocation: string | null }>(
    `SELECT fr.*, f.name AS facilityName, f.location AS facilityLocation
     FROM facility_requests fr
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

  const latestRelevant = [...logs]
    .reverse()
    .find((l) =>
      ['OFFER_ALTERNATIVE', 'REQUEST_REVISION', 'HOLD', 'REJECT_BIRO_III', 'REJECT_WR3_WD3', 'REJECT_ADMIN'].includes(l.action)
    );
  const displayStatus: RequestStatus = DISPLAY_REJECT.includes(req.status) ? 'REJECTED' : req.status;
  const banner = bannerFor(req.status, latestRelevant?.note ?? null, latestRelevant?.action ?? null);
  const canCancel = !['REJECTED', 'CANCELLED', 'REJECTED_BY_BIRO_III', 'REJECTED_BY_WR3_WD3'].includes(req.status);

  const duration = (() => {
    const ms = new Date(req.endDateTime).getTime() - new Date(req.startDateTime).getTime();
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h} jam${m ? ` ${m} mnt` : ''}` : `${m} mnt`;
  })();

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/pengurus/requests"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--neutral-500)] hover:text-[var(--neutral-800)]"
      >
        <ArrowLeft size={13} />
        Kembali ke status peminjaman
      </Link>

      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-[var(--radius-lg)] p-6 text-white shadow-[var(--shadow-md)] sm:p-7"
        style={{ background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-700) 100%)' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 95% 5%, rgba(255,255,255,0.6) 0%, transparent 45%)',
          }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="font-[var(--font-mono)] text-[11px] font-medium uppercase tracking-[0.12em] text-white/60">
              {req.requestCode}
            </p>
            <h1 className="mt-1.5 text-[22px] font-bold leading-tight tracking-tight sm:text-[24px]">
              {req.activityName}
            </h1>
            <p className="mt-1 text-[13px] text-white/70">
              {req.organizationName} · {ACTIVITY_SCOPE_LABEL[req.activityScope]}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="rounded-[var(--radius-md)] bg-white/12 p-1.5 ring-1 ring-white/15">
              <StatusBadge status={displayStatus} />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {(req.status === 'APPROVED' || req.status === 'WAITING_ADMIN_UNIT') && (
                <Link href={`/surat/${req.id}`} target="_blank">
                  <Button variant="primary" className="bg-white !text-[var(--primary-800)] hover:bg-white/95">
                    <Download size={14} />
                    Unduh Surat
                  </Button>
                </Link>
              )}
              {req.status === 'REVISION_REQUESTED' && (
                <Link href={`/dashboard/pengurus/requests/${req.id}/edit`}>
                  <Button variant="primary" className="bg-white !text-[var(--primary-800)] hover:bg-white/95">
                    <Pencil size={14} />
                    Edit & Submit Ulang
                  </Button>
                </Link>
              )}
              {canCancel && <CancelButton requestId={req.id} approved={req.status === 'APPROVED'} />}
            </div>
          </div>
        </div>
      </section>

      {/* Inline status banner */}
      {banner && <DetailBanner {...banner} />}

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Schedule summary */}
          <section className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)]">
            <header className="border-b border-[var(--neutral-100)] px-5 py-4">
              <h2 className="text-[14px] font-semibold tracking-tight text-[var(--neutral-900)]">Jadwal & Fasilitas</h2>
            </header>
            <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
              <Stat icon={<MapPin size={14} />} label="Fasilitas" value={req.facilityName} sub={req.facilityLocation ?? undefined} />
              <Stat icon={<CalendarIcon size={14} />} label="Tanggal" value={formatWIBDate(req.startDateTime)} />
              <Stat
                icon={<Clock size={14} />}
                label="Waktu"
                value={`${formatWIBTime(req.startDateTime)}–${formatWIBTime(req.endDateTime)}`}
                sub={duration}
              />
              <Stat icon={<UsersIcon size={14} />} label="Peserta" value={req.participantCount ?? '-'} />
            </div>
          </section>

          {/* Details */}
          <section className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)]">
            <header className="border-b border-[var(--neutral-100)] px-5 py-4">
              <h2 className="text-[14px] font-semibold tracking-tight text-[var(--neutral-900)]">Detail Pengajuan</h2>
            </header>
            <dl className="grid gap-5 p-5 sm:grid-cols-2">
              <Item icon={<UserIcon size={13} />} label="Penanggung Jawab" value={req.personInCharge} />
              <Item icon={<Tag size={13} />} label="NIM / ID" value={req.identityNumber ?? '-'} />
              <Item icon={<Mail size={13} />} label="Email" value={req.email} />
              <Item icon={<Phone size={13} />} label="No HP" value={req.phone} />
              <Item icon={<FileText size={13} />} label="Tujuan" value={req.purpose} full />
              <Item icon={<FileText size={13} />} label="Deskripsi" value={req.description} full />
              <Item icon={<FileText size={13} />} label="Kebutuhan Tambahan" value={req.additionalNeeds ?? '-'} full />
              {req.attachmentUrl && (
                <Item
                  icon={<FileText size={13} />}
                  label="Lampiran"
                  value={
                    <a
                      href={req.attachmentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[var(--primary-700)] underline-offset-2 hover:underline"
                    >
                      Buka tautan lampiran
                    </a>
                  }
                  full
                />
              )}
              {req.notes && <Item icon={<FileText size={13} />} label="Catatan Pengaju" value={req.notes} full />}
            </dl>
          </section>
        </div>

        {/* Timeline */}
        <aside className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)]">
          <header className="border-b border-[var(--neutral-100)] px-5 py-4">
            <h2 className="text-[14px] font-semibold tracking-tight text-[var(--neutral-900)]">Riwayat Approval</h2>
            <p className="mt-0.5 text-[11.5px] text-[var(--neutral-500)]">Urut dari yang terlama ke terbaru.</p>
          </header>
          <div className="p-5">
            <Timeline logs={logs} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--neutral-500)]">
        <span className="text-[var(--neutral-400)]">{icon}</span>
        {label}
      </p>
      <p className="mt-1.5 text-[14px] font-semibold text-[var(--neutral-900)]">{value}</p>
      {sub && <p className="mt-0.5 text-[11.5px] text-[var(--neutral-500)]">{sub}</p>}
    </div>
  );
}

function Item({
  icon,
  label,
  value,
  full,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <dt className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--neutral-500)]">
        <span className="text-[var(--neutral-400)]">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-line text-[13px] text-[var(--neutral-900)]">{value}</dd>
    </div>
  );
}

function DetailBanner({
  tone,
  icon,
  title,
  body,
}: {
  tone: 'success' | 'info' | 'warning' | 'danger' | 'neutral';
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  const toneMap: Record<string, string> = {
    success: 'bg-[var(--primary-50)] text-[var(--primary-800)] ring-[var(--primary-100)]',
    info: 'bg-sky-50 text-sky-800 ring-sky-100',
    warning: 'bg-amber-50 text-amber-800 ring-amber-100',
    danger: 'bg-rose-50 text-rose-800 ring-rose-100',
    neutral: 'bg-[var(--neutral-50)] text-[var(--neutral-700)] ring-[var(--neutral-200)]',
  };
  return (
    <div className={`flex items-start gap-3 rounded-[var(--radius-lg)] px-4 py-3 ring-1 ${toneMap[tone]}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-semibold">{title}</p>
        <p className="mt-0.5 whitespace-pre-line text-[12.5px] leading-relaxed opacity-90">{body}</p>
      </div>
    </div>
  );
}
