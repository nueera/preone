'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
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
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface CurrentPlan {
  name: string;
  price: string;
  period: string;
  billingDate: string;
  features: string[];
}

interface UsageItem {
  label: string;
  used: number;
  limit: number;
  unit?: string;
  color: string;
}

interface Plan {
  name: string;
  price: string;
  period: string;
  students: number | string;
  features: string[];
  current?: boolean;
}

interface Invoice {
  id: string;
  month: string;
  amount: string;
  status: string;
  date: string;
}

interface BillingData {
  currentPlan: CurrentPlan;
  usage: UsageItem[];
  plans: Plan[];
  invoices: Invoice[];
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

function UsageProgress({ item }: { item: UsageItem }) {
  const pct = Math.min(Math.round((item.used / item.limit) * 100), 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-[var(--admin-text-muted)]">{item.label}</span>
        <span className={`text-sm font-medium ${item.color}`}>
          {item.used}{item.unit ? ` ${item.unit}` : ''} / {item.limit}{item.unit ? ` ${item.unit}` : ''}
        </span>
      </div>
      <Progress value={pct} className="h-2" />
    </div>
  );
}

export default function BillingSettingsPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBilling = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const res = await fetch('/api/settings/billing', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to load billing data');
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  if (loading) {
    return (
      <PageTransition>
        <StaggerContainer className="space-y-6">
          <StaggerItem>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-xl" />
              <div>
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-4 w-72 mt-1" />
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <Skeleton className="h-40 w-full rounded-3xl" />
          </StaggerItem>
          <StaggerItem>
            <Skeleton className="h-56 w-full rounded-3xl" />
          </StaggerItem>
          <StaggerItem>
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-48 rounded-3xl" />
              <Skeleton className="h-48 rounded-3xl" />
              <Skeleton className="h-48 rounded-3xl" />
            </div>
          </StaggerItem>
        </StaggerContainer>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <StaggerContainer className="space-y-6">
          <StaggerItem>
            <h1 className="text-2xl font-bold font-heading text-[var(--admin-text)] flex items-center gap-2">
              <CreditCard className="w-6 h-6" style={{ color: theme.primary }} />
              Billing & Subscription
            </h1>
          </StaggerItem>
          <StaggerItem>
            <PreOneCard variant="default">
              <PreOneCardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
                  <p className="text-[var(--admin-text)] font-medium mb-1">Failed to load billing data</p>
                  <p className="text-sm text-[var(--admin-text-muted)] mb-4">{error}</p>
                  <Button onClick={fetchBilling} variant="outline" className="rounded-xl">
                    <RefreshCw className="w-4 h-4 mr-2" /> Retry
                  </Button>
                </div>
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>
        </StaggerContainer>
      </PageTransition>
    );
  }

  if (!data) return null;

  const { currentPlan, usage, plans, invoices } = data;

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <h1 className="text-2xl font-bold font-heading text-[var(--admin-text)] flex items-center gap-2">
            <CreditCard className="w-6 h-6" style={{ color: theme.primary }} />
            Billing & Subscription
          </h1>
          <p className="text-sm text-[var(--admin-text-muted)] mt-1">Current plan, usage, invoices, and upgrades</p>
        </StaggerItem>

        {/* Current Plan */}
        <StaggerItem>
          <PreOneCard variant="hero">
            <PreOneCardContent>
              <div className="flex items-start justify-between">
                <div>
                  <Badge className="bg-white/20 text-white text-[10px] mb-2">Current Plan</Badge>
                  <h2 className="text-2xl font-bold text-white">{currentPlan.name}</h2>
                  <p className="text-white/80 text-lg">{currentPlan.price}<span className="text-sm">{currentPlan.period}</span></p>
                  <p className="text-white/60 text-sm mt-1">Next billing: {currentPlan.billingDate}</p>
                </div>
                <Button className="bg-white text-purple-700 hover:bg-white/90">
                  <ArrowUpRight className="w-4 h-4 mr-2" /> Upgrade Plan
                </Button>
              </div>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                {currentPlan.features.map((f) => (
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
              <h3 className="font-semibold text-[var(--admin-text)] mb-4 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Usage This Month</h3>
              <div className="space-y-4">
                {usage.map((u) => (
                  <UsageProgress key={u.label} item={u} />
                ))}
              </div>
            </PreOneCardContent>
          </PreOneCard>
        </StaggerItem>

        {/* Plans */}
        <StaggerItem>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <PreOneCard key={plan.name} variant={plan.current ? 'strip' : 'default'} className={`p-5 ${plan.current ? 'ring-2 ring-purple-400' : ''}`}>
                <div className="text-center">
                  <h4 className="font-semibold text-[var(--admin-text)]">{plan.name}</h4>
                  <p className="text-2xl font-bold mt-1" style={{ color: theme.primary }}>{plan.price}<span className="text-sm text-[var(--admin-text-subtle)]">/mo</span></p>
                  <p className="text-xs text-[var(--admin-text-muted)] mt-1">Up to {plan.students} students</p>
                  {plan.current && <Badge className="bg-purple-50 text-purple-700 text-[10px] mt-2">Current Plan</Badge>}
                </div>
                <div className="mt-4 space-y-1">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-1 text-xs text-[var(--admin-text-muted)]">
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
              <h3 className="font-semibold text-[var(--admin-text)] mb-4 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-[var(--admin-text-muted)]" /> Invoices</h3>
              <div className="space-y-2">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl border">
                    <div>
                      <p className="text-sm font-medium text-[var(--admin-text)]">{inv.month}</p>
                      <p className="text-xs text-[var(--admin-text-subtle)]">{inv.date}</p>
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
