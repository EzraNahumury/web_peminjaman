import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { PageHeader } from '@/components/ui/Card';
import {
  LogoUploadForm,
  PasswordForm,
  ProfileEditForm,
} from '@/components/forms/ProfileForms';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return (
    <div className="space-y-6">
      <PageHeader title="Profil Saya" subtitle="Kelola data akun, password, dan logo organisasi." />

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Data Akun</h2>
          <p className="mt-0.5 text-xs text-slate-500">Email dipakai sebagai username login dan tujuan notifikasi.</p>
        </div>
        <div className="p-6">
          <ProfileEditForm user={user} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Ganti Password</h2>
          <p className="mt-0.5 text-xs text-slate-500">Password baru min 6 karakter. Gunakan kombinasi yang kuat.</p>
        </div>
        <div className="p-6">
          <PasswordForm />
        </div>
      </section>

      {user.role === 'PENGURUS' && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Logo Organisasi</h2>
            <p className="mt-0.5 text-xs text-slate-500">Logo akan ditampilkan di header surat permohonan peminjaman.</p>
          </div>
          <div className="p-6">
            <LogoUploadForm user={user} />
          </div>
        </section>
      )}
    </div>
  );
}
