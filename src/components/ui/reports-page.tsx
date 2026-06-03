'use client';

import { useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileBarChart, Download, Filter, Calendar, FileSpreadsheet, FileText,
  Users, IndianRupee, TrendingUp, ClipboardList, Baby, Sun, X,
  ChevronDown, CheckCircle2, AlertTriangle, Clock, BarChart3,
} from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';
import { AnimatedCard } from '@/components/ui/animated-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ── Types ──
interface ReportType {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  href: string;
  roles: string[];
}

interface ReportData {
  summary: Record<string, unknown>;
  records: Record<string, unknown>[];
  dateRange: { from: string; to: string };
}

// ── Portal-aware prefix ──
function getPortalPrefix(pathname: string): string {
  if (pathname.startsWith('/teacher')) return '/teacher';
  if (pathname.startsWith('/parent')) return '/parent';
  return '/admin';
}

function getPortalRole(pathname: string): string {
  if (pathname.startsWith('/teacher')) return 'TEACHER';
  if (pathname.startsWith('/parent')) return 'PARENT';
  return 'ADMIN';
}

// ── All Report Types ──
const ALL_REPORT_TYPES: ReportType[] = [
  {
    id: 'attendance',
    title: 'Attendance Report',
    description: 'Present/Absent/Late rates, daily details, student-wise breakdown',
    icon: ClipboardList,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 border-emerald-200',
    href: '/reports?type=attendance',
    roles: ['ADMIN', 'TEACHER', 'PARENT'],
  },
  {
    id: 'fees',
    title: 'Fee Report',
    description: 'Collected/Pending/Overdue summary, invoice-level details',
    icon: IndianRupee,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
    href: '/reports?type=fees',
    roles: ['ADMIN', 'PARENT'],
  },
  {
    id: 'growth',
    title: 'Growth Report',
    description: 'Cognitive/Social/Physical/Language scores, period-wise trends',
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    href: '/reports?type=growth',
    roles: ['ADMIN', 'TEACHER', 'PARENT'],
  },
  {
    id: 'crm',
    title: 'CRM Pipeline',
    description: 'Lead pipeline, conversion rates, revenue estimation',
    icon: BarChart3,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    href: '/reports?type=crm',
    roles: ['ADMIN'],
  },
  {
    id: 'students',
    title: 'Student Directory',
    description: 'Complete roster with contacts, class, parent details',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    href: '/reports?type=students',
    roles: ['ADMIN'],
  },
  {
    id: 'daily-updates',
    title: 'Daily Updates',
    description: 'Meals/Nap/Activities/Mood per day for each student',
    icon: Sun,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 border-teal-200',
    href: '/reports?type=daily-updates',
    roles: ['ADMIN', 'TEACHER', 'PARENT'],
  },
];

// ── Filter Modal Component ──
function FilterModal({
  isOpen,
  onClose,
  reportType,
  onApply,
}: {
  isOpen: boolean;
  onClose: () => void;
  reportType: string;
  onApply: (filters: Record<string, string>) => void;
}) {
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [classId, setClassId] = useState('');
  const [status, setStatus] = useState('');

  const handleApply = () => {
    const filters: Record<string, string> = {};
    if (from) filters.from = from;
    if (to) filters.to = to;
    if (classId) filters.classId = classId;
    if (status) filters.status = status;
    onApply(filters);
    onClose();
  };

  const showDateFilter = ['attendance', 'fees', 'daily-updates', 'crm'].includes(reportType);
  const showClassFilter = ['attendance', 'growth', 'daily-updates', 'students'].includes(reportType);
  const showStatusFilter = ['fees', 'students'].includes(reportType);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed inset-x-4 top-[20%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 bg-white rounded-2xl shadow-xl border overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b bg-purple-50">
              <h3 className="font-semibold text-sm">Filter Report</h3>
              <button onClick={onClose} className="p-1 rounded-md hover:bg-purple-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {showDateFilter && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">From</label>
                    <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">To</label>
                    <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="text-sm" />
                  </div>
                </div>
              )}
              {showClassFilter && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Class</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  >
                    <option value="">All Classes</option>
                    <option value="nursery">Nursery</option>
                    <option value="lkg">LKG</option>
                    <option value="ukg">UKG</option>
                  </select>
                </div>
              )}
              {showStatusFilter && reportType === 'fees' && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  >
                    <option value="">All Status</option>
                    <option value="PAID">Paid</option>
                    <option value="PENDING">Pending</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="PARTIAL">Partial</option>
                  </select>
                </div>
              )}
              {showStatusFilter && reportType === 'students' && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="GRADUATED">Graduated</option>
                    <option value="">All</option>
                  </select>
                </div>
              )}
            </div>
            <div className="flex gap-2 px-5 py-4 border-t bg-gray-50">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700" onClick={handleApply}>Apply Filters</Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Summary Stat Card ──
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white border shadow-sm">
      <div className={cn('p-2 rounded-lg', color)}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}

/**
 * ReportsPage — Full reports page shared across all portals.
 * Shows available report types, allows filtering, and exports to PDF/Excel.
 */
export function ReportsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const portalPrefix = getPortalPrefix(pathname);
  const role = getPortalRole(pathname);

  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Available reports for this role
  const availableReports = ALL_REPORT_TYPES.filter((r) => r.roles.includes(role));

  // ── Fetch report data ──
  const fetchReport = useCallback(async (reportType: string, filterParams: Record<string, string> = {}) => {
    setLoading(true);
    setActiveReport(reportType);
    try {
      const token = localStorage.getItem('preone_token');
      if (!token) return;

      const params = new URLSearchParams(filterParams);
      const res = await fetch(`/api/reports/${reportType}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      } else {
        toast.error('Failed to load report');
      }
    } catch {
      toast.error('Error loading report');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Export report ──
  const exportReport = async (format: 'pdf' | 'excel') => {
    if (!reportData || !activeReport) return;
    setExporting(true);
    try {
      const token = localStorage.getItem('preone_token');
      if (!token) return;

      // Get headers and rows from records
      const records = reportData.records;
      if (records.length === 0) {
        toast.error('No data to export');
        return;
      }

      const headers = Object.keys(records[0]).map(k => k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()));
      const rows = records.map(r => Object.values(r));

      const res = await fetch('/api/reports/export', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: activeReport,
          format,
          dateRange: reportData.dateRange,
          data: { headers, rows, title: ALL_REPORT_TYPES.find(r => r.id === activeReport)?.title },
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PreOne_${activeReport}_report.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`${format === 'pdf' ? 'PDF' : 'Excel'} exported successfully!`);
      } else {
        toast.error('Export failed');
      }
    } catch {
      toast.error('Export error');
    } finally {
      setExporting(false);
    }
  };

  // ── Apply filters ──
  const applyFilters = (newFilters: Record<string, string>) => {
    setFilters(newFilters);
    if (activeReport) {
      fetchReport(activeReport, newFilters);
    }
  };

  const currentReportType = ALL_REPORT_TYPES.find(r => r.id === activeReport);

  return (
    <PageTransition>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Generate, filter, and export reports for your school
            </p>
          </div>
          {activeReport && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowFilter(true)}>
                <Filter className="h-4 w-4" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => exportReport('pdf')}
                disabled={exporting || !reportData?.records?.length}
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => exportReport('excel')}
                disabled={exporting || !reportData?.records?.length}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setActiveReport(null); setReportData(null); }}>
                Back
              </Button>
            </div>
          )}
        </div>

        {/* ── Report Type Cards (when no report is active) ── */}
        {!activeReport && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableReports.map((report) => (
              <AnimatedCard key={report.id} hover>
                <div
                  className={cn('p-5 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md', report.bgColor)}
                  onClick={() => fetchReport(report.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('p-2.5 rounded-xl bg-white/80 shadow-sm', report.color)}>
                      <report.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{report.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Download className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">PDF & Excel</span>
                  </div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        )}

        {/* ── Report Data View ── */}
        {activeReport && loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin" />
          </div>
        )}

        {activeReport && !loading && reportData && (
          <div className="space-y-4">
            {/* Summary Stats */}
            {reportData.summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {activeReport === 'attendance' && (
                  <>
                    <StatCard label="Total Records" value={(reportData.summary.total as number) || 0} icon={ClipboardList} color="bg-emerald-100 text-emerald-600" />
                    <StatCard label="Present" value={(reportData.summary.present as number) || 0} icon={CheckCircle2} color="bg-green-100 text-green-600" />
                    <StatCard label="Absent" value={(reportData.summary.absent as number) || 0} icon={AlertTriangle} color="bg-red-100 text-red-600" />
                    <StatCard label="Attendance Rate" value={`${reportData.summary.attendanceRate}%`} icon={BarChart3} color="bg-purple-100 text-purple-600" />
                  </>
                )}
                {activeReport === 'fees' && (
                  <>
                    <StatCard label="Total Invoiced" value={`₹${((reportData.summary.totalInvoiced as number) || 0).toLocaleString()}`} icon={IndianRupee} color="bg-blue-100 text-blue-600" />
                    <StatCard label="Collected" value={`₹${((reportData.summary.totalCollected as number) || 0).toLocaleString()}`} icon={CheckCircle2} color="bg-green-100 text-green-600" />
                    <StatCard label="Pending" value={`₹${((reportData.summary.totalPending as number) || 0).toLocaleString()}`} icon={Clock} color="bg-amber-100 text-amber-600" />
                    <StatCard label="Invoices" value={(reportData.summary.invoiceCount as number) || 0} icon={FileBarChart} color="bg-purple-100 text-purple-600" />
                  </>
                )}
                {activeReport === 'growth' && (
                  <>
                    <StatCard label="Students" value={(reportData.summary.totalStudents as number) || 0} icon={Users} color="bg-blue-100 text-blue-600" />
                    <StatCard label="Assessments" value={(reportData.summary.totalAssessments as number) || 0} icon={BarChart3} color="bg-purple-100 text-purple-600" />
                    <StatCard label="Avg Overall" value={((reportData.summary.averages as Record<string, number>)?.overall || 0)} icon={TrendingUp} color="bg-emerald-100 text-emerald-600" />
                    <StatCard label="Avg Cognitive" value={((reportData.summary.averages as Record<string, number>)?.cognitive || 0)} icon={TrendingUp} color="bg-orange-100 text-orange-600" />
                  </>
                )}
                {activeReport === 'crm' && (
                  <>
                    <StatCard label="Total Leads" value={(reportData.summary.totalLeads as number) || 0} icon={Users} color="bg-blue-100 text-blue-600" />
                    <StatCard label="Enrolled" value={(reportData.summary.enrolled as number) || 0} icon={CheckCircle2} color="bg-green-100 text-green-600" />
                    <StatCard label="Conversion" value={`${reportData.summary.conversionRate}%`} icon={TrendingUp} color="bg-purple-100 text-purple-600" />
                    <StatCard label="Est. Revenue" value={`₹${((reportData.summary.enrolledRevenue as number) || 0).toLocaleString()}`} icon={IndianRupee} color="bg-amber-100 text-amber-600" />
                  </>
                )}
                {activeReport === 'students' && (
                  <>
                    <StatCard label="Total Students" value={(reportData.summary.totalStudents as number) || 0} icon={Users} color="bg-blue-100 text-blue-600" />
                    <StatCard label="Active" value={(reportData.summary.active as number) || 0} icon={CheckCircle2} color="bg-green-100 text-green-600" />
                    <StatCard label="Inactive" value={(reportData.summary.inactive as number) || 0} icon={AlertTriangle} color="bg-red-100 text-red-600" />
                    <StatCard label="Graduated" value={(reportData.summary.graduated as number) || 0} icon={FileBarChart} color="bg-purple-100 text-purple-600" />
                  </>
                )}
                {activeReport === 'daily-updates' && (
                  <>
                    <StatCard label="Total Updates" value={(reportData.summary.totalUpdates as number) || 0} icon={Sun} color="bg-teal-100 text-teal-600" />
                    <StatCard label="Students" value={(reportData.summary.uniqueStudents as number) || 0} icon={Users} color="bg-blue-100 text-blue-600" />
                    <StatCard label="Days Covered" value={(reportData.summary.uniqueDates as number) || 0} icon={Calendar} color="bg-purple-100 text-purple-600" />
                    <StatCard label="Period" value={(reportData.summary.dateRange as string) || '-'} icon={Clock} color="bg-amber-100 text-amber-600" />
                  </>
                )}
              </div>
            )}

            {/* Data Table */}
            {reportData.records.length === 0 ? (
              <EmptyState
                icon={FileBarChart}
                title="No data found"
                description="Try adjusting your filters or date range"
              />
            ) : (
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-purple-50 border-b">
                        {Object.keys(reportData.records[0]).map((key) => (
                          <th key={key} className="px-3 py-2.5 text-left font-semibold text-purple-800 whitespace-nowrap text-xs">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.records.slice(0, 50).map((record, idx) => (
                        <tr key={idx} className={cn('border-b last:border-b-0', idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}>
                          {Object.values(record).map((value, i) => (
                            <td key={i} className="px-3 py-2 text-xs whitespace-nowrap text-gray-700">
                              {String(value ?? '-')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {reportData.records.length > 50 && (
                  <div className="px-4 py-2 text-xs text-muted-foreground border-t bg-gray-50">
                    Showing 50 of {reportData.records.length} records. Export to see all.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Filter Modal ── */}
        {activeReport && (
          <FilterModal
            isOpen={showFilter}
            onClose={() => setShowFilter(false)}
            reportType={activeReport}
            onApply={applyFilters}
          />
        )}
      </div>
    </PageTransition>
  );
}
