'use client';

import React from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PORTAL_THEMES, CHART_PALETTE, PRIORITY_COLORS } from '@/lib/theme-tokens';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart3,
  Download,
  TrendingUp,
  Target,
  Lightbulb,
  Users,
  IndianRupee,
  ArrowRight,
  Star,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  AreaChart,
  Area,
} from 'recharts';

const theme = PORTAL_THEMES.admin;

const LEAD_SCORING = [
  { name: 'Rahul Verma', score: 92, stage: 'Tour Completed', probability: '85%', source: 'Referral' },
  { name: 'Sneha Patel', score: 87, stage: 'Application', probability: '78%', source: 'Walk-in' },
  { name: 'Amit Kumar', score: 81, stage: 'Tour Scheduled', probability: '65%', source: 'Instagram' },
  { name: 'Priya Nair', score: 75, stage: 'Contacted', probability: '52%', source: 'Google' },
  { name: 'Deepak Shah', score: 68, stage: 'Contacted', probability: '40%', source: 'Facebook' },
  { name: 'Kavitha Rao', score: 55, stage: 'New Lead', probability: '28%', source: 'Google' },
];

const CONVERSION_PREDICTIONS = [
  { month: 'Jul', predicted: 8, actual: 0 }, { month: 'Aug', predicted: 10, actual: 0 },
  { month: 'Sep', predicted: 12, actual: 0 }, { month: 'Apr', predicted: 12, actual: 12 },
  { month: 'May', predicted: 9, actual: 9 }, { month: 'Jun', predicted: 8, actual: 8 },
];

const SOURCE_ROI = [
  { source: 'Instagram', spend: 15000, leads: 42, converted: 18, roi: 23, costPerLead: 357 },
  { source: 'Walk-in', spend: 0, leads: 28, converted: 16, roi: 0, costPerLead: 0 },
  { source: 'Referral', spend: 5000, leads: 35, converted: 15, roi: 60, costPerLead: 143 },
  { source: 'Google Ads', spend: 25000, leads: 22, converted: 8, roi: 5.4, costPerLead: 1136 },
  { source: 'Facebook', spend: 12000, leads: 18, converted: 6, roi: 10, costPerLead: 667 },
];

export default function AdmissionInsightsPage() {
  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-6 h-6" style={{ color: theme.primary }} />
                Admission Insights
              </h1>
              <p className="text-sm text-gray-500 mt-1">Lead scoring, conversion predictions, and source ROI</p>
            </div>
            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Export</Button>
          </div>
        </StaggerItem>

        {/* Stats */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">Active Leads</p>
              <p className="text-xl font-bold text-purple-700">156</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">Avg Lead Score</p>
              <p className="text-xl font-bold text-amber-700">76</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">Predicted Jul</p>
              <p className="text-xl font-bold text-emerald-700">8</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <p className="text-xs text-gray-500">Best Source</p>
              <p className="text-xl font-bold text-purple-700">Referral</p>
            </PreOneCard>
          </div>
        </StaggerItem>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Scoring */}
          <StaggerItem>
            <PreOneCard variant="default">
              <PreOneCardContent>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-purple-500" /> AI Lead Scoring</h3>
                <ScrollArea className="max-h-64">
                  <div className="space-y-3">
                    {LEAD_SCORING.map((lead) => (
                      <div key={lead.name} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50">
                        <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                          <Star className={`w-4 h-4 ${lead.score >= 80 ? 'text-emerald-600' : lead.score >= 60 ? 'text-amber-600' : 'text-red-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                          <p className="text-xs text-gray-400">{lead.stage} • {lead.source}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold" style={{ color: theme.primary }}>{lead.score}</p>
                          <p className="text-[10px] text-gray-400">{lead.probability}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>

          {/* Source ROI */}
          <StaggerItem>
            <PreOneCard variant="default">
              <PreOneCardContent>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><IndianRupee className="w-4 h-4 text-emerald-500" /> Source ROI Analysis</h3>
                <div className="space-y-3">
                  {SOURCE_ROI.map((s) => (
                    <div key={s.source} className="p-3 rounded-xl border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{s.source}</span>
                        <div className="flex items-center gap-2">
                          {s.roi > 0 && <Badge className="bg-emerald-50 text-emerald-700 text-[9px]">ROI: {s.roi}x</Badge>}
                          <Badge variant="outline" className="text-[9px]">CPL: ₹{s.costPerLead}</Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div><span className="text-gray-400">Spend</span><p className="font-medium">{s.spend > 0 ? `₹${(s.spend / 1000).toFixed(0)}K` : 'Free'}</p></div>
                        <div><span className="text-gray-400">Leads</span><p className="font-medium">{s.leads}</p></div>
                        <div><span className="text-gray-400">Converted</span><p className="font-medium text-emerald-700">{s.converted}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>

          {/* Conversion Predictions */}
          <StaggerItem className="lg:col-span-2">
            <PreOneCard variant="default" className="p-0">
              <div className="p-6 pb-2">
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Conversion Predictions</h3>
                <p className="text-sm text-gray-500 mt-0.5">AI-predicted enrollments vs actual</p>
              </div>
              <div className="px-6 pb-6">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={CONVERSION_PREDICTIONS}>
                    <defs><linearGradient id="gPred" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CHART_PALETTE.series[0]} stopOpacity={0.3} /><stop offset="95%" stopColor={CHART_PALETTE.series[0]} stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                    <RTooltip />
                    <Area type="monotone" dataKey="predicted" stroke={CHART_PALETTE.series[0]} fill="url(#gPred)" name="Predicted" />
                    <Area type="monotone" dataKey="actual" stroke={CHART_PALETTE.series[2]} fill="none" name="Actual" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </PreOneCard>
          </StaggerItem>
        </div>
      </StaggerContainer>
    </PageTransition>
  );
}
