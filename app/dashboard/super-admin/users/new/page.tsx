import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { CreateStaffUserForm } from '@/components/dashboard/StaffUserForms';
import { PageHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function NewStaffUserPage() {
  await requireRole('SUPER_ADMIN');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tambah Akun Validator / Admin Unit"
        subtitle="Buat akun Biro III, WR3/WD3, atau Admin Unit untuk setiap biro (Biro I, Biro IV, PPLK, KRT, LPAIP)."
        breadcrumb={[
          { label: 'Manajemen User', href: '/dashboard/super-admin/users' },
          { label: 'Tambah Akun' },
        ]}
        action={
          <Link href="/dashboard/super-admin/users">
            <Button variant="outline">Kembali</Button>
          </Link>
        }
      />
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <CreateStaffUserForm />
      </div>
    </div>
  );
}
