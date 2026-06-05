'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, isTomorrow, isToday } from 'date-fns';
import {
  Megaphone,
  Plus,
  LayoutGrid,
  List,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  Star,
  Tag,
  UserCircle,
  ChevronDown,
  X,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  IndianRupee,
  GripVertical,
  ArrowUpRight,
  CircleDot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CRM_COLORS, PORTAL_THEMES, CHART_PALETTE } from '@/lib/theme-tokens';
import { toast } from 'sonner';
import { PageTransition } from '@/components/ui/page-transition';
import { AnimatedCard } from '@/components/ui/animated-card';
import { AddLeadDialog } from '@/components/add-lead-dialog';
import { LeadDetailDrawer } from '@/components/lead-detail-drawer';
import { CrmAnalytics } from '@/components/crm-analytics';

// ── @dnd-kit imports ──
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ── Types ──
interface FollowUp {
  id: string;
  type: string;
  dateTime: string;
  outcome: string;
  nextFollowUp: string | null;
  notes: string;
  createdBy: string | null;
  createdAt: string;
}

interface Lead {
  id: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string | null;
  childName: string;
  childAge: string | null;
  source: string;
  stage: string;
  priority: string;
  programInterest: string | null;
  estimatedValue: number | null;
  assignedTo: string | null;
  notes: string | null;
  nextFollowUp: string | null;
  convertedStudentId: string | null;
  lostReason: string | null;
  createdAt: string;
  updatedAt: string;
  followUps: FollowUp[];
}

interface PipelineStage {
  key: string;
  label: string;
  color: string;
  cardBg: string;
  count: number;
  totalValue: number;
  leads: Lead[];
}

// ── Constants ──
const STAGE_CONFIG: Record<string, { label: string; color: string; cardBg: string; textColor: string }> = {
  NEW: { label: 'New', color: CRM_COLORS.NEW?.hex ?? '#3b82f6', cardBg: 'bg-white', textColor: 'text-gray-600' },
  CONTACTED: { label: 'Contacted', color: CRM_COLORS.CONTACTED?.hex ?? '#8b5cf6', cardBg: 'bg-blue-50', textColor: 'text-blue-600' },
  VISITED: { label: 'Visited', color: CRM_COLORS.TOUR_SCHEDULED?.hex ?? '#f59e0b', cardBg: 'bg-purple-50', textColor: 'text-purple-600' },
  APPLIED: { label: 'Applied', color: CRM_COLORS.APPLICATION?.hex ?? '#f97316', cardBg: 'bg-yellow-50', textColor: 'text-yellow-600' },
  ENROLLED: { label: 'Enrolled', color: CRM_COLORS.ENROLLED?.hex ?? '#10b981', cardBg: 'bg-green-50', textColor: 'text-green-600' },
  LOST: { label: 'Lost', color: CRM_COLORS.LOST?.hex ?? '#9ca3af', cardBg: 'bg-red-50', textColor: 'text-red-600' },
};

const SOURCE_LABELS: Record<string, string> = {
  INSTAGRAM: 'Instagram',
  FACEBOOK: 'Facebook',
  GOOGLE: 'Google',
  WALK_IN: 'Walk-in',
  REFERRAL: 'Referral',
  WEBSITE: 'Website',
  JUSTDIAL: 'JustDial',
  SULEKHA: 'Sulekha',
  NEWSPAPER: 'Newspaper',
  HOARDING: 'Hoarding',
  EVENT: 'Event',
  OTHER: 'Other',
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  HIGH: { label: 'High', color: 'text-red-600', bg: 'bg-red-50' },
  NORMAL: { label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  LOW: { label: 'Low', color: 'text-gray-500', bg: 'bg-gray-50' },
};

const STAGE_KEYS = ['NEW', 'CONTACTED', 'VISITED', 'APPLIED', 'ENROLLED', 'LOST'] as const;

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

// ── Loading Skeleton for Pipeline ──
function PipelineSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STAGE_KEYS.map((key) => (
        <div key={key} className="flex flex-col min-w-[280px] w-[280px]">
          <div className="flex items-center justify-between p-3 rounded-t-xl bg-gray-100">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex flex-col gap-2 p-2 bg-gray-50/50 rounded-b-xl min-h-[200px] border border-t-0 border-gray-100">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Loading Skeleton for List View ──
function ListSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Lead Card (Sortable) ──
function LeadCard({ lead, onClick }: { lead: Lead; onClick: (lead: Lead) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { lead },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const stageConfig = STAGE_CONFIG[lead.stage] || STAGE_CONFIG.NEW;
  const priorityConfig = PRIORITY_CONFIG[lead.priority] || PRIORITY_CONFIG.NORMAL;
  const followUpDate = lead.nextFollowUp ? new Date(lead.nextFollowUp) : null;
  const isFollowUpSoon = followUpDate && (isTomorrow(followUpDate) || isToday(followUpDate));

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card
        className={cn(
          'p-3 cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 group',
          stageConfig.cardBg,
          isDragging && 'shadow-lg rotate-2'
        )}
        style={{ borderLeftColor: stageConfig.color }}
        onClick={() => onClick(lead)}
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm flex-shrink-0">🧒</span>
              <span className="font-semibold text-gray-900 text-sm leading-tight truncate">
                {lead.childName}
              </span>
            </div>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0',
                priorityConfig.bg,
                priorityConfig.color
              )}
            >
              {priorityConfig.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <UserCircle className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{lead.parentName}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Phone className="h-3 w-3 flex-shrink-0" />
            <span>{lead.parentPhone}</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-gray-500">
              <Tag className="h-3 w-3 flex-shrink-0" />
              {SOURCE_LABELS[lead.source] || lead.source}
            </span>
          </div>

          {lead.estimatedValue && (
            <div className="text-xs font-medium text-gray-700">
              💰 Est: ₹{lead.estimatedValue.toLocaleString('en-IN')}
            </div>
          )}

          {followUpDate && (
            <div
              className={cn(
                'text-[11px] flex items-center gap-1',
                isFollowUpSoon ? 'text-orange-600 font-medium' : 'text-gray-500'
              )}
            >
              <Calendar className="h-3 w-3 flex-shrink-0" />
              Follow-up:{' '}
              {isToday(followUpDate)
                ? 'Today'
                : isTomorrow(followUpDate)
                  ? 'Tomorrow'
                  : format(followUpDate, 'dd MMM')}
            </div>
          )}

          <div className="flex items-center gap-1.5 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] px-2 text-portal-600 hover:text-portal-700 hover:bg-portal-50"
              onClick={(e) => {
                e.stopPropagation();
                onClick(lead);
              }}
            >
              View
            </Button>
            {lead.stage === 'ENROLLED' && !lead.convertedStudentId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(lead);
                }}
              >
                Convert
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Drag Overlay Card (Ghost) ──
function DragOverlayCard({ lead }: { lead: Lead }) {
  const stageConfig = STAGE_CONFIG[lead.stage] || STAGE_CONFIG.NEW;
  const priorityConfig = PRIORITY_CONFIG[lead.priority] || PRIORITY_CONFIG.NORMAL;

  return (
    <Card
      className={cn(
        'p-3 shadow-xl border-l-4 rotate-3 opacity-95 min-w-[260px]',
        stageConfig.cardBg
      )}
      style={{ borderLeftColor: stageConfig.color }}
    >
      <div className="space-y-1.5">
        <div className="flex items-start justify-between">
          <span className="font-semibold text-gray-900 text-sm truncate">
            🧒 {lead.childName}
          </span>
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
              priorityConfig.bg,
              priorityConfig.color
            )}
          >
            {priorityConfig.label}
          </span>
        </div>
        <div className="text-xs text-gray-600">
          <UserCircle className="h-3 w-3 inline mr-1" />
          {lead.parentName}
        </div>
        <div className="text-xs text-gray-500">
          <Phone className="h-3 w-3 inline mr-1" />
          {lead.parentPhone}
        </div>
      </div>
    </Card>
  );
}

// ── Kanban Column ──
function KanbanColumn({
  stage,
  leads,
  onLeadClick,
}: {
  stage: PipelineStage;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}) {
  return (
    <div className="flex flex-col min-w-[280px] w-[280px]">
      {/* Column Header */}
      <div
        className="flex items-center justify-between p-3 rounded-t-xl"
        style={{ backgroundColor: stage.color + '15' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full ring-2 ring-white shadow-sm"
            style={{ backgroundColor: stage.color }}
          />
          <span className="font-semibold text-sm text-gray-800">{stage.label}</span>
          <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
            {stage.count}
          </span>
        </div>
        <span className="text-xs text-gray-500 font-medium">
          ₹{stage.totalValue.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Cards Container */}
      <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <div
          className="flex flex-col gap-2 p-2 bg-gray-50/50 rounded-b-xl min-h-[200px] border border-t-0 border-gray-100 max-h-[calc(100vh-340px)] overflow-y-auto"
          style={{ borderTopColor: stage.color }}
        >
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
          ))}
          {leads.length === 0 && (
            <div className="flex flex-col items-center justify-center h-24 text-xs text-gray-400 gap-1">
              <CircleDot className="h-5 w-5 text-gray-300" />
              No leads in this stage
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ── Stats Summary Bar ──
function StatsBar({
  stats,
}: {
  stats: {
    totalLeads: number;
    newThisWeek: number;
    followUpsToday: number;
    overdueFollowUps: number;
    conversionRate: number;
    estimatedRevenue: number;
  } | null;
}) {
  if (!stats) return null;

  const statItems = [
    {
      icon: Users,
      value: stats.totalLeads,
      label: 'Total Leads',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      valueColor: 'text-gray-900',
    },
    {
      icon: TrendingUp,
      value: `${stats.conversionRate}%`,
      label: 'Conversion',
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      valueColor: 'text-green-600',
    },
    {
      icon: Star,
      value: stats.newThisWeek,
      label: 'New This Week',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      valueColor: 'text-blue-600',
    },
    {
      icon: Clock,
      value: stats.followUpsToday,
      label: 'Follow-ups Today',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      valueColor: 'text-amber-600',
    },
    {
      icon: AlertCircle,
      value: stats.overdueFollowUps,
      label: 'Overdue',
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
      valueColor: 'text-red-600',
    },
    {
      icon: IndianRupee,
      value: `₹${(stats.estimatedRevenue / 1000).toFixed(0)}k`,
      label: 'Est. Revenue',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      valueColor: 'text-emerald-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {statItems.map((stat, idx) => (
        <AnimatedCard key={stat.label} delay={idx * 0.05} className="p-3">
          <div className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
              <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
            </div>
            <div>
              <p className={`text-lg font-bold ${stat.valueColor}`}>{stat.value}</p>
              <p className="text-[11px] text-gray-500">{stat.label}</p>
            </div>
          </div>
        </AnimatedCard>
      ))}
    </div>
  );
}

// ── Main Page Component ──
export default function PipelinePage() {
  const [activeTab, setActiveTab] = useState('pipeline');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Drag state
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  // CRM Stats
  const [stats, setStats] = useState<{
    totalLeads: number;
    newThisWeek: number;
    followUpsToday: number;
    overdueFollowUps: number;
    conversionRate: number;
    estimatedRevenue: number;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // ── Filtered pipeline data ──
  const filteredPipeline = useMemo(() => {
    if (!searchQuery && !stageFilter && !sourceFilter && !priorityFilter) {
      return pipeline;
    }

    return pipeline.map((stage) => {
      const filteredLeads = stage.leads.filter((lead) => {
        // Search filter
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchesSearch =
            lead.parentName.toLowerCase().includes(q) ||
            lead.childName.toLowerCase().includes(q) ||
            lead.parentPhone.includes(q) ||
            (lead.parentEmail && lead.parentEmail.toLowerCase().includes(q));
          if (!matchesSearch) return false;
        }

        // Stage filter
        if (stageFilter && lead.stage !== stageFilter) return false;

        // Source filter
        if (sourceFilter && lead.source !== sourceFilter) return false;

        // Priority filter
        if (priorityFilter && lead.priority !== priorityFilter) return false;

        return true;
      });

      return {
        ...stage,
        leads: filteredLeads,
        count: filteredLeads.length,
        totalValue: filteredLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0),
      };
    });
  }, [pipeline, searchQuery, stageFilter, sourceFilter, priorityFilter]);

  // ── Filtered leads for list view ──
  const filteredLeads = useMemo(() => {
    if (!searchQuery && !stageFilter && !sourceFilter && !priorityFilter) {
      return leads;
    }

    return leads.filter((lead) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          lead.parentName.toLowerCase().includes(q) ||
          lead.childName.toLowerCase().includes(q) ||
          lead.parentPhone.includes(q) ||
          (lead.parentEmail && lead.parentEmail.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      if (stageFilter && lead.stage !== stageFilter) return false;
      if (sourceFilter && lead.source !== sourceFilter) return false;
      if (priorityFilter && lead.priority !== priorityFilter) return false;

      return true;
    });
  }, [leads, searchQuery, stageFilter, sourceFilter, priorityFilter]);

  // ── Fetch data ──
  const fetchPipeline = useCallback(async () => {
    try {
      const token = getToken();
      const [pipelineRes, statsRes] = await Promise.all([
        fetch('/api/crm/pipeline', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/crm/stats', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      ]);
      if (pipelineRes.ok) {
        const data = await pipelineRes.json();
        setPipeline(data.pipeline);
        const allLeads = data.pipeline.flatMap((s: PipelineStage) => s.leads);
        setLeads(allLeads);
      }
      if (statsRes?.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch pipeline:', err);
      toast.error('Failed to load pipeline data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  // ── Drag handlers ──
  const handleDragStart = (event: DragStartEvent) => {
    const lead = event.active.data.current?.lead as Lead;
    setActiveLead(lead || null);
  };

  const handleDragOver = (_event: DragOverEvent) => {
    // Visual feedback during drag — can be extended for drop indicators
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveLead(null);

    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const leadData = active.data.current?.lead as Lead;
    if (!leadData) return;

    // Find the target column
    let targetStage: string | null = null;

    // If over.id is a stage key, that's the target
    if (STAGE_KEYS.includes(over.id as (typeof STAGE_KEYS)[number])) {
      targetStage = over.id as string;
    } else {
      // over.id is a lead card — find which column it's in
      for (const stage of pipeline) {
        if (stage.leads.some((l) => l.id === over.id)) {
          targetStage = stage.key;
          break;
        }
      }
    }

    if (!targetStage || targetStage === leadData.stage) return;

    // Optimistic update
    const previousPipeline = [...pipeline];
    setPipeline((prev) =>
      prev.map((stage) => {
        if (stage.key === leadData.stage) {
          return {
            ...stage,
            leads: stage.leads.filter((l) => l.id !== leadId),
            count: stage.count - 1,
            totalValue: stage.totalValue - (leadData.estimatedValue || 0),
          };
        }
        if (stage.key === targetStage) {
          return {
            ...stage,
            leads: [{ ...leadData, stage: targetStage }, ...stage.leads],
            count: stage.count + 1,
            totalValue: stage.totalValue + (leadData.estimatedValue || 0),
          };
        }
        return stage;
      })
    );

    // Also update the flat leads array
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage: targetStage! } : l))
    );

    // Show optimistic toast
    const targetLabel = STAGE_CONFIG[targetStage]?.label ?? targetStage;
    toast.success(`Moved to ${targetLabel}`, {
      description: `${leadData.childName} moved to ${targetLabel} stage`,
      duration: 2000,
    });

    // API call to update stage
    try {
      const token = getToken();
      const res = await fetch(`/api/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stage: targetStage }),
      });

      if (!res.ok) {
        throw new Error('Failed to update stage');
      }
    } catch (err) {
      console.error('Failed to update lead stage:', err);
      // Revert on error
      setPipeline(previousPipeline);
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, stage: leadData.stage } : l))
      );
      toast.error('Failed to move lead', {
        description: 'The change has been reverted. Please try again.',
      });
    }
  };

  // ── Lead click handler ──
  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setDrawerOpen(true);
  };

  // ── Refresh handler ──
  const handleRefresh = () => {
    setLoading(true);
    fetchPipeline();
    toast.success('Pipeline refreshed');
  };

  // ── Lead created callback ──
  const handleLeadCreated = () => {
    setAddLeadOpen(false);
    handleRefresh();
    toast.success('Lead created successfully');
  };

  // ── Lead updated callback (from drawer) ──
  const handleLeadUpdated = () => {
    handleRefresh();
    setDrawerOpen(false);
  };

  // ── Clear filters ──
  const clearFilters = () => {
    setStageFilter('');
    setSourceFilter('');
    setPriorityFilter('');
    setAssignedFilter('');
    setSearchQuery('');
  };

  const hasActiveFilters = searchQuery || stageFilter || sourceFilter || priorityFilter;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Megaphone className="h-6 w-6 text-portal-600" />
              Admission Pipeline
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Drag & drop leads across stages to track your admission funnel
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-1"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Button
              onClick={() => setAddLeadOpen(true)}
              className="gap-1 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
            >
              <Plus className="h-4 w-4" />
              Add Lead
            </Button>
          </div>
        </div>

        {/* ── CRM Stats Dashboard ── */}
        <StatsBar stats={stats} />

        {/* ── Main Tabs: Pipeline / List / Analytics ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <TabsList className="bg-gray-100">
              <TabsTrigger value="pipeline" className="gap-1.5">
                <LayoutGrid className="h-3.5 w-3.5" />
                Pipeline
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-1.5">
                <List className="h-3.5 w-3.5" />
                List
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {activeTab !== 'analytics' && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search leads..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <Button
                  variant={showFilters ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-1"
                >
                  <Filter className="h-3.5 w-3.5" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                      !
                    </span>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* ── Filters Row ── */}
          {showFilters && activeTab !== 'analytics' && (
            <AnimatedCard delay={0} hover={false} className="mt-3 p-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Select
                  value={stageFilter}
                  onValueChange={(v) => setStageFilter(v === 'ALL' ? '' : v)}
                >
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue placeholder="Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Stages</SelectItem>
                    {Object.entries(STAGE_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: cfg.color }}
                          />
                          {cfg.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={sourceFilter}
                  onValueChange={(v) => setSourceFilter(v === 'ALL' ? '' : v)}
                >
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Sources</SelectItem>
                    {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={priorityFilter}
                  onValueChange={(v) => setPriorityFilter(v === 'ALL' ? '' : v)}
                >
                  <SelectTrigger className="w-[120px] h-8 text-xs">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="NORMAL">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs gap-1 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-3 w-3" />
                    Clear filters
                  </Button>
                )}
              </div>
            </AnimatedCard>
          )}

          {/* ── Pipeline View ── */}
          <TabsContent value="pipeline" className="mt-4">
            {loading ? (
              <PipelineSkeleton />
            ) : pipeline.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Megaphone className="h-12 w-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">No pipeline data</p>
                <p className="text-sm mt-1">
                  Click &quot;Add Lead&quot; to create your first lead.
                </p>
                <Button
                  onClick={() => setAddLeadOpen(true)}
                  className="mt-4 gap-1 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
                >
                  <Plus className="h-4 w-4" />
                  Add Lead
                </Button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {filteredPipeline.map((stage) => (
                    <KanbanColumn
                      key={stage.key}
                      stage={stage}
                      leads={stage.leads}
                      onLeadClick={handleLeadClick}
                    />
                  ))}
                </div>
                <DragOverlay dropAnimation={null}>
                  {activeLead && <DragOverlayCard lead={activeLead} />}
                </DragOverlay>
              </DndContext>
            )}
          </TabsContent>

          {/* ── List View ── */}
          <TabsContent value="list" className="mt-4">
            {loading ? (
              <ListSkeleton />
            ) : (
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parent Name</TableHead>
                      <TableHead>Child Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Est. Value</TableHead>
                      <TableHead>Next Follow-up</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          className="text-center py-8 text-gray-400"
                        >
                          {hasActiveFilters
                            ? 'No leads match your filters. Try adjusting them.'
                            : 'No leads found. Click "Add Lead" to create one.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeads.map((lead) => {
                        const stageCfg =
                          STAGE_CONFIG[lead.stage] || STAGE_CONFIG.NEW;
                        const priorityCfg =
                          PRIORITY_CONFIG[lead.priority] || PRIORITY_CONFIG.NORMAL;
                        return (
                          <TableRow
                            key={lead.id}
                            className="cursor-pointer hover:bg-gray-50/80 transition-colors"
                            onClick={() => handleLeadClick(lead)}
                          >
                            <TableCell className="font-medium text-sm">
                              {lead.parentName}
                            </TableCell>
                            <TableCell className="text-sm">
                              {lead.childName}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {lead.parentPhone}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[11px]">
                                {SOURCE_LABELS[lead.source] || lead.source}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: stageCfg.color + '15',
                                  color: stageCfg.color,
                                }}
                              >
                                <span
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{ backgroundColor: stageCfg.color }}
                                />
                                {stageCfg.label}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  'text-xs font-medium',
                                  priorityCfg.color
                                )}
                              >
                                {priorityCfg.label}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {lead.programInterest || '—'}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {lead.estimatedValue
                                ? `₹${lead.estimatedValue.toLocaleString('en-IN')}`
                                : '—'}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              {lead.nextFollowUp
                                ? format(
                                    new Date(lead.nextFollowUp),
                                    'dd MMM yyyy'
                                  )
                                : '—'}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-portal-600 hover:text-portal-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLeadClick(lead);
                                }}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          {/* ── Analytics Tab ── */}
          <TabsContent value="analytics" className="mt-4">
            <CrmAnalytics />
          </TabsContent>
        </Tabs>

        {/* ── Add Lead Dialog ── */}
        <AddLeadDialog
          open={addLeadOpen}
          onOpenChange={setAddLeadOpen}
          onLeadCreated={handleLeadCreated}
        />

        {/* ── Lead Detail Drawer ── */}
        <LeadDetailDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          lead={selectedLead}
          onLeadUpdated={handleLeadUpdated}
        />
      </div>
    </PageTransition>
  );
}
