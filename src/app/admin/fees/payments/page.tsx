'use client';

import React, { useState, useMemo } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
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
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface Payment {
  id: string;
  receiptNo: string;
  student: string;
  amount: number;
  method: 'Cash' | 'UPI' | 'Bank Transfer' | 'Card';
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  date: string;
  invoiceNo: string;
}

const MOCK_PAYMENTS: Payment[] = [
  { id: '1', receiptNo: 'RCP-001', student: 'Aarav Kumar', amount: 18750, method: 'UPI', status: 'COMPLETED', date: '2026-03-28', invoiceNo: 'INV-2026-001' },
  { id: '2', receiptNo: 'RCP-002', student: 'Priya Sharma', amount: 22500, method: 'Bank Transfer', status: 'COMPLETED', date: '2026-04-02', invoiceNo: 'INV-2026-012' },
  { id: '3', receiptNo: 'RCP-003', student: 'Ananya Gupta', amount: 10000, method: 'Cash', status: 'COMPLETED', date: '2026-04-05', invoiceNo: 'INV-2026-063' },
  { id: '4', receiptNo: 'RCP-004', student: 'Rohan Mehta', amount: 18750, method: 'Card', status: 'COMPLETED', date: '2026-03-30', invoiceNo: 'INV-2026-075' },
  { id: '5', receiptNo: 'RCP-005', student: 'Vihaan Singh', amount: 23750, method: 'UPI', status: 'PENDING', date: '2026-06-15', invoiceNo: 'INV-2026-034' },
  { id: '6', receiptNo: 'RCP-006', student: 'Sara Khan', amount: 15000, method: 'Bank Transfer', status: 'FAILED', date: '2026-06-12', invoiceNo: 'INV-2026-088' },
  { id: '7', receiptNo: 'RCP-007', student: 'Kabir Reddy', amount: 20000, method: 'Cash', status: 'COMPLETED', date: '2026-05-20', invoiceNo: 'INV-2026-042' },
  { id: '8', receiptNo: 'RCP-008', student: 'Diya Nair', amount: 17500, method: 'UPI', status: 'COMPLETED', date: '2026-05-28', invoiceNo: 'INV-2026-055' },
];

const METHOD_ICON: Record<string, React.ElementType> = {
  Cash: Banknote,
  UPI: Smartphone,
  'Bank Transfer': CreditCard,
  Card: CreditCard,
};

const STATUS_BADGE: Record<string, string> = {
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  FAILED: 'bg-red-50 text-red-700',
};

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  const filteredPayments = useMemo(() => {
    return MOCK_PAYMENTS.filter((p) => {
      const matchSearch = !searchQuery ||
        p.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.receiptNo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchMethod = methodFilter === 'all' || p.method === methodFilter;
      return matchSearch && matchMethod;
    });
  }, [searchQuery, methodFilter]);

  const totalCollected = MOCK_PAYMENTS.filter((p) => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0);
  const pendingAmount = MOCK_PAYMENTS.filter((p) => p.status === 'PENDING').reduce((s, p) => s + p.amount, 0);

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        {/* Header */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <IndianRupee className="w-6 h-6" style={{ color: theme.primary }} />
                Payment Tracking
              </h1>
              <p className="text-sm text-gray-500 mt-1">Record and track all fee payments</p>
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
                  <p className="text-xs text-gray-500">Collected</p>
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
                  <p className="text-xs text-gray-500">Pending</p>
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
                  <p className="text-xs text-gray-500">Transactions</p>
                  <p className="text-lg font-bold text-purple-700">{MOCK_PAYMENTS.length}</p>
                </div>
              </div>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Failed</p>
                  <p className="text-lg font-bold text-red-700">{MOCK_PAYMENTS.filter((p) => p.status === 'FAILED').length}</p>
                </div>
              </div>
            </PreOneCard>
          </div>
        </StaggerItem>

        {/* Filters */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by student or receipt number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1.5">
              {['all', 'Cash', 'UPI', 'Bank Transfer', 'Card'].map((m) => (
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
                  {filteredPayments.map((p) => {
                    const MethodIcon = METHOD_ICON[p.method] || CreditCard;
                    return (
                      <TableRow key={p.id} className="hover:bg-purple-50/30">
                        <TableCell className="text-sm font-medium">{p.receiptNo}</TableCell>
                        <TableCell className="text-sm">{p.student}</TableCell>
                        <TableCell className="text-sm font-medium">₹{p.amount.toLocaleString('en-IN')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm">
                            <MethodIcon className="w-3.5 h-3.5 text-gray-400" />
                            {p.method}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${STATUS_BADGE[p.status]} text-[10px]`}>{p.status}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </PreOneCard>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}
