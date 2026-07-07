'use client';

import React, { createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

// ── Portal Context for Skeleton ──
type PortalType = 'admin' | 'teacher' | 'parent';

const SkeletonPortalContext = createContext<PortalType>('admin');

/**
 * Hook to get the current portal context for skeleton styling.
 * Falls back to 'admin' if no context is set.
 */
export function useSkeletonPortal(): PortalType {
  return useContext(SkeletonPortalContext);
}

/**
 * Provider component to set portal context for nested skeletons.
 * Wrap your page content with this to get portal-aware skeleton colors.
 */
export function SkeletonPortalProvider({
  portal,
  children,
}: {
  portal: PortalType;
  children: React.ReactNode;
}) {
  return (
    <SkeletonPortalContext.Provider value={portal}>
      {children}
    </SkeletonPortalContext.Provider>
  );
}

// ── Portal Token Mapping ──
const PORTAL_TOKENS: Record<PortalType, {
  surface: string;
  surface2: string;
  border: string;
  primarySoft: string;
}> = {
  admin: {
    surface: 'var(--admin-surface)',
    surface2: 'var(--admin-surface-2)',
    border: 'var(--admin-border)',
    primarySoft: 'var(--admin-primary-soft)',
  },
  teacher: {
    surface: 'var(--teacher-surface)',
    surface2: 'var(--teacher-surface-2)',
    border: 'var(--teacher-border)',
    primarySoft: 'var(--teacher-primary-soft)',
  },
  parent: {
    surface: 'var(--parent-surface)',
    surface2: 'var(--parent-surface-2)',
    border: 'var(--parent-border)',
    primarySoft: 'var(--parent-primary-soft)',
  },
};

// ── Base Skeleton Component ──
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Portal override - defaults to context value */
  portal?: PortalType;
  /** Enable shimmer animation */
  shimmer?: boolean;
  /** Skeleton variant */
  variant?: 'default' | 'circular' | 'text' | 'card';
}

export function Skeleton({
  className,
  portal,
  shimmer = true,
  variant = 'default',
  ...props
}: SkeletonProps) {
  const contextPortal = useSkeletonPortal();
  const activePortal = portal || contextPortal;
  const tokens = PORTAL_TOKENS[activePortal];

  const variantStyles = {
    default: 'rounded-xl',
    circular: 'rounded-full',
    text: 'rounded-md',
    card: 'rounded-2xl',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        variantStyles[variant],
        shimmer && 'skeleton-shimmer',
        className
      )}
      style={{
        background: shimmer ? undefined : tokens.surface2,
      }}
      {...props}
    />
  );
}

// ── Portal-aware Stat Card Skeleton ──
interface StatSkeletonProps {
  portal?: PortalType;
  showTrend?: boolean;
  showSubtitle?: boolean;
}

export function StatSkeleton({
  portal,
  showTrend = true,
  showSubtitle = true,
}: StatSkeletonProps) {
  const contextPortal = useSkeletonPortal();
  const activePortal = portal || contextPortal;
  const tokens = PORTAL_TOKENS[activePortal];

  return (
    <div
      className="relative overflow-hidden rounded-3xl p-5"
      style={{
        background: tokens.surface,
        border: `1px solid ${tokens.border}`,
      }}
    >
      {/* Left color border accent */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl"
        style={{ background: tokens.primarySoft }}
      />
      <div className="flex items-start gap-4 pl-3">
        {/* Icon placeholder */}
        <Skeleton
          className="h-10 w-10 shrink-0 rounded-xl"
          portal={activePortal}
        />
        <div className="min-w-0 flex-1">
          {/* Title */}
          <Skeleton
            className="h-4 w-24 mb-2"
            variant="text"
            portal={activePortal}
          />
          {/* Value */}
          <Skeleton
            className="h-8 w-16 mb-1"
            variant="text"
            portal={activePortal}
          />
          {/* Subtitle */}
          {showSubtitle && (
            <Skeleton
              className="h-3 w-20"
              variant="text"
              portal={activePortal}
            />
          )}
          {/* Trend */}
          {showTrend && (
            <Skeleton
              className="h-3 w-24 mt-1"
              variant="text"
              portal={activePortal}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Portal-aware Stats Grid Skeleton ──
interface StatsGridSkeletonProps {
  portal?: PortalType;
  count?: number;
}

export function StatsGridSkeleton({
  portal,
  count = 4,
}: StatsGridSkeletonProps) {
  const contextPortal = useSkeletonPortal();
  const activePortal = portal || contextPortal;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatSkeleton key={i} portal={activePortal} />
      ))}
    </div>
  );
}

// ── Portal-aware Table Skeleton ──
interface TableSkeletonProps {
  portal?: PortalType;
  rows?: number;
  columns?: number;
  showAvatar?: boolean;
}

export function TableSkeleton({
  portal,
  rows = 5,
  columns = 5,
  showAvatar = true,
}: TableSkeletonProps) {
  const contextPortal = useSkeletonPortal();
  const activePortal = portal || contextPortal;
  const tokens = PORTAL_TOKENS[activePortal];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: tokens.surface,
        border: `1px solid ${tokens.border}`,
      }}
    >
      {/* Header */}
      <div
        className="p-4 border-b"
        style={{ borderColor: tokens.border }}
      >
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-4 flex-1"
              variant="text"
              portal={activePortal}
            />
          ))}
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="p-4 border-b last:border-0"
          style={{ borderColor: `${tokens.border}50` }}
        >
          <div className="flex gap-4 items-center">
            {showAvatar && (
              <Skeleton
                className="h-10 w-10 shrink-0"
                variant="circular"
                portal={activePortal}
              />
            )}
            {Array.from({ length: columns - (showAvatar ? 1 : 0) }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className="h-4 flex-1"
                variant="text"
                portal={activePortal}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Portal-aware Chart Skeleton ──
interface ChartSkeletonProps {
  portal?: PortalType;
  bars?: number;
}

export function ChartSkeleton({
  portal,
  bars = 7,
}: ChartSkeletonProps) {
  const contextPortal = useSkeletonPortal();
  const activePortal = portal || contextPortal;
  const tokens = PORTAL_TOKENS[activePortal];

  return (
    <div
      className="p-5 rounded-2xl"
      style={{
        background: tokens.surface,
        border: `1px solid ${tokens.border}`,
      }}
    >
      {/* Title */}
      <Skeleton
        className="h-5 w-32 mb-4"
        variant="text"
        portal={activePortal}
      />
      {/* Bars */}
      <div className="flex items-end gap-2 h-40">
        {Array.from({ length: bars }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-lg"
            style={{ height: `${30 + Math.random() * 70}%` }}
            portal={activePortal}
          />
        ))}
      </div>
    </div>
  );
}

// ── Portal-aware Card Skeleton ──
interface CardSkeletonProps {
  portal?: PortalType;
  lines?: number;
  showHeader?: boolean;
}

export function CardSkeleton({
  portal,
  lines = 3,
  showHeader = false,
}: CardSkeletonProps) {
  const contextPortal = useSkeletonPortal();
  const activePortal = portal || contextPortal;
  const tokens = PORTAL_TOKENS[activePortal];

  return (
    <div
      className="p-5 rounded-2xl"
      style={{
        background: tokens.surface,
        border: `1px solid ${tokens.border}`,
      }}
    >
      {showHeader && (
        <Skeleton
          className="h-5 w-24 mb-4"
          variant="text"
          portal={activePortal}
        />
      )}
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4 mb-3',
            i === lines - 1 && 'w-2/3 mb-0'
          )}
          variant="text"
          portal={activePortal}
        />
      ))}
    </div>
  );
}

// ── Portal-aware Form Skeleton ──
interface FormSkeletonProps {
  portal?: PortalType;
  fields?: number;
}

export function FormSkeleton({
  portal,
  fields = 5,
}: FormSkeletonProps) {
  const contextPortal = useSkeletonPortal();
  const activePortal = portal || contextPortal;

  return (
    <div className="space-y-5">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <Skeleton
            className="h-4 w-24 mb-2"
            variant="text"
            portal={activePortal}
          />
          <Skeleton
            className="h-10 w-full rounded-xl"
            portal={activePortal}
          />
        </div>
      ))}
      <Skeleton
        className="h-10 w-32 mt-4 rounded-xl"
        portal={activePortal}
      />
    </div>
  );
}

// ── Portal-aware List Skeleton ──
interface ListSkeletonProps {
  portal?: PortalType;
  items?: number;
}

export function ListSkeleton({
  portal,
  items = 4,
}: ListSkeletonProps) {
  const contextPortal = useSkeletonPortal();
  const activePortal = portal || contextPortal;
  const tokens = PORTAL_TOKENS[activePortal];

  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ border: `1px solid ${tokens.border}` }}
        >
          <Skeleton
            className="h-10 w-10 shrink-0"
            variant="circular"
            portal={activePortal}
          />
          <div className="flex-1 space-y-2">
            <Skeleton
              className="h-4 w-1/3"
              variant="text"
              portal={activePortal}
            />
            <Skeleton
              className="h-3 w-1/2"
              variant="text"
              portal={activePortal}
            />
          </div>
          <Skeleton
            className="h-6 w-16 shrink-0 rounded-full"
            portal={activePortal}
          />
        </div>
      ))}
    </div>
  );
}

// ── Portal-aware Page Skeleton ──
interface PageSkeletonProps {
  portal?: PortalType;
  type?: 'dashboard' | 'list' | 'form' | 'detail' | 'setup' | 'data';
}

export function PageSkeleton({
  portal,
  type = 'dashboard',
}: PageSkeletonProps) {
  const contextPortal = useSkeletonPortal();
  const activePortal = portal || contextPortal;

  return (
    <SkeletonPortalProvider portal={activePortal}>
      <div className="space-y-6 p-6 animate-stagger">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton
              className="h-7 w-48"
              variant="text"
              portal={activePortal}
            />
            <Skeleton
              className="h-4 w-64"
              variant="text"
              portal={activePortal}
            />
          </div>
          <Skeleton
            className="h-10 w-32 rounded-xl"
            portal={activePortal}
          />
        </div>

        {/* Dashboard type */}
        {type === 'dashboard' && (
          <>
            <StatsGridSkeleton portal={activePortal} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartSkeleton portal={activePortal} />
              <ChartSkeleton portal={activePortal} />
            </div>
          </>
        )}

        {/* List type */}
        {type === 'list' && (
          <>
            <div className="flex gap-3">
              <Skeleton
                className="h-10 flex-1 rounded-xl"
                portal={activePortal}
              />
              <Skeleton
                className="h-10 w-32 rounded-xl"
                portal={activePortal}
              />
            </div>
            <TableSkeleton portal={activePortal} />
          </>
        )}

        {/* Form type */}
        {type === 'form' && (
          <div className="max-w-2xl">
            <FormSkeleton portal={activePortal} />
          </div>
        )}

        {/* Detail type */}
        {type === 'detail' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <CardSkeleton
                portal={activePortal}
                lines={5}
                showHeader
              />
            </div>
            <div className="space-y-4">
              <CardSkeleton portal={activePortal} lines={2} />
              <CardSkeleton portal={activePortal} lines={3} />
            </div>
          </div>
        )}

        {/* Setup type */}
        {type === 'setup' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <CardSkeleton portal={activePortal} lines={8} />
            </div>
            <div className="lg:col-span-3 space-y-4">
              <CardSkeleton portal={activePortal} lines={4} />
              <CardSkeleton portal={activePortal} lines={6} />
              <CardSkeleton portal={activePortal} lines={3} />
            </div>
          </div>
        )}

        {/* Data type */}
        {type === 'data' && (
          <>
            <StatsGridSkeleton portal={activePortal} />
            <div className="flex gap-3">
              <Skeleton
                className="h-10 flex-1 rounded-xl"
                portal={activePortal}
              />
              <Skeleton
                className="h-10 w-32 rounded-xl"
                portal={activePortal}
              />
            </div>
            <TableSkeleton portal={activePortal} />
          </>
        )}
      </div>
    </SkeletonPortalProvider>
  );
}

// ── Loading Spinner (Portal-aware) ──
interface LoadingSpinnerProps {
  portal?: PortalType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({
  portal,
  size = 'md',
  className,
}: LoadingSpinnerProps) {
  const contextPortal = useSkeletonPortal();
  const activePortal = portal || contextPortal;
  const tokens = PORTAL_TOKENS[activePortal];

  const sizeStyles = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div
      className={cn(
        'animate-spin-slow rounded-full border-2',
        sizeStyles[size],
        className
      )}
      style={{
        borderColor: tokens.border,
        borderTopColor: tokens.primarySoft,
      }}
    />
  );
}

// Export all components
export {
  SkeletonPortalContext,
  PORTAL_TOKENS,
};