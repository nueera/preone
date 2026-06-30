'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Download, Plus } from 'lucide-react';

/* ============================================================
   DataTableToolbar — Standardized toolbar for data tables
   
   Provides the consistent search + filter + action pattern
   that data-heavy admin pages use.
   
   Usage:
   <DataTableToolbar
     searchValue={search}
     onSearchChange={setSearch}
     searchPlaceholder="Search academic years..."
     filterSlot={<Select>...</Select>}
     onExport={handleExport}
     onAdd={handleAdd}
     addLabel="Add Year"
   />
   ============================================================ */

interface DataTableToolbarProps {
  /** Search input value */
  searchValue?: string;
  /** Search input change handler */
  onSearchChange?: (value: string) => void;
  /** Search input placeholder */
  searchPlaceholder?: string;
  /** Custom filter controls (selects, date pickers, etc.) */
  filterSlot?: React.ReactNode;
  /** Export button click handler (shows download button if provided) */
  onExport?: () => void;
  /** Add button click handler (shows add button if provided) */
  onAdd?: () => void;
  /** Label for the add button */
  addLabel?: string;
  /** Additional class name */
  className?: string;
  /** Right-side custom actions (replaces default add/export) */
  actions?: React.ReactNode;
}

export function DataTableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filterSlot,
  onExport,
  onAdd,
  addLabel = 'Add',
  className,
  actions,
}: DataTableToolbarProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-start sm:items-center gap-3',
        className
      )}
    >
      {/* ── Search + Filters ── */}
      <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
        {onSearchChange && (
          <div className="relative flex-1 max-w-sm">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
              style={{ color: 'var(--admin-text-subtle)' }}
            />
            <Input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9 h-9"
              style={{ borderColor: 'var(--admin-border)' }}
            />
          </div>
        )}
        {filterSlot}
      </div>

      {/* ── Actions ── */}
      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : (
        <div className="flex items-center gap-2">
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="h-9"
              style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-text-muted)' }}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
          )}
          {onAdd && (
            <Button
              size="sm"
              onClick={onAdd}
              className="h-9"
              style={{
                background: 'var(--admin-primary)',
                color: 'var(--admin-primary-foreground)',
              }}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {addLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
