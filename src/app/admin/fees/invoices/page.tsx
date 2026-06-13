'use client';

import React, { useState, useMemo } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PORTAL_THEMES, FEE_COLORS } from '@/lib/theme-tokens';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FileText,
  Plus,
  Search,
  Download,
  Filter,
  IndianRupee,
  Send,
  Eye,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface Invoice {
  id: string;
  invoiceNo: string;
  student: string;
  class: string;
  amount: number;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL';
  createdAt: string;
}

const MOCK_INVOICES: Invoice[] = [
  { id: '1', invoiceNo: 'INV-2026-001', student: 'Aarav Kumar', class: 'Nursery-A', amount: 18750, dueDate: '2026-04-01', status: 'PAID', createdAt: '2026-03-15' },
  { id: '2', invoiceNo: 'INV-2026-012', student: 'Priya Sharma', class: 'LKG-B', amount: 22500, dueDate: '2026-04-05', status: 'PAID', createdAt: '2026-03-20' },
  { id: '3', invoiceNo: 'INV-2026-034', student: 'Vihaan Singh', class: 'UKG-A', amount: 23750, dueDate: '2026-07-01', status: 'PENDING', createdAt: '2026-06-01' },
  { id: '4', invoiceNo: 'INV-2026-050', student: 'Isha Sharma', class: 'Nursery-B', amount: 15000, dueDate: '2026-03-01', status: 'OVERDUE', createdAt: '2026-02-15' },
  { id: '5', invoiceNo: 'INV-2026-058', student: 'Arjun Patel', class: 'LKG-A', amount: 20000, dueDate: '2026-07-15', status: 'PENDING', createdAt: '2026-06-10' },
  { id: '6', invoiceNo: 'INV-2026-063', student: 'Ananya Gupta', class: 'UKG-B', amount: 17500, dueDate: '2026-04-10', status: 'PARTIAL', createdAt: '2026-03-25' },
  { id: '7', invoiceNo: 'INV-2026-075', student: 'Rohan Mehta', class: 'Nursery-A', amount: 18750, dueDate: '2026-04-01', status: 'PAID', createdAt: '2026-03-18' },
  { id: '8', invoiceNo: 'INV-2026-080', student: 'Meera Joshi', class: 'LKG-B', amount: 22500, dueDate: '2026-02-28', status: 'OVERDUE', createdAt: '2026-02-10' },
];

const STATUS_BADGE: Record<string, string> = {
  PAID: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  OVERDUE: 'bg-red-50 text-red-700',
  PARTIAL: 'bg-yellow-50 text-yellow-700',
};

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredInvoices = useMemo(() => {
    return MOCK_INVOICES.filter((inv) => {
      const matchSearch = !searchQuery ||
        inv.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [searchQuery, statusFilter]);

  const totalAmount = filteredInvoices.reduce((s, i) => s + i.amount, 0);
  const paidAmount = filteredInvoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.amount, 0);

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        {/* Header */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-6 h-6" style={{ color: theme.primary }} />
                Invoice Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">Create, manage and track invoices</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
              <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md">
                <Plus className="w-4 h-4 mr-2" /> Generate Invoice
              </Button>
            </div>
          </div>
        </StaggerItem>

        {/* Stats Row */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Invoiced', value: `₹${totalAmount.toLocaleString('en-IN')}`, color: 'text-purple-700 bg-purple-50' },
              { label: 'Collected', value: `₹${paidAmount.toLocaleString('en-IN')}`, color: 'text-emerald-700 bg-emerald-50' },
              { label: 'Pending', value: `${filteredInvoices.filter((i) => i.status === 'PENDING').length}`, color: 'text-amber-700 bg-amber-50' },
              { label: 'Overdue', value: `${filteredInvoices.filter((i) => i.status === 'OVERDUE').length}`, color: 'text-red-700 bg-red-50' },
            ].map((stat) => (
              <PreOneCard key={stat.label} variant="strip" className="p-4">
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className={`text-lg font-bold mt-1 ${stat.color.split(' ')[0]}`}>{stat.value}</p>
              </PreOneCard>
            ))}
          </div>
        </StaggerItem>

        {/* Filters */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by student or invoice number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-1.5">
              {['all', 'PAID', 'PENDING', 'OVERDUE', 'PARTIAL'].map((s) => (
                <Badge
                  key={s}
                  variant={statusFilter === s ? 'default' : 'outline'}
                  className="cursor-pointer text-[10px]"
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'all' ? 'All' : s}
                </Badge>
              ))}
            </div>
          </div>
        </StaggerItem>

        {/* Invoice Table */}
        <StaggerItem>
          <PreOneCard variant="default">
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-purple-50/30">
                      <TableCell className="text-sm font-medium">{inv.invoiceNo}</TableCell>
                      <TableCell className="text-sm">{inv.student}</TableCell>
                      <TableCell className="text-sm text-gray-500">{inv.class}</TableCell>
                      <TableCell className="text-sm font-medium">₹{inv.amount.toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(inv.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${STATUS_BADGE[inv.status]} text-[10px]`}>{inv.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
                            <Eye className="w-3 h-3 mr-1" /> View
                          </Button>
                          {inv.status !== 'PAID' && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-purple-600">
                              <Send className="w-3 h-3 mr-1" /> Remind
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </PreOneCard>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}
