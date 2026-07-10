'use client';

/**
 * WarmButton — terracotta-tinted button with soft colored shadow.
 * Variants: 'primary' (terracotta) | 'sage' | 'honey' | 'ghost' | 'outline' | 'soft'
 * Sizes: 'sm' | 'md' | 'lg'
 */

import React from 'react';
import { cn } from '@/lib/utils';

type WarmButtonVariant = 'primary' | 'sage' | 'honey' | 'ghost' | 'outline' | 'soft' | 'danger';
type WarmButtonSize = 'sm' | 'md' | 'lg';

type WarmButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: WarmButtonVariant;
  size?: WarmButtonSize;
  leftIcon?: React.ElementType;
  rightIcon?: React.ElementType;
  children: React.ReactNode;
};

const variantClasses: Record<WarmButtonVariant, string> = {
  primary:
    'bg-[var(--warm-primary)] text-white hover:bg-[var(--warm-primary-hover)] shadow-[var(--warm-shadow-primary)] hover:shadow-lg',
  sage:
    'bg-[var(--warm-sage)] text-white hover:brightness-95 shadow-[var(--warm-shadow-sage)]',
  honey:
    'bg-[var(--warm-honey)] text-[var(--warm-honey-ink)] hover:brightness-95 shadow-[var(--warm-shadow-honey)]',
  ghost:
    'bg-transparent text-[var(--warm-ink-soft)] hover:bg-[var(--warm-bg-soft)]',
  outline:
    'bg-[var(--warm-surface)] text-[var(--warm-ink)] border border-[var(--warm-border-strong)] hover:border-[var(--warm-primary)] hover:text-[var(--warm-primary)]',
  soft:
    'bg-[var(--warm-primary-soft)] text-[var(--warm-primary-ink)] hover:bg-[var(--warm-primary-soft)]/70',
  danger:
    'bg-[var(--warm-rose)] text-white hover:brightness-95 shadow-[var(--warm-shadow-rose)]',
};

const sizeClasses: Record<WarmButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-[var(--warm-radius-sm)]',
  md: 'text-sm px-4 py-2 gap-2 rounded-[var(--warm-radius-md)]',
  lg: 'text-base px-5 py-2.5 gap-2 rounded-[var(--warm-radius-md)]',
};

export const WarmButton = React.forwardRef<HTMLButtonElement, WarmButtonProps>(
  ({ variant = 'primary', size = 'md', leftIcon: LeftIcon, rightIcon: RightIcon, children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-200 ease-out active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {LeftIcon && <LeftIcon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} strokeWidth={2.5} />}
        {children}
        {RightIcon && <RightIcon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} strokeWidth={2.5} />}
      </button>
    );
  },
);
WarmButton.displayName = 'WarmButton';
