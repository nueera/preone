'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  IndianRupee,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Receipt,
  TrendingUp,
} from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { CosmicStatCard } from '@/components/ui/cosmic-stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { PORTAL_THEMES } from '@/lib/theme-tokens';

const theme = PORTAL_THEMES.admin;

// ── Types ──
interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  method: string | null;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Partial';
  description: string;
}

interface PaymentRecord {
  id: string;
  date: string;
  invoiceNo: string;
  amount: number;
  method: string;
  referenceNo: string;
  status: 'Completed' | 'Processing' | 'Failed';
}

// ── Placeholder data ──
const PLACEHOLDER_INVOICES: Invoice[] = [
  { id: 'inv1', invoiceNo: 'INV-2026-001', date: '01 Jan 2026', dueDate: '15 Jan 2026', amount: 18750, paidAmount: 18750, method: 'Online (Razorpay)', status: 'Paid', description: 'Q1 Tuition Fee — Aarav (Nursery A)' },
  { id: 'inv2', invoiceNo: 'INV-2026-002', date: '01 Apr 2026', dueDate: '15 Apr 2026', amount: 18750, paidAmount: 18750, method: 'Bank Transfer', status: 'Paid', description: 'Q2 Tuition Fee — Aarav (Nursery A)' },
  { id: 'inv3', invoiceNo: 'INV-2026-003', date: '01 Jun 2026', dueDate: '15 Jun 2026', amount: 18750, paidAmount: 0, method: null, status: 'Pending', description: 'Q3 Tuition Fee — Aarav (Nursery A)' },
  { id: 'inv4', invoiceNo: 'INV-2026-004', date: '01 Jan 2026', dueDate: '15 Jan 2026', amount: 12000, paidAmount: 12000, method: 'Cash', status: 'Paid', description: 'Q1 Daycare Fee — Isha (Daycare 1)' },
  { id: 'inv5', invoiceNo: 'INV-2026-005', date: '01 Apr 2026', dueDate: '15 Apr 2026', amount: 12000, paidAmount: 6000, method: 'Online (Razorpay)', status: 'Partial', description: 'Q2 Daycare Fee — Isha (Daycare 1)' },
];

const PLACEHOLDER_PAYMENTS: PaymentRecord[] = [
  { id: 'pay1', date: '28 Mar 2026', invoiceNo: 'INV-2026-002', amount: 18750, method: 'Bank Transfer', referenceNo: 'TXN2026032801', status: 'Completed' },
  { id: 'pay2', date: '12 Jan 2026', invoiceNo: 'INV-2026-001', amount: 18750, method: 'Online (Razorpay)', referenceNo: 'PAY_razor_8x9k2m', status: 'Completed' },
  { id: 'pay3', date: '10 Jan 2026', invoiceNo: 'INV-2026-004', amount: 12000, method: 'Cash', referenceNo: 'CASH-2026-0042', status: 'Completed' },
  { id: 'pay4', date: '05 Apr 2026', invoiceNo: 'INV-2026-005', amount: 6000, method: 'Online (Razorpay)', referenceNo: 'PAY_razor_3n7p5q', status: 'Completed' },
];

const STATUS_COLORS: Record<string, string> = {
  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Overdue: 'bg-red-50 text-red-700 border-red-200',
  Partial: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Processing: 'bg-sky-50 text-sky-700 border-sky-200',
  Failed: 'bg-red-50 text-red-700 border-red-200',
};

export default function ParentPaymentsPage() {
  const params = useParams();
  const router = useRouter();
  const parentId = params.id as string;

  const parentName = 'Rajesh Kumar';
  const totalInvoiced = PLACEHOLDER_INVOICES.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = PLACEHOLDER_INVOICES.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const outstanding = totalInvoiced - totalPaid;

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Payment History
          </h1>
          <p className="text-sm text-muted-foreground">
            Invoices and payments for {parentName}
          </p>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CosmicStatCard
            label="Total Invoiced"
            value={totalInvoiced}
            suffix="₹"
            icon={<Receipt className="h-5 w-5" />}
            color="bg-violet-500"
          />
          <CosmicStatCard
            label="Total Paid"
            value={totalPaid}
            suffix="₹"
            icon={<CheckCircle2 className="h-5 w-5" />}
            color="bg-emerald-500"
          />
          <CosmicStatCard
            label="Outstanding"
            value={outstanding}
            suffix="₹"
            icon={<AlertTriangle className="h-5 w-5" />}
            color="bg-red-500"
          />
          <CosmicStatCard
            label="Overdue Invoices"
            value={0}
            icon={<Clock className="h-5 w-5" />}
            color="bg-amber-500"
          />
        </div>

        {/* ── Outstanding Balance Banner ── */}
        {outstanding > 0 && (
          <PreOneCard variant="strip" className="border-l-4 border-l-amber-400">
            <PreOneCardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm font-medium">Outstanding Balance</p>
                    <p className="text-xs text-muted-foreground">
                      ₹{outstanding.toLocaleString('en-IN')} pending across {PLACEHOLDER_INVOICES.filter((i) => i.status !== 'Paid').length} invoices
                    </p>
                  </div>
                </div>
                <Button size="sm" className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover">
                  <CreditCard className="h-3.5 w-3.5" />
                  Send Reminder
                </Button>
              </div>
            </PreOneCardContent>
          </PreOneCard>
        )}

        {/* ── Invoices Table ── */}
        <PreOneCard variant="default">
          <PreOneCardContent>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Receipt className="h-5 w-5 text-portal-500" />
                Invoices
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PLACEHOLDER_INVOICES.map((inv) => (
                    <TableRow key={inv.id} className="table-row-preone">
                      <TableCell className="font-medium text-sm">{inv.invoiceNo}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{inv.description}</TableCell>
                      <TableCell className="text-sm">{inv.date}</TableCell>
                      <TableCell className="text-sm">{inv.dueDate}</TableCell>
                      <TableCell className="text-sm font-medium">₹{inv.amount.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-sm">₹{inv.paidAmount.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{inv.method || '—'}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${STATUS_COLORS[inv.status]}`}>
                          {inv.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </PreOneCardContent>
        </PreOneCard>

        {/* ── Payment Records ── */}
        <PreOneCard variant="default">
          <PreOneCardContent>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-portal-500" />
              Payment Records
            </h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PLACEHOLDER_PAYMENTS.map((pay) => (
                    <TableRow key={pay.id} className="table-row-preone">
                      <TableCell className="text-sm">{pay.date}</TableCell>
                      <TableCell className="text-sm font-medium">{pay.invoiceNo}</TableCell>
                      <TableCell className="text-sm font-medium">₹{pay.amount.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-sm">{pay.method}</TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono text-xs">{pay.referenceNo}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${STATUS_COLORS[pay.status]}`}>
                          {pay.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </PreOneCardContent>
        </PreOneCard>

        {/* ── Payment Timeline ── */}
        <PreOneCard variant="default">
          <PreOneCardContent>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-portal-500" />
              Payment Timeline
            </h3>
            <div className="space-y-4">
              {PLACEHOLDER_PAYMENTS.map((pay, idx) => (
                <div key={pay.id} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    {idx < PLACEHOLDER_PAYMENTS.length - 1 && (
                      <div className="w-px h-8 bg-border" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">₹{pay.amount.toLocaleString('en-IN')} via {pay.method}</p>
                    <p className="text-xs text-muted-foreground">{pay.date} · Ref: {pay.referenceNo}</p>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 text-[10px]">{pay.status}</Badge>
                </div>
              ))}
            </div>
          </PreOneCardContent>
        </PreOneCard>
      </div>
    </PageTransition>
  );
}
