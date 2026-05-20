'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

type Point = { date: string; total: number; approved: number };

type Props = {
  data: Point[];
  title?: string;
  subtitle?: string;
};

export function BookingsTrendChart({ data, title, subtitle }: Props) {
  const [hover, setHover] = useState<number | null>(null);

  const padding = { top: 24, right: 16, bottom: 32, left: 36 };
  const width = 720;
  const height = 240;
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const max = useMemo(() => {
    const m = Math.max(1, ...data.map((d) => d.total));
    return Math.ceil(m * 1.2);
  }, [data]);

  const xStep = data.length > 1 ? innerW / (data.length - 1) : innerW;
  const yScale = (v: number) => innerH - (v / max) * innerH;

  const linePath = useMemo(() => {
    if (data.length === 0) return '';
    return data
      .map((d, i) => {
        const x = i * xStep;
        const y = yScale(d.total);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  }, [data, xStep, max]);

  const areaPath = useMemo(() => {
    if (data.length === 0) return '';
    const top = data
      .map((d, i) => {
        const x = i * xStep;
        const y = yScale(d.total);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
    return `${top} L ${(data.length - 1) * xStep} ${innerH} L 0 ${innerH} Z`;
  }, [data, xStep, max]);

  const approvedPath = useMemo(() => {
    if (data.length === 0) return '';
    return data
      .map((d, i) => {
        const x = i * xStep;
        const y = yScale(d.approved);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ');
  }, [data, xStep, max]);

  const total = data.reduce((s, d) => s + d.total, 0);
  const approved = data.reduce((s, d) => s + d.approved, 0);
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((p) => Math.round(max * p));
  const xLabelEvery = data.length > 14 ? Math.ceil(data.length / 7) : 2;

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
            {title ?? 'Tren Peminjaman'}
          </h2>
          {subtitle && <p className="mt-0.5 text-[11.5px] text-[var(--neutral-500)]">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-4 text-[11.5px]">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--primary-600)]" />
            <span className="text-[var(--neutral-500)]">Total</span>
            <span className="font-bold tabular-nums text-[var(--neutral-900)]">{total}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[var(--neutral-500)]">Disetujui</span>
            <span className="font-bold tabular-nums text-[var(--neutral-900)]">{approved}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-[var(--primary-50)] px-2.5 py-1 ring-1 ring-inset ring-[var(--primary-100)]">
            <span className="text-[var(--primary-700)]">Rate</span>
            <span className="font-bold tabular-nums text-[var(--primary-800)]">{approvalRate}%</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        {data.length === 0 || total === 0 ? (
          <div className="flex h-[240px] flex-col items-center justify-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--neutral-100)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--neutral-400)]">
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
            </div>
            <p className="text-[12.5px] font-medium text-[var(--neutral-600)]">Belum ada data peminjaman</p>
            <p className="text-[11.5px] text-[var(--neutral-400)]">Grafik akan muncul ketika pengajuan masuk.</p>
          </div>
        ) : (
          <div className="relative">
            <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary-500)" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="var(--primary-500)" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="trendLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--primary-600)" />
                  <stop offset="100%" stopColor="var(--primary-800)" />
                </linearGradient>
              </defs>

              {/* Grid + Y labels */}
              <g transform={`translate(${padding.left}, ${padding.top})`}>
                {yTicks.map((t, i) => {
                  const y = yScale(t);
                  return (
                    <g key={i}>
                      <line x1={0} y1={y} x2={innerW} y2={y} stroke="rgba(15,23,42,0.06)" strokeDasharray="3 3" />
                      <text
                        x={-8}
                        y={y + 3}
                        textAnchor="end"
                        className="fill-[var(--neutral-400)]"
                        style={{ fontSize: 9.5, fontWeight: 500 }}
                      >
                        {t}
                      </text>
                    </g>
                  );
                })}

                {/* Area */}
                <path d={areaPath} fill="url(#trendArea)" />

                {/* Total line */}
                <path d={linePath} fill="none" stroke="url(#trendLine)" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />

                {/* Approved line */}
                <path d={approvedPath} fill="none" stroke="#10b981" strokeWidth={1.6} strokeDasharray="4 3" strokeLinejoin="round" strokeLinecap="round" />

                {/* Hover overlays */}
                {data.map((d, i) => {
                  const x = i * xStep;
                  return (
                    <g key={i}>
                      <rect
                        x={x - xStep / 2}
                        y={0}
                        width={xStep}
                        height={innerH}
                        fill="transparent"
                        onMouseEnter={() => setHover(i)}
                        onMouseLeave={() => setHover(null)}
                        style={{ cursor: 'pointer' }}
                      />
                      {hover === i && (
                        <>
                          <line x1={x} y1={0} x2={x} y2={innerH} stroke="var(--primary-600)" strokeWidth={1} strokeDasharray="3 3" opacity={0.55} />
                          <circle cx={x} cy={yScale(d.total)} r={5} fill="white" stroke="var(--primary-700)" strokeWidth={2.5} />
                          {d.approved > 0 && (
                            <circle cx={x} cy={yScale(d.approved)} r={4} fill="white" stroke="#10b981" strokeWidth={2.2} />
                          )}
                        </>
                      )}
                    </g>
                  );
                })}

                {/* X labels */}
                {data.map((d, i) => {
                  if (i % xLabelEvery !== 0 && i !== data.length - 1) return null;
                  const x = i * xStep;
                  const dt = new Date(d.date);
                  const label = `${dt.getDate()}/${dt.getMonth() + 1}`;
                  return (
                    <text
                      key={i}
                      x={x}
                      y={innerH + 18}
                      textAnchor="middle"
                      className="fill-[var(--neutral-400)]"
                      style={{ fontSize: 10, fontWeight: 500 }}
                    >
                      {label}
                    </text>
                  );
                })}
              </g>
            </svg>

            {/* Tooltip */}
            {hover !== null && data[hover] && (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-[var(--neutral-900)] px-3 py-2 text-[11px] text-white shadow-lg"
                style={{
                  left: `${((padding.left + hover * xStep) / width) * 100}%`,
                  top: `${(yScale(data[hover].total) + padding.top - 8) / height * 100}%`,
                }}
              >
                <p className="mb-1 font-semibold text-white/95">
                  {new Date(data[hover].date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
                <p className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary-400)]" />
                    Total
                  </span>
                  <span className="font-bold tabular-nums">{data[hover].total}</span>
                </p>
                <p className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Disetujui
                  </span>
                  <span className="font-bold tabular-nums">{data[hover].approved}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

type Slice = { label: string; value: number };

export function CategoryBreakdownChart({ data, title, subtitle }: { data: Slice[]; title?: string; subtitle?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const max = Math.max(1, ...data.map((d) => d.value));
  const palette = [
    'from-emerald-500 to-teal-600',
    'from-sky-500 to-blue-600',
    'from-violet-500 to-purple-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-cyan-500 to-sky-600',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05, ease: 'easeOut' }}
      className="overflow-hidden rounded-2xl bg-white ring-1 ring-[var(--neutral-200)] shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.08)]"
    >
      <div className="border-b border-[var(--neutral-100)] px-6 py-5">
        <h2 className="text-[14.5px] font-bold tracking-tight text-[var(--neutral-900)]">{title ?? 'Distribusi per Kategori'}</h2>
        {subtitle && <p className="mt-0.5 text-[11.5px] text-[var(--neutral-500)]">{subtitle}</p>}
      </div>
      <div className="p-6">
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--neutral-100)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--neutral-400)]">
                <rect x="3" y="12" width="6" height="9" rx="1" />
                <rect x="10" y="6" width="6" height="15" rx="1" />
                <rect x="17" y="9" width="4" height="12" rx="1" />
              </svg>
            </div>
            <p className="text-[12.5px] font-medium text-[var(--neutral-600)]">Belum ada data kategori</p>
          </div>
        ) : (
          <ul className="space-y-3.5">
            {data.map((d, i) => {
              const pct = (d.value / max) * 100;
              const share = total > 0 ? Math.round((d.value / total) * 100) : 0;
              return (
                <li key={d.label}>
                  <div className="mb-1.5 flex items-center justify-between text-[12px]">
                    <span className="truncate font-semibold text-[var(--neutral-800)]">{d.label}</span>
                    <span className="ml-3 shrink-0 tabular-nums text-[var(--neutral-500)]">
                      <span className="font-bold text-[var(--neutral-900)]">{d.value}</span>
                      <span className="ml-1.5 text-[var(--neutral-400)]">· {share}%</span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--neutral-100)]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, delay: 0.1 + i * 0.05, ease: 'easeOut' }}
                      className={`h-full rounded-full bg-gradient-to-r ${palette[i % palette.length]}`}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
