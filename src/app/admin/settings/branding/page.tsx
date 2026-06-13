'use client';

import React, { useState } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import {
  Palette,
  Save,
  Upload,
  Eye,
  Sun,
  Moon,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

export default function BrandingSettingsPage() {
  const [primaryColor, setPrimaryColor] = useState('#7C3AED');
  const [secondaryColor, setSecondaryColor] = useState('#0EA5E9');
  const [accentColor, setAccentColor] = useState('#F97316');
  const [schoolName, setSchoolName] = useState('PreOne Preschool');
  const [tagline, setTagline] = useState('Where little minds grow');
  const [customCSS, setCustomCSS] = useState(`/* Custom CSS */\n.hero-gradient {\n  background: linear-gradient(135deg, #7C3AED, #0EA5E9);\n}`);

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Palette className="w-6 h-6" style={{ color: theme.primary }} />
                Branding & Theme
              </h1>
              <p className="text-sm text-gray-500 mt-1">Logo, colors, and custom styling</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md">
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </div>
        </StaggerItem>

        {/* Logo Upload */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-gray-900 mb-4">School Logo</h3>
              <div className="flex items-start gap-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center text-white text-3xl font-bold">
                  P1
                </div>
                <div className="space-y-2">
                  <Button variant="outline"><Upload className="w-4 h-4 mr-2" /> Upload Logo</Button>
                  <p className="text-xs text-gray-400">SVG, PNG, or JPG. Recommended: 512×512px. Max 2MB.</p>
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
              <h3 className="font-semibold text-gray-900 mb-4">Color Scheme</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border" />
                    <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1" />
                  </div>
                  <div className="mt-2 h-8 rounded-lg" style={{ backgroundColor: primaryColor }} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Secondary Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border" />
                    <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="flex-1" />
                  </div>
                  <div className="mt-2 h-8 rounded-lg" style={{ backgroundColor: secondaryColor }} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Accent Color</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border" />
                    <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="flex-1" />
                  </div>
                  <div className="mt-2 h-8 rounded-lg" style={{ backgroundColor: accentColor }} />
                </div>
              </div>
            </PreOneCardContent>
          </PreOneCard>
        </StaggerItem>

        {/* Brand Text */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-gray-900 mb-4">Brand Text</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">School Name Display</label>
                  <Input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Tagline</label>
                  <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
                </div>
              </div>
              {/* Preview */}
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-violet-600 to-sky-500 text-white">
                <h4 className="text-lg font-bold">{schoolName}</h4>
                <p className="text-sm opacity-80">{tagline}</p>
              </div>
            </PreOneCardContent>
          </PreOneCard>
        </StaggerItem>

        {/* Custom CSS */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-gray-900 mb-4">Custom CSS</h3>
              <textarea
                value={customCSS}
                onChange={(e) => setCustomCSS(e.target.value)}
                className="w-full h-40 p-3 rounded-xl border font-mono text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                spellCheck={false}
              />
              <p className="text-xs text-gray-400 mt-1">Custom CSS will be applied after the default theme styles.</p>
            </PreOneCardContent>
          </PreOneCard>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}
