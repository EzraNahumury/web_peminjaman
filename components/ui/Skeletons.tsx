import { Skeleton } from '@/components/ui/Card';

export function TableSkeleton({ rows = 6, showUser = false }: { rows?: number; showUser?: boolean }) {
  const cols = showUser ? 6 : 5;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Skeleton className="h-7 w-56" />
          <Skeleton className="mt-2 h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)]">
        <div className="grid gap-3 border-b border-[var(--neutral-100)] bg-[var(--neutral-50)] px-5 py-3.5" style={{ gridTemplateColumns: `repeat(${cols + 1}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols + 1 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-2/3" />
          ))}
        </div>
        <ul className="divide-y divide-[var(--neutral-100)]">
          {Array.from({ length: rows }).map((_, r) => (
            <li
              key={r}
              className="grid items-center gap-3 px-5 py-4"
              style={{ gridTemplateColumns: `repeat(${cols + 1}, minmax(0, 1fr))` }}
            >
              <Skeleton className="h-3 w-24" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-3 w-2/3" />
              {showUser && <Skeleton className="h-3 w-2/3" />}
              <div className="space-y-1">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-3 w-12 justify-self-end" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-5 shadow-[var(--shadow-xs)]">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-8 w-16" />
          <Skeleton className="mt-2 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 6, columns = 3 }: { count?: number; columns?: 2 | 3 | 4 }) {
  const grid = columns === 4 ? 'lg:grid-cols-4' : columns === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-3';
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-56" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>
      <div className={`grid gap-4 sm:grid-cols-2 ${grid}`}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-5 shadow-[var(--shadow-xs)]">
            <div className="flex items-start justify-between">
              <Skeleton className="h-10 w-10 rounded-[var(--radius-md)]" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="mt-4 h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-1/2" />
            <Skeleton className="mt-3 h-3 w-1/3" />
            <div className="mt-3 space-y-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-56" />
        <Skeleton className="mt-2 h-4 w-40" />
      </div>
      <ul className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <li
            key={i}
            className="flex items-start justify-between gap-4 rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-4 shadow-[var(--shadow-xs)]"
          >
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-[var(--radius-md)]" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-44" />
                <Skeleton className="h-3 w-64" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="h-7 w-56" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-5 shadow-[var(--shadow-xs)]">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-10 w-full" />
          </div>
        </div>
      </div>
      <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)]">
        <ul className="divide-y divide-[var(--neutral-100)]">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex items-start justify-between gap-4 p-5">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-[var(--radius-md)]" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-72" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>
      <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-8 shadow-[var(--shadow-xs)]">
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, sec) => (
            <div key={sec} className="grid gap-4 border-b border-[var(--neutral-100)] pb-6 sm:grid-cols-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
              <div className="space-y-3 sm:col-span-2">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}
