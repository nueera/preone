'use client';

import React, { useState, useMemo } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PORTAL_THEMES, FEE_COLORS } from '@/lib/theme-tokens';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Bell,
  Send,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Mail,
  MessageSquare,
  Phone,
  History,
  FileText,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface OverduePayment {
  id: string;
  student: string;
  class: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  parentContact: string;
  remindersSent: number;
}

interface ReminderTemplate {
  id: string;
  name: string;
  channel: 'SMS' | 'WhatsApp' | 'Email';
  subject: string;
  body: string;
}

interface ReminderHistory {
  id: string;
  student: string;
  template: string;
  channel: string;
  sentAt: string;
  status: 'DELIVERED' | 'FAILED' | 'PENDING';
}

const MOCK_OVERDUE: OverduePayment[] = [
  { id: '1', student: 'Isha Sharma', class: 'Nursery-B', amount: 15000, dueDate: '2026-03-01', daysOverdue: 104, parentContact: '+91 98765 43210', remindersSent: 3 },
  { id: '2', student: 'Meera Joshi', class: 'LKG-B', amount: 22500, dueDate: '2026-02-28', daysOverdue: 105, parentContact: '+91 87654 32109', remindersSent: 2 },
  { id: '3', student: 'Karan Verma', class: 'UKG-A', amount: 18000, dueDate: '2026-04-15', daysOverdue: 59, parentContact: '+91 76543 21098', remindersSent: 1 },
  { id: '4', student: 'Sneha Das', class: 'Nursery-A', amount: 16000, dueDate: '2026-05-01', daysOverdue: 43, parentContact: '+91 65432 10987', remindersSent: 1 },
  { id: '5', student: 'Arjun Nair', class: 'LKG-A', amount: 20000, dueDate: '2026-05-10', daysOverdue: 34, parentContact: '+91 54321 09876', remindersSent: 0 },
];

const MOCK_TEMPLATES: ReminderTemplate[] = [
  { id: '1', name: 'Gentle Reminder', channel: 'WhatsApp', subject: 'Fee Reminder', body: 'Dear Parent, this is a gentle reminder that the fee for {student_name} of ₹{amount} is due. Please pay at the earliest.' },
  { id: '2', name: 'Overdue Notice', channel: 'SMS', subject: 'Fee Overdue', body: 'Fee of ₹{amount} for {student_name} is overdue by {days} days. Kindly clear the dues immediately.' },
  { id: '3', name: 'Final Warning', channel: 'Email', subject: 'Urgent: Fee Payment Required', body: 'Dear Parent, despite previous reminders, the fee of ₹{amount} for {student_name} remains unpaid for {days} days. This is the final reminder before further action.' },
  { id: '4', name: 'Payment Confirmation', channel: 'WhatsApp', subject: 'Thank You', body: 'Thank you for paying ₹{amount} for {student_name}. Your receipt will be shared shortly.' },
];

const MOCK_HISTORY: ReminderHistory[] = [
  { id: '1', student: 'Isha Sharma', template: 'Gentle Reminder', channel: 'WhatsApp', sentAt: '2026-06-10 09:00', status: 'DELIVERED' },
  { id: '2', student: 'Meera Joshi', template: 'Overdue Notice', channel: 'SMS', sentAt: '2026-06-09 14:30', status: 'DELIVERED' },
  { id: '3', student: 'Karan Verma', template: 'Gentle Reminder', channel: 'WhatsApp', sentAt: '2026-06-08 10:00', status: 'PENDING' },
  { id: '4', student: 'Isha Sharma', template: 'Final Warning', channel: 'Email', sentAt: '2026-06-07 08:00', status: 'FAILED' },
  { id: '5', student: 'Sneha Das', template: 'Gentle Reminder', channel: 'WhatsApp', sentAt: '2026-06-05 11:00', status: 'DELIVERED' },
];

const CHANNEL_ICON: Record<string, React.ElementType> = {
  WhatsApp: MessageSquare,
  SMS: Phone,
  Email: Mail,
};

const STATUS_BADGE: Record<string, string> = {
  DELIVERED: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  FAILED: 'bg-red-50 text-red-700',
};

export default function RemindersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ReminderTemplate | null>(null);

  const filteredOverdue = useMemo(() => {
    if (!searchQuery) return MOCK_OVERDUE;
    return MOCK_OVERDUE.filter((o) => o.student.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const totalOverdue = MOCK_OVERDUE.reduce((s, o) => s + o.amount, 0);

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        {/* Header */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="w-6 h-6" style={{ color: theme.primary }} />
                Fee Reminders
              </h1>
              <p className="text-sm text-gray-500 mt-1">Send reminders for overdue payments</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md">
              <Send className="w-4 h-4 mr-2" /> Send Bulk Reminder
            </Button>
          </div>
        </StaggerItem>

        {/* Stats */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Overdue Payments</p>
                  <p className="text-lg font-bold text-red-700">{MOCK_OVERDUE.length}</p>
                </div>
              </div>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Overdue</p>
                  <p className="text-lg font-bold text-amber-700">₹{(totalOverdue / 1000).toFixed(1)}K</p>
                </div>
              </div>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <History className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Reminders Sent</p>
                  <p className="text-lg font-bold text-purple-700">{MOCK_HISTORY.length}</p>
                </div>
              </div>
            </PreOneCard>
          </div>
        </StaggerItem>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overdue List */}
          <StaggerItem className="lg:col-span-2">
            <PreOneCard variant="default">
              <PreOneCardContent>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Overdue Payments</h3>
                  <div className="relative w-56">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search student..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="overflow-hidden -mx-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Days Overdue</TableHead>
                        <TableHead>Reminders</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOverdue.map((o) => (
                        <TableRow key={o.id} className="hover:bg-red-50/30">
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{o.student}</p>
                              <p className="text-xs text-gray-400">{o.class}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium text-red-700">₹{o.amount.toLocaleString('en-IN')}</TableCell>
                          <TableCell>
                            <Badge className={`${o.daysOverdue > 60 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'} text-[10px]`}>
                              {o.daysOverdue}d
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">{o.remindersSent}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" className="h-7 text-xs">
                              <Send className="w-3 h-3 mr-1" /> Remind
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Templates */}
            <StaggerItem>
              <PreOneCard variant="default">
                <PreOneCardContent>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Templates</h3>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      <Plus className="w-3 h-3 mr-1" /> New
                    </Button>
                  </div>
                  <ScrollArea className="max-h-48">
                    <div className="space-y-2">
                      {MOCK_TEMPLATES.map((t) => {
                        const Icon = CHANNEL_ICON[t.channel] || Mail;
                        return (
                          <div
                            key={t.id}
                            className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                              selectedTemplate?.id === t.id ? 'border-purple-400 bg-purple-50/50' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedTemplate(t)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{t.name}</span>
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Icon className="w-3 h-3" /> {t.channel}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.body}</p>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </PreOneCardContent>
              </PreOneCard>
            </StaggerItem>

            {/* Reminder History */}
            <StaggerItem>
              <PreOneCard variant="default">
                <PreOneCardContent>
                  <h3 className="font-semibold text-gray-900 mb-3">Recent History</h3>
                  <ScrollArea className="max-h-48">
                    <div className="space-y-2">
                      {MOCK_HISTORY.map((h) => {
                        const Icon = CHANNEL_ICON[h.channel] || Mail;
                        return (
                          <div key={h.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                              <Icon className="w-3.5 h-3.5 text-gray-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900">{h.student}</p>
                              <p className="text-[10px] text-gray-400">{h.template} • {h.sentAt}</p>
                            </div>
                            <Badge className={`${STATUS_BADGE[h.status]} text-[9px]`}>{h.status}</Badge>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </PreOneCardContent>
              </PreOneCard>
            </StaggerItem>
          </div>
        </div>
      </StaggerContainer>
    </PageTransition>
  );
}

function IndianRupee(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="2" x2="12" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
