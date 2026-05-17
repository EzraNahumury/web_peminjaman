import { requireRole, getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { RequestForm } from '@/components/forms/RequestForm';
import type { Facility } from '@/types';

export default async function NewRequestPage() {
  await requireRole('PENGURUS');
  const user = await getCurrentUser();
  const facilities = await query<Facility>('SELECT * FROM facilities WHERE isActive = 1 ORDER BY name');
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ajukan Peminjaman Fasilitas</h1>
        <p className="text-sm text-gray-500">Isi form berikut. Sistem akan mengecek overlap otomatis.</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-6">
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
