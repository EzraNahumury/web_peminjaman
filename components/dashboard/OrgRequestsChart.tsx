'use client';

import { useId, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

export type OrgRow = {
  organization: string;
  total: number;
  approved: number;
  rejected: number;
  pending: number;
};

const STATUS = [
  { key: 'approved' as const, label: 'Disetujui', color: 'bg-emerald-500', ring: 'ring-emerald-200' },
  { key: 'pending' as const, label: 'Dalam proses', color: 'bg-amber-400', ring: 'ring-amber-200' },
  { key: 'rejected' as const, label: 'Ditolak', color: 'bg-rose-400', ring: 'ring-rose-200' },
];

function pct(part: number, whole: number) {
  return whole > 0 ? (part / whole) * 100 : 0;
}

export function OrgRequestsChart({
  data,
  title,
  subtitle,
}: {
  data: OrgRow[];
  title?: string;
  subtitle?: string;
}) {
  const chartId = useId().replace(/:/g, '');
  const [hover, setHover] = useState<number | null>(null);

  const grandTotal = data.reduce((s, d) => s + d.total, 0);
  const grandApproved = data.reduce((s, d) => s + d.approved, 0);
  const grandPending = data.reduce((s, d) => s + d.pending, 0);
  const grandRejected = data.reduce((s, d) => s + d.rejected, 0);
  const maxTotal = Math.max(1, ...data.map((d) => d.total));
  const approvalRate = grandTotal > 0 ? Math.round((grandApproved / grandTotal) * 100) : 0;

  const xTicks = useMemo(() => {
    const step = Math.max(1, Math.ceil(maxTotal / 4));
    const ticks: number[] = [];
    for (let t = 0; t <= maxTotal; t += step) ticks.push(t);
    if (ticks[ticks.length - 1] !== maxTotal) ticks.push(maxTotal);
    return [...new Set(ticks)];
  }, [maxTotal]);

  const activeIdx = hover ?? (data.length > 0 ? 0 : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="overflow-hidden rounded-2xl bg-white ring-1 ring-[var(--neutral-200)] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.08)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--neutral-100)] bg-gradient-to-r from-[var(--neutral-50)]/80 to-white px-6 py-5">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight text-[var(--neutral-900)]">
            {title ?? 'Peminjaman per Organisasi'}
          </h2>
          {subtitle && <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-[var(--neutral-500)]">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {STATUS.map((s) => (
            <span
              key={s.key}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--neutral-600)] ring-1 ring-inset ring-[var(--neutral-200)]"
            >
              <span className={`h-2 w-2 rounded-full ${s.color}`} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <div className="p-6">
        {data.length === 0 || grandTotal === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--neutral-100)]">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[var(--neutral-400)]"
              >
                <path d="M3 3v18h18" />
                <rect x="7" y="12" width="3" height="6" />
                <rect x="12" y="8" width="3" height="10" />
                <rect x="17" y="14" width="3" height="4" />
              </svg>
            </div>
            <p className="text-[13px] font-medium text-[var(--neutral-700)]">Belum ada data peminjaman per organisasi</p>
            <p className="text-[12px] text-[var(--neutral-400)]">Grafik perbandingan akan muncul setelah ada pengajuan masuk.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-3 sm:grid-cols-4">
              {[
                { label: 'Total pengajuan', value: grandTotal, tone: 'text-[var(--neutral-900)]' },
                { label: 'Tingkat disetujui', value: `${approvalRate}%`, tone: 'text-emerald-700' },
                { label: 'Dalam proses', value: grandPending, tone: 'text-amber-700' },
                { label: 'Ditolak / batal', value: grandRejected, tone: 'text-rose-700' },
              ].map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.04 }}
                  className="rounded-xl bg-[var(--neutral-50)] px-4 py-3 ring-1 ring-inset ring-[var(--neutral-200)]"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--neutral-500)]">
                    {kpi.label}
                  </p>
                  <p className={`mt-1 text-xl font-bold tabular-nums tracking-tight ${kpi.tone}`}>{kpi.value}</p>
                </motion.div>
              ))}
            </div>

            <p className="mb-3 text-[11px] text-[var(--neutral-500)]">
              Panjang bar = jumlah pengajuan · warna = komposisi status (ideal untuk membandingkan organisasi)
            </p>

            <div className="space-y-2.5">
              {data.map((d, i) => {
                const isActive = activeIdx === i;
                const barWidthPct = (d.total / maxTotal) * 100;
                const segments = [
                  { key: 'approved', value: d.approved, pct: pct(d.approved, d.total), class: STATUS[0].color },
                  { key: 'pending', value: d.pending, pct: pct(d.pending, d.total), class: STATUS[1].color },
                  { key: 'rejected', value: d.rejected, pct: pct(d.rejected, d.total), class: STATUS[2].color },
                ].filter((s) => s.value > 0);

                return (
                  <motion.div
                    key={`${chartId}-${d.organization}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.035, duration: 0.35 }}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(null)}
                    className={`grid grid-cols-[minmax(0,9.5rem)_1fr_auto] items-center gap-3 rounded-xl px-2 py-1.5 transition-colors ${
                      isActive ? 'bg-[var(--primary-50)]/60 ring-1 ring-inset ring-[var(--primary-100)]' : 'hover:bg-[var(--neutral-50)]'
                    }`}
                  >
                    <div className="min-w-0">
                      <p
                        className={`truncate text-[12px] font-semibold ${isActive ? 'text-[var(--primary-900)]' : 'text-[var(--neutral-800)]'}`}
                        title={d.organization}
                      >
                        {d.organization}
                      </p>
                      {isActive && (
                        <p className="mt-0.5 text-[10px] tabular-nums text-[var(--neutral-500)]">
                          {d.approved} setuju · {d.pending} proses · {d.rejected} tolak
                        </p>
                      )}
                    </div>

                    <div className="relative min-w-0">
                      <div
                        className="h-8 overflow-hidden rounded-lg bg-[var(--neutral-100)] ring-1 ring-inset ring-[var(--neutral-200)]/80 transition-[width] duration-300"
                        style={{ width: `${Math.max(barWidthPct, d.total > 0 ? 3 : 0)}%` }}
                      >
                        <div className="flex h-full w-full min-w-[2rem]">
                          {segments.map((seg, si) => (
                            <motion.div
                              key={seg.key}
                              initial={{ width: 0 }}
                              animate={{ width: `${seg.pct}%` }}
                              transition={{ duration: 0.55, delay: 0.1 + i * 0.03 + si * 0.02, ease: 'easeOut' }}
                              className={`h-full ${seg.class} ${si === 0 ? 'rounded-l-lg' : ''} ${si === segments.length - 1 ? 'rounded-r-lg' : ''}`}
                              title={`${STATUS.find((s) => s.key === seg.key)?.label}: ${seg.value}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`w-8 text-right text-[13px] font-bold tabular-nums ${isActive ? 'text-[var(--primary-800)]' : 'text-[var(--neutral-800)]'}`}
                    >
                      {d.total}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-[minmax(0,9.5rem)_1fr_auto] items-center gap-3 border-t border-[var(--neutral-100)] pt-3">
              <span />
              <div className="flex justify-between text-[10px] font-medium tabular-nums text-[var(--neutral-400)]">
                {xTicks.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <span className="w-8 text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--neutral-400)]">Σ</span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

/** Distribusi status keseluruhan — donut untuk proporsi bagian-dari-keseluruhan */
export function RequestStatusDonut({
  approved,
  pending,
  rejected,
  title,
  subtitle,
}: {
  approved: number;
  pending: number;
  rejected: number;
  title?: string;
  subtitle?: string;
}) {
  const total = approved + pending + rejected;
  const slices = [
    { label: 'Disetujui', value: approved, color: '#10b981', stroke: '#059669' },
    { label: 'Dalam proses', value: pending, color: '#fbbf24', stroke: '#d97706' },
    { label: 'Ditolak / batal', value: rejected, color: '#fb7185', stroke: '#e11d48' },
  ].filter((s) => s.value > 0);

  const r = 52;
  const c = 2 * Math.PI * r;
  let cumulative = 0;
  const arcs = slices.map((s) => {
    const len = (s.value / total) * c;
    const arc = { ...s, dasharray: `${len} ${c - len}`, dashoffset: -cumulative };
    cumulative += len;
    return arc;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.06, ease: 'easeOut' }}
      className="flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-[var(--neutral-200)] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.08)]"
    >
      <div className="border-b border-[var(--neutral-100)] px-6 py-5">
        <h2 className="text-[15px] font-bold tracking-tight text-[var(--neutral-900)]">
          {title ?? 'Distribusi Status'}
        </h2>
        {subtitle && <p className="mt-1 text-[12px] text-[var(--neutral-500)]">{subtitle}</p>}
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
        {total === 0 ? (
          <p className="text-center text-[12px] text-[var(--neutral-500)]">Belum ada pengajuan pada periode ini.</p>
        ) : (
          <>
            <div className="relative">
              <svg width={140} height={140} viewBox="0 0 140 140" className="-rotate-90">
                <circle cx={70} cy={70} r={r} fill="none" stroke="var(--neutral-100)" strokeWidth={14} />
                {arcs.map((s, i) => (
                  <motion.circle
                    key={s.label}
                    cx={70}
                    cy={70}
                    r={r}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={14}
                    strokeLinecap="butt"
                    strokeDasharray={s.dasharray}
                    strokeDashoffset={s.dashoffset}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 + i * 0.08 }}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tabular-nums text-[var(--neutral-900)]">{total}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--neutral-500)]">
                  pengajuan
                </span>
              </div>
            </div>
            <ul className="w-full space-y-2.5">
              {slices.map((s) => (
                <li key={s.label} className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="flex items-center gap-2 font-medium text-[var(--neutral-700)]">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.label}
                  </span>
                  <span className="tabular-nums text-[var(--neutral-600)]">
                    <span className="font-bold text-[var(--neutral-900)]">{s.value}</span>
                    <span className="ml-1.5 text-[var(--neutral-400)]">({Math.round((s.value / total) * 100)}%)</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </motion.div>
  );
}
