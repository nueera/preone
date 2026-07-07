'use client';

import React, { useRef, useCallback, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';

// ── Types ──
export interface VirtualScrollColumn {
  /** Unique key matching a key in the data record */
  key: string;
  /** Display label for the column header */
  label: string;
  /** Column width (can be number in px or string like '20%') */
  width?: number | string;
  /** If true, column is sticky on the left */
  stickyLeft?: boolean;
  /** If true, column is sticky on the right */
  stickyRight?: boolean;
  /** Custom cell renderer */
  renderCell?: (value: unknown, row: Record<string, unknown>, index: number) => React.ReactNode;
}

export interface VirtualScrollTableProps {
  /** Column definitions */
  columns: VirtualScrollColumn[];
  /** Row data */
  data: Array<Record<string, unknown>>;
  /** Estimated row height for virtualization (default: 48) */
  estimateRowHeight?: number;
  /** Fixed row height (if all rows are same height) */
  fixedRowHeight?: number;
  /** Container height in pixels (default: 400) */
  containerHeight?: number;
  /** Callback when a row is clicked */
  onRowClick?: (index: number, row: Record<string, unknown>) => void;
  /** Callback when a cell is clicked */
  onCellClick?: (columnKey: string, row: Record<string, unknown>, index: number) => void;
  /** Additional CSS classes */
  className?: string;
  /** Empty state message */
  emptyMessage?: string;
  /** Loading state */
  loading?: boolean;
  /** Enable overscan for smoother scrolling */
  overscan?: number;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Portal context for styling */
  portal?: 'admin' | 'teacher' | 'parent';
  /** Custom row className generator */
  getRowClassName?: (row: Record<string, unknown>, index: number) => string;
  /** Custom cell className generator */
  getCellClassName?: (column: VirtualScrollColumn, row: Record<string, unknown>, index: number) => string;
}

// ── Portal Color Tokens ──
const PORTAL_BORDER_COLORS = {
  admin: 'border-purple-200 dark:border-purple-800',
  teacher: 'border-emerald-200 dark:border-emerald-800',
  parent: 'border-sky-200 dark:border-sky-800',
};

const PORTAL_HEADER_BG = {
  admin: 'bg-purple-50 dark:bg-purple-950',
  teacher: 'bg-emerald-50 dark:bg-emerald-950',
  parent: 'bg-sky-50 dark:bg-sky-950',
};

const PORTAL_ROW_HOVER = {
  admin: 'hover:bg-purple-50/50 dark:hover:bg-purple-950/50',
  teacher: 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/50',
  parent: 'hover:bg-sky-50/50 dark:hover:bg-sky-950/50',
};

/**
 * VirtualScrollTable — High-performance table with virtual scrolling
 * 
 * Uses @tanstack/react-virtual for efficient rendering of large datasets.
 * Only renders visible rows, dramatically improving performance for tables
 * with thousands of rows.
 * 
 * Features:
 * - Virtual scrolling with overscan for smooth UX
 * - Sticky header and columns
 * - Portal-aware styling
 * - GPU-optimized animations
 * - CSS containment for rendering isolation
 * - Memoized row components
 * - Customizable cell renderers
 * 
 * Performance benefits:
 * - DOM nodes: O(visible rows) instead of O(total rows)
 * - Memory: Only virtualizer state, not full DOM tree
 * - Render time: Only affected rows re-render
 * - Scroll: No layout recalculations
 */
export function VirtualScrollTable({
  columns,
  data,
  estimateRowHeight = 48,
  fixedRowHeight,
  containerHeight = 400,
  onRowClick,
  onCellClick,
  className,
  emptyMessage = 'No data available',
  loading = false,
  overscan = 5,
  stickyHeader = true,
  portal = 'admin',
  getRowClassName,
  getCellClassName,
}: VirtualScrollTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Use fixed height if provided, otherwise use estimated
  const rowHeight = fixedRowHeight || estimateRowHeight;

  // Create virtualizer instance
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  // Memoized row renderer
  const RowRenderer = memo(function RowRenderer({
    row,
    index,
    style,
  }: {
    row: Record<string, unknown>;
    index: number;
    style: React.CSSProperties;
  }) {
    const handleRowClick = useCallback(() => {
      onRowClick?.(index, row);
    }, [index, row, onRowClick]);

    const handleCellClick = useCallback((columnKey: string) => {
      onCellClick?.(columnKey, row, index);
    }, [row, index, onCellClick]);

    return (
      <div
        data-slot="virtual-table-row"
        data-row-index={index}
        style={style}
        className={cn(
          'flex items-center border-b',
          'transition-colors duration-150',
          PORTAL_BORDER_COLORS[portal],
          onRowClick && 'cursor-pointer',
          PORTAL_ROW_HOVER[portal],
          getRowClassName?.(row, index)
        )}
        onClick={handleRowClick}
      >
        {columns.map((column, colIndex) => {
          const value = row[column.key];
          const cellContent = column.renderCell
            ? column.renderCell(value, row, index)
            : (value as React.ReactNode) ?? '—';

          const columnWidth = column.width
            ? typeof column.width === 'number'
              ? `${column.width}px`
              : column.width
            : `${100 / columns.length}%`;

          return (
            <div
              key={column.key}
              data-slot="virtual-table-cell"
              data-column-key={column.key}
              className={cn(
                'flex-shrink-0 px-4 py-3',
                'text-sm text-foreground',
                'overflow-hidden text-ellipsis',
                column.stickyLeft && 'sticky left-0 z-10',
                column.stickyRight && 'sticky right-0 z-10',
                onCellClick && 'cursor-pointer',
                getCellClassName?.(column, row, index)
              )}
              style={{ width: columnWidth }}
              onClick={(e) => {
                if (onCellClick) {
                  e.stopPropagation();
                  handleCellClick(column.key);
                }
              }}
            >
              {cellContent}
            </div>
          );
        })}
      </div>
    );
  });

  // Empty state
  if (!loading && data.length === 0) {
    return (
      <div
        data-slot="virtual-table-empty"
        className={cn(
          'flex items-center justify-center',
          'h-[200px] rounded-xl',
          'border',
          PORTAL_BORDER_COLORS[portal],
          className
        )}
      >
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div
        data-slot="virtual-table-loading"
        className={cn(
          'flex items-center justify-center',
          'h-[200px] rounded-xl',
          'border',
          PORTAL_BORDER_COLORS[portal],
          className
        )}
      >
        <div className="portal-spinner-ring animate-spin-slow" />
      </div>
    );
  }

  return (
    <div
      data-slot="virtual-scroll-table"
      data-portal={portal}
      className={cn(
        'rounded-xl overflow-hidden',
        'border',
        PORTAL_BORDER_COLORS[portal],
        className
      )}
      style={{ contain: 'content layout style' }}
    >
      {/* Header */}
      {stickyHeader && (
        <div
          data-slot="virtual-table-header"
          className={cn(
            'flex items-center sticky top-0 z-20',
            'border-b',
            PORTAL_BORDER_COLORS[portal],
            PORTAL_HEADER_BG[portal],
            'font-semibold text-xs uppercase tracking-wider'
          )}
        >
          {columns.map((column) => {
            const columnWidth = column.width
              ? typeof column.width === 'number'
                ? `${column.width}px`
                : column.width
              : `${100 / columns.length}%`;

            return (
              <div
                key={column.key}
                className={cn(
                  'flex-shrink-0 px-4 py-3',
                  'text-muted-foreground',
                  'overflow-hidden text-ellipsis',
                  column.stickyLeft && 'sticky left-0 z-10',
                  column.stickyRight && 'sticky right-0 z-10'
                )}
                style={{ width: columnWidth }}
              >
                {column.label}
              </div>
            );
          })}
        </div>
      )}

      {/* Virtual scroll container */}
      <div
        ref={parentRef}
        data-slot="virtual-table-body"
        className="overflow-auto"
        style={{ height: containerHeight, contain: 'content' }}
      >
        {/* Virtualized rows */}
        <div
          data-slot="virtual-table-content"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
            contain: 'strict',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => (
            <RowRenderer
              key={virtualRow.key}
              row={data[virtualRow.index]}
              index={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        data-slot="virtual-table-footer"
        className={cn(
          'flex items-center justify-between px-4 py-2',
          'border-t',
          PORTAL_BORDER_COLORS[portal],
          'text-xs text-muted-foreground'
        )}
      >
        <span>
          Showing {rowVirtualizer.getVirtualItems().length} of {data.length} rows
        </span>
        <span>
          Scroll position: {Math.round(rowVirtualizer.scrollOffset ?? 0)}px
        </span>
      </div>
    </div>
  );
}

/**
 * VirtualScrollList — Simple virtualized list without table structure
 * 
 * Useful for simple lists with custom item renderers.
 */
export function VirtualScrollList<T>({
  data,
  renderItem,
  estimateItemHeight = 48,
  containerHeight = 400,
  overscan = 5,
  className,
  emptyMessage = 'No items',
}: {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  estimateItemHeight?: number;
  containerHeight?: number;
  overscan?: number;
  className?: string;
  emptyMessage?: string;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateItemHeight,
    overscan,
  });

  if (data.length === 0) {
    return (
      <div className={cn('p-4 text-center text-muted-foreground', className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      data-slot="virtual-scroll-list"
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight, contain: 'content' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
          contain: 'strict',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderItem(data[virtualRow.index], virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default VirtualScrollTable;