'use client';
import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      duration={3800}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'group flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-4 shadow-[var(--shadow-lg)] text-[var(--neutral-900)]',
          title: 'text-sm font-semibold',
          description: 'text-xs text-[var(--neutral-600)] mt-0.5',
          actionButton:
            'bg-[var(--primary-700)] text-white text-xs rounded-[var(--radius-sm)] px-2.5 py-1',
          cancelButton:
            'bg-[var(--neutral-100)] text-[var(--neutral-700)] text-xs rounded-[var(--radius-sm)] px-2.5 py-1',
          success:
            'border-[var(--primary-200)] before:bg-[var(--primary-600)]',
          error:
            'border-rose-200 before:bg-rose-500',
          closeButton:
            'absolute right-2 top-2 text-[var(--neutral-500)] hover:text-[var(--neutral-900)]',
        },
      }}
    />
  );
}
