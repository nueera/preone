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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';
import { PORTAL_THEMES, CRM_COLORS } from '@/lib/theme-tokens';
import { toast } from 'sonner';

const theme = PORTAL_THEMES.admin;

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
  email?: string;
}

interface CrmTask {
  id: string;
  schoolId: string | null;
  title: string;
  description: string | null;
  leadId: string | null;
  assignedTo: string | null;
  dueDate: string | null;
  priority: string;
  status: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  lead: LeadInfo | null;
  assignee: AssigneeInfo | null;
  creator: { id: string; name: string } | null;
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  HIGH: { label: 'High', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  MEDIUM: { label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  LOW: { label: 'Low', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' },
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  TODO: { label: 'To Do', icon: <Circle className="h-4 w-4 text-gray-400" />, color: 'text-gray-500' },
  IN_PROGRESS: { label: 'In Progress', icon: <Clock className="h-4 w-4 text-blue-500" />, color: 'text-blue-500' },
  DONE: { label: 'Done', icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, color: 'text-green-500' },
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

  // Reset form on open
  useEffect(() => {
    if (open) {
      setError('');
      setForm({ title: '', description: '', leadId: '', assignedTo: '', dueDate: null, priority: 'MEDIUM' });
    }
  }, [open]);

  // Fetch leads for linking
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
            (data.leads || []).map((l: { id: string; parentName: string; childName: string; stage: string }) => ({
              id: l.id,
              parentName: l.parentName,
              childName: l.childName,
              stage: l.stage,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to fetch leads:', err);
      }
    }
    fetchLeads();
  }, [open]);

  // Fetch staff for assignment
  useEffect(() => {
    if (!open) return;
    async function fetchStaff() {
      try {
        const token = getToken();
        const res = await fetch('/api/settings/users?limit=50', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStaff(
            (data.users || []).map((u: { id: string; name: string; email?: string }) => ({
              id: u.id,
              name: u.name,
              email: u.email,
            }))
          );
        }
      } catch {
        // Try alternate API
        try {
          const token = getToken();
          const res = await fetch('/api/teachers?limit=50', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setStaff(
              (data.teachers || []).map((t: { id: string; firstName: string; lastName: string; email: string }) => ({
                id: t.id,
                name: `${t.firstName} ${t.lastName}`,
                email: t.email,
              }))
            );
          }
        } catch {}
      }
    }
    fetchStaff();
  }, [open]);

  const handleSubmit = async () => {
    setError('');
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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create task');
      }

      onOpenChange(false);
      onTaskCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-portal-600" />
            Add CRM Task
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-4">
          <div>
            <Label>Task Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g., Call back parent for visit"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Add details about this task..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => setForm((p) => ({ ...p, priority: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assign To</Label>
              <Select value={form.assignedTo} onValueChange={(v) => setForm((p) => ({ ...p, assignedTo: v === 'NONE' ? '' : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Unassigned</SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Link to Lead</Label>
              <Select value={form.leadId} onValueChange={(v) => setForm((p) => ({ ...p, leadId: v === 'NONE' ? '' : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="No lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No lead</SelectItem>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.parentName} — {l.childName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !form.dueDate && 'text-muted-foreground')}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {form.dueDate ? format(form.dueDate, 'dd MMM yyyy') : 'Pick a date'}
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

        <div className="flex items-center justify-end mt-4 pt-4 border-t gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-1 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
          >
            {submitting ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * CRM Tasks page — Backend-powered task management for CRM activities.
 * Replaces the previous localStorage-based implementation.
 */
export default function CrmTasksPage() {
  const [tasks, setTasks] = useState<CrmTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'TODO' | 'IN_PROGRESS' | 'DONE'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');

  const fetchTasks = useCallback(async () => {
    try {
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
    } finally {
      setLoading(false);
    }
  }, [filter, priorityFilter]);

  useEffect(() => {
    setLoading(true);
    fetchTasks();
  }, [fetchTasks]);

  const handleTaskCreated = () => {
    toast.success('Task created successfully');
    fetchTasks();
  };

  // Cycle task status: TODO → IN_PROGRESS → DONE → TODO
  const cycleStatus = async (task: CrmTask) => {
    const nextStatus = task.status === 'TODO' ? 'IN_PROGRESS' : task.status === 'IN_PROGRESS' ? 'DONE' : 'TODO';
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
        toast.success(`Task marked as ${STATUS_CONFIG[nextStatus]?.label || nextStatus}`);
        fetchTasks();
      } else {
        toast.error('Failed to update task');
      }
    } catch {
      toast.error('Failed to update task');
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
    } catch {
      toast.error('Failed to delete task');
    }
  };

  // Stats
  const todoCount = tasks.filter((t) => t.status === 'TODO').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const doneCount = tasks.filter((t) => t.status === 'DONE').length;
  const overdueCount = tasks.filter((t) => {
    if (t.status === 'DONE' || !t.dueDate) return false;
    return isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate));
  }).length;

  const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
    NEW: { label: 'New', color: CRM_COLORS.NEW?.hex ?? '#9ca3af' },
    CONTACTED: { label: 'Contacted', color: CRM_COLORS.CONTACTED?.hex ?? '#3b82f6' },
    VISITED: { label: 'Visited', color: CRM_COLORS.TOUR_SCHEDULED?.hex ?? '#8b5cf6' },
    APPLIED: { label: 'Applied', color: CRM_COLORS.APPLICATION?.hex ?? '#f59e0b' },
    ENROLLED: { label: 'Enrolled', color: CRM_COLORS.ENROLLED?.hex ?? '#10b981' },
    LOST: { label: 'Lost', color: CRM_COLORS.LOST?.hex ?? '#ef4444' },
  };

  // Board view columns
  const boardColumns = [
    { key: 'TODO', label: 'To Do', icon: <Circle className="h-4 w-4 text-gray-400" />, color: '#9ca3af' },
    { key: 'IN_PROGRESS', label: 'In Progress', icon: <Clock className="h-4 w-4 text-blue-500" />, color: '#3b82f6' },
    { key: 'DONE', label: 'Done', icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, color: '#10b981' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/crm">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to CRM
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CheckSquare className="h-6 w-6 text-portal-600" />
              CRM Tasks
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage your CRM tasks and to-dos</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchTasks(); }} className="gap-1">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button
            onClick={() => setAddTaskOpen(true)}
            className="gap-1 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-gray-400">{todoCount}</p>
          <p className="text-xs text-gray-500">To Do</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-blue-500">{inProgressCount}</p>
          <p className="text-xs text-gray-500">In Progress</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-green-500">{doneCount}</p>
          <p className="text-xs text-gray-500">Done</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-red-500">{overdueCount}</p>
          <p className="text-xs text-gray-500">Overdue</p>
        </Card>
      </div>

      {/* View Mode + Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(['all', 'TODO', 'IN_PROGRESS', 'DONE'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className={cn('capitalize', filter === f && 'bg-brand-gradient text-white border-0')}
            >
              {f === 'all' ? 'All' : f === 'TODO' ? 'To Do' : f === 'IN_PROGRESS' ? 'In Progress' : 'Done'}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v === 'ALL' ? '' : v)}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'board' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('board')}
              className="rounded-none h-8 text-xs"
            >
              Board
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-none h-8 text-xs"
            >
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Task Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <RefreshCw className="h-5 w-5 animate-spin mr-2" />
          Loading tasks...
        </div>
      ) : tasks.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No tasks yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your first CRM task to get started</p>
          <Button
            onClick={() => setAddTaskOpen(true)}
            className="mt-4 gap-1 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </Card>
      ) : viewMode === 'board' ? (
        /* ── Board View (Kanban-style) ── */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {boardColumns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} className="flex flex-col">
                {/* Column Header */}
                <div className="flex items-center gap-2 p-3 rounded-t-xl" style={{ backgroundColor: col.color + '15' }}>
                  {col.icon}
                  <span className="font-semibold text-sm text-gray-800">{col.label}</span>
                  <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
                    {colTasks.length}
                  </span>
                </div>
                {/* Cards */}
                <div className="flex flex-col gap-2 p-2 bg-gray-50/50 rounded-b-xl min-h-[200px] border border-t-0 border-gray-100">
                  {colTasks.map((task) => {
                    const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
                    const isOverdue = task.status !== 'DONE' && task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));

                    return (
                      <Card
                        key={task.id}
                        className={cn(
                          'p-3 hover:shadow-md transition-all duration-200 border-l-4',
                          task.status === 'DONE' && 'opacity-60',
                          isOverdue && 'border-l-red-500',
                        )}
                        style={{ borderLeftColor: isOverdue ? undefined : col.color }}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn(
                              'text-sm font-medium leading-tight',
                              task.status === 'DONE' && 'line-through text-gray-400',
                            )}>
                              {task.title}
                            </p>
                            <span className={cn(
                              'text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0',
                              priorityCfg.bg, priorityCfg.color, `border ${priorityCfg.border}`,
                            )}>
                              {priorityCfg.label}
                            </span>
                          </div>

                          {task.description && (
                            <p className="text-xs text-gray-500 line-clamp-2">{task.description}</p>
                          )}

                          {/* Lead link */}
                          {task.lead && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <LinkIcon className="h-3 w-3" />
                              <span>{task.lead.parentName}</span>
                              {task.lead.stage && (
                                <span
                                  className="inline-flex items-center gap-0.5 px-1 py-0 rounded text-[9px]"
                                  style={{
                                    backgroundColor: (STAGE_CONFIG[task.lead.stage]?.color || '#9ca3af') + '15',
                                    color: STAGE_CONFIG[task.lead.stage]?.color || '#9ca3af',
                                  }}
                                >
                                  {STAGE_CONFIG[task.lead.stage]?.label || task.lead.stage}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Assignee + Due Date */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {task.assignee && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <UserCircle className="h-3 w-3" />
                                  {task.assignee.name}
                                </div>
                              )}
                            </div>
                            {task.dueDate && (
                              <span className={cn(
                                'text-[11px] flex items-center gap-1',
                                isOverdue ? 'text-red-600 font-medium' : 'text-gray-400',
                              )}>
                                <Calendar className="h-3 w-3" />
                                {isToday(new Date(task.dueDate)) ? 'Today' : format(new Date(task.dueDate), 'dd MMM')}
                              </span>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-1 pt-1 border-t border-gray-100">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[11px] px-2 text-portal-600"
                              onClick={() => cycleStatus(task)}
                            >
                              {task.status === 'TODO' ? 'Start' : task.status === 'IN_PROGRESS' ? 'Complete' : 'Reopen'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 ml-auto"
                              onClick={() => deleteTask(task.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                  {colTasks.length === 0 && (
                    <div className="flex items-center justify-center h-24 text-xs text-gray-400">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── List View ── */
        <div className="space-y-2">
          {tasks.map((task) => {
            const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
            const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.TODO;
            const isOverdue = task.status !== 'DONE' && task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));

            return (
              <Card
                key={task.id}
                className={cn(
                  'p-3 hover:shadow-sm transition-all duration-200',
                  task.status === 'DONE' && 'opacity-60',
                )}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => cycleStatus(task)}
                    className="shrink-0 hover:scale-110 transition-transform"
                  >
                    {statusCfg.icon}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium',
                      task.status === 'DONE' && 'line-through text-gray-400',
                    )}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {task.lead && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <LinkIcon className="h-3 w-3" />
                          {task.lead.parentName}
                        </span>
                      )}
                      {task.assignee && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <UserCircle className="h-3 w-3" />
                          {task.assignee.name}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className={cn(
                          'text-xs flex items-center gap-1',
                          isOverdue ? 'text-red-600 font-medium' : 'text-gray-400',
                        )}>
                          <Calendar className="h-3 w-3" />
                          {format(new Date(task.dueDate), 'dd MMM')}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={cn(
                    'text-[10px] px-2 py-0.5 rounded-full font-medium border',
                    priorityCfg.bg, priorityCfg.color, priorityCfg.border,
                  )}>
                    {priorityCfg.label}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                    onClick={() => deleteTask(task.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Task Dialog */}
      <AddTaskDialog
        open={addTaskOpen}
        onOpenChange={setAddTaskOpen}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}
