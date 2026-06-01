'use client';

import React, { useState, useEffect } from 'react';
import {
  UserCircle,
  Phone,
  Mail,
  Calendar,
  Tag,
  Star,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { format } from 'date-fns';

// ── Constants ──
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

interface StaffMember {
  id: string;
  name: string;
  email: string;
}

interface AddLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadCreated: () => void;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

export function AddLeadDialog({ open, onOpenChange, onLeadCreated }: AddLeadDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [staff, setStaff] = useState<StaffMember[]>([]);

  // ── Form state ──
  const [form, setForm] = useState({
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
  });

  // ── Fetch staff ──
  useEffect(() => {
    async function fetchStaff() {
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
      } catch (err) {
        console.error('Failed to fetch staff:', err);
      }
    }
    if (open) fetchStaff();
  }, [open]);

  // ── Reset form when dialog opens ──
  useEffect(() => {
    if (open) {
      setError('');
      setForm({
        parentName: '',
        parentPhone: '',
        parentEmail: '',
        childName: '',
        childAge: '',
        source: '',
        priority: 'NORMAL',
        programInterest: [],
        estimatedValue: '',
        assignedTo: '',
        notes: '',
        nextFollowUp: null,
      });
    }
  }, [open]);

  const updateField = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleProgram = (program: string) => {
    setForm((prev) => ({
      ...prev,
      programInterest: prev.programInterest.includes(program)
        ? prev.programInterest.filter((p) => p !== program)
        : [...prev.programInterest, program],
    }));
  };

  // ── Submit ──
  const handleSubmit = async () => {
    setError('');

    if (!form.parentName || form.parentName.trim().length < 2) {
      setError('Parent name is required (min 2 characters)');
      return;
    }
    if (!form.parentPhone || !/^\d{10}$/.test(form.parentPhone)) {
      setError('Valid 10-digit phone number is required');
      return;
    }
    if (form.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.parentEmail)) {
      setError('Invalid email format');
      return;
    }
    if (!form.childName || form.childName.trim().length < 2) {
      setError('Child name is required (min 2 characters)');
      return;
    }
    if (!form.source) {
      setError('Source is required');
      return;
    }

    setSubmitting(true);
    try {
      const token = getToken();
      const payload = {
        parentName: form.parentName.trim(),
        parentPhone: form.parentPhone.trim(),
        parentEmail: form.parentEmail.trim() || undefined,
        childName: form.childName.trim(),
        childAge: form.childAge.trim() || undefined,
        source: form.source,
        priority: form.priority,
        programInterest: form.programInterest.length > 0 ? form.programInterest.join(', ') : undefined,
        estimatedValue: form.estimatedValue ? parseFloat(form.estimatedValue) : undefined,
        assignedTo: form.assignedTo || undefined,
        notes: form.notes.trim() || undefined,
        nextFollowUp: form.nextFollowUp?.toISOString() || undefined,
      };

      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create lead');
      }

      onOpenChange(false);
      onLeadCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lead');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add New Lead</DialogTitle>
        </DialogHeader>

        {/* ── Error Message ── */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Parent Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <UserCircle className="h-4 w-4 text-purple-500" />
              Parent Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="parentName">Parent Name *</Label>
                <Input
                  id="parentName"
                  value={form.parentName}
                  onChange={(e) => updateField('parentName', e.target.value)}
                  placeholder="Enter parent name"
                />
              </div>
              <div>
                <Label htmlFor="parentPhone">Parent Phone *</Label>
                <Input
                  id="parentPhone"
                  value={form.parentPhone}
                  onChange={(e) => updateField('parentPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit phone"
                  maxLength={10}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="parentEmail">Parent Email</Label>
              <Input
                id="parentEmail"
                type="email"
                value={form.parentEmail}
                onChange={(e) => updateField('parentEmail', e.target.value)}
                placeholder="parent@email.com"
              />
            </div>
          </div>

          {/* Child Info */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              🧒 Child Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="childName">Child Name *</Label>
                <Input
                  id="childName"
                  value={form.childName}
                  onChange={(e) => updateField('childName', e.target.value)}
                  placeholder="Enter child name"
                />
              </div>
              <div>
                <Label htmlFor="childAge">Child Age / DOB *</Label>
                <Input
                  id="childAge"
                  value={form.childAge}
                  onChange={(e) => updateField('childAge', e.target.value)}
                  placeholder="e.g., 3 years or 15-06-2022"
                />
              </div>
            </div>
          </div>

          {/* Lead Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Tag className="h-4 w-4 text-purple-500" />
              Lead Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Source *</Label>
                <Select value={form.source} onValueChange={(v) => updateField('source', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority *</Label>
                <Select value={form.priority} onValueChange={(v) => updateField('priority', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="NORMAL">Medium</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Program Interest (MultiSelect) */}
            <div>
              <Label>Program Interest</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {PROGRAMS.map((program) => (
                  <button
                    key={program}
                    type="button"
                    onClick={() => toggleProgram(program)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
                      form.programInterest.includes(program)
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {program}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimatedValue">Estimated Fee (₹)</Label>
                <Input
                  id="estimatedValue"
                  type="number"
                  min={0}
                  value={form.estimatedValue}
                  onChange={(e) => updateField('estimatedValue', e.target.value)}
                  placeholder="Enter estimated fee"
                />
              </div>
              <div>
                <Label>Assigned To</Label>
                <Select value={form.assignedTo} onValueChange={(v) => updateField('assignedTo', v === 'NONE' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
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
          </div>

          {/* Notes & Follow-up */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Add any notes about this lead..."
                rows={3}
              />
            </div>
            <div>
              <Label>Next Follow-up Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !form.nextFollowUp && 'text-muted-foreground'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {form.nextFollowUp ? format(form.nextFollowUp, 'dd MMM yyyy') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={form.nextFollowUp || undefined}
                    onSelect={(d) => updateField('nextFollowUp', d)}
                    disabled={(d) => d < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* ── Submit Button ── */}
        <div className="flex items-center justify-end mt-6 pt-4 border-t gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="gap-1 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
          >
            {submitting ? 'Creating...' : 'Create Lead'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
