'use client';

import React, { useState } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import {
  School,
  Save,
  Upload,
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  Building2,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

export default function SchoolSettingsPage() {
  const [schoolName, setSchoolName] = useState('PreOne Preschool');
  const [address, setAddress] = useState('123 Education Lane, Koramangala, Bangalore 560034');
  const [phone, setPhone] = useState('080-12345678');
  const [email, setEmail] = useState('info@preonepreschool.com');
  const [website, setWebsite] = useState('www.preonepreschool.com');
  const [academicYear, setAcademicYear] = useState('2025-26');
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('15:30');
  const [workingDays, setWorkingDays] = useState('5');

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <School className="w-6 h-6" style={{ color: theme.primary }} />
                School Settings
              </h1>
              <p className="text-sm text-gray-500 mt-1">General info, branding, and academic configuration</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md">
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </div>
        </StaggerItem>

        {/* School Profile */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-500" /> School Profile
              </h3>
              <div className="flex items-start gap-6 mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                  P1
                </div>
                <div>
                  <Button variant="outline" size="sm"><Upload className="w-4 h-4 mr-2" /> Upload Logo</Button>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG or SVG. Max 2MB.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">School Name</label>
                  <Input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                  <div className="relative"><Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><Input value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" /></div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Phone</label>
                  <div className="relative"><Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9" /></div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Website</label>
                  <div className="relative"><Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><Input value={website} onChange={(e) => setWebsite(e.target.value)} className="pl-9" /></div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Address</label>
                  <div className="relative"><MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" /><Textarea value={address} onChange={(e) => setAddress(e.target.value)} className="pl-9" rows={2} /></div>
                </div>
              </div>
            </PreOneCardContent>
          </PreOneCard>
        </StaggerItem>

        {/* Academic Configuration */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-gray-500" /> Academic Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Academic Year</label>
                  <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Working Days / Week</label>
                  <Input value={workingDays} onChange={(e) => setWorkingDays(e.target.value)} type="number" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center gap-1"><Clock className="w-3 h-3" /> School Start Time</label>
                  <Input value={startTime} onChange={(e) => setStartTime(e.target.value)} type="time" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center gap-1"><Clock className="w-3 h-3" /> School End Time</label>
                  <Input value={endTime} onChange={(e) => setEndTime(e.target.value)} type="time" />
                </div>
              </div>
              <div className="mt-4 p-3 rounded-xl bg-purple-50 border border-purple-100">
                <p className="text-xs text-purple-700"><strong>Current Academic Year:</strong> {academicYear} — Active • <strong>Working Hours:</strong> {startTime} – {endTime} • <strong>Days:</strong> {workingDays}/week</p>
              </div>
            </PreOneCardContent>
          </PreOneCard>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}
