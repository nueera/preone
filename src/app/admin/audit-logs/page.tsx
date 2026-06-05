'use client';
 

import React, { useState, useEffect, useCallback } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { AnimatedCard } from '@/components/ui/animated-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Shield,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Activity,
  Calendar,
  User,
  Clock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ──
interface AuditLogEntry {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Stats {
  totalToday: number;
  totalThisWeek: number;
  byAction: Record<string, number>;
  byEntity: Record<string, number>;
  recentActivity: AuditLogEntry[];
  topActor: { name: string; email: string; count: number } | null;
}

// ── Color maps ──
const ACTION_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  CREATE:  { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  UPDATE:  { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  DELETE:  { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  LOGIN:   { bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500' },
  LOGOUT:  { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
  READ:    { bg: 'bg-cyan-100', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  EXPORT:  { bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500' },
  IMPORT:  { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  APPROVE: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  REJECT:  { bg: 'bg-rose-100', text: 'text-rose-700', dot: 'bg-rose-500' },
};

const ENTITY_COLORS: Record<string, { bg: string; text: string }> = {
  Student:     { bg: 'bg-blue-100', text: 'text-blue-700' },
  Teacher:     { bg: 'bg-purple-100', text: 'text-purple-700' },
  Invoice:     { bg: 'bg-amber-100', text: 'text-amber-700' },
  Payment:     { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  Lead:        { bg: 'bg-orange-100', text: 'text-orange-700' },
  Attendance:  { bg: 'bg-teal-100', text: 'text-teal-700' },
  User:        { bg: 'bg-violet-100', text: 'text-violet-700' },
  Activity:    { bg: 'bg-pink-100', text: 'text-pink-700' },
  Parent:      { bg: 'bg-sky-100', text: 'text-sky-700' },
  FeeStructure:{ bg: 'bg-yellow-100', text: 'text-yellow-700' },
};

const ACTION_OPTIONS = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'READ', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT'];
const ENTITY_OPTIONS = ['Student', 'Teacher', 'Invoice', 'Payment', 'Lead', 'Attendance', 'User', 'Activity', 'Parent', 'FeeStructure'];

function getActionColor(action: string) {
  return ACTION_COLORS[action] || { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' };
}

function getEntityColor(entity: string) {
  return ENTITY_COLORS[entity] || { bg: 'bg-slate-100', text: 'text-slate-700' };
}

function formatTimestamp(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

// ── Component ──
export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [entityFilter, setEntityFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Fetch audit logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('preone_token');
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '25');
      if (entityFilter && entityFilter !== 'all') params.set('entity', entityFilter);
      if (actionFilter && actionFilter !== 'all') params.set('action', actionFilter);
      if (searchQuery) params.set('search', searchQuery);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);

      const res = await fetch(`/api/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      const data = await res.json();
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Fetch audit logs error:', err);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, entityFilter, actionFilter, searchQuery, fromDate, toDate]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('preone_token');
      const res = await fetch('/api/audit-logs/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Fetch audit stats error:', err);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
     
  }, [fetchLogs]);

  useEffect(() => {
    fetchStats();
     
  }, [fetchStats]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [entityFilter, actionFilter, searchQuery, fromDate, toDate]);

  // Export CSV
  const exportCSV = async () => {
    try {
      const token = localStorage.getItem('preone_token');
      const params = new URLSearchParams();
      params.set('limit', '10000');
      if (entityFilter && entityFilter !== 'all') params.set('entity', entityFilter);
      if (actionFilter && actionFilter !== 'all') params.set('action', actionFilter);
      if (searchQuery) params.set('search', searchQuery);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);

      const res = await fetch(`/api/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to export');
      const data = await res.json();
      const allLogs: AuditLogEntry[] = data.logs;

      const csvRows = [
        ['Timestamp', 'User', 'Action', 'Entity', 'Entity ID', 'Details', 'IP Address'].join(','),
        ...allLogs.map((log) => {
          const user = log.user ? `${log.user.name} (${log.user.email})` : 'System';
          const details = log.details ? `"${log.details.replace(/"/g, '""')}"` : '';
          return [
            `"${formatTimestamp(log.createdAt)}"`,
            `"${user}"`,
            log.action,
            log.entity,
            log.entityId || '',
            details,
            log.ipAddress || '',
          ].join(',');
        }),
      ];
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Audit logs exported successfully');
    } catch (err) {
      console.error('Export CSV error:', err);
      toast.error('Failed to export audit logs');
    }
  };

  // Parse details JSON
  const parseDetails = (detailsStr: string | null) => {
    if (!detailsStr) return null;
    try {
      return JSON.parse(detailsStr);
    } catch {
      return null;
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
              <Shield className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
              <p className="text-sm text-gray-500">Track all system activities and changes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { fetchLogs(); fetchStats(); }}
              className="gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={exportCSV}
              className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AnimatedCard delay={0} hover={false} className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                <Calendar className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Today&apos;s Events</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalToday ?? 0}</p>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.05} hover={false} className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalThisWeek ?? 0}</p>
              </div>
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.1} hover={false} className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
                <User className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Top Actor Today</p>
                <p className="text-lg font-bold text-gray-900 truncate">
                  {stats?.topActor ? stats.topActor.name : 'No activity'}
                </p>
                {stats?.topActor && (
                  <p className="text-xs text-gray-500">{stats.topActor.count} actions</p>
                )}
              </div>
            </div>
          </AnimatedCard>
        </div>

        {/* ── Filters ── */}
        <AnimatedCard delay={0.15} hover={false} className="p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search user, action, entity..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>

            <div className="min-w-[140px]">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Entity Type</label>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="All Entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {ENTITY_OPTIONS.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[140px]">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Action Type</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {ACTION_OPTIONS.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[140px]">
              <label className="text-xs font-medium text-gray-500 mb-1 block">From Date</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="min-w-[140px]">
              <label className="text-xs font-medium text-gray-500 mb-1 block">To Date</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={() => {
                setEntityFilter('all');
                setActionFilter('all');
                setSearchQuery('');
                setFromDate('');
                setToDate('');
              }}
            >
              Clear
            </Button>
          </div>
        </AnimatedCard>

        {/* ── Data Table ── */}
        <AnimatedCard delay={0.2} hover={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80">
                  <TableHead className="text-xs font-semibold text-gray-600">Timestamp</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">User</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Action</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Entity</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Entity ID</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">Details</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-600">IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex items-center justify-center gap-2 text-gray-400">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading audit logs...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Shield className="h-8 w-8" />
                        <p className="text-sm font-medium">No audit logs found</p>
                        <p className="text-xs">Try adjusting your filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const actionColor = getActionColor(log.action);
                    const entityColor = getEntityColor(log.entity);
                    const details = parseDetails(log.details);
                    const isExpanded = expandedRows.has(log.id);
                    const hasDetails = details !== null;

                    return (
                      <React.Fragment key={log.id}>
                        <TableRow className="group hover:bg-violet-50/30 transition-colors">
                          <TableCell className="text-xs text-gray-600 min-w-[160px]">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3 text-gray-400" />
                              {formatTimestamp(log.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.user ? (
                              <div>
                                <p className="font-medium text-gray-900 text-xs">{log.user.name}</p>
                                <p className="text-[10px] text-gray-400">{log.user.email}</p>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">System</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${actionColor.bg} ${actionColor.text}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${actionColor.dot}`} />
                              {log.action}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${entityColor.bg} ${entityColor.text}`}>
                              {log.entity}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 font-mono max-w-[120px] truncate">
                            {log.entityId ? (
                              <span title={log.entityId}>{log.entityId.slice(0, 12)}...</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {hasDetails ? (
                              <button
                                onClick={() => toggleRow(log.id)}
                                className="flex items-center gap-1 text-xs text-violet-600 hover:text-violet-800 transition-colors"
                              >
                                <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                {isExpanded ? 'Hide' : 'View'}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-gray-500 font-mono">
                            {log.ipAddress || '—'}
                          </TableCell>
                        </TableRow>
                        {hasDetails && isExpanded && (
                          <TableRow className="bg-violet-50/20">
                            <TableCell colSpan={7} className="p-0">
                              <div className="px-6 py-3 border-l-4 border-violet-300 ml-4">
                                <p className="text-xs font-semibold text-gray-600 mb-2">Field Changes</p>
                                {details.changes && Array.isArray(details.changes) ? (
                                  <div className="space-y-1.5">
                                    {details.changes.map((change: { field: string; oldValue: unknown; newValue: unknown }, idx: number) => (
                                      <div key={idx} className="flex items-center gap-2 text-xs">
                                        <span className="font-mono font-medium text-violet-700 min-w-[100px]">{change.field}</span>
                                        <span className="text-red-500 bg-red-50 rounded px-1.5 py-0.5 font-mono max-w-[200px] truncate">
                                          {String(change.oldValue ?? 'null')}
                                        </span>
                                        <ArrowRight className="h-3 w-3 text-gray-400 shrink-0" />
                                        <span className="text-green-600 bg-green-50 rounded px-1.5 py-0.5 font-mono max-w-[200px] truncate">
                                          {String(change.newValue ?? 'null')}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <pre className="text-xs text-gray-600 bg-gray-50 rounded p-2 overflow-x-auto max-h-40">
                                    {JSON.stringify(details, null, 2)}
                                  </pre>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination ── */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50">
              <p className="text-xs text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? 'default' : 'outline'}
                      size="sm"
                      className={`h-8 w-8 p-0 ${pageNum === pagination.page ? 'bg-violet-600 hover:bg-violet-700 text-white' : ''}`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </AnimatedCard>
      </div>
    </PageTransition>
  );
}
