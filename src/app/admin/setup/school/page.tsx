'use client';

import React, { useState } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Upload,
  MapPin,
  Phone,
  Mail,
  Globe,
  Save,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  Camera,
} from 'lucide-react';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import { toast } from 'sonner';

const theme = PORTAL_THEMES.admin;

export default function SchoolSetupPage() {
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: 'PreOne Preschool',
    tagline: 'Where Little Minds Bloom',
    address: '123 Education Lane',
    city: 'Bangalore',
    state: 'Karnataka',
    pin: '560001',
    phone: '080-12345678',
    email: 'info@preone.edu.in',
    website: 'www.preone.edu.in',
    description:
      'A nurturing environment for children aged 2-6 years, focused on holistic development through play-based learning.',
  });

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    toast.success('School information saved successfully');
    setSaving(false);
  };

  const handleLogoUpload = () => {
    // Simulate a logo upload
    setLogoPreview('/preonelogo.png');
    toast.success('Logo uploaded successfully');
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-violet-600" />
              School Profile Setup
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure your school&apos;s basic information, logo, and contact details
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Profile Complete
            </Badge>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-1.5 bg-gradient-to-r from-violet-600 to-sky-500 text-white border-0 hover:from-violet-700 hover:to-sky-600"
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <PreOneCard variant="default">
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-violet-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Basic Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="school-name">School Name</Label>
                    <Input
                      id="school-name"
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Enter school name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tagline">Tagline / Motto</Label>
                    <Input
                      id="tagline"
                      value={form.tagline}
                      onChange={(e) => updateField('tagline', e.target.value)}
                      placeholder="Enter tagline"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="description">About the School</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    rows={3}
                    placeholder="Brief description of your school"
                  />
                </div>
              </div>
            </PreOneCard>

            {/* Address Details */}
            <PreOneCard variant="default">
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Address Details
                  </h2>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address">Street Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Textarea
                      id="address"
                      value={form.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      className="pl-9"
                      rows={2}
                      placeholder="Enter street address"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={form.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={form.state}
                      onChange={(e) => updateField('state', e.target.value)}
                      placeholder="State"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pin">PIN Code</Label>
                    <Input
                      id="pin"
                      value={form.pin}
                      onChange={(e) => updateField('pin', e.target.value)}
                      placeholder="PIN code"
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>
            </PreOneCard>

            {/* Contact Details */}
            <PreOneCard variant="default">
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-8 w-8 rounded-lg bg-sky-100 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-sky-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Contact Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        value={form.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                        className="pl-9"
                        placeholder="Phone number"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        value={form.email}
                        onChange={(e) => updateField('email', e.target.value)}
                        className="pl-9"
                        placeholder="Email address"
                        type="email"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="website"
                      value={form.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      className="pl-9"
                      placeholder="Website URL"
                    />
                  </div>
                </div>
              </div>
            </PreOneCard>
          </div>

          {/* Sidebar - Logo & Progress */}
          <div className="space-y-6">
            {/* Logo Upload Card */}
            <PreOneCard variant="default">
              <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  School Logo
                </h3>
                <div
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-violet-300 hover:bg-violet-50/30 transition-all cursor-pointer"
                  onClick={handleLogoUpload}
                >
                  {logoPreview ? (
                    <div className="space-y-3">
                      <div className="w-20 h-20 rounded-2xl bg-white shadow-sm mx-auto overflow-hidden border">
                        <img
                          src={logoPreview}
                          alt="School logo"
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                      <p className="text-xs text-gray-500">Click to change</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600 font-medium">
                        Click to upload logo
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG up to 2MB
                      </p>
                    </>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={handleLogoUpload}
                  >
                    <Camera className="h-3.5 w-3.5" />
                    {logoPreview ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                </div>
              </div>
            </PreOneCard>

            {/* Setup Progress Card */}
            <PreOneCard variant="default">
              <div className="p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Setup Progress
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'School Profile', done: true },
                    { label: 'Branches', done: true },
                    { label: 'Academic Year', done: true },
                    { label: 'Classes', done: false },
                    { label: 'Fee Structure', done: false },
                    { label: 'Staff', done: false },
                    { label: 'Integrations', done: false },
                  ].map((step, i) => (
                    <div key={step.label} className="flex items-center gap-2.5">
                      <CheckCircle2
                        className={`h-4 w-4 flex-shrink-0 ${
                          step.done ? 'text-emerald-500' : 'text-gray-300'
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          step.done
                            ? 'text-gray-900 font-medium'
                            : 'text-gray-500'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    3 of 7 sections completed
                  </p>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400"
                      style={{ width: '43%' }}
                    />
                  </div>
                </div>
              </div>
            </PreOneCard>

            {/* Quick Info Card */}
            <PreOneCard variant="cosmic">
              <div className="p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  Need Help?
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Your school information is used across all PreOne modules —
                  from fee receipts to parent communications. Make sure it&apos;s
                  accurate!
                </p>
              </div>
            </PreOneCard>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
