import Link from 'next/link';

export function Pagination({
  total,
  page,
  pageSize,
  paramName = 'page',
}: {
  total: number;
  page: number;
  pageSize: number;
  paramName?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const link = (p: number) => `?${paramName}=${p}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white px-5 py-3 text-sm shadow-[var(--shadow-xs)]">
      <p className="text-[var(--neutral-600)]">
        Menampilkan <span className="font-semibold text-[var(--neutral-900)]">{from}</span>–
        <span className="font-semibold text-[var(--neutral-900)]">{to}</span> dari{' '}
        <span className="font-semibold text-[var(--neutral-900)]">{total}</span> data
      </p>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link
            href={link(page - 1)}
            className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--neutral-300)] bg-white px-3 text-xs font-medium text-[var(--neutral-700)] transition-colors hover:bg-[var(--neutral-50)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Sebelumnya
          </Link>
        ) : (
          <span className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--neutral-200)] bg-[var(--neutral-50)] px-3 text-xs text-[var(--neutral-400)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Sebelumnya
          </span>
        )}
        <span className="px-3 text-xs text-[var(--neutral-600)]">
          Halaman <span className="font-semibold text-[var(--neutral-900)]">{page}</span> /{' '}
          <span className="text-[var(--neutral-500)]">{totalPages}</span>
        </span>
        {page < totalPages ? (
          <Link
            href={link(page + 1)}
            className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--neutral-300)] bg-white px-3 text-xs font-medium text-[var(--neutral-700)] transition-colors hover:bg-[var(--neutral-50)]"
          >
            Berikutnya
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        ) : (
          <span className="inline-flex h-8 items-center gap-1 rounded-[var(--radius-sm)] border border-[var(--neutral-200)] bg-[var(--neutral-50)] px-3 text-xs text-[var(--neutral-400)]">
            Berikutnya
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </span>
        )}
      </div>
    </div>
  );
}
