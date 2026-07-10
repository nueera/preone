'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

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
  'General': { bg: 'bg-[var(--admin-surface-2)]', text: 'text-[var(--admin-text-muted)]' },
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<MessageTemplate | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch('/api/templates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates((data.templates || []) as MessageTemplate[]);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const token = getToken();
      const res = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        setPreviewTemplate((prev) => (prev?.id === id ? null : prev));
      }
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  }, []);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      const matchSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === 'all' || t.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [templates, searchQuery, categoryFilter]);

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-heading text-[var(--admin-text)] flex items-center gap-2">
                <FileText className="w-6 h-6" style={{ color: theme.primary }} />
                Message Templates
              </h1>
              <p className="text-sm text-[var(--admin-text-muted)] mt-1">Manage reusable message templates</p>
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
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-subtle)]" />
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
                <h3 className="font-semibold text-[var(--admin-text)] mb-4">Templates ({filtered.length})</h3>
                {loading ? (
                  <div className="text-center py-12 text-[var(--admin-text-subtle)] text-sm">Loading templates...</div>
                ) : (
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
                              <h4 className="text-sm font-medium text-[var(--admin-text)]">{t.name}</h4>
                              {t.isDefault && <Badge variant="outline" className="text-[9px]">Default</Badge>}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setPreviewTemplate(t)}>
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 text-xs"><Pencil className="w-3 h-3" /></Button>
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600" onClick={() => handleDelete(t.id)}><Trash2 className="w-3 h-3" /></Button>
                            </div>
                          </div>
                          <p className="text-xs text-[var(--admin-text-muted)] line-clamp-2 mb-2">{t.body}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                              {t.variables.map((v) => (
                                <Badge key={v} className="bg-sky-50 text-sky-700 text-[9px]">{'{'}{v}{'}'}</Badge>
                              ))}
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-[var(--admin-text-subtle)]">
                              <span>{t.channel}</span>
                              <span>{t.usageCount} uses</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                )}
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>

          {/* Preview */}
          <StaggerItem>
            <PreOneCard variant="default" className="sticky top-6">
              <PreOneCardContent>
                <h3 className="font-semibold text-[var(--admin-text)] mb-3">Preview</h3>
                {previewTemplate ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className={`${CATEGORY_COLOR[previewTemplate.category].bg} ${CATEGORY_COLOR[previewTemplate.category].text} text-[10px]`}>{previewTemplate.category}</Badge>
                      <Badge variant="outline" className="text-[10px]">{previewTemplate.channel}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--admin-text-subtle)] mb-1">Subject</p>
                      <p className="text-sm font-medium text-[var(--admin-text)]">{previewTemplate.subject}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--admin-text-subtle)] mb-1">Body</p>
                      <div className="p-3 bg-[var(--admin-surface-2)] rounded-lg text-sm text-[var(--admin-text-muted)] whitespace-pre-wrap">
                        {previewTemplate.body}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--admin-text-subtle)] mb-1">Variables</p>
                      <div className="flex flex-wrap gap-1">
                        {previewTemplate.variables.map((v) => (
                          <Badge key={v} className="bg-sky-50 text-sky-700 text-[10px]">{'{'}{v}{'}'}</Badge>
                        ))}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full"><Copy className="w-3 h-3 mr-1" /> Copy Template</Button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-[var(--admin-text-subtle)]">
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
