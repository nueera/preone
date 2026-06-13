'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  IndianRupee,
  Download,
  FileText,
  Wallet,
  TrendingUp,
  Receipt,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Building2,
  Percent,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface SalaryComponent {
  name: string;
  type: 'EARNING' | 'DEDUCTION';
  amount: number;
}

interface Payslip {
  id: string;
  month: string;
  year: number;
  gross: number;
  deductions: number;
  net: number;
  status: 'PAID' | 'PROCESSING' | 'PENDING';
  paidOn?: string;
}

const SALARY_STRUCTURE: SalaryComponent[] = [
  { name: 'Basic Salary', type: 'EARNING', amount: 25000 },
  { name: 'HRA', type: 'EARNING', amount: 10000 },
  { name: 'Transport Allowance', type: 'EARNING', amount: 3000 },
  { name: 'Special Allowance', type: 'EARNING', amount: 5000 },
  { name: 'Medical Allowance', type: 'EARNING', amount: 2500 },
  { name: 'PF (Employer)', type: 'EARNING', amount: 3000 },
  { name: 'PF (Employee)', type: 'DEDUCTION', amount: 3000 },
  { name: 'ESI', type: 'DEDUCTION', amount: 875 },
  { name: 'Professional Tax', type: 'DEDUCTION', amount: 200 },
  { name: 'TDS', type: 'DEDUCTION', amount: 2500 },
];

const MOCK_PAYSLIPS: Payslip[] = [
  { id: '1', month: 'June', year: 2026, gross: 48500, deductions: 6575, net: 41925, status: 'PENDING' },
  { id: '2', month: 'May', year: 2026, gross: 48500, deductions: 6575, net: 41925, status: 'PAID', paidOn: '2026-05-31' },
  { id: '3', month: 'April', year: 2026, gross: 48500, deductions: 6575, net: 41925, status: 'PAID', paidOn: '2026-04-30' },
  { id: '4', month: 'March', year: 2026, gross: 48500, deductions: 6575, net: 41925, status: 'PAID', paidOn: '2026-03-31' },
  { id: '5', month: 'February', year: 2026, gross: 48500, deductions: 6575, net: 41925, status: 'PAID', paidOn: '2026-02-28' },
  { id: '6', month: 'January', year: 2026, gross: 48500, deductions: 6575, net: 41925, status: 'PAID', paidOn: '2026-01-31' },
];

const STATUS_BADGE: Record<string, string> = {
  PAID: 'bg-emerald-50 text-emerald-700',
  PROCESSING: 'bg-amber-50 text-amber-700',
  PENDING: 'bg-blue-50 text-blue-700',
};

const totalEarnings = SALARY_STRUCTURE.filter((s) => s.type === 'EARNING').reduce((s, c) => s + c.amount, 0);
const totalDeductions = SALARY_STRUCTURE.filter((s) => s.type === 'DEDUCTION').reduce((s, c) => s + c.amount, 0);
const netSalary = totalEarnings - totalDeductions;

export default function TeacherPayrollPage() {
  const params = useParams();
  const teacherId = params?.id as string;

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Wallet className="w-6 h-6" style={{ color: theme.primary }} />
                Payroll
              </h1>
              <p className="text-sm text-gray-500 mt-1">Teacher ID: {teacherId}</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md">
              <CreditCard className="w-4 h-4 mr-2" /> Process Payroll
            </Button>
          </div>
        </StaggerItem>

        {/* Salary Summary */}
        <StaggerItem>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Gross Salary</p>
                  <p className="text-lg font-bold text-emerald-700">₹{totalEarnings.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <Percent className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Deductions</p>
                  <p className="text-lg font-bold text-red-700">₹{totalDeductions.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Net Salary</p>
                  <p className="text-lg font-bold text-purple-700">₹{netSalary.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </PreOneCard>
          </div>
        </StaggerItem>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Salary Structure */}
          <StaggerItem>
            <PreOneCard variant="default">
              <PreOneCardContent>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500" /> Salary Structure
                </h3>
                <div className="space-y-2">
                  {SALARY_STRUCTURE.filter((s) => s.type === 'EARNING').map((c) => (
                    <div key={c.name} className="flex items-center justify-between py-2 border-b border-gray-50">
                      <span className="text-sm text-gray-600">{c.name}</span>
                      <span className="text-sm font-medium text-emerald-700">+₹{c.amount.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400 uppercase">Deductions</span>
                    </div>
                    {SALARY_STRUCTURE.filter((s) => s.type === 'DEDUCTION').map((c) => (
                      <div key={c.name} className="flex items-center justify-between py-2 border-b border-gray-50">
                        <span className="text-sm text-gray-600">{c.name}</span>
                        <span className="text-sm font-medium text-red-600">-₹{c.amount.toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-3 mt-2 border-t-2">
                    <span className="text-sm font-bold text-gray-900">Net Pay</span>
                    <span className="text-lg font-bold" style={{ color: theme.primary }}>₹{netSalary.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>

          {/* Payslip History */}
          <StaggerItem>
            <PreOneCard variant="default">
              <PreOneCardContent>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-gray-500" /> Payslip History
                </h3>
                <ScrollArea className="max-h-96">
                  <div className="space-y-3">
                    {MOCK_PAYSLIPS.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                            <CalendarDays className="w-5 h-5 text-purple-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{p.month} {p.year}</p>
                            <p className="text-xs text-gray-400">Net: ₹{p.net.toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${STATUS_BADGE[p.status]} text-[10px]`}>{p.status}</Badge>
                          {p.status === 'PAID' && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                              <Download className="w-3 h-3 mr-1" /> PDF
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>
        </div>
      </StaggerContainer>
    </PageTransition>
  );
}
