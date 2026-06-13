'use client';

import React from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import {
  CreditCard,
  Download,
  CheckCircle2,
  ArrowUpRight,
  CalendarDays,
  IndianRupee,
  Users,
  Database,
  Zap,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

const CURRENT_PLAN = {
  name: 'Professional',
  price: '₹4,999',
  period: '/month',
  billingDate: 'July 1, 2026',
  features: ['Up to 200 students', 'Up to 20 teachers', 'AI Insights', 'WhatsApp Integration', 'Growth Passport', 'Custom Branding', 'Priority Support'],
};

const USAGE = [
  { label: 'Students', used: 109, limit: 200, color: 'text-purple-700' },
  { label: 'Teachers', used: 4, limit: 20, color: 'text-blue-700' },
  { label: 'AI Analyses', used: 45, limit: 100, color: 'text-emerald-700' },
  { label: 'WhatsApp Messages', used: 234, limit: 500, color: 'text-amber-700' },
  { label: 'Storage', used: 2.1, limit: 5, unit: 'GB', color: 'text-red-700' },
];

const INVOICES = [
  { id: '1', month: 'June 2026', amount: '₹4,999', status: 'PAID', date: '2026-06-01' },
  { id: '2', month: 'May 2026', amount: '₹4,999', status: 'PAID', date: '2026-05-01' },
  { id: '3', month: 'April 2026', amount: '₹4,999', status: 'PAID', date: '2026-04-01' },
  { id: '4', month: 'March 2026', amount: '₹4,999', status: 'PAID', date: '2026-03-01' },
];

const PLANS = [
  { name: 'Starter', price: '₹1,999', students: 50, features: ['Basic Dashboard', 'Student Management', 'Attendance'] },
  { name: 'Professional', price: '₹4,999', students: 200, features: ['AI Insights', 'WhatsApp', 'Growth Passport', 'Custom Branding'], current: true },
  { name: 'Enterprise', price: '₹9,999', students: 'Unlimited', features: ['Everything in Pro', 'API Access', 'Dedicated Support', 'Custom Integrations'] },
];

export default function BillingSettingsPage() {
  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6" style={{ color: theme.primary }} />
            Billing & Subscription
          </h1>
          <p className="text-sm text-gray-500 mt-1">Current plan, usage, invoices, and upgrades</p>
        </StaggerItem>

        {/* Current Plan */}
        <StaggerItem>
          <PreOneCard variant="hero">
            <PreOneCardContent>
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="bg-white/20 text-white text-[10px] mb-2">Current Plan</Badge>
                  <h2 className="text-2xl font-bold text-white">{CURRENT_PLAN.name}</h2>
                  <p className="text-white/80 text-lg">{CURRENT_PLAN.price}<span className="text-sm">{CURRENT_PLAN.period}</span></p>
                  <p className="text-white/60 text-sm mt-1">Next billing: {CURRENT_PLAN.billingDate}</p>
                </div>
                <Button className="bg-white text-purple-700 hover:bg-white/90">
                  <ArrowUpRight className="w-4 h-4 mr-2" /> Upgrade Plan
                </Button>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                {CURRENT_PLAN.features.map((f) => (
                  <div key={f} className="flex items-center gap-1 text-white/80 text-xs">
                    <CheckCircle2 className="w-3 h-3" /> {f}
                  </div>
                ))}
              </div>
            </PreOneCardContent>
          </PreOneCard>
        </StaggerItem>

        {/* Usage */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Usage This Month</h3>
              <div className="space-y-4">
                {USAGE.map((u) => {
                  const pct = Math.round((u.used / u.limit) * 100);
                  return (
                    <div key={u.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{u.label}</span>
                        <span className={`text-sm font-medium ${u.color}`}>
                          {u.used}{u.unit ? ` ${u.unit}` : ''} / {u.limit}{u.unit ? ` ${u.unit}` : ''}
                        </span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </PreOneCardContent>
          </PreOneCard>
        </StaggerItem>

        {/* Plans */}
        <StaggerItem>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <PreOneCard key={plan.name} variant={plan.current ? 'strip' : 'default'} className={`p-5 ${plan.current ? 'ring-2 ring-purple-400' : ''}`}>
                <div className="text-center">
                  <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                  <p className="text-2xl font-bold mt-1" style={{ color: theme.primary }}>{plan.price}<span className="text-sm text-gray-400">/mo</span></p>
                  <p className="text-xs text-gray-500 mt-1">Up to {plan.students} students</p>
                  {plan.current && <Badge className="bg-purple-50 text-purple-700 text-[10px] mt-2">Current Plan</Badge>}
                </div>
                <div className="mt-4 space-y-1">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-1 text-xs text-gray-500">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {f}
                    </div>
                  ))}
                </div>
                <Button variant={plan.current ? 'outline' : 'default'} className="w-full mt-4" disabled={plan.current}>
                  {plan.current ? 'Current Plan' : 'Upgrade'}
                </Button>
              </PreOneCard>
            ))}
          </div>
        </StaggerItem>

        {/* Invoices */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-gray-500" /> Invoices</h3>
              <div className="space-y-2">
                {INVOICES.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inv.month}</p>
                      <p className="text-xs text-gray-400">{inv.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{inv.amount}</span>
                      <Badge className="bg-emerald-50 text-emerald-700 text-[10px]">{inv.status}</Badge>
                      <Button variant="ghost" size="sm" className="h-7 text-xs"><Download className="w-3 h-3 mr-1" /> PDF</Button>
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
