'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

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

import { AddLeadDialog } from '@/components/add-lead-dialog';
import { LeadDetailDrawer } from '@/components/lead-detail-drawer';
import { CrmAnalytics } from '@/components/crm-analytics';

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
  NEW: { label: 'New', color: '#9ca3af', cardBg: 'bg-white', textColor: 'text-gray-600' },
  CONTACTED: { label: 'Contacted', color: '#3b82f6', cardBg: 'bg-blue-50', textColor: 'text-blue-600' },
  VISITED: { label: 'Visited', color: '#8b5cf6', cardBg: 'bg-purple-50', textColor: 'text-purple-600' },
  APPLIED: { label: 'Applied', color: '#f59e0b', cardBg: 'bg-yellow-50', textColor: 'text-yellow-600' },
  ENROLLED: { label: 'Enrolled', color: '#10b981', cardBg: 'bg-green-50', textColor: 'text-green-600' },
  LOST: { label: 'Lost', color: '#ef4444', cardBg: 'bg-red-50', textColor: 'text-red-600' },
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

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
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
          'p-3 cursor-pointer hover:shadow-md transition-all duration-200 border-l-4',
          stageConfig.cardBg
        )}
        style={{ borderLeftColor: stageConfig.color }}
        onClick={() => onClick(lead)}
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🧒</span>
              <span className="font-semibold text-gray-900 text-sm leading-tight">{lead.childName}</span>
            </div>
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', priorityConfig.bg, priorityConfig.color)}>
              {priorityConfig.label}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <UserCircle className="h-3 w-3" />
            <span>{lead.parentName}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Phone className="h-3 w-3" />
            <span>{lead.parentPhone}</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-gray-500">
              <Tag className="h-3 w-3" />
              {SOURCE_LABELS[lead.source] || lead.source}
            </span>
          </div>

          {lead.estimatedValue && (
            <div className="text-xs font-medium text-gray-700">
              💰 Est: ₹{lead.estimatedValue.toLocaleString('en-IN')}
            </div>
          )}

          {followUpDate && (
            <div className={cn(
              'text-[11px] flex items-center gap-1',
              isFollowUpSoon ? 'text-orange-600 font-medium' : 'text-gray-500'
            )}>
              <Calendar className="h-3 w-3" />
              Follow-up: {isToday(followUpDate) ? 'Today' : isTomorrow(followUpDate) ? 'Tomorrow' : format(followUpDate, 'dd MMM')}
            </div>
          )}

          <div className="flex items-center gap-1.5 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              onClick={(e) => { e.stopPropagation(); onClick(lead); }}
            >
              View
            </Button>
            {lead.stage === 'ENROLLED' && !lead.convertedStudentId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                onClick={(e) => { e.stopPropagation(); onClick(lead); }}
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

// ── Kanban Column ──
function KanbanColumn({ stage, leads, onLeadClick }: { stage: PipelineStage; leads: Lead[]; onLeadClick: (lead: Lead) => void }) {
  return (
    <div className="flex flex-col min-w-[280px] w-[280px]">
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 rounded-t-xl" style={{ backgroundColor: stage.color + '15' }}>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color }} />
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
        <div className="flex flex-col gap-2 p-2 bg-gray-50/50 rounded-b-xl min-h-[200px] border border-t-0 border-gray-100"
          style={{ borderTopColor: stage.color }}
        >
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
          ))}
          {leads.length === 0 && (
            <div className="flex items-center justify-center h-24 text-xs text-gray-400">
              No leads in this stage
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ── Main Page Component ──
export default function CrmPage() {
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pipeline, setPipeline] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pipeline');

  // Filters for list view
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Drag state
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // ── Fetch data ──
  const fetchPipeline = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/crm/pipeline', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPipeline(data.pipeline);
        // Also flatten all leads for list view
        const allLeads = data.pipeline.flatMap((s: PipelineStage) => s.leads);
        setLeads(allLeads);
      }
    } catch (err) {
      console.error('Failed to fetch pipeline:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (stageFilter) params.set('stage', stageFilter);
      if (sourceFilter) params.set('source', sourceFilter);
      if (priorityFilter) params.set('priority', priorityFilter);
      if (assignedFilter) params.set('assignedTo', assignedFilter);

      const res = await fetch(`/api/crm/leads?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    }
  }, [searchQuery, stageFilter, sourceFilter, priorityFilter, assignedFilter]);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  useEffect(() => {
    if (viewMode === 'list') {
      fetchLeads();
    }
  }, [viewMode, fetchLeads]);

  // ── Drag handlers ──
  const handleDragStart = (event: DragStartEvent) => {
    const lead = event.active.data.current?.lead as Lead;
    setActiveLead(lead || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Visual feedback during drag
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveLead(null);

    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const leadData = active.data.current?.lead as Lead;
    if (!leadData) return;

    // Find the target column by checking which column the over container belongs to
    // The over.id could be a lead card or a column container
    let targetStage: string | null = null;

    // Check if dropped on a column (stage key is the column id)
    const stageKeys = ['NEW', 'CONTACTED', 'VISITED', 'APPLIED', 'ENROLLED', 'LOST'];

    // If over.id is a stage key, that's the target
    if (stageKeys.includes(over.id as string)) {
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

    // API call to update stage
    try {
      const token = getToken();
      await fetch(`/api/crm/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stage: targetStage }),
      });
    } catch (err) {
      console.error('Failed to update lead stage:', err);
      fetchPipeline(); // Revert on error
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
  };

  // ── Lead created callback ──
  const handleLeadCreated = () => {
    setAddLeadOpen(false);
    handleRefresh();
  };

  // ── Lead updated callback (from drawer) ──
  const handleLeadUpdated = () => {
    handleRefresh();
    setDrawerOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-purple-600" />
            Admission CRM
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage leads, track conversions, and grow enrollments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-1"
          >
            <RefreshCw className="h-3.5 w-3.5" />
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

      {/* ── Main Tabs: Pipeline/List + Analytics ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="pipeline" className="gap-1.5">
              {activeTab === 'pipeline' && <LayoutGrid className="h-3.5 w-3.5" />}
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-1.5">
              {activeTab === 'list' && <List className="h-3.5 w-3.5" />}
              List
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5">
              {activeTab === 'analytics' && <BarChart3 className="h-3.5 w-3.5" />}
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
                  className="pl-9 w-64"
                />
              </div>
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-1"
              >
                <Filter className="h-3.5 w-3.5" />
                Filters
              </Button>
            </div>
          )}
        </div>

        {/* ── Filters Row ── */}
        {showFilters && activeTab !== 'analytics' && (
          <div className="flex items-center gap-3 flex-wrap mt-3 p-3 bg-white rounded-xl border">
            <Select value={stageFilter} onValueChange={(v) => setStageFilter(v === 'ALL' ? '' : v)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Stages</SelectItem>
                {Object.entries(STAGE_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v === 'ALL' ? '' : v)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Sources</SelectItem>
                {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v === 'ALL' ? '' : v)}>
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

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStageFilter('');
                setSourceFilter('');
                setPriorityFilter('');
                setAssignedFilter('');
                setSearchQuery('');
              }}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        )}

        {/* ── Pipeline View ── */}
        <TabsContent value="pipeline" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading pipeline...
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
                {pipeline.map((stage) => (
                  <KanbanColumn
                    key={stage.key}
                    stage={stage}
                    leads={stage.leads}
                    onLeadClick={handleLeadClick}
                  />
                ))}
              </div>
              <DragOverlay>
                {activeLead && (
                  <LeadCard lead={activeLead} onClick={() => {}} />
                )}
              </DragOverlay>
            </DndContext>
          )}
        </TabsContent>

        {/* ── List View ── */}
        <TabsContent value="list" className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading leads...
            </div>
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
                  {leads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-gray-400">
                        No leads found. Click &quot;Add Lead&quot; to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    leads.map((lead) => {
                      const stageCfg = STAGE_CONFIG[lead.stage] || STAGE_CONFIG.NEW;
                      const priorityCfg = PRIORITY_CONFIG[lead.priority] || PRIORITY_CONFIG.NORMAL;
                      return (
                        <TableRow
                          key={lead.id}
                          className="cursor-pointer hover:bg-gray-50/80"
                          onClick={() => handleLeadClick(lead)}
                        >
                          <TableCell className="font-medium text-sm">{lead.parentName}</TableCell>
                          <TableCell className="text-sm">{lead.childName}</TableCell>
                          <TableCell className="text-sm text-gray-600">{lead.parentPhone}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[11px]">
                              {SOURCE_LABELS[lead.source] || lead.source}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{ backgroundColor: stageCfg.color + '15', color: stageCfg.color }}
                            >
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stageCfg.color }} />
                              {stageCfg.label}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={cn('text-xs font-medium', priorityCfg.color)}>
                              {priorityCfg.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">{lead.programInterest || '—'}</TableCell>
                          <TableCell className="text-sm font-medium">
                            {lead.estimatedValue ? `₹${lead.estimatedValue.toLocaleString('en-IN')}` : '—'}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {lead.nextFollowUp ? format(new Date(lead.nextFollowUp), 'dd MMM yyyy') : '—'}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-purple-600 hover:text-purple-700"
                              onClick={(e) => { e.stopPropagation(); handleLeadClick(lead); }}
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
  );
}
