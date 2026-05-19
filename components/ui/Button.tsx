import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline' | 'dark';
type Size = 'sm' | 'md' | 'lg';

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium tracking-[-0.01em] transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary-500)] active:scale-[0.985]';
  const sizes: Record<Size, string> = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5 text-sm',
  };
  const variants: Record<Variant, string> = {
    primary:
      'bg-[var(--primary-600)] text-white shadow-[var(--shadow-sm)] hover:bg-[var(--primary-700)] hover:shadow-[var(--shadow-md)]',
    secondary: 'bg-[var(--neutral-100)] text-[var(--neutral-800)] hover:bg-[var(--neutral-200)]',
    danger:
      'bg-[var(--status-rejected-fg)] text-white shadow-[var(--shadow-sm)] hover:brightness-110',
    success:
      'bg-[var(--primary-600)] text-white shadow-[var(--shadow-sm)] hover:bg-[var(--primary-700)]',
    ghost: 'bg-transparent text-[var(--neutral-700)] hover:bg-[var(--neutral-100)]',
    outline:
      'border border-[var(--neutral-300)] bg-white text-[var(--neutral-800)] hover:bg-[var(--neutral-50)] hover:border-[var(--neutral-400)]',
    dark: 'bg-[var(--neutral-900)] text-white hover:bg-[var(--neutral-800)] shadow-[var(--shadow-sm)]',
  };
  return <button {...props} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} />;
}
