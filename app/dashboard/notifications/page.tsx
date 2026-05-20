import Link from 'next/link';
import { Bell, Clock, CheckCircle2, XCircle, Info, RefreshCw, ChevronRight, Lightbulb } from 'lucide-react';
import { verifySession } from '@/lib/auth';
import { getNotifications } from '@/lib/notifications';
import { markAllNotificationsAsRead } from '@/app/actions/notifications';
import type { Notification } from '@/types';

type FilterKey = 'semua' | 'unread' | 'menunggu' | 'disetujui' | 'jadwal' | 'ditolak';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'semua', label: 'Semua' },
  { key: 'unread', label: 'Belum dibaca' },
  { key: 'menunggu', label: 'Menunggu' },
  { key: 'disetujui', label: 'Disetujui' },
  { key: 'jadwal', label: 'Jadwal Ulang' },
  { key: 'ditolak', label: 'Ditolak' },
];

type Kind = 'menunggu' | 'disetujui' | 'ditolak' | 'jadwal' | 'info';

function categorize(n: Notification): Kind {
  const t = `${n.title} ${n.message}`.toLowerCase();
  if (/(ditolak|reject)/.test(t)) return 'ditolak';
  if (/(menunggu|antrian|diajukan|menanti|antre|antrean|baru register|menunggu validasi|menunggu review)/.test(t))
    return 'menunggu';
  if (/(alternatif|jadwal ulang|ditahan|hold|resume|dilanjutkan|revisi|revision)/.test(t)) return 'jadwal';
  if (/(setuju|approved|disetujui|sah)/.test(t)) return 'disetujui';
  return 'info';
}

function matchFilter(n: Notification, filter: FilterKey): boolean {
  if (filter === 'semua') return true;
  if (filter === 'unread') return !n.isRead;
  return categorize(n) === filter;
}

const ID_FMT = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});
const ID_TODAY = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' });

function relativeTime(d: Date): string {
  const now = Date.now();
  const ts = d.getTime();
  const diff = (now - ts) / 1000;
  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 172800) return `Kemarin, ${ID_TODAY.format(d)}`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
  return ID_FMT.format(d);
}

const PILL: Record<Kind, { label: string; bg: string; fg: string; dot: string; icon: React.ReactNode; iconBg: string }> = {
  menunggu: {
    label: 'Menunggu',
    bg: 'bg-amber-50',
    fg: 'text-amber-800',
    dot: 'bg-amber-500',
    icon: <Clock size={16} />,
    iconBg: 'bg-amber-50 text-amber-700 ring-amber-100',
  },
  disetujui: {
    label: 'Disetujui',
    bg: 'bg-[var(--primary-50)]',
    fg: 'text-[var(--primary-800)]',
    dot: 'bg-[var(--primary-500)]',
    icon: <CheckCircle2 size={16} />,
    iconBg: 'bg-[var(--primary-50)] text-[var(--primary-700)] ring-[var(--primary-100)]',
  },
  ditolak: {
    label: 'Ditolak',
    bg: 'bg-rose-50',
    fg: 'text-rose-800',
    dot: 'bg-rose-500',
    icon: <XCircle size={16} />,
    iconBg: 'bg-rose-50 text-rose-700 ring-rose-100',
  },
  jadwal: {
    label: 'Tindak Lanjut',
    bg: 'bg-sky-50',
    fg: 'text-sky-800',
    dot: 'bg-sky-500',
    icon: <RefreshCw size={16} />,
    iconBg: 'bg-sky-50 text-sky-700 ring-sky-100',
  },
  info: {
    label: 'Info',
    bg: 'bg-[var(--neutral-100)]',
    fg: 'text-[var(--neutral-700)]',
    dot: 'bg-[var(--neutral-400)]',
    icon: <Info size={16} />,
    iconBg: 'bg-[var(--neutral-100)] text-[var(--neutral-600)] ring-[var(--neutral-200)]',
  },
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await verifySession();
  const items = await getNotifications(session.userId);
  const sp = await searchParams;
  const tab = (FILTERS.find((f) => f.key === sp.tab)?.key ?? 'semua') as FilterKey;

  const counts: Record<FilterKey, number> = {
    semua: items.length,
    unread: items.filter((n) => !n.isRead).length,
    menunggu: items.filter((n) => categorize(n) === 'menunggu').length,
    disetujui: items.filter((n) => categorize(n) === 'disetujui').length,
    jadwal: items.filter((n) => categorize(n) === 'jadwal').length,
    ditolak: items.filter((n) => categorize(n) === 'ditolak').length,
  };
  const filtered = items.filter((n) => matchFilter(n, tab));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-[var(--neutral-900)]">Notifikasi</h1>
          <p className="mt-1 text-sm text-[var(--neutral-500)]">
            {counts.unread > 0
              ? `${counts.unread} notifikasi belum dibaca.`
              : 'Semua notifikasi sudah dibaca.'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Filter pane */}
        <aside className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-3 shadow-[var(--shadow-xs)]">
            <p className="px-2 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--neutral-500)]">
              Saringan
            </p>
            <ul className="space-y-0.5">
              {FILTERS.map((f) => {
                const active = f.key === tab;
                const c = counts[f.key];
                return (
                  <li key={f.key}>
                    <Link
                      href={f.key === 'semua' ? '?' : `?tab=${f.key}`}
                      className={
                        active
                          ? 'flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--primary-50)] px-3 py-2 text-[13px] font-semibold text-[var(--primary-800)] ring-1 ring-[var(--primary-100)]'
                          : 'flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2 text-[13px] font-medium text-[var(--neutral-700)] transition-colors hover:bg-[var(--neutral-50)] hover:text-[var(--neutral-900)]'
                      }
                    >
                      <span>{f.label}</span>
                      <span
                        className={
                          active
                            ? 'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1.5 text-[10.5px] font-bold tabular-nums text-[var(--primary-800)] ring-1 ring-[var(--primary-100)]'
                            : 'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--neutral-100)] px-1.5 text-[10.5px] font-bold tabular-nums text-[var(--neutral-600)]'
                        }
                      >
                        {c}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-[var(--neutral-50)] p-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--neutral-500)]">Tip</p>
            <div className="mt-2 flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-200">
                <Lightbulb size={13} />
              </div>
              <p className="text-[12px] leading-relaxed text-[var(--neutral-700)]">
                Cek halaman ini secara berkala agar tidak melewatkan persetujuan atau permintaan revisi dari admin.
              </p>
            </div>
          </div>
        </aside>

        {/* Notification list */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <p className="text-[15px] font-semibold text-[var(--neutral-900)]">
                {filtered.length} notifikasi
              </p>
              {counts.unread > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-50)] px-2 py-0.5 text-[11px] font-medium text-[var(--primary-800)] ring-1 ring-[var(--primary-100)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary-500)]" />
                  {counts.unread} belum dibaca
                </span>
              )}
            </div>
            {counts.unread > 0 && (
              <form action={markAllNotificationsAsRead}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-[var(--neutral-200)] bg-white px-3 py-1.5 text-[12px] font-medium text-[var(--neutral-700)] transition-colors hover:bg-[var(--neutral-50)]"
                >
                  <CheckCircle2 size={13} />
                  Tandai semua dibaca
                </button>
              </form>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--neutral-300)] bg-white py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--neutral-100)] text-[var(--neutral-400)]">
                <Bell size={20} />
              </div>
              <p className="mt-3 text-sm font-medium text-[var(--neutral-800)]">Tidak ada notifikasi</p>
              <p className="mt-1 text-xs text-[var(--neutral-500)]">
                Pilih saringan lain untuk melihat notifikasi.
              </p>
            </div>
          ) : (
            <NotificationGroups items={filtered} />
          )}

          {filtered.length > 0 && (
            <p className="px-1 text-center text-[11px] text-[var(--neutral-400)]">
              Menampilkan {filtered.length} notifikasi terbaru. Riwayat lebih dari 50 entri otomatis disembunyikan.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function bucketOf(d: Date): 'today' | 'yesterday' | 'week' | 'older' {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86_400_000;
  const startOfWeek = startOfToday - 6 * 86_400_000;
  const t = d.getTime();
  if (t >= startOfToday) return 'today';
  if (t >= startOfYesterday) return 'yesterday';
  if (t >= startOfWeek) return 'week';
  return 'older';
}

const BUCKET_LABEL: Record<'today' | 'yesterday' | 'week' | 'older', string> = {
  today: 'Hari ini',
  yesterday: 'Kemarin',
  week: '7 hari terakhir',
  older: 'Lebih lama',
};

function NotificationGroups({ items }: { items: Notification[] }) {
  const groups = {
    today: [] as Notification[],
    yesterday: [] as Notification[],
    week: [] as Notification[],
    older: [] as Notification[],
  };
  for (const n of items) {
    groups[bucketOf(new Date(n.createdAt))].push(n);
  }

  return (
    <div className="space-y-6">
      {(['today', 'yesterday', 'week', 'older'] as const).map((k) => {
        const list = groups[k];
        if (list.length === 0) return null;
        return (
          <section key={k}>
            <div className="mb-2 flex items-center gap-2 px-1">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[var(--neutral-500)]">
                {BUCKET_LABEL[k]}
              </p>
              <span className="h-px flex-1 bg-[var(--neutral-200)]" />
              <span className="text-[10.5px] font-medium text-[var(--neutral-400)]">{list.length}</span>
            </div>
            <ul className="space-y-1.5">
              {list.map((n) => (
                <NotificationCard key={n.id} n={n} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function NotificationCard({ n }: { n: Notification }) {
  const kind = categorize(n);
  const p = PILL[kind];
  const created = new Date(n.createdAt);
  const isNew = !n.isRead && Date.now() - created.getTime() < 6 * 3600 * 1000;
  const unread = !n.isRead;

  const inner = (
    <article
      className={
        'group relative flex items-start gap-3 rounded-[var(--radius-lg)] border bg-white px-4 py-3.5 shadow-[var(--shadow-xs)] transition-all hover:-translate-y-0.5 hover:border-[var(--neutral-300)] hover:shadow-[var(--shadow-sm)] ' +
        (unread ? 'border-[var(--primary-100)] bg-[var(--primary-50)]/40' : 'border-[var(--neutral-200)]')
      }
    >
      {unread && (
        <span className="absolute left-0 top-3 h-[calc(100%-1.5rem)] w-[3px] rounded-r-full bg-[var(--primary-500)]" />
      )}
      <div
        className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ${p.iconBg}`}
      >
        {p.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="text-[14px] font-semibold leading-snug text-[var(--neutral-900)]">{n.title}</h3>
          {isNew && (
            <span className="rounded-sm bg-[var(--accent-gold)] px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-white">
              Baru
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-[var(--neutral-600)]">{n.message}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${p.bg} ${p.fg}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
            {p.label}
          </span>
          <span className="text-[var(--neutral-500)]">{relativeTime(created)}</span>
        </div>
      </div>
      {n.link && (
        <ChevronRight
          size={15}
          className="mt-3 shrink-0 self-start text-[var(--neutral-300)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--neutral-500)]"
        />
      )}
    </article>
  );

  return n.link ? (
    <li>
      <Link href={n.link} className="block">
        {inner}
      </Link>
    </li>
  ) : (
    <li>{inner}</li>
  );
}
