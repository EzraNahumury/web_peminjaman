'use client';
import Image from 'next/image';
import { useActionState, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2, Upload, UploadCloud } from 'lucide-react';
import { Field, Input } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import {
  changePassword,
  removeOrganizationLogo,
  removeSignature,
  updateProfile,
  uploadOrganizationLogo,
  uploadSignature,
  type ProfileFormState,
} from '@/app/actions/profile';
import type { User } from '@/types';

export function ProfileEditForm({ user }: { user: User }) {
  const router = useRouter();
  const isPengurus = user.role === 'PENGURUS';
  const [pending, start] = useTransition();
  const [errs, setErrs] = useState<Record<string, string[]>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setErrs({});
    start(async () => {
      const res = await updateProfile(undefined, fd);
      if (res?.fieldErrors) {
        setErrs(res.fieldErrors);
        toast.error('Periksa kembali isian form');
        return;
      }
      if (res?.error) {
        toast.error('Gagal menyimpan', { description: res.error });
        return;
      }
      toast.success('Profil disimpan', { description: res?.success ?? 'Data terbaru tersimpan.' });
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama Lengkap" error={errs.name} required>
          <Input name="name" defaultValue={user.name} required placeholder="Nama sesuai KTP / KTM" />
        </Field>
        <Field label="Email" error={errs.email} hint="Login & tujuan notifikasi sistem." required>
          <Input
            type="email"
            name="email"
            defaultValue={user.email}
            required
            autoComplete="email"
            placeholder="nama@students.ukdw.ac.id"
          />
        </Field>
        <Field label="No HP" error={errs.phone} required>
          <Input
            name="phone"
            defaultValue={user.phone ?? ''}
            required
            placeholder="08xxxxxxxxxx"
          />
        </Field>
        <Field label={isPengurus ? 'NIM / NIDN / ID' : 'ID Pegawai'} error={errs.identityNumber}>
          <Input
            name="identityNumber"
            defaultValue={user.identityNumber ?? ''}
            placeholder={isPengurus ? '7122xxxxx' : 'opsional'}
          />
        </Field>
        {isPengurus && (
          <div className="sm:col-span-2">
            <Field label="Nama Organisasi / LK / OK" error={errs.organizationName}>
              <Input
                name="organizationName"
                defaultValue={user.organizationName ?? ''}
                placeholder="BEM / HMPS / UKM / UKR …"
              />
            </Field>
          </div>
        )}
      </div>
      <div className="flex justify-end border-t border-[var(--neutral-100)] pt-4">
        <Button type="submit" disabled={pending}>
          {pending ? 'Menyimpan…' : 'Simpan Perubahan'}
        </Button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(changePassword, undefined);
  const errs = state?.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Password Lama" error={errs.currentPassword} required>
          <PasswordInput name="currentPassword" required autoComplete="current-password" />
        </Field>
        <Field label="Password Baru" error={errs.newPassword} hint="Minimal 6 karakter." required>
          <PasswordInput name="newPassword" required autoComplete="new-password" />
        </Field>
        <Field label="Konfirmasi" error={errs.confirmPassword} required>
          <PasswordInput name="confirmPassword" required autoComplete="new-password" />
        </Field>
      </div>
      {state?.success && (
        <div className="rounded-[var(--radius-md)] border border-[var(--primary-200)] bg-[var(--primary-50)] px-3.5 py-2.5 text-sm text-[var(--primary-800)]">
          {state.success}
        </div>
      )}
      {state?.error && (
        <div className="rounded-[var(--radius-md)] border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          {state.error}
        </div>
      )}
      <div className="flex justify-end border-t border-[var(--neutral-100)] pt-4">
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? 'Memproses…' : 'Ganti Password'}
        </Button>
      </div>
    </form>
  );
}

export function LogoUploadForm({ user }: { user: User }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [pending, start] = useTransition();
  const [removing, startRemove] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File | null) {
    if (!file) {
      setPreview(null);
      setFileName(null);
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPreview(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get('logo');
    if (!(file instanceof File) || file.size === 0) {
      toast.error('Pilih file logo dulu');
      return;
    }
    start(async () => {
      const res = await uploadOrganizationLogo(undefined, fd);
      if (res?.error) {
        toast.error('Gagal mengunggah', { description: res.error });
        return;
      }
      toast.success('Logo diperbarui', { description: 'Logo organisasi tersimpan.' });
      setPreview(null);
      setFileName(null);
      if (fileRef.current) fileRef.current.value = '';
      router.refresh();
    });
  }

  async function onRemove() {
    if (!confirm('Hapus logo organisasi?')) return;
    startRemove(async () => {
      await removeOrganizationLogo();
      toast.success('Logo dihapus');
      router.refresh();
    });
  }

  const current = preview ?? user.organizationLogoUrl ?? null;

  return (
    <div className="grid gap-5 sm:grid-cols-[200px_minmax(0,1fr)]">
      {/* Preview pane */}
      <div className="flex flex-col items-center gap-2.5">
        <div className="relative flex h-44 w-44 items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-dashed border-[var(--neutral-300)] bg-[var(--neutral-50)]">
          {current ? (
            <Image
              src={current}
              alt="Logo organisasi"
              width={176}
              height={176}
              unoptimized
              className="h-full w-full object-contain p-3"
            />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-[var(--neutral-400)]">
              <UploadCloud size={28} strokeWidth={1.5} />
              <p className="text-[11px]">Belum ada logo</p>
            </div>
          )}
        </div>
        <p className="text-[11px] text-[var(--neutral-500)]">
          {user.organizationLogoUrl ? 'Logo aktif' : 'Belum diunggah'}
        </p>
      </div>

      {/* Upload pane */}
      <form onSubmit={onSubmit} className="flex min-w-0 flex-col gap-4">
        <label
          htmlFor="logo-input"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (!f || !fileRef.current) return;
            const dt = new DataTransfer();
            dt.items.add(f);
            fileRef.current.files = dt.files;
            handleFile(f);
          }}
          className={`group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 border-dashed px-4 py-6 text-center transition-colors ${
            dragOver
              ? 'border-[var(--primary-500)] bg-[var(--primary-50)]'
              : 'border-[var(--neutral-300)] bg-[var(--neutral-50)]/60 hover:border-[var(--primary-400)] hover:bg-[var(--primary-50)]/30'
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--primary-700)] ring-1 ring-[var(--neutral-200)]">
            <Upload size={16} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[var(--neutral-900)]">
              {fileName ? fileName : 'Tarik & lepas atau klik untuk pilih file'}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--neutral-500)]">
              PNG, JPG, atau WEBP · maks. 2 MB · rasio kotak disarankan
            </p>
          </div>
          <input
            id="logo-input"
            ref={fileRef}
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {user.organizationLogoUrl && (
            <Button type="button" variant="outline" onClick={onRemove} disabled={removing}>
              <Trash2 size={14} />
              {removing ? 'Menghapus…' : 'Hapus Logo'}
            </Button>
          )}
          <Button type="submit" disabled={pending}>
            <UploadCloud size={14} />
            {pending ? 'Mengunggah…' : 'Unggah Logo'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function SignatureUploadForm({ user }: { user: User }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [pending, start] = useTransition();
  const [removing, startRemove] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFile(file: File | null) {
    if (!file) {
      setPreview(null);
      setFileName(null);
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPreview(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get('signature');
    if (!(file instanceof File) || file.size === 0) {
      toast.error('Pilih file tanda tangan dulu');
      return;
    }
    start(async () => {
      const res = await uploadSignature(undefined, fd);
      if (res?.error) {
        toast.error('Gagal mengunggah', { description: res.error });
        return;
      }
      toast.success('Tanda tangan diperbarui', { description: 'TTD tersimpan & siap dicetak pada surat.' });
      setPreview(null);
      setFileName(null);
      if (fileRef.current) fileRef.current.value = '';
      router.refresh();
    });
  }

  async function onRemove() {
    if (!confirm('Hapus tanda tangan?')) return;
    startRemove(async () => {
      await removeSignature();
      toast.success('Tanda tangan dihapus');
      router.refresh();
    });
  }

  const current = preview ?? user.signatureUrl ?? null;

  return (
    <div className="grid gap-5 sm:grid-cols-[240px_minmax(0,1fr)]">
      {/* Preview pane */}
      <div className="flex flex-col items-center gap-2.5">
        <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-dashed border-[var(--neutral-300)] bg-[var(--neutral-50)]">
          {current ? (
            <Image
              src={current}
              alt="Tanda tangan"
              width={220}
              height={120}
              unoptimized
              className="h-full w-full object-contain p-3"
            />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-[var(--neutral-400)]">
              <UploadCloud size={28} strokeWidth={1.5} />
              <p className="text-[11px]">Belum ada TTD</p>
            </div>
          )}
        </div>
        <p className="text-[11px] text-[var(--neutral-500)]">
          {user.signatureUrl ? 'TTD aktif · akan otomatis tertempel di surat' : 'Belum diunggah'}
        </p>
      </div>

      {/* Upload pane */}
      <form onSubmit={onSubmit} className="flex min-w-0 flex-col gap-4">
        <label
          htmlFor="signature-input"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (!f || !fileRef.current) return;
            const dt = new DataTransfer();
            dt.items.add(f);
            fileRef.current.files = dt.files;
            handleFile(f);
          }}
          className={`group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-md)] border-2 border-dashed px-4 py-6 text-center transition-colors ${
            dragOver
              ? 'border-[var(--primary-500)] bg-[var(--primary-50)]'
              : 'border-[var(--neutral-300)] bg-[var(--neutral-50)]/60 hover:border-[var(--primary-400)] hover:bg-[var(--primary-50)]/30'
          }`}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[var(--primary-700)] ring-1 ring-[var(--neutral-200)]">
            <Upload size={16} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[var(--neutral-900)]">
              {fileName ? fileName : 'Tarik & lepas atau klik untuk pilih file'}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--neutral-500)]">
              PNG transparan disarankan · JPG / WEBP juga didukung · maks. 2 MB
            </p>
          </div>
          <input
            id="signature-input"
            ref={fileRef}
            type="file"
            name="signature"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="sr-only"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {user.signatureUrl && (
            <Button type="button" variant="outline" onClick={onRemove} disabled={removing}>
              <Trash2 size={14} />
              {removing ? 'Menghapus…' : 'Hapus TTD'}
            </Button>
          )}
          <Button type="submit" disabled={pending}>
            <UploadCloud size={14} />
            {pending ? 'Mengunggah…' : 'Unggah TTD'}
          </Button>
        </div>
      </form>
    </div>
  );
}
