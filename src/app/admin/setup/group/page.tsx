'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Edit3,
  Lightbulb,
  FileText,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Save,
  School,
  Calendar,
  GraduationCap,
  IndianRupee,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */

interface Group {
  id: string;
  name: string;
  ageGroup: string;
  description: string;
  type: 'default' | 'custom';
  status: 'active' | 'inactive';
  accentVar: string;
  accentSoftVar: string;
  illustration?: string;
}

interface StepperStep {
  key: string;
  label: string;
  href: string;
  status: 'completed' | 'current' | 'pending';
  statusLabel: string;
  icon: React.ReactNode;
}

/* ──────────────────────────────────────────────
   Mock Data
   ────────────────────────────────────────────── */

const STEPS: StepperStep[] = [
  {
    key: 'school',
    label: 'School Profile',
    href: '/admin/setup/school',
    status: 'completed',
    statusLabel: 'Completed',
    icon: <School className="h-4 w-4" />,
  },
  {
    key: 'academic-year',
    label: 'Academic Year',
    href: '/admin/setup/academic-year',
    status: 'completed',
    statusLabel: 'Completed',
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    key: 'groups',
    label: 'Groups',
    href: '/admin/setup/group',
    status: 'current',
    statusLabel: 'In Progress',
    icon: <Users className="h-4 w-4" />,
  },
  {
    key: 'classes',
    label: 'Classes & Program',
    href: '/admin/setup/classes',
    status: 'pending',
    statusLabel: 'Pending',
    icon: <GraduationCap className="h-4 w-4" />,
  },
  {
    key: 'fee-structure',
    label: 'Fee Structure',
    href: '/admin/setup/fee-structure',
    status: 'pending',
    statusLabel: 'Pending',
    icon: <IndianRupee className="h-4 w-4" />,
  },
  {
    key: 'staff',
    label: 'Staff Setup',
    href: '/admin/setup/staff',
    status: 'pending',
    statusLabel: 'Pending',
    icon: <Users className="h-4 w-4" />,
  },
];

const DEFAULT_GROUPS: Group[] = [
  {
    id: '1',
    name: 'Playgroup',
    ageGroup: '2-3 years',
    description:
      'Early exploration and socialization for toddlers through play-based learning activities.',
    type: 'default',
    status: 'active',
    accentVar: '--admin-warning',
    accentSoftVar: '--admin-warning-soft',
    illustration: '/illustrations/playgroup.svg',
  },
  {
    id: '2',
    name: 'Nursery',
    ageGroup: '3-4 years',
    description:
      'Foundational learning with structured activities introducing early literacy and numeracy.',
    type: 'default',
    status: 'active',
    accentVar: '--admin-success',
    accentSoftVar: '--admin-success-soft',
    illustration: '/illustrations/nursery.svg',
  },
  {
    id: '3',
    name: 'LKG',
    ageGroup: '4-5 years',
    description:
      'Lower Kindergarten focusing on reading readiness, basic math concepts, and creative expression.',
    type: 'default',
    status: 'active',
    accentVar: '--admin-info',
    accentSoftVar: '--admin-info-soft',
    illustration: '/illustrations/lkg.svg',
  },
  {
    id: '4',
    name: 'UKG',
    ageGroup: '5-6 years',
    description:
      'Upper Kindergarten preparing children for primary school with advanced learning milestones.',
    type: 'default',
    status: 'active',
    accentVar: '--admin-primary',
    accentSoftVar: '--admin-primary-soft',
    illustration: '/illustrations/ukg.svg',
  },
];

const CUSTOM_GROUPS: Group[] = [
  {
    id: '5',
    name: 'Montessori Junior',
    ageGroup: '3-5 years',
    description:
      'Montessori method based mixed-age group for independent learning and discovery.',
    type: 'custom',
    status: 'active',
    accentVar: '--admin-error',
    accentSoftVar: '--admin-error-soft',
  },
];

const ALL_GROUPS = [...DEFAULT_GROUPS, ...CUSTOM_GROUPS];

/* ──────────────────────────────────────────────
   Component
   ────────────────────────────────────────────── */

export default function GroupManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    ageGroup: '',
    description: '',
  });
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  // Filtered groups for table
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return ALL_GROUPS;
    const q = searchQuery.toLowerCase();
    return ALL_GROUPS.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.ageGroup.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Summary stats
  const summary = useMemo(
    () => ({
      total: ALL_GROUPS.length,
      defaultCount: DEFAULT_GROUPS.length,
      customCount: CUSTOM_GROUPS.length,
      activeCount: ALL_GROUPS.filter((g) => g.status === 'active').length,
    }),
    []
  );

  // Handle image error
  const handleImgError = (id: string) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  };

  // Create group handler
  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) {
      toast.error('Group name is required');
      return;
    }
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSaving(false);
    setDialogOpen(false);
    setNewGroup({ name: '', ageGroup: '', description: '' });
    toast.success(`"${newGroup.name}" group created successfully`);
  };

  // Close dialog and reset
  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setNewGroup({ name: '', ageGroup: '', description: '' });
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Main Content (75%) ── */}
        <div className="flex-1 lg:w-[75%] space-y-6">
          {/* ──────────────────────────────────────
              Section 1: Page Header
              ────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'var(--admin-primary-soft)' }}
              >
                <Users
                  className="h-6 w-6"
                  style={{ color: 'var(--admin-primary)' }}
                />
              </div>
              <div>
                <h1
                  className="text-[22px] leading-6 font-bold font-heading"
                  style={{ color: 'var(--admin-text)' }}
                >
                  Group Management
                </h1>
                <p
                  className="text-[13px] leading-4 mt-0.5"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  Manage and organize different age groups in your preschool.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="gap-1.5 rounded-lg text-[13px]"
                style={{
                  borderColor: 'var(--admin-primary)',
                  color: 'var(--admin-primary)',
                }}
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Create Custom Group
              </Button>
              <Button
                className="gap-1.5 rounded-lg text-[13px] text-white border-0"
                style={{ backgroundColor: 'var(--admin-primary)' }}
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>

          {/* ──────────────────────────────────────
              Section 2: Setup Progress Stepper
              ────────────────────────────────────── */}
          <div
            className="rounded-2xl p-5"
            style={{
              backgroundColor: 'var(--admin-surface)',
              border: '1px solid var(--admin-border)',
            }}
          >
            <div className="flex items-center">
              {STEPS.map((step, idx) => {
                const isCompleted = step.status === 'completed';
                const isCurrent = step.status === 'current';
                const isPending = step.status === 'pending';

                return (
                  <React.Fragment key={step.key}>
                    {/* Connector line (before each step except first) */}
                    {idx > 0 && (
                      <div
                        className="flex-1 border-t-2 border-dashed -mx-1 mt-[-28px]"
                        style={{
                          borderColor: isCompleted
                            ? 'var(--admin-success)'
                            : 'var(--admin-border)',
                        }}
                      />
                    )}

                    {/* Step column */}
                    <Link
                      href={step.href}
                      className="flex-1 flex flex-col items-center gap-1.5"
                    >
                      {/* Circle */}
                      <div
                        className={cn(
                          'h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold',
                          isCompleted && 'border-0',
                          isCurrent && 'border-2',
                          isPending && 'border-0'
                        )}
                        style={{
                          backgroundColor: isCompleted
                            ? 'var(--admin-success)'
                            : isCurrent
                              ? 'var(--admin-primary)'
                              : 'var(--admin-surface-2)',
                          color:
                            isCompleted || isCurrent
                              ? 'white'
                              : 'var(--admin-text-muted)',
                          borderColor: isCurrent
                            ? 'var(--admin-primary)'
                            : undefined,
                          boxShadow: isCurrent
                            ? '0 0 0 3px var(--admin-primary-soft)'
                            : 'none',
                        }}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          idx + 1
                        )}
                      </div>

                      {/* Label */}
                      <span
                        className="text-[11px] font-semibold max-w-[80px] text-center leading-tight"
                        style={{
                          color: isCompleted
                            ? 'var(--admin-success)'
                            : isCurrent
                              ? 'var(--admin-primary)'
                              : 'var(--admin-text)',
                        }}
                      >
                        {step.label}
                      </span>
                      <span
                        className="text-[10px] font-normal"
                        style={{
                          color: isCompleted
                            ? 'var(--admin-success)'
                            : isCurrent
                              ? 'var(--admin-primary)'
                              : 'var(--admin-text-muted)',
                        }}
                      >
                        {step.statusLabel}
                      </span>
                    </Link>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ──────────────────────────────────────
              Section 3: Default Groups
              ────────────────────────────────────── */}
          <PreOneCard variant="default">
            <div className="p-5 sm:p-6">
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="h-9 w-9 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: 'var(--admin-primary-soft)' }}
                >
                  <Users
                    className="h-[18px] w-[18px]"
                    style={{ color: 'var(--admin-primary)' }}
                  />
                </div>
                <div>
                  <h2
                    className="text-[17px] leading-[18px] font-semibold font-heading"
                    style={{ color: 'var(--admin-text)' }}
                  >
                    Default Groups
                  </h2>
                  <p
                    className="text-[13px] mt-0.5"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    These are standard age-based groups for preschools. You can
                    edit or add your own groups.
                  </p>
                </div>
              </div>

              {/* Group Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {DEFAULT_GROUPS.map((group) => {
                  const accentColor = `var(${group.accentVar})`;
                  const softColor = `var(${group.accentSoftVar})`;

                  return (
                    <div
                      key={group.id}
                      className="rounded-xl p-5 flex flex-col min-h-[240px] transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                      style={{
                        backgroundColor: softColor,
                        border: '1px solid var(--admin-border)',
                      }}
                    >
                      {/* Top row: Illustration + Menu */}
                      <div className="flex items-start justify-between">
                        <div className="h-12 w-12 sm:h-14 sm:w-14 relative">
                          {!imgErrors[group.id] && group.illustration ? (
                            <Image
                              src={group.illustration}
                              alt={`${group.name} illustration`}
                              width={56}
                              height={56}
                              className="h-12 w-12 sm:h-14 sm:w-14 object-contain"
                              onError={() => handleImgError(group.id)}
                            />
                          ) : (
                            <div
                              className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: accentColor }}
                            >
                              <Users className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                            </div>
                          )}
                        </div>
                        <button
                          className="h-7 w-7 rounded-lg flex items-center justify-center hover:opacity-80"
                          aria-label={`More options for ${group.name}`}
                        >
                          <MoreHorizontal
                            className="h-4 w-4"
                            style={{ color: 'var(--admin-text-muted)' }}
                          />
                        </button>
                      </div>

                      {/* Title */}
                      <h3
                        className="text-base font-semibold mt-3"
                        style={{ color: 'var(--admin-text)' }}
                      >
                        {group.name}
                      </h3>

                      {/* Age group */}
                      <p
                        className="text-sm mt-1"
                        style={{ color: 'var(--admin-text-muted)' }}
                      >
                        Age group: {group.ageGroup}
                      </p>

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Default badge */}
                      <div
                        className="rounded-md px-2.5 py-1 text-xs font-medium self-start"
                        style={{
                          backgroundColor: accentColor,
                          color: 'var(--admin-primary-foreground)',
                        }}
                      >
                        Default
                      </div>
                    </div>
                  );
                })}

                {/* Add Custom Group Card */}
                <div
                  className="rounded-xl min-h-[240px] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--admin-surface)',
                    border: '2px dashed var(--admin-border-strong)',
                  }}
                  onClick={() => setDialogOpen(true)}
                >
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--admin-surface-2)' }}
                  >
                    <Plus
                      className="h-6 w-6"
                      style={{ color: 'var(--admin-text-muted)' }}
                    />
                  </div>
                  <p
                    className="text-base font-semibold"
                    style={{ color: 'var(--admin-text)' }}
                  >
                    Add Custom Group
                  </p>
                  <p
                    className="text-sm"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    Create your own group
                  </p>
                </div>
              </div>
            </div>
          </PreOneCard>

          {/* ──────────────────────────────────────
              Section 4: All Groups Table
              ────────────────────────────────────── */}
          <PreOneCard variant="default">
            <div className="p-5 sm:p-6">
              {/* Section Header */}
              <div className="mb-4">
                <h2
                  className="text-[17px] leading-[18px] font-semibold font-heading"
                  style={{ color: 'var(--admin-text)' }}
                >
                  All Groups
                </h2>
                <p
                  className="text-[13px] mt-0.5"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  View and manage all groups in your preschool.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative mb-4">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: 'var(--admin-text-subtle)' }}
                />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search groups..."
                  className="h-10 pl-9 rounded-lg"
                  style={{
                    borderColor: 'var(--admin-border)',
                    backgroundColor: 'var(--admin-surface)',
                  }}
                />
              </div>

              {/* Table */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid var(--admin-border)' }}
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
                        Group Name
                      </TableHead>
                      <TableHead
                        className="text-xs font-semibold"
                        style={{ color: 'var(--admin-text-muted)' }}
                      >
                        Age Group
                      </TableHead>
                      <TableHead
                        className="text-xs font-semibold hidden lg:table-cell"
                        style={{ color: 'var(--admin-text-muted)' }}
                      >
                        Description
                      </TableHead>
                      <TableHead
                        className="text-xs font-semibold"
                        style={{ color: 'var(--admin-text-muted)' }}
                      >
                        Type
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
                    {filteredGroups.map((group) => {
                      const accentColor = `var(${group.accentVar})`;
                      const softColor = `var(${group.accentSoftVar})`;

                      return (
                        <TableRow
                          key={group.id}
                          className="group transition-colors"
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              'var(--admin-primary-soft)')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              'transparent')
                          }
                        >
                          {/* Group Name with Avatar */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                                style={{
                                  backgroundColor: softColor,
                                }}
                              >
                                <Users
                                  className="h-4 w-4"
                                  style={{ color: accentColor }}
                                />
                              </div>
                              <span
                                className="text-[13px] font-semibold"
                                style={{ color: 'var(--admin-text)' }}
                              >
                                {group.name}
                              </span>
                            </div>
                          </TableCell>

                          {/* Age Group */}
                          <TableCell>
                            <span
                              className="text-[13px]"
                              style={{ color: 'var(--admin-text-muted)' }}
                            >
                              {group.ageGroup}
                            </span>
                          </TableCell>

                          {/* Description (desktop only) */}
                          <TableCell className="hidden lg:table-cell">
                            <span
                              className="text-[13px] line-clamp-1"
                              style={{ color: 'var(--admin-text-muted)' }}
                            >
                              {group.description}
                            </span>
                          </TableCell>

                          {/* Type Badge */}
                          <TableCell>
                            {group.type === 'default' ? (
                              <span
                                className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                                style={{
                                  backgroundColor: softColor,
                                  color: accentColor,
                                }}
                              >
                                Default
                              </span>
                            ) : (
                              <span
                                className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
                                style={{
                                  backgroundColor: 'var(--admin-error-soft)',
                                  color: 'var(--admin-error)',
                                }}
                              >
                                Custom
                              </span>
                            )}
                          </TableCell>

                          {/* Status Badge */}
                          <TableCell>
                            {group.status === 'active' ? (
                              <span
                                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                                style={{
                                  backgroundColor: 'var(--admin-success-soft)',
                                  color: 'var(--admin-success)',
                                }}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Active
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold"
                                style={{
                                  backgroundColor: 'var(--admin-surface-2)',
                                  color: 'var(--admin-text-muted)',
                                }}
                              >
                                Inactive
                              </span>
                            )}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                className="h-7 w-7 rounded-lg flex items-center justify-center hover:opacity-80"
                                aria-label={`Edit ${group.name}`}
                              >
                                <Edit3
                                  className="h-3.5 w-3.5"
                                  style={{
                                    color: 'var(--admin-text-muted)',
                                  }}
                                />
                              </button>
                              <button
                                className="h-7 w-7 rounded-lg flex items-center justify-center hover:opacity-80"
                                aria-label={`More options for ${group.name}`}
                              >
                                <MoreHorizontal
                                  className="h-3.5 w-3.5"
                                  style={{
                                    color: 'var(--admin-text-muted)',
                                  }}
                                />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <span
                  className="text-xs"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  Showing 1 to {filteredGroups.length} of {filteredGroups.length}{' '}
                  groups
                </span>
                <div className="flex items-center gap-1">
                  <button
                    className="h-8 w-8 rounded-lg flex items-center justify-center border"
                    style={{
                      borderColor: 'var(--admin-border)',
                      color: 'var(--admin-text-muted)',
                    }}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                    style={{ backgroundColor: 'var(--admin-primary)' }}
                  >
                    1
                  </button>
                  <button
                    className="h-8 w-8 rounded-lg flex items-center justify-center border"
                    style={{
                      borderColor: 'var(--admin-border)',
                      color: 'var(--admin-text-muted)',
                    }}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </PreOneCard>
        </div>

        {/* ── Right Sidebar (25%) ── */}
        <div className="hidden lg:block lg:w-[25%] lg:min-w-[260px] space-y-5">
          {/* Card 1: Group Tips */}
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: 'var(--admin-surface)',
              border: '1px solid var(--admin-border)',
            }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--admin-primary-soft)' }}
              >
                <Lightbulb
                  className="h-4 w-4"
                  style={{ color: 'var(--admin-primary)' }}
                />
              </div>
              <h3
                className="text-[15px] font-semibold font-heading"
                style={{ color: 'var(--admin-text)' }}
              >
                Group Tips
              </h3>
            </div>
            <ul className="space-y-3">
              {[
                'Groups help organize children by age and developmental stage.',
                'Default groups follow standard preschool age categories.',
                'You can create custom groups for mixed-age or specialized programs.',
                'Each group can have multiple classes assigned to it.',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2
                    className="h-3.5 w-3.5 mt-0.5 flex-shrink-0"
                    style={{ color: 'var(--admin-success)' }}
                  />
                  <span
                    className="text-[13px] leading-snug"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    {tip}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card 2: Group Summary */}
          <div
            className="rounded-xl p-5"
            style={{
              backgroundColor: 'var(--admin-surface)',
              border: '1px solid var(--admin-border)',
            }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--admin-primary-soft)' }}
              >
                <FileText
                  className="h-4 w-4"
                  style={{ color: 'var(--admin-primary)' }}
                />
              </div>
              <h3
                className="text-[15px] font-semibold font-heading"
                style={{ color: 'var(--admin-text)' }}
              >
                Group Summary
              </h3>
            </div>
            <div className="space-y-3">
              {[
                {
                  label: 'Total Groups',
                  value: summary.total,
                  icon: <Users className="h-4 w-4" />,
                },
                {
                  label: 'Default Groups',
                  value: summary.defaultCount,
                  icon: <CheckCircle2 className="h-4 w-4" />,
                },
                {
                  label: 'Custom Groups',
                  value: summary.customCount,
                  icon: <UserPlus className="h-4 w-4" />,
                },
                {
                  label: 'Active Groups',
                  value: summary.activeCount,
                  icon: <Circle className="h-4 w-4" />,
                },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ color: 'var(--admin-text-subtle)' }}>
                      {item.icon}
                    </span>
                    <span
                      className="text-[13px]"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      {item.label}
                    </span>
                  </div>
                  <span
                    className="text-sm font-bold"
                    style={{ color: 'var(--admin-text)' }}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Need Help? */}
          <div
            className="rounded-xl p-5 text-center"
            style={{
              backgroundColor: 'var(--admin-surface)',
              border: '1px solid var(--admin-border)',
            }}
          >
            {/* PreO Character */}
            <div className="flex justify-center mb-3">
              <Image
                src="/preo-character.svg"
                alt="PreO character"
                width={80}
                height={80}
                className="rounded-xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <h3
              className="text-[15px] font-semibold font-heading"
              style={{ color: 'var(--admin-primary)' }}
            >
              Need Help?
            </h3>
            <p
              className="text-[13px] mt-1 mb-4"
              style={{ color: 'var(--admin-text-muted)' }}
            >
              I&apos;m PreO! I can help you manage groups easily.
            </p>
            <Button
              variant="outline"
              className="gap-1.5 rounded-lg text-[13px] w-full"
              style={{
                borderColor: 'var(--admin-primary)',
                color: 'var(--admin-primary)',
              }}
            >
              <HelpCircle className="h-4 w-4" />
              Ask PreO
            </Button>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────
          Create Group Dialog
          ────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent
          className="max-w-md rounded-2xl"
          style={{
            backgroundColor: 'var(--admin-surface)',
            borderColor: 'var(--admin-border)',
          }}
        >
          <DialogHeader>
            <DialogTitle
              className="text-[17px] font-semibold"
              style={{ color: 'var(--admin-text)' }}
            >
              Create Custom Group
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium"
                style={{ color: 'var(--admin-text)' }}
              >
                Group Name
              </label>
              <Input
                value={newGroup.name}
                onChange={(e) =>
                  setNewGroup((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g., Montessori Junior"
                className="h-10 rounded-lg"
                style={{
                  borderColor: 'var(--admin-border)',
                  backgroundColor: 'var(--admin-surface)',
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium"
                style={{ color: 'var(--admin-text)' }}
              >
                Age Group
              </label>
              <Input
                value={newGroup.ageGroup}
                onChange={(e) =>
                  setNewGroup((p) => ({ ...p, ageGroup: e.target.value }))
                }
                placeholder="e.g., 3-5 years"
                className="h-10 rounded-lg"
                style={{
                  borderColor: 'var(--admin-border)',
                  backgroundColor: 'var(--admin-surface)',
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label
                className="text-sm font-medium"
                style={{ color: 'var(--admin-text)' }}
              >
                Description
              </label>
              <Input
                value={newGroup.description}
                onChange={(e) =>
                  setNewGroup((p) => ({
                    ...p,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description of this group"
                className="h-10 rounded-lg"
                style={{
                  borderColor: 'var(--admin-border)',
                  backgroundColor: 'var(--admin-surface)',
                }}
              />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="rounded-lg"
              style={{
                borderColor: 'var(--admin-border)',
                color: 'var(--admin-text-muted)',
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={saving}
              className="rounded-lg text-white border-0"
              style={{ backgroundColor: 'var(--admin-primary)' }}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
