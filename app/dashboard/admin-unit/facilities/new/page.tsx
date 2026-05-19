import { redirect } from 'next/navigation';
import { requireRole, getCurrentUser } from '@/lib/auth';
import { PageHeader } from '@/components/ui/Card';
import { FacilityForm } from '@/components/forms/FacilityForm';
import { MANAGING_UNIT_LABEL, type ManagingUnit } from '@/types';

export default async function NewFacilityPage() {
  await requireRole('ADMIN_UNIT');
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const bureau = (user.bureauScope ?? null) as ManagingUnit | null;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tambah Fasilitas Baru"
        subtitle={
          bureau
            ? `Fasilitas akan masuk ke unit ${MANAGING_UNIT_LABEL[bureau]}.`
            : 'Lengkapi data fasilitas yang akan didaftarkan ke sistem.'
        }
      />
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <FacilityForm mode="create" lockUnit={bureau ?? undefined} />
      </div>
    </div>
  );
}
