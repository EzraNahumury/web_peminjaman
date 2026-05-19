import { requireRole, getCurrentUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { RequestForm } from '@/components/forms/RequestForm';
import type { Facility } from '@/types';

export default async function NewRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ facility?: string }>;
}) {
  await requireRole('PENGURUS');
  const sp = await searchParams;
  const lockedId = Number(sp.facility);
  const useLocked = lockedId && !Number.isNaN(lockedId);

  const [lockedFacility, allFacilities, user] = await Promise.all([
    useLocked
      ? queryOne<Facility>('SELECT * FROM facilities WHERE id = ? AND isActive = 1', [lockedId])
      : Promise.resolve(null),
    useLocked
      ? Promise.resolve([] as Facility[])
      : query<Facility>('SELECT * FROM facilities WHERE isActive = 1 ORDER BY name'),
    getCurrentUser(),
  ]);

  const heroText = lockedFacility
    ? (
        <>
          Lengkapi data kegiatan untuk{' '}
          <span className="font-medium text-[var(--neutral-900)]">{lockedFacility.name}</span>. Sistem akan
          mengecek tabrakan jadwal sebelum permohonan dapat dikirim.
        </>
      )
    : 'Pilih fasilitas (dikelompokkan per unit pengelola), lalu lengkapi detail kegiatan.';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-[var(--neutral-900)]">Ajukan Peminjaman</h1>
        <p className="mt-1 text-sm text-[var(--neutral-500)]">{heroText}</p>
      </div>
      <RequestForm
        mode="create"
        lockedFacility={lockedFacility ?? undefined}
        facilities={lockedFacility ? undefined : allFacilities}
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
  );
}
