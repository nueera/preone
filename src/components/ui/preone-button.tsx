'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * PreOneButton — Living Universe button component
 * Supports variants: default, ghost, glow, outline
 */
export interface PreOneButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'glow' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const btnVariants = {
  default:
    'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-md hover:from-sky-600 hover:to-blue-600 active:scale-[0.97]',
  ghost:
    'bg-transparent text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30',
  glow:
    'bg-gradient-to-r from-purple-500 via-sky-500 to-pink-500 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 active:scale-[0.97]',
  outline:
    'border-2 border-sky-300 text-sky-600 hover:bg-sky-50 dark:border-sky-700 dark:text-sky-400 dark:hover:bg-sky-950/30',
};

const btnSizes = {
  sm: 'h-8 px-3 text-xs rounded-xl',
  md: 'h-10 px-5 text-sm rounded-2xl',
  lg: 'h-12 px-8 text-base rounded-2xl',
};

export function PreOneButton({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}: PreOneButtonProps) {
  return (
    <button
      data-slot="preone-button"
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        btnVariants[variant],
        btnSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
