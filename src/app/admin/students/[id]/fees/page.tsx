'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
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
  CheckCircle2,
  Clock,
  Receipt,
  TrendingDown,
  Loader2,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface StudentInvoice {
  id: string;
  invoiceNo: string;
  term: string;
  amount: number;
  paid: number;
  dueDate: string;
  status: string;
}
interface PaymentRecord {
  id: string;
  receiptNo: string;
  date: string;
  amount: number;
  method: string;
  invoiceNo: string;
}

const STATUS_BADGE: Record<string, string> = {
  PAID: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  OVERDUE: 'bg-red-50 text-red-700',
  PARTIAL: 'bg-yellow-50 text-yellow-700',
};
const METHOD_LABEL: Record<string, string> = {
  CASH: 'Cash', UPI: 'UPI', BANK_TRANSFER: 'Bank Transfer', CHEQUE: 'Cheque', ONLINE: 'Online',
};

interface ApiInvoice {
  id: string; invoiceNo: string; amount: number; netAmount: number; dueDate: string; status: string;
  description?: string | null;
  feeStructure?: { name: string } | null;
  payments?: { amount: number }[];
}
interface ApiPayment { id: string; amount: number; method: string; paymentDate: string; transactionRef?: string | null; invoiceId?: string | null; }

export default function StudentFeesPage() {
  const params = useParams();
  const studentId = params?.id as string;
  const [invoices, setInvoices] = useState<StudentInvoice[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!studentId) return;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/students/${studentId}`);
        if (!res.ok) throw new Error('Failed to load student fees');
        const data = await res.json();
        const s = data.student || {};
        const apiInvoices: ApiInvoice[] = s.invoices || [];
        const invoiceNoById: Record<string, string> = {};
        const mappedInvoices: StudentInvoice[] = apiInvoices.map((inv) => {
          invoiceNoById[inv.id] = inv.invoiceNo;
          return {
            id: inv.id,
            invoiceNo: inv.invoiceNo,
            term: inv.feeStructure?.name || inv.description || 'Fee',
            amount: inv.netAmount ?? inv.amount,
            paid: (inv.payments || []).reduce((a, p) => a + p.amount, 0),
            dueDate: inv.dueDate,
            status: inv.status,
          };
        });
        const mappedPayments: PaymentRecord[] = (s.payments || []).map((p: ApiPayment) => ({
          id: p.id,
          receiptNo: p.transactionRef || `PMT-${p.id.slice(-6).toUpperCase()}`,
          date: p.paymentDate,
          amount: p.amount,
          method: METHOD_LABEL[p.method] || p.method,
          invoiceNo: p.invoiceId ? invoiceNoById[p.invoiceId] || '—' : '—',
        }));
        setInvoices(mappedInvoices);
        setPayments(mappedPayments);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load student fees');
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  const totalInvoiced = useMemo(() => invoices.reduce((s, i) => s + i.amount, 0), [invoices]);
  const totalPaid = useMemo(() => invoices.reduce((s, i) => s + i.paid, 0), [invoices]);
  const outstanding = totalInvoiced - totalPaid;

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <IndianRupee className="w-6 h-6" style={{ color: theme.primary }} />
                Fee Details
              </h1>
              <p className="text-sm text-gray-500 mt-1">Invoice and payment history</p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" /> Export Statement
            </Button>
          </div>
        </StaggerItem>

        {loading ? (
          <StaggerItem><PreOneCard variant="default" className="p-12 text-center text-gray-400"><Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading fees…</PreOneCard></StaggerItem>
        ) : error ? (
          <StaggerItem><PreOneCard variant="default" className="p-12 text-center text-red-500 text-sm">{error}</PreOneCard></StaggerItem>
        ) : (
          <>
            {/* Stats */}
            <StaggerItem>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PreOneCard variant="strip" className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center"><FileText className="w-5 h-5 text-purple-600" /></div>
                    <div><p className="text-xs text-gray-500">Total Invoiced</p><p className="text-lg font-bold text-purple-700">₹{totalInvoiced.toLocaleString('en-IN')}</p></div>
                  </div>
                </PreOneCard>
                <PreOneCard variant="strip" className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div>
                    <div><p className="text-xs text-gray-500">Total Paid</p><p className="text-lg font-bold text-emerald-700">₹{totalPaid.toLocaleString('en-IN')}</p></div>
                  </div>
                </PreOneCard>
                <PreOneCard variant="strip" className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><TrendingDown className="w-5 h-5 text-red-600" /></div>
                    <div><p className="text-xs text-gray-500">Outstanding</p><p className="text-lg font-bold text-red-700">₹{outstanding.toLocaleString('en-IN')}</p></div>
                  </div>
                </PreOneCard>
              </div>
            </StaggerItem>

            {outstanding > 0 && totalInvoiced > 0 && (
              <StaggerItem>
                <PreOneCard variant="emotional" className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Payment Progress</span>
                    <span className="text-sm font-bold" style={{ color: theme.primary }}>{Math.round((totalPaid / totalInvoiced) * 100)}% paid</span>
                  </div>
                  <Progress value={(totalPaid / totalInvoiced) * 100} className="h-2" />
                </PreOneCard>
              </StaggerItem>
            )}

            {/* Invoice List */}
            <StaggerItem>
              <PreOneCard variant="default">
                <PreOneCardContent>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Receipt className="w-4 h-4 text-gray-500" /> Invoice History</h3>
                  {invoices.length === 0 ? (
                    <p className="text-sm text-gray-400 py-6 text-center">No invoices for this student.</p>
                  ) : (
                    <div className="overflow-hidden -mx-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice</TableHead><TableHead>Term</TableHead><TableHead>Amount</TableHead>
                            <TableHead>Paid</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoices.map((inv) => (
                            <TableRow key={inv.id} className="hover:bg-purple-50/30">
                              <TableCell className="text-sm font-medium">{inv.invoiceNo}</TableCell>
                              <TableCell className="text-sm">{inv.term}</TableCell>
                              <TableCell className="text-sm font-medium">₹{inv.amount.toLocaleString('en-IN')}</TableCell>
                              <TableCell className="text-sm text-emerald-600">₹{inv.paid.toLocaleString('en-IN')}</TableCell>
                              <TableCell className="text-sm text-gray-500">{new Date(inv.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</TableCell>
                              <TableCell><Badge className={`${STATUS_BADGE[inv.status] || 'bg-gray-50 text-gray-600'} text-[10px]`}>{inv.status}</Badge></TableCell>
                              <TableCell><Button variant="ghost" size="sm" className="h-7 text-xs"><Send className="w-3 h-3 mr-1" /> Remind</Button></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </PreOneCardContent>
              </PreOneCard>
            </StaggerItem>

            {/* Payment History */}
            <StaggerItem>
              <PreOneCard variant="default">
                <PreOneCardContent>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-gray-500" /> Payment History</h3>
                  {payments.length === 0 ? (
                    <p className="text-sm text-gray-400 py-6 text-center">No payments recorded.</p>
                  ) : (
                    <div className="space-y-3">
                      {payments.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-emerald-600" /></div>
                            <div><p className="text-sm font-medium">{p.receiptNo}</p><p className="text-xs text-gray-400">{p.invoiceNo} • {p.method}</p></div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-emerald-700">₹{p.amount.toLocaleString('en-IN')}</p>
                            <p className="text-xs text-gray-400">{new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </PreOneCardContent>
              </PreOneCard>
            </StaggerItem>
          </>
        )}
      </StaggerContainer>
    </PageTransition>
  );
}
