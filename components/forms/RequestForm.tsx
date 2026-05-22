'use client';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
  Users as UsersIcon,
  CalendarDays,
  ClipboardList,
  UserRound,
  AlertTriangle,
} from 'lucide-react';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { FacilityPicker } from '@/components/forms/FacilityPicker';
import { getFacilityIcon } from '@/lib/facility-icons';
import { DatePicker } from '@/components/forms/DatePicker';
import { OptionPicker } from '@/components/forms/OptionPicker';
import { TimePicker } from '@/components/forms/TimePicker';
import {
  checkAvailability,
  createFacilityRequest,
  getFacilitySchedule,
  updateRevisionRequest,
  type FacilityScheduleItem,
  type RequestFormPayload,
  type RequestFormState,
} from '@/app/actions/requests';
import {
  ACTIVITY_SCOPE_LABEL,
  MANAGING_UNIT_LABEL,
  type Facility,
  type FacilityRequest,
} from '@/types';
import { isDateBeforeToday, nowTimeISO, todayDateISO } from '@/utils/date';

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
  lockedFacility?: Facility;
  facilities?: Facility[];
  initial?: FacilityRequest;
  /** Logo organisasi & tanda tangan sudah lengkap. Jika false, pengajuan diblokir. */
  assetsReady?: boolean;
};

export function RequestForm({ mode, lockedFacility, facilities, initial, assetsReady = true }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // URL form ini, dibawa ke Profil agar bisa kembali ke sini setelah upload.
  const returnUrl = `${pathname}${searchParams.toString() ? `?${searchParams}` : ''}`;
  const profileHref = `/dashboard/profile?return=${encodeURIComponent(returnUrl)}`;
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<RequestFormState>(undefined);
  const [submitting, startSubmit] = useTransition();
  const errs = state && !('ok' in state) ? state.fieldErrors ?? {} : {};

  const [pickedFacilityId, setPickedFacilityId] = useState<string>(
    lockedFacility ? String(lockedFacility.id) : initial?.facilityId ? String(initial.facilityId) : ''
  );
  const facilityId = lockedFacility ? String(lockedFacility.id) : pickedFacilityId;
  const [activityName, setActivityName] = useState<string>(initial?.activityName ?? '');
  const [organizationName, setOrganizationName] = useState<string>(initial?.organizationName ?? '');
  const [startDate, setStartDate] = useState<string>(initial?.startDateTime ? toDateOnly(initial.startDateTime) : '');
  const [startTime, setStartTime] = useState<string>(initial?.startDateTime ? toTimeOnly(initial.startDateTime) : '');
  const [endDate, setEndDate] = useState<string>(initial?.endDateTime ? toDateOnly(initial.endDateTime) : '');
  const [endTime, setEndTime] = useState<string>(initial?.endDateTime ? toTimeOnly(initial.endDateTime) : '');
  const start = useMemo(() => (startDate && startTime ? `${startDate}T${startTime}` : ''), [startDate, startTime]);
  const end = useMemo(() => (endDate && endTime ? `${endDate}T${endTime}` : ''), [endDate, endTime]);

  const todayStr = todayDateISO();
  const minEndDate = startDate && startDate >= todayStr ? startDate : todayStr;
  const isStartToday = startDate === todayStr;
  const isEndToday = endDate === todayStr;
  const minStartTime = isStartToday ? nowTimeISO() : undefined;
  const minEndTime =
    endDate && startDate && endDate === startDate && startTime
      ? startTime
      : isEndToday
        ? nowTimeISO()
        : undefined;
  const [participants, setParticipants] = useState<string>(
    initial?.participantCount != null ? String(initial.participantCount) : ''
  );
  const [purpose, setPurpose] = useState<string>(initial?.purpose ?? '');
  const [personInCharge, setPersonInCharge] = useState<string>(initial?.personInCharge ?? '');
  const [scope, setScope] = useState<'UNIVERSITAS' | 'FAKULTAS'>(initial?.activityScope ?? 'UNIVERSITAS');
  const [activityLevel, setActivityLevel] = useState<'KEMAHASISWAAN' | 'INSTITUSIONAL' | 'AKADEMIK'>(
    initial?.activityLevel ?? 'KEMAHASISWAAN'
  );
  const [additionalNeeds, setAdditionalNeeds] = useState<string>(initial?.additionalNeeds ?? '');
  const [identityNumber, setIdentityNumber] = useState<string>(initial?.identityNumber ?? '');
  const [phone, setPhone] = useState<string>(initial?.phone ?? '');
  const [email, setEmail] = useState<string>(initial?.email ?? '');

  const [clientError, setClientError] = useState<string | null>(null);

  const FIELD_LABELS: Record<string, string> = {
    facilityId: 'Fasilitas',
    startDateTime: 'Tanggal / jam mulai',
    endDateTime: 'Tanggal / jam selesai',
    purpose: 'Tujuan peminjaman',
    activityName: 'Nama kegiatan',
    activityScope: 'Lingkup kegiatan',
    activityLevel: 'Jenis kegiatan',
    personInCharge: 'Nama PIC',
    organizationName: 'Nama organisasi / LK / OK',
    participantCount: 'Jumlah peserta',
    phone: 'No HP',
    email: 'Email',
    identityNumber: 'NIM / NIDN / ID',
  };

  function buildPayload(): RequestFormPayload {
    return {
      facilityId,
      activityName,
      organizationName,
      personInCharge,
      identityNumber,
      email,
      phone,
      startDateTime: start,
      endDateTime: end,
      participantCount: participantsEnabled && participants ? participants : undefined,
      purpose,
      activityScope: scope,
      activityLevel,
      additionalNeeds: additionalNeeds || undefined,
    };
  }

  function fieldErrorSummary(fieldErrors: Record<string, string[]>) {
    return Object.entries(fieldErrors).map(([key, msgs]) => {
      const label = FIELD_LABELS[key] ?? key;
      return `${label}: ${msgs[0]}`;
    });
  }

  function handleStartDateChange(v: string) {
    setStartDate(v);
    if (endDate && v && endDate < v) setEndDate(v);
    if (v === todayStr && startTime && startTime < nowTimeISO()) setStartTime('');
  }

  function handleEndDateChange(v: string) {
    setEndDate(v);
    if (v === todayStr && endTime && endTime < nowTimeISO()) setEndTime('');
  }

  useEffect(() => {
    if (isDateBeforeToday(startDate)) setStartDate('');
    if (isDateBeforeToday(endDate)) setEndDate('');
  }, []);

  function validateBeforeSubmit(): string | null {
    if (!assetsReady) {
      return 'Lengkapi logo organisasi & tanda tangan di halaman Profil sebelum mengajukan peminjaman.';
    }
    if (!facilityId) return 'Pilih fasilitas terlebih dahulu.';
    if (!startDate) return 'Tanggal mulai wajib diisi.';
    if (!startTime) return 'Jam mulai wajib diisi.';
    if (!endDate) return 'Tanggal selesai wajib diisi.';
    if (!endTime) return 'Jam selesai wajib diisi.';
    if (isDateBeforeToday(startDate) || isDateBeforeToday(endDate)) {
      return 'Tanggal peminjaman tidak boleh sebelum hari ini.';
    }
    if (!start || !end || new Date(end) <= new Date(start)) {
      return 'Tanggal/jam selesai harus setelah tanggal/jam mulai.';
    }
    if (new Date(start) < new Date()) {
      return 'Waktu mulai tidak boleh di masa lalu.';
    }
    if (!purpose) return 'Pilih tujuan peminjaman.';
    if (!activityName.trim()) return 'Nama kegiatan wajib diisi.';
    if (!organizationName.trim()) return 'Nama organisasi wajib diisi.';
    if (!personInCharge.trim()) return 'Nama PIC wajib diisi.';
    if (!phone.trim()) return 'No HP wajib diisi.';
    if (!email.trim()) return 'Email wajib diisi.';
    const form = formRef.current;
    if (form && !form.checkValidity()) {
      const invalid = form.querySelector<HTMLElement>(':invalid');
      if (invalid) {
        invalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        invalid.focus();
      }
      const fieldName = invalid?.getAttribute('name') || '';
      const label =
        FIELD_LABELS[fieldName] || (invalid?.getAttribute('type') === 'time' ? 'Jam mulai / selesai' : 'Isian');
      return `${label} wajib diisi atau belum valid.`;
    }
    return null;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setClientError(null);
    setState(undefined);

    const validationMsg = validateBeforeSubmit();
    if (validationMsg) {
      setClientError(validationMsg);
      toast.error(validationMsg);
      return;
    }

    const payload = buildPayload();
    startSubmit(async () => {
      const res =
        mode === 'create'
          ? await createFacilityRequest(undefined, payload)
          : await updateRevisionRequest(initial!.id, undefined, payload);

      if (res && 'ok' in res && res.ok) {
        toast.success(mode === 'create' ? 'Pengajuan berhasil dikirim' : 'Revisi berhasil disubmit ulang', {
          description: 'Anda akan diarahkan ke halaman detail pengajuan.',
        });
        router.push(`/dashboard/pengurus/requests/${res.requestId}`);
        return;
      }

      setState(res);
      if (res && !('ok' in res)) {
        if (res.fieldErrors) {
          const summary = fieldErrorSummary(res.fieldErrors).join(' · ');
          setClientError(summary || 'Beberapa isian belum valid.');
          toast.error('Periksa kembali isian form', { description: summary });
          return;
        }
        if (res.error) {
          toast.error('Gagal mengirim pengajuan', { description: res.error });
        }
      }
    });
  }

  function handleFormChange() {
    if (clientError) setClientError(null);
    if (state && !('ok' in state) && (state.fieldErrors || state.error)) {
      setState(undefined);
    }
  }

  useEffect(() => {
    if (!state || 'ok' in state || !state.fieldErrors) return;
    const firstKey = Object.keys(state.fieldErrors)[0];
    if (!firstKey || !formRef.current) return;
    const el =
      formRef.current.querySelector(`[name="${firstKey}"]`) ??
      formRef.current.querySelector(`[data-field="${firstKey}"]`);
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [state]);

  const [avail, setAvail] = useState<null | {
    available: boolean;
    alternatives: Facility[];
    blocked: boolean;
    blockReason: string | null;
  }>(null);
  const [checking, startChecking] = useTransition();
  const [schedule, setSchedule] = useState<FacilityScheduleItem[]>([]);

  // Ambil jadwal terisi setiap kali fasilitas berganti — untuk menandai kalender.
  useEffect(() => {
    if (!facilityId) {
      setSchedule([]);
      return;
    }
    let cancelled = false;
    getFacilitySchedule(Number(facilityId)).then((rows) => {
      if (!cancelled) setSchedule(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [facilityId]);

  // Tanggal yang sudah terisi (booking/blokir) → penanda di DatePicker.
  const dayMarkers = useMemo(() => {
    const m: Record<string, 'booking' | 'block'> = {};
    for (const it of schedule) {
      const s = new Date(it.start);
      const e = new Date(it.end);
      const cur = new Date(s.getFullYear(), s.getMonth(), s.getDate());
      const last = new Date(e.getFullYear(), e.getMonth(), e.getDate());
      while (cur <= last) {
        const k = toDateOnly(cur);
        if (it.kind === 'block') m[k] = 'block';
        else if (!m[k]) m[k] = 'booking';
        cur.setDate(cur.getDate() + 1);
      }
    }
    return m;
  }, [schedule]);

  // Agenda yang menyentuh tanggal mulai yang dipilih user.
  const selectedDayItems = useMemo(() => {
    if (!startDate) return [];
    return schedule.filter((it) => {
      const ds = toDateOnly(new Date(it.start));
      const de = toDateOnly(new Date(it.end));
      return startDate >= ds && startDate <= de;
    });
  }, [schedule, startDate]);

  const selectedFacility = useMemo<Facility | undefined>(() => {
    if (lockedFacility) return lockedFacility;
    return facilities?.find((f) => String(f.id) === facilityId);
  }, [lockedFacility, facilities, facilityId]);

  const participantsEnabled = useMemo(() => {
    const cat = selectedFacility?.category?.toLowerCase() ?? '';
    if (!cat) return false;
    return !cat.includes('peralatan') && !cat.includes('kendaraan');
  }, [selectedFacility]);

  const duration = useMemo(() => {
    if (!start || !end) return null;
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms <= 0) return null;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h} jam${m ? ` ${m} mnt` : ''}` : `${m} mnt`;
  }, [start, end]);

  // Cek ketersediaan otomatis begitu fasilitas + tanggal + jam lengkap.
  useEffect(() => {
    if (!facilityId || !start || !end || new Date(end) <= new Date(start)) {
      setAvail(null);
      return;
    }
    const t = setTimeout(() => {
      startChecking(async () => {
        const res = await checkAvailability(Number(facilityId), start, end);
        setAvail({
          available: res.available,
          alternatives: res.alternatives,
          blocked: res.blocked,
          blockReason: res.blockReason,
        });
      });
    }, 400);
    return () => clearTimeout(t);
  }, [facilityId, start, end]);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onChange={handleFormChange}
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
    >
      <div className="space-y-5">
        {/* Hidden inputs */}
        <input type="hidden" name="startDateTime" value={start} />
        <input type="hidden" name="endDateTime" value={end} />

        {/* Hint — logo & tanda tangan wajib lengkap sebelum mengajukan */}
        {!assetsReady && (
          <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-3.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-700" />
              <div className="min-w-0 flex-1 text-[12.5px]">
                <p className="font-semibold text-amber-900">
                  Logo organisasi &amp; tanda tangan belum lengkap
                </p>
                <p className="mt-0.5 text-amber-800">
                  Keduanya wajib diunggah lebih dulu — dipakai pada surat permohonan. Pengajuan
                  tidak dapat dikirim sampai keduanya lengkap.
                </p>
                <Link
                  href={profileHref}
                  className="mt-1.5 inline-flex items-center gap-1 font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-950"
                >
                  Lengkapi di halaman Profil →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* SECTION — Fasilitas */}
        <Section
          icon={<Building2 size={15} />}
          eyebrow="01 · Fasilitas"
          title={mode === 'create' ? 'Pilih ruangan atau peralatan' : 'Ubah pengajuan'}
          description="Sistem akan otomatis memeriksa tabrakan jadwal sebelum permohonan dikirim."
          data-field="facilityId"
        >
          {lockedFacility ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--primary-100)] bg-[var(--primary-50)] p-4">
              <input type="hidden" name="facilityId" value={facilityId} />
              <div className="flex items-start gap-3">
                {(() => {
                  const FacIcon = getFacilityIcon(lockedFacility);
                  return (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-white text-[var(--primary-700)] ring-1 ring-[var(--primary-100)]">
                      <FacIcon size={18} strokeWidth={1.75} />
                    </div>
                  );
                })()}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-[var(--neutral-900)]">{lockedFacility.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[var(--neutral-600)]">
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
                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10.5px] font-medium text-[var(--neutral-700)] ring-1 ring-[var(--neutral-200)]">
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
            </div>
          ) : (
            <Field label="Fasilitas" error={errs.facilityId} required>
              <input type="hidden" name="facilityId" data-field="facilityId" value={pickedFacilityId} />
              <FacilityPicker
                facilities={facilities ?? []}
                value={pickedFacilityId}
                onChange={setPickedFacilityId}
              />
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Lingkup kegiatan"
              error={errs.activityScope}
              hint="Universitas divalidasi WR3 · Fakultas divalidasi WD3"
              required
            >
              <OptionPicker
                name="activityScope"
                value={scope}
                onChange={(v) => setScope(v as 'UNIVERSITAS' | 'FAKULTAS')}
                required
                options={[
                  { value: 'UNIVERSITAS', label: 'Tingkat Universitas' },
                  { value: 'FAKULTAS', label: 'Tingkat Fakultas' },
                ]}
              />
            </Field>
            <Field
              label="Jenis kegiatan"
              error={errs.activityLevel}
              hint="Akademik > Institusional > Kemahasiswaan"
              required
            >
              <OptionPicker
                name="activityLevel"
                value={activityLevel}
                onChange={(v) =>
                  setActivityLevel(v as 'KEMAHASISWAAN' | 'INSTITUSIONAL' | 'AKADEMIK')
                }
                required
                options={[
                  { value: 'KEMAHASISWAAN', label: 'Kemahasiswaan' },
                  { value: 'INSTITUSIONAL', label: 'Institusional' },
                  { value: 'AKADEMIK', label: 'Akademik' },
                ]}
              />
            </Field>
          </div>
        </Section>

        {/* SECTION — Jadwal */}
        <Section
          icon={<CalendarDays size={15} />}
          eyebrow="02 · Jadwal"
          title="Tanggal dan waktu penggunaan"
          description="Tanggal yang sudah terisi peminjaman ditandai pada kalender. Ketersediaan diperiksa otomatis."
          data-field="startDateTime"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Tanggal mulai"
              error={errs.startDateTime}
              hint="Tidak bisa memilih tanggal sebelum hari ini (WIB)."
              required
            >
              <DatePicker
                value={startDate}
                onChange={handleStartDateChange}
                min={todayStr}
                placeholder="Pilih tanggal mulai"
                dayMarkers={dayMarkers}
              />
            </Field>
            <Field
              label="Tanggal selesai"
              error={errs.endDateTime}
              hint="Minimal hari ini atau sama dengan tanggal mulai."
              required
            >
              <DatePicker
                value={endDate}
                onChange={handleEndDateChange}
                min={minEndDate}
                placeholder="Pilih tanggal selesai"
                dayMarkers={dayMarkers}
              />
            </Field>
            <Field label="Jam mulai" error={errs.startDateTime} required>
              <TimePicker
                value={startTime}
                onChange={setStartTime}
                min={minStartTime}
                placeholder="Pilih jam mulai"
                required
              />
            </Field>
            <Field label="Jam selesai" error={errs.endDateTime} required>
              <TimePicker
                value={endTime}
                onChange={setEndTime}
                min={minEndTime}
                placeholder="Pilih jam selesai"
                required
              />
            </Field>
          </div>

          {selectedDayItems.length > 0 && (
            <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-3.5">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-700" />
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-amber-900">
                    {formatDateOnly(startDate)} sudah terisi {selectedDayItems.length} agenda pada fasilitas ini
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {selectedDayItems.slice(0, 4).map((it, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11.5px] text-amber-800">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                        <span>
                          {it.kind === 'block' ? `Diblokir admin: ${it.label}` : it.label} ·{' '}
                          {formatTimeOnly(it.start)}–{formatTimeOnly(it.end)} WIB
                        </span>
                      </li>
                    ))}
                    {selectedDayItems.length > 4 && (
                      <li className="text-[11px] text-amber-700">
                        +{selectedDayItems.length - 4} agenda lainnya
                      </li>
                    )}
                  </ul>
                  <p className="mt-1.5 text-[11.5px] text-amber-700">
                    Pilih jam di luar rentang tersebut. Bila tetap bentrok, sistem akan menawarkan fasilitas
                    alternatif di panel ringkasan.
                  </p>
                </div>
              </div>
            </div>
          )}

          {duration && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--neutral-100)] px-3 py-1 text-[11.5px] font-medium text-[var(--neutral-700)]">
              Durasi peminjaman <span className="font-semibold text-[var(--neutral-900)]">{duration}</span>
            </div>
          )}
        </Section>

        {/* SECTION — Detail */}
        <Section icon={<ClipboardList size={15} />} eyebrow="03 · Detail Kegiatan" title="Informasi acara">
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
            <Field label="Tujuan peminjaman" error={errs.purpose} required>
              <OptionPicker
                name="purpose"
                value={PURPOSE_OPTIONS.includes(purpose) ? purpose : ''}
                onChange={setPurpose}
                placeholder="Pilih tujuan"
                required
                options={PURPOSE_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
              />
            </Field>
            <Field
              label="Jumlah peserta"
              error={errs.participantCount}
              hint={
                !participantsEnabled
                  ? 'Tidak berlaku untuk peralatan / kendaraan'
                  : selectedFacility?.capacity != null
                    ? `Maks. ${selectedFacility.capacity} orang`
                    : undefined
              }
            >
              <Input
                type="number"
                name="participantCount"
                value={participantsEnabled ? participants : ''}
                onChange={(e) => setParticipants(e.target.value)}
                min={0}
                max={selectedFacility?.capacity ?? undefined}
                placeholder="0"
                disabled={!participantsEnabled}
              />
              {selectedFacility?.capacity != null &&
                participants !== '' &&
                Number(participants) > selectedFacility.capacity && (
                  <p className="mt-1.5 text-xs font-medium text-rose-600">
                    Melebihi kapasitas {selectedFacility.name} ({selectedFacility.capacity}).
                  </p>
                )}
            </Field>
          </div>

          <Field
            label="Kebutuhan tambahan"
            error={errs.additionalNeeds}
            hint="Sound system, kursi tambahan, konsumsi, dll. (opsional)"
          >
            <Textarea
              name="additionalNeeds"
              value={additionalNeeds}
              onChange={(e) => setAdditionalNeeds(e.target.value)}
              rows={2}
              placeholder="Tuliskan kebutuhan tambahan untuk acara…"
            />
          </Field>
        </Section>

        {/* SECTION — PIC */}
        <Section icon={<UserRound size={15} />} eyebrow="04 · Penanggung Jawab" title="Kontak PIC kegiatan">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nama PIC" error={errs.personInCharge} required>
              <Input
                name="personInCharge"
                value={personInCharge}
                onChange={(e) => setPersonInCharge(e.target.value)}
                placeholder="Nama lengkap"
                required
              />
            </Field>
            <Field label="Nama organisasi / LK / OK" error={errs.organizationName} required>
              <Input
                name="organizationName"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="BEM / HMPS / UKM / ..."
                required
              />
            </Field>
            <Field label="NIM / NIDN / ID" error={errs.identityNumber}>
              <Input
                name="identityNumber"
                value={identityNumber}
                onChange={(e) => setIdentityNumber(e.target.value)}
                placeholder="2021xxxxxxx"
              />
            </Field>
            <Field label="No HP" error={errs.phone} required>
              <Input
                name="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="08xxxxxxxxxx"
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Email" error={errs.email} required>
                <Input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@students.ukdw.ac.id"
                  required
                />
              </Field>
            </div>
          </div>
        </Section>

        {clientError && (
          <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">{clientError}</p>
          </div>
        )}

        {state && !('ok' in state) && state.fieldErrors && Object.keys(state.fieldErrors).length > 0 && (
          <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-900">Beberapa isian belum valid:</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-800">
              {fieldErrorSummary(state.fieldErrors).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        {state && !('ok' in state) && state.error && (
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

        <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white/90 px-4 py-3 shadow-[var(--shadow-sm)] backdrop-blur">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Batal
          </Button>
          <div className="flex flex-wrap items-center gap-3">
            {checking && (
              <span className="text-[11.5px] font-medium text-[var(--neutral-500)]">
                Mengecek ketersediaan…
              </span>
            )}
            <Button type="submit" disabled={submitting || !assetsReady}>
              {submitting ? 'Mengirim…' : mode === 'create' ? 'Ajukan Peminjaman' : 'Submit Ulang Revisi'}
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar summary */}
      <aside className="hidden lg:block">
        <div className="sticky top-[80px] space-y-4">
          <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)]">
            <div className="border-b border-[var(--neutral-100)] bg-[var(--neutral-50)]/60 px-5 py-3.5">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--neutral-500)]">
                Ringkasan
              </p>
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
            </dl>
          </div>

          {avail && (
            <div
              className={
                avail.available
                  ? 'rounded-[var(--radius-lg)] border border-[var(--primary-100)] bg-[var(--primary-50)] p-4 text-[var(--primary-900)]'
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
                        ? 'Diblokir admin'
                        : 'Bentrok jadwal'}
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
        </div>
      </aside>
    </form>
  );
}

function Section({
  icon,
  eyebrow,
  title,
  description,
  children,
  'data-field': dataField,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  'data-field'?: string;
}) {
  return (
    <section
      data-field={dataField}
      className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)]"
    >
      <header className="flex items-start gap-3 border-b border-[var(--neutral-100)] px-5 py-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-50)] text-[var(--primary-700)] ring-1 ring-[var(--primary-100)]">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--neutral-500)]">{eyebrow}</p>
          <h3 className="mt-0.5 text-[15px] font-semibold tracking-tight text-[var(--neutral-900)]">{title}</h3>
          {description && <p className="mt-1 text-[12px] text-[var(--neutral-500)]">{description}</p>}
        </div>
      </header>
      <div className="space-y-4 px-5 py-5">{children}</div>
    </section>
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
