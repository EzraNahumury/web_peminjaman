'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

export type OrgRow = {
  organization: string;
  total: number;
  approved: number;
  rejected: number;
  pending: number;
};

export function OrgRequestsChart({
  data,
  title,
  subtitle,
}: {
  data: OrgRow[];
  title?: string;
  subtitle?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const grandTotal = data.reduce((s, d) => s + d.total, 0);
  const grandApproved = data.reduce((s, d) => s + d.approved, 0);
  const max = Math.max(1, ...data.map((d) => d.total));
  const niceMax = Math.ceil(max * 1.18);

  const maxIdx = useMemo(() => {
    let mi = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i].total > data[mi].total) mi = i;
    }
    return mi;
  }, [data]);

  const padding = { top: 28, right: 12, bottom: 70, left: 12 };
  const width = 760;
  const height = 320;
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const barGap = 16;
  const barW = data.length > 0 ? Math.max(20, (innerW - barGap * (data.length - 1)) / data.length) : 0;
  const yScale = (v: number) => innerH - (v / niceMax) * innerH;

  const activeIdx = hover ?? maxIdx;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="overflow-hidden rounded-2xl bg-white ring-1 ring-[var(--neutral-200)] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.08)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--neutral-100)] px-6 py-5">
        <div>
          <h2 className="text-[14.5px] font-bold tracking-tight text-[var(--neutral-900)]">
            {title ?? 'Peminjaman per Organisasi'}
          </h2>
          {subtitle && <p className="mt-0.5 text-[11.5px] text-[var(--neutral-500)]">{subtitle}</p>}
        </div>
        {data.length > 0 && grandTotal > 0 && (
          <div className="flex items-center gap-3 text-[11.5px]">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-sky-500" />
              <span className="text-[var(--neutral-500)]">Tertinggi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-[var(--neutral-300)]" />
              <span className="text-[var(--neutral-500)]">Lainnya</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        {data.length === 0 || grandTotal === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--neutral-100)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--neutral-400)]">
                <path d="M3 3v18h18" />
                <rect x="7" y="12" width="3" height="6" />
                <rect x="12" y="8" width="3" height="10" />
                <rect x="17" y="14" width="3" height="4" />
              </svg>
            </div>
            <p className="text-[12.5px] font-medium text-[var(--neutral-600)]">
              Belum ada data peminjaman per organisasi
            </p>
            <p className="text-[11.5px] text-[var(--neutral-400)]">
              Grafik akan muncul setelah ada pengajuan masuk.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-baseline gap-x-6 gap-y-1 rounded-xl bg-[var(--neutral-50)] px-4 py-3 ring-1 ring-inset ring-[var(--neutral-200)]">
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--neutral-500)]">
                  Total pengajuan
                </p>
                <p className="mt-0.5 text-xl font-bold tabular-nums text-[var(--neutral-900)]">
                  {grandTotal}
                </p>
              </div>
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--neutral-500)]">
                  Disetujui
                </p>
                <p className="mt-0.5 text-xl font-bold tabular-nums text-emerald-700">
                  {grandApproved}
                </p>
              </div>
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[var(--neutral-500)]">
                  Organisasi aktif
                </p>
                <p className="mt-0.5 text-xl font-bold tabular-nums text-[var(--neutral-900)]">
                  {data.length}
                </p>
              </div>
            </div>

            <div className="relative">
              <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="barActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#0284c7" />
                  </linearGradient>
                  <linearGradient id="barIdle" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e2e8f0" />
                    <stop offset="100%" stopColor="#cbd5e1" />
                  </linearGradient>
                </defs>

                <g transform={`translate(${padding.left}, ${padding.top})`}>
                  {/* Baseline */}
                  <line
                    x1={0}
                    y1={innerH}
                    x2={innerW}
                    y2={innerH}
                    stroke="rgba(15,23,42,0.08)"
                    strokeWidth={1}
                  />

                  {/* Bars */}
                  {data.map((d, i) => {
                    const x = i * (barW + barGap);
                    const h = (d.total / niceMax) * innerH;
                    const yTop = innerH - h;
                    const isActive = i === activeIdx;

                    return (
                      <g
                        key={d.organization}
                        onMouseEnter={() => setHover(i)}
                        onMouseLeave={() => setHover(null)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Hover hit-area */}
                        <rect
                          x={x - barGap / 2}
                          y={0}
                          width={barW + barGap}
                          height={innerH}
                          fill="transparent"
                        />

                        <motion.rect
                          initial={{ height: 0, y: innerH }}
                          animate={{ height: h, y: yTop }}
                          transition={{ duration: 0.6, delay: 0.05 + i * 0.04, ease: 'easeOut' }}
                          x={x}
                          width={barW}
                          rx={5}
                          fill={isActive ? 'url(#barActive)' : 'url(#barIdle)'}
                          style={{
                            filter: isActive ? 'drop-shadow(0 6px 12px rgba(56,189,248,0.35))' : 'none',
                            transition: 'fill 0.2s, filter 0.2s',
                          }}
                        />

                        {/* Total label on top — only for active bar */}
                        {isActive && (
                          <motion.g
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <text
                              x={x + barW / 2}
                              y={yTop - 8}
                              textAnchor="middle"
                              className="fill-sky-600"
                              style={{ fontSize: 14, fontWeight: 800 }}
                            >
                              {d.total}
                            </text>
                          </motion.g>
                        )}

                        {/* X label */}
                        <text
                          x={x + barW / 2}
                          y={innerH + 14}
                          textAnchor="end"
                          transform={`rotate(-35, ${x + barW / 2}, ${innerH + 14})`}
                          className={isActive ? 'fill-[var(--neutral-900)]' : 'fill-[var(--neutral-500)]'}
                          style={{ fontSize: 10, fontWeight: isActive ? 700 : 500 }}
                        >
                          {d.organization.length > 22 ? d.organization.slice(0, 20) + '…' : d.organization}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>

              {/* Tooltip */}
              {hover !== null && data[hover] && (
                <div
                  className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-[var(--neutral-900)] px-3 py-2 text-[11px] text-white shadow-lg"
                  style={{
                    left: `${((padding.left + hover * (barW + barGap) + barW / 2) / width) * 100}%`,
                    top: `${((padding.top + yScale(data[hover].total) - 26) / height) * 100}%`,
                  }}
                >
                  <p className="mb-1 max-w-[220px] truncate font-semibold text-white/95">
                    {data[hover].organization}
                  </p>
                  <p className="flex items-center justify-between gap-3">
                    <span className="text-white/70">Total</span>
                    <span className="font-bold tabular-nums">{data[hover].total}</span>
                  </p>
                  <p className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Disetujui
                    </span>
                    <span className="font-bold tabular-nums">{data[hover].approved}</span>
                  </p>
                  <p className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      Pending
                    </span>
                    <span className="font-bold tabular-nums">{data[hover].pending}</span>
                  </p>
                  <p className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                      Ditolak
                    </span>
                    <span className="font-bold tabular-nums">{data[hover].rejected}</span>
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
