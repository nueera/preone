'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, isPast, isToday } from 'date-fns';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckSquare,
  Plus,
  Clock,
  AlertCircle,
  Circle,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Calendar,
  UserCircle,
  Link as LinkIcon,
  LayoutGrid,
  List,
  Loader2,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { PreOneCard } from '@/components/ui/preone-card';
import { cn } from '@/lib/utils';
import { CRM_COLORS } from '@/lib/theme-tokens';
import { toast } from 'sonner';

// ── Types ──
interface LeadInfo {
  id: string;
  parentName: string;
  childName: string;
  stage: string;
}

interface AssigneeInfo {
  id: string;
  name: string;
  email: string;
}

interface CrmTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  assignee: { id: string; name: string; email: string } | null;
  creator: { id: string; name: string } | null;
  lead: LeadInfo | null;
}

// ── Constants ──
const PRIORITY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  HIGH: {
    label: 'High',
    color: 'var(--admin-error)',
    bg: 'rgba(239,68,68,0.1)',
    border: 'var(--admin-error)',
  },
  MEDIUM: {
    label: 'Medium',
    color: 'var(--admin-warning)',
    bg: 'var(--admin-warning-soft)',
    border: 'var(--admin-warning)',
  },
  LOW: {
    label: 'Low',
    color: 'var(--admin-text-muted)',
    bg: 'var(--admin-surface-2)',
    border: 'var(--admin-border)',
  },
};

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
    softVar: string;
    varColor: string;
  }
> = {
  TODO: {
    label: 'To Do',
    icon: <Circle className="h-4 w-4" />,
    color: 'var(--admin-text-muted)',
    bg: 'var(--admin-surface-2)',
    softVar: 'var(--admin-surface-2)',
    varColor: 'var(--admin-text-muted)',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    icon: <Clock className="h-4 w-4" />,
    color: 'var(--admin-info)',
    bg: 'var(--admin-info-soft)',
    softVar: 'var(--admin-info-soft)',
    varColor: 'var(--admin-info)',
  },
  DONE: {
    label: 'Done',
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: 'var(--admin-success)',
    bg: 'var(--admin-success-soft)',
    softVar: 'var(--admin-success-soft)',
    varColor: 'var(--admin-success)',
  },
};

const STAGE_CONFIG: Record<
  string,
  { label: string; color: string; softVar: string; varColor: string }
> = {
  NEW: {
    label: 'New',
    color: CRM_COLORS.NEW?.hex ?? '#3b82f6',
    softVar: 'var(--admin-surface-2)',
    varColor: 'var(--admin-text-muted)',
  },
  CONTACTED: {
    label: 'Contacted',
    color: CRM_COLORS.CONTACTED?.hex ?? '#8b5cf6',
    softVar: 'var(--admin-info-soft)',
    varColor: 'var(--admin-info)',
  },
  VISITED: {
    label: 'Visited',
    color: CRM_COLORS.TOUR_SCHEDULED?.hex ?? '#f59e0b',
    softVar: 'var(--admin-primary-soft)',
    varColor: 'var(--admin-primary)',
  },
  APPLIED: {
    label: 'Applied',
    color: CRM_COLORS.APPLICATION?.hex ?? '#f97316',
    softVar: 'var(--admin-warning-soft)',
    varColor: 'var(--admin-warning)',
  },
  ENROLLED: {
    label: 'Enrolled',
    color: CRM_COLORS.ENROLLED?.hex ?? '#10b981',
    softVar: 'var(--admin-success-soft)',
    varColor: 'var(--admin-success)',
  },
  LOST: {
    label: 'Lost',
    color: CRM_COLORS.LOST?.hex ?? '#9ca3af',
    softVar: 'rgba(239,68,68,0.1)',
    varColor: 'var(--admin-error)',
  },
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

// ── Add Task Dialog ──
function AddTaskDialog({
  open,
  onOpenChange,
  onTaskCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [leads, setLeads] = useState<LeadInfo[]>([]);
  const [staff, setStaff] = useState<AssigneeInfo[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    leadId: '',
    assignedTo: '',
    dueDate: null as Date | null,
    priority: 'MEDIUM',
  });

  useEffect(() => {
    if (open) {
      setForm({
        title: '',
        description: '',
        leadId: '',
        assignedTo: '',
        dueDate: null,
        priority: 'MEDIUM',
      });
      setError('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    async function fetchLeads() {
      try {
        const token = getToken();
        const res = await fetch('/api/crm/leads?limit=100', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setLeads(
            (data.leads || []).map((l: LeadInfo) => ({
              id: l.id,
              parentName: l.parentName,
              childName: l.childName,
              stage: l.stage,
            })),
          );
        }
      } catch (err) {
        console.error('Failed to fetch leads:', err);
      }
    }
    fetchLeads();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    async function fetchStaff() {
      try {
        const token = getToken();
        // Try settings/users first, fallback to teachers
        let res = await fetch('/api/settings/users?limit=50', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStaff(
            (data.users || []).map((u: AssigneeInfo) => ({
              id: u.id,
              name: u.name,
              email: u.email,
            })),
          );
          return;
        }
        res = await fetch('/api/teachers?limit=50', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStaff(
            (data.teachers || []).map(
              (t: {
                id: string;
                firstName: string;
                lastName: string;
                email: string;
              }) => ({
                id: t.id,
                name: `${t.firstName} ${t.lastName}`,
                email: t.email,
              }),
            ),
          );
        }
      } catch (err) {
        console.error('Failed to fetch staff:', err);
      }
    }
    fetchStaff();
  }, [open]);

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError('Task title is required');
      return;
    }
    setSubmitting(true);
    try {
      const token = getToken();
      const res = await fetch('/api/crm/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          leadId: form.leadId || undefined,
          assignedTo: form.assignedTo || undefined,
          dueDate: form.dueDate?.toISOString() || undefined,
          priority: form.priority,
        }),
      });
      if (res.ok) {
        toast.success('Task created successfully');
        onOpenChange(false);
        onTaskCreated();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create task');
      }
    } catch (err) {
      console.error('Failed to create task:', err);
      setError('Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle
            className="text-xl font-bold flex items-center gap-2"
            style={{ color: 'var(--admin-text)' }}
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: 'var(--admin-primary-soft)' }}
            >
              <Plus
                className="h-4 w-4"
                style={{ color: 'var(--admin-primary)' }}
              />
            </div>
            New Task
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div
            className="rounded-lg p-3 text-sm flex items-center gap-2"
            style={{
              background: 'rgba(239,68,68,0.08)',
              color: 'var(--admin-error)',
            }}
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">
              Task Title <span style={{ color: 'var(--admin-error)' }}>*</span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g., Call back parent about admission"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              placeholder="Add task details..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Link to Lead</Label>
              <Select
                value={form.leadId || 'NONE'}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, leadId: v === 'NONE' ? '' : v }))
                }
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None</SelectItem>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.parentName} — {l.childName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Assign To</Label>
              <Select
                value={form.assignedTo || 'NONE'}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, assignedTo: v === 'NONE' ? '' : v }))
                }
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Unassigned</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm((p) => ({ ...p, priority: v }))}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'w-full h-9 text-sm justify-start text-left font-normal',
                      !form.dueDate && 'text-muted-foreground',
                    )}
                  >
                    <Calendar className="mr-2 h-3.5 w-3.5" />
                    {form.dueDate ? format(form.dueDate, 'dd MMM yyyy') : 'No due date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={form.dueDate || undefined}
                    onSelect={(d) => setForm((p) => ({ ...p, dueDate: d ?? null }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-1.5 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Create Task
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Stat Card ──
function StatCard({
  label,
  value,
  icon: Icon,
  accentVar,
  accentSoftVar,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accentVar: string;
  accentSoftVar: string;
}) {
  return (
    <PreOneCard className="!rounded-xl">
      <div className="p-4 flex items-center gap-4">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
          style={{ background: `var(${accentSoftVar})` }}
        >
          <Icon className="h-5 w-5" style={{ color: `var(${accentVar})` }} />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="text-xs font-medium"
            style={{ color: 'var(--admin-text-muted)' }}
          >
            {label}
          </div>
          <div
            className="text-xl font-bold tabular-nums"
            style={{ color: 'var(--admin-text)' }}
          >
            {value}
          </div>
        </div>
      </div>
    </PreOneCard>
  );
}

// ── Filter Pill ──
function FilterPill({
  label,
  count,
  active,
  activeColor,
  activeBg,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  activeColor: string;
  activeBg: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors"
      style={
        active
          ? { background: activeBg, color: activeColor }
          : {
              background: 'var(--admin-surface-2)',
              color: 'var(--admin-text-muted)',
            }
      }
    >
      {label}
      {count != null && (
        <span
          className="rounded-full px-1.5 text-[10px] font-semibold"
          style={
            active
              ? { background: activeColor, color: activeBg }
              : { background: 'var(--admin-surface)', color: 'var(--admin-text-muted)' }
          }
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ── Task Card ──
function TaskCard({
  task,
  onCycle,
  onDelete,
  cycling,
}: {
  task: CrmTask;
  onCycle: (task: CrmTask) => void;
  onDelete: (id: string) => void;
  cycling: string | null;
}) {
  const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.TODO;
  const isOverdue =
    task.status !== 'DONE' &&
    task.dueDate &&
    isPast(new Date(task.dueDate)) &&
    !isToday(new Date(task.dueDate));
  const isDueToday =
    task.dueDate && isToday(new Date(task.dueDate)) && task.status !== 'DONE';

  const nextStatusLabel =
    task.status === 'TODO'
      ? 'Start'
      : task.status === 'IN_PROGRESS'
        ? 'Complete'
        : 'Reopen';

  const borderColor =
    isOverdue && task.status !== 'DONE'
      ? 'var(--admin-error)'
      : statusCfg.color;

  return (
    <div
      className="rounded-lg border-l-4 p-3 transition-all hover:shadow-sm"
      style={{
        background: 'var(--admin-surface)',
        borderLeftColor: borderColor,
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        opacity: task.status === 'DONE' ? 0.6 : 1,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Status cycle button */}
        <button
          onClick={() => onCycle(task)}
          disabled={cycling === task.id}
          className="flex h-7 w-7 items-center justify-center rounded-full flex-shrink-0 transition-colors hover:opacity-80 disabled:opacity-50"
          style={{ background: statusCfg.bg, color: statusCfg.color }}
          title={nextStatusLabel}
        >
          {cycling === task.id ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            statusCfg.icon
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className="text-sm font-medium truncate"
              style={{
                color: 'var(--admin-text)',
                textDecoration: task.status === 'DONE' ? 'line-through' : 'none',
              }}
            >
              {task.title}
            </p>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: priorityCfg.bg, color: priorityCfg.color }}
            >
              {priorityCfg.label}
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: statusCfg.bg, color: statusCfg.color }}
            >
              {statusCfg.label}
            </span>
          </div>

          {task.description && (
            <p
              className="text-xs mt-1 line-clamp-2"
              style={{ color: 'var(--admin-text-muted)' }}
            >
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {task.dueDate && (
              <span
                className="text-[11px] flex items-center gap-1 tabular-nums"
                style={{
                  color: isOverdue
                    ? 'var(--admin-error)'
                    : isDueToday
                      ? 'var(--admin-warning)'
                      : 'var(--admin-text-subtle)',
                  fontWeight: isOverdue || isDueToday ? 600 : 400,
                }}
              >
                <Calendar className="h-3 w-3" />
                {isToday(new Date(task.dueDate))
                  ? 'Today'
                  : format(new Date(task.dueDate), 'dd MMM yyyy')}
                {isOverdue && (
                  <AlertTriangle className="h-3 w-3 ml-0.5" />
                )}
              </span>
            )}

            {task.lead && (
              <Link
                href={`/admin/admissions/leads/${task.lead.id}`}
                className="text-[11px] flex items-center gap-1 hover:underline"
                style={{ color: 'var(--admin-primary)' }}
              >
                <LinkIcon className="h-3 w-3" />
                {task.lead.parentName}
                {task.lead.stage && (
                  <span
                    className="rounded-full px-1.5 ml-1"
                    style={{
                      background:
                        STAGE_CONFIG[task.lead.stage]?.softVar ??
                        'var(--admin-surface-2)',
                      color:
                        STAGE_CONFIG[task.lead.stage]?.varColor ??
                        'var(--admin-text-muted)',
                    }}
                  >
                    {STAGE_CONFIG[task.lead.stage]?.label ?? task.lead.stage}
                  </span>
                )}
              </Link>
            )}

            {task.assignee && (
              <span
                className="text-[11px] flex items-center gap-1"
                style={{ color: 'var(--admin-text-subtle)' }}
              >
                <UserCircle className="h-3 w-3" />
                {task.assignee.name}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => onDelete(task.id)}
          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors flex-shrink-0"
          style={{ color: 'var(--admin-text-subtle)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
            e.currentTarget.style.color = 'var(--admin-error)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--admin-text-subtle)';
          }}
          title="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2 ml-10">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[11px] px-2"
          style={{ color: statusCfg.color }}
          onClick={() => onCycle(task)}
          disabled={cycling === task.id}
        >
          {nextStatusLabel}
        </Button>
      </div>
    </div>
  );
}

/**
 * CRM Tasks page — Task management with board and list views.
 */
export default function CrmTasksPage() {
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'TODO' | 'IN_PROGRESS' | 'DONE'>('all');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
  const [cycling, setCycling] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const token = getToken();
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (priorityFilter) params.set('priority', priorityFilter);
      const res = await fetch(`/api/crm/tasks?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [filter, priorityFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTaskCreated = () => {
    toast.success('Task created successfully');
    fetchTasks();
  };

  const cycleStatus = async (task: CrmTask) => {
    const nextStatus =
      task.status === 'TODO'
        ? 'IN_PROGRESS'
        : task.status === 'IN_PROGRESS'
          ? 'DONE'
          : 'TODO';
    setCycling(task.id);
    try {
      const token = getToken();
      const res = await fetch(`/api/crm/tasks/${task.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        toast.success(`Task moved to ${STATUS_CONFIG[nextStatus].label}`);
        fetchTasks();
      } else {
        toast.error('Failed to update task');
      }
    } catch (err) {
      console.error('Failed to cycle task status:', err);
      toast.error('Failed to update task');
    } finally {
      setCycling(null);
    }
  };

  const deleteTask = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      const token = getToken();
      const res = await fetch(`/api/crm/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Task deleted');
        fetchTasks();
      } else {
        toast.error('Failed to delete task');
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
      toast.error('Failed to delete task');
    }
  };

  // Stats
  const todoCount = tasks.filter((t) => t.status === 'TODO').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const doneCount = tasks.filter((t) => t.status === 'DONE').length;
  const overdueCount = tasks.filter(
    (t) =>
      t.status !== 'DONE' &&
      t.dueDate &&
      isPast(new Date(t.dueDate)) &&
      !isToday(new Date(t.dueDate)),
  ).length;

  const FILTER_PILLS = [
    { key: 'all' as const, label: 'All', color: 'var(--admin-primary)', bg: 'var(--admin-primary-soft)' },
    { key: 'TODO' as const, label: 'To Do', color: 'var(--admin-text-muted)', bg: 'var(--admin-surface-2)' },
    { key: 'IN_PROGRESS' as const, label: 'In Progress', color: 'var(--admin-info)', bg: 'var(--admin-info-soft)' },
    { key: 'DONE' as const, label: 'Done', color: 'var(--admin-success)', bg: 'var(--admin-success-soft)' },
  ];

  const boardColumns = [
    { key: 'TODO', label: 'To Do', icon: Circle, color: 'var(--admin-text-muted)', bg: 'var(--admin-surface-2)' },
    { key: 'IN_PROGRESS', label: 'In Progress', icon: Clock, color: 'var(--admin-info)', bg: 'var(--admin-info-soft)' },
    { key: 'DONE', label: 'Done', icon: CheckCircle2, color: 'var(--admin-success)', bg: 'var(--admin-success-soft)' },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-[1440px] mx-auto">
      {/* ── SECTION 1: HEADER ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/admissions">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: 'var(--admin-warning-soft)' }}
            >
              <CheckSquare
                className="h-5 w-5"
                style={{ color: 'var(--admin-warning)' }}
              />
            </div>
            <div>
              <h1
                className="text-2xl font-bold tracking-tight"
                style={{ color: 'var(--admin-text)' }}
              >
                CRM Tasks
              </h1>
              <p
                className="text-sm"
                style={{ color: 'var(--admin-text-muted)' }}
              >
                Manage tasks and to-dos for your admissions team
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              fetchTasks();
              toast.success('Refreshed');
            }}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
            onClick={() => setAddTaskOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Task</span>
          </Button>
        </div>
      </div>

      {/* ── SECTION 2: STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="To Do"
          value={todoCount}
          icon={Circle}
          accentVar="--admin-text-muted"
          accentSoftVar="--admin-surface-2"
        />
        <StatCard
          label="In Progress"
          value={inProgressCount}
          icon={Clock}
          accentVar="--admin-info"
          accentSoftVar="--admin-info-soft"
        />
        <StatCard
          label="Done"
          value={doneCount}
          icon={CheckCircle2}
          accentVar="--admin-success"
          accentSoftVar="--admin-success-soft"
        />
        <StatCard
          label="Overdue"
          value={overdueCount}
          icon={AlertTriangle}
          accentVar="--admin-error"
          accentSoftVar="rgba(239,68,68,0.1)"
        />
      </div>

      {/* ── SECTION 3: FILTER BAR ── */}
      <PreOneCard className="!rounded-xl">
        <div className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {FILTER_PILLS.map((pill) => {
              const count =
                pill.key === 'all'
                  ? tasks.length
                  : pill.key === 'TODO'
                    ? todoCount
                    : pill.key === 'IN_PROGRESS'
                      ? inProgressCount
                      : doneCount;
              return (
                <FilterPill
                  key={pill.key}
                  label={pill.label}
                  count={count}
                  active={filter === pill.key}
                  activeColor={pill.color}
                  activeBg={pill.bg}
                  onClick={() => setFilter(pill.key)}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={priorityFilter || 'ALL'}
              onValueChange={(v) => setPriorityFilter(v === 'ALL' ? '' : v)}
            >
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Priorities</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>

            <div
              className="flex items-center rounded-lg p-0.5"
              style={{ background: 'var(--admin-surface-2)' }}
            >
              <button
                onClick={() => setViewMode('board')}
                className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                style={
                  viewMode === 'board'
                    ? { background: 'var(--admin-surface)', color: 'var(--admin-text)' }
                    : { color: 'var(--admin-text-muted)' }
                }
                title="Board view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="flex h-7 w-7 items-center justify-center rounded-md transition-colors"
                style={
                  viewMode === 'list'
                    ? { background: 'var(--admin-surface)', color: 'var(--admin-text)' }
                    : { color: 'var(--admin-text-muted)' }
                }
                title="List view"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </PreOneCard>

      {/* ── SECTION 4: TASKS DISPLAY ── */}
      {loading ? (
        <PreOneCard className="!rounded-xl">
          <div
            className="flex items-center justify-center h-48 text-sm"
            style={{ color: 'var(--admin-text-subtle)' }}
          >
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            Loading tasks...
          </div>
        </PreOneCard>
      ) : tasks.length === 0 ? (
        <PreOneCard className="!rounded-xl">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CheckSquare
              className="h-10 w-10 mb-3 opacity-40"
              style={{ color: 'var(--admin-text-muted)' }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--admin-text-muted)' }}
            >
              No tasks in this view
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--admin-text-subtle)' }}
            >
              Create a new task to get started.
            </p>
            <Button
              size="sm"
              className="mt-4 gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
              onClick={() => setAddTaskOpen(true)}
            >
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </div>
        </PreOneCard>
      ) : viewMode === 'board' ? (
        /* Board View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {boardColumns.map((col) => {
            const Icon = col.icon;
            const colTasks = tasks.filter((t) => t.status === col.key);
            return (
              <PreOneCard key={col.key} className="!rounded-xl overflow-hidden">
                <div
                  className="border-b px-4 py-3 flex items-center justify-between"
                  style={{
                    borderColor: 'var(--admin-border)',
                    background: col.bg,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" style={{ color: col.color }} />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: 'var(--admin-text)' }}
                    >
                      {col.label}
                    </span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full tabular-nums"
                      style={{
                        background: 'var(--admin-surface)',
                        color: 'var(--admin-text-muted)',
                        border: '1px solid var(--admin-border)',
                      }}
                    >
                      {colTasks.length}
                    </span>
                  </div>
                </div>
                <div
                  className="p-3 space-y-2 max-h-[calc(100vh-380px)] overflow-y-auto"
                  style={{ background: 'var(--admin-surface-2)' }}
                >
                  {colTasks.length === 0 ? (
                    <div
                      className="flex flex-col items-center justify-center h-24 text-xs gap-1"
                      style={{ color: 'var(--admin-text-subtle)' }}
                    >
                      <Circle
                        className="h-5 w-5 opacity-40"
                        style={{ color: 'var(--admin-text-subtle)' }}
                      />
                      No tasks
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onCycle={cycleStatus}
                        onDelete={deleteTask}
                        cycling={cycling}
                      />
                    ))
                  )}
                </div>
              </PreOneCard>
            );
          })}
        </div>
      ) : (
        /* List View */
        <PreOneCard className="!rounded-xl">
          <div className="p-4 space-y-2">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onCycle={cycleStatus}
                onDelete={deleteTask}
                cycling={cycling}
              />
            ))}
          </div>
        </PreOneCard>
      )}

      {/* ── Add Task Dialog ── */}
      <AddTaskDialog
        open={addTaskOpen}
        onOpenChange={setAddTaskOpen}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}
