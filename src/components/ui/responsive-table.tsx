'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PreOneCard } from '@/components/ui/preone-card';

// ── Types ──

export interface ResponsiveTableColumn {
  /** Unique key matching a key in the data record */
  key: string;
  /** Display label for the column header / mobile card label */
  label: string;
  /** If true, this column is hidden on mobile card view */
  hideOnMobile?: boolean;
}

export interface ResponsiveTableProps {
  /** Column definitions */
  columns: ResponsiveTableColumn[];
  /** Row data — each record maps column keys to React nodes */
  data: Array<Record<string, React.ReactNode>>;
  /** Callback when a row is clicked, receives the row index */
  onRowClick?: (index: number) => void;
  /** Additional CSS classes for the outer container */
  className?: string;
  /** Empty state message when data is empty */
  emptyMessage?: string;
}

// ── Animation variants ──

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.3, ease: 'easeOut' },
  }),
};

/**
 * ResponsiveTable — Shows a normal HTML table on md+ screens and a
 * card-based list on mobile (< md).
 *
 * Desktop features:
 * - Rounded-xl container with overflow-hidden
 * - Uppercase tracking-wider header labels
 * - Hover highlight on rows
 * - Cursor pointer when onRowClick is provided
 *
 * Mobile features:
 * - Each row becomes a PreOneCard
 * - Columns shown as label: value pairs
 * - Columns with hideOnMobile are hidden
 * - Staggered entrance animation
 * - Cards are clickable
 */
export function ResponsiveTable({
  columns,
  data,
  onRowClick,
  className,
  emptyMessage = 'No data available',
}: ResponsiveTableProps) {
  const hasData = data.length > 0;
  const hasClickHandler = typeof onRowClick === 'function';

  // ── Desktop Table (md+ screens) ──
  const desktopTable = (
    <div
      className={cn(
        'hidden md:block rounded-xl overflow-hidden',
        'border border-cosmic-border-default',
        'bg-card dark:bg-cosmic-bg-secondary',
        className
      )}
    >
      <table className="w-full">
        {/* Header */}
        <thead>
          <tr className="border-b border-cosmic-border-default bg-cosmic-bg-secondary dark:bg-cosmic-bg-tertiary">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left',
                  'text-xs font-semibold text-cosmic-text-tertiary',
                  'uppercase tracking-wider'
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {hasData ? (
            data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                onClick={() => onRowClick?.(rowIdx)}
                className={cn(
                  'border-b border-cosmic-border-default last:border-b-0',
                  'transition-colors duration-150',
                  hasClickHandler &&
                    'cursor-pointer hover:bg-cosmic-bg-secondary dark:hover:bg-cosmic-bg-tertiary'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-4 py-3 text-sm text-cosmic-text-primary"
                  >
                    {row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-sm text-cosmic-text-tertiary"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  // ── Mobile Card List (below md) ──
  const mobileCards = (
    <div className="md:hidden flex flex-col gap-3">
      {hasData ? (
        data.map((row, rowIdx) => {
          // Filter visible columns for mobile
          const mobileColumns = columns.filter((col) => !col.hideOnMobile);

          return (
            <motion.div
              key={rowIdx}
              custom={rowIdx}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <PreOneCard
                hover={hasClickHandler}
                onClick={onRowClick ? () => onRowClick(rowIdx) : undefined}
                className={cn(
                  'p-4',
                  hasClickHandler && 'cursor-pointer'
                )}
              >
                <div className="flex flex-col gap-2">
                  {mobileColumns.map((col) => (
                    <div
                      key={col.key}
                      className="flex items-start justify-between gap-3"
                    >
                      <span className="text-xs font-medium text-cosmic-text-tertiary shrink-0 min-w-[80px]">
                        {col.label}
                      </span>
                      <span className="text-sm text-cosmic-text-primary text-right flex-1">
                        {row[col.key] ?? '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </PreOneCard>
            </motion.div>
          );
        })
      ) : (
        <div className="py-8 text-center text-sm text-cosmic-text-tertiary">
          {emptyMessage}
        </div>
      )}
    </div>
  );

  return (
    <>
      {desktopTable}
      {mobileCards}
    </>
  );
}

export default ResponsiveTable;
