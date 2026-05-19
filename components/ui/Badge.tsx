import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none transition-colors',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--primary-50)] text-[var(--primary-700)] ring-1 ring-[var(--primary-100)]',
        amber: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
        rose: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100',
        sky: 'bg-sky-50 text-sky-700 ring-1 ring-sky-100',
        violet: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
        neutral: 'bg-[var(--neutral-100)] text-[var(--neutral-700)] ring-1 ring-[var(--neutral-200)]',
        outline: 'border border-[var(--neutral-300)] text-[var(--neutral-700)]',
      },
    },
    defaultVariants: { variant: 'neutral' },
  }
);

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
