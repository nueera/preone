'use client';

import React, { useState } from 'react';
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

const MOCK_TEMPLATES: WhatsAppTemplate[] = [
  { id: '1', name: 'Fee Reminder', category: 'Fee', body: 'Dear Parent, the fee of ₹{amount} for {student_name} is due by {due_date}. Please pay at the earliest. — PreOne School', variables: ['amount', 'student_name', 'due_date'], usageCount: 156 },
  { id: '2', name: 'Attendance Alert', category: 'Attendance', body: 'Your child {student_name} was marked {status} today. — PreOne School', variables: ['student_name', 'status'], usageCount: 89 },
  { id: '3', name: 'Event Invite', category: 'Event', body: 'You are invited to {event_name} on {event_date} at {event_time}. We look forward to seeing you! — PreOne School', variables: ['event_name', 'event_date', 'event_time'], usageCount: 42 },
  { id: '4', name: 'Daily Update', category: 'General', body: 'Today {student_name} had a great day! 🌟 Activities: {activities}. Meals: {meal_status}. Mood: {mood}. — PreOne School', variables: ['student_name', 'activities', 'meal_status', 'mood'], usageCount: 234 },
  { id: '5', name: 'Holiday Notice', category: 'General', body: 'School will be closed on {date} for {holiday_name}. Classes resume on {resume_date}. — PreOne School', variables: ['date', 'holiday_name', 'resume_date'], usageCount: 28 },
];

const MOCK_BROADCASTS: BroadcastList[] = [
  { id: '1', name: 'All Parents', recipients: 186, lastSent: '2026-06-10' },
  { id: '2', name: 'Nursery Parents', recipients: 64, lastSent: '2026-06-09' },
  { id: '3', name: 'LKG Parents', recipients: 62, lastSent: '2026-06-08' },
  { id: '4', name: 'UKG Parents', recipients: 60, lastSent: '2026-06-05' },
  { id: '5', name: 'Fee Defaulters', recipients: 12, lastSent: '2026-06-12' },
];

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

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-6 h-6" style={{ color: theme.primary }} />
                WhatsApp Integration
              </h1>
              <p className="text-sm text-gray-500 mt-1">Manage WhatsApp messaging and broadcasts</p>
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
                  <h3 className="font-semibold text-gray-900">WhatsApp Business API</h3>
                  <p className="text-sm text-gray-500">Phone: +91 98765 43210 • Business: PreOne Preschool</p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                    <span>Messages Today: 24</span>
                    <span>Templates: {MOCK_TEMPLATES.length}</span>
                    <span>Lists: {MOCK_BROADCASTS.length}</span>
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
                  <h3 className="font-semibold text-gray-900">Message Templates</h3>
                  <Button variant="outline" size="sm"><Plus className="w-3 h-3 mr-1" /> New Template</Button>
                </div>
                <ScrollArea className="max-h-64">
                  <div className="space-y-2">
                    {MOCK_TEMPLATES.map((t) => (
                      <div key={t.id} className="p-3 rounded-xl border hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900">{t.name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px]">{t.category}</Badge>
                            <span className="text-[10px] text-gray-400">Used {t.usageCount}×</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{t.body}</p>
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
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>

          {/* Broadcast Lists */}
          <StaggerItem>
            <PreOneCard variant="default">
              <PreOneCardContent>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Broadcast Lists</h3>
                  <Button variant="outline" size="sm"><Plus className="w-3 h-3 mr-1" /> New</Button>
                </div>
                <ScrollArea className="max-h-64">
                  <div className="space-y-2">
                    {MOCK_BROADCASTS.map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                            <Users className="w-4 h-4 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{b.name}</p>
                            <p className="text-[10px] text-gray-400">{b.recipients} recipients</p>
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
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Send className="w-4 h-4 text-gray-500" /> Send Message
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
              <h3 className="font-semibold text-gray-900 mb-3">Recent Messages</h3>
              <div className="space-y-2">
                {RECENT_MESSAGES.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><MessageSquare className="w-4 h-4 text-gray-500" /></div>
                      <div>
                        <p className="text-sm font-medium">{m.to}</p>
                        <p className="text-xs text-gray-400 truncate max-w-xs">{m.message}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`${STATUS_BADGE[m.status]} text-[9px]`}>{m.status}</Badge>
                      <p className="text-[10px] text-gray-400 mt-0.5">{m.time} • {m.count} sent</p>
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
