'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import {
  Palette,
  Save,
  Upload,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface BrandingData {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  schoolName: string;
  tagline: string;
  customCSS: string;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

export default function BrandingSettingsPage() {
  const [data, setData] = useState<BrandingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchBranding = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const res = await fetch('/api/settings/branding', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to load branding data');
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  const updateField = <K extends keyof BrandingData>(field: K, value: BrandingData[K]) => {
    setData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setError('');
    try {
      const token = getToken();
      const res = await fetch('/api/settings/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to save branding');
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <StaggerContainer className="space-y-6">
          <StaggerItem>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-xl" />
              <div>
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-4 w-72 mt-1" />
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <Skeleton className="h-40 w-full rounded-3xl" />
          </StaggerItem>
          <StaggerItem>
            <Skeleton className="h-56 w-full rounded-3xl" />
          </StaggerItem>
        </StaggerContainer>
      </PageTransition>
    );
  }

  if (error && !data) {
    return (
      <PageTransition>
        <StaggerContainer className="space-y-6">
          <StaggerItem>
            <h1 className="text-2xl font-bold font-heading text-[var(--admin-text)] flex items-center gap-2">
              <Palette className="w-6 h-6" style={{ color: theme.primary }} />
              Branding & Theme
            </h1>
          </StaggerItem>
          <StaggerItem>
            <PreOneCard variant="default">
              <PreOneCardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
                  <p className="text-[var(--admin-text)] font-medium mb-1">Failed to load branding settings</p>
                  <p className="text-sm text-[var(--admin-text-muted)] mb-4">{error}</p>
                  <Button onClick={fetchBranding} variant="outline" className="rounded-xl">
                    <RefreshCw className="w-4 h-4 mr-2" /> Retry
                  </Button>
                </div>
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>
        </StaggerContainer>
      </PageTransition>
    );
  }

  if (!data) return null;

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-heading text-[var(--admin-text)] flex items-center gap-2">
                <Palette className="w-6 h-6" style={{ color: theme.primary }} />
                Branding & Theme
              </h1>
              <p className="text-sm text-[var(--admin-text-muted)] mt-1">Logo, colors, and custom styling</p>
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
          {error && <p className="text-sm text-rose-500 mt-2">{error}</p>}
        </StaggerItem>

        {/* Logo Upload */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-[var(--admin-text)] mb-4">School Logo</h3>
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center text-white text-3xl font-bold">
                  P1
                </div>
                <div className="space-y-2">
                  <Button variant="outline"><Upload className="w-4 h-4 mr-2" /> Upload Logo</Button>
                  <p className="text-xs text-[var(--admin-text-subtle)]">SVG, PNG, or JPG. Recommended: 512×512px. Max 2MB.</p>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-[9px]">Light version</Badge>
                    <Badge variant="outline" className="text-[9px]">Dark version</Badge>
                    <Badge variant="outline" className="text-[9px]">Favicon</Badge>
                  </div>
                </div>
              </div>
            </PreOneCardContent>
          </PreOneCard>
        </StaggerItem>

        {/* Color Scheme */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-[var(--admin-text)] mb-4">Color Scheme</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-[var(--admin-text-muted)] mb-2 block">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={data.primaryColor} onChange={(e) => updateField('primaryColor', e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border" />
                    <Input value={data.primaryColor} onChange={(e) => updateField('primaryColor', e.target.value)} className="flex-1" />
                  </div>
                  <div className="mt-2 h-8 rounded-lg" style={{ backgroundColor: data.primaryColor }} />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--admin-text-muted)] mb-2 block">Secondary Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={data.secondaryColor} onChange={(e) => updateField('secondaryColor', e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border" />
                    <Input value={data.secondaryColor} onChange={(e) => updateField('secondaryColor', e.target.value)} className="flex-1" />
                  </div>
                  <div className="mt-2 h-8 rounded-lg" style={{ backgroundColor: data.secondaryColor }} />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--admin-text-muted)] mb-2 block">Accent Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={data.accentColor} onChange={(e) => updateField('accentColor', e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border" />
                    <Input value={data.accentColor} onChange={(e) => updateField('accentColor', e.target.value)} className="flex-1" />
                  </div>
                  <div className="mt-2 h-8 rounded-lg" style={{ backgroundColor: data.accentColor }} />
                </div>
              </div>
            </PreOneCardContent>
          </PreOneCard>
        </StaggerItem>

        {/* Brand Text */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-[var(--admin-text)] mb-4">Brand Text</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[var(--admin-text-muted)] mb-1 block">School Name Display</label>
                  <Input value={data.schoolName} onChange={(e) => updateField('schoolName', e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--admin-text-muted)] mb-1 block">Tagline</label>
                  <Input value={data.tagline} onChange={(e) => updateField('tagline', e.target.value)} />
                </div>
              </div>
              {/* Preview */}
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-violet-600 to-sky-500 text-white">
                <h4 className="text-lg font-bold">{data.schoolName}</h4>
                <p className="text-sm opacity-80">{data.tagline}</p>
              </div>
            </PreOneCardContent>
          </PreOneCard>
        </StaggerItem>

        {/* Custom CSS */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-[var(--admin-text)] mb-4">Custom CSS</h3>
              <textarea
                value={data.customCSS}
                onChange={(e) => updateField('customCSS', e.target.value)}
                className="w-full h-40 p-3 rounded-xl border font-mono text-sm text-[var(--admin-text-muted)] bg-[var(--admin-surface-2)] focus:outline-none focus:ring-2 focus:ring-purple-400"
                spellCheck={false}
              />
              <p className="text-xs text-[var(--admin-text-subtle)] mt-1">Custom CSS will be applied after the default theme styles.</p>
            </PreOneCardContent>
          </PreOneCard>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}
