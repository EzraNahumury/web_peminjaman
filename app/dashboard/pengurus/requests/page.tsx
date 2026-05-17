import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { getMyRequests } from '@/app/actions/requests';
import { RequestTable } from '@/components/dashboard/RequestTable';
import { PageHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function MyRequestsPage() {
  await requireRole('PENGURUS');
  const rows = await getMyRequests();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengajuan Saya"
        subtitle={`${rows.length} pengajuan tercatat.`}
        action={
          <Link href="/dashboard/pengurus/requests/new">
            <Button>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Ajukan Baru
            </Button>
          </Link>
        }
      />
      <RequestTable rows={rows} baseHref="/dashboard/pengurus/requests" />
    </div>
  );
}
