'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Tag,
  UserCircle,
  Trash2,
  ArrowRightLeft,
  Plus,
  Clock,
  MessageSquare,
  Eye,
  FileText,
  CheckCircle2,
  Loader2,
  Edit3,
  Save,
  X,
  Baby,
  StickyNote,
  ListChecks,
  Activity,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import { cn } from '@/lib/utils';
import { CRM_COLORS, PRIORITY_COLORS } from '@/lib/theme-tokens';
import { toast } from 'sonner';

// ── Types ──
interface FollowUp {
  id: string;
  type: string;
  dateTime: string;
  outcome: string;
  nextFollowUp: string | null;
  notes: string;
  createdBy: string | null;
  completedAt: string | null;
  createdAt: string;
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

// ── Constants ──
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

const PIPELINE_STAGES = ['NEW', 'CONTACTED', 'VISITED', 'APPLIED', 'ENROLLED'];

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

const SOURCES = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'GOOGLE', label: 'Google' },
  { value: 'WALK_IN', label: 'Walk-in' },
  { value: 'REFERRAL', label: 'Referral' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'JUSTDIAL', label: 'JustDial' },
  { value: 'SULEKHA', label: 'Sulekha' },
  { value: 'NEWSPAPER', label: 'Newspaper' },
  { value: 'HOARDING', label: 'Hoarding' },
  { value: 'EVENT', label: 'Event' },
  { value: 'OTHER', label: 'Other' },
];

const PROGRAMS = ['Nursery', 'LKG', 'UKG', 'Daycare'];

const FOLLOWUP_TYPES = ['Call', 'WhatsApp', 'Email', 'Visit', 'Note'];
const FOLLOWUP_OUTCOMES = [
  'Interested',
  'Not Interested',
  'Callback',
  'Visited',
  'Enrolled',
];

const TASK_STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  TODO: {
    label: 'To Do',
    color: 'var(--admin-text-muted)',
    bg: 'var(--admin-surface-2)',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'var(--admin-info)',
    bg: 'var(--admin-info-soft)',
  },
  DONE: {
    label: 'Done',
    color: 'var(--admin-success)',
    bg: 'var(--admin-success-soft)',
  },
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

// ── Follow-up Type Icon ──
function FollowUpTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'Call':
      return <Phone className="h-4 w-4" style={{ color: 'var(--admin-info)' }} />;
    case 'WhatsApp':
      return (
        <MessageSquare
          className="h-4 w-4"
          style={{ color: 'var(--admin-success)' }}
        />
      );
    case 'Email':
      return (
        <Mail className="h-4 w-4" style={{ color: 'var(--admin-warning)' }} />
      );
    case 'Visit':
      return (
        <Eye className="h-4 w-4" style={{ color: 'var(--admin-primary)' }} />
      );
    default:
      return (
        <FileText
          className="h-4 w-4"
          style={{ color: 'var(--admin-text-muted)' }}
        />
      );
  }
}

// ── Info Card Section Header ──
function SectionHeader({
  icon: Icon,
  title,
  accentVar,
  accentSoftVar,
}: {
  icon: React.ElementType;
  title: string;
  accentVar: string;
  accentSoftVar: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div
        className="flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0"
        style={{ background: `var(${accentSoftVar})` }}
      >
        <Icon className="h-4 w-4" style={{ color: `var(${accentVar})` }} />
      </div>
      <h3
        className="text-sm font-semibold"
        style={{ color: 'var(--admin-text-muted)' }}
      >
        {title}
      </h3>
    </div>
  );
}

// ── Convert to Student Dialog ──
function ConvertToStudentDialog({
  open,
  onOpenChange,
  lead,
  onConverted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onConverted: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState<
    { id: string; name: string; program: { name: string } }[]
  >([]);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dob: null as Date | null,
    gender: '',
    classId: '',
    fatherFirstName: '',
    fatherLastName: '',
    fatherPhone: '',
    fatherEmail: '',
  });

  useEffect(() => {
    if (open && lead) {
      const nameParts = lead.childName.trim().split(/\s+/);
      const parentNameParts = lead.parentName.trim().split(/\s+/);
      setForm({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        dob: null,
        gender: '',
        classId: '',
        fatherFirstName: parentNameParts[0] || '',
        fatherLastName: parentNameParts.slice(1).join(' ') || '',
        fatherPhone: lead.parentPhone || '',
        fatherEmail: lead.parentEmail || '',
      });
      setError('');
    }
  }, [open, lead]);

  useEffect(() => {
    async function fetchClasses() {
      try {
        const token = getToken();
        const res = await fetch('/api/classes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const allClasses = (data.programs || []).flatMap(
            (p: {
              name: string;
              classes: { id: string; name: string }[];
            }) =>
              p.classes.map((c: { id: string; name: string }) => ({
                id: c.id,
                name: c.name,
                program: { name: p.name || '' },
              })),
          );
          setClasses(allClasses);
        }
      } catch (err) {
        console.error('Failed to fetch classes:', err);
      }
    }
    if (open) fetchClasses();
  }, [open]);

  const updateField = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.firstName || !form.lastName) {
      setError('Student first name and last name are required');
      return;
    }
    if (!form.dob || !form.gender) {
      setError('Date of birth and gender are required');
      return;
    }
    if (!form.fatherFirstName || !form.fatherLastName || !form.fatherPhone) {
      setError("Father's name and phone are required");
      return;
    }
    if (!lead) return;

    setSubmitting(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/crm/leads/${lead.id}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          dob: form.dob.toISOString(),
          gender: form.gender,
          classId: form.classId || undefined,
          fatherFirstName: form.fatherFirstName,
          fatherLastName: form.fatherLastName,
          fatherPhone: form.fatherPhone,
          fatherEmail: form.fatherEmail || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to convert lead');
      }

      toast.success('Lead converted to student successfully');
      onOpenChange(false);
      onConverted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to convert lead');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle
            className="text-xl font-bold flex items-center gap-2"
            style={{ color: 'var(--admin-text)' }}
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ background: 'var(--admin-success-soft)' }}
            >
              <ArrowRightLeft
                className="h-4 w-4"
                style={{ color: 'var(--admin-success)' }}
              />
            </div>
            Convert Lead to Student
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
          {/* Student Info */}
          <div className="space-y-3">
            <h3
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--admin-text-muted)' }}
            >
              Student Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date of Birth *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !form.dob && 'text-muted-foreground',
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {form.dob ? format(form.dob, 'dd MMM yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={form.dob || undefined}
                      onSelect={(d) => updateField('dob', d)}
                      disabled={(d) => d > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Gender *</Label>
                <Select
                  value={form.gender}
                  onValueChange={(v) => updateField('gender', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Class</Label>
              <Select
                value={form.classId || 'NONE'}
                onValueChange={(v) =>
                  updateField('classId', v === 'NONE' ? '' : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Unassigned</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.program.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Father Info */}
          <div className="space-y-3">
            <h3
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--admin-text-muted)' }}
            >
              Father Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input
                  value={form.fatherFirstName}
                  onChange={(e) => updateField('fatherFirstName', e.target.value)}
                />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input
                  value={form.fatherLastName}
                  onChange={(e) => updateField('fatherLastName', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone *</Label>
                <Input
                  value={form.fatherPhone}
                  onChange={(e) => updateField('fatherPhone', e.target.value)}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={form.fatherEmail}
                  onChange={(e) => updateField('fatherEmail', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end mt-6 pt-4 border-t gap-3">
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
              <ArrowRightLeft className="h-3.5 w-3.5" />
            )}
            {submitting ? 'Converting...' : 'Convert to Student'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Stage Progress Bar ──
function StageProgressBar({ currentStage }: { currentStage: string }) {
  const currentIndex = PIPELINE_STAGES.indexOf(currentStage);
  const isLost = currentStage === 'LOST';
  const isEnrolled = currentStage === 'ENROLLED';

  return (
    <div className="flex items-center w-full py-2 overflow-x-auto">
      {PIPELINE_STAGES.map((stage, idx) => {
        const cfg = STAGE_CONFIG[stage];
        const isActive = isLost ? false : idx <= currentIndex;
        const isCurrent = stage === currentStage;

        return (
          <React.Fragment key={stage}>
            {/* Stage circle + label */}
            <div className="flex flex-col items-center min-w-[70px]">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300',
                  isCurrent && 'ring-2 ring-offset-2',
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: cfg.color,
                        borderColor: 'transparent',
                        color: 'white',
                        outlineColor: cfg.color,
                      }
                    : {
                        backgroundColor: 'var(--admin-surface)',
                        borderColor: 'var(--admin-border)',
                        color: 'var(--admin-text-subtle)',
                      }
                }
              >
                {isActive && idx < (isLost ? 0 : currentIndex) ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  'text-[11px] mt-1.5 font-medium whitespace-nowrap',
                )}
                style={{
                  color: isCurrent
                    ? 'var(--admin-text)'
                    : isActive
                      ? 'var(--admin-text-muted)'
                      : 'var(--admin-text-subtle)',
                }}
              >
                {cfg.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < PIPELINE_STAGES.length - 1 && (
              <div className="flex-1 h-0.5 mx-1 mt-[-18px] min-w-[20px]">
                <div
                  className="h-full w-full rounded-full transition-all duration-300"
                  style={
                    isActive && idx < currentIndex
                      ? { backgroundColor: cfg.color, opacity: 0.5 }
                      : { backgroundColor: 'var(--admin-border)' }
                  }
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
      {isEnrolled && (
        <div className="flex flex-col items-center min-w-[70px]">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{
              backgroundColor: 'var(--admin-success)',
              color: 'white',
            }}
          >
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <span
            className="text-[11px] mt-1.5 font-medium whitespace-nowrap"
            style={{ color: 'var(--admin-success)' }}
          >
            Done
          </span>
        </div>
      )}
    </div>
  );
}

// ── Activity Event (derived) ──
interface ActivityEvent {
  id: string;
  type: 'created' | 'updated' | 'followup' | 'stage_change' | 'converted';
  timestamp: string;
  title: string;
  description?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

function buildActivityTimeline(lead: Lead, tasks: CrmTask[]): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  // Created event
  events.push({
    id: 'created',
    type: 'created',
    timestamp: lead.createdAt,
    title: 'Lead created',
    description: `Source: ${SOURCE_LABELS[lead.source] || lead.source}`,
    icon: UserPlus,
    color: 'var(--admin-primary)',
    bg: 'var(--admin-primary-soft)',
  });

  // Follow-up events
  lead.followUps.forEach((fu) => {
    events.push({
      id: `fu-${fu.id}`,
      type: 'followup',
      timestamp: fu.createdAt || fu.dateTime,
      title: `${fu.type} follow-up — ${fu.outcome}`,
      description: fu.notes,
      icon:
        fu.type === 'Call'
          ? Phone
          : fu.type === 'WhatsApp'
            ? MessageSquare
            : fu.type === 'Email'
              ? Mail
              : fu.type === 'Visit'
                ? Eye
                : FileText,
      color: 'var(--admin-info)',
      bg: 'var(--admin-info-soft)',
    });
  });

  // Tasks created
  tasks.forEach((task) => {
    events.push({
      id: `task-${task.id}`,
      type: 'stage_change',
      timestamp: task.createdAt,
      title: `Task ${task.status === 'DONE' ? 'completed' : 'created'}: ${task.title}`,
      description: task.description || undefined,
      icon: ListChecks,
      color:
        task.status === 'DONE'
          ? 'var(--admin-success)'
          : 'var(--admin-warning)',
      bg:
        task.status === 'DONE'
          ? 'var(--admin-success-soft)'
          : 'var(--admin-warning-soft)',
    });
  });

  // Converted event
  if (lead.convertedStudentId) {
    events.push({
      id: 'converted',
      type: 'converted',
      timestamp: lead.updatedAt,
      title: 'Converted to Student',
      description: `Student ID: ${lead.convertedStudentId}`,
      icon: ArrowRightLeft,
      color: 'var(--admin-success)',
      bg: 'var(--admin-success-soft)',
    });
  }

  // Last updated (if different from created)
  if (lead.updatedAt !== lead.createdAt) {
    events.push({
      id: 'updated',
      type: 'updated',
      timestamp: lead.updatedAt,
      title: 'Lead details updated',
      icon: Edit3,
      color: 'var(--admin-text-muted)',
      bg: 'var(--admin-surface-2)',
    });
  }

  // Sort newest first
  return events.sort(
    (a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

/**
 * Lead Detail Page — Full lead detail with tabs for Overview, Follow-ups, Tasks, Activity.
 * Route: /admin/admissions/leads/[leadId]
 */
export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.leadId as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [convertOpen, setConvertOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    childName: '',
    childAge: '',
    source: '',
    priority: 'NORMAL',
    programInterest: [] as string[],
    estimatedValue: '',
    assignedTo: '',
    notes: '',
    nextFollowUp: null as Date | null,
    stage: '',
    lostReason: '',
  });

  // Add follow-up form
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({
    type: 'Call',
    dateTime: new Date().toISOString(),
    outcome: 'Interested',
    nextFollowUp: null as Date | null,
    notes: '',
  });

  // Tasks
  const [tasks, setTasks] = useState<CrmTask[]>([]);

  // ── Fetch lead ──
  const fetchLead = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch(`/api/crm/leads/${leadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLead(data.lead);
        setEditForm({
          parentName: data.lead.parentName || '',
          parentPhone: data.lead.parentPhone || '',
          parentEmail: data.lead.parentEmail || '',
          childName: data.lead.childName || '',
          childAge: data.lead.childAge || '',
          source: data.lead.source || '',
          priority: data.lead.priority || 'NORMAL',
          programInterest: data.lead.programInterest
            ? data.lead.programInterest.split(',').map((s: string) => s.trim())
            : [],
          estimatedValue: data.lead.estimatedValue?.toString() || '',
          assignedTo: data.lead.assignedTo || '',
          notes: data.lead.notes || '',
          nextFollowUp: data.lead.nextFollowUp
            ? new Date(data.lead.nextFollowUp)
            : null,
          stage: data.lead.stage || 'NEW',
          lostReason: data.lead.lostReason || '',
        });
      } else if (res.status === 404) {
        toast.error('Lead not found');
        router.push('/admin/admissions/leads');
      }
    } catch (err) {
      console.error('Failed to fetch lead:', err);
      toast.error('Failed to load lead');
    } finally {
      setLoading(false);
    }
  }, [leadId, router]);

  // ── Fetch tasks ──
  const fetchTasks = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch(`/api/crm/tasks?leadId=${leadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  }, [leadId]);

  useEffect(() => {
    fetchLead();
    fetchTasks();
  }, [fetchLead, fetchTasks]);

  // ── Save lead edits ──
  const handleSaveLead = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/crm/leads/${lead.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          parentName: editForm.parentName,
          parentPhone: editForm.parentPhone,
          parentEmail: editForm.parentEmail || null,
          childName: editForm.childName,
          childAge: editForm.childAge || null,
          source: editForm.source,
          priority: editForm.priority,
          programInterest:
            editForm.programInterest.length > 0
              ? editForm.programInterest.join(', ')
              : null,
          estimatedValue: editForm.estimatedValue
            ? parseFloat(editForm.estimatedValue)
            : null,
          assignedTo: editForm.assignedTo || null,
          notes: editForm.notes || null,
          nextFollowUp: editForm.nextFollowUp?.toISOString() || null,
          lostReason: editForm.stage === 'LOST' ? editForm.lostReason : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLead(data.lead);
        setEditing(false);
        toast.success('Lead updated successfully');
      } else {
        toast.error('Failed to update lead');
      }
    } catch (err) {
      console.error('Failed to save lead:', err);
      toast.error('Failed to update lead');
    } finally {
      setSaving(false);
    }
  };

  // ── Update stage ──
  const handleStageChange = async (newStage: string) => {
    if (!lead) return;
    setEditForm((prev) => ({ ...prev, stage: newStage }));
    try {
      const token = getToken();
      const res = await fetch(`/api/crm/leads/${lead.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stage: newStage,
          lostReason: newStage === 'LOST' ? editForm.lostReason : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLead(data.lead);
        toast.success(
          `Stage updated to ${STAGE_CONFIG[newStage]?.label || newStage}`,
        );
      }
    } catch (err) {
      console.error('Failed to update stage:', err);
      toast.error('Failed to update stage');
    }
  };

  // ── Delete lead ──
  const handleDelete = async () => {
    if (!lead) return;
    if (
      !confirm(
        'Are you sure you want to delete this lead? This action cannot be undone.',
      )
    )
      return;
    try {
      const token = getToken();
      const res = await fetch(`/api/crm/leads/${lead.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Lead deleted successfully');
        router.push('/admin/admissions/leads');
      } else {
        toast.error('Failed to delete lead');
      }
    } catch (err) {
      console.error('Failed to delete lead:', err);
      toast.error('Failed to delete lead');
    }
  };

  // ── Add follow-up ──
  const handleAddFollowUp = async () => {
    if (!lead || !followUpForm.notes.trim()) return;
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/crm/leads/${lead.id}/followups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: followUpForm.type,
          dateTime: followUpForm.dateTime,
          outcome: followUpForm.outcome,
          nextFollowUp: followUpForm.nextFollowUp?.toISOString() || null,
          notes: followUpForm.notes.trim(),
        }),
      });
      if (res.ok) {
        toast.success('Follow-up added');
        // Refresh lead data
        const leadRes = await fetch(`/api/crm/leads/${lead.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (leadRes.ok) {
          const data = await leadRes.json();
          setLead(data.lead);
        }
        setShowFollowUpForm(false);
        setFollowUpForm({
          type: 'Call',
          dateTime: new Date().toISOString(),
          outcome: 'Interested',
          nextFollowUp: null,
          notes: '',
        });
      } else {
        toast.error('Failed to add follow-up');
      }
    } catch (err) {
      console.error('Failed to add follow-up:', err);
      toast.error('Failed to add follow-up');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle program in edit mode ──
  const toggleProgram = (program: string) => {
    setEditForm((prev) => ({
      ...prev,
      programInterest: prev.programInterest.includes(program)
        ? prev.programInterest.filter((p) => p !== program)
        : [...prev.programInterest, program],
    }));
  };

  // ── Activity timeline (derived) ──
  const activityEvents = useMemo(
    () => (lead ? buildActivityTimeline(lead, tasks) : []),
    [lead, tasks],
  );

  // ── Loading state ──
  if (loading) {
    return (
      <PageTransition className="min-h-screen">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2
              className="h-8 w-8 animate-spin"
              style={{ color: 'var(--admin-primary)' }}
            />
            <p
              className="text-sm"
              style={{ color: 'var(--admin-text-muted)' }}
            >
              Loading lead details...
            </p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!lead) {
    return (
      <PageTransition className="min-h-screen">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <p style={{ color: 'var(--admin-text-muted)' }}>Lead not found</p>
            <Link href="/admin/admissions/leads">
              <Button variant="outline">Back to Leads</Button>
            </Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  const stageCfg = STAGE_CONFIG[editForm.stage] || STAGE_CONFIG.NEW;
  const priorityCfg = PRIORITY_COLORS[editForm.priority] || PRIORITY_COLORS.MEDIUM;

  return (
    <PageTransition className="min-h-screen">
      <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-8">
        {/* ══════════════════════════════════════════════════
            Header Section
        ══════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/admissions/leads">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
                style={{ background: stageCfg.softVar }}
              >
                <UserCircle
                  className="h-5 w-5"
                  style={{ color: stageCfg.varColor }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1
                    className="text-2xl font-bold tracking-tight"
                    style={{ color: 'var(--admin-text)' }}
                  >
                    {lead.parentName}
                  </h1>
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: stageCfg.softVar, color: stageCfg.varColor }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: stageCfg.varColor }}
                    />
                    {stageCfg.label}
                  </span>
                  {lead.priority && (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        background: priorityCfg.bg,
                        color: priorityCfg.text,
                      }}
                    >
                      {lead.priority === 'HIGH'
                        ? 'High'
                        : lead.priority === 'LOW'
                          ? 'Low'
                          : 'Medium'}
                    </span>
                  )}
                  {lead.convertedStudentId && (
                    <Badge
                      className="text-xs gap-1"
                      style={{
                        background: 'var(--admin-success-soft)',
                        color: 'var(--admin-success)',
                        border: 'none',
                      }}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Converted
                    </Badge>
                  )}
                </div>
                <p
                  className="text-sm mt-0.5"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  Child: {lead.childName}
                  {lead.childAge ? ` (${lead.childAge})` : ''} · Created{' '}
                  {format(new Date(lead.createdAt), 'dd MMM yyyy')}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {!editing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setEditing(true)}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </Button>
                {lead.stage === 'ENROLLED' && !lead.convertedStudentId && (
                  <Button
                    size="sm"
                    className="gap-1.5 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
                    onClick={() => setConvertOpen(true)}
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    Convert to Student
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5"
                  style={{ color: 'var(--admin-error)' }}
                  onClick={handleDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setEditing(false);
                    setEditForm({
                      parentName: lead.parentName || '',
                      parentPhone: lead.parentPhone || '',
                      parentEmail: lead.parentEmail || '',
                      childName: lead.childName || '',
                      childAge: lead.childAge || '',
                      source: lead.source || '',
                      priority: lead.priority || 'NORMAL',
                      programInterest: lead.programInterest
                        ? lead.programInterest.split(',').map((s) => s.trim())
                        : [],
                      estimatedValue: lead.estimatedValue?.toString() || '',
                      assignedTo: lead.assignedTo || '',
                      notes: lead.notes || '',
                      nextFollowUp: lead.nextFollowUp
                        ? new Date(lead.nextFollowUp)
                        : null,
                      stage: lead.stage || 'NEW',
                      lostReason: lead.lostReason || '',
                    });
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
                  onClick={handleSaveLead}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            Stage Progress Bar
        ══════════════════════════════════════════════════ */}
        <PreOneCard className="!rounded-xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-sm font-semibold"
                style={{ color: 'var(--admin-text-muted)' }}
              >
                Pipeline Stage
              </h3>
              <Select value={editForm.stage} onValueChange={handleStageChange}>
                <SelectTrigger
                  className="h-7 w-auto text-xs border-0"
                  style={{
                    backgroundColor: stageCfg.softVar,
                    color: stageCfg.varColor,
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
            </div>

            <StageProgressBar currentStage={lead.stage} />

            {/* Lost reason display */}
            {lead.stage === 'LOST' && lead.lostReason && (
              <div
                className="mt-3 p-2.5 rounded-lg text-sm flex items-start gap-2"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  color: 'var(--admin-error)',
                }}
              >
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Lost Reason:</strong> {lead.lostReason}
                </div>
              </div>
            )}
          </div>
        </PreOneCard>

        {/* ══════════════════════════════════════════════════
            Tabs Section
        ══════════════════════════════════════════════════ */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full" style={{ background: 'var(--admin-surface-2)' }}>
            <TabsTrigger value="overview" className="flex-1 gap-1">
              <Eye className="h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="followups" className="flex-1 gap-1">
              <Clock className="h-3.5 w-3.5" />
              Follow-ups
              <span
                className="ml-1 rounded-full px-1.5 text-[10px] font-semibold"
                style={{
                  background: 'var(--admin-primary-soft)',
                  color: 'var(--admin-primary)',
                }}
              >
                {lead.followUps.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex-1 gap-1">
              <ListChecks className="h-3.5 w-3.5" />
              Tasks
              <span
                className="ml-1 rounded-full px-1.5 text-[10px] font-semibold"
                style={{
                  background: 'var(--admin-surface)',
                  color: 'var(--admin-text-muted)',
                }}
              >
                {tasks.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1 gap-1">
              <Activity className="h-3.5 w-3.5" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* ─────────────────────────────────────────────
              Tab 1: Overview
          ───────────────────────────────────────────── */}
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Parent Info Card */}
              <PreOneCard className="!rounded-xl">
                <div className="p-6">
                  <SectionHeader
                    icon={UserCircle}
                    title="Parent Information"
                    accentVar="--admin-primary"
                    accentSoftVar="--admin-primary-soft"
                  />
                  <div className="space-y-3">
                    {editing ? (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Parent Name</Label>
                          <Input
                            className="h-9 text-sm"
                            value={editForm.parentName}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                parentName: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Phone</Label>
                          <Input
                            className="h-9 text-sm tabular-nums"
                            value={editForm.parentPhone}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                parentPhone: e.target.value
                                  .replace(/\D/g, '')
                                  .slice(0, 10),
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Email</Label>
                          <Input
                            className="h-9 text-sm"
                            value={editForm.parentEmail}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                parentEmail: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Phone
                            className="h-4 w-4"
                            style={{ color: 'var(--admin-text-subtle)' }}
                          />
                          <span
                            className="text-sm tabular-nums"
                            style={{ color: 'var(--admin-text)' }}
                          >
                            {lead.parentPhone}
                          </span>
                        </div>
                        {lead.parentEmail && (
                          <div className="flex items-center gap-2">
                            <Mail
                              className="h-4 w-4"
                              style={{ color: 'var(--admin-text-subtle)' }}
                            />
                            <span
                              className="text-sm"
                              style={{ color: 'var(--admin-text)' }}
                            >
                              {lead.parentEmail}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </PreOneCard>

              {/* Child Info Card */}
              <PreOneCard className="!rounded-xl">
                <div className="p-6">
                  <SectionHeader
                    icon={Baby}
                    title="Child Information"
                    accentVar="--admin-warning"
                    accentSoftVar="--admin-warning-soft"
                  />
                  <div className="space-y-3">
                    {editing ? (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Child Name</Label>
                          <Input
                            className="h-9 text-sm"
                            value={editForm.childName}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                childName: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Child Age / DOB</Label>
                          <Input
                            className="h-9 text-sm"
                            value={editForm.childAge}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                childAge: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Program Interest</Label>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {PROGRAMS.map((program) => {
                              const selected =
                                editForm.programInterest.includes(program);
                              return (
                                <button
                                  key={program}
                                  type="button"
                                  onClick={() => toggleProgram(program)}
                                  className="rounded-full px-3 py-1 text-xs font-medium border transition-all"
                                  style={
                                    selected
                                      ? {
                                          background:
                                            'var(--admin-primary-soft)',
                                          color: 'var(--admin-primary)',
                                          borderColor: 'var(--admin-primary)',
                                        }
                                      : {
                                          background: 'var(--admin-surface)',
                                          color: 'var(--admin-text-subtle)',
                                          borderColor: 'var(--admin-border)',
                                        }
                                  }
                                >
                                  {program}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <Baby
                            className="h-4 w-4"
                            style={{ color: 'var(--admin-text-subtle)' }}
                          />
                          <span
                            className="text-sm font-medium"
                            style={{ color: 'var(--admin-text)' }}
                          >
                            {lead.childName}
                          </span>
                        </div>
                        {lead.childAge && (
                          <div
                            className="text-sm"
                            style={{ color: 'var(--admin-text-muted)' }}
                          >
                            Age / DOB: {lead.childAge}
                          </div>
                        )}
                        {lead.programInterest && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className="text-xs"
                              style={{ color: 'var(--admin-text-subtle)' }}
                            >
                              Programs:
                            </span>
                            {lead.programInterest
                              .split(',')
                              .map((p) => p.trim())
                              .filter(Boolean)
                              .map((program) => (
                                <span
                                  key={program}
                                  className="rounded-md px-2 py-0.5 text-xs font-medium"
                                  style={{
                                    background: 'var(--admin-primary-soft)',
                                    color: 'var(--admin-primary)',
                                  }}
                                >
                                  {program}
                                </span>
                              ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </PreOneCard>

              {/* Lead Details Card */}
              <PreOneCard className="!rounded-xl">
                <div className="p-6">
                  <SectionHeader
                    icon={Tag}
                    title="Lead Details"
                    accentVar="--admin-info"
                    accentSoftVar="--admin-info-soft"
                  />
                  <div className="space-y-3">
                    {editing ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Source</Label>
                            <Select
                              value={editForm.source}
                              onValueChange={(v) =>
                                setEditForm((p) => ({ ...p, source: v }))
                              }
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {SOURCES.map((s) => (
                                  <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Priority</Label>
                            <Select
                              value={editForm.priority}
                              onValueChange={(v) =>
                                setEditForm((p) => ({ ...p, priority: v }))
                              }
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="HIGH">High</SelectItem>
                                <SelectItem value="NORMAL">Medium</SelectItem>
                                <SelectItem value="LOW">Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Estimated Fee (₹)</Label>
                          <Input
                            type="number"
                            className="h-9 text-sm tabular-nums"
                            value={editForm.estimatedValue}
                            onChange={(e) =>
                              setEditForm((p) => ({
                                ...p,
                                estimatedValue: e.target.value,
                              }))
                            }
                          />
                        </div>
                        {editForm.stage === 'LOST' && (
                          <div className="space-y-1.5">
                            <Label className="text-xs">Lost Reason</Label>
                            <Input
                              className="h-9 text-sm"
                              value={editForm.lostReason}
                              onChange={(e) =>
                                setEditForm((p) => ({
                                  ...p,
                                  lostReason: e.target.value,
                                }))
                              }
                              placeholder="Reason for losing this lead"
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="grid grid-cols-2 gap-y-3">
                        <div>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--admin-text-subtle)' }}
                          >
                            Source
                          </p>
                          <p
                            className="text-sm font-medium"
                            style={{ color: 'var(--admin-text)' }}
                          >
                            {SOURCE_LABELS[lead.source] || lead.source}
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--admin-text-subtle)' }}
                          >
                            Priority
                          </p>
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              background: priorityCfg.bg,
                              color: priorityCfg.text,
                            }}
                          >
                            {lead.priority === 'HIGH'
                              ? 'High'
                              : lead.priority === 'LOW'
                                ? 'Low'
                                : 'Medium'}
                          </span>
                        </div>
                        <div>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--admin-text-subtle)' }}
                          >
                            Est. Fee
                          </p>
                          <p
                            className="text-sm font-medium tabular-nums"
                            style={{ color: 'var(--admin-text)' }}
                          >
                            {lead.estimatedValue
                              ? `₹${lead.estimatedValue.toLocaleString('en-IN')}`
                              : '—'}
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--admin-text-subtle)' }}
                          >
                            Assigned To
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: 'var(--admin-text)' }}
                          >
                            {lead.assignedTo || 'Unassigned'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </PreOneCard>

              {/* Notes & Follow-up Card */}
              <PreOneCard className="!rounded-xl">
                <div className="p-6">
                  <SectionHeader
                    icon={StickyNote}
                    title="Notes & Follow-up"
                    accentVar="--admin-success"
                    accentSoftVar="--admin-success-soft"
                  />
                  <div className="space-y-3">
                    {editing ? (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Notes</Label>
                          <Textarea
                            className="text-sm"
                            value={editForm.notes}
                            onChange={(e) =>
                              setEditForm((p) => ({ ...p, notes: e.target.value }))
                            }
                            rows={3}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Next Follow-up</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                className={cn(
                                  'w-full h-9 text-sm justify-start text-left font-normal',
                                  !editForm.nextFollowUp && 'text-muted-foreground',
                                )}
                              >
                                <Calendar className="mr-2 h-3.5 w-3.5" />
                                {editForm.nextFollowUp
                                  ? format(editForm.nextFollowUp, 'dd MMM yyyy')
                                  : 'Pick a date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={editForm.nextFollowUp || undefined}
                                onSelect={(d) =>
                                  setEditForm((p) => ({
                                    ...p,
                                    nextFollowUp: d ?? null,
                                  }))
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p
                            className="text-xs mb-1"
                            style={{ color: 'var(--admin-text-subtle)' }}
                          >
                            Notes
                          </p>
                          <p
                            className="text-sm whitespace-pre-wrap"
                            style={{ color: 'var(--admin-text-muted)' }}
                          >
                            {lead.notes || 'No notes'}
                          </p>
                        </div>
                        <Separator />
                        <div>
                          <p
                            className="text-xs mb-1"
                            style={{ color: 'var(--admin-text-subtle)' }}
                          >
                            Next Follow-up
                          </p>
                          <div className="flex items-center gap-1.5">
                            <Calendar
                              className="h-4 w-4"
                              style={{ color: 'var(--admin-text-subtle)' }}
                            />
                            <span
                              className="text-sm font-medium"
                              style={{ color: 'var(--admin-text)' }}
                            >
                              {lead.nextFollowUp
                                ? format(
                                    new Date(lead.nextFollowUp),
                                    'dd MMM yyyy, hh:mm a',
                                  )
                                : 'Not scheduled'}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </PreOneCard>
            </div>
          </TabsContent>

          {/* ─────────────────────────────────────────────
              Tab 2: Follow-ups
          ───────────────────────────────────────────── */}
          <TabsContent value="followups" className="mt-4">
            <PreOneCard className="!rounded-xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-sm font-semibold flex items-center gap-1.5"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    <Clock
                      className="h-4 w-4"
                      style={{ color: 'var(--admin-primary)' }}
                    />
                    Follow-up History ({lead.followUps.length})
                  </h3>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
                    onClick={() => setShowFollowUpForm(!showFollowUpForm)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Follow-up
                  </Button>
                </div>

                {/* Add Follow-up Form */}
                {showFollowUpForm && (
                  <div
                    className="rounded-lg p-4 space-y-3 border mb-4"
                    style={{
                      background: 'var(--admin-surface-2)',
                      borderColor: 'var(--admin-border)',
                    }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Type *</Label>
                        <Select
                          value={followUpForm.type}
                          onValueChange={(v) =>
                            setFollowUpForm((p) => ({ ...p, type: v }))
                          }
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FOLLOWUP_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Outcome *</Label>
                        <Select
                          value={followUpForm.outcome}
                          onValueChange={(v) =>
                            setFollowUpForm((p) => ({ ...p, outcome: v }))
                          }
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FOLLOWUP_OUTCOMES.map((o) => (
                              <SelectItem key={o} value={o}>
                                {o}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Next Follow-up</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              'w-full h-9 text-sm justify-start text-left font-normal',
                              !followUpForm.nextFollowUp && 'text-muted-foreground',
                            )}
                          >
                            <Calendar className="mr-2 h-3.5 w-3.5" />
                            {followUpForm.nextFollowUp
                              ? format(followUpForm.nextFollowUp, 'dd MMM yyyy')
                              : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={followUpForm.nextFollowUp || undefined}
                            onSelect={(d) =>
                              setFollowUpForm((p) => ({
                                ...p,
                                nextFollowUp: d ?? null,
                              }))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Notes *</Label>
                      <Textarea
                        className="text-sm"
                        value={followUpForm.notes}
                        onChange={(e) =>
                          setFollowUpForm((p) => ({ ...p, notes: e.target.value }))
                        }
                        placeholder="What was discussed?"
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => setShowFollowUpForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
                        onClick={handleAddFollowUp}
                        disabled={saving || !followUpForm.notes.trim()}
                      >
                        {saving ? 'Adding...' : 'Add Follow-up'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Follow-up Timeline */}
                {lead.followUps.length === 0 ? (
                  <div
                    className="text-center py-10"
                    style={{ color: 'var(--admin-text-subtle)' }}
                  >
                    <Clock
                      className="h-8 w-8 mx-auto mb-2 opacity-40"
                      style={{ color: 'var(--admin-text-subtle)' }}
                    />
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      No follow-ups yet
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: 'var(--admin-text-subtle)' }}
                    >
                      Click &quot;Add Follow-up&quot; to log the first interaction.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0 max-h-[500px] overflow-y-auto">
                    {lead.followUps.map((fu, idx) => (
                      <div key={fu.id} className="relative pl-7 pb-5">
                        {/* Timeline line */}
                        {idx < lead.followUps.length - 1 && (
                          <div
                            className="absolute left-[11px] top-6 bottom-0 w-px"
                            style={{ background: 'var(--admin-border)' }}
                          />
                        )}
                        {/* Timeline dot */}
                        <div className="absolute left-0 top-1.5">
                          <FollowUpTypeIcon type={fu.type} />
                        </div>
                        <div className="ml-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="text-xs font-medium tabular-nums"
                              style={{ color: 'var(--admin-text-muted)' }}
                            >
                              {format(
                                new Date(fu.dateTime),
                                'dd MMM yyyy, hh:mm a',
                              )}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] h-5"
                            >
                              {fu.type}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] h-5',
                                fu.outcome === 'Enrolled' &&
                                  'border-green-200 text-green-700 bg-green-50',
                                fu.outcome === 'Not Interested' &&
                                  'border-red-200 text-red-700 bg-red-50',
                                fu.outcome === 'Visited' &&
                                  'border-purple-200 text-purple-700 bg-purple-50',
                                fu.outcome === 'Callback' &&
                                  'border-amber-200 text-amber-700 bg-amber-50',
                              )}
                            >
                              {fu.outcome}
                            </Badge>
                          </div>
                          <p
                            className="text-sm mt-1 leading-relaxed"
                            style={{ color: 'var(--admin-text-muted)' }}
                          >
                            &quot;{fu.notes}&quot;
                          </p>
                          <div className="flex items-center gap-3 mt-1.5">
                            {fu.createdBy && (
                              <span
                                className="text-[11px]"
                                style={{ color: 'var(--admin-text-subtle)' }}
                              >
                                — {fu.createdBy}
                              </span>
                            )}
                            {fu.nextFollowUp && (
                              <span
                                className="text-[11px] flex items-center gap-1"
                                style={{ color: 'var(--admin-text-subtle)' }}
                              >
                                <Calendar className="h-3 w-3" />
                                Next:{' '}
                                {format(new Date(fu.nextFollowUp), 'dd MMM yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PreOneCard>
          </TabsContent>

          {/* ─────────────────────────────────────────────
              Tab 3: Tasks
          ───────────────────────────────────────────── */}
          <TabsContent value="tasks" className="mt-4">
            <PreOneCard className="!rounded-xl">
              <div className="p-6">
                <h3
                  className="text-sm font-semibold flex items-center gap-1.5 mb-4"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  <ListChecks
                    className="h-4 w-4"
                    style={{ color: 'var(--admin-primary)' }}
                  />
                  Linked Tasks ({tasks.length})
                </h3>

                {tasks.length === 0 ? (
                  <div
                    className="text-center py-10"
                    style={{ color: 'var(--admin-text-subtle)' }}
                  >
                    <ListChecks
                      className="h-8 w-8 mx-auto mb-2 opacity-40"
                      style={{ color: 'var(--admin-text-subtle)' }}
                    />
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      No tasks linked to this lead
                    </p>
                    <p
                      className="text-xs mt-1"
                      style={{ color: 'var(--admin-text-subtle)' }}
                    >
                      Create tasks from the Tasks page and link them to this lead.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {tasks.map((task) => {
                      const taskStatus =
                        TASK_STATUS_CONFIG[task.status] || TASK_STATUS_CONFIG.TODO;
                      const taskPriority =
                        PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.MEDIUM;

                      return (
                        <div
                          key={task.id}
                          className="flex items-start gap-3 p-3 rounded-lg border transition-colors"
                          style={{
                            borderColor: 'var(--admin-border)',
                          }}
                        >
                          <div
                            className="h-2 w-2 rounded-full mt-1.5 shrink-0"
                            style={{ background: taskStatus.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p
                                className="text-sm font-medium truncate"
                                style={{ color: 'var(--admin-text)' }}
                              >
                                {task.title}
                              </p>
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                style={{
                                  background: taskStatus.bg,
                                  color: taskStatus.color,
                                }}
                              >
                                {taskStatus.label}
                              </span>
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                style={{
                                  background: taskPriority.bg,
                                  color: taskPriority.text,
                                }}
                              >
                                {task.priority}
                              </span>
                            </div>
                            {task.description && (
                              <p
                                className="text-xs mt-0.5 line-clamp-2"
                                style={{ color: 'var(--admin-text-muted)' }}
                              >
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-1.5">
                              {task.dueDate && (
                                <span
                                  className="text-[11px] flex items-center gap-1"
                                  style={{ color: 'var(--admin-text-subtle)' }}
                                >
                                  <Calendar className="h-3 w-3" />
                                  Due:{' '}
                                  {format(new Date(task.dueDate), 'dd MMM yyyy')}
                                </span>
                              )}
                              {task.assignee && (
                                <span
                                  className="text-[11px]"
                                  style={{ color: 'var(--admin-text-subtle)' }}
                                >
                                  Assigned to: {task.assignee.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </PreOneCard>
          </TabsContent>

          {/* ─────────────────────────────────────────────
              Tab 4: Activity (real derived timeline)
          ───────────────────────────────────────────── */}
          <TabsContent value="activity" className="mt-4">
            <PreOneCard className="!rounded-xl">
              <div className="p-6">
                <h3
                  className="text-sm font-semibold flex items-center gap-1.5 mb-4"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  <Activity
                    className="h-4 w-4"
                    style={{ color: 'var(--admin-primary)' }}
                  />
                  Activity Log
                </h3>

                {activityEvents.length === 0 ? (
                  <div
                    className="text-center py-10"
                    style={{ color: 'var(--admin-text-subtle)' }}
                  >
                    <Activity
                      className="h-8 w-8 mx-auto mb-2 opacity-40"
                      style={{ color: 'var(--admin-text-subtle)' }}
                    />
                    <p
                      className="text-sm font-medium"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      No activity yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0 max-h-[600px] overflow-y-auto">
                    {activityEvents.map((evt, idx) => {
                      const Icon = evt.icon;
                      return (
                        <div key={evt.id} className="relative pl-9 pb-5">
                          {idx < activityEvents.length - 1 && (
                            <div
                              className="absolute left-[15px] top-8 bottom-0 w-px"
                              style={{ background: 'var(--admin-border)' }}
                            />
                          )}
                          <div
                            className="absolute left-0 top-1.5 flex h-8 w-8 items-center justify-center rounded-lg"
                            style={{ background: evt.bg }}
                          >
                            <Icon
                              className="h-4 w-4"
                              style={{ color: evt.color }}
                            />
                          </div>
                          <div className="ml-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="text-sm font-medium"
                                style={{ color: 'var(--admin-text)' }}
                              >
                                {evt.title}
                              </span>
                              <span
                                className="text-[11px] tabular-nums"
                                style={{ color: 'var(--admin-text-subtle)' }}
                              >
                                {format(
                                  new Date(evt.timestamp),
                                  'dd MMM yyyy, hh:mm a',
                                )}
                              </span>
                            </div>
                            {evt.description && (
                              <p
                                className="text-xs mt-1"
                                style={{ color: 'var(--admin-text-muted)' }}
                              >
                                {evt.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </PreOneCard>
          </TabsContent>
        </Tabs>

        {/* Convert to Student Dialog */}
        <ConvertToStudentDialog
          open={convertOpen}
          onOpenChange={setConvertOpen}
          lead={lead}
          onConverted={() => {
            fetchLead();
          }}
        />
      </div>
    </PageTransition>
  );
}
