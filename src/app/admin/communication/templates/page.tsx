'use client';

import React, { useState, useMemo } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Plus,
  Search,
  Copy,
  Eye,
  Pencil,
  Trash2,
  IndianRupee,
  CalendarDays,
  Megaphone,
  MessageSquare,
  X,
  Send,
  Preview,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface MessageTemplate {
  id: string;
  name: string;
  category: 'Fee Reminder' | 'Attendance' | 'Event' | 'General';
  channel: 'WhatsApp' | 'SMS' | 'Email';
  subject: string;
  body: string;
  variables: string[];
  usageCount: number;
  lastUsed?: string;
  isDefault: boolean;
}

const MOCK_TEMPLATES: MessageTemplate[] = [
  { id: '1', name: 'Fee Reminder — Gentle', category: 'Fee Reminder', channel: 'WhatsApp', subject: 'Fee Reminder', body: 'Dear Parent, this is a gentle reminder that the fee of ₹{amount} for {student_name} is due by {due_date}. Please pay at the earliest to avoid late fees. Thank you! — PreOne Preschool', variables: ['amount', 'student_name', 'due_date'], usageCount: 156, lastUsed: '2026-06-10', isDefault: true },
  { id: '2', name: 'Fee Reminder — Overdue', category: 'Fee Reminder', channel: 'SMS', subject: 'OVERDUE: Fee Payment', body: 'URGENT: Fee of ₹{amount} for {student_name} is overdue by {days_overdue} days. Please clear dues immediately. — PreOne Preschool', variables: ['amount', 'student_name', 'days_overdue'], usageCount: 45, lastUsed: '2026-06-09', isDefault: false },
  { id: '3', name: 'Absent Notification', category: 'Attendance', channel: 'WhatsApp', subject: 'Attendance Alert', body: 'Your child {student_name} was marked absent today ({date}). If this is an error, please contact the school office. — PreOne Preschool', variables: ['student_name', 'date'], usageCount: 89, lastUsed: '2026-06-12', isDefault: true },
  { id: '4', name: 'Late Arrival Notice', category: 'Attendance', channel: 'WhatsApp', subject: 'Late Arrival', body: 'Your child {student_name} arrived late at {arrival_time} today. Regular attendance ensures your child doesn\'t miss important activities. — PreOne Preschool', variables: ['student_name', 'arrival_time'], usageCount: 34, lastUsed: '2026-06-11', isDefault: false },
  { id: '5', name: 'Event Invitation', category: 'Event', channel: 'WhatsApp', subject: 'You\'re Invited!', body: '🎉 You are invited to {event_name} on {event_date} at {event_time}! Venue: {venue}. Please RSVP by {rsvp_date}. We look forward to seeing you! — PreOne Preschool', variables: ['event_name', 'event_date', 'event_time', 'venue', 'rsvp_date'], usageCount: 42, lastUsed: '2026-06-08', isDefault: true },
  { id: '6', name: 'Holiday Notice', category: 'General', channel: 'Email', subject: 'Holiday Notice — {holiday_name}', body: 'Dear Parents,\n\nSchool will be closed on {date} for {holiday_name}. Classes will resume on {resume_date}.\n\nWishing you a wonderful time with your family!\n\nPreOne Preschool', variables: ['date', 'holiday_name', 'resume_date'], usageCount: 28, lastUsed: '2026-05-25', isDefault: true },
  { id: '7', name: 'Parent-Teacher Meeting', category: 'Event', channel: 'WhatsApp', subject: 'PTM Scheduled', body: '📋 Parent-Teacher Meeting scheduled for {date} from {start_time} to {end_time}. Your slot: {slot_time}. Please arrive 5 minutes early. — PreOne Preschool', variables: ['date', 'start_time', 'end_time', 'slot_time'], usageCount: 67, lastUsed: '2026-06-01', isDefault: false },
  { id: '8', name: 'General Announcement', category: 'General', channel: 'WhatsApp', subject: 'School Announcement', body: '{announcement_text}\n\n— PreOne Preschool', variables: ['announcement_text'], usageCount: 12, isDefault: true },
];

const CATEGORY_ICON: Record<string, React.ElementType> = {
  'Fee Reminder': IndianRupee,
  'Attendance': CalendarDays,
  'Event': Megaphone,
  'General': MessageSquare,
};

const CATEGORY_COLOR: Record<string, { bg: string; text: string }> = {
  'Fee Reminder': { bg: 'bg-amber-50', text: 'text-amber-700' },
  'Attendance': { bg: 'bg-blue-50', text: 'text-blue-700' },
  'Event': { bg: 'bg-purple-50', text: 'text-purple-700' },
  'General': { bg: 'bg-gray-50', text: 'text-gray-700' },
};

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null);

  const filtered = useMemo(() => {
    return MOCK_TEMPLATES.filter((t) => {
      const matchSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === 'all' || t.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [searchQuery, categoryFilter]);

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-6 h-6" style={{ color: theme.primary }} />
                Message Templates
              </h1>
              <p className="text-sm text-gray-500 mt-1">Manage reusable message templates</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md">
              <Plus className="w-4 h-4 mr-2" /> Add Template
            </Button>
          </div>
        </StaggerItem>

        {/* Filters */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-1.5">
              {['all', 'Fee Reminder', 'Attendance', 'Event', 'General'].map((c) => {
                const cfg = CATEGORY_COLOR[c];
                return (
                  <Badge key={c} variant={categoryFilter === c ? 'default' : 'outline'} className={`cursor-pointer text-[10px] ${categoryFilter !== c && cfg ? cfg.text : ''}`} onClick={() => setCategoryFilter(c)}>
                    {c === 'all' ? 'All' : c}
                  </Badge>
                );
              })}
            </div>
          </div>
        </StaggerItem>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template List */}
          <StaggerItem className="lg:col-span-2">
            <PreOneCard variant="default">
              <PreOneCardContent>
                <h3 className="font-semibold text-gray-900 mb-4">Templates ({filtered.length})</h3>
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-3">
                    {filtered.map((t) => {
                      const catCfg = CATEGORY_COLOR[t.category];
                      const CatIcon = CATEGORY_ICON[t.category];
                      return (
                        <div key={t.id} className="p-4 rounded-xl border hover:shadow-sm transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-lg ${catCfg.bg} flex items-center justify-center`}>
                                <CatIcon className={`w-3.5 h-3.5 ${catCfg.text}`} />
                              </div>
                              <h4 className="text-sm font-medium text-gray-900">{t.name}</h4>
                              {t.isDefault && <Badge variant="outline" className="text-[9px]">Default</Badge>}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setPreviewTemplate(t)}>
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 text-xs"><Pencil className="w-3 h-3" /></Button>
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600"><Trash2 className="w-3 h-3" /></Button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{t.body}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                              {t.variables.map((v) => (
                                <Badge key={v} className="bg-sky-50 text-sky-700 text-[9px]">{'{'}{v}{'}'}</Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-gray-400">
                              <span>{t.channel}</span>
                              <span>{t.usageCount} uses</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>

          {/* Preview */}
          <StaggerItem>
            <PreOneCard variant="default" className="sticky top-6">
              <PreOneCardContent>
                <h3 className="font-semibold text-gray-900 mb-3">Preview</h3>
                {previewTemplate ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className={`${CATEGORY_COLOR[previewTemplate.category].bg} ${CATEGORY_COLOR[previewTemplate.category].text} text-[10px]`}>{previewTemplate.category}</Badge>
                      <Badge variant="outline" className="text-[10px]">{previewTemplate.channel}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Subject</p>
                      <p className="text-sm font-medium text-gray-900">{previewTemplate.subject}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Body</p>
                      <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                        {previewTemplate.body}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Variables</p>
                      <div className="flex flex-wrap gap-1">
                        {previewTemplate.variables.map((v) => (
                          <Badge key={v} className="bg-sky-50 text-sky-700 text-[10px]">{'{'}{v}{'}'}</Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full"><Copy className="w-3 h-3 mr-1" /> Copy Template</Button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <Eye className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Click the eye icon on a template to preview</p>
                  </div>
                )}
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>
        </div>
      </StaggerContainer>
    </PageTransition>
  );
}
