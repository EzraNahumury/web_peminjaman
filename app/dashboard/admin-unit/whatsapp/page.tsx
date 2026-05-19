import { requireRole } from '@/lib/auth';
import { autoBootstrapWA } from '@/lib/baileys';
import { getWhatsAppStatus } from '@/app/actions/whatsapp';
import { PageHeader } from '@/components/ui/Card';
import { WhatsAppPanel } from '@/components/dashboard/WhatsAppPanel';

export const dynamic = 'force-dynamic';

export default async function AdminWhatsAppPage() {
  await requireRole('ADMIN_UNIT');
  await autoBootstrapWA();
  const initial = await getWhatsAppStatus();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrasi WhatsApp"
        subtitle="Hubungkan FASKO ke nomor WhatsApp Admin Unit untuk mengirim notifikasi otomatis ke pengaju."
      />
      <WhatsAppPanel initial={initial} />
    </div>
  );
}
