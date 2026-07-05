'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
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
  Plus,
  Search,
  Download,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  Clock,
  TrendingUp,
  Loader2,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface Payment {
  id: string;
  receiptNo: string;
  student: string;
  amount: number;
  method: string;
  status: string;
  date: string;
  invoiceNo: string;
}

// Shape of a payment as returned by GET /api/fees/payments
interface ApiPayment {
  id: string;
  amount: number;
  method: string;
  paymentDate: string;
  transactionRef: string | null;
  student?: { firstName: string; lastName: string } | null;
  invoice?: { invoiceNo: string } | null;
}

const METHOD_LABEL: Record<string, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
  ONLINE: 'Online',
};

const METHOD_ICON: Record<string, React.ElementType> = {
  Cash: Banknote,
  UPI: Smartphone,
  'Bank Transfer': CreditCard,
  Cheque: CreditCard,
  Online: Smartphone,
};

const STATUS_BADGE: Record<string, string> = {
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  FAILED: 'bg-red-50 text-red-700',
};

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/fees/payments?limit=100');
        if (!res.ok) throw new Error('Failed to load payments');
        const data = await res.json();
        const mapped: Payment[] = (data.payments || []).map((p: ApiPayment) => ({
          id: p.id,
          receiptNo: p.transactionRef || `PMT-${p.id.slice(-6).toUpperCase()}`,
          student: p.student ? `${p.student.firstName} ${p.student.lastName}` : '—',
          amount: p.amount,
          method: METHOD_LABEL[p.method] || p.method,
          // Payment rows are records of completed payments.
          status: 'COMPLETED',
          date: p.paymentDate,
          invoiceNo: p.invoice?.invoiceNo || '—',
        }));
        setPayments(mapped);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load payments');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch = !searchQuery ||
        p.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.receiptNo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchMethod = methodFilter === 'all' || p.method === methodFilter;
      return matchSearch && matchMethod;
    });
  }, [payments, searchQuery, methodFilter]);

  const totalCollected = payments.filter((p) => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0);
  const pendingAmount = payments.filter((p) => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0);

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        {/* Header */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-heading text-[var(--admin-text)] flex items-center gap-2">
                <IndianRupee className="w-6 h-6" style={{ color: theme.primary }} />
                Payment Tracking
              </h1>
              <p className="text-sm text-[var(--admin-text-muted)] mt-1">Record and track all fee payments</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
              <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md">
                <Plus className="w-4 h-4 mr-2" /> Record Payment
              </Button>
            </div>
          </div>
        </StaggerItem>

        {/* Stats Cards */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-[var(--admin-text-muted)]">Collected</p>
                  <p className="text-lg font-bold text-emerald-700">₹{(totalCollected / 1000).toFixed(1)}K</p>
                </div>
              </div>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-[var(--admin-text-muted)]">Pending</p>
                  <p className="text-lg font-bold text-amber-700">₹{(pendingAmount / 1000).toFixed(1)}K</p>
                </div>
              </div>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-[var(--admin-text-muted)]">Transactions</p>
                  <p className="text-lg font-bold text-purple-700">{payments.length}</p>
                </div>
              </div>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-[var(--admin-text-muted)]">Failed</p>
                  <p className="text-lg font-bold text-red-700">{payments.filter((p) => p.status === 'FAILED').length}</p>
                </div>
              </div>
            </PreOneCard>
          </div>
        </StaggerItem>

        {/* Filters */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-subtle)]" />
              <Input
                placeholder="Search by student or receipt number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1.5">
              {['all', 'Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Online'].map((m) => (
                <Badge
                  key={m}
                  variant={methodFilter === m ? 'default' : 'outline'}
                  className="cursor-pointer text-[10px]"
                  onClick={() => setMethodFilter(m)}
                >
                  {m === 'all' ? 'All' : m}
                </Badge>
              ))}
            </div>
          </div>
        </StaggerItem>

        {/* Payment Table */}
        <StaggerItem>
          <PreOneCard variant="default">
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-[var(--admin-text-subtle)]">
                        <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading payments…
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-red-500 text-sm">{error}</TableCell>
                    </TableRow>
                  ) : filteredPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-[var(--admin-text-subtle)] text-sm">No payments recorded yet.</TableCell>
                    </TableRow>
                  ) : (
                    filteredPayments.map((p) => {
                      const MethodIcon = METHOD_ICON[p.method] || CreditCard;
                      return (
                        <TableRow key={p.id} className="hover:bg-purple-50/30">
                          <TableCell className="text-sm font-medium">{p.receiptNo}</TableCell>
                          <TableCell className="text-sm">{p.student}</TableCell>
                          <TableCell className="text-sm font-medium">₹{p.amount.toLocaleString('en-IN')}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm">
                              <MethodIcon className="w-3.5 h-3.5 text-[var(--admin-text-subtle)]" />
                              {p.method}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-[var(--admin-text-muted)]">
                            {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${STATUS_BADGE[p.status]} text-[10px]`}>{p.status}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </PreOneCard>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}
