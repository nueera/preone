'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  PhoneCall,
  LayoutGrid,
  CalendarCheck,
  CheckSquare,
  Plus,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PageTransition } from '@/components/ui/page-transition';
import { AddLeadDialog } from '@/components/add-lead-dialog';

// ── Types ──
interface StatsData {
  totalLeads: number;
  leadsByStage: { stage: string; count: number }[];
  newThisWeek: number;
  followUpsToday: number;
  overdueFollowUps: number;
  conversionRate: number;
  estimatedRevenue: number;
  leadsBySource: { source: string; count: number }[];
  leadsByPriority: { priority: string; count: number }[];
  recentLeads: {
    id: string;
    parentName: string;
    childName: string;
    stage: string;
    source: string;
    priority: string;
    nextFollowUp: string | null;
    estimatedValue: number | null;
    createdAt: string;
  }[];
  tasks: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    overdue: number;
  };
}

// ── CRM Module Definition ──
interface CrmModule {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  /** CSS variable for the accent color, e.g. '--admin-primary' */
  accentVar: string;
  /** CSS variable for the soft/background color, e.g. '--admin-primary-soft' */
  accentSoftVar: string;
  /** Fallback hex for accent */
  accentHex: string;
  /** Fallback hex for soft bg */
  accentSoftHex: string;
  statLabel: string;
  getStatValue: (stats: StatsData | null) => number;
  imageSrc: string;
}

const CRM_MODULES: CrmModule[] = [
  {
    key: 'leads',
    title: 'Leads',
    description: 'Manage all admission leads and enquiries',
    href: '/admin/admissions/leads',
    icon: Users,
    accentVar: '--admin-primary',
    accentSoftVar: '--admin-primary-soft',
    accentHex: '#7C3AED',
    accentSoftHex: '#f5f3ff',
    statLabel: 'Total Leads',
    getStatValue: (s) => s?.totalLeads ?? 0,
    imageSrc: '/icons/admin/crm/leads.webp',
  },
  {
    key: 'pipeline',
    title: 'Pipeline',
    description: 'Visualize your admission pipeline stages',
    href: '/admin/admissions/pipeline',
    icon: LayoutGrid,
    accentVar: '--admin-info',
    accentSoftVar: '--admin-info-soft',
    accentHex: '#3b82f6',
    accentSoftHex: '#eff6ff',
    statLabel: 'In Pipeline',
    getStatValue: (s) =>
      (s?.leadsByStage ?? [])
        .filter((ls) => !['ENROLLED', 'LOST'].includes(ls.stage))
        .reduce((sum, ls) => sum + ls.count, 0),
    imageSrc: '/icons/admin/crm/pipeline.webp',
  },
  {
    key: 'followups',
    title: 'Follow Ups',
    description: 'Track follow-ups and scheduled calls',
    href: '/admin/admissions/followups',
    icon: PhoneCall,
    accentVar: '--admin-success',
    accentSoftVar: '--admin-success-soft',
    accentHex: '#10b981',
    accentSoftHex: '#ecfdf5',
    statLabel: 'Due Today',
    getStatValue: (s) => s?.followUpsToday ?? 0,
    imageSrc: '/icons/admin/crm/followups.webp',
  },
  {
    key: 'visits',
    title: 'Visits',
    description: 'Schedule and manage campus visits',
    href: '/admin/admissions/visits',
    icon: CalendarCheck,
    accentVar: '--admin-warning',
    accentSoftVar: '--admin-warning-soft',
    accentHex: '#f59e0b',
    accentSoftHex: '#fffbeb',
    statLabel: 'Visits',
    getStatValue: (s) =>
      (s?.leadsByStage ?? []).find((ls) => ls.stage === 'VISITED')?.count ?? 0,
    imageSrc: '/icons/admin/crm/visits.webp',
  },
  {
    key: 'tasks',
    title: 'CRM Tasks',
    description: 'Manage your tasks and to-dos',
    href: '/admin/admissions/tasks',
    icon: CheckSquare,
    accentVar: '--admin-accent',
    accentSoftVar: '--admin-warning-soft',
    accentHex: '#f97316',
    accentSoftHex: '#fff7ed',
    statLabel: 'Open Tasks',
    getStatValue: (s) => (s?.tasks?.todo ?? 0) + (s?.tasks?.inProgress ?? 0),
    imageSrc: '/icons/admin/crm/tasks.webp',
  },
];

// ── Helper: Get auth token ──
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

// ── Module Card Component ──
function CrmModuleCard({ module, stats }: { module: CrmModule; stats: StatsData | null }) {
  const Icon = module.icon;
  const statValue = module.getStatValue(stats);

  return (
    <Link href={module.href} className="block group h-full">
      <div
        className="relative flex flex-col items-center rounded-2xl overflow-hidden h-full min-h-[340px] sm:min-h-[400px] transition-all duration-200 group-hover:shadow-lg group-hover:-translate-y-1 border border-black/5"
        style={{ backgroundColor: `var(${module.accentSoftVar}, ${module.accentSoftHex})` }}
      >
        {/* Top accent circle with icon */}
        <div className="pt-4 sm:pt-6 pb-2 flex flex-col items-center">
          <div
            className="h-12 w-12 sm:h-14 sm:w-14 rounded-full flex items-center justify-center shadow-sm"
            style={{
              backgroundColor: 'white',
              color: `var(${module.accentVar}, ${module.accentHex})`,
            }}
          >
            <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
        </div>

        {/* Stat number */}
        <div className="flex flex-col items-center px-3 sm:px-4 pb-2">
          <span
            className="text-2xl sm:text-3xl font-bold leading-tight"
            style={{ color: `var(${module.accentVar}, ${module.accentHex})` }}
          >
            {statValue}
          </span>
          <span className="text-[11px] sm:text-xs font-medium text-[var(--admin-text-muted)] mt-0.5">
            {module.statLabel}
          </span>
        </div>

        {/* Illustration area — always visible, compact on mobile */}
        <div className="flex-1 w-full relative flex items-end justify-center overflow-hidden">
          <div className="relative w-[85%] sm:w-[90%] h-full max-h-[200px] sm:max-h-[260px]">
            <Image
              src={module.imageSrc}
              alt={module.title}
              fill
              className="object-contain object-bottom"
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Bottom: title + description + arrow */}
        <div className="w-full px-3 sm:px-4 pt-2 sm:pt-3 pb-3 sm:pb-4 flex items-center justify-between">
          <div className="min-w-0">
            <h3
              className="font-semibold text-[13px] sm:text-sm"
              style={{ color: `var(${module.accentVar}, ${module.accentHex})` }}
            >
              {module.title}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-[var(--admin-text-muted)] mt-0.5 leading-snug truncate">
              {module.description}
            </p>
          </div>
          <ChevronRight
            className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 text-[var(--admin-text-subtle)] group-hover:translate-x-0.5 transition-transform"
            style={{ color: `var(${module.accentVar}, ${module.accentHex})` }}
          />
        </div>
      </div>
    </Link>
  );
}

// ── Main Page Component ──
export default function CrmDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addLeadOpen, setAddLeadOpen] = useState(false);

  // ── Fetch stats data ──
  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch('/api/crm/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch CRM statistics');
      }
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch CRM stats:', err);
      toast.error('Failed to load CRM dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ── Handle lead created ──
  const handleLeadCreated = () => {
    setAddLeadOpen(false);
    fetchStats();
    toast.success('Lead created successfully');
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="page-heading font-bold text-[var(--admin-text)] flex items-center gap-2">
              <span className="text-portal-600">Admission CRM</span>
            </h1>
            <p className="text-[13px] sm:text-sm text-[var(--admin-text-muted)] mt-1">
              Track leads, manage follow-ups, and grow enrollments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchStats();
                toast.success('Dashboard refreshed');
              }}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              onClick={() => setAddLeadOpen(true)}
              className="gap-1.5 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Lead</span>
            </Button>
          </div>
        </div>

        {/* ── CRM Module Cards Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {CRM_MODULES.map((mod) => (
            <CrmModuleCard key={mod.key} module={mod} stats={loading ? null : stats} />
          ))}
        </div>
      </div>

      {/* ── Add Lead Dialog ── */}
      <AddLeadDialog
        open={addLeadOpen}
        onOpenChange={setAddLeadOpen}
        onLeadCreated={handleLeadCreated}
      />
    </PageTransition>
  );
}
