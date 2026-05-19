'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { fmtDateTime } from '@/lib/request-code';
import { Button } from '@/components/ui/Button';
import { markNotificationAsRead } from '@/app/actions/notifications';
import type { Notification } from '@/types';

export function NotificationList({ items }: { items: Notification[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((n, idx) => (
        <motion.li
          key={n.id}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.3, ease: 'easeOut', delay: Math.min(idx, 8) * 0.03 }}
          className={`rounded-[var(--radius-lg)] border bg-white p-4 shadow-[var(--shadow-xs)] transition-colors ${
            n.isRead ? 'border-[var(--neutral-200)]' : 'border-[var(--primary-200)] bg-[var(--primary-50)]/30'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${
                  n.isRead
                    ? 'bg-[var(--neutral-100)] text-[var(--neutral-500)]'
                    : 'bg-[var(--primary-100)] text-[var(--primary-700)] ring-1 ring-[var(--primary-200)]'
                }`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--neutral-900)]">{n.title}</p>
                <p className="mt-0.5 text-sm text-[var(--neutral-700)]">{n.message}</p>
                <p className="mt-1 text-xs text-[var(--neutral-500)]">{fmtDateTime(n.createdAt)}</p>
                {n.link && (
                  <Link
                    href={n.link}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--primary-700)] hover:text-[var(--primary-800)]"
                  >
                    Buka detail
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
            {!n.isRead && (
              <form action={markNotificationAsRead.bind(null, n.id)}>
                <Button type="submit" variant="ghost" size="sm">
                  Tandai dibaca
                </Button>
              </form>
            )}
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
