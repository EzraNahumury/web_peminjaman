'use client';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Modal mandiri (tanpa Radix) — pola: React Portal ke <body> + fixed overlay
 * + flexbox center. Tidak ber-`data-state`, jadi tidak tersentuh aturan
 * global `[role='dialog']` di globals.css yang dulu menggeser posisi modal.
 * Selalu center, fleksibel (max-h-90vh + scroll), lepas dari overflow/transform
 * parent mana pun.
 *
 * API komponen sengaja dipertahankan (Dialog / DialogContent / DialogHeader /
 * DialogTitle / DialogDescription / DialogFooter) supaya menjadi drop-in.
 */

type DialogCtx = { open: boolean; onOpenChange: (v: boolean) => void };
const Ctx = React.createContext<DialogCtx | null>(null);

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={{ open, onOpenChange }}>{children}</Ctx.Provider>;
}

export function DialogContent({
  className,
  children,
  hideClose,
  dismissable = true,
}: {
  className?: string;
  children: React.ReactNode;
  /** Sembunyikan tombol X di pojok. */
  hideClose?: boolean;
  /** Klik backdrop & ESC menutup modal. Default true. */
  dismissable?: boolean;
}) {
  const ctx = React.useContext(Ctx);
  const open = ctx?.open ?? false;
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && dismissable) ctx?.onOpenChange(false);
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, dismissable, ctx]);

  if (!ctx || !open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/50 p-4"
      style={{ animation: 'fadeIn 0.15s ease-out' }}
      onMouseDown={(e) => {
        if (dismissable && e.target === e.currentTarget) ctx.onOpenChange(false);
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'relative flex w-full max-w-lg flex-col overflow-hidden',
          'rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white shadow-[var(--shadow-lg)]',
          className
        )}
      >
        {children}
        {!hideClose && (
          <button
            type="button"
            onClick={() => ctx.onOpenChange(false)}
            className="absolute right-4 top-4 rounded-[var(--radius-sm)] p-1 text-[var(--neutral-500)] opacity-70 transition-opacity hover:bg-[var(--neutral-100)] hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-500)]"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-b border-[var(--neutral-100)] px-6 py-4 pr-12', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex justify-end gap-2 border-t border-[var(--neutral-100)] bg-[var(--neutral-50)] px-6 py-3',
        className
      )}
      {...props}
    />
  );
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        'text-base font-semibold leading-none tracking-tight text-[var(--neutral-900)]',
        className
      )}
      {...props}
    />
  );
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-1 text-xs text-[var(--neutral-500)]', className)} {...props} />;
}
