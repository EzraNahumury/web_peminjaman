import Link from 'next/link';

export function Pagination({
  total,
  page,
  pageSize,
  basePath = '',
}: {
  total: number;
  page: number;
  pageSize: number;
  basePath?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const buildUrl = (p: number) => `${basePath}?page=${p}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm">
      <p className="text-slate-600">
        Menampilkan <span className="font-medium text-slate-900">{from}</span>–
        <span className="font-medium text-slate-900">{to}</span> dari{' '}
        <span className="font-medium text-slate-900">{total}</span> data
      </p>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link
            href={buildUrl(page - 1)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Sebelumnya
          </Link>
        ) : (
          <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-400">← Sebelumnya</span>
        )}
        <span className="px-3 py-1.5 text-sm text-slate-600">
          Halaman <span className="font-semibold text-slate-900">{page}</span> dari {totalPages}
        </span>
        {page < totalPages ? (
          <Link
            href={buildUrl(page + 1)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Berikutnya →
          </Link>
        ) : (
          <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-400">Berikutnya →</span>
        )}
      </div>
    </div>
  );
}
