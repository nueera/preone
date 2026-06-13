"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  AlertTriangle, Bug, CheckCircle, ChevronDown, ChevronUp, Clock,
  Database, ExternalLink, Filter, Monitor, RefreshCw, Search,
  Server, Shield, Trash2, Wifi, XCircle, Loader2, ArrowUp, ArrowDown, Minus
} from 'lucide-react';

// ====== Types ======

interface ErrorLogEntry {
  id: string;
  message: string;
  stack?: string;
  type?: string;
  source: string;
  severity: string;
  status: string;
  url?: string;
  method?: string;
  apiRoute?: string;
  lineNumber?: number;
  fileName?: string;
  userId?: string;
  userRole?: string;
  occurrenceCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  tags?: string;
  metadata?: string;
  statusCode?: number;
  userAgent?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface ErrorStats {
  summary: {
    total: number;
    new: number;
    acknowledged: number;
    investigating: number;
    resolved: number;
    ignored: number;
    unresolved: number;
  };
  severity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  bySource: { source: string; count: number }[];
  topErrors: {
    id: string;
    message: string;
    source: string;
    severity: string;
    occurrenceCount: number;
    lastSeenAt: string;
  }[];
  recentErrors: {
    id: string;
    message: string;
    source: string;
    severity: string;
    status: string;
    occurrenceCount: number;
    lastSeenAt: string;
  }[];
  trend: {
    direction: 'UP' | 'DOWN' | 'STABLE';
    percent: number;
    recent24h: number;
    previous24h: number;
  };
  resolvedToday: number;
  avgResolutionTime: string;
}

// ====== Helpers ======

function timeAgo(date: string): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function getSourceIcon(source: string) {
  switch (source) {
    case 'FRONTEND': return <Monitor className="w-4 h-4" />;
    case 'BACKEND': return <Server className="w-4 h-4" />;
    case 'DATABASE': return <Database className="w-4 h-4" />;
    case 'AUTH': return <Shield className="w-4 h-4" />;
    case 'EXTERNAL': return <ExternalLink className="w-4 h-4" />;
    case 'SOCKET': return <Wifi className="w-4 h-4" />;
    default: return <Bug className="w-4 h-4" />;
  }
}

function getSourceColor(source: string): string {
  switch (source) {
    case 'FRONTEND': return 'text-blue-400 bg-blue-400/10';
    case 'BACKEND': return 'text-amber-400 bg-amber-400/10';
    case 'DATABASE': return 'text-purple-400 bg-purple-400/10';
    case 'AUTH': return 'text-rose-400 bg-rose-400/10';
    case 'EXTERNAL': return 'text-cyan-400 bg-cyan-400/10';
    case 'SOCKET': return 'text-teal-400 bg-teal-400/10';
    default: return 'text-gray-400 bg-gray-400/10';
  }
}

function getSeverityConfig(severity: string) {
  switch (severity) {
    case 'CRITICAL': return { color: 'text-red-400 bg-red-400/10 border-red-400/20', dot: 'bg-red-400', label: 'Critical' };
    case 'HIGH': return { color: 'text-orange-400 bg-orange-400/10 border-orange-400/20', dot: 'bg-orange-400', label: 'High' };
    case 'MEDIUM': return { color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', dot: 'bg-yellow-400', label: 'Medium' };
    case 'LOW': return { color: 'text-green-400 bg-green-400/10 border-green-400/20', dot: 'bg-green-400', label: 'Low' };
    default: return { color: 'text-gray-400 bg-gray-400/10 border-gray-400/20', dot: 'bg-gray-400', label: severity };
  }
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'NEW': return { color: 'text-blue-400 bg-blue-400/10', icon: <AlertTriangle className="w-3 h-3" />, label: 'New' };
    case 'ACKNOWLEDGED': return { color: 'text-amber-400 bg-amber-400/10', icon: <CheckCircle className="w-3 h-3" />, label: 'Acknowledged' };
    case 'INVESTIGATING': return { color: 'text-purple-400 bg-purple-400/10', icon: <Search className="w-3 h-3" />, label: 'Investigating' };
    case 'RESOLVED': return { color: 'text-green-400 bg-green-400/10', icon: <CheckCircle className="w-3 h-3" />, label: 'Resolved' };
    case 'IGNORED': return { color: 'text-gray-400 bg-gray-400/10', icon: <XCircle className="w-3 h-3" />, label: 'Ignored' };
    default: return { color: 'text-gray-400 bg-gray-400/10', icon: null, label: status };
  }
}

// ====== Main Page ======

export default function ErrorMonitorPage() {
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [errors, setErrors] = useState<ErrorLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [bulkAction, setBulkAction] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 20;

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/errors/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, []);

  const fetchErrors = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterSeverity !== 'all') params.set('severity', filterSeverity);
      if (filterSource !== 'all') params.set('source', filterSource);
      params.set('page', page.toString());
      params.set('limit', LIMIT.toString());

      const res = await fetch(`/api/errors/list?${params}`);
      if (res.ok) {
        const data = await res.json();
        setErrors(data.errors || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch errors:', err);
    }
  }, [searchQuery, filterStatus, filterSeverity, filterSource, page]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), fetchErrors()]);
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  }, [fetchStats, fetchErrors]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchErrors()]);
      setLoading(false);
    };
    init();
  }, [fetchStats, fetchErrors]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
      fetchErrors();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchErrors]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === errors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(errors.map(e => e.id)));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.size === 0) {
      toast.error('Select errors and an action');
      return;
    }

    try {
      const res = await fetch('/api/errors/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorIds: Array.from(selectedIds),
          action: bulkAction,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`${data.count} errors ${bulkAction}d`);
        setSelectedIds(new Set());
        setBulkAction('');
        refreshAll();
      } else {
        toast.error('Bulk action failed');
      }
    } catch {
      toast.error('Failed to perform bulk action');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/errors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Status updated to ${newStatus}`);
        refreshAll();
      } else {
        toast.error('Failed to update status');
      }
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/errors/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Error deleted');
        setExpandedId(null);
        refreshAll();
      } else {
        toast.error('Failed to delete');
      }
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--preone-primary)] mx-auto mb-3" />
          <p className="text-sm text-[var(--text-muted)]">Loading error monitor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6" data-portal="admin">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-[var(--preone-primary)]" />
            Error Monitor
          </h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            Track, investigate, and resolve application errors
          </p>
        </div>
        <Button
          onClick={refreshAll}
          disabled={refreshing}
          className="bg-[var(--preone-primary)] hover:bg-[var(--preone-primary)]/90 text-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            label="Total"
            value={stats.summary.total}
            icon={<Bug className="w-4 h-4" />}
            color="text-[var(--text-primary)] bg-[var(--bg-secondary)]"
          />
          <StatCard
            label="New"
            value={stats.summary.new}
            icon={<AlertTriangle className="w-4 h-4" />}
            color="text-blue-400 bg-blue-400/10"
          />
          <StatCard
            label="Acknowledged"
            value={stats.summary.acknowledged}
            icon={<CheckCircle className="w-4 h-4" />}
            color="text-amber-400 bg-amber-400/10"
          />
          <StatCard
            label="Investigating"
            value={stats.summary.investigating}
            icon={<Search className="w-4 h-4" />}
            color="text-purple-400 bg-purple-400/10"
          />
          <StatCard
            label="Resolved"
            value={stats.summary.resolved}
            icon={<CheckCircle className="w-4 h-4" />}
            color="text-green-400 bg-green-400/10"
          />
          <StatCard
            label="Unresolved"
            value={stats.summary.unresolved}
            icon={<XCircle className="w-4 h-4" />}
            color="text-red-400 bg-red-400/10"
            highlight
          />
        </div>
      )}

      {/* Second Row: Severity + Trend + Source */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Severity Breakdown */}
          <Card className="p-4 bg-[var(--card)] border-[var(--border-default)]">
            <h3 className="text-sm font-medium text-[var(--text-tertiary)] mb-3">Severity Breakdown</h3>
            <div className="space-y-2">
              {[
                { label: 'Critical', value: stats.severity.critical, color: 'bg-red-400', textColor: 'text-red-400' },
                { label: 'High', value: stats.severity.high, color: 'bg-orange-400', textColor: 'text-orange-400' },
                { label: 'Medium', value: stats.severity.medium, color: 'bg-yellow-400', textColor: 'text-yellow-400' },
                { label: 'Low', value: stats.severity.low, color: 'bg-green-400', textColor: 'text-green-400' },
              ].map((s) => {
                const total = stats.summary.total || 1;
                const pct = Math.round((s.value / total) * 100);
                return (
                  <div key={s.label} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${s.color}`} />
                    <span className="text-sm text-[var(--text-tertiary)] flex-1">{s.label}</span>
                    <span className={`text-sm font-medium ${s.textColor}`}>{s.value}</span>
                    <div className="w-20 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                      <div className={`h-full rounded-full ${s.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Trend & Resolution */}
          <Card className="p-4 bg-[var(--card)] border-[var(--border-default)]">
            <h3 className="text-sm font-medium text-[var(--text-tertiary)] mb-3">Trend (24h)</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {stats.trend.direction === 'UP' && <ArrowUp className="w-5 h-5 text-red-400" />}
                {stats.trend.direction === 'DOWN' && <ArrowDown className="w-5 h-5 text-green-400" />}
                {stats.trend.direction === 'STABLE' && <Minus className="w-5 h-5 text-[var(--text-muted)]" />}
                <div>
                  <p className="text-lg font-semibold text-[var(--text-primary)]">
                    {stats.trend.direction === 'STABLE' ? 'Stable' : `${stats.trend.percent}%`}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {stats.trend.recent24h} errors in last 24h vs {stats.trend.previous24h} previous
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-[var(--text-tertiary)]">{stats.resolvedToday} resolved today</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                <span className="text-[var(--text-tertiary)]">Avg resolution: {stats.avgResolutionTime}</span>
              </div>
            </div>
          </Card>

          {/* Source Distribution */}
          <Card className="p-4 bg-[var(--card)] border-[var(--border-default)]">
            <h3 className="text-sm font-medium text-[var(--text-tertiary)] mb-3">By Source</h3>
            <div className="space-y-2">
              {stats.bySource.map((s) => (
                <div key={s.source} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${getSourceColor(s.source)}`}>
                    {getSourceIcon(s.source)}
                  </div>
                  <span className="text-sm text-[var(--text-tertiary)] flex-1">{s.source}</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">{s.count}</span>
                </div>
              ))}
              {stats.bySource.length === 0 && (
                <p className="text-sm text-[var(--text-muted)] text-center py-2">No errors yet</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Top Recurring Errors */}
      {stats && stats.topErrors.length > 0 && (
        <Card className="p-4 bg-[var(--card)] border-[var(--border-default)]">
          <h3 className="text-sm font-medium text-[var(--text-tertiary)] mb-3">🔥 Top Recurring Errors</h3>
          <div className="space-y-2">
            {stats.topErrors.map((err, i) => {
              const sevConfig = getSeverityConfig(err.severity);
              return (
                <div
                  key={err.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                  onClick={() => setExpandedId(expandedId === err.id ? null : err.id)}
                >
                  <span className="text-xs text-[var(--text-muted)] w-5">#{i + 1}</span>
                  <div className={`w-2 h-2 rounded-full ${sevConfig.dot}`} />
                  <p className="text-sm text-[var(--text-primary)] flex-1 truncate">{err.message}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getSourceColor(err.source)}`}>
                    {err.source}
                  </span>
                  <span className="text-xs font-medium text-[var(--preone-primary)]">{err.occurrenceCount}×</span>
                  <span className="text-xs text-[var(--text-muted)]">{timeAgo(err.lastSeenAt)}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <Input
            placeholder="Search errors by message..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="pl-9 bg-[var(--bg-secondary)] border-[var(--border-default)]"
          />
        </div>
        <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1); }}>
          <SelectTrigger className="w-full md:w-[160px] bg-[var(--bg-secondary)] border-[var(--border-default)]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="NEW">New</SelectItem>
            <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
            <SelectItem value="INVESTIGATING">Investigating</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="IGNORED">Ignored</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSeverity} onValueChange={(v) => { setFilterSeverity(v); setPage(1); }}>
          <SelectTrigger className="w-full md:w-[160px] bg-[var(--bg-secondary)] border-[var(--border-default)]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSource} onValueChange={(v) => { setFilterSource(v); setPage(1); }}>
          <SelectTrigger className="w-full md:w-[160px] bg-[var(--bg-secondary)] border-[var(--border-default)]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="FRONTEND">Frontend</SelectItem>
            <SelectItem value="BACKEND">Backend</SelectItem>
            <SelectItem value="DATABASE">Database</SelectItem>
            <SelectItem value="AUTH">Auth</SelectItem>
            <SelectItem value="EXTERNAL">External</SelectItem>
            <SelectItem value="SOCKET">Socket</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 rounded-xl bg-[var(--preone-primary)]/10 border border-[var(--preone-primary)]/20"
        >
          <span className="text-sm font-medium text-[var(--preone-primary)]">
            {selectedIds.size} selected
          </span>
          <Select value={bulkAction} onValueChange={setBulkAction}>
            <SelectTrigger className="w-[180px] h-8 bg-[var(--bg-secondary)] border-[var(--border-default)] text-xs">
              <SelectValue placeholder="Choose action..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="acknowledge">Acknowledge</SelectItem>
              <SelectItem value="resolve">Resolve</SelectItem>
              <SelectItem value="ignore">Ignore</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={handleBulkAction}
            disabled={!bulkAction}
            className="bg-[var(--preone-primary)] hover:bg-[var(--preone-primary)]/90 text-white h-8"
          >
            Apply
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setSelectedIds(new Set()); setBulkAction(''); }}
            className="h-8 text-[var(--text-tertiary)]"
          >
            Clear
          </Button>
        </motion.div>
      )}

      {/* Error List */}
      <div className="space-y-2">
        {/* Select All */}
        <div className="flex items-center gap-3 px-3 py-2 text-xs text-[var(--text-muted)]">
          <Checkbox
            checked={errors.length > 0 && selectedIds.size === errors.length}
            onCheckedChange={toggleSelectAll}
          />
          <span className="flex-1">
            {errors.length} error{errors.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </span>
          <Filter className="w-3 h-3" />
        </div>

        {errors.length === 0 ? (
          <Card className="p-12 bg-[var(--card)] border-[var(--border-default)] text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-1">No Errors Found</h3>
            <p className="text-sm text-[var(--text-muted)]">
              {searchQuery || filterStatus !== 'all' || filterSeverity !== 'all'
                ? 'Try adjusting your filters'
                : 'Your application is running smoothly!'}
            </p>
          </Card>
        ) : (
          <AnimatePresence mode="popLayout">
            {errors.map((err) => (
              <ErrorCard
                key={err.id}
                error={err}
                expanded={expandedId === err.id}
                selected={selectedIds.has(err.id)}
                onToggleExpand={() => setExpandedId(expandedId === err.id ? null : err.id)}
                onToggleSelect={() => toggleSelect(err.id)}
                onStatusChange={(status) => handleStatusChange(err.id, status)}
                onDelete={() => handleDelete(err.id)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="border-[var(--border-default)]"
          >
            Previous
          </Button>
          <span className="text-sm text-[var(--text-muted)]">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="border-[var(--border-default)]"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

// ====== Sub-components ======

function StatCard({
  label,
  value,
  icon,
  color,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  highlight?: boolean;
}) {
  return (
    <Card className={`p-4 bg-[var(--card)] ${highlight ? 'border-[var(--preone-primary)]/30' : 'border-[var(--border-default)]'} ${highlight ? 'ring-1 ring-[var(--preone-primary)]/20' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
        <span className="text-xs text-[var(--text-muted)]">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${highlight ? 'text-[var(--preone-primary)]' : 'text-[var(--text-primary)]'}`}>
        {value}
      </p>
    </Card>
  );
}

function ErrorCard({
  error,
  expanded,
  selected,
  onToggleExpand,
  onToggleSelect,
  onStatusChange,
  onDelete,
}: {
  error: ErrorLogEntry;
  expanded: boolean;
  selected: boolean;
  onToggleExpand: () => void;
  onToggleSelect: () => void;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
}) {
  const sevConfig = getSeverityConfig(error.severity);
  const statusConfig = getStatusConfig(error.status);
  const sourceColor = getSourceColor(error.source);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
    >
      <Card className={`bg-[var(--card)] border-[var(--border-default)] overflow-hidden transition-all ${selected ? 'ring-1 ring-[var(--preone-primary)]/30' : ''}`}>
        {/* Main Row */}
        <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[var(--bg-secondary)]/50 transition-colors">
          <Checkbox checked={selected} onCheckedChange={onToggleSelect} onClick={(e) => e.stopPropagation()} />

          <div className={`w-2 h-2 rounded-full shrink-0 ${sevConfig.dot}`} />

          <div className="flex-1 min-w-0" onClick={onToggleExpand}>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{error.message}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${sourceColor}`}>
                {getSourceIcon(error.source)}
                {error.source}
              </span>
              {error.type && (
                <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
                  {error.type}
                </span>
              )}
              {error.statusCode && (
                <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
                  {error.statusCode}
                </span>
              )}
              {error.occurrenceCount > 1 && (
                <span className="text-[10px] font-medium text-[var(--preone-primary)] bg-[var(--preone-primary)]/10 px-1.5 py-0.5 rounded-full">
                  {error.occurrenceCount}×
                </span>
              )}
            </div>
          </div>

          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full shrink-0 ${statusConfig.color}`}>
            {statusConfig.icon}
            {statusConfig.label}
          </span>

          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border shrink-0 ${sevConfig.color}`}>
            {sevConfig.label}
          </span>

          <span className="text-[10px] text-[var(--text-muted)] shrink-0 w-16 text-right">
            {timeAgo(error.lastSeenAt)}
          </span>

          <button onClick={onToggleExpand} className="shrink-0 p-1 rounded hover:bg-[var(--bg-tertiary)] transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
          </button>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-2 border-t border-[var(--border-default)]/50 space-y-3">
                {/* Context Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {error.url && (
                    <div>
                      <span className="text-[var(--text-muted)]">URL</span>
                      <p className="text-[var(--text-tertiary)] truncate mt-0.5">{error.url}</p>
                    </div>
                  )}
                  {error.method && (
                    <div>
                      <span className="text-[var(--text-muted)]">Method</span>
                      <p className="text-[var(--text-tertiary)] mt-0.5">{error.method}</p>
                    </div>
                  )}
                  {error.apiRoute && (
                    <div>
                      <span className="text-[var(--text-muted)]">Route</span>
                      <p className="text-[var(--text-tertiary)] truncate mt-0.5">{error.apiRoute}</p>
                    </div>
                  )}
                  {error.fileName && (
                    <div>
                      <span className="text-[var(--text-muted)]">File</span>
                      <p className="text-[var(--text-tertiary)] truncate mt-0.5">
                        {error.fileName}{error.lineNumber ? `:${error.lineNumber}` : ''}
                      </p>
                    </div>
                  )}
                  {error.user && (
                    <div>
                      <span className="text-[var(--text-muted)]">User</span>
                      <p className="text-[var(--text-tertiary)] mt-0.5">{error.user.name} ({error.user.role})</p>
                    </div>
                  )}
                  <div>
                    <span className="text-[var(--text-muted)]">First Seen</span>
                    <p className="text-[var(--text-tertiary)] mt-0.5">{new Date(error.firstSeenAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Last Seen</span>
                    <p className="text-[var(--text-tertiary)] mt-0.5">{new Date(error.lastSeenAt).toLocaleString()}</p>
                  </div>
                  {error.resolvedAt && (
                    <div>
                      <span className="text-[var(--text-muted)]">Resolved</span>
                      <p className="text-[var(--text-tertiary)] mt-0.5">{new Date(error.resolvedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {error.tags && (() => {
                  try {
                    const tags = typeof error.tags === 'string' ? JSON.parse(error.tags) : error.tags;
                    if (Array.isArray(tags) && tags.length > 0) {
                      return (
                        <div className="flex flex-wrap gap-1">
                          {tags.map((tag: string, i: number) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      );
                    }
                  } catch {}
                  return null;
                })()}

                {/* Stack Trace */}
                {error.stack && (
                  <div>
                    <span className="text-xs text-[var(--text-muted)] mb-1 block">Stack Trace</span>
                    <pre className="text-[11px] text-red-300/70 bg-red-500/5 border border-red-500/10 rounded-lg p-3 overflow-auto max-h-48 whitespace-pre-wrap font-mono">
                      {error.stack}
                    </pre>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-default)]/30">
                  <span className="text-xs text-[var(--text-muted)] mr-2">Set status:</span>
                  {(['ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'IGNORED'] as const).map((status) => {
                    const cfg = getStatusConfig(status);
                    return (
                      <button
                        key={status}
                        onClick={() => onStatusChange(status)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border transition-colors ${
                          error.status === status
                            ? `${cfg.color} border-current font-medium`
                            : 'border-[var(--border-default)] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                  <div className="flex-1" />
                  <button
                    onClick={onDelete}
                    className="text-[10px] px-2.5 py-1 rounded-lg border border-red-400/20 text-red-400 hover:bg-red-400/10 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
