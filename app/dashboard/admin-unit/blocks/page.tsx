import { redirect } from 'next/navigation';
import { requireRole, getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getBlocks, deleteFacilityBlock } from '@/app/actions/blocks';
import { BlockForm } from '@/components/forms/BlockForm';
import { PageHeader } from '@/components/ui/Card';
import { fmtDateTime } from '@/lib/request-code';
import type { Facility, ManagingUnit } from '@/types';

function daysBetween(start: string | Date, end: string | Date): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)));
}

export default async function AdminBlocksPage() {
  await requireRole('ADMIN_UNIT');
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const bureau = (user.bureauScope ?? null) as ManagingUnit | null;

  const facilities = bureau
    ? await query<Facility>(
        'SELECT * FROM facilities WHERE isActive = 1 AND managingUnit = ? ORDER BY name',
        [bureau]
      )
    : [];
  const blocks = bureau ? await getBlocks(bureau) : [];

  const now = Date.now();
  const upcoming = blocks.filter((b) => new Date(b.endDateTime).getTime() >= now).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blokir Jadwal Fasilitas"
        subtitle="Tutup tanggal/jam tertentu untuk kegiatan internal. LK/OK tidak dapat memesan pada jadwal yang diblokir."
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form card */}
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-[var(--neutral-200)] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.08)] lg:col-span-2">
          <div className="relative border-b border-[var(--neutral-100)] px-6 py-5">
            <div
              aria-hidden
              className="absolute inset-0 opacity-60"
              style={{
                background:
                  'linear-gradient(135deg, rgba(244,63,94,0.06) 0%, transparent 60%)',
              }}
            />
            <div className="relative flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-[0_4px_12px_-2px_rgba(244,63,94,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18M9 16l3-3m0 0 3-3m-3 3-3-3m3 3 3 3" />
                </svg>
              </div>
              <div>
                <h2 className="text-[14.5px] font-bold tracking-tight text-[var(--neutral-900)]">
                  Tambah Blokir Baru
                </h2>
                <p className="mt-0.5 text-[11.5px] text-[var(--neutral-500)]">
                  Pilih fasilitas, atur rentang waktu, lalu simpan.
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <BlockForm facilities={facilities} canBlockAll={false} />
          </div>
        </div>

        {/* List card */}
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-[var(--neutral-200)] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.08)] lg:col-span-3">
          <div className="flex items-start justify-between gap-3 border-b border-[var(--neutral-100)] px-6 py-5">
            <div>
              <h2 className="text-[14.5px] font-bold tracking-tight text-[var(--neutral-900)]">
                Daftar Blokir Aktif
              </h2>
              <p className="mt-0.5 text-[11.5px] text-[var(--neutral-500)]">
                {blocks.length} blokir tercatat · {upcoming} berlaku saat ini atau akan datang.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-200">
              <span className="relative inline-flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
              </span>
              {upcoming} aktif
            </span>
          </div>

          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--neutral-100)]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--neutral-400)]">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </div>
              <p className="text-[13px] font-semibold text-[var(--neutral-700)]">Belum ada blokir jadwal</p>
              <p className="mt-1 text-[12px] text-[var(--neutral-500)]">
                Tambahkan blokir baru di panel kiri untuk menutup waktu tertentu.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--neutral-100)]">
              {blocks.map((b) => {
                const isPast = new Date(b.endDateTime).getTime() < now;
                const dur = daysBetween(b.startDateTime, b.endDateTime);
                return (
                  <li
                    key={b.id}
                    className="group/block relative flex items-start justify-between gap-4 px-6 py-5 transition-colors hover:bg-[var(--neutral-50)]/60"
                  >
                    {/* Left accent stripe */}
                    <span
                      aria-hidden
                      className={`absolute inset-y-3 left-0 w-0.5 rounded-full ${
                        isPast ? 'bg-[var(--neutral-300)]' : 'bg-gradient-to-b from-rose-400 to-rose-600'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                            isPast
                              ? 'bg-[var(--neutral-100)] text-[var(--neutral-600)] ring-[var(--neutral-200)]'
                              : 'bg-rose-50 text-rose-700 ring-rose-200'
                          }`}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21V11M15 21V11" />
                          </svg>
                          {b.facilityName ?? 'Semua Fasilitas'}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--neutral-100)] px-2 py-0.5 text-[10.5px] font-medium text-[var(--neutral-700)]">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </svg>
                          {dur} hari
                        </span>
                        {isPast && (
                          <span className="inline-flex items-center rounded-full bg-[var(--neutral-100)] px-2 py-0.5 text-[10.5px] font-medium text-[var(--neutral-500)]">
                            Selesai
                          </span>
                        )}
                      </div>
                      <p className="mt-2.5 text-[13.5px] font-semibold leading-snug text-[var(--neutral-900)]">
                        {b.reason}
                      </p>
                      <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[var(--neutral-600)]">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--neutral-400)]">
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                        {fmtDateTime(b.startDateTime)}
                        <span className="text-[var(--neutral-300)]">→</span>
                        {fmtDateTime(b.endDateTime)}
                      </p>
                      {b.createdByName && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--neutral-400)]">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          {b.createdByName}
                        </p>
                      )}
                    </div>
                    <form action={deleteFacilityBlock.bind(null, b.id)}>
                      <button
                        type="submit"
                        className="inline-flex h-8 items-center gap-1 rounded-md bg-white px-3 text-[11.5px] font-semibold text-[var(--neutral-700)] ring-1 ring-[var(--neutral-200)] opacity-80 transition-all hover:bg-rose-50 hover:text-rose-700 hover:ring-rose-200 group-hover/block:opacity-100"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" />
                        </svg>
                        Hapus
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
