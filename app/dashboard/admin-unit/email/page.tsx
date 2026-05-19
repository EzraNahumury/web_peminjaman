import { requireRole } from '@/lib/auth';
import { getEmailStatus } from '@/app/actions/mailer';
import { PageHeader } from '@/components/ui/Card';
import { EmailPanel } from '@/components/dashboard/EmailPanel';

export const dynamic = 'force-dynamic';

export default async function AdminEmailPage() {
  await requireRole('ADMIN_UNIT');
  const initial = await getEmailStatus();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrasi Email"
        subtitle="Konfigurasi SMTP untuk mengirim notifikasi email otomatis kepada pengaju."
      />
      <EmailPanel initial={initial} />
    </div>
  );
}
