import { redirect } from 'next/navigation';
import { requireRole, getCurrentUser } from '@/lib/auth';
import { getRequestsForRole } from '@/app/actions/approvals';
import { RequestTable } from '@/components/dashboard/RequestTable';
import { PageHeader } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import type { ActivityScope } from '@/types';

type SearchProps = { searchParams: Promise<{ page?: string }> };

export default async function WR3RequestsList({ searchParams }: SearchProps) {
  await requireRole('WR3_WD3');
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const scope = (user.userScope ?? 'UNIVERSITAS') as ActivityScope;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? '1'));
  const { items, total, pageSize } = await getRequestsForRole('WAITING_WR3_WD3', { scope, page });
  const scopeLabel = scope === 'UNIVERSITAS' ? 'Tingkat Universitas (WR3)' : 'Tingkat Fakultas (WD3)';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Pengajuan Menunggu ${scope === 'FAKULTAS' ? 'WD3' : 'WR3'}`}
        subtitle={`${total} pengajuan ${scopeLabel} menanti validasi.`}
      />
      <RequestTable rows={items} baseHref="/dashboard/wr3-wd3/requests" showUser />
      <Pagination total={total} page={page} pageSize={pageSize} />
    </div>
  );
}
