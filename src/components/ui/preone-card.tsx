'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * PreOneCard — Living Universe card component
 * Supports variants: default, hero, glass, cosmic, emotional
 */
export interface PreOneCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hero' | 'glass' | 'cosmic' | 'emotional';
  asChild?: boolean;
}

const cardVariants = {
  default:
    'bg-card text-card-foreground rounded-3xl border shadow-sm backdrop-blur-sm',
  hero:
    'bg-gradient-to-br from-sky-500 via-blue-500 to-purple-600 text-white rounded-3xl shadow-xl border-0 overflow-hidden relative',
  glass:
    'bg-white/60 dark:bg-gray-900/60 text-card-foreground rounded-3xl border border-white/30 shadow-lg backdrop-blur-xl',
  cosmic:
    'bg-gradient-to-br from-purple-900/10 via-sky-900/10 to-pink-900/10 text-card-foreground rounded-3xl border border-purple-200/30 shadow-md backdrop-blur-md',
  emotional:
    'bg-gradient-to-br from-pink-50 via-sky-50 to-purple-50 dark:from-pink-950/30 dark:via-sky-950/30 dark:to-purple-950/30 text-card-foreground rounded-3xl border border-pink-200/40 shadow-sm',
};

export function PreOneCard({
  className,
  variant = 'default',
  children,
  ...props
}: PreOneCardProps) {
  return (
    <div
      data-slot="preone-card"
      className={cn(cardVariants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * PreOneCardContent — Inner content wrapper with padding
 */
export function PreOneCardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="preone-card-content"
      className={cn('p-6', className)}
      {...props}
    >
      {children}
    </div>
  );
}
