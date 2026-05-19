import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] font-medium tracking-[-0.01em] transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--primary-500)] active:scale-[0.985] [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--primary-700)] text-white shadow-[var(--shadow-sm)] hover:bg-[var(--primary-800)] hover:shadow-[var(--shadow-md)]',
        secondary:
          'bg-[var(--neutral-100)] text-[var(--neutral-800)] hover:bg-[var(--neutral-200)]',
        danger:
          'bg-[var(--status-rejected-fg)] text-white shadow-[var(--shadow-sm)] hover:brightness-110',
        success:
          'bg-[var(--primary-600)] text-white shadow-[var(--shadow-sm)] hover:bg-[var(--primary-700)]',
        ghost:
          'bg-transparent text-[var(--neutral-700)] hover:bg-[var(--neutral-100)]',
        outline:
          'border border-[var(--neutral-300)] bg-white text-[var(--neutral-800)] hover:bg-[var(--neutral-50)] hover:border-[var(--neutral-400)]',
        dark:
          'bg-[var(--neutral-900)] text-white hover:bg-[var(--neutral-800)] shadow-[var(--shadow-sm)]',
        link:
          'text-[var(--primary-700)] underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs [&_svg]:size-3.5',
        md: 'h-10 px-4 text-sm [&_svg]:size-4',
        lg: 'h-11 px-5 text-sm [&_svg]:size-4',
        icon: 'h-9 w-9 [&_svg]:size-4',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { buttonVariants };
