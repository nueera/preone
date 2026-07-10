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
  Plus,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
  IndianRupee,
  User,
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
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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

// ── Section Header Component ──
function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  accentVar,
  accentSoftVar,
  stepNumber,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  accentVar: string;
  accentSoftVar: string;
  stepNumber: number;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
        style={{ background: `var(${accentSoftVar})` }}
      >
        <Icon className="h-5 w-5" style={{ color: `var(${accentVar})` }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              background: `var(${accentSoftVar})`,
              color: `var(${accentVar})`,
            }}
          >
            Step {stepNumber}
          </span>
          <h2
            className="text-base font-semibold"
            style={{ color: 'var(--admin-text)' }}
          >
            {title}
          </h2>
        </div>
        <p
          className="text-xs mt-0.5"
          style={{ color: 'var(--admin-text-muted)' }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}

// ── Field wrapper with error ──
function Field({
  label,
  required,
  error,
  children,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium">
        {label}
        {required && <span style={{ color: 'var(--admin-error)' }}> *</span>}
      </Label>
      {children}
      {error && (
        <p
          className="text-xs flex items-center gap-1"
          style={{ color: 'var(--admin-error)' }}
        >
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * New Lead Form — Full-page lead creation form with multi-section layout.
 * Route: /admin/admissions/leads/new
 */
export default function NewLeadPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [saveAndNew, setSaveAndNew] = useState(false);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [phoneDupCheck, setPhoneDupCheck] = useState<'idle' | 'checking' | 'clear' | 'dup'>('idle');

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
  }, []);

  // ── Phone duplicate check ──
  useEffect(() => {
    if (form.parentPhone.length !== 10) {
      setPhoneDupCheck('idle');
      return;
    }
    setPhoneDupCheck('checking');
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const token = getToken();
        const res = await fetch(
          `/api/crm/leads?search=${encodeURIComponent(form.parentPhone)}&limit=5`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: ctrl.signal,
          },
        );
        if (!res.ok) {
          setPhoneDupCheck('idle');
          return;
        }
        const data = await res.json();
        const dups = (data.leads || []).filter(
          (l: { parentPhone: string }) => l.parentPhone === form.parentPhone,
        );
        setPhoneDupCheck(dups.length > 0 ? 'dup' : 'clear');
      } catch {
        setPhoneDupCheck('idle');
      }
    }, 600);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [form.parentPhone]);

  // ── Helpers ──
  const updateField = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
    if (
      form.parentEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.parentEmail)
    ) {
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
  const handleSubmit = async (e?: React.FormEvent, addAnother = false) => {
    e?.preventDefault();
    if (!validate()) {
      toast.error('Please fix the errors below');
      return;
    }

    setSubmitting(true);
    setSaveAndNew(addAnother);
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
        programInterest:
          form.programInterest.length > 0
            ? form.programInterest.join(', ')
            : undefined,
        estimatedValue: form.estimatedFee
          ? parseFloat(form.estimatedFee)
          : undefined,
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

      if (addAnother) {
        // Reset form for next entry
        setForm({
          parentName: '',
          parentPhone: '',
          parentEmail: '',
          childName: '',
          childAge: '',
          source: '',
          priority: 'NORMAL',
          programInterest: [],
          estimatedFee: '',
          assignedTo: '',
          notes: '',
          nextFollowUp: null,
        });
        setErrors({});
        setPhoneDupCheck('idle');
      } else {
        router.push('/admin/admissions/leads');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create lead');
    } finally {
      setSubmitting(false);
      setSaveAndNew(false);
    }
  };

  const handleCancel = () => {
    router.push('/admin/admissions/leads');
  };

  return (
    <PageTransition className="min-h-screen">
      <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-8">
        {/* ── SECTION 1: HEADER ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/admissions/leads">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: 'var(--admin-primary-soft)' }}
              >
                <Plus
                  className="h-5 w-5"
                  style={{ color: 'var(--admin-primary)' }}
                />
              </div>
              <div>
                <h1
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: 'var(--admin-text)' }}
                >
                  New Lead
                </h1>
                <p
                  className="text-sm"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  Create a new CRM lead entry
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} className="gap-1.5">
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => handleSubmit(undefined, false)}
              disabled={submitting && !saveAndNew}
              className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
            >
              {submitting && !saveAndNew ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {submitting && !saveAndNew ? 'Creating...' : 'Create Lead'}
            </Button>
          </div>
        </div>

        {/* ── Duplicate Phone Warning ── */}
        {phoneDupCheck === 'dup' && (
          <PreOneCard className="!rounded-xl">
            <div
              className="p-4 flex items-center gap-3"
              style={{ background: 'rgba(245,158,11,0.08)' }}
            >
              <AlertCircle
                className="h-5 w-5 flex-shrink-0"
                style={{ color: 'var(--admin-warning)' }}
              />
              <div className="flex-1">
                <div
                  className="text-sm font-semibold"
                  style={{ color: 'var(--admin-text)' }}
                >
                  A lead with this phone number already exists
                </div>
                <div
                  className="text-xs mt-0.5"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  Consider searching for the existing lead before creating a duplicate.
                </div>
              </div>
              <Link href="/admin/admissions/leads">
                <Button size="sm" variant="outline" className="gap-1.5">
                  Search Leads
                </Button>
              </Link>
            </div>
          </PreOneCard>
        )}

        <form onSubmit={(e) => handleSubmit(e, false)} className="flex flex-col gap-4">
          {/* ══════════════════════════════════════════════════
              Section 1: Parent Information
          ══════════════════════════════════════════════════ */}
          <PreOneCard className="!rounded-xl">
            <div className="p-6">
              <SectionHeader
                icon={UserCircle}
                title="Parent Information"
                subtitle="Contact details of the parent or guardian"
                accentVar="--admin-primary"
                accentSoftVar="--admin-primary-soft"
                stepNumber={1}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Parent Name"
                  required
                  error={errors.parentName}
                  htmlFor="parentName"
                >
                  <Input
                    id="parentName"
                    value={form.parentName}
                    onChange={(e) => updateField('parentName', e.target.value)}
                    placeholder="Enter parent name"
                    className={cn(
                      errors.parentName && 'border-red-400 focus-visible:ring-red-200',
                    )}
                  />
                </Field>
                <Field
                  label="Phone Number"
                  required
                  error={errors.parentPhone}
                  htmlFor="parentPhone"
                >
                  <div className="relative">
                    <Phone
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                      style={{ color: 'var(--admin-text-subtle)' }}
                    />
                    <Input
                      id="parentPhone"
                      value={form.parentPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="10-digit phone"
                      maxLength={10}
                      className={cn(
                        'pl-9 tabular-nums',
                        errors.parentPhone && 'border-red-400 focus-visible:ring-red-200',
                      )}
                    />
                    {phoneDupCheck === 'checking' && (
                      <Loader2
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin"
                        style={{ color: 'var(--admin-text-subtle)' }}
                      />
                    )}
                    {phoneDupCheck === 'clear' && (
                      <CheckCircle2
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4"
                        style={{ color: 'var(--admin-success)' }}
                      />
                    )}
                    {phoneDupCheck === 'dup' && (
                      <AlertCircle
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4"
                        style={{ color: 'var(--admin-warning)' }}
                      />
                    )}
                  </div>
                </Field>
              </div>

              <div className="mt-4">
                <Field
                  label="Email Address"
                  error={errors.parentEmail}
                  htmlFor="parentEmail"
                >
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                      style={{ color: 'var(--admin-text-subtle)' }}
                    />
                    <Input
                      id="parentEmail"
                      type="email"
                      value={form.parentEmail}
                      onChange={(e) => updateField('parentEmail', e.target.value)}
                      placeholder="parent@email.com"
                      className={cn(
                        'pl-9',
                        errors.parentEmail && 'border-red-400 focus-visible:ring-red-200',
                      )}
                    />
                  </div>
                </Field>
              </div>
            </div>
          </PreOneCard>

          {/* ══════════════════════════════════════════════════
              Section 2: Child Information
          ══════════════════════════════════════════════════ */}
          <PreOneCard className="!rounded-xl">
            <div className="p-6">
              <SectionHeader
                icon={Baby}
                title="Child Information"
                subtitle="Details about the child and program preferences"
                accentVar="--admin-warning"
                accentSoftVar="--admin-warning-soft"
                stepNumber={2}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Child Name"
                  required
                  error={errors.childName}
                  htmlFor="childName"
                >
                  <Input
                    id="childName"
                    value={form.childName}
                    onChange={(e) => updateField('childName', e.target.value)}
                    placeholder="Enter child name"
                    className={cn(
                      errors.childName && 'border-red-400 focus-visible:ring-red-200',
                    )}
                  />
                </Field>
                <Field label="Child Age / DOB" htmlFor="childAge">
                  <Input
                    id="childAge"
                    value={form.childAge}
                    onChange={(e) => updateField('childAge', e.target.value)}
                    placeholder="e.g., 3 years or 15-06-2022"
                  />
                </Field>
              </div>

              {/* Program Interest — Toggle Chips */}
              <div className="mt-4">
                <Label className="text-xs font-medium">Program Interest</Label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {PROGRAMS.map((program) => {
                    const selected = form.programInterest.includes(program);
                    return (
                      <button
                        key={program}
                        type="button"
                        onClick={() => toggleProgram(program)}
                        className="rounded-full px-4 py-1.5 text-xs font-medium border transition-all duration-150"
                        style={
                          selected
                            ? {
                                background: 'var(--admin-primary-soft)',
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
            </div>
          </PreOneCard>

          {/* ══════════════════════════════════════════════════
              Section 3: Lead Details
          ══════════════════════════════════════════════════ */}
          <PreOneCard className="!rounded-xl">
            <div className="p-6">
              <SectionHeader
                icon={Tag}
                title="Lead Details"
                subtitle="Source, priority, and assignment information"
                accentVar="--admin-info"
                accentSoftVar="--admin-info-soft"
                stepNumber={3}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Source" required error={errors.source}>
                  <Select
                    value={form.source}
                    onValueChange={(v) => updateField('source', v)}
                  >
                    <SelectTrigger
                      className={cn(errors.source && 'border-red-400')}
                    >
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Priority">
                  <Select
                    value={form.priority}
                    onValueChange={(v) => updateField('priority', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <Field label="Estimated Fee (₹)" htmlFor="estimatedFee">
                  <div className="relative">
                    <IndianRupee
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                      style={{ color: 'var(--admin-text-subtle)' }}
                    />
                    <Input
                      id="estimatedFee"
                      type="number"
                      min={0}
                      value={form.estimatedFee}
                      onChange={(e) => updateField('estimatedFee', e.target.value)}
                      placeholder="Enter estimated fee"
                      className="pl-9 tabular-nums"
                    />
                  </div>
                </Field>
                <Field label="Assigned To">
                  <Select
                    value={form.assignedTo || 'NONE'}
                    onValueChange={(v) =>
                      updateField('assignedTo', v === 'NONE' ? '' : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff member" />
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
                </Field>
              </div>
            </div>
          </PreOneCard>

          {/* ══════════════════════════════════════════════════
              Section 4: Notes & Follow-up
          ══════════════════════════════════════════════════ */}
          <PreOneCard className="!rounded-xl">
            <div className="p-6">
              <SectionHeader
                icon={StickyNote}
                title="Notes & Follow-up"
                subtitle="Additional notes and next follow-up scheduling"
                accentVar="--admin-success"
                accentSoftVar="--admin-success-soft"
                stepNumber={4}
              />

              <Field label="Notes" htmlFor="notes">
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Add any notes about this lead..."
                  rows={4}
                />
              </Field>

              <div className="mt-4">
                <Label className="text-xs font-medium">Next Follow-up Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        'mt-1.5 w-full justify-start text-left font-normal',
                        !form.nextFollowUp && 'text-muted-foreground',
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {form.nextFollowUp
                        ? format(form.nextFollowUp, 'dd MMM yyyy')
                        : 'Pick a date'}
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
          </PreOneCard>

          {/* ── Footer Actions ── */}
          <PreOneCard className="!rounded-xl">
            <div className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs" style={{ color: 'var(--admin-text-subtle)' }}>
                Fields marked with{' '}
                <span style={{ color: 'var(--admin-error)' }}>*</span> are required
              </p>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleSubmit(undefined, true)}
                  disabled={submitting && saveAndNew}
                  className="gap-1.5"
                >
                  {submitting && saveAndNew ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  Save & Add Another
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting && !saveAndNew}
                  className="gap-1.5 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover min-w-[120px]"
                >
                  {submitting && !saveAndNew ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5" />
                      Create Lead
                    </>
                  )}
                </Button>
              </div>
            </div>
          </PreOneCard>
        </form>
      </div>
    </PageTransition>
  );
}
