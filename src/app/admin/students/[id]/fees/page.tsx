'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PORTAL_THEMES, FEE_COLORS } from '@/lib/theme-tokens';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  IndianRupee,
  FileText,
  Download,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Receipt,
  TrendingDown,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface StudentInvoice {
  id: string;
  invoiceNo: string;
  term: string;
  amount: number;
  paid: number;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL';
}

interface PaymentRecord {
  id: string;
  receiptNo: string;
  date: string;
  amount: number;
  method: string;
  invoiceNo: string;
}

const MOCK_INVOICES: StudentInvoice[] = [
  { id: '1', invoiceNo: 'INV-2026-001', term: 'Q1 Tuition Fee', amount: 18750, paid: 18750, dueDate: '2026-04-01', status: 'PAID' },
  { id: '2', invoiceNo: 'INV-2026-025', term: 'Q2 Tuition Fee', amount: 18750, paid: 0, dueDate: '2026-07-01', status: 'PENDING' },
  { id: '3', invoiceNo: 'INV-2026-030', term: 'Annual Activity Fee', amount: 5000, paid: 2500, dueDate: '2026-04-15', status: 'PARTIAL' },
  { id: '4', invoiceNo: 'INV-2026-015', term: 'Transport Fee Q1', amount: 6000, paid: 6000, dueDate: '2026-03-15', status: 'PAID' },
  { id: '5', invoiceNo: 'INV-2026-040', term: 'Late Fee Penalty', amount: 500, paid: 0, dueDate: '2026-03-01', status: 'OVERDUE' },
];

const MOCK_PAYMENTS: PaymentRecord[] = [
  { id: '1', receiptNo: 'RCP-2026-001', date: '2026-03-28', amount: 18750, method: 'UPI', invoiceNo: 'INV-2026-001' },
  { id: '2', receiptNo: 'RCP-2026-008', date: '2026-03-15', amount: 6000, method: 'Bank Transfer', invoiceNo: 'INV-2026-015' },
  { id: '3', receiptNo: 'RCP-2026-015', date: '2026-04-10', amount: 2500, method: 'Cash', invoiceNo: 'INV-2026-030' },
];

const STATUS_BADGE: Record<string, string> = {
  PAID: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  OVERDUE: 'bg-red-50 text-red-700',
  PARTIAL: 'bg-yellow-50 text-yellow-700',
};

export default function StudentFeesPage() {
  const params = useParams();
  const studentId = params?.id as string;

  const totalInvoiced = MOCK_INVOICES.reduce((s, i) => s + i.amount, 0);
  const totalPaid = MOCK_INVOICES.reduce((s, i) => s + i.paid, 0);
  const outstanding = totalInvoiced - totalPaid;

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        {/* Header */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <IndianRupee className="w-6 h-6" style={{ color: theme.primary }} />
                Fee Details
              </h1>
              <p className="text-sm text-gray-500 mt-1">Student ID: {studentId} — Invoice and payment history</p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" /> Export Statement
            </Button>
          </div>
        </StaggerItem>

        {/* Stats */}
        <StaggerItem>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Invoiced</p>
                  <p className="text-lg font-bold text-purple-700">₹{totalInvoiced.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Paid</p>
                  <p className="text-lg font-bold text-emerald-700">₹{totalPaid.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Outstanding</p>
                  <p className="text-lg font-bold text-red-700">₹{outstanding.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </PreOneCard>
          </div>
        </StaggerItem>

        {/* Outstanding Bar */}
        {outstanding > 0 && (
          <StaggerItem>
            <PreOneCard variant="emotional" className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Payment Progress</span>
                <span className="text-sm font-bold" style={{ color: theme.primary }}>
                  {Math.round((totalPaid / totalInvoiced) * 100)}% paid
                </span>
              </div>
              <Progress value={(totalPaid / totalInvoiced) * 100} className="h-2" />
            </PreOneCard>
          </StaggerItem>
        )}

        {/* Invoice List */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-gray-500" /> Invoice History
              </h3>
              <div className="overflow-hidden -mx-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Term</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_INVOICES.map((inv) => (
                      <TableRow key={inv.id} className="hover:bg-purple-50/30">
                        <TableCell className="text-sm font-medium">{inv.invoiceNo}</TableCell>
                        <TableCell className="text-sm">{inv.term}</TableCell>
                        <TableCell className="text-sm font-medium">₹{inv.amount.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-sm text-emerald-600">₹{inv.paid.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(inv.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${STATUS_BADGE[inv.status]} text-[10px]`}>{inv.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
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

        {/* Payment History */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" /> Payment History
              </h3>
              <div className="space-y-3">
                {MOCK_PAYMENTS.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{p.receiptNo}</p>
                        <p className="text-xs text-gray-400">{p.invoiceNo} • {p.method}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-700">₹{p.amount.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
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
