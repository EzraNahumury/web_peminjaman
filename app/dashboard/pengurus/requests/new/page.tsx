import { requireRole, getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { RequestForm } from '@/components/forms/RequestForm';
import { PageHeader } from '@/components/ui/Card';
import type { Facility } from '@/types';

export default async function NewRequestPage() {
  await requireRole('PENGURUS');
  const user = await getCurrentUser();
  const facilities = await query<Facility>('SELECT * FROM facilities WHERE isActive = 1 ORDER BY name');
  return (
    <div className="space-y-6">
      <PageHeader title="Ajukan Peminjaman Fasilitas" subtitle="Isi form lengkap. Sistem akan otomatis cek overlap jadwal." />
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <RequestForm
          mode="create"
          facilities={facilities}
          initial={
            user
              ? ({
                  email: user.email,
                  phone: user.phone ?? '',
                  organizationName: user.organizationName ?? '',
                  personInCharge: user.name,
                  identityNumber: user.identityNumber ?? '',
                } as never)
              : undefined
          }
        />
      </div>
    </div>
  );
}
