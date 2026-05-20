'use client';
import { useActionState, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Info,
  CheckCircle2,
  XCircle,
  Upload,
  Sparkles,
  Building2,
  MapPin,
  Users as UsersIcon,
} from 'lucide-react';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { FacilityPicker } from '@/components/forms/FacilityPicker';
import { DatePicker } from '@/components/forms/DatePicker';
import {
  checkAvailability,
  createFacilityRequest,
  updateRevisionRequest,
  type RequestFormState,
} from '@/app/actions/requests';
import {
  ACTIVITY_SCOPE_LABEL,
  MANAGING_UNIT_LABEL,
  type Facility,
  type FacilityRequest,
} from '@/types';

const PURPOSE_OPTIONS = [
  'Seminar / Workshop',
  'Rapat / Diskusi',
  'Pelatihan',
  'Latihan rutin',
  'Ibadah / Persekutuan',
  'Kompetisi',
  'Pemutaran film',
  'Bazar',
  'Dokumentasi / Recording',
  'Lainnya',
];

type Props = {
  mode: 'create' | 'edit';
  /** When provided, facility is locked (read-only card). */
  lockedFacility?: Facility;
  /** When provided AND no lockedFacility, render dropdown. */
  facilities?: Facility[];
  initial?: FacilityRequest;
};

export function RequestForm({ mode, lockedFacility, facilities, initial }: Props) {
  const router = useRouter();
  const action =
    mode === 'create' ? createFacilityRequest : updateRevisionRequest.bind(null, initial!.id);
  const [state, formAction, pending] = useActionState<RequestFormState, FormData>(action, undefined);
  const errs = state?.fieldErrors ?? {};

  // Facility may be locked (from card click) or selectable via dropdown.
  const [pickedFacilityId, setPickedFacilityId] = useState<string>(
    lockedFacility ? String(lockedFacility.id) : initial ? String(initial.facilityId) : ''
  );
  const facilityId = lockedFacility ? String(lockedFacility.id) : pickedFacilityId;
  const [activityName, setActivityName] = useState<string>(initial?.activityName ?? '');
  const [organizationName, setOrganizationName] = useState<string>(initial?.organizationName ?? '');
  // Date and time split: yyyy-mm-dd + hh:mm
  const [startDate, setStartDate] = useState<string>(initial ? toDateOnly(initial.startDateTime) : '');
  const [startTime, setStartTime] = useState<string>(initial ? toTimeOnly(initial.startDateTime) : '');
  const [endDate, setEndDate] = useState<string>(initial ? toDateOnly(initial.endDateTime) : '');
  const [endTime, setEndTime] = useState<string>(initial ? toTimeOnly(initial.endDateTime) : '');
  const start = useMemo(() => (startDate && startTime ? `${startDate}T${startTime}` : ''), [startDate, startTime]);
  const end = useMemo(() => (endDate && endTime ? `${endDate}T${endTime}` : ''), [endDate, endTime]);
  const [participants, setParticipants] = useState<string>(
    initial?.participantCount != null ? String(initial.participantCount) : ''
  );
  const [purpose, setPurpose] = useState<string>(initial?.purpose ?? '');
  const [personInCharge, setPersonInCharge] = useState<string>(initial?.personInCharge ?? '');
  const [scope, setScope] = useState<'UNIVERSITAS' | 'FAKULTAS'>(initial?.activityScope ?? 'UNIVERSITAS');

  const [avail, setAvail] = useState<null | {
    available: boolean;
    alternatives: Facility[];
    blocked: boolean;
    blockReason: string | null;
  }>(null);
  const [checking, startChecking] = useTransition();

  const selectedFacility = useMemo<Facility | undefined>(() => {
    if (lockedFacility) return lockedFacility;
    return facilities?.find((f) => String(f.id) === facilityId);
  }, [lockedFacility, facilities, facilityId]);

  const duration = useMemo(() => {
    if (!start || !end) return null;
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms <= 0) return null;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h} jam${m ? ` ${m} mnt` : ''}` : `${m} mnt`;
  }, [start, end]);

  function doCheck() {
    if (!facilityId || !start || !end) return;
    startChecking(async () => {
      const res = await checkAvailability(Number(facilityId), start, end);
      setAvail({
        available: res.available,
        alternatives: res.alternatives,
        blocked: res.blocked,
        blockReason: res.blockReason,
      });
    });
  }

  return (
    <form action={formAction} className="grid gap-6 lg:grid-cols-3">
      {/* Form column */}
      <div className="space-y-5 lg:col-span-2">
        <Card>
          <CardHeader
            eyebrow="Form Permohonan"
            title={mode === 'create' ? 'Ajukan peminjaman fasilitas' : 'Edit dan submit ulang pengajuan'}
            description="Sistem akan otomatis mengecek tabrakan jadwal sebelum permohonan dapat dikirim."
          />
          <div className="space-y-4 px-6 pb-6">
            {lockedFacility ? (
              <Field label="Fasilitas">
                <input type="hidden" name="facilityId" value={facilityId} />
                <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--primary-100)] bg-[var(--primary-50)] px-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-white text-[var(--primary-700)] ring-1 ring-[var(--primary-100)]">
                    <Building2 size={17} strokeWidth={2.1} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-[var(--neutral-900)]">{lockedFacility.name}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-[var(--neutral-600)]">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={11} className="text-[var(--neutral-400)]" />
                        {lockedFacility.location ?? '—'}
                      </span>
                      {lockedFacility.capacity != null && (
                        <span className="inline-flex items-center gap-1">
                          <UsersIcon size={11} className="text-[var(--neutral-400)]" />
                          Kap. {lockedFacility.capacity}
                        </span>
                      )}
                      <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[10.5px] font-medium text-[var(--neutral-700)] ring-1 ring-[var(--neutral-200)]">
                        {MANAGING_UNIT_LABEL[lockedFacility.managingUnit]}
                      </span>
                    </div>
                  </div>
                  {mode === 'create' && (
                    <Link
                      href="/dashboard/pengurus/requests/new"
                      className="shrink-0 self-center text-[11.5px] font-semibold text-[var(--primary-700)] hover:text-[var(--primary-800)]"
                    >
                      Ganti
                    </Link>
                  )}
                </div>
              </Field>
            ) : (
              <Field label="Fasilitas" error={errs.facilityId} required hint="Dikelompokkan per unit pengelola. Klik untuk membuka pemilih.">
                <input type="hidden" name="facilityId" value={pickedFacilityId} />
                <FacilityPicker
                  facilities={facilities ?? []}
                  value={pickedFacilityId}
                  onChange={setPickedFacilityId}
                />
              </Field>
            )}

            {/* Hidden composed datetime-local strings for server action */}
            <input type="hidden" name="startDateTime" value={start} />
            <input type="hidden" name="endDateTime" value={end} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tanggal mulai" error={errs.startDateTime} required>
                <DatePicker value={startDate} onChange={setStartDate} placeholder="Pilih tanggal mulai" />
              </Field>
              <Field label="Tanggal selesai" error={errs.endDateTime} required>
                <DatePicker
                  value={endDate}
                  onChange={setEndDate}
                  min={startDate}
                  placeholder="Pilih tanggal selesai"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Jam mulai" required>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </Field>
              <Field label="Jam selesai" required>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </Field>
            </div>

            <Field label="Nama kegiatan" error={errs.activityName} required>
              <Input
                name="activityName"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                placeholder="contoh: Seminar Nasional AI & Pendidikan"
                required
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Jumlah peserta"
                error={errs.participantCount}
                hint={
                  selectedFacility?.capacity != null
                    ? `Maks. ${selectedFacility.capacity} (kapasitas ${selectedFacility.name})`
                    : undefined
                }
              >
                <Input
                  type="number"
                  name="participantCount"
                  value={participants}
                  onChange={(e) => setParticipants(e.target.value)}
                  min={0}
                  max={selectedFacility?.capacity ?? undefined}
                  placeholder="0"
                />
                {selectedFacility?.capacity != null &&
                  participants !== '' &&
                  Number(participants) > selectedFacility.capacity && (
                    <p className="mt-1.5 text-xs font-medium text-rose-600">
                      Melebihi kapasitas {selectedFacility.name} ({selectedFacility.capacity}).
                    </p>
                  )}
              </Field>
              <Field label="Penanggung jawab" error={errs.personInCharge} required>
                <Input
                  name="personInCharge"
                  value={personInCharge}
                  onChange={(e) => setPersonInCharge(e.target.value)}
                  placeholder="Nama PIC kegiatan"
                  required
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama organisasi / LK / OK" error={errs.organizationName} required>
                <Input
                  name="organizationName"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  required
                />
              </Field>
              <Field
                label="Lingkup kegiatan"
                error={errs.activityScope}
                hint="UNIVERSITAS → WR3 · FAKULTAS → WD3"
                required
              >
                <Select
                  name="activityScope"
                  value={scope}
                  onChange={(e) => setScope(e.target.value as 'UNIVERSITAS' | 'FAKULTAS')}
                  required
                >
                  <option value="UNIVERSITAS">Tingkat Universitas</option>
                  <option value="FAKULTAS">Tingkat Fakultas</option>
                </Select>
              </Field>
              <Field
                label="Jenis kegiatan"
                error={errs.activityLevel}
                hint="Prioritas antrian: Akademik > Institusional > Kemahasiswaan."
                required
              >
                <Select name="activityLevel" defaultValue={initial?.activityLevel ?? 'KEMAHASISWAAN'} required>
                  <option value="KEMAHASISWAAN">Kemahasiswaan</option>
                  <option value="INSTITUSIONAL">Institusional</option>
                  <option value="AKADEMIK">Akademik</option>
                </Select>
              </Field>
            </div>

            <Field
              label="Dokumen pendukung (proposal / surat tugas)"
              error={errs.attachmentUrl}
              hint="Opsional. Tempel URL Google Drive proposal/surat tugas."
            >
              <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--neutral-300)] bg-[var(--neutral-50)] px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-white text-[var(--neutral-500)] ring-1 ring-[var(--neutral-200)]">
                  <Upload size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-[var(--neutral-800)]">Klik untuk menggunggah dokumen</p>
                  <p className="mt-0.5 text-[11px] text-[var(--neutral-500)]">PDF, DOC, atau gambar · maks. 5MB</p>
                  <Input
                    name="attachmentUrl"
                    defaultValue={initial?.attachmentUrl ?? ''}
                    placeholder="https://drive.google.com/..."
                    className="!mt-2 !h-8 !text-[12px]"
                  />
                </div>
              </div>
            </Field>

            <Tip>
              Klik <strong>Cek Ketersediaan</strong> untuk memvalidasi jadwal Anda di database sebelum dikirim.
            </Tip>
          </div>
        </Card>

        <Card>
          <CardHeader eyebrow="Kontak PIC" title="Email & telepon penanggung jawab" />
          <div className="grid gap-4 px-6 pb-6 sm:grid-cols-2">
            <Field label="NIM / NIDN / ID PIC" error={errs.identityNumber}>
              <Input name="identityNumber" defaultValue={initial?.identityNumber ?? ''} />
            </Field>
            <Field label="No HP" error={errs.phone} required>
              <Input name="phone" defaultValue={initial?.phone ?? ''} required />
            </Field>
            <Field label="Email" error={errs.email} required>
              <Input type="email" name="email" defaultValue={initial?.email ?? ''} required />
            </Field>
          </div>
        </Card>

        <Card>
          <CardHeader eyebrow="Detail Kegiatan" title="Tujuan dan deskripsi" />
          <div className="space-y-4 px-6 pb-6">
            <Field label="Tujuan peminjaman" error={errs.purpose} required>
              <Select
                name="purpose"
                value={PURPOSE_OPTIONS.includes(purpose) ? purpose : (purpose ? '__custom' : '')}
                onChange={(e) => {
                  if (e.target.value === '__custom') return;
                  setPurpose(e.target.value);
                }}
                required
              >
                <option value="">— Pilih tujuan —</option>
                {PURPOSE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </Select>
            </Field>
            <Field label="Deskripsi kegiatan" error={errs.description} required>
              <Textarea name="description" defaultValue={initial?.description ?? ''} rows={3} required />
            </Field>
            <Field
              label="Kebutuhan tambahan"
              error={errs.additionalNeeds}
              hint="Sound system, kursi tambahan, konsumsi, dll."
            >
              <Textarea name="additionalNeeds" defaultValue={initial?.additionalNeeds ?? ''} rows={2} />
            </Field>
            <Field label="Catatan tambahan" error={errs.notes}>
              <Textarea name="notes" defaultValue={initial?.notes ?? ''} rows={2} />
            </Field>
          </div>
        </Card>

        {state?.error && (
          <div className="rounded-[var(--radius-md)] border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-medium text-rose-800">{state.error}</p>
            {state.alternatives && state.alternatives.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-rose-900">
                {state.alternatives.map((a) => (
                  <li key={a.id} className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-rose-600" />
                    Alternatif: {a.name} — {a.location ?? '-'}
                    {a.capacity ? ` (kap. ${a.capacity})` : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Footer actions */}
        <div className="sticky bottom-0 z-10 -mx-1 flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white/95 px-4 py-3 shadow-[var(--shadow-sm)] backdrop-blur">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Batal
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={doCheck} disabled={checking || !facilityId || !start || !end}>
              <Search size={14} />
              {checking ? 'Mengecek…' : 'Cek Ketersediaan'}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Mengirim…' : mode === 'create' ? 'Ajukan Peminjaman' : 'Submit Ulang Revisi'}
            </Button>
          </div>
        </div>
      </div>

      {/* Summary panel */}
      <aside className="lg:col-span-1">
        <div className="sticky top-[80px] space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)]">
            <div className="border-b border-[var(--neutral-100)] px-5 py-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--neutral-500)]">Ringkasan</p>
              <p className="mt-0.5 text-[13px] font-semibold text-[var(--neutral-900)]">Pratinjau permohonan</p>
            </div>
            <dl className="divide-y divide-[var(--neutral-100)] text-[12.5px]">
              <SummaryRow label="Fasilitas" value={selectedFacility?.name ?? '—'} />
              <SummaryRow label="Lokasi" value={selectedFacility?.location ?? '—'} />
              <SummaryRow label="Tanggal" value={start ? formatDateOnly(start) : '—'} />
              <SummaryRow
                label="Waktu"
                value={start && end ? `${formatTimeOnly(start)} – ${formatTimeOnly(end)}` : '—'}
              />
              <SummaryRow label="Durasi" value={duration ?? '—'} />
              <SummaryRow label="Tujuan" value={purpose || '—'} />
              <SummaryRow label="Peserta" value={participants ? `${participants} orang` : '—'} />
              <SummaryRow label="Lingkup" value={ACTIVITY_SCOPE_LABEL[scope]} />
              <SummaryRow
                label="Status"
                value={
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Akan masuk antrean
                  </span>
                }
              />
            </dl>
          </div>

          {/* Availability result */}
          {avail && (
            <div
              className={
                avail.available
                  ? 'rounded-[var(--radius-lg)] border border-[var(--primary-200,var(--primary-100))] bg-[var(--primary-50)] p-4 text-[var(--primary-900)]'
                  : 'rounded-[var(--radius-lg)] border border-rose-200 bg-rose-50 p-4 text-rose-900'
              }
            >
              <div className="flex items-start gap-2">
                <span className="mt-0.5">
                  {avail.available ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold">
                    {avail.available
                      ? 'Fasilitas tersedia'
                      : avail.blocked
                        ? 'Diblokir admin pada jadwal tersebut'
                        : 'Tidak tersedia pada jadwal tersebut'}
                  </p>
                  {avail.blocked && avail.blockReason && (
                    <p className="mt-1 text-[12px]">{avail.blockReason}</p>
                  )}
                  {!avail.available && avail.alternatives.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] opacity-80">
                        Alternatif tersedia
                      </p>
                      <ul className="mt-1 space-y-0.5 text-[12px]">
                        {avail.alternatives.map((a) => (
                          <li key={a.id} className="flex items-start gap-1.5">
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
                            <span>
                              {a.name}
                              {a.location ? ` — ${a.location}` : ''}
                              {a.capacity ? ` · kap. ${a.capacity}` : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Validation auto tip */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-4">
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary-50)] text-[var(--primary-700)] ring-1 ring-[var(--primary-100)]">
                <Sparkles size={13} />
              </div>
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold text-[var(--neutral-900)]">Validasi otomatis</p>
                <p className="mt-0.5 text-[11.5px] leading-relaxed text-[var(--neutral-600)]">
                  Sistem mengecek overlap schedule sesuai alur. Jika bentrok, Anda akan diminta memilih jadwal lain.
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </form>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)]">
      {children}
    </section>
  );
}

function CardHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="border-b border-[var(--neutral-100)] px-6 py-5">
      {eyebrow && (
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--neutral-500)]">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-1 text-[18px] font-bold tracking-tight text-[var(--neutral-900)]">{title}</h2>
      {description && <p className="mt-1 text-[12.5px] text-[var(--neutral-500)]">{description}</p>}
    </header>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--neutral-50)] px-3.5 py-2.5 text-[12px] text-[var(--neutral-600)] ring-1 ring-[var(--neutral-100)]">
      <Info size={13} className="mt-0.5 shrink-0 text-[var(--neutral-400)]" />
      <p className="leading-relaxed">{children}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 items-start gap-3 px-5 py-2.5">
      <dt className="col-span-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--neutral-500)]">
        {label}
      </dt>
      <dd className="col-span-2 break-words text-[12.5px] font-medium text-[var(--neutral-900)]">{value}</dd>
    </div>
  );
}

function formatDateOnly(s: string): string {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTimeOnly(s: string): string {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function toDateOnly(d: Date | string): string {
  const x = new Date(d);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

function toTimeOnly(d: Date | string): string {
  const x = new Date(d);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(x.getHours())}:${pad(x.getMinutes())}`;
}
