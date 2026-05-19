'use client';
import { motion, type HTMLMotionProps } from 'framer-motion';

export function Card({
  children,
  className = '',
  hover = false,
  ...rest
}: HTMLMotionProps<'div'> & { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <motion.div
      {...rest}
      className={`rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)] ${
        hover ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] hover:border-[var(--neutral-300)]' : ''
      } ${className}`}
    >
      {children}
    </motion.div>
  );
}

type Tone = 'primary' | 'amber' | 'blue' | 'rose' | 'violet' | 'slate';

const TONE_ICON_BG: Record<Tone, string> = {
  primary: 'bg-[var(--primary-50)] text-[var(--primary-700)] ring-[var(--primary-100)]',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  blue: 'bg-sky-50 text-sky-700 ring-sky-100',
  rose: 'bg-rose-50 text-rose-700 ring-rose-100',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  slate: 'bg-slate-50 text-slate-700 ring-slate-200',
};

const TONE_ICON: Record<Tone, string> = {
  primary: 'M20 6 9 17l-5-5',
  amber: 'M12 9v4M12 17h.01M5.07 19h13.86A2 2 0 0 0 20.66 16L13.73 4a2 2 0 0 0-3.46 0L3.34 16A2 2 0 0 0 5.07 19Z',
  blue: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83',
  rose: 'M18 6 6 18M6 6l12 12',
  violet: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  slate: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
};

export function StatCard({
  label,
  value,
  hint,
  tone = 'primary',
  delta,
  index = 0,
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: Tone;
  delta?: { value: string; positive?: boolean };
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: 'easeOut' }}
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-5 shadow-[var(--shadow-xs)] transition-shadow duration-200 hover:shadow-[var(--shadow-md)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-[var(--neutral-500)]">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--neutral-900)] tabular-nums">{value}</p>
          {(hint || delta) && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              {delta && (
                <span
                  className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium ${
                    delta.positive
                      ? 'bg-[var(--primary-50)] text-[var(--primary-700)]'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {delta.positive ? '↑' : '↓'} {delta.value}
                </span>
              )}
              {hint && <span className="text-[var(--neutral-500)]">{hint}</span>}
            </div>
          )}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] ring-1 ${TONE_ICON_BG[tone]}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={TONE_ICON[tone]} />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  breadcrumb,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-wrap items-end justify-between gap-3"
    >
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-2 flex items-center gap-1 text-xs text-[var(--neutral-500)]">
            {breadcrumb.map((b, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                {i > 0 && <span className="text-[var(--neutral-300)]">/</span>}
                <span>{b.label}</span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--neutral-900)]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--neutral-500)]">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </motion.div>
  );
}

export function SectionCard({
  title,
  description,
  children,
  className = '',
  action,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={`rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-xs)] ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 border-b border-[var(--neutral-100)] px-6 py-4">
          <div>
            {title && <h2 className="text-sm font-semibold tracking-tight text-[var(--neutral-900)]">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-[var(--neutral-500)]">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--neutral-300)] bg-white py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--neutral-100)]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--neutral-400)]">
          <path d={icon ?? 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8'} />
        </svg>
      </div>
      <p className="mt-4 text-sm font-medium text-[var(--neutral-800)]">{title}</p>
      {description && <p className="mt-1 text-xs text-[var(--neutral-500)]">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}
