'use client';

// ============================================================
// PreOne — Parent Fees Page
// Shows: fee overview cards, donut chart breakdown,
// invoice list with filters, payment history timeline,
// upcoming/overdue dues, receipt dialog
// ============================================================

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  IndianRupee, CheckCircle2, Clock, AlertTriangle,
  RefreshCw, AlertCircle, Download, Printer,
  ChevronDown, Filter, CreditCard, FileText,
  Calendar, Wallet,
} from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';
import { useParentAuth } from '@/lib/parent-auth';
import {
  useParentFees,
  type InvoiceInfo,
  type PaymentHistoryItem,
  type FeesData,
} from '@/hooks/use-parent';
import { toast } from '@/hooks/use-toast';

// ============================================================
// CONSTANTS
// ============================================================

const PIE_COLORS = {
  paid: '#10b981',
  pending: '#f59e0b',
  overdue: '#ef4444',
};

// ============================================================
// HELPERS
// ============================================================

function formatCurrency(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatDateShort(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

function getInvoiceStatusBadge(status: string) {
  switch (status) {
    case 'PAID':
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">✅ Paid</Badge>;
    case 'PENDING':
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">⏳ Pending</Badge>;
    case 'OVERDUE':
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] animate-pulse">
          🔴 Overdue
        </Badge>
      );
    case 'PARTIAL':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px]">🔵 Partial</Badge>;
    case 'CANCELLED':
      return <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-[10px]">Cancelled</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  }
}

function getMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    UPI: 'UPI',
    CASH: 'Cash',
    BANK_TRANSFER: 'Bank Transfer',
    CHEQUE: 'Cheque',
    ONLINE: 'Online',
  };
  return labels[method] || method;
}

// ============================================================
// FEE OVERVIEW CARDS
// ============================================================

function FeeOverviewCards({ overview }: { overview: FeesData['overview'] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="rounded-3xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Wallet className="h-5 w-5 text-sky-600" />
            <span className="text-2xl font-bold text-sky-600">
              {formatCurrency(overview.totalDue)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Total Due</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="text-2xl font-bold text-emerald-600">
              {formatCurrency(overview.totalPaid)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Total Paid</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <span className="text-2xl font-bold text-amber-600">
              {formatCurrency(overview.totalPending)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Pending</p>
        </CardContent>
      </Card>

      <Card className={`rounded-3xl ${overview.totalOverdue > 0 ? 'ring-2 ring-red-200 bg-red-50/50' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className={`h-5 w-5 ${overview.totalOverdue > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            <span className={`text-2xl font-bold ${overview.totalOverdue > 0 ? 'text-red-600' : 'text-gray-400'}`}>
              {formatCurrency(overview.totalOverdue)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">Overdue</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// DONUT CHART BREAKDOWN
// ============================================================

interface PieDataItem {
  name: string;
  value: number;
  color: string;
}

function FeeBreakdownChart({ overview }: { overview: FeesData['overview'] }) {
  const data: PieDataItem[] = useMemo(() => {
    const items: PieDataItem[] = [];
    if (overview.totalPaid > 0) items.push({ name: 'Paid', value: overview.totalPaid, color: PIE_COLORS.paid });
    if (overview.totalPending > 0) items.push({ name: 'Pending', value: overview.totalPending, color: PIE_COLORS.pending });
    if (overview.totalOverdue > 0) items.push({ name: 'Overdue', value: overview.totalOverdue, color: PIE_COLORS.overdue });
    // If all zero, show a placeholder
    if (items.length === 0) items.push({ name: 'No Data', value: 1, color: '#e5e7eb' });
    return items;
  }, [overview]);

  const total = overview.totalDue || 0;

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <IndianRupee className="h-4 w-4 text-sky-600" />
          Fee Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className="h-52 w-full max-w-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  dataKey="value"
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: number, name: string) => [formatCurrency(value), name]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-lg font-bold">{formatCurrency(total)}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 flex-wrap justify-center">
            {overview.totalPaid > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS.paid }} />
                <span className="text-muted-foreground">Paid: {formatCurrency(overview.totalPaid)}</span>
              </div>
            )}
            {overview.totalPending > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS.pending }} />
                <span className="text-muted-foreground">Pending: {formatCurrency(overview.totalPending)}</span>
              </div>
            )}
            {overview.totalOverdue > 0 && (
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS.overdue }} />
                <span className="text-muted-foreground">Overdue: {formatCurrency(overview.totalOverdue)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// INVOICE LIST
// ============================================================

function InvoiceList({
  invoices,
  onReceiptClick,
  onPayClick,
}: {
  invoices: InvoiceInfo[];
  onReceiptClick: (invoice: InvoiceInfo) => void;
  onPayClick: (invoice: InvoiceInfo) => void;
}) {
  const [filter, setFilter] = useState<string>('ALL');
  const [filterOpen, setFilterOpen] = useState(false);

  const filteredInvoices = useMemo(() => {
    if (filter === 'ALL') return invoices;
    return invoices.filter((inv) => inv.status === filter);
  }, [invoices, filter]);

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: invoices.length };
    for (const inv of invoices) {
      counts[inv.status] = (counts[inv.status] || 0) + 1;
    }
    return counts;
  }, [invoices]);

  const filterOptions = [
    { value: 'ALL', label: 'All' },
    { value: 'PAID', label: '✅ Paid' },
    { value: 'PENDING', label: '⏳ Pending' },
    { value: 'OVERDUE', label: '🔴 Overdue' },
    { value: 'PARTIAL', label: '🔵 Partial' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-sky-600" />
            Invoices
          </CardTitle>
          <DropdownMenu open={filterOpen} onOpenChange={setFilterOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1">
                <Filter className="h-3 w-3" />
                {filterOptions.find((f) => f.value === filter)?.label || 'All'}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {filterOptions.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  className={opt.value === filter ? 'bg-sky-50' : ''}
                  onClick={() => {
                    setFilter(opt.value);
                    setFilterOpen(false);
                  }}
                >
                  <span className="flex-1">{opt.label}</span>
                  <Badge variant="outline" className="text-[9px] ml-2">
                    {filterCounts[opt.value] || 0}
                  </Badge>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {filteredInvoices.length > 0 ? (
          <div className="space-y-2">
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-7 gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 bg-gray-50 rounded-xl">
              <span>Invoice</span>
              <span className="col-span-2">Description</span>
              <span>Amount</span>
              <span>Status</span>
              <span>Due Date</span>
              <span>Actions</span>
            </div>

            {/* Rows */}
            {filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                className="grid grid-cols-2 sm:grid-cols-7 gap-2 items-center px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                <span className="font-mono text-xs font-medium">{inv.invoiceNo}</span>
                <span className="text-xs text-muted-foreground col-span-2 truncate">
                  {inv.description || inv.feeStructure?.name || '—'}
                </span>
                <span className="font-semibold text-xs">{formatCurrency(inv.netAmount)}</span>
                <span>{getInvoiceStatusBadge(inv.status)}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDateShort(inv.dueDate)}
                </span>
                <div className="flex items-center gap-1">
                  {inv.status === 'PAID' && inv.receipt && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[10px] h-7 px-2 rounded-lg text-sky-600 hover:text-sky-700"
                      onClick={() => onReceiptClick(inv)}
                    >
                      <FileText className="h-3 w-3 mr-0.5" />
                      Receipt
                    </Button>
                  )}
                  {(inv.status === 'PENDING' || inv.status === 'OVERDUE' || inv.status === 'PARTIAL') && (
                    <Button
                      size="sm"
                      className="text-[10px] h-7 px-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:from-sky-600 hover:to-blue-600"
                      onClick={() => onPayClick(inv)}
                    >
                      <CreditCard className="h-3 w-3 mr-0.5" />
                      Pay Now
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 space-y-2">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No invoices found</p>
            <p className="text-xs text-muted-foreground">
              {filter !== 'ALL' ? 'Try changing the filter' : 'Invoices will appear when fees are assigned'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// PAYMENT HISTORY TIMELINE
// ============================================================

function PaymentHistory({ payments }: { payments: PaymentHistoryItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const displayPayments = expanded ? payments : payments.slice(0, 5);

  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Wallet className="h-4 w-4 text-sky-600" />
          Payment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length > 0 ? (
          <div className="space-y-0">
            {displayPayments.map((payment, idx) => (
              <div key={payment.id} className="relative flex gap-4">
                {/* Timeline line */}
                {idx < displayPayments.length - 1 && (
                  <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-200" />
                )}
                {/* Timeline dot */}
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 mt-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                {/* Content */}
                <div className="flex-1 pb-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(payment.paymentDate)}
                      </p>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px]">
                      ✅ Paid
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                    <p>
                      Invoice: {payment.invoiceNo}
                      {payment.description && ` (${payment.description})`}
                    </p>
                    <p>
                      Method: {getMethodLabel(payment.method)}
                      {payment.transactionRef && ` | Ref: ${payment.transactionRef}`}
                    </p>
                    {payment.receiptNo && (
                      <p>Receipt: {payment.receiptNo}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {payments.length > 5 && (
              <div className="text-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-sky-600 hover:text-sky-700 rounded-xl"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? 'Show Less' : `Show All ${payments.length} Payments`}
                  <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 space-y-2">
            <Wallet className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No payment history yet</p>
            <p className="text-xs text-muted-foreground">Payments will appear here as they are recorded</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================
// UPCOMING DUES & OVERDUE SECTION
// ============================================================

function UpcomingDues({
  upcomingDues,
  overdueDues,
}: {
  upcomingDues: FeesData['upcomingDues'];
  overdueDues: FeesData['overdueDues'];
}) {
  return (
    <Card className="rounded-3xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4 text-sky-600" />
          Upcoming Due Dates
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Overdue alert */}
        {overdueDues.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-xs font-semibold text-red-700 mb-2">
              ⚠️ You have {overdueDues.length} overdue payment{overdueDues.length > 1 ? 's' : ''}:
            </p>
            <div className="space-y-1.5">
              {overdueDues.map((due) => (
                <div key={due.invoiceNo} className="flex items-center justify-between text-xs">
                  <span className="text-red-700">
                    {formatDateShort(due.dueDate)} — {formatCurrency(due.amount)}
                    {due.description && ` (${due.description})`}
                  </span>
                  <Badge className="bg-red-100 text-red-700 text-[8px] border-red-200">
                    {due.daysOverdue}d overdue
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming list */}
        {upcomingDues.length > 0 ? (
          <div className="space-y-2">
            {upcomingDues.map((due) => (
              <div
                key={due.invoiceNo}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      {formatDateShort(due.dueDate)} — {formatCurrency(due.amount)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {due.description || due.invoiceNo}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="text-[10px] h-7 px-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 text-white hover:from-sky-600 hover:to-blue-600"
                  onClick={() => {
                    toast({ title: 'Online payment coming soon', description: 'This feature is under development.' });
                  }}
                >
                  <CreditCard className="h-3 w-3 mr-0.5" />
                  Pay
                </Button>
              </div>
            ))}
          </div>
        ) : overdueDues.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
            <p className="text-sm text-muted-foreground">All dues are paid!</p>
            <p className="text-xs text-muted-foreground">No upcoming payments</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ============================================================
// RECEIPT DIALOG
// ============================================================

function ReceiptDialog({
  invoice,
  childName,
  className,
  open,
  onClose,
}: {
  invoice: InvoiceInfo | null;
  childName: string;
  className: string | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!invoice) return null;

  const receipt = invoice.receipt;
  const payment = invoice.payments[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md print:shadow-none print:border-none print:p-0 print:max-w-none">
        <DialogHeader>
          <DialogTitle className="sr-only">Payment Receipt</DialogTitle>
        </DialogHeader>

        <div className="print:text-black" id="receipt-content">
          {/* School Header */}
          <div className="text-center mb-4">
            <p className="text-lg font-bold">🏫 Little Stars Preschool</p>
            <p className="text-xs text-muted-foreground">123 Main St, Mumbai</p>
            <Separator className="my-3" />
            <p className="text-sm font-bold uppercase tracking-wider">Payment Receipt</p>
          </div>

          {/* Receipt Details */}
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Receipt No:</span>
              <span className="font-medium">{receipt?.receiptNo || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{invoice.paidDate ? formatDate(invoice.paidDate) : 'N/A'}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Student:</span>
              <span className="font-medium">{childName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Class:</span>
              <span className="font-medium">{className || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice:</span>
              <span className="font-medium">{invoice.invoiceNo}</span>
            </div>
          </div>

          <Separator />

          {/* Fee Breakdown */}
          <div className="my-4">
            <div className="flex justify-between text-sm font-semibold pb-2">
              <span>Description</span>
              <span>Amount</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm py-2">
              <span>{invoice.description || invoice.feeStructure?.name || 'Fee'}</span>
              <span>{formatCurrency(invoice.amount)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between text-sm py-1 text-emerald-600">
                <span>Discount</span>
                <span>-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-sm font-bold py-2">
              <span>Total Paid</span>
              <span>{formatCurrency(invoice.netAmount)}</span>
            </div>
          </div>

          {/* Payment Method */}
          {payment && (
            <div className="text-xs text-muted-foreground space-y-0.5 mb-4">
              <p>Method: {getMethodLabel(payment.method)}</p>
              {payment.transactionRef && <p>Ref: {payment.transactionRef}</p>}
            </div>
          )}

          <Separator className="my-4" />

          {/* Actions */}
          <div className="flex items-center gap-2 print:hidden">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-xl text-xs"
              onClick={handlePrint}
            >
              <Printer className="h-3 w-3 mr-1" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-xl text-xs"
              onClick={() => {
                toast({ title: 'PDF generation coming soon', description: 'This feature is under development.' });
              }}
            >
              <Download className="h-3 w-3 mr-1" />
              Download PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================

export default function ParentFeesPage() {
  const { selectedChildId, selectedChild, children, selectChild } = useParentAuth();
  const { data, isLoading, isError, error, refetch } = useParentFees(selectedChildId);

  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceInfo | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const handleReceiptClick = useCallback((invoice: InvoiceInfo) => {
    setSelectedInvoice(invoice);
    setReceiptOpen(true);
  }, []);

  const handlePayClick = useCallback((_invoice: InvoiceInfo) => {
    toast({ title: 'Online payment coming soon', description: 'This feature is under development.' });
  }, []);

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
  const className = data?.className || selectedChild?.className || null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Fees</h1>
          <p className="text-sm text-muted-foreground">
            Fee details for {childName}
            {className && <span className="text-muted-foreground"> — {className}</span>}
          </p>
        </div>

        {/* Child Switcher */}
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

      {/* Fee Overview Cards */}
      <FeeOverviewCards overview={overview} />

      {/* Donut Chart + Upcoming Dues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FeeBreakdownChart overview={overview} />
        <UpcomingDues upcomingDues={upcomingDues} overdueDues={overdueDues} />
      </div>

      {/* Invoice List */}
      <InvoiceList
        invoices={invoices}
        onReceiptClick={handleReceiptClick}
        onPayClick={handlePayClick}
      />

      {/* Payment History */}
      <PaymentHistory payments={payments} />

      {/* Receipt Dialog */}
      <ReceiptDialog
        invoice={selectedInvoice}
        childName={childName}
        className={className}
        open={receiptOpen}
        onClose={() => {
          setReceiptOpen(false);
          setSelectedInvoice(null);
        }}
      />
    </div>
  );
}
