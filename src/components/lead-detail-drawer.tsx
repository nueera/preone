'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  X,
  Phone,
  Mail,
  Calendar,
  Tag,
  Star,
  UserCircle,
  Trash2,
  ArrowRightLeft,
  Plus,
  Clock,
  MessageSquare,
  Eye,
  FileText,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
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
import { cn } from '@/lib/utils';
import { PORTAL_THEMES, CRM_COLORS, PRIORITY_COLORS as THEME_PRIORITY_COLORS, CHART_PALETTE } from '@/lib/theme-tokens';

const theme = PORTAL_THEMES.admin;
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

interface LeadDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onLeadUpdated: () => void;
}

// ── Constants — using centralized theme tokens ──
const STAGE_CONFIG: Record<string, { label: string; color: string; cardBg: string }> = {
  NEW: { label: 'New', color: CRM_COLORS.NEW?.hex ?? '#9ca3af', cardBg: CRM_COLORS.NEW?.bg ?? 'bg-gray-50' },
  CONTACTED: { label: 'Contacted', color: CRM_COLORS.CONTACTED?.hex ?? '#3b82f6', cardBg: CRM_COLORS.CONTACTED?.bg ?? 'bg-blue-50' },
  VISITED: { label: 'Visited', color: CRM_COLORS.TOUR_SCHEDULED?.hex ?? '#8b5cf6', cardBg: 'bg-purple-50' },
  APPLIED: { label: 'Applied', color: CRM_COLORS.APPLICATION?.hex ?? '#f59e0b', cardBg: 'bg-yellow-50' },
  ENROLLED: { label: 'Enrolled', color: CRM_COLORS.ENROLLED?.hex ?? '#10b981', cardBg: CRM_COLORS.ENROLLED?.bg ?? 'bg-green-50' },
  LOST: { label: 'Lost', color: CRM_COLORS.LOST?.hex ?? '#9ca3af', cardBg: 'bg-red-50' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  HIGH: { label: 'High', color: THEME_PRIORITY_COLORS.HIGH?.text ?? 'text-red-600', bg: 'bg-red-50 border-red-200' },
  NORMAL: { label: 'Medium', color: THEME_PRIORITY_COLORS.MEDIUM?.text ?? 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
  LOW: { label: 'Low', color: THEME_PRIORITY_COLORS.LOW?.text ?? 'text-gray-500', bg: 'bg-gray-50 border-gray-200' },
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

const FOLLOWUP_TYPES = ['Call', 'WhatsApp', 'Email', 'Visit', 'Note'];
const FOLLOWUP_OUTCOMES = ['Interested', 'Not Interested', 'Callback', 'Visited', 'Enrolled'];

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

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

// ── Follow-up Type Icon ──
function FollowUpTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'Call': return <Phone className="h-4 w-4 text-blue-500" />;
    case 'WhatsApp': return <MessageSquare className="h-4 w-4 text-green-500" />;
    case 'Email': return <Mail className="h-4 w-4 text-orange-500" />;
    case 'Visit': return <Eye className="h-4 w-4 text-purple-500" />;
    default: return <FileText className="h-4 w-4 text-gray-500" />;
  }
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
  const [classes, setClasses] = useState<{ id: string; name: string; program: { name: string } }[]>([]);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dob: null as Date | null,
    gender: '',
    classId: '',
    // Father fields
    fatherFirstName: '',
    fatherLastName: '',
    fatherPhone: '',
    fatherEmail: '',
  });

  useEffect(() => {
    if (open && lead) {
      // Pre-fill from lead data
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
          const allClasses = (data.programs || []).flatMap((p: { classes: { id: string; name: string }[] }) =>
            p.classes.map((c: { id: string; name: string }) => ({
              id: c.id,
              name: c.name,
              program: { name: p.name || '' },
            }))
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
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-green-600" />
            Convert Lead to Student
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Student Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Student Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date of Birth *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn('w-full justify-start text-left font-normal', !form.dob && 'text-muted-foreground')}
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
                <Select value={form.gender} onValueChange={(v) => updateField('gender', v)}>
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
              <Select value={form.classId} onValueChange={(v) => updateField('classId', v === 'NONE' ? '' : v)}>
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

          {/* Father Info (pre-filled) */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Father Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input value={form.fatherFirstName} onChange={(e) => updateField('fatherFirstName', e.target.value)} />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input value={form.fatherLastName} onChange={(e) => updateField('fatherLastName', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone *</Label>
                <Input value={form.fatherPhone} onChange={(e) => updateField('fatherPhone', e.target.value)} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={form.fatherEmail} onChange={(e) => updateField('fatherEmail', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end mt-6 pt-4 border-t gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-1 bg-green-600 text-white hover:bg-green-700"
          >
            {submitting ? 'Converting...' : 'Convert to Student'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Drawer Component ──
export function LeadDetailDrawer({ open, onOpenChange, lead, onLeadUpdated }: LeadDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [leadData, setLeadData] = useState<Lead | null>(null);
  const [saving, setSaving] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Add follow-up form
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({
    type: 'Call',
    dateTime: new Date().toISOString(),
    outcome: 'Interested',
    nextFollowUp: null as Date | null,
    notes: '',
  });

  // Editable lead fields
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

  // ── Fetch full lead data when drawer opens ──
  useEffect(() => {
    async function fetchLead() {
      if (!lead || !open) return;
      try {
        const token = getToken();
        const res = await fetch(`/api/crm/leads/${lead.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setLeadData(data.lead);
          setEditForm({
            parentName: data.lead.parentName || '',
            parentPhone: data.lead.parentPhone || '',
            parentEmail: data.lead.parentEmail || '',
            childName: data.lead.childName || '',
            childAge: data.lead.childAge || '',
            source: data.lead.source || '',
            priority: data.lead.priority || 'NORMAL',
            programInterest: data.lead.programInterest ? data.lead.programInterest.split(',').map((s: string) => s.trim()) : [],
            estimatedValue: data.lead.estimatedValue?.toString() || '',
            assignedTo: data.lead.assignedTo || '',
            notes: data.lead.notes || '',
            nextFollowUp: data.lead.nextFollowUp ? new Date(data.lead.nextFollowUp) : null,
            stage: data.lead.stage || 'NEW',
            lostReason: data.lead.lostReason || '',
          });
        }
      } catch (err) {
        console.error('Failed to fetch lead:', err);
      }
    }
    fetchLead();
    setActiveTab('details');
    setShowFollowUpForm(false);
  }, [lead, open]);

  // ── Save lead edits ──
  const handleSaveLead = async () => {
    if (!leadData) return;
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/crm/leads/${leadData.id}`, {
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
          programInterest: editForm.programInterest.length > 0 ? editForm.programInterest.join(', ') : null,
          estimatedValue: editForm.estimatedValue ? parseFloat(editForm.estimatedValue) : null,
          assignedTo: editForm.assignedTo || null,
          notes: editForm.notes || null,
          nextFollowUp: editForm.nextFollowUp?.toISOString() || null,
          lostReason: editForm.stage === 'LOST' ? editForm.lostReason : null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setLeadData(data.lead);
      }
    } catch (err) {
      console.error('Failed to save lead:', err);
    } finally {
      setSaving(false);
    }
  };

  // ── Update stage ──
  const handleStageChange = async (newStage: string) => {
    if (!leadData) return;
    setEditForm((prev) => ({ ...prev, stage: newStage }));
    try {
      const token = getToken();
      const res = await fetch(`/api/crm/leads/${leadData.id}`, {
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
        setLeadData(data.lead);
      }
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  };

  // ── Update priority ──
  const handlePriorityChange = async (newPriority: string) => {
    if (!leadData) return;
    setEditForm((prev) => ({ ...prev, priority: newPriority }));
    try {
      const token = getToken();
      const res = await fetch(`/api/crm/leads/${leadData.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ priority: newPriority }),
      });
      if (res.ok) {
        const data = await res.json();
        setLeadData(data.lead);
      }
    } catch (err) {
      console.error('Failed to update priority:', err);
    }
  };

  // ── Delete lead ──
  const handleDelete = async () => {
    if (!leadData) return;
    try {
      const token = getToken();
      const res = await fetch(`/api/crm/leads/${leadData.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDeleteConfirm(false);
        onOpenChange(false);
        onLeadUpdated();
      }
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };

  // ── Add follow-up ──
  const handleAddFollowUp = async () => {
    if (!leadData || !followUpForm.notes.trim()) return;
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/crm/leads/${leadData.id}/followups`, {
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
        // Refresh lead data
        const leadRes = await fetch(`/api/crm/leads/${leadData.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (leadRes.ok) {
          const data = await leadRes.json();
          setLeadData(data.lead);
        }
        setShowFollowUpForm(false);
        setFollowUpForm({
          type: 'Call',
          dateTime: new Date().toISOString(),
          outcome: 'Interested',
          nextFollowUp: null,
          notes: '',
        });
      }
    } catch (err) {
      console.error('Failed to add follow-up:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!leadData) return null;

  const stageCfg = STAGE_CONFIG[editForm.stage] || STAGE_CONFIG.NEW;
  const priorityCfg = PRIORITY_CONFIG[editForm.priority] || PRIORITY_CONFIG.NORMAL;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[480px] sm:max-w-[480px] p-0 overflow-y-auto">
          <SheetHeader className="p-4 pb-3 border-b bg-gray-50/50">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="text-lg font-bold">{leadData.parentName}</SheetTitle>
                <SheetDescription className="text-sm text-gray-500">
                  Child: {leadData.childName}
                </SheetDescription>
              </div>
            </div>

            {/* Stage & Priority Badges */}
            <div className="flex items-center gap-2 mt-3">
              <Select value={editForm.stage} onValueChange={handleStageChange}>
                <SelectTrigger className="h-7 w-auto text-xs border-0" style={{ backgroundColor: stageCfg.color + '15', color: stageCfg.color }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STAGE_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                        {cfg.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={editForm.priority} onValueChange={handlePriorityChange}>
                <SelectTrigger className={cn('h-7 w-auto text-xs border-0', priorityCfg.bg)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="NORMAL">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-3">
              {leadData.stage === 'ENROLLED' && !leadData.convertedStudentId && (
                <Button
                  size="sm"
                  className="gap-1 bg-green-600 text-white hover:bg-green-700 h-8 text-xs"
                  onClick={() => setConvertOpen(true)}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Convert to Student
                </Button>
              )}
              {leadData.convertedStudentId && (
                <Badge className="bg-green-100 text-green-700 text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Converted
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 ml-auto"
                onClick={() => setDeleteConfirm(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete
              </Button>
            </div>
          </SheetHeader>

          {/* ── Tabs ── */}
          <div className="p-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full bg-gray-100">
                <TabsTrigger value="details" className="flex-1 text-xs">Details</TabsTrigger>
                <TabsTrigger value="followups" className="flex-1 text-xs">Follow-ups</TabsTrigger>
                <TabsTrigger value="activity" className="flex-1 text-xs">Activity</TabsTrigger>
              </TabsList>

              {/* ── Tab 1: Details ── */}
              <TabsContent value="details" className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500">Parent Name</Label>
                      <Input
                        className="h-8 text-sm"
                        value={editForm.parentName}
                        onChange={(e) => setEditForm((p) => ({ ...p, parentName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Phone</Label>
                      <Input
                        className="h-8 text-sm"
                        value={editForm.parentPhone}
                        onChange={(e) => setEditForm((p) => ({ ...p, parentPhone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-gray-500">Email</Label>
                    <Input
                      className="h-8 text-sm"
                      value={editForm.parentEmail}
                      onChange={(e) => setEditForm((p) => ({ ...p, parentEmail: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500">Child Name</Label>
                      <Input
                        className="h-8 text-sm"
                        value={editForm.childName}
                        onChange={(e) => setEditForm((p) => ({ ...p, childName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Child Age</Label>
                      <Input
                        className="h-8 text-sm"
                        value={editForm.childAge}
                        onChange={(e) => setEditForm((p) => ({ ...p, childAge: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500">Source</Label>
                      <Select value={editForm.source} onValueChange={(v) => setEditForm((p) => ({ ...p, source: v }))}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SOURCES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Est. Fee (₹)</Label>
                      <Input
                        type="number"
                        className="h-8 text-sm"
                        value={editForm.estimatedValue}
                        onChange={(e) => setEditForm((p) => ({ ...p, estimatedValue: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Program Interest */}
                  <div>
                    <Label className="text-xs text-gray-500">Program Interest</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {PROGRAMS.map((program) => (
                        <button
                          key={program}
                          type="button"
                          onClick={() => setEditForm((p) => ({
                            ...p,
                            programInterest: p.programInterest.includes(program)
                              ? p.programInterest.filter((pr) => pr !== program)
                              : [...p.programInterest, program],
                          }))}
                          className={cn(
                            'rounded-full px-2.5 py-1 text-xs font-medium border transition-colors',
                            editForm.programInterest.includes(program)
                              ? theme.selectedClass
                              : 'bg-white text-gray-400 border-gray-200'
                          )}
                        >
                          {program}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Next Follow-up */}
                  <div>
                    <Label className="text-xs text-gray-500">Next Follow-up</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn('w-full h-8 text-sm justify-start text-left font-normal', !editForm.nextFollowUp && 'text-muted-foreground')}
                        >
                          <Calendar className="mr-2 h-3.5 w-3.5" />
                          {editForm.nextFollowUp ? format(editForm.nextFollowUp, 'dd MMM yyyy') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={editForm.nextFollowUp || undefined}
                          onSelect={(d) => setEditForm((p) => ({ ...p, nextFollowUp: d }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label className="text-xs text-gray-500">Notes</Label>
                    <Textarea
                      className="text-sm"
                      value={editForm.notes}
                      onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  {/* Lost Reason (only for LOST stage) */}
                  {editForm.stage === 'LOST' && (
                    <div>
                      <Label className="text-xs text-gray-500">Lost Reason</Label>
                      <Input
                        className="h-8 text-sm"
                        value={editForm.lostReason}
                        onChange={(e) => setEditForm((p) => ({ ...p, lostReason: e.target.value }))}
                        placeholder="Reason for losing this lead"
                      />
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleSaveLead}
                  disabled={saving}
                  className="w-full bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </TabsContent>

              {/* ── Tab 2: Follow-ups ── */}
              <TabsContent value="followups" className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Follow-up History</h3>
                  <Button
                    size="sm"
                    className="gap-1 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover h-8 text-xs"
                    onClick={() => setShowFollowUpForm(!showFollowUpForm)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Follow-up
                  </Button>
                </div>

                {/* Add Follow-up Form */}
                {showFollowUpForm && (
                  <div className="bg-gray-50 rounded-lg p-3 space-y-3 border">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Type *</Label>
                        <Select value={followUpForm.type} onValueChange={(v) => setFollowUpForm((p) => ({ ...p, type: v }))}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FOLLOWUP_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Outcome *</Label>
                        <Select value={followUpForm.outcome} onValueChange={(v) => setFollowUpForm((p) => ({ ...p, outcome: v }))}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FOLLOWUP_OUTCOMES.map((o) => (
                              <SelectItem key={o} value={o}>{o}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Next Follow-up</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn('w-full h-8 text-xs justify-start text-left font-normal', !followUpForm.nextFollowUp && 'text-muted-foreground')}
                          >
                            <Calendar className="mr-2 h-3 w-3" />
                            {followUpForm.nextFollowUp ? format(followUpForm.nextFollowUp, 'dd MMM yyyy') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={followUpForm.nextFollowUp || undefined}
                            onSelect={(d) => setFollowUpForm((p) => ({ ...p, nextFollowUp: d }))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label className="text-xs">Notes *</Label>
                      <Textarea
                        className="text-xs"
                        value={followUpForm.notes}
                        onChange={(e) => setFollowUpForm((p) => ({ ...p, notes: e.target.value }))}
                        placeholder="What was discussed?"
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setShowFollowUpForm(false)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs h-7 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
                        onClick={handleAddFollowUp}
                        disabled={saving || !followUpForm.notes.trim()}
                      >
                        {saving ? 'Adding...' : 'Add'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Follow-up Timeline */}
                <div className="space-y-0">
                  {leadData.followUps.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No follow-ups yet. Add one above.
                    </div>
                  ) : (
                    leadData.followUps.map((fu, idx) => (
                      <div key={fu.id} className="relative pl-6 pb-4">
                        {/* Timeline line */}
                        {idx < leadData.followUps.length - 1 && (
                          <div className="absolute left-[9px] top-5 bottom-0 w-px bg-gray-200" />
                        )}
                        {/* Timeline dot */}
                        <div className="absolute left-0 top-1">
                          <FollowUpTypeIcon type={fu.type} />
                        </div>
                        <div className="ml-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-700">
                              {format(new Date(fu.dateTime), 'dd MMM')}
                            </span>
                            <Badge variant="outline" className="text-[10px] h-4">
                              {fu.type}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] h-4',
                                fu.outcome === 'Enrolled' ? 'border-green-200 text-green-700 bg-green-50' :
                                fu.outcome === 'Not Interested' ? 'border-red-200 text-red-700 bg-red-50' :
                                fu.outcome === 'Visited' ? `border-purple-200 ${theme.selectedClass}` :
                                ''
                              )}
                            >
                              {fu.outcome}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                            &quot;{fu.notes}&quot;
                          </p>
                          {fu.createdBy && (
                            <p className="text-[11px] text-gray-400 mt-1">
                              — {fu.createdBy}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* ── Tab 3: Activity ── */}
              <TabsContent value="activity" className="mt-4 space-y-0">
                <h3 className="text-sm font-semibold mb-4">Activity Timeline</h3>
                <div className="space-y-0">
                  {/* Created */}
                  <div className="relative pl-6 pb-4">
                    <div className="absolute left-[9px] top-5 bottom-0 w-px bg-gray-200" />
                    <div className="absolute left-0 top-1">
                      <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                      </div>
                    </div>
                    <div className="ml-2">
                      <p className="text-xs font-medium text-gray-700">Lead created</p>
                      <p className="text-[11px] text-gray-400">
                        {format(new Date(leadData.createdAt), 'dd MMM yyyy, hh:mm a')}
                      </p>
                    </div>
                  </div>

                  {/* Stage changes from follow-ups */}
                  {leadData.followUps.map((fu) => (
                    <div key={fu.id} className="relative pl-6 pb-4">
                      <div className="absolute left-[9px] top-5 bottom-0 w-px bg-gray-200" />
                      <div className="absolute left-0 top-1">
                        <FollowUpTypeIcon type={fu.type} />
                      </div>
                      <div className="ml-2">
                        <p className="text-xs font-medium text-gray-700">
                          {fu.type} — {fu.outcome}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {format(new Date(fu.dateTime), 'dd MMM yyyy, hh:mm a')}
                          {fu.createdBy && ` — ${fu.createdBy}`}
                        </p>
                        {fu.notes && (
                          <p className="text-[11px] text-gray-500 mt-0.5">{fu.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Converted */}
                  {leadData.convertedStudentId && (
                    <div className="relative pl-6 pb-4">
                      <div className="absolute left-0 top-1">
                        <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                          <ArrowRightLeft className="h-2.5 w-2.5 text-white" />
                        </div>
                      </div>
                      <div className="ml-2">
                        <p className="text-xs font-medium text-green-700">Converted to Student</p>
                        <p className="text-[11px] text-gray-400">
                          {format(new Date(leadData.updatedAt), 'dd MMM yyyy, hh:mm a')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* Convert to Student Dialog */}
      <ConvertToStudentDialog
        open={convertOpen}
        onOpenChange={setConvertOpen}
        lead={leadData}
        onConverted={() => {
          setConvertOpen(false);
          onOpenChange(false);
          onLeadUpdated();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Delete Lead
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{leadData?.parentName}</strong>&apos;s lead for <strong>{leadData?.childName}</strong>? This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              Delete Lead
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
