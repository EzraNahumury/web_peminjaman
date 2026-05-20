import { redirect } from 'next/navigation';
import Image from 'next/image';
import { Mail, Phone, IdCard, ShieldCheck, UserRound, KeyRound, ImageIcon, PenTool } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import {
  LogoUploadForm,
  PasswordForm,
  ProfileEditForm,
  SignatureUploadForm,
} from '@/components/forms/ProfileForms';
import type { Role } from '@/types';

const ROLE_LABEL: Record<Role, string> = {
  PENGURUS: 'Pengurus LK / OK',
  BIRO_III: 'Biro III Kemahasiswaan',
  WR3_WD3: 'WR3 / WD3',
  ADMIN_UNIT: 'Admin Biro / Unit',
  SUPER_ADMIN: 'Super Admin',
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const initials = user.name
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Hero card */}
      <section
        className="relative overflow-hidden rounded-[var(--radius-lg)] text-white shadow-[var(--shadow-md)]"
        style={{ background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-700) 100%)' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 100% 0%, rgba(255,255,255,0.6) 0%, transparent 40%), radial-gradient(circle at 0% 100%, rgba(255,255,255,0.4) 0%, transparent 35%)',
          }}
        />
        <div className="relative flex flex-wrap items-center gap-5 px-6 py-6 sm:px-8 sm:py-7">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 ring-2 ring-white/25 backdrop-blur">
            {user.role === 'PENGURUS' && user.organizationLogoUrl ? (
              <Image
                src={user.organizationLogoUrl}
                alt="Logo"
                width={80}
                height={80}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold tracking-tight">{initials || 'U'}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">
              {ROLE_LABEL[user.role]}
            </p>
            <h1 className="mt-1 truncate text-[26px] font-bold leading-tight tracking-tight sm:text-[28px]">
              {user.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-white/80">
              <span className="inline-flex items-center gap-1.5">
                <Mail size={12} className="text-white/60" />
                {user.email}
              </span>
              {user.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone size={12} className="text-white/60" />
                  {user.phone}
                </span>
              )}
              {user.identityNumber && (
                <span className="inline-flex items-center gap-1.5">
                  <IdCard size={12} className="text-white/60" />
                  {user.identityNumber}
                </span>
              )}
              {user.role === 'PENGURUS' && user.organizationName && (
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-white/60" />
                  {user.organizationName}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section 01 — Data Akun */}
      <Section
        icon={<UserRound size={15} />}
        eyebrow="01 · Identitas"
        title="Data akun & kontak"
        description="Email digunakan sebagai username login dan tujuan utama notifikasi."
      >
        <ProfileEditForm user={user} />
      </Section>

      {/* Section 02 — Password */}
      <Section
        icon={<KeyRound size={15} />}
        eyebrow="02 · Keamanan"
        title="Ganti password"
        description="Gunakan kombinasi huruf, angka, dan simbol. Minimal 6 karakter."
      >
        <PasswordForm />
      </Section>

      {/* Section 03 — Logo Organisasi (Pengurus only) */}
      {user.role === 'PENGURUS' && (
        <Section
          icon={<ImageIcon size={15} />}
          eyebrow="03 · Branding"
          title="Logo organisasi"
          description="Logo akan dicetak pada header surat permohonan peminjaman."
        >
          <LogoUploadForm user={user} />
        </Section>
      )}

      {/* Section 04 — Tanda Tangan (semua role yang menandatangani surat) */}
      {(user.role === 'PENGURUS' ||
        user.role === 'BIRO_III' ||
        user.role === 'WR3_WD3' ||
        user.role === 'ADMIN_UNIT') && (
        <Section
          icon={<PenTool size={15} />}
          eyebrow={user.role === 'PENGURUS' ? '04 · Tanda Tangan' : '03 · Tanda Tangan'}
          title="Tanda tangan digital"
          description="Unggah TTD (PNG transparan disarankan). Akan otomatis tertempel di atas nama Anda pada surat permohonan yang Anda tandatangani."
        >
          <SignatureUploadForm user={user} />
        </Section>
      )}
    </div>
  );
}

function Section({
  icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)]">
      <header className="flex items-start gap-3 border-b border-[var(--neutral-100)] px-5 py-4 sm:px-6">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-50)] text-[var(--primary-700)] ring-1 ring-[var(--primary-100)]">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--neutral-500)]">
            {eyebrow}
          </p>
          <h2 className="mt-0.5 text-[15px] font-semibold tracking-tight text-[var(--neutral-900)]">{title}</h2>
          {description && <p className="mt-1 text-[12px] text-[var(--neutral-500)]">{description}</p>}
        </div>
      </header>
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}
