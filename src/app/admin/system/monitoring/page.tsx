'use client';

import React, { useState } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PORTAL_THEMES, CHART_PALETTE } from '@/lib/theme-tokens';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  Server,
  Database,
  Clock,
  Wifi,
  HardDrive,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowDownUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
} from 'recharts';

const theme = PORTAL_THEMES.admin;

const RESPONSE_TIME_DATA = [
  { time: '00:00', api: 89, db: 12 }, { time: '04:00', api: 65, db: 8 },
  { time: '08:00', api: 145, db: 25 }, { time: '09:00', api: 198, db: 35 },
  { time: '10:00', api: 167, db: 28 }, { time: '12:00', api: 120, db: 18 },
  { time: '14:00', api: 156, db: 30 }, { time: '16:00', api: 134, db: 22 },
  { time: '18:00', api: 98, db: 15 }, { time: '20:00', api: 78, db: 10 },
  { time: '23:59', api: 72, db: 9 },
];

const ERROR_RATE_DATA = [
  { time: '00:00', rate: 0.1 }, { time: '04:00', rate: 0.0 },
  { time: '08:00', rate: 0.3 }, { time: '09:00', rate: 0.8 },
  { time: '10:00', rate: 0.5 }, { time: '12:00', rate: 0.2 },
  { time: '14:00', rate: 0.4 }, { time: '16:00', rate: 0.3 },
  { time: '18:00', rate: 0.1 }, { time: '20:00', rate: 0.0 },
  { time: '23:59', rate: 0.1 },
];

const SERVICES = [
  { name: 'API Server', status: 'HEALTHY', uptime: '99.97%', responseTime: '89ms', lastCheck: 'Just now', icon: Server },
  { name: 'Database', status: 'HEALTHY', uptime: '99.99%', responseTime: '12ms', lastCheck: 'Just now', icon: Database },
  { name: 'WhatsApp Service', status: 'HEALTHY', uptime: '99.85%', responseTime: '245ms', lastCheck: '30s ago', icon: Wifi },
  { name: 'File Storage', status: 'HEALTHY', uptime: '99.99%', responseTime: '56ms', lastCheck: '1m ago', icon: HardDrive },
  { name: 'AI Engine', status: 'DEGRADED', uptime: '99.50%', responseTime: '1.2s', lastCheck: '2m ago', icon: Cpu },
  { name: 'Email Service', status: 'HEALTHY', uptime: '99.95%', responseTime: '180ms', lastCheck: '5m ago', icon: Activity },
];

const DB_STATS = {
  size: '245 MB',
  tables: 42,
  connections: 8,
  maxConnections: 20,
  queriesPerSecond: 15,
  slowQueries: 2,
};

const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
  HEALTHY: { color: 'text-emerald-700', bg: 'bg-emerald-50' },
  DEGRADED: { color: 'text-amber-700', bg: 'bg-amber-50' },
  DOWN: { color: 'text-red-700', bg: 'bg-red-50' },
};

export default function SystemMonitoringPage() {
  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-6 h-6" style={{ color: theme.primary }} />
                System Monitoring
              </h1>
              <p className="text-sm text-gray-500 mt-1">Server health, performance metrics, and uptime</p>
            </div>
            <Button variant="outline" size="sm"><RefreshCw className="w-4 h-4 mr-2" /> Refresh</Button>
          </div>
        </StaggerItem>

        {/* Health Overview */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-xs text-gray-500">Overall Status</span></div>
              <p className="text-lg font-bold text-emerald-700">Healthy</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-purple-600" /><span className="text-xs text-gray-500">Uptime (30d)</span></div>
              <p className="text-lg font-bold text-purple-700">99.94%</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-2"><ArrowDownUp className="w-4 h-4 text-blue-600" /><span className="text-xs text-gray-500">Avg Response</span></div>
              <p className="text-lg font-bold text-blue-700">127ms</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-600" /><span className="text-xs text-gray-500">Active Alerts</span></div>
              <p className="text-lg font-bold text-amber-700">1</p>
            </PreOneCard>
          </div>
        </StaggerItem>

        {/* Service Table */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-gray-900 mb-4">Services</h3>
              <div className="space-y-2">
                {SERVICES.map((s) => {
                  const statusCfg = STATUS_CONFIG[s.status];
                  const Icon = s.icon;
                  return (
                    <div key={s.name} className="flex items-center justify-between p-3 rounded-xl border hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{s.name}</p>
                          <p className="text-xs text-gray-400">Last check: {s.lastCheck}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-gray-400">Response</p>
                          <p className="text-sm font-medium">{s.responseTime}</p>
                        </div>
                        <div className="text-right hidden sm:block">
                          <p className="text-xs text-gray-400">Uptime</p>
                          <p className="text-sm font-medium">{s.uptime}</p>
                        </div>
                        <Badge className={`${statusCfg.bg} ${statusCfg.color} text-[10px]`}>{s.status}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </PreOneCardContent>
          </PreOneCard>
        </StaggerItem>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* API Response Times */}
          <StaggerItem>
            <PreOneCard variant="default" className="p-0">
              <div className="p-6 pb-2"><h3 className="text-base font-semibold text-gray-900">API Response Times (24h)</h3></div>
              <div className="px-6 pb-6">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={RESPONSE_TIME_DATA}>
                    <defs>
                      <linearGradient id="gApi" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CHART_PALETTE.series[0]} stopOpacity={0.3} /><stop offset="95%" stopColor={CHART_PALETTE.series[0]} stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} unit="ms" />
                    <RTooltip />
                    <Area type="monotone" dataKey="api" stroke={CHART_PALETTE.series[0]} fill="url(#gApi)" name="API" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </PreOneCard>
          </StaggerItem>

          {/* Error Rate */}
          <StaggerItem>
            <PreOneCard variant="default" className="p-0">
              <div className="p-6 pb-2"><h3 className="text-base font-semibold text-gray-900">Error Rate (24h)</h3></div>
              <div className="px-6 pb-6">
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={ERROR_RATE_DATA}>
                    <defs>
                      <linearGradient id="gErr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CHART_PALETTE.series[4]} stopOpacity={0.3} /><stop offset="95%" stopColor={CHART_PALETTE.series[4]} stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} unit="%" />
                    <RTooltip />
                    <Area type="monotone" dataKey="rate" stroke={CHART_PALETTE.series[4]} fill="url(#gErr)" name="Error %" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </PreOneCard>
          </StaggerItem>
        </div>

        {/* Database Stats */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Database className="w-4 h-4 text-gray-500" /> Database Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-xl border"><p className="text-xs text-gray-400">Size</p><p className="text-lg font-bold text-purple-700">{DB_STATS.size}</p></div>
                <div className="p-3 rounded-xl border"><p className="text-xs text-gray-400">Tables</p><p className="text-lg font-bold text-blue-700">{DB_STATS.tables}</p></div>
                <div className="p-3 rounded-xl border"><p className="text-xs text-gray-400">Connections</p><p className="text-lg font-bold text-emerald-700">{DB_STATS.connections}/{DB_STATS.maxConnections}</p><Progress value={(DB_STATS.connections / DB_STATS.maxConnections) * 100} className="h-1 mt-1" /></div>
                <div className="p-3 rounded-xl border"><p className="text-xs text-gray-400">Queries/sec</p><p className="text-lg font-bold text-amber-700">{DB_STATS.queriesPerSecond}</p></div>
                <div className="p-3 rounded-xl border"><p className="text-xs text-gray-400">Slow Queries</p><p className="text-lg font-bold text-red-700">{DB_STATS.slowQueries}</p></div>
              </div>
            </PreOneCardContent>
          </PreOneCard>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}
