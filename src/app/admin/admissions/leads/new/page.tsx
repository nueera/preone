'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  UserCircle,
  Baby,
  Tag,
  StickyNote,
  Calendar,
  Save,
  X,
  Loader2,
} from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { PageTransition } from '@/components/ui/page-transition';
import { AnimatedCard } from '@/components/ui/animated-card';
import { cn } from '@/lib/utils';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import { toast } from 'sonner';

const theme = PORTAL_THEMES.admin;

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

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

/**
 * New Lead Form — Full-page lead creation form with multi-section layout.
 * Route: /admin/admissions/leads/new
 */
export default function NewLeadPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
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
    estimatedFee: '',
    assignedTo: '',
    notes: '',
    nextFollowUp: null as Date | null,
  });

  // ── Validation errors ──
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Fetch staff list ──
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
    fetchStaff();
  }, []);

  // ── Helpers ──
  const updateField = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handlePhoneChange = (value: string) => {
    const stripped = value.replace(/\D/g, '').slice(0, 10);
    updateField('parentPhone', stripped);
  };

  const toggleProgram = (program: string) => {
    setForm((prev) => ({
      ...prev,
      programInterest: prev.programInterest.includes(program)
        ? prev.programInterest.filter((p) => p !== program)
        : [...prev.programInterest, program],
    }));
    if (errors.programInterest) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.programInterest;
        return next;
      });
    }
  };

  // ── Validation ──
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.parentName || form.parentName.trim().length < 2) {
      newErrors.parentName = 'Parent name is required (min 2 characters)';
    }
    if (!form.parentPhone || !/^\d{10}$/.test(form.parentPhone)) {
      newErrors.parentPhone = 'Valid 10-digit phone number is required';
    }
    if (form.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.parentEmail)) {
      newErrors.parentEmail = 'Invalid email format';
    }
    if (!form.childName || form.childName.trim().length < 2) {
      newErrors.childName = 'Child name is required (min 2 characters)';
    }
    if (!form.source) {
      newErrors.source = 'Source is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors below');
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
        estimatedValue: form.estimatedFee ? parseFloat(form.estimatedFee) : undefined,
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

      toast.success('Lead created successfully');
      router.push('/admin/admissions/leads');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create lead');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/admissions/leads');
  };

  return (
    <PageTransition className="min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/admissions/leads">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to Leads
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">New Lead</h1>
              <p className="text-sm text-gray-500 mt-0.5">Create a new CRM lead entry</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel} className="gap-1">
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-1 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {submitting ? 'Creating...' : 'Create Lead'}
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ══════════════════════════════════════════════════
              Section 1: Parent Information
          ══════════════════════════════════════════════════ */}
          <AnimatedCard delay={0.05} hover={false}>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-violet-100">
                  <UserCircle className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Parent Information</h2>
                  <p className="text-xs text-gray-500">Contact details of the parent or guardian</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="parentName">
                    Parent Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="parentName"
                    value={form.parentName}
                    onChange={(e) => updateField('parentName', e.target.value)}
                    placeholder="Enter parent name"
                    className={cn(errors.parentName && 'border-red-400 focus-visible:ring-red-200')}
                  />
                  {errors.parentName && (
                    <p className="text-xs text-red-500">{errors.parentName}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="parentPhone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="parentPhone"
                    value={form.parentPhone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="10-digit phone"
                    maxLength={10}
                    className={cn(errors.parentPhone && 'border-red-400 focus-visible:ring-red-200')}
                  />
                  {errors.parentPhone && (
                    <p className="text-xs text-red-500">{errors.parentPhone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="parentEmail">Email Address</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  value={form.parentEmail}
                  onChange={(e) => updateField('parentEmail', e.target.value)}
                  placeholder="parent@email.com"
                  className={cn(errors.parentEmail && 'border-red-400 focus-visible:ring-red-200')}
                />
                {errors.parentEmail && (
                  <p className="text-xs text-red-500">{errors.parentEmail}</p>
                )}
              </div>
            </div>
          </AnimatedCard>

          {/* ══════════════════════════════════════════════════
              Section 2: Child Information
          ══════════════════════════════════════════════════ */}
          <AnimatedCard delay={0.1} hover={false}>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-100">
                  <Baby className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Child Information</h2>
                  <p className="text-xs text-gray-500">Details about the child and program preferences</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="childName">
                    Child Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="childName"
                    value={form.childName}
                    onChange={(e) => updateField('childName', e.target.value)}
                    placeholder="Enter child name"
                    className={cn(errors.childName && 'border-red-400 focus-visible:ring-red-200')}
                  />
                  {errors.childName && (
                    <p className="text-xs text-red-500">{errors.childName}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="childAge">Child Age / DOB</Label>
                  <Input
                    id="childAge"
                    value={form.childAge}
                    onChange={(e) => updateField('childAge', e.target.value)}
                    placeholder="e.g., 3 years or 15-06-2022"
                  />
                </div>
              </div>

              {/* Program Interest — Toggle Chips */}
              <div className="space-y-1.5">
                <Label>Program Interest</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {PROGRAMS.map((program) => (
                    <button
                      key={program}
                      type="button"
                      onClick={() => toggleProgram(program)}
                      className={cn(
                        'rounded-full px-4 py-2 text-sm font-medium border transition-all duration-150',
                        form.programInterest.includes(program)
                          ? cn(theme.selectedClass, 'border-violet-300 shadow-sm')
                          : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-500'
                      )}
                    >
                      {program}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedCard>

          {/* ══════════════════════════════════════════════════
              Section 3: Lead Details
          ══════════════════════════════════════════════════ */}
          <AnimatedCard delay={0.15} hover={false}>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-sky-100">
                  <Tag className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Lead Details</h2>
                  <p className="text-xs text-gray-500">Source, priority, and assignment information</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>
                    Source <span className="text-red-500">*</span>
                  </Label>
                  <Select value={form.source} onValueChange={(v) => updateField('source', v)}>
                    <SelectTrigger className={cn(errors.source && 'border-red-400')}>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.source && (
                    <p className="text-xs text-red-500">{errors.source}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => updateField('priority', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="estimatedFee">Estimated Fee (₹)</Label>
                  <Input
                    id="estimatedFee"
                    type="number"
                    min={0}
                    value={form.estimatedFee}
                    onChange={(e) => updateField('estimatedFee', e.target.value)}
                    placeholder="Enter estimated fee"
                  />
                </div>
                <div className="space-y-1.5">
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
          </AnimatedCard>

          {/* ══════════════════════════════════════════════════
              Section 4: Notes & Follow-up
          ══════════════════════════════════════════════════ */}
          <AnimatedCard delay={0.2} hover={false}>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-100">
                  <StickyNote className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Notes & Follow-up</h2>
                  <p className="text-xs text-gray-500">Additional notes and next follow-up scheduling</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Add any notes about this lead..."
                  rows={4}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Next Follow-up Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
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
          </AnimatedCard>

          {/* ── Footer Actions ── */}
          <AnimatedCard delay={0.25} hover={false}>
            <div className="p-4 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Fields marked with <span className="text-red-500">*</span> are required
              </p>
              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="gap-1 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover min-w-[140px]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Create Lead
                    </>
                  )}
                </Button>
              </div>
            </div>
          </AnimatedCard>
        </form>
      </div>
    </PageTransition>
  );
}
