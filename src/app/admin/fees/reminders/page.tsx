'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  WarmPremium,
  WarmCard,
  WarmCardHeader,
  WarmCardTitle,
  WarmCardDescription,
  WarmCardContent,
  WarmCardFooter,
  WarmSectionHeading,
  WarmEmptyState,
  WarmButton,
  WarmStatCard,
  WarmPill,
} from '@/components/warm-premium';
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
  AlertTriangle,
  Mail,
  MessageSquare,
  Phone,
  History,
  Loader2,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface OverduePayment {
  id: string;
  student: string;
  class: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
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
  status: string;
}

// Shapes returned by the APIs
interface ApiInvoice {
  id: string;
  amount: number;
  netAmount?: number;
  dueDate: string;
  student?: { firstName: string; lastName: string; class?: { name: string } | null } | null;
}
interface ApiReminder {
  id: string;
  invoiceId: string;
  type: string;
  channel: string;
  sentAt: string | null;
  status: string;
  invoice?: { student?: { firstName: string; lastName: string } | null } | null;
}

// Built-in reminder presets — intentional defaults (no backend template model yet).
const DEFAULT_TEMPLATES: ReminderTemplate[] = [
  { id: '1', name: 'Gentle Reminder', channel: 'WhatsApp', subject: 'Fee Reminder', body: 'Dear Parent, this is a gentle reminder that the fee for {student_name} of ₹{amount} is due. Please pay at the earliest.' },
  { id: '2', name: 'Overdue Notice', channel: 'SMS', subject: 'Fee Overdue', body: 'Fee of ₹{amount} for {student_name} is overdue by {days} days. Kindly clear the dues immediately.' },
  { id: '3', name: 'Final Warning', channel: 'Email', subject: 'Urgent: Fee Payment Required', body: 'Dear Parent, despite previous reminders, the fee of ₹{amount} for {student_name} remains unpaid for {days} days. This is the final reminder before further action.' },
  { id: '4', name: 'Payment Confirmation', channel: 'WhatsApp', subject: 'Thank You', body: 'Thank you for paying ₹{amount} for {student_name}. Your receipt will be shared shortly.' },
];

const CHANNEL_ICON: Record<string, React.ElementType> = {
  WhatsApp: MessageSquare,
  SMS: Phone,
  Email: Mail,
};

const STATUS_BADGE: Record<string, string> = {
  DELIVERED: 'bg-emerald-50 text-emerald-700',
  SENT: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  FAILED: 'bg-red-50 text-red-700',
};

export default function RemindersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ReminderTemplate | null>(null);
  const [overdue, setOverdue] = useState<OverduePayment[]>([]);
  const [history, setHistory] = useState<ReminderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [invRes, remRes] = await Promise.all([
          fetch('/api/fees/invoices?status=OVERDUE&limit=100'),
          fetch('/api/fees/reminders'),
        ]);
        if (!invRes.ok) throw new Error('Failed to load overdue invoices');
        const invData = await invRes.json();
        const remData = remRes.ok ? await remRes.json() : { reminders: [] };
        const reminders: ApiReminder[] = remData.reminders || [];

        // Count reminders already sent per invoice
        const countByInvoice: Record<string, number> = {};
        for (const r of reminders) {
          countByInvoice[r.invoiceId] = (countByInvoice[r.invoiceId] || 0) + 1;
        }

        const now = Date.now();
        const od: OverduePayment[] = (invData.invoices || []).map((inv: ApiInvoice) => ({
          id: inv.id,
          student: inv.student ? `${inv.student.firstName} ${inv.student.lastName}` : '—',
          class: inv.student?.class?.name || '—',
          amount: inv.netAmount ?? inv.amount,
          dueDate: inv.dueDate,
          daysOverdue: Math.max(0, Math.floor((now - new Date(inv.dueDate).getTime()) / 86400000)),
          remindersSent: countByInvoice[inv.id] || 0,
        }));
        setOverdue(od);

        const hist: ReminderHistory[] = reminders.map((r) => ({
          id: r.id,
          student: r.invoice?.student ? `${r.invoice.student.firstName} ${r.invoice.student.lastName}` : '—',
          template: r.type || 'Reminder',
          channel: r.channel,
          sentAt: r.sentAt
            ? new Date(r.sentAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
            : 'Pending',
          status: r.status,
        }));
        setHistory(hist);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load reminders');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredOverdue = useMemo(() => {
    if (!searchQuery) return overdue;
    return overdue.filter((o) => o.student.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [overdue, searchQuery]);

  const totalOverdue = overdue.reduce((s, o) => s + o.amount, 0);

  return (
    <WarmPremium className="min-h-screen">
    <PageTransition>
      <StaggerContainer className="space-y-6">
        {/* Header */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-heading text-[var(--admin-text)] flex items-center gap-2">
                <Bell className="w-6 h-6" style={{ color: theme.primary }} />
                Fee Reminders
              </h1>
              <p className="text-sm text-[var(--admin-text-muted)] mt-1">Send reminders for overdue payments</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md">
              <Send className="w-4 h-4 mr-2" /> Send Bulk Reminder
            </Button>
          </div>
        </StaggerItem>

        {/* Stats */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <WarmCard variant="strip" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-[var(--admin-text-muted)]">Overdue Payments</p>
                  <p className="text-lg font-bold text-red-700">{overdue.length}</p>
                </div>
              </div>
            </WarmCard>
            <WarmCard variant="strip" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-[var(--admin-text-muted)]">Total Overdue</p>
                  <p className="text-lg font-bold text-amber-700">₹{(totalOverdue / 1000).toFixed(1)}K</p>
                </div>
              </div>
            </WarmCard>
            <WarmCard variant="strip" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <History className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-[var(--admin-text-muted)]">Reminders Sent</p>
                  <p className="text-lg font-bold text-purple-700">{history.length}</p>
                </div>
              </div>
            </WarmCard>
          </div>
        </StaggerItem>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Overdue List */}
          <StaggerItem className="lg:col-span-2">
            <WarmCard variant="default">
              <WarmCardContent>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[var(--admin-text)]">Overdue Payments</h3>
                  <div className="relative w-56">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-subtle)]" />
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
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-[var(--admin-text-subtle)]">
                            <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading overdue payments…
                          </TableCell>
                        </TableRow>
                      ) : error ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-red-500 text-sm">{error}</TableCell>
                        </TableRow>
                      ) : filteredOverdue.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-10 text-[var(--admin-text-subtle)] text-sm">No overdue payments 🎉</TableCell>
                        </TableRow>
                      ) : (
                        filteredOverdue.map((o) => (
                          <TableRow key={o.id} className="hover:bg-red-50/30">
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">{o.student}</p>
                                <p className="text-xs text-[var(--admin-text-subtle)]">{o.class}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm font-medium text-red-700">₹{o.amount.toLocaleString('en-IN')}</TableCell>
                            <TableCell>
                              <Badge className={`${o.daysOverdue > 60 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'} text-[10px]`}>
                                {o.daysOverdue}d
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-[var(--admin-text-muted)]">{o.remindersSent}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline" className="h-7 text-xs">
                                <Send className="w-3 h-3 mr-1" /> Remind
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </WarmCardContent>
            </WarmCard>
          </StaggerItem>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Templates (built-in presets) */}
            <StaggerItem>
              <WarmCard variant="default">
                <WarmCardContent>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[var(--admin-text)]">Templates</h3>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      <Plus className="w-3 h-3 mr-1" /> New
                    </Button>
                  </div>
                  <ScrollArea className="max-h-48">
                    <div className="space-y-2">
                      {DEFAULT_TEMPLATES.map((t) => {
                        const Icon = CHANNEL_ICON[t.channel] || Mail;
                        return (
                          <div
                            key={t.id}
                            className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                              selectedTemplate?.id === t.id ? 'border-purple-400 bg-purple-50/50' : 'hover:bg-[var(--warm-surface-2)]'
                            }`}
                            onClick={() => setSelectedTemplate(t)}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{t.name}</span>
                              <div className="flex items-center gap-1 text-xs text-[var(--admin-text-subtle)]">
                                <Icon className="w-3 h-3" /> {t.channel}
                              </div>
                            </div>
                            <p className="text-xs text-[var(--admin-text-muted)] mt-1 line-clamp-2">{t.body}</p>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </WarmCardContent>
              </WarmCard>
            </StaggerItem>

            {/* Reminder History */}
            <StaggerItem>
              <WarmCard variant="default">
                <WarmCardContent>
                  <h3 className="font-semibold text-[var(--admin-text)] mb-3">Recent History</h3>
                  <ScrollArea className="max-h-48">
                    {loading ? (
                      <p className="text-xs text-[var(--admin-text-subtle)] py-6 text-center">
                        <Loader2 className="w-4 h-4 animate-spin inline mr-1.5" /> Loading…
                      </p>
                    ) : history.length === 0 ? (
                      <p className="text-xs text-[var(--admin-text-subtle)] py-6 text-center">No reminders sent yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {history.map((h) => {
                          const Icon = CHANNEL_ICON[h.channel] || Mail;
                          return (
                            <div key={h.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-[var(--warm-surface-2)]">
                              <div className="w-7 h-7 rounded-full bg-[var(--warm-surface-2)] flex items-center justify-center shrink-0">
                                <Icon className="w-3.5 h-3.5 text-[var(--admin-text-muted)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[var(--admin-text)]">{h.student}</p>
                                <p className="text-[10px] text-[var(--admin-text-subtle)]">{h.template} • {h.sentAt}</p>
                              </div>
                              <Badge className={`${STATUS_BADGE[h.status] || 'bg-[var(--warm-surface-2)] text-[var(--admin-text-muted)]'} text-[9px]`}>{h.status}</Badge>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                </WarmCardContent>
              </WarmCard>
            </StaggerItem>
          </div>
        </div>
      </StaggerContainer>
    </PageTransition>
    </WarmPremium>
  );
}

function IndianRupee(props: React.SVGProps<SVGSVGElement> & { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="2" x2="12" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
