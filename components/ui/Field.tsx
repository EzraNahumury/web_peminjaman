import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';

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

const baseInput =
  'w-full h-10 rounded-[var(--radius-md)] border border-[var(--neutral-300)] bg-white px-3.5 text-sm text-[var(--neutral-900)] placeholder:text-[var(--neutral-400)] shadow-[var(--shadow-xs)] outline-none transition-all duration-150 focus:border-[var(--primary-600)] focus:ring-[3px] focus:ring-[var(--primary-100)] hover:border-[var(--neutral-400)] disabled:bg-[var(--neutral-50)] disabled:text-[var(--neutral-500)] disabled:cursor-not-allowed';

const baseTextarea =
  'w-full rounded-[var(--radius-md)] border border-[var(--neutral-300)] bg-white px-3.5 py-2.5 text-sm text-[var(--neutral-900)] placeholder:text-[var(--neutral-400)] shadow-[var(--shadow-xs)] outline-none transition-all duration-150 focus:border-[var(--primary-600)] focus:ring-[3px] focus:ring-[var(--primary-100)] hover:border-[var(--neutral-400)] resize-y min-h-[80px]';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${baseInput} ${props.className ?? ''}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${baseTextarea} ${props.className ?? ''}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={`${baseInput} appearance-none pr-9 ${props.className ?? ''}`} />
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--neutral-500)]"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}
