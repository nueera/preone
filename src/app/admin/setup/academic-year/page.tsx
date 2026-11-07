'use client';

import React, { useState } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CalendarDays,
  Plus,
  Edit3,
  CheckCircle2,
  Clock,
  BookOpen,
  GraduationCap,
  Sun,
  Leaf,
  Snowflake,
  CloudRain,
  Eye,
  MoreHorizontal,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ──
interface Term {
  id: string;
  name: string;
  season: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  icon: React.ElementType;
  accentVar: string;
  softVar: string;
}

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'completed';
  terms: Term[];
  totalWorkingDays: number;
}

// ── Mock Data ──
const INITIAL_YEARS: AcademicYear[] = [
  {
    id: '1',
    name: '2025–26',
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    status: 'active',
    totalWorkingDays: 220,
    terms: [
      { id: 't1', name: 'Term 1', season: 'Summer', startDate: '2025-04-01', endDate: '2025-06-30', workingDays: 60, icon: Sun, accentVar: '--admin-success', softVar: '--admin-success-soft' },
      { id: 't2', name: 'Term 2', season: 'Monsoon', startDate: '2025-07-01', endDate: '2025-09-30', workingDays: 60, icon: CloudRain, accentVar: '--admin-info', softVar: '--admin-info-soft' },
      { id: 't3', name: 'Term 3', season: 'Autumn', startDate: '2025-10-01', endDate: '2025-12-20', workingDays: 55, icon: Leaf, accentVar: '--admin-warning', softVar: '--admin-warning-soft' },
      { id: 't4', name: 'Term 4', season: 'Winter', startDate: '2026-01-05', endDate: '2026-03-31', workingDays: 45, icon: Snowflake, accentVar: '--admin-primary', softVar: '--admin-primary-soft' },
    ],
  },
  {
    id: '2',
    name: '2024–25',
    startDate: '2024-04-01',
    endDate: '2025-03-31',
    status: 'completed',
    totalWorkingDays: 218,
    terms: [
      { id: 't5', name: 'Term 1', season: 'Summer', startDate: '2024-04-01', endDate: '2024-06-30', workingDays: 58, icon: Sun, accentVar: '--admin-success', softVar: '--admin-success-soft' },
      { id: 't6', name: 'Term 2', season: 'Monsoon', startDate: '2024-07-01', endDate: '2024-09-30', workingDays: 62, icon: CloudRain, accentVar: '--admin-info', softVar: '--admin-info-soft' },
      { id: 't7', name: 'Term 3', season: 'Autumn', startDate: '2024-10-01', endDate: '2024-12-20', workingDays: 54, icon: Leaf, accentVar: '--admin-warning', softVar: '--admin-warning-soft' },
      { id: 't8', name: 'Term 4', season: 'Winter', startDate: '2025-01-05', endDate: '2025-03-31', workingDays: 44, icon: Snowflake, accentVar: '--admin-primary', softVar: '--admin-primary-soft' },
    ],
  },
  {
    id: '3',
    name: '2026–27',
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    status: 'upcoming',
    totalWorkingDays: 220,
    terms: [
      { id: 't9', name: 'Term 1', season: 'Summer', startDate: '2026-04-01', endDate: '2026-06-30', workingDays: 60, icon: Sun, accentVar: '--admin-success', softVar: '--admin-success-soft' },
    ],
  },
];

// ── Stat Card Definitions ──
interface StatCardDef {
  label: string;
  value: string;
  numericValue: number;
  icon: React.ElementType;
  accentVar: string;
  softVar: string;
  isSpecial?: boolean;
  subLabel?: string;
}

// ── Format Date Helper ──
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ── Stat Card Component ──
function StatCard({ def }: { def: StatCardDef }) {
  const Icon = def.icon;
  const accentColor = `var(${def.accentVar})`;
  const softColor = `var(${def.softVar})`;

  return (
    <PreOneCard variant="strip" hover>
      {/* Left accent stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl"
        style={{ backgroundColor: accentColor }}
      />
      <div className="relative p-4 pl-5">
        {/* Icon — top-right */}
        <div
          className="absolute top-4 right-4 flex items-center justify-center h-10 w-10 rounded-xl"
          style={{ backgroundColor: softColor }}
        >
          <Icon className="h-4 w-4" style={{ color: accentColor }} />
        </div>

        {/* Value */}
        <p
          className="text-[28px] sm:text-[32px] font-bold leading-tight"
          style={{ color: 'var(--admin-text)' }}
        >
          {def.value}
        </p>

        {/* Label */}
        <p
          className="text-xs font-medium mt-0.5"
          style={{ color: 'var(--admin-text-muted)' }}
        >
          {def.label}
        </p>

        {/* Special: Active Year badge + date */}
        {def.isSpecial && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
              style={{
                backgroundColor: 'var(--admin-success-soft)',
                color: 'var(--admin-success)',
              }}
            >
              <CheckCircle2 className="h-2.5 w-2.5" />
              Active
            </span>
            {def.subLabel && (
              <span
                className="text-[11px]"
                style={{ color: 'var(--admin-text-subtle)' }}
              >
                {def.subLabel}
              </span>
            )}
          </div>
        )}

        {/* Decorative circle */}
        <div
          className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full opacity-[0.05]"
          style={{ backgroundColor: accentColor }}
        />
      </div>
    </PreOneCard>
  );
}

// ── Term Card Component ──
function TermCard({ term }: { term: Term }) {
  const Icon = term.icon;
  const accentColor = `var(${term.accentVar})`;
  const softColor = `var(${term.softVar})`;

  return (
    <div
      className="relative rounded-2xl border p-5 transition-shadow duration-200 hover:shadow-md overflow-hidden"
      style={{
        backgroundColor: softColor,
        borderColor: 'var(--admin-border)',
      }}
    >
      {/* Icon badge */}
      <div
        className="flex items-center justify-center h-10 w-10 rounded-xl mb-3"
        style={{ backgroundColor: accentColor }}
      >
        <Icon
          className="h-5 w-5"
          style={{ color: 'var(--admin-primary-foreground, #FFFFFF)' }}
        />
      </div>

      {/* Term name */}
      <p
        className="text-[15px] font-semibold mb-1"
        style={{ color: accentColor }}
      >
        {term.name} — {term.season}
      </p>

      {/* Date range */}
      <p
        className="text-[13px] mb-2"
        style={{ color: 'var(--admin-text-muted)' }}
      >
        {formatDate(term.startDate)} — {formatDate(term.endDate)}
      </p>

      {/* Working days */}
      <div className="flex items-center gap-1.5">
        <Clock
          className="h-3.5 w-3.5"
          style={{ color: 'var(--admin-text-subtle)' }}
        />
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--admin-text-muted)' }}
        >
          {term.workingDays} Working Days
        </span>
      </div>

      {/* Decorative circle */}
      <div
        className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full opacity-[0.07]"
        style={{ backgroundColor: accentColor }}
      />
    </div>
  );
}

// ── Status Badge Component ──
function StatusBadge({ status }: { status: AcademicYear['status'] }) {
  if (status === 'active') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
        style={{
          backgroundColor: 'var(--admin-success-soft)',
          color: 'var(--admin-success)',
        }}
      >
        <CheckCircle2 className="h-3 w-3" />
        Active
      </span>
    );
  }
  if (status === 'upcoming') {
    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
        style={{
          backgroundColor: 'var(--admin-info-soft)',
          color: 'var(--admin-info)',
        }}
      >
        Upcoming
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
      style={{
        backgroundColor: 'var(--admin-surface-2)',
        color: 'var(--admin-text-muted)',
      }}
    >
      Completed
    </span>
  );
}

// ── Main Page ──
export default function AcademicYearPage() {
  const [years, setYears] = useState<AcademicYear[]>(INITIAL_YEARS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTerm, setNewTerm] = useState({ name: '', startDate: '', endDate: '' });

  const activeYear = years.find((y) => y.status === 'active');

  // ── Stat cards ──
  const statCards: StatCardDef[] = [
    {
      label: 'Active Academic Year',
      value: activeYear?.name ?? '—',
      numericValue: years.filter((y) => y.status === 'active').length,
      icon: CalendarDays,
      accentVar: '--admin-success',
      softVar: '--admin-success-soft',
      isSpecial: true,
      subLabel: activeYear
        ? `${formatDate(activeYear.startDate)} — ${formatDate(activeYear.endDate)}`
        : undefined,
    },
    {
      label: 'Total Terms',
      value: String(activeYear?.terms.length ?? 0),
      numericValue: activeYear?.terms.length ?? 0,
      icon: BookOpen,
      accentVar: '--admin-primary',
      softVar: '--admin-primary-soft',
    },
    {
      label: 'Working Days',
      value: String(activeYear?.totalWorkingDays ?? 0),
      numericValue: activeYear?.totalWorkingDays ?? 0,
      icon: Clock,
      accentVar: '--admin-info',
      softVar: '--admin-info-soft',
    },
    {
      label: 'Academic Years',
      value: String(years.length),
      numericValue: years.length,
      icon: GraduationCap,
      accentVar: '--admin-warning',
      softVar: '--admin-warning-soft',
    },
  ];

  // ── Add Term handler ──
  const handleAddTerm = () => {
    if (!newTerm.name.trim()) {
      toast.error('Term name is required');
      return;
    }
    toast.success(`"${newTerm.name}" added to ${activeYear?.name}`);
    setNewTerm({ name: '', startDate: '', endDate: '' });
    setDialogOpen(false);
  };

  // ── Row hover handler ──
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* ── Section 1: Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0"
              style={{
                backgroundColor: 'var(--admin-primary-soft)',
                color: 'var(--admin-primary)',
              }}
            >
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <h1
                className="text-[22px] sm:text-2xl font-bold leading-tight"
                style={{ color: 'var(--admin-text)' }}
              >
                Academic Year Configuration
              </h1>
              <p
                className="text-[13px] sm:text-sm mt-0.5"
                style={{ color: 'var(--admin-text-muted)' }}
              >
                Set up academic years, terms and holiday calendars
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg"
              style={{
                borderColor: 'var(--admin-border)',
                color: 'var(--admin-primary)',
              }}
            >
              <Plus className="h-4 w-4" />
              Create Academic Year
            </Button>
            <Button
              size="sm"
              className="gap-1.5 rounded-lg"
              style={{
                backgroundColor: 'var(--admin-primary)',
                color: 'var(--admin-primary-foreground)',
              }}
            >
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* ── Section 2: Statistics Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <StatCard key={card.label} def={card} />
          ))}
        </div>

        {/* ── Section 3: Current Academic Year ── */}
        {activeYear && (
          <PreOneCard variant="default">
            <div className="p-5 sm:p-6">
              {/* Section Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  {/* Check icon badge */}
                  <div
                    className="flex items-center justify-center h-10 w-10 rounded-xl shrink-0"
                    style={{
                      backgroundColor: 'var(--admin-success-soft)',
                      color: 'var(--admin-success)',
                    }}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2
                      className="text-[17px] sm:text-lg font-semibold"
                      style={{ color: 'var(--admin-text)' }}
                    >
                      Current Academic Year: {activeYear.name}
                    </h2>
                    <p
                      className="text-xs sm:text-[13px] mt-0.5"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      {formatDate(activeYear.startDate)} —{' '}
                      {formatDate(activeYear.endDate)}
                    </p>
                  </div>
                  {/* Active badge */}
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0"
                    style={{
                      backgroundColor: 'var(--admin-success-soft)',
                      color: 'var(--admin-success)',
                    }}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    style={{
                      borderColor: 'var(--admin-border)',
                      color: 'var(--admin-primary)',
                    }}
                    onClick={() => setDialogOpen(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Term
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    style={{
                      borderColor: 'var(--admin-border)',
                      color: 'var(--admin-text-muted)',
                    }}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit Calendar
                  </Button>
                </div>
              </div>

              {/* Terms Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {activeYear.terms.map((term) => (
                  <TermCard key={term.id} term={term} />
                ))}
              </div>
            </div>
          </PreOneCard>
        )}

        {/* ── Section 4: All Academic Years Table ── */}
        <PreOneCard variant="default">
          <div className="p-5 sm:p-6">
            <h3
              className="text-base sm:text-[17px] font-semibold mb-4"
              style={{ color: 'var(--admin-text)' }}
            >
              All Academic Years
            </h3>

            <div
              className="rounded-xl overflow-hidden border"
              style={{ borderColor: 'var(--admin-border)' }}
            >
              <Table>
                <TableHeader>
                  <TableRow
                    style={{ backgroundColor: 'var(--admin-surface-2)' }}
                  >
                    <TableHead
                      className="text-xs font-semibold"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      Academic Year
                    </TableHead>
                    <TableHead
                      className="text-xs font-semibold"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      Start Date
                    </TableHead>
                    <TableHead
                      className="text-xs font-semibold"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      End Date
                    </TableHead>
                    <TableHead
                      className="text-xs font-semibold"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      Terms
                    </TableHead>
                    <TableHead
                      className="text-xs font-semibold"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      Working Days
                    </TableHead>
                    <TableHead
                      className="text-xs font-semibold"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      Status
                    </TableHead>
                    <TableHead
                      className="text-xs font-semibold text-right"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {years.map((y) => (
                    <TableRow
                      key={y.id}
                      style={{
                        backgroundColor:
                          hoveredRow === y.id
                            ? 'var(--admin-primary-soft)'
                            : 'transparent',
                        transition: 'background-color 150ms ease',
                      }}
                      onMouseEnter={() => setHoveredRow(y.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <TableCell>
                        <span
                          className="text-[13px] font-semibold"
                          style={{ color: 'var(--admin-text)' }}
                        >
                          {y.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-[13px]"
                          style={{ color: 'var(--admin-text-muted)' }}
                        >
                          {formatDate(y.startDate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-[13px]"
                          style={{ color: 'var(--admin-text-muted)' }}
                        >
                          {formatDate(y.endDate)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                          style={{
                            backgroundColor: 'var(--admin-primary-soft)',
                            color: 'var(--admin-primary)',
                          }}
                        >
                          {y.terms.length} Term{y.terms.length !== 1 ? 's' : ''}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-[13px]"
                          style={{ color: 'var(--admin-text-muted)' }}
                        >
                          {y.totalWorkingDays}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={y.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg"
                            aria-label="View academic year"
                          >
                            <Eye
                              className="h-3.5 w-3.5"
                              style={{ color: 'var(--admin-text-muted)' }}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg"
                            aria-label="Edit academic year"
                          >
                            <Edit3
                              className="h-3.5 w-3.5"
                              style={{ color: 'var(--admin-text-muted)' }}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg"
                            aria-label="More options"
                          >
                            <MoreHorizontal
                              className="h-3.5 w-3.5"
                              style={{ color: 'var(--admin-text-muted)' }}
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </PreOneCard>

        {/* ── Add Term Dialog ── */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle
                style={{ color: 'var(--admin-text)' }}
              >
                Add Term to {activeYear?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  Term Name
                </Label>
                <Input
                  value={newTerm.name}
                  onChange={(e) =>
                    setNewTerm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g., Term 5 — Spring"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    Start Date
                  </Label>
                  <Input
                    type="date"
                    value={newTerm.startDate}
                    onChange={(e) =>
                      setNewTerm((p) => ({ ...p, startDate: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    End Date
                  </Label>
                  <Input
                    type="date"
                    value={newTerm.endDate}
                    onChange={(e) =>
                      setNewTerm((p) => ({ ...p, endDate: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                style={{
                  borderColor: 'var(--admin-border)',
                  color: 'var(--admin-text-muted)',
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddTerm}
                style={{
                  backgroundColor: 'var(--admin-primary)',
                  color: 'var(--admin-primary-foreground)',
                  border: 0,
                }}
              >
                Add Term
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
