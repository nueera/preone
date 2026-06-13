'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  CheckCheck,
  Check,
  MessageCircle,
  FileText,
} from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PORTAL_THEMES } from '@/lib/theme-tokens';

const theme = PORTAL_THEMES.admin;

// ── Types ──
interface Message {
  id: string;
  date: string;
  time: string;
  type: 'WhatsApp' | 'Email' | 'SMS' | 'In-App';
  direction: 'outgoing' | 'incoming';
  subject: string;
  body: string;
  status: 'Read' | 'Delivered' | 'Sent' | 'Failed';
  sender: string;
}

// ── Placeholder data ──
const PLACEHOLDER_MESSAGES: Message[] = [
  { id: 'm1', date: '10 Jun 2026', time: '10:30 AM', type: 'WhatsApp', direction: 'outgoing', subject: 'Fee Reminder — Q3', body: 'Dear Mr. Kumar, this is a reminder that the Q3 fee of ₹18,750 is due by 15th June 2026. Please make the payment at the earliest.', status: 'Read', sender: 'Admin' },
  { id: 'm2', date: '08 Jun 2026', time: '2:15 PM', type: 'In-App', direction: 'incoming', subject: 'Leave Request for Aarav', body: 'Hi, Aarav will be on leave on 12th June due to a family function. Please approve.', status: 'Read', sender: 'Rajesh Kumar' },
  { id: 'm3', date: '05 Jun 2026', time: '9:00 AM', type: 'Email', direction: 'outgoing', subject: 'Monthly Newsletter — June 2026', body: 'Dear Parents, please find attached the monthly newsletter for June 2026 with updates on upcoming events and activities.', status: 'Read', sender: 'Admin' },
  { id: 'm4', date: '01 Jun 2026', time: '11:00 AM', type: 'WhatsApp', direction: 'outgoing', subject: 'Holiday Notice — Eid ul-Adha', body: 'Dear Parents, the school will remain closed on 7th June on account of Eid ul-Adha. Regular classes resume on 8th June.', status: 'Delivered', sender: 'Admin' },
  { id: 'm5', date: '28 May 2026', time: '3:45 PM', type: 'SMS', direction: 'outgoing', subject: 'PTM Reminder', body: 'Reminder: Parent-Teacher Meeting scheduled for 30th May 2026, 10:00 AM to 1:00 PM.', status: 'Read', sender: 'Admin' },
  { id: 'm6', date: '25 May 2026', time: '10:20 AM', type: 'In-App', direction: 'incoming', subject: 'Query about summer camp', body: 'Hi, I wanted to know more about the summer camp program. Could you share the details and fees?', status: 'Read', sender: 'Rajesh Kumar' },
];

const STATUS_ICON: Record<string, React.ReactNode> = {
  Read: <CheckCheck className="h-3.5 w-3.5 text-sky-500" />,
  Delivered: <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />,
  Sent: <Check className="h-3.5 w-3.5 text-muted-foreground" />,
  Failed: <span className="text-xs text-red-500">!</span>,
};

const TYPE_COLORS: Record<string, string> = {
  WhatsApp: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Email: 'bg-sky-50 text-sky-700 border-sky-200',
  SMS: 'bg-violet-50 text-violet-700 border-violet-200',
  'In-App': 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function ParentCommunicationPage() {
  const params = useParams();
  const router = useRouter();
  const parentId = params.id as string;

  const [messages] = useState<Message[]>(PLACEHOLDER_MESSAGES);
  const [loading] = useState(false);
  const [composeType, setComposeType] = useState('WhatsApp');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  const parentName = 'Rajesh Kumar';

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* ── Back Button ── */}
        <Button
          variant="ghost"
          className="gap-1 text-muted-foreground"
          onClick={() => router.push(`/admin/parents/${parentId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {parentName}
        </Button>

        {/* ── Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Communication Log
            </h1>
            <p className="text-sm text-muted-foreground">
              Messages with {parentName}
            </p>
          </div>
        </div>

        {/* ── Communication Preferences ── */}
        <PreOneCard variant="default">
          <PreOneCardContent>
            <h3 className="text-sm font-semibold mb-3">Communication Preferences</h3>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 text-sm">
                <MessageCircle className="h-4 w-4 text-emerald-500" />
                <span>WhatsApp: <span className="font-medium">9876543210</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-sky-500" />
                <span>Email: <span className="font-medium">rajesh.kumar@email.com</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-violet-500" />
                <span>SMS: <span className="font-medium">9876543210</span></span>
              </div>
            </div>
          </PreOneCardContent>
        </PreOneCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Message History ── */}
          <div className="lg:col-span-2 space-y-4">
            <PreOneCard variant="default">
              <PreOneCardContent>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-portal-500" />
                  Message History
                </h3>
                {loading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/30" />
                    <p className="text-muted-foreground">No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`rounded-lg border p-4 transition-colors hover:bg-muted/30 ${
                          msg.direction === 'incoming' ? 'border-l-4 border-l-violet-400' : 'border-l-4 border-l-sky-400'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${TYPE_COLORS[msg.type]}`}>
                              {msg.type}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {msg.direction === 'incoming' ? `From: ${msg.sender}` : `To: ${parentName}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {STATUS_ICON[msg.status]}
                            <span className="text-xs text-muted-foreground">{msg.date} · {msg.time}</span>
                          </div>
                        </div>
                        <p className="text-sm font-medium">{msg.subject}</p>
                        <p className="text-sm text-muted-foreground mt-1">{msg.body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </PreOneCardContent>
            </PreOneCard>
          </div>

          {/* ── Compose Message ── */}
          <div className="space-y-4">
            <PreOneCard variant="default">
              <PreOneCardContent>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Send className="h-5 w-5 text-portal-500" />
                  Compose Message
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Channel</label>
                    <Select value={composeType} onValueChange={setComposeType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="SMS">SMS</SelectItem>
                        <SelectItem value="In-App">In-App</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Subject</label>
                    <Input
                      placeholder="Enter subject..."
                      value={composeSubject}
                      onChange={(e) => setComposeSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Message</label>
                    <Textarea
                      placeholder="Type your message..."
                      rows={5}
                      value={composeBody}
                      onChange={(e) => setComposeBody(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
                    disabled={!composeSubject || !composeBody}
                  >
                    <Send className="h-4 w-4" />
                    Send via {composeType}
                  </Button>
                </div>
              </PreOneCardContent>
            </PreOneCard>

            {/* ── Quick Stats ── */}
            <PreOneCard variant="default">
              <PreOneCardContent>
                <h3 className="text-sm font-semibold mb-3">Communication Stats</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Messages</span>
                    <span className="font-medium">{messages.length}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">WhatsApp</span>
                    <span className="font-medium">{messages.filter((m) => m.type === 'WhatsApp').length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{messages.filter((m) => m.type === 'Email').length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">SMS</span>
                    <span className="font-medium">{messages.filter((m) => m.type === 'SMS').length}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Contact</span>
                    <span className="font-medium text-xs">10 Jun 2026</span>
                  </div>
                </div>
              </PreOneCardContent>
            </PreOneCard>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
