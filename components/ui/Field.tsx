import { forwardRef } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Field({
  label,
  error,
  hint,
  required,
  children,
}: {
  label?: string;
  error?: string | string[];
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const err = Array.isArray(error) ? error[0] : error;
  return (
    <div>
      {label && (
        <label className="mb-1.5 flex items-center gap-1 text-[13px] font-medium text-[var(--neutral-700)]">
          {label}
          {required && <span className="text-[var(--status-rejected-fg)]">*</span>}
        </label>
      )}
      {children}
      {hint && !err && <p className="mt-1.5 text-xs text-[var(--neutral-500)]">{hint}</p>}
      {err && (
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-[var(--status-rejected-fg)]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          {err}
        </p>
      )}
    </div>
  );
}

export const baseInputClass =
  'w-full rounded-[var(--radius-md)] border border-[var(--neutral-300)] bg-white text-[var(--neutral-900)] shadow-[var(--shadow-xs)] outline-none transition-all duration-150 placeholder:text-[var(--neutral-400)] hover:border-[var(--neutral-400)] focus:border-[var(--primary-600)] focus:ring-[3px] focus:ring-[var(--primary-100)] disabled:cursor-not-allowed disabled:border-[var(--neutral-200)] disabled:bg-[var(--neutral-50)] disabled:text-[var(--neutral-500)]';

const baseInput = `${baseInputClass} h-10 px-3.5 text-sm`;

const baseTextarea =
  'w-full rounded-[var(--radius-md)] border border-[var(--neutral-300)] bg-white px-3.5 py-2.5 text-sm text-[var(--neutral-900)] placeholder:text-[var(--neutral-400)] shadow-[var(--shadow-xs)] outline-none transition-all duration-150 focus:border-[var(--primary-600)] focus:ring-[3px] focus:ring-[var(--primary-100)] hover:border-[var(--neutral-400)] resize-y min-h-[80px] disabled:cursor-not-allowed disabled:bg-[var(--neutral-50)] disabled:text-[var(--neutral-500)]';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(baseInput, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(baseTextarea, props.className)} />;
}

function SelectChevron({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('pointer-events-none text-[var(--neutral-500)]', className)}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & {
  /** Ukuran kompak untuk baris tabel / toolbar */
  size?: 'sm' | 'md';
  /** Lebar mengikuti kontainer (default true) */
  fullWidth?: boolean;
  wrapperClassName?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { size = 'md', fullWidth = true, className, wrapperClassName, disabled, children, ...props },
  ref
) {
  const isSm = size === 'sm';

  return (
    <div className={cn('relative', fullWidth ? 'w-full' : 'inline-block', wrapperClassName)}>
      <select
        ref={ref}
        disabled={disabled}
        {...props}
        className={cn(
          baseInputClass,
          'cursor-pointer appearance-none bg-[length:0] bg-no-repeat pr-9',
          isSm ? 'h-8 px-2.5 pr-8 text-xs' : 'h-10 px-3.5 pr-9 text-sm',
          !fullWidth && 'w-auto min-w-[8.5rem]',
          disabled && 'cursor-not-allowed opacity-90',
          className
        )}
      >
        {children}
      </select>
      <SelectChevron
        className={cn(
          'absolute top-1/2 -translate-y-1/2',
          isSm ? 'right-2.5' : 'right-3',
          disabled && 'opacity-50'
        )}
      />
    </div>
  );
});
