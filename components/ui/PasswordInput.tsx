'use client';
import { useState, type InputHTMLAttributes } from 'react';

const baseInput =
  'w-full h-10 rounded-[var(--radius-md)] border border-[var(--neutral-300)] bg-white pl-3.5 pr-10 text-sm text-[var(--neutral-900)] placeholder:text-[var(--neutral-400)] shadow-[var(--shadow-xs)] outline-none transition-all duration-150 focus:border-[var(--primary-600)] focus:ring-[3px] focus:ring-[var(--primary-100)] hover:border-[var(--neutral-400)] disabled:bg-[var(--neutral-50)] disabled:text-[var(--neutral-500)] disabled:cursor-not-allowed';

export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input
        {...props}
        type={shown ? 'text' : 'password'}
        className={`${baseInput} ${props.className ?? ''}`}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? 'Sembunyikan password' : 'Tampilkan password'}
        aria-pressed={shown}
        tabIndex={-1}
        className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--neutral-500)] hover:bg-[var(--neutral-100)] hover:text-[var(--neutral-700)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-200)]"
      >
        {shown ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
            <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
            <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
            <line x1="2" y1="2" x2="22" y2="22" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
