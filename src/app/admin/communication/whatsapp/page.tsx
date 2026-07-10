'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageSquare,
  Phone,
  Send,
  Plus,
  Wifi,
  WifiOff,
  Users,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  FileText,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  body: string;
  variables: string[];
  usageCount: number;
}

interface BroadcastList {
  id: string;
  name: string;
  recipients: number;
  lastSent?: string;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

const RECENT_MESSAGES = [
  { id: '1', to: 'All Parents', message: 'Summer camp registration is now open!', time: '2h ago', status: 'DELIVERED', count: 186 },
  { id: '2', to: 'Fee Defaulters', message: 'Fee reminder: Outstanding payment due', time: '5h ago', status: 'DELIVERED', count: 12 },
  { id: '3', to: 'Nursery Parents', message: 'Parent-Teacher meeting on 20th June', time: '1d ago', status: 'DELIVERED', count: 64 },
  { id: '4', to: 'UKG Parents', message: 'Annual day rehearsal schedule', time: '2d ago', status: 'FAILED', count: 3 },
];

const STATUS_BADGE: Record<string, string> = {
  DELIVERED: 'bg-emerald-50 text-emerald-700',
  FAILED: 'bg-red-50 text-red-700',
};

export default function WhatsAppPage() {
  const [isConnected] = useState(true);
  const [message, setMessage] = useState('');
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastList[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [templatesRes, broadcastsRes] = await Promise.all([
        fetch('/api/templates?channel=WhatsApp', { headers }),
        fetch('/api/whatsapp/broadcasts', { headers }),
      ]);
      if (templatesRes.ok) {
        const data = await templatesRes.json();
        setTemplates((data.templates || []) as WhatsAppTemplate[]);
      }
      if (broadcastsRes.ok) {
        const data = await broadcastsRes.json();
        setBroadcasts(
          (data.broadcastLists || []).map((b: { id: string; name: string; recipientCount: number; lastSentAt?: string }) => ({
            id: b.id,
            name: b.name,
            recipients: b.recipientCount,
            lastSent: b.lastSentAt,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch WhatsApp data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-heading text-[var(--admin-text)] flex items-center gap-2">
                <MessageSquare className="w-6 h-6" style={{ color: theme.primary }} />
                WhatsApp Integration
              </h1>
              <p className="text-sm text-[var(--admin-text-muted)] mt-1">Manage WhatsApp messaging and broadcasts</p>
            </div>
            <Badge className={`${isConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'} text-xs px-3 py-1`}>
              {isConnected ? <><Wifi className="w-3 h-3 mr-1" /> Connected</> : <><WifiOff className="w-3 h-3 mr-1" /> Disconnected</>}
            </Badge>
          </div>
        </StaggerItem>

        {/* Connection Status Card */}
        <StaggerItem>
          <PreOneCard variant="default" className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl ${isConnected ? 'bg-emerald-50' : 'bg-red-50'} flex items-center justify-center`}>
                  <MessageSquare className={`w-7 h-7 ${isConnected ? 'text-emerald-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--admin-text)]">WhatsApp Business API</h3>
                  <p className="text-sm text-[var(--admin-text-muted)]">Phone: +91 98765 43210 • Business: PreOne Preschool</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-[var(--admin-text-subtle)]">
                    <span>Messages Today: 24</span>
                    <span>Templates: {templates.length}</span>
                    <span>Lists: {broadcasts.length}</span>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                {isConnected ? 'Reconnect' : 'Connect'}
              </Button>
            </div>
          </PreOneCard>
        </StaggerItem>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message Templates */}
          <StaggerItem className="lg:col-span-2">
            <PreOneCard variant="default">
              <PreOneCardContent>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[var(--admin-text)]">Message Templates</h3>
                  <Button variant="outline" size="sm"><Plus className="w-3 h-3 mr-1" /> New Template</Button>
                </div>
                {loading ? (
                  <div className="text-center py-8 text-[var(--admin-text-subtle)] text-sm">Loading templates...</div>
                ) : (
                <ScrollArea className="max-h-64">
                  <div className="space-y-2">
                    {templates.map((t) => (
                      <div key={t.id} className="p-3 rounded-xl border hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-[var(--admin-text)]">{t.name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px]">{t.category}</Badge>
                            <span className="text-[10px] text-[var(--admin-text-subtle)]">Used {t.usageCount}×</span>
                          </div>
                        </div>
                        <p className="text-xs text-[var(--admin-text-muted)] mb-2 line-clamp-2">{t.body}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1">
                            {t.variables.map((v) => (
                              <Badge key={v} className="bg-sky-50 text-sky-700 text-[9px]">{'{'}{v}{'}'}</Badge>
                            ))}
                          </div>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px]"><Copy className="w-3 h-3 mr-1" /> Copy</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                )}
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>

          {/* Broadcast Lists */}
          <StaggerItem>
            <PreOneCard variant="default">
              <PreOneCardContent>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[var(--admin-text)]">Broadcast Lists</h3>
                  <Button variant="outline" size="sm"><Plus className="w-3 h-3 mr-1" /> New</Button>
                </div>
                <ScrollArea className="max-h-64">
                  <div className="space-y-2">
                    {broadcasts.map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--admin-surface-2)]">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                            <Users className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--admin-text)]">{b.name}</p>
                            <p className="text-[10px] text-[var(--admin-text-subtle)]">{b.recipients} recipients</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px]"><Send className="w-3 h-3" /></Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>
        </div>

        {/* Send Message */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-[var(--admin-text)] mb-3 flex items-center gap-2">
                <Send className="w-4 h-4 text-[var(--admin-text-muted)]" /> Send Message
              </h3>
              <div className="space-y-3">
                <Input placeholder="Select broadcast list or enter phone number..." />
                <Textarea placeholder="Type your message..." value={message} onChange={(e) => setMessage(e.target.value)} rows={3} />
                <div className="flex justify-end">
                  <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md" disabled={!message.trim()}>
                    <Send className="w-4 h-4 mr-2" /> Send
                  </Button>
                </div>
              </div>
            </PreOneCardContent>
          </PreOneCard>
        </StaggerItem>

        {/* Recent Messages */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-[var(--admin-text)] mb-3">Recent Messages</h3>
              <div className="space-y-2">
                {RECENT_MESSAGES.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--admin-surface-2)] flex items-center justify-center"><MessageSquare className="w-4 h-4 text-[var(--admin-text-muted)]" /></div>
                      <div>
                        <p className="text-sm font-medium">{m.to}</p>
                        <p className="text-xs text-[var(--admin-text-subtle)] truncate max-w-xs">{m.message}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`${STATUS_BADGE[m.status]} text-[9px]`}>{m.status}</Badge>
                      <p className="text-[10px] text-[var(--admin-text-subtle)] mt-0.5">{m.time} • {m.count} sent</p>
                    </div>
                  </div>
                ))}
              </div>
            </PreOneCardContent>
          </PreOneCard>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}
