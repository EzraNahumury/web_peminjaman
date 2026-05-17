import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { getMyRequests } from '@/app/actions/requests';
import { RequestTable } from '@/components/dashboard/RequestTable';

export default async function MyRequestsPage() {
  await requireRole('PENGURUS');
  const rows = await getMyRequests();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pengajuan Saya</h1>
        <Link
          href="/dashboard/pengurus/requests/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Ajukan Baru
        </Link>
      </div>
      <RequestTable rows={rows} baseHref="/dashboard/pengurus/requests" />
    </div>
  );
}
