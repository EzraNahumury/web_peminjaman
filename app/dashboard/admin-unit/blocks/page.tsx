import { requireRole } from '@/lib/auth';
import { query } from '@/lib/db';
import { getBlocks, deleteFacilityBlock } from '@/app/actions/blocks';
import { BlockForm } from '@/components/forms/BlockForm';
import { PageHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { fmtDateTime } from '@/lib/request-code';
import type { Facility } from '@/types';

export default async function AdminBlocksPage() {
  await requireRole('ADMIN_UNIT');
  const facilities = await query<Facility>('SELECT * FROM facilities WHERE isActive = 1 ORDER BY managingUnit, name');
  const blocks = await getBlocks();

  return (
    <div className="space-y-6">
      <PageHeader title="Blokir Jadwal Fasilitas" subtitle="Block tanggal/jam tertentu untuk kegiatan internal. LK/OK tidak dapat memesan pada jadwal yang diblokir." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-1">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Tambah Blokir Baru</h2>
          </div>
          <div className="p-6">
            <BlockForm facilities={facilities} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-sm font-semibold text-slate-900">Daftar Blokir Aktif</h2>
            <p className="mt-0.5 text-xs text-slate-500">{blocks.length} blokir tercatat.</p>
          </div>
          {blocks.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-slate-500">Belum ada blokir jadwal.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {blocks.map((b) => (
                <li key={b.id} className="flex items-start justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                        {b.facilityName ?? 'Semua Fasilitas'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-900">{b.reason}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {fmtDateTime(b.startDateTime)} — {fmtDateTime(b.endDateTime)}
                    </p>
                    {b.createdByName && <p className="mt-0.5 text-xs text-slate-400">oleh {b.createdByName}</p>}
                  </div>
                  <form action={deleteFacilityBlock.bind(null, b.id)}>
                    <Button type="submit" variant="outline" size="sm">
                      Hapus
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
