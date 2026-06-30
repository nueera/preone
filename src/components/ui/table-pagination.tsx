'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * TablePagination — Reusable pagination component for data tables.
 *
 * Provides a consistent pagination experience with:
 * - "Showing X to Y of Z results" text on the left
 * - Previous/Next buttons + page number buttons on the right
 * - Smart page button rendering (max 5 visible with ellipsis)
 * - Current page highlighted with admin primary color
 *
 * @example
 * ```tsx
 * <TablePagination
 *   currentPage={2}
 *   totalPages={10}
 *   totalItems={95}
 *   itemsPerPage={10}
 *   onPageChange={setPage}
 * />
 * ```
 */
export interface TablePaginationProps {
  /** Current active page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items across all pages */
  totalItems: number;
  /** Number of items displayed per page */
  itemsPerPage: number;
  /** Callback when the user navigates to a different page */
  onPageChange: (page: number) => void;
  /** Additional className for the wrapper */
  className?: string;
}

/**
 * Generate an array of page numbers to display, with ellipsis placeholders.
 * Shows at most 5 page buttons, with "..." for gaps.
 */
function getPageNumbers(current: number, total: number): (number | '...')[] {
  // If 7 or fewer pages, show all
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];

  // Always show first page
  pages.push(1);

  // Calculate range around current page
  const rangeStart = Math.max(2, current - 1);
  const rangeEnd = Math.min(total - 1, current + 1);

  // Add ellipsis after first page if there's a gap
  if (rangeStart > 2) {
    pages.push('...');
  }

  // Add pages around current page
  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }

  // Add ellipsis before last page if there's a gap
  if (rangeEnd < total - 1) {
    pages.push('...');
  }

  // Always show last page
  pages.push(total);

  return pages;
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className,
}: TablePaginationProps) {
  // Calculate the range of items being shown
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  // Don't render pagination if there are no pages
  if (totalPages <= 0) return null;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
        'text-sm text-[var(--admin-text-muted)]',
        className
      )}
    >
      {/* Left: Item count summary */}
      <span>
        Showing <span className="font-medium text-[var(--admin-text)]">{startItem}</span> to{' '}
        <span className="font-medium text-[var(--admin-text)]">{endItem}</span> of{' '}
        <span className="font-medium text-[var(--admin-text)]">{totalItems}</span> results
      </span>

      {/* Right: Page navigation */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 gap-1 border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-2)]"
        >
          <ChevronLeft className="size-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </Button>

        {/* Page number buttons */}
        {pageNumbers.map((page, index) =>
          page === '...' ? (
            <span
              key={`ellipsis-${index}`}
              className="flex size-8 items-center justify-center text-[var(--admin-text-subtle)]"
            >
              ...
            </span>
          ) : (
            <Button
              key={page}
              variant={page === currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(page)}
              className={cn(
                'h-8 min-w-[2rem]',
                page === currentPage
                  ? 'bg-[var(--admin-primary)] text-white hover:opacity-90'
                  : 'border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-2)]'
              )}
            >
              {page}
            </Button>
          )
        )}

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 gap-1 border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-2)]"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
