import { requireRole } from '@/lib/auth';
import { PageHeader } from '@/components/ui/Card';
import { FacilityForm } from '@/components/forms/FacilityForm';

export default async function NewFacilityPage() {
  await requireRole('ADMIN_UNIT');
  return (
    <div className="space-y-6">
      <PageHeader title="Tambah Fasilitas Baru" subtitle="Lengkapi data fasilitas yang akan didaftarkan ke sistem." />
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <FacilityForm mode="create" />
      </div>
    </div>
  );
}
