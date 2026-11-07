'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageTransition } from '@/components/ui/page-transition';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Building2,
  Palette,
  MapPin,
  Phone,
  Users,
  Share2,
  Clock,
  Save,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  Pencil,
  FileSignature,
  Stamp,
  HelpCircle,
  MessageCircle,
  ExternalLink,
  Map,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ──
interface FormData {
  name: string;
  schoolCode: string;
  tagline: string;
  establishedYear: string;
  schoolType: string;
  mediumOfInstruction: string;
  aboutSchool: string;
  logo: string;
  coverImage: string;
  primaryColor: string;
  secondaryColor: string;
  stamp: string;
  principalSignature: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  mapLocation: string;
  mobileNumber: string;
  alternateNumber: string;
  emailAddress: string;
  website: string;
  whatsappNumber: string;
  directorName: string;
  principalName: string;
  adminIncharge: string;
  emergencyContact: string;
  facebook: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  openingTime: string;
  closingTime: string;
  workingDays: string;
  holidayCalendar: string;
}

const EMPTY_FORM: FormData = {
  name: '',
  schoolCode: '',
  tagline: '',
  establishedYear: '',
  schoolType: '',
  mediumOfInstruction: '',
  aboutSchool: '',
  logo: '',
  coverImage: '',
  primaryColor: '#6366F1',
  secondaryColor: '#0EA5E9',
  stamp: '',
  principalSignature: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  country: '',
  pincode: '',
  mapLocation: '',
  mobileNumber: '',
  alternateNumber: '',
  emailAddress: '',
  website: '',
  whatsappNumber: '',
  directorName: '',
  principalName: '',
  adminIncharge: '',
  emergencyContact: '',
  facebook: '',
  instagram: '',
  youtube: '',
  linkedin: '',
  openingTime: '08:00',
  closingTime: '14:00',
  workingDays: '',
  holidayCalendar: '',
};

// ── Section Definitions ──
interface SectionDef {
  id: string;
  title: string;
  icon: React.ElementType;
  accentVar: string;
}

const SECTIONS: SectionDef[] = [
  { id: 'basic', title: 'Basic Information', icon: Building2, accentVar: '--admin-primary' },
  { id: 'branding', title: 'Branding', icon: Palette, accentVar: '--admin-primary' },
  { id: 'address', title: 'Address Details', icon: MapPin, accentVar: '--admin-success' },
  { id: 'contact', title: 'Contact Details', icon: Phone, accentVar: '--admin-info' },
  { id: 'administration', title: 'School Administration', icon: Users, accentVar: '--admin-warning' },
  { id: 'social', title: 'Social Media', icon: Share2, accentVar: '--admin-accent' },
  { id: 'timings', title: 'School Timings', icon: Clock, accentVar: '--admin-success' },
];

// ── Setup Steps (Sidebar) ──
interface SetupStep {
  label: string;
  href: string;
}

const SETUP_STEPS: SetupStep[] = [
  { label: 'School Profile', href: '/admin/setup/school' },
  { label: 'Academic Year', href: '/admin/setup/academic-year' },
  { label: 'Groups', href: '/admin/setup/classes?tab=groups' },
  { label: 'Classes & Programs', href: '/admin/setup/classes' },
  { label: 'Fee Structure', href: '/admin/setup/fee-structure' },
  { label: 'Staff Setup', href: '/admin/setup/staff' },
];

// ── Required fields for completion percentage ──
const REQUIRED_FIELDS: (keyof FormData)[] = [
  'name',
  'address1',
  'city',
  'state',
  'pincode',
  'mobileNumber',
  'emailAddress',
];

// ── Helper: Section Header ──
function SectionHeader({ section }: { section: SectionDef }) {
  const Icon = section.icon;
  const accentColor = `var(${section.accentVar})`;

  return (
    <div className="flex items-center gap-3 mb-5">
      <div
        className="flex items-center justify-center h-8 w-8 rounded-lg shrink-0"
        style={{ backgroundColor: accentColor }}
      >
        <Icon className="h-4 w-4 text-white" />
      </div>
      <h2
        className="text-base font-semibold"
        style={{ color: 'var(--admin-text)' }}
      >
        {section.title}
      </h2>
    </div>
  );
}

// ── Helper: Form Field ──
function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        className="text-[13px] font-medium flex items-center gap-1"
        style={{ color: 'var(--admin-text-muted)' }}
      >
        {label}
        {required && (
          <span style={{ color: 'var(--admin-error)' }}>*</span>
        )}
      </label>
      {children}
    </div>
  );
}

// ── Helper: Styled Select ──
function StyledSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        borderColor: 'var(--admin-border)',
        backgroundColor: 'var(--admin-surface)',
        color: 'var(--admin-text)',
      }}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

// ── Main Page Component ──
export default function SchoolSetupPage() {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState(1);

  const updateField = useCallback((field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  // ── Fetch school data on mount ──
  useEffect(() => {
    async function fetchSchool() {
      try {
        const token = localStorage.getItem('preone_token');
        const res = await fetch('/api/settings/school', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        const s = data.school;
        if (s) {
          setForm((prev) => ({
            ...prev,
            name: s.name || '',
            schoolCode: s.schoolCode || '',
            address1: s.address || '',
            city: s.city || '',
            state: s.state || '',
            country: s.country || '',
            pincode: s.pincode || '',
            mobileNumber: s.phone || '',
            emailAddress: s.email || '',
            website: s.website || '',
            logo: s.logo || '',
          }));
          if (s.logo) setLogoPreview(s.logo);
        }
      } catch {
        // Silently fail — user starts with empty form
      } finally {
        setLoading(false);
      }
    }
    fetchSchool();
  }, []);

  // ── Compute completion percentage ──
  const completionPct = Math.round(
    (REQUIRED_FIELDS.filter((f) => form[f]?.trim().length > 0).length /
      REQUIRED_FIELDS.length) *
      100
  );

  // ── Save handler ──
  const handleSave = async (isDraft = false) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('preone_token');
      const res = await fetch('/api/settings/school', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name,
          schoolCode: form.schoolCode,
          logo: form.logo,
          address: form.address1,
          city: form.city,
          state: form.state,
          country: form.country,
          pincode: form.pincode,
          phone: form.mobileNumber,
          email: form.emailAddress,
          website: form.website,
          board: form.schoolType,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save');
      }

      toast.success(
        isDraft ? 'Draft saved successfully' : 'School profile updated successfully'
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // ── Logo upload handler ──
  const handleLogoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          toast.error('Logo must be under 2MB');
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          setLogoPreview(dataUrl);
          updateField('logo', dataUrl);
          toast.success('Logo uploaded successfully');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // ── Cover upload handler ──
  const handleCoverUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Cover image must be under 5MB');
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          setCoverPreview(dataUrl);
          updateField('coverImage', dataUrl);
          toast.success('Cover image uploaded successfully');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2
            className="h-8 w-8 animate-spin"
            style={{ color: 'var(--admin-primary)' }}
          />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-xl shrink-0"
              style={{
                backgroundColor: 'var(--admin-primary-soft)',
                color: 'var(--admin-primary)',
              }}
            >
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1
                className="text-[24px] sm:text-[28px] font-bold leading-tight"
                style={{ color: 'var(--admin-text)' }}
              >
                School Profile Setup
              </h1>
              <p
                className="text-sm mt-0.5"
                style={{ color: 'var(--admin-text-muted)' }}
              >
                Configure your school&apos;s basic information and preferences
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Completion Badge */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: 'var(--admin-success-soft)',
                color: 'var(--admin-success)',
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {completionPct}% Complete
            </div>

            {/* Save Draft Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave(true)}
              disabled={saving}
              className="gap-1.5"
              style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-text-muted)' }}
            >
              Save Draft
            </Button>

            {/* Save Changes Button */}
            <Button
              size="sm"
              onClick={() => handleSave(false)}
              disabled={saving}
              className="gap-1.5"
              style={{
                backgroundColor: 'var(--admin-primary)',
                color: 'var(--admin-primary-foreground)',
              }}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left Column (2/3): Form Sections ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Basic Information */}
            <div
              className="rounded-2xl border p-6"
              style={{
                backgroundColor: 'var(--admin-surface)',
                borderColor: 'var(--admin-border)',
              }}
            >
              <SectionHeader section={SECTIONS[0]} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="School Name" required>
                  <Input
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Enter school name"
                  />
                </FormField>
                <FormField label="School Code">
                  <Input
                    value={form.schoolCode}
                    onChange={(e) => updateField('schoolCode', e.target.value)}
                    placeholder="e.g. SCH-001"
                  />
                </FormField>
                <FormField label="Tagline">
                  <Input
                    value={form.tagline}
                    onChange={(e) => updateField('tagline', e.target.value)}
                    placeholder="School motto or tagline"
                  />
                </FormField>
                <FormField label="Established Year">
                  <Input
                    value={form.establishedYear}
                    onChange={(e) => updateField('establishedYear', e.target.value)}
                    placeholder="e.g. 2010"
                    maxLength={4}
                  />
                </FormField>
                <FormField label="School Type">
                  <StyledSelect
                    value={form.schoolType}
                    onChange={(v) => updateField('schoolType', v)}
                    placeholder="Select school type"
                    options={[
                      { value: 'PLAYHOUSE', label: 'Playhouse' },
                      { value: 'PRESCHOOL', label: 'Preschool' },
                      { value: 'NURSERY', label: 'Nursery' },
                      { value: 'KINDERGARTEN', label: 'Kindergarten' },
                      { value: 'DAYCARE', label: 'Daycare' },
                      { value: 'MONTESSORI', label: 'Montessori' },
                      { value: 'PRIMARY', label: 'Primary School' },
                    ]}
                  />
                </FormField>
                <FormField label="Medium of Instruction">
                  <StyledSelect
                    value={form.mediumOfInstruction}
                    onChange={(v) => updateField('mediumOfInstruction', v)}
                    placeholder="Select medium"
                    options={[
                      { value: 'ENGLISH', label: 'English' },
                      { value: 'HINDI', label: 'Hindi' },
                      { value: 'BILINGUAL', label: 'Bilingual' },
                      { value: 'REGIONAL', label: 'Regional Language' },
                    ]}
                  />
                </FormField>
              </div>

              <div className="mt-4">
                <FormField label="About School">
                  <Textarea
                    value={form.aboutSchool}
                    onChange={(e) => updateField('aboutSchool', e.target.value)}
                    rows={3}
                    placeholder="Brief description of your school, its vision and values"
                  />
                </FormField>
              </div>
            </div>

            {/* Section 2: Branding */}
            <div
              className="rounded-2xl border p-6"
              style={{
                backgroundColor: 'var(--admin-surface)',
                borderColor: 'var(--admin-border)',
              }}
            >
              <SectionHeader section={SECTIONS[1]} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Logo Upload */}
                <div>
                  <p
                    className="text-[13px] font-medium mb-2"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    School Logo
                  </p>
                  <div
                    className="border-2 border-dashed rounded-xl h-[140px] flex items-center justify-center cursor-pointer transition-colors"
                    style={{
                      borderColor: 'var(--admin-border)',
                      backgroundColor: 'var(--admin-surface-2)',
                    }}
                    onClick={handleLogoUpload}
                  >
                    {logoPreview ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-xl overflow-hidden border shadow-sm">
                            { }
                            <img
                              src={logoPreview}
                              alt="School logo"
                              className="w-full h-full object-contain p-1"
                            />
                          </div>
                          <div
                            className="absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full"
                            style={{
                              backgroundColor: 'var(--admin-primary)',
                            }}
                          >
                            <Pencil className="h-3 w-3 text-white" />
                          </div>
                        </div>
                        <p
                          className="text-xs"
                          style={{ color: 'var(--admin-text-muted)' }}
                        >
                          Click to change logo
                        </p>
                        <p
                          className="text-[11px]"
                          style={{ color: 'var(--admin-text-subtle)' }}
                        >
                          PNG, JPG up to 2MB
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className="flex items-center justify-center w-14 h-14 rounded-xl"
                          style={{ backgroundColor: 'var(--admin-surface-2)' }}
                        >
                          <ImageIcon
                            className="h-7 w-7"
                            style={{ color: 'var(--admin-text-subtle)' }}
                          />
                        </div>
                        <p
                          className="text-sm font-medium"
                          style={{ color: 'var(--admin-text-muted)' }}
                        >
                          Click to upload logo
                        </p>
                        <p
                          className="text-[11px]"
                          style={{ color: 'var(--admin-text-subtle)' }}
                        >
                          PNG, JPG up to 2MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cover Image Upload */}
                <div>
                  <p
                    className="text-[13px] font-medium mb-2"
                    style={{ color: 'var(--admin-text-muted)' }}
                  >
                    Cover Image
                  </p>
                  <div
                    className="border-2 border-dashed rounded-xl h-[140px] flex items-center justify-center cursor-pointer transition-colors"
                    style={{
                      borderColor: 'var(--admin-border)',
                      backgroundColor: 'var(--admin-surface-2)',
                    }}
                    onClick={handleCoverUpload}
                  >
                    {coverPreview ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-xl overflow-hidden border shadow-sm">
                            { }
                            <img
                              src={coverPreview}
                              alt="Cover"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div
                            className="absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full"
                            style={{
                              backgroundColor: 'var(--admin-primary)',
                            }}
                          >
                            <Pencil className="h-3 w-3 text-white" />
                          </div>
                        </div>
                        <p
                          className="text-xs"
                          style={{ color: 'var(--admin-text-muted)' }}
                        >
                          Click to change cover
                        </p>
                        <p
                          className="text-[11px]"
                          style={{ color: 'var(--admin-text-subtle)' }}
                        >
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className="flex items-center justify-center w-14 h-14 rounded-xl"
                          style={{ backgroundColor: 'var(--admin-surface-2)' }}
                        >
                          <ImageIcon
                            className="h-7 w-7"
                            style={{ color: 'var(--admin-text-subtle)' }}
                          />
                        </div>
                        <p
                          className="text-sm font-medium"
                          style={{ color: 'var(--admin-text-muted)' }}
                        >
                          Click to upload cover
                        </p>
                        <p
                          className="text-[11px]"
                          style={{ color: 'var(--admin-text-subtle)' }}
                        >
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Color Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                <FormField label="Primary Color">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) => updateField('primaryColor', e.target.value)}
                      className="h-9 w-10 rounded border cursor-pointer shrink-0"
                      style={{ borderColor: 'var(--admin-border)' }}
                    />
                    <Input
                      value={form.primaryColor}
                      onChange={(e) => updateField('primaryColor', e.target.value)}
                      placeholder="#6366F1"
                      className="flex-1"
                    />
                  </div>
                </FormField>
                <FormField label="Secondary Color">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.secondaryColor}
                      onChange={(e) => updateField('secondaryColor', e.target.value)}
                      className="h-9 w-10 rounded border cursor-pointer shrink-0"
                      style={{ borderColor: 'var(--admin-border)' }}
                    />
                    <Input
                      value={form.secondaryColor}
                      onChange={(e) => updateField('secondaryColor', e.target.value)}
                      placeholder="#0EA5E9"
                      className="flex-1"
                    />
                  </div>
                </FormField>
              </div>

              {/* Upload Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                <Button
                  variant="outline"
                  className="gap-2 justify-start"
                  style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-text-muted)' }}
                  onClick={() => toast.info('Stamp upload coming soon')}
                >
                  <Stamp className="h-4 w-4" />
                  Upload Stamp
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 justify-start"
                  style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-text-muted)' }}
                  onClick={() => toast.info('Signature upload coming soon')}
                >
                  <FileSignature className="h-4 w-4" />
                  Upload Signature
                </Button>
              </div>
            </div>

            {/* Section 3: Address Details */}
            <div
              className="rounded-2xl border p-6"
              style={{
                backgroundColor: 'var(--admin-surface)',
                borderColor: 'var(--admin-border)',
              }}
            >
              <SectionHeader section={SECTIONS[2]} />

              <div className="space-y-4">
                <FormField label="Address Line 1" required>
                  <Input
                    value={form.address1}
                    onChange={(e) => updateField('address1', e.target.value)}
                    placeholder="Street address"
                  />
                </FormField>
                <FormField label="Address Line 2">
                  <Input
                    value={form.address2}
                    onChange={(e) => updateField('address2', e.target.value)}
                    placeholder="Apartment, suite, etc. (optional)"
                  />
                </FormField>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField label="City" required>
                    <Input
                      value={form.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="City"
                    />
                  </FormField>
                  <FormField label="State" required>
                    <Input
                      value={form.state}
                      onChange={(e) => updateField('state', e.target.value)}
                      placeholder="State"
                    />
                  </FormField>
                  <FormField label="Country" required>
                    <StyledSelect
                      value={form.country}
                      onChange={(v) => updateField('country', v)}
                      placeholder="Select country"
                      options={[
                        { value: 'IN', label: 'India' },
                        { value: 'US', label: 'United States' },
                        { value: 'GB', label: 'United Kingdom' },
                        { value: 'AE', label: 'UAE' },
                        { value: 'SG', label: 'Singapore' },
                        { value: 'AU', label: 'Australia' },
                      ]}
                    />
                  </FormField>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Pincode" required>
                    <Input
                      value={form.pincode}
                      onChange={(e) => updateField('pincode', e.target.value)}
                      placeholder="PIN code"
                      maxLength={6}
                    />
                  </FormField>
                  <FormField label="Google Map Location">
                    <div className="flex items-center gap-2">
                      <Input
                        value={form.mapLocation}
                        onChange={(e) => updateField('mapLocation', e.target.value)}
                        placeholder="Google Maps URL"
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 shrink-0"
                        style={{
                          borderColor: 'var(--admin-border)',
                          color: 'var(--admin-info)',
                        }}
                        onClick={() => toast.info('Map picker coming soon')}
                      >
                        <Map className="h-3.5 w-3.5" />
                        Pick on Map
                      </Button>
                    </div>
                  </FormField>
                </div>
              </div>
            </div>

            {/* Section 4: Contact Details */}
            <div
              className="rounded-2xl border p-6"
              style={{
                backgroundColor: 'var(--admin-surface)',
                borderColor: 'var(--admin-border)',
              }}
            >
              <SectionHeader section={SECTIONS[3]} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Mobile Number" required>
                  <Input
                    value={form.mobileNumber}
                    onChange={(e) => updateField('mobileNumber', e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </FormField>
                <FormField label="Alternate Number">
                  <Input
                    value={form.alternateNumber}
                    onChange={(e) => updateField('alternateNumber', e.target.value)}
                    placeholder="Alternate phone number"
                  />
                </FormField>
                <FormField label="Email Address" required>
                  <Input
                    value={form.emailAddress}
                    onChange={(e) => updateField('emailAddress', e.target.value)}
                    placeholder="school@example.com"
                    type="email"
                  />
                </FormField>
                <FormField label="Website">
                  <Input
                    value={form.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    placeholder="www.school.com"
                  />
                </FormField>
                <FormField label="WhatsApp Number">
                  <Input
                    value={form.whatsappNumber}
                    onChange={(e) => updateField('whatsappNumber', e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </FormField>
              </div>
            </div>

            {/* Section 5: School Administration */}
            <div
              className="rounded-2xl border p-6"
              style={{
                backgroundColor: 'var(--admin-surface)',
                borderColor: 'var(--admin-border)',
              }}
            >
              <SectionHeader section={SECTIONS[4]} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Director Name">
                  <Input
                    value={form.directorName}
                    onChange={(e) => updateField('directorName', e.target.value)}
                    placeholder="Director's full name"
                  />
                </FormField>
                <FormField label="Principal Name" required>
                  <Input
                    value={form.principalName}
                    onChange={(e) => updateField('principalName', e.target.value)}
                    placeholder="Principal's full name"
                  />
                </FormField>
                <FormField label="Admin Incharge" required>
                  <Input
                    value={form.adminIncharge}
                    onChange={(e) => updateField('adminIncharge', e.target.value)}
                    placeholder="Admin incharge name"
                  />
                </FormField>
                <FormField label="Emergency Contact" required>
                  <Input
                    value={form.emergencyContact}
                    onChange={(e) => updateField('emergencyContact', e.target.value)}
                    placeholder="Emergency contact number"
                  />
                </FormField>
              </div>
            </div>

            {/* Section 6: Social Media */}
            <div
              className="rounded-2xl border p-6"
              style={{
                backgroundColor: 'var(--admin-surface)',
                borderColor: 'var(--admin-border)',
              }}
            >
              <SectionHeader section={SECTIONS[5]} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Facebook">
                  <Input
                    value={form.facebook}
                    onChange={(e) => updateField('facebook', e.target.value)}
                    placeholder="Facebook page URL"
                  />
                </FormField>
                <FormField label="Instagram">
                  <Input
                    value={form.instagram}
                    onChange={(e) => updateField('instagram', e.target.value)}
                    placeholder="Instagram profile URL"
                  />
                </FormField>
                <FormField label="YouTube">
                  <Input
                    value={form.youtube}
                    onChange={(e) => updateField('youtube', e.target.value)}
                    placeholder="YouTube channel URL"
                  />
                </FormField>
                <FormField label="LinkedIn">
                  <Input
                    value={form.linkedin}
                    onChange={(e) => updateField('linkedin', e.target.value)}
                    placeholder="LinkedIn page URL"
                  />
                </FormField>
              </div>
            </div>

            {/* Section 7: School Timings */}
            <div
              className="rounded-2xl border p-6"
              style={{
                backgroundColor: 'var(--admin-surface)',
                borderColor: 'var(--admin-border)',
              }}
            >
              <SectionHeader section={SECTIONS[6]} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Opening Time" required>
                  <Input
                    type="time"
                    value={form.openingTime}
                    onChange={(e) => updateField('openingTime', e.target.value)}
                  />
                </FormField>
                <FormField label="Closing Time" required>
                  <Input
                    type="time"
                    value={form.closingTime}
                    onChange={(e) => updateField('closingTime', e.target.value)}
                  />
                </FormField>
                <FormField label="Working Days" required>
                  <StyledSelect
                    value={form.workingDays}
                    onChange={(v) => updateField('workingDays', v)}
                    placeholder="Select working days"
                    options={[
                      { value: 'MON-FRI', label: 'Monday - Friday' },
                      { value: 'MON-SAT', label: 'Monday - Saturday' },
                      { value: 'MON-SAT_HALF', label: 'Mon-Fri Full + Sat Half' },
                    ]}
                  />
                </FormField>
                <FormField label="Holiday Calendar">
                  <Button
                    variant="outline"
                    className="gap-2 justify-start w-full"
                    style={{
                      borderColor: 'var(--admin-border)',
                      color: 'var(--admin-text-muted)',
                      height: '36px',
                    }}
                    onClick={() => toast.info('Holiday calendar coming soon')}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Upload Holiday Calendar
                  </Button>
                </FormField>
              </div>
            </div>
          </div>

          {/* ── Right Column (1/3): Sidebar ── */}
          <div className="space-y-6">
            {/* Setup Progress Card */}
            <div
              className="rounded-2xl border p-6"
              style={{
                backgroundColor: 'var(--admin-surface)',
                borderColor: 'var(--admin-border)',
              }}
            >
              <h3
                className="text-sm font-semibold mb-4"
                style={{ color: 'var(--admin-text)' }}
              >
                Setup Progress
              </h3>

              <div className="space-y-3">
                {SETUP_STEPS.map((step, i) => {
                  const stepNum = i + 1;
                  const isCurrentStep = step.href === '/admin/setup/school';
                  const isDone = stepNum < completedSteps;

                  return (
                    <Link
                      key={step.label}
                      href={step.href}
                      className="flex items-center gap-3 group"
                    >
                      {/* Step Circle */}
                      {isDone ? (
                        <div
                          className="flex items-center justify-center w-7 h-7 rounded-full shrink-0"
                          style={{ backgroundColor: 'var(--admin-success)' }}
                        >
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                      ) : isCurrentStep ? (
                        <div
                          className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 font-bold text-xs text-white"
                          style={{ backgroundColor: 'var(--admin-primary)' }}
                        >
                          {stepNum}
                        </div>
                      ) : (
                        <div
                          className="flex items-center justify-center w-7 h-7 rounded-full shrink-0 font-medium text-xs"
                          style={{
                            backgroundColor: 'var(--admin-surface-2)',
                            color: 'var(--admin-text-muted)',
                          }}
                        >
                          {stepNum}
                        </div>
                      )}

                      {/* Step Label */}
                      <span
                        className={`text-sm group-hover:underline ${
                          isCurrentStep
                            ? 'font-semibold'
                            : isDone
                            ? 'font-medium'
                            : ''
                        }`}
                        style={{
                          color: isCurrentStep
                            ? 'var(--admin-primary)'
                            : isDone
                            ? 'var(--admin-text)'
                            : 'var(--admin-text-muted)',
                        }}
                      >
                        {step.label}
                      </span>

                      {!isDone && !isCurrentStep && (
                        <ExternalLink
                          className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ color: 'var(--admin-text-subtle)' }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Progress Bar */}
              <div
                className="my-4"
                style={{ borderTop: '1px solid var(--admin-border)' }}
              />
              <div className="text-center">
                <p
                  className="text-xs mb-2"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  {completedSteps} of {SETUP_STEPS.length} steps completed
                </p>
                <div
                  className="w-full h-1.5 rounded-full overflow-hidden"
                  style={{ backgroundColor: 'var(--admin-surface-2)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(completedSteps / SETUP_STEPS.length) * 100}%`,
                      backgroundColor: 'var(--admin-primary)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Help Card */}
            <div
              className="rounded-2xl border p-6"
              style={{
                backgroundColor: 'var(--admin-surface)',
                borderColor: 'var(--admin-border)',
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <HelpCircle
                  className="h-5 w-5"
                  style={{ color: 'var(--admin-primary)' }}
                />
                <h3
                  className="text-sm font-semibold"
                  style={{ color: 'var(--admin-text)' }}
                >
                  Need Help?
                </h3>
              </div>

              {/* PreO Character Placeholder */}
              <div
                className="flex items-center justify-center w-16 h-16 rounded-2xl mx-auto mb-4"
                style={{ backgroundColor: 'var(--admin-primary-soft)' }}
              >
                <MessageCircle
                  className="h-8 w-8"
                  style={{ color: 'var(--admin-primary)' }}
                />
              </div>

              <p
                className="text-xs text-center leading-relaxed mb-4"
                style={{ color: 'var(--admin-text-muted)' }}
              >
                Your school information is used across all PreOne modules — from
                fee receipts to parent communications. Make sure it&apos;s accurate
                and up to date!
              </p>

              <Button
                className="w-full gap-2"
                style={{
                  backgroundColor: 'var(--admin-primary)',
                  color: 'var(--admin-primary-foreground)',
                }}
                onClick={() => toast.info('PreO AI assistant coming soon')}
              >
                <MessageCircle className="h-4 w-4" />
                Ask PreO
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
