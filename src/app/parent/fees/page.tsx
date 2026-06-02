'use client';

// ============================================================
// PreOne — Parent Fees Page
// Shows fee details, invoices, and payment history for the
// selected child:
// - Overview cards (Total Due, Total Paid, Pending, Overdue)
// - Fee breakdown donut chart
// - Invoice list with filtering and status badges
// - Payment history timeline
// - Upcoming dues section with overdue warnings
// - Receipt view dialog with print/download
// ============================================================

import React, { useState, useMemo, useCallback, Suspense } from 'react';
import {
  Wallet, IndianRupee, Clock, AlertTriangle, CheckCircle2,
  RefreshCw, AlertCircle, Download, FileText, Receipt,
  ChevronDown, Filter, Search, Printer, X,
  CreditCard, Calendar, TrendingUp, CircleDollarSign,
} from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';
import { useParentAuth } from '@/lib/parent-auth';
import {
  useParentFees, useParentReceipt,
  type FeesData, type InvoiceInfo, type ReceiptData,
} from '@/hooks/use-parent';

// ============================================================
// CONSTANTS
// ============================================================

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
  PARTIAL: 'bg-blue-100 text-blue-700 border-blue-200',
  PAID: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  OVERDUE: 'bg-red-100 text-red-700 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const STATUS_ICONS: Record<string, string> = {
  PENDING: '⏳',
  PARTIAL: '🔄',
  PAID: '✅',
  OVERDUE: '⚠️',
  CANCELLED: '❌',
};

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
  ONLINE: 'Online',
};

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getFeeTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    TUITION: 'Tuition',
    TRANSPORT: 'Transport',
    ACTIVITY: 'Activity',
    EXAM: 'Exam',
    LABORATORY: 'Laboratory',
    LIBRARY: 'Library',
    DEVELOPMENT: 'Development',
    OTHER: 'Other',
  };
  return labels[type] || type;
}

function getFrequencyLabel(freq: string): string {
  const labels: Record<string, string> = {
    MONTHLY: 'Monthly',
    QUARTERLY: 'Quarterly',
    HALF_YEARLY: 'Half-Yearly',
    ANNUAL: 'Annual',
  };
  return labels[freq] || freq;
}

function daysUntilDue(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ============================================================
// OVERVIEW CARDS
// ============================================================

function OverviewCards({ overview }: { overview: FeesData['overview'] }) {
  const cards = [
    {
      label: 'Total Due',
      value: overview.totalDue,
      icon: Wallet,
      color: 'text-sky-600',
      bg: 'bg-sky-50 border-sky-200',
      iconBg: 'bg-sky-100',
    },
    {
      label: 'Total Paid',
      value: overview.totalPaid,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-200',
      iconBg: 'bg-emerald-100',
    },
    {
      label: 'Pending',
      value: overview.totalPending,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-200',
      iconBg: 'bg-amber-100',
    },
    {
      label: 'Overdue',
      value: overview.totalOverdue,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50 border-red-200',
      iconBg: 'bg-red-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className={`rounded-3xl border ${card.bg}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-1.5 rounded-xl ${card.iconBg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <span className={`text-xl font-bold ${card.color}`}>
                {formatCurrency(card.value)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================
// DONUT CHART — Fee Breakdown
// ============================================================

function FeeBreakdownChart({ overview }: { overview: FeesData['overview'] }) {
  const total = overview.totalPaid + overview.totalPending + overview.totalOverdue;

  const chartData = useMemo(() => {
    const data = [
      { name: 'Paid', value: overview.totalPaid, color: PIE_COLORS[0] },
      { name: 'Pending', value: overview.totalPending, color: PIE_COLORS[1] },
      { name: 'Overdue', value: overview.totalOverdue, color: PIE_COLORS[2] },
    ];
    return data.filter((d) => d.value > 0);
  }, [overview]);

  if (total === 0) {
    return (
      <Card className="rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CircleDollarSign className="h-4 w-4 text-sky-600" />
            Fee Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-2">
            <CircleDollarSign className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No fee data available yet</p>
            <p className="text-xs text-muted-foreground">
              Fee breakdown will appear after invoices are created
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CircleDollarSign className="h-4 w-4 text-sky-600" />
          Fee Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <div className="h-52 w-52 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] text-muted-foreground">Total</span>
              <span className="text-sm font-bold">{formatCurrency(total)}</span>
            </div>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {chartData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: entry.color }}
                />
                {entry.name}: {formatCurrency(entry.value)}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// INVOICE LIST
// ============================================================

function InvoiceList({ invoices }: { invoices: InvoiceInfo[] }) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState(false);

  const filteredInvoices = useMemo(() => {
    let result = invoices;

    // Filter by status
    if (statusFilter !== 'ALL') {
      result = result.filter((inv) => inv.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoiceNo.toLowerCase().includes(q) ||
          (inv.description && inv.description.toLowerCase().includes(q)) ||
          (inv.feeStructure && inv.feeStructure.name.toLowerCase().includes(q))
      );
    }

    return result;
  }, [invoices, statusFilter, searchQuery]);

  const displayInvoices = expanded
    ? filteredInvoices
    : filteredInvoices.slice(0, 5);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: invoices.length };
    for (const inv of invoices) {
      counts[inv.status] = (counts[inv.status] || 0) + 1;
    }
    return counts;
  }, [invoices]);

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-sky-600" />
            Invoices
            <Badge variant="outline" className="text-[10px] ml-1">
              {invoices.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs rounded-xl w-full sm:w-44"
              />
            </div>
            {/* Status filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl text-xs h-8 gap-1">
                  <Filter className="h-3 w-3" />
                  {statusFilter === 'ALL' ? 'All' : statusFilter}
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs">Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className={statusFilter === 'ALL' ? 'bg-sky-50' : ''}
                  onClick={() => setStatusFilter('ALL')}
                >
                  All ({statusCounts.ALL || 0})
                </DropdownMenuItem>
                {Object.entries(STATUS_COLORS).map(([status]) => (
                  <DropdownMenuItem
                    key={status}
                    className={statusFilter === status ? 'bg-sky-50' : ''}
                    onClick={() => setStatusFilter(status)}
                  >
                    {STATUS_ICONS[status]} {status} ({statusCounts[status] || 0})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredInvoices.length > 0 ? (
          <div className="space-y-2">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-8 gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 bg-gray-50 rounded-xl">
              <span className="col-span-2">Invoice</span>
              <span>Type</span>
              <span>Amount</span>
              <span>Discount</span>
              <span>Net Due</span>
              <span>Due Date</span>
              <span>Status</span>
            </div>

            {/* Rows */}
            <div className="space-y-1">
              {displayInvoices.map((inv) => (
                <InvoiceRow key={inv.id} invoice={inv} />
              ))}
            </div>

            {/* Expand */}
            {filteredInvoices.length > 5 && (
              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-sky-600 hover:text-sky-700 rounded-xl"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? 'Show Less' : `Show All ${filteredInvoices.length} Invoices`}
                  <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 space-y-2">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              {searchQuery || statusFilter !== 'ALL'
                ? 'No invoices match your filters'
                : 'No invoices yet'}
            </p>
            <p className="text-xs text-muted-foreground">
              Invoices will appear once fee structures are assigned
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// INVOICE ROW
// ============================================================

function InvoiceRow({ invoice }: { invoice: InvoiceInfo }) {
  const dueInfo = daysUntilDue(invoice.dueDate);
  let dueLabel = '';
  let dueColor = 'text-muted-foreground';

  if (invoice.status === 'PAID') {
    dueLabel = `Paid on ${invoice.paidDate ? formatDate(invoice.paidDate) : ''}`;
    dueColor = 'text-emerald-600';
  } else if (invoice.status === 'CANCELLED') {
    dueLabel = 'Cancelled';
    dueColor = 'text-gray-500';
  } else if (dueInfo < 0) {
    dueLabel = `${Math.abs(dueInfo)}d overdue`;
    dueColor = 'text-red-600';
  } else if (dueInfo === 0) {
    dueLabel = 'Due today';
    dueColor = 'text-amber-600';
  } else if (dueInfo <= 7) {
    dueLabel = `Due in ${dueInfo}d`;
    dueColor = 'text-amber-600';
  } else {
    dueLabel = formatDate(invoice.dueDate);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-8 gap-2 items-center px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors">
      {/* Invoice info */}
      <div className="col-span-2">
        <p className="text-sm font-medium">{invoice.invoiceNo}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {invoice.description || invoice.feeStructure?.name || 'Fee'}
        </p>
      </div>

      {/* Type */}
      <div className="hidden sm:block">
        {invoice.feeStructure ? (
          <Badge variant="outline" className="text-[10px] rounded-lg">
            {getFeeTypeLabel(invoice.feeStructure.type)}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>

      {/* Amount */}
      <div className="hidden sm:block">
        <span className="text-xs">{formatCurrency(invoice.amount)}</span>
      </div>

      {/* Discount */}
      <div className="hidden sm:block">
        <span className="text-xs text-muted-foreground">
          {invoice.discount > 0 ? `-${formatCurrency(invoice.discount)}` : '—'}
        </span>
      </div>

      {/* Net Due */}
      <div>
        <span className="text-sm font-semibold">{formatCurrency(invoice.netAmount)}</span>
        <p className={`text-[10px] ${dueColor} sm:hidden`}>{dueLabel}</p>
      </div>

      {/* Due Date */}
      <div className="hidden sm:block">
        <p className="text-xs text-muted-foreground">{formatDate(invoice.dueDate)}</p>
        <p className={`text-[10px] ${dueColor}`}>{dueLabel}</p>
      </div>

      {/* Status */}
      <div>
        <Badge className={`${STATUS_COLORS[invoice.status] || 'bg-gray-100 text-gray-500'} text-[10px] border`}>
          {STATUS_ICONS[invoice.status]} {invoice.status}
        </Badge>
      </div>
    </div>
  );
}

// ============================================================
// PAYMENT HISTORY TIMELINE
// ============================================================

function PaymentHistory({ payments }: { payments: FeesData['payments'] }) {
  const [showAll, setShowAll] = useState(false);
  const displayPayments = showAll ? payments : payments.slice(0, 5);

  if (payments.length === 0) {
    return (
      <Card className="rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-sky-600" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-2">
            <CreditCard className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No payments recorded yet</p>
            <p className="text-xs text-muted-foreground">
              Payment history will appear after fees are paid
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-sky-600" />
          Payment History
          <Badge variant="outline" className="text-[10px] ml-1">
            {payments.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />

          <div className="space-y-4">
            {displayPayments.map((payment, idx) => (
              <div key={payment.id} className="relative pl-10">
                {/* Timeline dot */}
                <div className={`absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 ${
                  idx === 0
                    ? 'bg-sky-500 border-sky-300'
                    : 'bg-white border-gray-300'
                }`} />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {formatCurrency(payment.amount)}
                      </span>
                      <Badge variant="outline" className="text-[10px] rounded-lg">
                        {METHOD_LABELS[payment.method] || payment.method}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {payment.invoiceNo}
                      {payment.description && ` — ${payment.description}`}
                    </p>
                    {payment.transactionRef && (
                      <p className="text-[10px] text-muted-foreground">
                        Ref: {payment.transactionRef}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(payment.paymentDate)}
                    </span>
                    {payment.receiptNo && (
                      <ReceiptDialogButton receiptInfo={{ id: payment.id, receiptNo: payment.receiptNo }} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {payments.length > 5 && (
          <div className="text-center pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-sky-600 hover:text-sky-700 rounded-xl"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : `Show All ${payments.length} Payments`}
              <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${showAll ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// UPCOMING & OVERDUE DUES
// ============================================================

function DuesSection({
  upcomingDues,
  overdueDues,
}: {
  upcomingDues: FeesData['upcomingDues'];
  overdueDues: FeesData['overdueDues'];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Overdue Dues */}
      <Card className={`rounded-3xl ${overdueDues.length > 0 ? 'border-red-200 bg-red-50/30' : ''}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className={`h-4 w-4 ${overdueDues.length > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
            Overdue
            {overdueDues.length > 0 && (
              <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px]">
                {overdueDues.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overdueDues.length > 0 ? (
            <div className="space-y-3">
              {overdueDues.map((due) => (
                <div
                  key={due.invoiceNo}
                  className="flex items-center justify-between p-3 bg-white rounded-xl border border-red-100"
                >
                  <div>
                    <p className="text-sm font-medium">{due.invoiceNo}</p>
                    <p className="text-xs text-muted-foreground">
                      {due.description || 'Fee payment'}
                    </p>
                    <p className="text-[10px] text-red-600 font-medium mt-0.5">
                      {due.daysOverdue} day{due.daysOverdue !== 1 ? 's' : ''} overdue
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">
                      {formatCurrency(due.amount)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Due: {formatDate(due.dueDate)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 space-y-1">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
              <p className="text-sm text-emerald-600 font-medium">All clear!</p>
              <p className="text-xs text-muted-foreground">No overdue payments</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Dues */}
      <Card className="rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-sky-600" />
            Upcoming Dues
            {upcomingDues.length > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {upcomingDues.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingDues.length > 0 ? (
            <div className="space-y-3">
              {upcomingDues.map((due) => {
                const daysLeft = daysUntilDue(due.dueDate);
                const isUrgent = daysLeft <= 7;
                return (
                  <div
                    key={due.invoiceNo}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      isUrgent ? 'bg-amber-50 border-amber-100' : 'bg-white border-gray-100'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium">{due.invoiceNo}</p>
                      <p className="text-xs text-muted-foreground">
                        {due.description || 'Fee payment'}
                      </p>
                      <p className={`text-[10px] font-medium mt-0.5 ${
                        isUrgent ? 'text-amber-600' : 'text-muted-foreground'
                      }`}>
                        {daysLeft === 0 ? 'Due today!' : daysLeft === 1 ? 'Due tomorrow' : `Due in ${daysLeft} days`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">
                        {formatCurrency(due.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Due: {formatDate(due.dueDate)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 space-y-1">
              <Calendar className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">No upcoming dues</p>
              <p className="text-xs text-muted-foreground">All fees are paid or no pending invoices</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// RECEIPT DIALOG BUTTON (inline trigger)
// ============================================================

function ReceiptDialogButton({ receiptInfo }: { receiptInfo: { id: string; receiptNo: string } }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-[10px] text-sky-600 hover:text-sky-700 px-1.5"
        onClick={() => setOpen(true)}
      >
        <Receipt className="h-3 w-3 mr-0.5" />
        Receipt
      </Button>
      <ReceiptDialog
        receiptId={receiptInfo.id}
        receiptNo={receiptInfo.receiptNo}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}

// ============================================================
// RECEIPT DIALOG
// ============================================================

function ReceiptDialog({
  receiptId,
  receiptNo,
  open,
  onOpenChange,
}: {
  receiptId: string;
  receiptNo: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading } = useParentReceipt(open ? receiptId : null);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownload = useCallback(() => {
    if (!data?.receipt) return;
    const r = data.receipt;
    const lines = [
      '═══════════════════════════════════════',
      r.branch ? r.branch.name.toUpperCase() : 'PREONE PRESCHOOL',
      r.branch?.address || '',
      r.branch?.phone ? `Phone: ${r.branch.phone}` : '',
      '═══════════════════════════════════════',
      '',
      'PAYMENT RECEIPT',
      `Receipt No: ${r.receiptNo}`,
      `Date: ${formatDate(r.createdAt)}`,
      '',
      '───────────────────────────────────────',
      `Student: ${r.invoice.student.firstName} ${r.invoice.student.lastName}`,
      r.invoice.student.rollNumber ? `Roll No: ${r.invoice.student.rollNumber}` : '',
      r.invoice.student.className ? `Class: ${r.invoice.student.className}` : '',
      r.invoice.student.programName ? `Program: ${r.invoice.student.programName}` : '',
      '───────────────────────────────────────',
      '',
      `Invoice: ${r.invoice.invoiceNo}`,
      r.invoice.feeStructure ? `Fee Type: ${getFeeTypeLabel(r.invoice.feeStructure.type)} - ${r.invoice.feeStructure.name}` : '',
      r.invoice.description ? `Description: ${r.invoice.description}` : '',
      '',
      `Amount: ${formatCurrency(r.invoice.amount)}`,
      r.invoice.discount > 0 ? `Discount: -${formatCurrency(r.invoice.discount)}` : '',
      `Net Amount: ${formatCurrency(r.invoice.netAmount)}`,
      `Paid: ${formatCurrency(r.amount)}`,
      '',
      '───────────────────────────────────────',
      'Payment Details:',
      ...r.invoice.payments.map((p) =>
        `  ${formatDate(p.paymentDate)} | ${METHOD_LABELS[p.method] || p.method} | ${formatCurrency(p.amount)}${p.transactionRef ? ` | Ref: ${p.transactionRef}` : ''}`
      ),
      '',
      '═══════════════════════════════════════',
      'Thank you for your payment!',
      '═══════════════════════════════════════',
    ].filter(Boolean);

    const text = lines.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${r.receiptNo}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [data]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-48 rounded-xl" />
            <Skeleton className="h-4 w-32 rounded-lg" />
            <div className="space-y-2 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-6 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ) : data?.receipt ? (
          <ReceiptContent
            receipt={data.receipt}
            onPrint={handlePrint}
            onDownload={handleDownload}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <div className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Receipt not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// RECEIPT CONTENT (rendered inside dialog)
// ============================================================

function ReceiptContent({
  receipt,
  onPrint,
  onDownload,
  onClose,
}: {
  receipt: ReceiptData;
  onPrint: () => void;
  onDownload: () => void;
  onClose: () => void;
}) {
  const r = receipt;

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 to-blue-500 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Payment Receipt</h2>
            <p className="text-sm opacity-90">{r.receiptNo}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              className="rounded-xl text-xs h-8 bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={onPrint}
            >
              <Printer className="h-3 w-3 mr-1" /> Print
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="rounded-xl text-xs h-8 bg-white/20 hover:bg-white/30 text-white border-0"
              onClick={onDownload}
            >
              <Download className="h-3 w-3 mr-1" /> Download
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-4">
        {/* Branch */}
        {r.branch && (
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="h-10 w-10 rounded-xl bg-sky-100 flex items-center justify-center">
              <span className="text-sky-700 font-bold text-sm">
                {r.branch.name.charAt(0)}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold">{r.branch.name}</p>
              {r.branch.address && (
                <p className="text-[11px] text-muted-foreground">{r.branch.address}</p>
              )}
              {r.branch.phone && (
                <p className="text-[11px] text-muted-foreground">{r.branch.phone}</p>
              )}
            </div>
          </div>
        )}

        {/* Student Info */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Student</p>
            <p className="text-sm font-medium">
              {r.invoice.student.firstName} {r.invoice.student.lastName}
            </p>
          </div>
          {r.invoice.student.rollNumber && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Roll No</p>
              <p className="text-sm font-medium">{r.invoice.student.rollNumber}</p>
            </div>
          )}
          {r.invoice.student.className && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Class</p>
              <p className="text-sm font-medium">{r.invoice.student.className}</p>
            </div>
          )}
          {r.invoice.student.programName && (
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Program</p>
              <p className="text-sm font-medium">{r.invoice.student.programName}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Invoice Details */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Invoice Details</p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Invoice No</span>
              <span className="font-medium">{r.invoice.invoiceNo}</span>
            </div>
            {r.invoice.feeStructure && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Fee Type</span>
                <span className="font-medium">
                  {getFeeTypeLabel(r.invoice.feeStructure.type)} — {r.invoice.feeStructure.name}
                </span>
              </div>
            )}
            {r.invoice.description && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Description</span>
                <span className="font-medium">{r.invoice.description}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">{formatCurrency(r.invoice.amount)}</span>
            </div>
            {r.invoice.discount > 0 && (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-medium text-emerald-600">-{formatCurrency(r.invoice.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Net Amount</span>
              <span className="font-medium">{formatCurrency(r.invoice.netAmount)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Paid</span>
              <span className="font-bold text-emerald-600">{formatCurrency(r.amount)}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Payment Details */}
        {r.invoice.payments.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Payment Details</p>
            <div className="space-y-2">
              {r.invoice.payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-2.5">
                  <div>
                    <p className="text-xs font-medium">
                      {METHOD_LABELS[p.method] || p.method}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDate(p.paymentDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold">{formatCurrency(p.amount)}</p>
                    {p.transactionRef && (
                      <p className="text-[10px] text-muted-foreground">
                        Ref: {p.transactionRef}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Date */}
        <div className="text-center pt-2">
          <p className="text-[10px] text-muted-foreground">
            Receipt generated on {formatDate(r.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LOADING SKELETON
// ============================================================

function FeesLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-32 rounded-xl" />
        <Skeleton className="h-4 w-48 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-3xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-72 rounded-3xl" />
        <div className="lg:col-span-2">
          <Skeleton className="h-72 rounded-3xl" />
        </div>
      </div>
      <Skeleton className="h-64 rounded-3xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-48 rounded-3xl" />
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================

function FeesPageContent() {
  const { selectedChildId, selectedChild, children, selectChild } = useParentAuth();

  // Fetch fees data
  const { data, isLoading, isError, error, refetch } = useParentFees(selectedChildId);

  // Loading state
  if (isLoading && !data) {
    return <FeesLoadingSkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-500 text-sm">
          {error?.message || 'Failed to load fee details'}
        </p>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  const overview = data?.overview || { totalDue: 0, totalPaid: 0, totalPending: 0, totalOverdue: 0 };
  const invoices = data?.invoices || [];
  const payments = data?.payments || [];
  const upcomingDues = data?.upcomingDues || [];
  const overdueDues = data?.overdueDues || [];
  const childName = data?.childName || `${selectedChild?.firstName || ''} ${selectedChild?.lastName || ''}`.trim() || 'Child';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Fees</h1>
          <p className="text-sm text-muted-foreground">
            Fee details for {childName}
            {selectedChild?.className && (
              <span className="text-muted-foreground"> — {selectedChild.className}</span>
            )}
          </p>
        </div>

        {/* Child Switcher (if multiple children) */}
        {children.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl gap-2">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[8px] bg-sky-100 text-sky-700">
                    {selectedChild?.firstName?.[0]}{selectedChild?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                {childName}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {children.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  className={c.id === selectedChildId ? 'bg-sky-50' : ''}
                  onClick={() => selectChild(c.id)}
                >
                  {c.firstName} {c.lastName} — {c.className || 'No class'}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Overview Cards */}
      <OverviewCards overview={overview} />

      {/* Donut Chart + Invoice List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FeeBreakdownChart overview={overview} />
        <div className="lg:col-span-2">
          <InvoiceList invoices={invoices} />
        </div>
      </div>

      {/* Payment History */}
      <PaymentHistory payments={payments} />

      {/* Upcoming & Overdue Dues */}
      <DuesSection upcomingDues={upcomingDues} overdueDues={overdueDues} />
    </div>
  );
}

// ============================================================
// EXPORT with Suspense boundary
// ============================================================

export default function ParentFeesPage() {
  return (
    <Suspense fallback={<FeesLoadingSkeleton />}>
      <FeesPageContent />
    </Suspense>
  );
}
