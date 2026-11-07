'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';

/**
 * DataTableToolbar — Reusable filter/search/pagination bar for table pages.
 *
 * Provides a consistent toolbar layout with:
 * - Search input with icon
 * - Optional filter dropdowns
 * - Clear all filters button
 * - Optional extra content slot (children)
 *
 * @example
 * ```tsx
 * <DataTableToolbar
 *   searchValue={search}
 *   onSearchChange={setSearch}
 *   searchPlaceholder="Search students..."
 *   filters={[
 *     {
 *       key: 'status',
 *       label: 'Status',
 *       value: statusFilter,
 *       onChange: setStatusFilter,
 *       options: [
 *         { value: 'all', label: 'All Statuses' },
 *         { value: 'ACTIVE', label: 'Active' },
 *       ],
 *     },
 *   ]}
 *   onClear={handleClearFilters}
 * >
 *   <Button>Export</Button>
 * </DataTableToolbar>
 * ```
 */

/** A single filter dropdown configuration */
export interface FilterConfig {
  /** Unique key identifying this filter */
  key: string;
  /** Display label for the filter trigger */
  label: string;
  /** Current selected value */
  value: string;
  /** Callback when the filter value changes */
  onChange: (value: string) => void;
  /** Available options for the dropdown */
  options: { value: string; label: string }[];
}

export interface DataTableToolbarProps {
  /** Current search input value */
  searchValue: string;
  /** Callback when search input changes */
  onSearchChange: (value: string) => void;
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  /** Array of filter dropdown configurations */
  filters?: FilterConfig[];
  /** Optional callback to clear all filters and search */
  onClear?: () => void;
  /** Extra content rendered in a second row below the main toolbar */
  children?: React.ReactNode;
  /** Additional className for the wrapper */
  className?: string;
}

export function DataTableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  onClear,
  children,
  className,
}: DataTableToolbarProps) {
  // Determine if any filter is active (search has value or any filter is non-empty/non-"all")
  const hasActiveFilters =
    searchValue.length > 0 ||
    (filters?.some((f) => f.value && f.value !== 'all') ?? false);

  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4',
        className
      )}
    >
      {/* ── Main toolbar row ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input with icon */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-text-subtle)]" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>

        {/* Filter dropdowns */}
        {filters?.map((filter) => (
          <Select
            key={filter.key}
            value={filter.value}
            onValueChange={filter.onChange}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {/* Clear all filters button */}
        {hasActiveFilters && onClear && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-8 gap-1.5 text-[var(--admin-text-muted)] hover:text-[var(--admin-danger)]"
          >
            <X className="size-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* ── Optional extra row for additional actions/filters ── */}
      {children && (
        <div className="mt-3 flex flex-wrap items-center gap-3 pt-3 border-t border-[var(--admin-border)]">
          {children}
        </div>
      )}
    </div>
  );
}
