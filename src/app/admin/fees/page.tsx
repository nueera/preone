'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  IndianRupee,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  CreditCard,
  Bell,
  FileText,
  Download,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CalendarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { PORTAL_THEMES, FEE_COLORS, CHART_PALETTE } from '@/lib/theme-tokens';
const theme = PORTAL_THEMES.admin;

// ── Types ──
interface FeeStructure {
  id: string;
  name: string;
  type: string;
  amount: number;
  frequency: string;
  classId: string | null;
  description: string | null;
  isActive: boolean;
  _count: { invoices: number };
}

interface InvoiceInfo {
  id: string;
  invoiceNo: string;
  studentId: string;
  feeStructureId: string | null;
  amount: number;
  discount: number;
  netAmount: number;
  status: string;
  dueDate: string;
  paidDate: string | null;
  description: string | null;
  createdAt: string;
  student: { id: string; firstName: string; lastName: string; rollNumber: string | null };
  feeStructure: { id: string; name: string; type: string; frequency: string } | null;
  payments: { id: string; amount: number; method: string; paymentDate: string; transactionRef: string | null }[];
}

interface ProgramGroup {
  id: string;
  name: string;
  classes: { id: string; name: string; _count: { students: number } }[];
}

interface StudentOption {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string | null;
  class: { name: string } | null;
}

const INVOICE_STATUS_COLORS: Record<string, string> = {
  PENDING: `${FEE_COLORS.PENDING.bg} ${FEE_COLORS.PENDING.text} border-amber-200`,
  PARTIAL: `${FEE_COLORS.PARTIAL.bg} ${FEE_COLORS.PARTIAL.text} border-yellow-200`,
  PAID: `${FEE_COLORS.PAID.bg} ${FEE_COLORS.PAID.text} border-emerald-200`,
  OVERDUE: `${FEE_COLORS.OVERDUE.bg} ${FEE_COLORS.OVERDUE.text} border-red-200`,
  CANCELLED: 'bg-gray-50 text-gray-600 border-gray-200',
};

const FEE_TYPE_LABELS: Record<string, string> = {
  TUITION: 'Tuition',
  TRANSPORT: 'Transport',
  ACTIVITY: 'Activity',
  EXAM: 'Exam',
  LABORATORY: 'Laboratory',
  LIBRARY: 'Library',
  DEVELOPMENT: 'Development',
  OTHER: 'Other',
};

const FREQ_LABELS: Record<string, string> = {
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  HALF_YEARLY: 'Half-Yearly',
  ANNUAL: 'Annual',
  ONE_TIME: 'One-Time',
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

export default function FeesPage() {
  // ── State ──
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    totalInvoiced: 0, totalCollected: 0, totalPending: 0, collectionRate: 0, totalInvoices: 0,
    statusBreakdown: {} as Record<string, { count: number; amount: number; collected: number }>,
  });
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [invoices, setInvoices] = useState<InvoiceInfo[]>([]);
  const [invoiceTotal, setInvoiceTotal] = useState(0);
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoiceStatus, setInvoiceStatus] = useState('');
  const [programs, setPrograms] = useState<ProgramGroup[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);

  // Dialogs
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [addStructureDialogOpen, setAddStructureDialogOpen] = useState(false);

  // Generate invoice form
  const [generateMode, setGenerateMode] = useState<'single' | 'bulk'>('single');
  const [generateForm, setGenerateForm] = useState({
    studentId: '',
    feeStructureId: '',
    amount: 0,
    discount: 0,
    dueDate: null as Date | null,
    description: '',
    targetClassId: '',
    searchStudent: '',
  });

  // Payment form
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceInfo | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: 'CASH',
    transactionRef: '',
    chequeNo: '',
    bankName: '',
    paymentDate: new Date(),
    notes: '',
  });

  // Reminder form
  const [reminderForm, setReminderForm] = useState({
    channel: 'SMS',
    target: 'OVERDUE',
  });

  // Refund form
  const [refundForm, setRefundForm] = useState({
    invoiceId: '',
    amount: 0,
    reason: 'WITHDRAWAL',
    method: 'Original',
    bankAccount: '',
    bankIfsc: '',
    notes: '',
  });

  // Add structure form
  const [structureForm, setStructureForm] = useState({
    name: '', type: 'TUITION', amount: 0, frequency: 'MONTHLY', classId: '', description: '',
  });

  const limit = 15;

  // ── Fetch data ──
  const fetchOverview = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/fees/overview', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setOverview(await res.json());
    } catch (err) { console.error('Overview error:', err); }
  }, []);

  const fetchStructures = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/fees/structures', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setFeeStructures(data.feeStructures || []);
      }
    } catch (err) { console.error('Structures error:', err); }
  }, []);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams({ page: invoicePage.toString(), limit: limit.toString() });
      if (invoiceStatus) params.set('status', invoiceStatus);
      const res = await fetch(`/api/fees/invoices?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
        setInvoiceTotal(data.pagination?.total || 0);
      }
    } catch (err) { console.error('Invoices error:', err); }
    finally { setLoading(false); }
  }, [invoicePage, invoiceStatus]);

  const fetchClasses = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/classes', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setPrograms((await res.json()).programs || []);
    } catch (err) { console.error('Classes error:', err); }
  }, []);

  useEffect(() => { fetchOverview(); fetchStructures(); fetchInvoices(); fetchClasses(); }, [fetchOverview, fetchStructures, fetchInvoices, fetchClasses]);

  // ── Search students for generate dialog ──
  const searchStudents = async (query: string) => {
    if (query.length < 2) { setStudents([]); return; }
    try {
      const token = getToken();
      const res = await fetch(`/api/students?search=${query}&limit=20&status=ACTIVE`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStudents((data.students || []).map((s: StudentOption) => ({
          id: s.id, firstName: s.firstName, lastName: s.lastName,
          rollNumber: s.rollNumber, class: s.class,
        })));
      }
    } catch (err) { console.error('Search students error:', err); }
  };

  // ── Handlers ──
  const handleGenerateInvoice = async () => {
    try {
      const token = getToken();
      let studentIds: string[] = [];

      if (generateMode === 'single') {
        if (!generateForm.studentId) { alert('Select a student'); return; }
        studentIds = [generateForm.studentId];
      } else {
        if (!generateForm.targetClassId) { alert('Select a class'); return; }
        // Get all students in class
        const res = await fetch(`/api/students?classId=${generateForm.targetClassId}&limit=100&status=ACTIVE`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          studentIds = (data.students || []).map((s: StudentOption) => s.id);
        }
      }

      const res = await fetch('/api/fees/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          studentIds,
          feeStructureId: generateForm.feeStructureId || undefined,
          amount: generateForm.amount || undefined,
          dueDate: generateForm.dueDate?.toISOString(),
          discount: generateForm.discount || 0,
          description: generateForm.description || undefined,
        }),
      });

      if (res.ok) {
        setGenerateDialogOpen(false);
        fetchInvoices();
        fetchOverview();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to generate invoices');
      }
    } catch (err) { console.error('Generate invoice error:', err); }
  };

  const handleCollectPayment = async () => {
    if (!selectedInvoice) return;
    try {
      const token = getToken();
      const res = await fetch('/api/fees/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          amount: paymentForm.amount,
          method: paymentForm.method,
          transactionRef: paymentForm.transactionRef || undefined,
          chequeNo: paymentForm.chequeNo || undefined,
          bankName: paymentForm.bankName || undefined,
          paymentDate: paymentForm.paymentDate.toISOString(),
          notes: paymentForm.notes || undefined,
        }),
      });

      if (res.ok) {
        setPaymentDialogOpen(false);
        fetchInvoices();
        fetchOverview();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to record payment');
      }
    } catch (err) { console.error('Payment error:', err); }
  };

  const handleSendReminders = async () => {
    try {
      const token = getToken();
      // Get overdue invoice IDs
      const res = await fetch('/api/fees/invoices?status=OVERDUE&limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const invoiceIds = (data.invoices || []).map((i: InvoiceInfo) => i.id);
        if (invoiceIds.length === 0) { alert('No overdue invoices found'); return; }

        await fetch('/api/fees/reminders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ invoiceIds, channel: reminderForm.channel }),
        });
        setReminderDialogOpen(false);
        alert(`Reminders sent for ${invoiceIds.length} invoices`);
      }
    } catch (err) { console.error('Reminders error:', err); }
  };

  const handleRefund = async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/fees/refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(refundForm),
      });
      if (res.ok) {
        setRefundDialogOpen(false);
        fetchInvoices();
        fetchOverview();
      } else {
        const data = await res.json();
        alert(data.error || 'Refund failed');
      }
    } catch (err) { console.error('Refund error:', err); }
  };

  const handleAddStructure = async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/fees/structures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(structureForm),
      });
      if (res.ok) {
        setAddStructureDialogOpen(false);
        fetchStructures();
      }
    } catch (err) { console.error('Add structure error:', err); }
  };

  const openPaymentDialog = (invoice: InvoiceInfo) => {
    setSelectedInvoice(invoice);
    const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0);
    setPaymentForm({
      amount: invoice.netAmount - totalPaid,
      method: 'CASH',
      transactionRef: '',
      chequeNo: '',
      bankName: '',
      paymentDate: new Date(),
      notes: '',
    });
    setPaymentDialogOpen(true);
  };

  // ── Pie chart data ──
  const pieData = [
    { name: 'Collected', value: overview.totalCollected, color: FEE_COLORS.PAID.hex },
    { name: 'Pending', value: overview.totalPending - (overview.statusBreakdown?.OVERDUE?.amount || 0), color: FEE_COLORS.PENDING.hex },
    { name: 'Overdue', value: overview.statusBreakdown?.OVERDUE?.amount || 0, color: FEE_COLORS.OVERDUE.hex },
  ].filter(d => d.value > 0);

  const totalPages = Math.ceil(invoiceTotal / limit);

  return (
    <div className="space-y-6">
      {/* ── Top Bar ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Fees</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={() => setReminderDialogOpen(true)}>
            <Bell className="h-4 w-4" /> Reminders
          </Button>
          <Button
            className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
            onClick={() => setGenerateDialogOpen(true)}
          >
            <Plus className="h-4 w-4" /> Generate Invoice
          </Button>
        </div>
      </div>

      {/* ═══════════ Stat Cards ═══════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Invoiced</p>
            <p className="text-2xl font-bold text-sky-700">₹{overview.totalInvoiced.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Collected</p>
            <p className="text-2xl font-bold text-emerald-600">₹{overview.totalCollected.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Pending</p>
            <p className="text-2xl font-bold text-amber-600">₹{overview.totalPending.toLocaleString('en-IN')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Collection Rate</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-portal-700">{overview.collectionRate}%</p>
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════ Pie Chart ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fee Collection</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={2}>
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-bold">₹{overview.totalInvoiced.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-12">No fee data</p>
            )}
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-1 text-xs">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ═══════════ Fee Structures ═══════════ */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Fee Structures</CardTitle>
            <Button size="sm" className="gap-1" onClick={() => setAddStructureDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Structure
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Invoices</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeStructures.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No fee structures
                      </TableCell>
                    </TableRow>
                  ) : (
                    feeStructures.map((fs) => (
                      <TableRow key={fs.id}>
                        <TableCell className="font-medium">{fs.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {FEE_TYPE_LABELS[fs.type] || fs.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">₹{fs.amount.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {FREQ_LABELS[fs.frequency] || fs.frequency}
                        </TableCell>
                        <TableCell className="text-sm">{fs._count.invoices}</TableCell>
                        <TableCell>
                          <Badge variant={fs.isActive ? 'default' : 'secondary'} className="text-xs">
                            {fs.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════ Invoices Section ═══════════ */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Invoices</CardTitle>
          <div className="flex items-center gap-3">
            <Select value={invoiceStatus} onValueChange={(v) => { setInvoiceStatus(v === 'ALL' ? '' : v); setInvoicePage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Net Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium text-xs">{inv.invoiceNo}</TableCell>
                      <TableCell>
                        <div className="text-sm">{inv.student.firstName} {inv.student.lastName}</div>
                        {inv.student.rollNumber && <div className="text-xs text-muted-foreground">#{inv.student.rollNumber}</div>}
                      </TableCell>
                      <TableCell>
                        {inv.feeStructure ? (
                          <Badge variant="secondary" className="text-xs">{inv.feeStructure.name}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>₹{inv.amount.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {inv.discount > 0 ? `₹${inv.discount.toLocaleString('en-IN')}` : '—'}
                      </TableCell>
                      <TableCell className="font-medium">₹{inv.netAmount.toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${INVOICE_STATUS_COLORS[inv.status] || ''}`}>
                          {inv.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">{format(new Date(inv.dueDate), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>
                            {(inv.status === 'PENDING' || inv.status === 'PARTIAL' || inv.status === 'OVERDUE') && (
                              <DropdownMenuItem onClick={() => openPaymentDialog(inv)}>
                                <CreditCard className="mr-2 h-4 w-4" /> Collect Payment
                              </DropdownMenuItem>
                            )}
                            {(inv.status === 'PENDING' || inv.status === 'OVERDUE') && (
                              <DropdownMenuItem>
                                <Bell className="mr-2 h-4 w-4" /> Send Reminder
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" /> Download Receipt
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => {
                                setRefundForm((p) => ({ ...p, invoiceId: inv.id, amount: inv.netAmount }));
                                setRefundDialogOpen(true);
                              }}
                            >
                              <AlertCircle className="mr-2 h-4 w-4" /> Refund
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && invoiceTotal > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-3 mt-2">
              <p className="text-sm text-muted-foreground">
                Showing {((invoicePage - 1) * limit) + 1}–{Math.min(invoicePage * limit, invoiceTotal)} of {invoiceTotal}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={invoicePage <= 1} onClick={() => setInvoicePage(invoicePage - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">{invoicePage} / {totalPages || 1}</span>
                <Button variant="outline" size="sm" disabled={invoicePage >= totalPages} onClick={() => setInvoicePage(invoicePage + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════ Generate Invoice Dialog ═══════════ */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setGenerateMode('single')}
                className={cn('rounded-lg px-4 py-2 text-sm font-medium border transition-colors',
                  generateMode === 'single' ? 'bg-portal-50 text-portal-700 border-portal-200' : 'bg-white text-gray-500 border-gray-200')}
              >
                Single Invoice
              </button>
              <button
                onClick={() => setGenerateMode('bulk')}
                className={cn('rounded-lg px-4 py-2 text-sm font-medium border transition-colors',
                  generateMode === 'bulk' ? 'bg-portal-50 text-portal-700 border-portal-200' : 'bg-white text-gray-500 border-gray-200')}
              >
                Bulk Invoice
              </button>
            </div>

            {generateMode === 'single' ? (
              <div className="space-y-4">
                {/* Student search */}
                <div>
                  <Label>Student *</Label>
                  <Input
                    placeholder="Search student by name..."
                    value={generateForm.searchStudent}
                    onChange={(e) => {
                      setGenerateForm((p) => ({ ...p, searchStudent: e.target.value }));
                      searchStudents(e.target.value);
                    }}
                  />
                  {students.length > 0 && generateForm.searchStudent && (
                    <div className="border rounded-lg mt-1 max-h-40 overflow-y-auto">
                      {students.slice(0, 8).map((s) => (
                        <button
                          key={s.id}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-portal-50 flex items-center justify-between"
                          onClick={() => {
                            setGenerateForm((p) => ({ ...p, studentId: s.id, searchStudent: `${s.firstName} ${s.lastName}` }));
                            setStudents([]);
                          }}
                        >
                          <span>{s.firstName} {s.lastName}</span>
                          {s.class && <Badge variant="secondary" className="text-xs">{s.class.name}</Badge>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <Label>Class *</Label>
                <Select value={generateForm.targetClassId} onValueChange={(v) => setGenerateForm((p) => ({ ...p, targetClassId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {programs.map((program) => (
                      <SelectGroup key={program.id}>
                        <SelectLabel>{program.name}</SelectLabel>
                        {program.classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>{cls.name} ({cls._count.students} students)</SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fee Structure</Label>
                <Select value={generateForm.feeStructureId} onValueChange={(v) => {
                  const fs = feeStructures.find(f => f.id === v);
                  setGenerateForm((p) => ({ ...p, feeStructureId: v, amount: fs?.amount || p.amount }));
                }}>
                  <SelectTrigger><SelectValue placeholder="Select fee structure" /></SelectTrigger>
                  <SelectContent>
                    {feeStructures.map((fs) => (
                      <SelectItem key={fs.id} value={fs.id}>{fs.name} — ₹{fs.amount.toLocaleString('en-IN')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  value={generateForm.amount || ''}
                  onChange={(e) => setGenerateForm((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount (₹)</Label>
                <Input
                  type="number"
                  value={generateForm.discount || ''}
                  onChange={(e) => setGenerateForm((p) => ({ ...p, discount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Due Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !generateForm.dueDate && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {generateForm.dueDate ? format(generateForm.dueDate, 'dd MMM yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={generateForm.dueDate || undefined} onSelect={(d) => setGenerateForm((p) => ({ ...p, dueDate: d ?? null }))} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={generateForm.description}
                onChange={(e) => setGenerateForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Fee description..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
            <Button className="bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover" onClick={handleGenerateInvoice}>
              Generate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════ Collect Payment Dialog ═══════════ */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Collect Payment</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-3 space-y-1">
                <p className="text-sm font-medium">{selectedInvoice.student.firstName} {selectedInvoice.student.lastName}</p>
                <p className="text-xs text-muted-foreground">Invoice: {selectedInvoice.invoiceNo}</p>
                <p className="text-xs text-muted-foreground">
                  Amount Due: ₹{(selectedInvoice.netAmount - selectedInvoice.payments.reduce((s, p) => s + p.amount, 0)).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <Label>Amount Paying (₹) *</Label>
                <Input
                  type="number"
                  value={paymentForm.amount || ''}
                  onChange={(e) => setPaymentForm((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Payment Method *</Label>
                <Select value={paymentForm.method} onValueChange={(v) => setPaymentForm((p) => ({ ...p, method: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="ONLINE">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(paymentForm.method === 'UPI' || paymentForm.method === 'BANK_TRANSFER' || paymentForm.method === 'ONLINE') && (
                <div>
                  <Label>Transaction Ref</Label>
                  <Input value={paymentForm.transactionRef} onChange={(e) => setPaymentForm((p) => ({ ...p, transactionRef: e.target.value }))} />
                </div>
              )}
              {paymentForm.method === 'CHEQUE' && (
                <>
                  <div>
                    <Label>Cheque No</Label>
                    <Input value={paymentForm.chequeNo} onChange={(e) => setPaymentForm((p) => ({ ...p, chequeNo: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Bank Name</Label>
                    <Input value={paymentForm.bankName} onChange={(e) => setPaymentForm((p) => ({ ...p, bankName: e.target.value }))} />
                  </div>
                </>
              )}
              <div>
                <Label>Payment Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(paymentForm.paymentDate, 'dd MMM yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={paymentForm.paymentDate} onSelect={(d) => d && setPaymentForm((p) => ({ ...p, paymentDate: d }))} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={paymentForm.notes} onChange={(e) => setPaymentForm((p) => ({ ...p, notes: e.target.value }))} rows={2} />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button className="bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover" onClick={handleCollectPayment}>
              Record Payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════ Fee Reminders Dialog ═══════════ */}
      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Fee Reminders</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Target</Label>
              <Select value={reminderForm.target} onValueChange={(v) => setReminderForm((p) => ({ ...p, target: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OVERDUE">All Overdue</SelectItem>
                  <SelectItem value="PENDING">All Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Channel</Label>
              <Select value={reminderForm.channel} onValueChange={(v) => setReminderForm((p) => ({ ...p, channel: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="All">All Channels</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setReminderDialogOpen(false)}>Cancel</Button>
            <Button className="bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover" onClick={handleSendReminders}>
              Send Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════ Refund Dialog ═══════════ */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Refund Amount (₹) *</Label>
              <Input
                type="number"
                value={refundForm.amount || ''}
                onChange={(e) => setRefundForm((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label>Reason *</Label>
              <Select value={refundForm.reason} onValueChange={(v) => setRefundForm((p) => ({ ...p, reason: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                  <SelectItem value="DUPLICATE">Duplicate</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Refund Method *</Label>
              <Select value={refundForm.method} onValueChange={(v) => setRefundForm((p) => ({ ...p, method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Original">Original Method</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {refundForm.method === 'Bank Transfer' && (
              <>
                <div>
                  <Label>Bank Account</Label>
                  <Input value={refundForm.bankAccount} onChange={(e) => setRefundForm((p) => ({ ...p, bankAccount: e.target.value }))} />
                </div>
                <div>
                  <Label>IFSC Code</Label>
                  <Input value={refundForm.bankIfsc} onChange={(e) => setRefundForm((p) => ({ ...p, bankIfsc: e.target.value }))} />
                </div>
              </>
            )}
            <div>
              <Label>Notes</Label>
              <Textarea value={refundForm.notes} onChange={(e) => setRefundForm((p) => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>Cancel</Button>
            <Button className="bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover" onClick={handleRefund}>
              Process Refund
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══════════ Add Fee Structure Dialog ═══════════ */}
      <Dialog open={addStructureDialogOpen} onOpenChange={setAddStructureDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Fee Structure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input value={structureForm.name} onChange={(e) => setStructureForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g., Tuition Fee" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type *</Label>
                <Select value={structureForm.type} onValueChange={(v) => setStructureForm((p) => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FEE_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Frequency *</Label>
                <Select value={structureForm.frequency} onValueChange={(v) => setStructureForm((p) => ({ ...p, frequency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FREQ_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount (₹) *</Label>
                <Input type="number" value={structureForm.amount || ''} onChange={(e) => setStructureForm((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Class</Label>
                <Select value={structureForm.classId} onValueChange={(v) => setStructureForm((p) => ({ ...p, classId: v === 'ALL' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Classes</SelectItem>
                    {programs.map((program) => (
                      <SelectGroup key={program.id}>
                        <SelectLabel>{program.name}</SelectLabel>
                        {program.classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={structureForm.description} onChange={(e) => setStructureForm((p) => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setAddStructureDialogOpen(false)}>Cancel</Button>
            <Button className="bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover" onClick={handleAddStructure}>
              Create Structure
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
