'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
  LayoutDashboard, Users, GraduationCap, ClipboardCheck, Receipt,
  Megaphone, Palette, TrendingUp, MessageSquare, Settings,
  Search, Plus, Phone, Mail, Star, Clock,
  CheckCircle2, XCircle, AlertTriangle, ArrowUpRight,
  IndianRupee, UserPlus, Calendar, Bell, Send,
  BarChart3, Activity, Building2, ChevronDown,
  LogOut, Loader2, Menu, Edit, Trash2, X, Check,
} from 'lucide-react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, PieChart,
  Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar,
} from 'recharts';

// ============================================================
// TYPES
// ============================================================
type Section = 'dashboard' | 'students' | 'teachers' | 'attendance' | 'fees' | 'crm' | 'activities' | 'growth' | 'communication' | 'settings';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  branchId?: string | null;
  schoolId?: string | null;
}

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalRevenue: number;
  thisMonthRevenue: number;
  newAdmissions: number;
  occupancyRate: number;
  attendanceRate: number;
  feeBreakdown: { collected: number; pending: number; overdue: number };
  activeLeads: number;
}

interface RevenueData {
  year: number;
  monthly: { month: string; revenue: number; collections: number; invoiced: number }[];
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

interface StudentData {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender?: string;
  bloodGroup?: string;
  status: string;
  rollNumber?: string;
  class?: { id: string; name: string; program?: { name: string } };
  parents?: { parent: { id: string; firstName: string; lastName: string; phone: string; relation: string } }[];
}

interface TeacherData {
  id: string;
  firstName: string;
  lastName: string;
  qualification?: string;
  specialization?: string;
  experience?: number;
  phone?: string;
  email?: string;
  status: string;
  assignedClass?: { id: string; name: string } | null;
}

interface LeadData {
  id: string;
  parentName: string;
  childName: string;
  parentPhone: string;
  parentEmail?: string;
  source: string;
  stage: string;
  priority: string;
  nextFollowUp?: string;
  programInterest?: string;
  notes?: string;
  estimatedValue?: number;
}

interface InvoiceData {
  id: string;
  invoiceNo: string;
  netAmount: number;
  amount: number;
  status: string;
  dueDate: string;
  student: { id: string; firstName: string; lastName: string };
  feeStructure?: { id: string; name: string; type: string };
}

interface AttendanceStatsData {
  date: string;
  students: { total: number; marked: number; present: number; absent: number; late: number; attendanceRate: number };
  staff: { total: number; present: number; absent: number; late: number };
  classWise: { classId: string; className: string; totalStudents: number; present: number; absent: number; late: number; attendanceRate: number }[];
}

interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  type: string;
  target: string;
  priority: string;
  publishedAt?: string;
  createdAt: string;
}

interface FeeOverview {
  totalInvoiced: number;
  totalCollected: number;
  totalPending: number;
  collectionRate: number;
  statusBreakdown: Record<string, { count: number; amount: number; collected: number }>;
}

interface CRMPipeline {
  pipeline: { stage: string; count: number; estimatedValue: number }[];
  totalLeads: number;
  conversionRate: number;
  sourceBreakdown: Record<string, number>;
}

interface FeeStructureData {
  id: string;
  name: string;
  type: string;
  amount: number;
  frequency: string;
  class?: { id: string; name: string; program?: { name: string } };
}

interface ActivityDB {
  id: string;
  title: string;
  description?: string;
  type: string;
  date: string;
  startTime?: string;
  endTime?: string;
  status: string;
}

interface GrowthClassData {
  class: { id: string; name: string; program: { name: string } };
  classAverages?: {
    creativity: number; communication: number; social: number;
    confidence: number; cognitive: number; physical: number; overall: number;
  };
  students: { id: string; firstName: string; lastName: string; growthScore?: { creativity: number; communication: number; social: number; confidence: number; cognitive: number; physical: number; overall: number } }[];
  needsAttention: { id: string; name: string; overall: number; weakestArea: string }[];
  topPerformers: { id: string; name: string; overall: number }[];
}

// ============================================================
// CONSTANTS
// ============================================================
const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: GraduationCap },
  { id: 'teachers', label: 'Teachers', icon: Users },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { id: 'fees', label: 'Fees', icon: Receipt },
  { id: 'crm', label: 'Admission CRM', icon: Megaphone },
  { id: 'activities', label: 'Activities', icon: Palette },
  { id: 'growth', label: 'Growth', icon: TrendingUp },
  { id: 'communication', label: 'Communication', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const stageLabels: Record<string, string> = {
  NEW: 'New', CONTACTED: 'Contacted', VISITED: 'Visited',
  APPLIED: 'Applied', ENROLLED: 'Enrolled', LOST: 'Lost',
};

const stageColors: Record<string, string> = {
  NEW: '#7C3AED', CONTACTED: '#0EA5E9', VISITED: '#f97316',
  APPLIED: '#10b981', ENROLLED: '#059669', LOST: '#94a3b8',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-700',
  NORMAL: 'bg-sky-100 text-sky-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CONCERN: 'bg-rose-100 text-rose-700',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  INACTIVE: 'bg-slate-100 text-slate-700',
  ON_LEAVE: 'bg-amber-100 text-amber-700',
  GRADUATED: 'bg-violet-100 text-violet-700',
  TRANSFERRED: 'bg-sky-100 text-sky-700',
};

const invoiceStatusColors: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  OVERDUE: 'bg-rose-100 text-rose-700',
  PARTIAL: 'bg-sky-100 text-sky-700',
  CANCELLED: 'bg-slate-100 text-slate-700',
};

// ============================================================
// HELPERS
// ============================================================
async function apiFetch(url: string, token: string | null, options?: RequestInit) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

function formatCurrency(value: number) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return `₹${value.toLocaleString('en-IN')}`;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  try { return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return dateStr; }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'student_enrollment': return UserPlus;
    case 'payment_received': return IndianRupee;
    case 'new_lead': return Megaphone;
    case 'announcement': return Bell;
    default: return Activity;
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case 'student_enrollment': return 'text-emerald-500';
    case 'payment_received': return 'text-sky-500';
    case 'new_lead': return 'text-orange-500';
    case 'announcement': return 'text-rose-500';
    default: return 'text-violet-500';
  }
}

// ============================================================
// LOGIN SCREEN
// ============================================================
function LoginScreen({ onLogin }: { onLogin: (token: string, user: AuthUser) => void }) {
  const [email, setEmail] = useState('admin@preone.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/api/auth/login', null, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('preone_token', data.token);
      localStorage.setItem('preone_user', JSON.stringify(data.user));
      onLogin(data.token, data.user);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-sky-50 to-emerald-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-0 rounded-3xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-violet-500/25">
            <Image src="/preonelogo.png" alt="PreOne" width={64} height={64} className="w-full h-full object-cover" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-sky-500 bg-clip-text text-transparent">PreOne</CardTitle>
          <CardDescription>Preschool ERP System</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <div className="p-3 text-sm bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@preone.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="password123" required />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-violet-600 to-sky-500 hover:from-violet-700 hover:to-sky-600 text-white shadow-sm hover:shadow-md transition-all" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Signing in...</> : 'Sign In'}
            </Button>
            <div className="text-xs text-center text-muted-foreground space-y-1">
              <p>Demo Accounts (password: password123)</p>
              <div className="flex flex-wrap justify-center gap-1 mt-1">
                <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-violet-50" onClick={() => { setEmail('admin@preone.com'); setPassword('password123'); }}>Admin</Badge>
                <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-violet-50" onClick={() => { setEmail('kavitha.raman@littlestars.com'); setPassword('password123'); }}>Teacher</Badge>
                <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-violet-50" onClick={() => { setEmail('rajesh.sharma@email.com'); setPassword('password123'); }}>Parent</Badge>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// SKELETON LOADERS
// ============================================================
function StatsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="rounded-3xl"><CardContent className="p-4"><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-8 w-16" /></CardContent></Card>
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <Card className="rounded-3xl"><CardContent className="p-0">
      <Table>
        <TableHeader><TableRow>{Array.from({ length: cols }).map((_, i) => <TableHead key={i}><Skeleton className="h-4 w-20" /></TableHead>)}</TableRow></TableHeader>
        <TableBody>{Array.from({ length: rows }).map((_, i) => (
          <TableRow key={i}>{Array.from({ length: cols }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
        ))}</TableBody>
      </Table>
    </CardContent></Card>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function PreOneDashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const isMobile = useIsMobile();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Data states
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [feeOverview, setFeeOverview] = useState<FeeOverview | null>(null);
  const [feeStructures, setFeeStructures] = useState<FeeStructureData[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStatsData | null>(null);
  const [crmPipeline, setCRMPipeline] = useState<CRMPipeline | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [activitiesDB, setActivitiesDB] = useState<ActivityDB[]>([]);
  const [growthData, setGrowthData] = useState<GrowthClassData[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string; program: { name: string } }[]>([]);

  const [loading, setLoading] = useState<Record<string, boolean>>({});

  // UI states
  const [studentSearch, setStudentSearch] = useState('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addTeacherOpen, setAddTeacherOpen] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [addAnnouncementOpen, setAddAnnouncementOpen] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  // Form states
  const [newStudent, setNewStudent] = useState({ firstName: '', lastName: '', dob: '', gender: 'Male', bloodGroup: '', parentFirstName: '', parentLastName: '', parentPhone: '' });
  const [newTeacher, setNewTeacher] = useState({ firstName: '', lastName: '', qualification: '', specialization: '', experience: '', phone: '', email: '' });
  const [newLead, setNewLead] = useState({ parentName: '', parentPhone: '', childName: '', programInterest: 'Nursery', source: 'WALK_IN', priority: 'NORMAL', notes: '' });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', type: 'General', target: 'All', content: '', priority: 'NORMAL' });

  // ============================================================
  // AUTH
  // ============================================================
  useEffect(() => {
    const savedToken = localStorage.getItem('preone_token');
    const savedUser = localStorage.getItem('preone_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      try { setUser(JSON.parse(savedUser)); } catch { setUser(null); }
    }
    setAuthChecked(true);
  }, []);

  const handleLogin = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('preone_token');
    localStorage.removeItem('preone_user');
    setToken(null);
    setUser(null);
  };

  // ============================================================
  // DATA FETCHING
  // ============================================================
  const fetchDashboardStats = useCallback(async () => {
    setLoading(l => ({ ...l, dashboard: true }));
    try {
      const data = await apiFetch('/api/dashboard/stats', token);
      setDashboardStats(data);
    } catch { /* ignore */ }
    finally { setLoading(l => ({ ...l, dashboard: false })); }
  }, [token]);

  const fetchRevenueData = useCallback(async () => {
    try {
      const data = await apiFetch('/api/dashboard/revenue', token);
      setRevenueData(data);
    } catch { /* ignore */ }
  }, [token]);

  const fetchRecentActivities = useCallback(async () => {
    try {
      const data = await apiFetch('/api/dashboard/activities?limit=10', token);
      setRecentActivities(data.activities || []);
    } catch { /* ignore */ }
  }, [token]);

  const fetchStudents = useCallback(async () => {
    setLoading(l => ({ ...l, students: true }));
    try {
      const data = await apiFetch(`/api/students?page=1&limit=50&search=${encodeURIComponent(studentSearch)}`, token);
      setStudents(data.students || []);
    } catch { /* ignore */ }
    finally { setLoading(l => ({ ...l, students: false })); }
  }, [token, studentSearch]);

  const fetchTeachers = useCallback(async () => {
    setLoading(l => ({ ...l, teachers: true }));
    try {
      const data = await apiFetch(`/api/teachers?page=1&limit=50&search=${encodeURIComponent(teacherSearch)}`, token);
      setTeachers(data.teachers || []);
    } catch { /* ignore */ }
    finally { setLoading(l => ({ ...l, teachers: false })); }
  }, [token, teacherSearch]);

  const fetchLeads = useCallback(async () => {
    setLoading(l => ({ ...l, leads: true }));
    try {
      const data = await apiFetch('/api/crm/leads?page=1&limit=50', token);
      setLeads(data.leads || []);
    } catch { /* ignore */ }
    finally { setLoading(l => ({ ...l, leads: false })); }
  }, [token]);

  const fetchInvoices = useCallback(async () => {
    try {
      const data = await apiFetch('/api/fees/invoices?page=1&limit=20', token);
      setInvoices(data.invoices || []);
    } catch { /* ignore */ }
  }, [token]);

  const fetchFeeOverview = useCallback(async () => {
    setLoading(l => ({ ...l, fees: true }));
    try {
      const data = await apiFetch('/api/fees/overview', token);
      setFeeOverview(data);
    } catch { /* ignore */ }
    finally { setLoading(l => ({ ...l, fees: false })); }
  }, [token]);

  const fetchFeeStructures = useCallback(async () => {
    try {
      const data = await apiFetch('/api/fees/structures', token);
      setFeeStructures(data.feeStructures || []);
    } catch { /* ignore */ }
  }, [token]);

  const fetchAttendanceStats = useCallback(async () => {
    setLoading(l => ({ ...l, attendance: true }));
    try {
      const data = await apiFetch(`/api/attendance/stats?date=${attendanceDate}`, token);
      setAttendanceStats(data);
    } catch { /* ignore */ }
    finally { setLoading(l => ({ ...l, attendance: false })); }
  }, [token, attendanceDate]);

  const fetchCRMPipeline = useCallback(async () => {
    try {
      const data = await apiFetch('/api/crm/pipeline', token);
      setCRMPipeline(data);
    } catch { /* ignore */ }
  }, [token]);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(l => ({ ...l, communication: true }));
    try {
      const data = await apiFetch('/api/communication/announcements?page=1&limit=20', token);
      setAnnouncements(data.announcements || []);
    } catch { /* ignore */ }
    finally { setLoading(l => ({ ...l, communication: false })); }
  }, [token]);

  const fetchActivities = useCallback(async () => {
    setLoading(l => ({ ...l, activities: true }));
    try {
      const data = await apiFetch('/api/dashboard/activities?limit=20', token);
      setActivitiesDB((data.activities || []).map((a: ActivityItem) => ({
        id: a.id, title: a.title, description: a.description, type: a.type, date: a.timestamp, status: 'COMPLETED',
      })));
    } catch { /* ignore */ }
    finally { setLoading(l => ({ ...l, activities: false })); }
  }, [token]);

  const fetchClasses = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch('/api/students?page=1&limit=50', token);
      const classMap = new Map<string, { id: string; name: string; program: { name: string } }>();
      (data.students || []).forEach((s: StudentData) => {
        if (s.class && !classMap.has(s.class.id)) {
          classMap.set(s.class.id, { id: s.class.id, name: s.class.name, program: s.class.program || { name: '' } });
        }
      });
      const classList = Array.from(classMap.values());
      setClasses(classList);

      const growthResults: GrowthClassData[] = [];
      for (const cls of classList.slice(0, 6)) {
        try {
          const gd = await apiFetch(`/api/growth/class/${cls.id}`, token);
          growthResults.push(gd);
        } catch { /* skip */ }
      }
      setGrowthData(growthResults);
    } catch { /* ignore */ }
  }, [token]);

  // Initial data load
  useEffect(() => {
    if (token) {
      fetchDashboardStats();
      fetchRevenueData();
      fetchRecentActivities();
    }
  }, [token, fetchDashboardStats, fetchRevenueData, fetchRecentActivities]);

  // Section-specific data load
  useEffect(() => {
    if (!token) return;
    switch (activeSection) {
      case 'students': fetchStudents(); break;
      case 'teachers': fetchTeachers(); break;
      case 'attendance': fetchAttendanceStats(); break;
      case 'fees': fetchFeeOverview(); fetchInvoices(); fetchFeeStructures(); break;
      case 'crm': fetchLeads(); fetchCRMPipeline(); break;
      case 'activities': fetchActivities(); break;
      case 'growth': fetchClasses(); break;
      case 'communication': fetchAnnouncements(); break;
    }
  }, [activeSection, token, fetchStudents, fetchTeachers, fetchAttendanceStats, fetchFeeOverview, fetchInvoices, fetchFeeStructures, fetchLeads, fetchCRMPipeline, fetchActivities, fetchClasses, fetchAnnouncements]);

  // ============================================================
  // COMPUTED
  // ============================================================
  const feePieData = useMemo(() => {
    if (feeOverview?.statusBreakdown) {
      const sb = feeOverview.statusBreakdown;
      return [
        { name: 'Collected', value: sb.PAID?.collected || feeOverview.totalCollected, color: '#10b981' },
        { name: 'Pending', value: sb.PENDING?.amount || feeOverview.totalPending, color: '#f59e0b' },
        { name: 'Overdue', value: sb.OVERDUE?.amount || 0, color: '#ef4444' },
      ].filter(d => d.value > 0);
    }
    return [{ name: 'No Data', value: 1, color: '#e5e7eb' }];
  }, [feeOverview]);

  const growthRadarData = useMemo(() => {
    if (growthData.length > 0 && growthData[0].classAverages) {
      const c = growthData[0].classAverages;
      const studentWithScore = growthData[0].students.find(s => s.growthScore);
      const s = studentWithScore?.growthScore;
      return [
        { subject: 'Creativity', Class: Math.round(c.creativity), Student: s ? Math.round(s.creativity) : 0 },
        { subject: 'Communication', Class: Math.round(c.communication), Student: s ? Math.round(s.communication) : 0 },
        { subject: 'Social', Class: Math.round(c.social), Student: s ? Math.round(s.social) : 0 },
        { subject: 'Confidence', Class: Math.round(c.confidence), Student: s ? Math.round(s.confidence) : 0 },
        { subject: 'Cognitive', Class: Math.round(c.cognitive), Student: s ? Math.round(s.cognitive) : 0 },
        { subject: 'Physical', Class: Math.round(c.physical), Student: s ? Math.round(s.physical) : 0 },
      ];
    }
    return [
      { subject: 'Creativity', Class: 0, Student: 0 },
      { subject: 'Communication', Class: 0, Student: 0 },
      { subject: 'Social', Class: 0, Student: 0 },
      { subject: 'Confidence', Class: 0, Student: 0 },
      { subject: 'Cognitive', Class: 0, Student: 0 },
      { subject: 'Physical', Class: 0, Student: 0 },
    ];
  }, [growthData]);

  // ============================================================
  // FORM HANDLERS
  // ============================================================
  const handleAddStudent = async () => {
    if (!token) return;
    try {
      await apiFetch('/api/students', token, {
        method: 'POST',
        body: JSON.stringify({ ...newStudent, branchId: user?.branchId }),
      });
      setAddStudentOpen(false);
      setNewStudent({ firstName: '', lastName: '', dob: '', gender: 'Male', bloodGroup: '', parentFirstName: '', parentLastName: '', parentPhone: '' });
      fetchStudents();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add student');
    }
  };

  const handleAddTeacher = async () => {
    if (!token) return;
    try {
      await apiFetch('/api/teachers', token, {
        method: 'POST',
        body: JSON.stringify({ ...newTeacher, branchId: user?.branchId, experience: parseInt(newTeacher.experience) || 0 }),
      });
      setAddTeacherOpen(false);
      setNewTeacher({ firstName: '', lastName: '', qualification: '', specialization: '', experience: '', phone: '', email: '' });
      fetchTeachers();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add teacher');
    }
  };

  const handleAddLead = async () => {
    if (!token) return;
    try {
      await apiFetch('/api/crm/leads', token, {
        method: 'POST',
        body: JSON.stringify(newLead),
      });
      setAddLeadOpen(false);
      setNewLead({ parentName: '', parentPhone: '', childName: '', programInterest: 'Nursery', source: 'WALK_IN', priority: 'NORMAL', notes: '' });
      fetchLeads();
      fetchCRMPipeline();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add lead');
    }
  };

  const handleAddAnnouncement = async () => {
    if (!token) return;
    try {
      await apiFetch('/api/communication/announcements', token, {
        method: 'POST',
        body: JSON.stringify(newAnnouncement),
      });
      setAddAnnouncementOpen(false);
      setNewAnnouncement({ title: '', type: 'General', target: 'All', content: '', priority: 'NORMAL' });
      fetchAnnouncements();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to create announcement');
    }
  };

  // ============================================================
  // SIDEBAR
  // ============================================================
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md">
          <Image src="/preonelogo.png" alt="PreOne" width={40} height={40} className="w-full h-full object-cover" />
        </div>
        <div>
          <h2 className="font-bold text-white text-lg leading-tight">PreOne</h2>
          <p className="text-violet-200 text-[10px]">Preschool ERP</p>
        </div>
      </div>
      <Separator className="bg-white/10 mx-3" />
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => { setActiveSection(item.id); setMobileSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
              activeSection === item.id
                ? 'bg-white/20 text-white font-medium shadow-sm'
                : 'text-violet-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-3">
        <Separator className="bg-white/10 mb-3" />
        <div className="flex items-center gap-2 px-3 py-2">
          <Avatar className="h-8 w-8 bg-white/20"><AvatarFallback className="bg-white/20 text-white text-xs">{user?.name?.charAt(0) || 'A'}</AvatarFallback></Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{user?.name || 'Admin'}</p>
            <p className="text-violet-200 text-[10px] truncate">{user?.role || 'ADMIN'}</p>
          </div>
          <button onClick={handleLogout} className="text-violet-200 hover:text-white p-1"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // RENDER: DASHBOARD
  // ============================================================
  const renderDashboard = () => {
    if (loading.dashboard && !dashboardStats) return <div className="space-y-6"><StatsSkeleton /></div>;
    const stats = dashboardStats || { totalStudents: 0, totalTeachers: 0, thisMonthRevenue: 0, newAdmissions: 0, occupancyRate: 0, attendanceRate: 0, feeBreakdown: { collected: 0, pending: 0, overdue: 0 }, activeLeads: 0 };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[
            { label: 'Total Students', value: stats.totalStudents, icon: GraduationCap, color: 'bg-violet-50 text-violet-600', iconBg: 'bg-violet-100' },
            { label: 'Total Teachers', value: stats.totalTeachers, icon: Users, color: 'bg-emerald-50 text-emerald-600', iconBg: 'bg-emerald-100' },
            { label: 'Monthly Revenue', value: formatCurrency(stats.thisMonthRevenue), icon: IndianRupee, color: 'bg-sky-50 text-sky-600', iconBg: 'bg-sky-100' },
            { label: 'Admissions', value: stats.newAdmissions, icon: UserPlus, color: 'bg-rose-50 text-rose-600', iconBg: 'bg-rose-100' },
            { label: 'Occupancy', value: `${stats.occupancyRate}%`, icon: Building2, color: 'bg-amber-50 text-amber-600', iconBg: 'bg-amber-100' },
            { label: 'Attendance', value: `${stats.attendanceRate}%`, icon: ClipboardCheck, color: 'bg-teal-50 text-teal-600', iconBg: 'bg-teal-100' },
          ].map((stat) => (
            <Card key={stat.label} className="relative overflow-hidden rounded-3xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${stat.iconBg}`}><stat.icon className="h-4 w-4" /></div>
                </div>
                <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Card className="md:col-span-2 rounded-3xl">
            <CardHeader><CardTitle className="text-base">Revenue Overview</CardTitle><CardDescription>Monthly revenue vs collections</CardDescription></CardHeader>
            <CardContent>
              {revenueData?.monthly ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={revenueData.monthly.filter(m => m.revenue > 0 || m.collections > 0)}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} /><stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} /><stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <RTooltip />
                    <Area type="monotone" dataKey="invoiced" stroke="#7C3AED" fill="url(#colorRevenue)" name="Invoiced" />
                    <Area type="monotone" dataKey="collections" stroke="#0EA5E9" fill="url(#colorCollections)" name="Collected" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <Skeleton className="h-[280px] w-full" />}
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivities.length > 0 ? recentActivities.slice(0, 8).map(a => {
                const Icon = getActivityIcon(a.type);
                const color = getActivityColor(a.type);
                return (
                  <div key={a.id} className="flex gap-3 items-start">
                    <div className={`p-1.5 rounded-lg bg-muted ${color}`}><Icon className="h-3.5 w-3.5" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{a.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{a.description}</p>
                      <p className="text-[10px] text-muted-foreground">{timeAgo(a.timestamp)}</p>
                    </div>
                  </div>
                );
              }) : <p className="text-sm text-muted-foreground">No recent activity</p>}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card className="rounded-3xl">
            <CardHeader><CardTitle className="text-base">Fee Breakdown</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={feePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {feePieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <RTooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {feePieData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />{d.name}</div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader><CardTitle className="text-base">Admission Pipeline</CardTitle></CardHeader>
            <CardContent>
              {crmPipeline ? (
                <div className="space-y-2">
                  {crmPipeline.pipeline.filter(p => p.count > 0).map(p => (
                    <div key={p.stage} className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: stageColors[p.stage] || '#94a3b8' }} />
                      <span className="text-xs w-20">{stageLabels[p.stage] || p.stage}</span>
                      <div className="flex-1"><Progress value={crmPipeline.totalLeads > 0 ? (p.count / crmPipeline.totalLeads) * 100 : 0} className="h-2" /></div>
                      <span className="text-xs font-medium w-6 text-right">{p.count}</span>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Total Leads</span><span className="font-medium">{crmPipeline.totalLeads}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Conversion Rate</span><span className="font-medium text-emerald-600">{crmPipeline.conversionRate}%</span></div>
                </div>
              ) : <Skeleton className="h-[200px] w-full" />}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER: STUDENTS
  // ============================================================
  const renderStudents = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search students..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="pl-9 rounded-xl" />
        </div>
        <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
          <Button onClick={() => setAddStudentOpen(true)} className="bg-gradient-to-r from-violet-600 to-sky-500 text-white rounded-xl">
            <Plus className="h-4 w-4 mr-1" /> Add Student
          </Button>
          <DialogContent className="rounded-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add New Student</DialogTitle><DialogDescription>Enter student and parent details</DialogDescription></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>First Name</Label><Input value={newStudent.firstName} onChange={e => setNewStudent(s => ({ ...s, firstName: e.target.value }))} /></div>
                <div><Label>Last Name</Label><Input value={newStudent.lastName} onChange={e => setNewStudent(s => ({ ...s, lastName: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date of Birth</Label><Input type="date" value={newStudent.dob} onChange={e => setNewStudent(s => ({ ...s, dob: e.target.value }))} /></div>
                <div><Label>Gender</Label><Select value={newStudent.gender} onValueChange={v => setNewStudent(s => ({ ...s, gender: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent></Select></div>
              </div>
              <div><Label>Blood Group</Label><Input value={newStudent.bloodGroup} onChange={e => setNewStudent(s => ({ ...s, bloodGroup: e.target.value }))} placeholder="e.g., B+" /></div>
              <Separator className="my-1" />
              <p className="text-sm font-medium text-muted-foreground">Parent Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Parent First Name</Label><Input value={newStudent.parentFirstName} onChange={e => setNewStudent(s => ({ ...s, parentFirstName: e.target.value }))} /></div>
                <div><Label>Parent Last Name</Label><Input value={newStudent.parentLastName} onChange={e => setNewStudent(s => ({ ...s, parentLastName: e.target.value }))} /></div>
              </div>
              <div><Label>Parent Phone</Label><Input value={newStudent.parentPhone} onChange={e => setNewStudent(s => ({ ...s, parentPhone: e.target.value }))} placeholder="+91 98765 43210" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddStudentOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleAddStudent} className="bg-gradient-to-r from-violet-600 to-sky-500 text-white rounded-xl">Add Student</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading.students ? <TableSkeleton /> : (
        <Card className="rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="hidden md:table-cell">Roll No</TableHead>
                    <TableHead className="hidden sm:table-cell">Gender</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No students found</TableCell></TableRow>
                  ) : students.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8"><AvatarFallback className="bg-violet-100 text-violet-700 text-xs">{s.firstName[0]}{s.lastName[0]}</AvatarFallback></Avatar>
                          <div><p className="text-sm font-medium">{s.firstName} {s.lastName}</p><p className="text-[10px] text-muted-foreground">{s.parents?.[0]?.parent ? `${s.parents[0].parent.firstName} ${s.parents[0].parent.lastName}` : ''}</p></div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{s.class?.name || 'Unassigned'}</Badge></TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{s.rollNumber || '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{s.gender || '—'}</TableCell>
                      <TableCell><Badge className={`text-[10px] ${statusColors[s.status] || 'bg-slate-100 text-slate-700'}`}>{s.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // ============================================================
  // RENDER: TEACHERS
  // ============================================================
  const renderTeachers = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search teachers..." value={teacherSearch} onChange={e => setTeacherSearch(e.target.value)} className="pl-9 rounded-xl" />
        </div>
        <Dialog open={addTeacherOpen} onOpenChange={setAddTeacherOpen}>
          <Button onClick={() => setAddTeacherOpen(true)} className="bg-gradient-to-r from-violet-600 to-sky-500 text-white rounded-xl">
            <Plus className="h-4 w-4 mr-1" /> Add Teacher
          </Button>
          <DialogContent className="rounded-3xl">
            <DialogHeader><DialogTitle>Add New Teacher</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>First Name</Label><Input value={newTeacher.firstName} onChange={e => setNewTeacher(t => ({ ...t, firstName: e.target.value }))} /></div>
                <div><Label>Last Name</Label><Input value={newTeacher.lastName} onChange={e => setNewTeacher(t => ({ ...t, lastName: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Phone</Label><Input value={newTeacher.phone} onChange={e => setNewTeacher(t => ({ ...t, phone: e.target.value }))} /></div>
                <div><Label>Email</Label><Input value={newTeacher.email} onChange={e => setNewTeacher(t => ({ ...t, email: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Qualification</Label><Input value={newTeacher.qualification} onChange={e => setNewTeacher(t => ({ ...t, qualification: e.target.value }))} /></div>
                <div><Label>Experience (yrs)</Label><Input type="number" value={newTeacher.experience} onChange={e => setNewTeacher(t => ({ ...t, experience: e.target.value }))} /></div>
              </div>
              <div><Label>Specialization</Label><Input value={newTeacher.specialization} onChange={e => setNewTeacher(t => ({ ...t, specialization: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddTeacherOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleAddTeacher} className="bg-gradient-to-r from-violet-600 to-sky-500 text-white rounded-xl">Add Teacher</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading.teachers ? <TableSkeleton /> : (
        <Card className="rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead className="hidden md:table-cell">Qualification</TableHead>
                    <TableHead className="hidden sm:table-cell">Experience</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No teachers found</TableCell></TableRow>
                  ) : teachers.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8"><AvatarFallback className="bg-sky-100 text-sky-700 text-xs">{t.firstName[0]}{t.lastName[0]}</AvatarFallback></Avatar>
                          <div><p className="text-sm font-medium">{t.firstName} {t.lastName}</p><p className="text-[10px] text-muted-foreground">{t.email}</p></div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{t.assignedClass?.name || 'Unassigned'}</Badge></TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{t.qualification || '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">{t.experience || 0} yrs</TableCell>
                      <TableCell><Badge className={`text-[10px] ${statusColors[t.status] || 'bg-slate-100 text-slate-700'}`}>{t.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // ============================================================
  // RENDER: ATTENDANCE
  // ============================================================
  const renderAttendance = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm">Date:</Label>
          <Input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="w-44 rounded-xl" />
        </div>
      </div>

      {loading.attendance ? <StatsSkeleton count={3} /> : attendanceStats ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card className="rounded-3xl"><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{attendanceStats.students.present}</p><p className="text-xs text-muted-foreground">Present</p></CardContent></Card>
            <Card className="rounded-3xl"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-rose-600">{attendanceStats.students.absent}</p><p className="text-xs text-muted-foreground">Absent</p></CardContent></Card>
            <Card className="rounded-3xl"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{attendanceStats.students.late}</p><p className="text-xs text-muted-foreground">Late</p></CardContent></Card>
            <Card className="rounded-3xl"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-slate-400">{attendanceStats.students.total - attendanceStats.students.marked}</p><p className="text-xs text-muted-foreground">Unmarked</p></CardContent></Card>
            <Card className="rounded-3xl"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{attendanceStats.students.attendanceRate}%</p><p className="text-xs text-muted-foreground">Rate</p></CardContent></Card>
          </div>

          <Card className="rounded-3xl">
            <CardHeader><CardTitle className="text-base">Class-wise Attendance</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Class</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Present</TableHead>
                      <TableHead>Absent</TableHead>
                      <TableHead>Late</TableHead>
                      <TableHead>Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceStats.classWise.map(cw => (
                      <TableRow key={cw.classId}>
                        <TableCell className="font-medium text-sm">{cw.className}</TableCell>
                        <TableCell className="text-sm">{cw.totalStudents}</TableCell>
                        <TableCell className="text-sm text-emerald-600">{cw.present}</TableCell>
                        <TableCell className="text-sm text-rose-600">{cw.absent}</TableCell>
                        <TableCell className="text-sm text-amber-600">{cw.late}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2"><Progress value={cw.attendanceRate} className="h-2 w-16" /><span className="text-sm font-medium">{cw.attendanceRate}%</span></div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : <p className="text-muted-foreground text-center py-8">No attendance data available</p>}
    </div>
  );

  // ============================================================
  // RENDER: FEES
  // ============================================================
  const renderFees = () => (
    <div className="space-y-4">
      {feeOverview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="rounded-3xl"><CardContent className="p-4 text-center"><p className="text-lg font-bold">{formatCurrency(feeOverview.totalInvoiced)}</p><p className="text-xs text-muted-foreground">Total Invoiced</p></CardContent></Card>
          <Card className="rounded-3xl"><CardContent className="p-4 text-center"><p className="text-lg font-bold text-emerald-600">{formatCurrency(feeOverview.totalCollected)}</p><p className="text-xs text-muted-foreground">Collected</p></CardContent></Card>
          <Card className="rounded-3xl"><CardContent className="p-4 text-center"><p className="text-lg font-bold text-amber-600">{formatCurrency(feeOverview.totalPending)}</p><p className="text-xs text-muted-foreground">Pending</p></CardContent></Card>
          <Card className="rounded-3xl"><CardContent className="p-4 text-center"><p className="text-lg font-bold text-sky-600">{feeOverview.collectionRate}%</p><p className="text-xs text-muted-foreground">Collection Rate</p></CardContent></Card>
        </div>
      )}

      <Tabs defaultValue="invoices">
        <TabsList className="rounded-xl">
          <TabsTrigger value="invoices" className="rounded-lg">Invoices</TabsTrigger>
          <TabsTrigger value="structures" className="rounded-lg">Fee Structures</TabsTrigger>
        </TabsList>
        <TabsContent value="invoices" className="mt-4">
          <Card className="rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="hidden sm:table-cell">Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No invoices found</TableCell></TableRow>
                    ) : invoices.map(inv => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs">{inv.invoiceNo}</TableCell>
                        <TableCell className="text-sm">{inv.student.firstName} {inv.student.lastName}</TableCell>
                        <TableCell className="text-sm font-medium">{formatCurrency(inv.netAmount)}</TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{formatDate(inv.dueDate)}</TableCell>
                        <TableCell><Badge className={`text-[10px] ${invoiceStatusColors[inv.status] || ''}`}>{inv.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="structures" className="mt-4">
          <Card className="rounded-3xl overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Frequency</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeStructures.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No fee structures found</TableCell></TableRow>
                    ) : feeStructures.map(fs => (
                      <TableRow key={fs.id}>
                        <TableCell className="text-sm font-medium">{fs.name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{fs.type}</Badge></TableCell>
                        <TableCell className="text-sm font-medium">{formatCurrency(fs.amount)}</TableCell>
                        <TableCell className="text-sm">{fs.frequency}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  // ============================================================
  // RENDER: CRM
  // ============================================================
  const renderCRM = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Admission Pipeline</h3>
        <Dialog open={addLeadOpen} onOpenChange={setAddLeadOpen}>
          <Button onClick={() => setAddLeadOpen(true)} className="bg-gradient-to-r from-violet-600 to-sky-500 text-white rounded-xl">
            <Plus className="h-4 w-4 mr-1" /> Add Lead
          </Button>
          <DialogContent className="rounded-3xl">
            <DialogHeader><DialogTitle>Add New Lead</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Parent Name</Label><Input value={newLead.parentName} onChange={e => setNewLead(l => ({ ...l, parentName: e.target.value }))} /></div>
                <div><Label>Parent Phone</Label><Input value={newLead.parentPhone} onChange={e => setNewLead(l => ({ ...l, parentPhone: e.target.value }))} /></div>
              </div>
              <div><Label>Child Name</Label><Input value={newLead.childName} onChange={e => setNewLead(l => ({ ...l, childName: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Program</Label><Select value={newLead.programInterest} onValueChange={v => setNewLead(l => ({ ...l, programInterest: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Nursery">Nursery</SelectItem><SelectItem value="LKG">LKG</SelectItem><SelectItem value="UKG">UKG</SelectItem></SelectContent></Select></div>
                <div><Label>Source</Label><Select value={newLead.source} onValueChange={v => setNewLead(l => ({ ...l, source: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="WALK_IN">Walk In</SelectItem><SelectItem value="WEBSITE">Website</SelectItem><SelectItem value="REFERRAL">Referral</SelectItem><SelectItem value="INSTAGRAM">Instagram</SelectItem><SelectItem value="FACEBOOK">Facebook</SelectItem><SelectItem value="GOOGLE">Google</SelectItem></SelectContent></Select></div>
              </div>
              <div><Label>Notes</Label><Textarea value={newLead.notes} onChange={e => setNewLead(l => ({ ...l, notes: e.target.value }))} rows={2} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddLeadOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleAddLead} className="bg-gradient-to-r from-violet-600 to-sky-500 text-white rounded-xl">Add Lead</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {crmPipeline && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {crmPipeline.pipeline.map(p => (
            <Card key={p.stage} className="rounded-2xl text-center">
              <CardContent className="p-3">
                <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: stageColors[p.stage] || '#94a3b8' }} />
                <p className="text-lg font-bold">{p.count}</p>
                <p className="text-[10px] text-muted-foreground">{stageLabels[p.stage] || p.stage}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loading.leads ? <TableSkeleton /> : (
        <Card className="rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Parent</TableHead><TableHead>Child</TableHead><TableHead className="hidden md:table-cell">Source</TableHead><TableHead>Stage</TableHead><TableHead className="hidden sm:table-cell">Priority</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {leads.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No leads found</TableCell></TableRow>
                  ) : leads.map(l => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <div><p className="text-sm font-medium">{l.parentName}</p><p className="text-[10px] text-muted-foreground">{l.parentPhone}</p></div>
                      </TableCell>
                      <TableCell className="text-sm">{l.childName}</TableCell>
                      <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-[10px]">{l.source}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stageColors[l.stage] || '#94a3b8' }} />
                          <span className="text-xs">{stageLabels[l.stage] || l.stage}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell"><Badge className={`text-[10px] ${priorityColors[l.priority] || ''}`}>{l.priority}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // ============================================================
  // RENDER: ACTIVITIES
  // ============================================================
  const renderActivities = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">School Activities</h3>
      {loading.activities ? <StatsSkeleton count={3} /> : activitiesDB.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activitiesDB.map(a => (
            <Card key={a.id} className="rounded-3xl">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-violet-100 text-violet-600"><Palette className="h-4 w-4" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px]">{a.type}</Badge>
                      <span className="text-[10px] text-muted-foreground"><Clock className="h-3 w-3 inline mr-0.5" />{formatDate(a.date)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : <p className="text-muted-foreground text-center py-8">No activities found</p>}
    </div>
  );

  // ============================================================
  // RENDER: GROWTH
  // ============================================================
  const renderGrowth = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Student Growth</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-3xl">
          <CardHeader><CardTitle className="text-base">Growth Radar</CardTitle><CardDescription>Class average vs top student</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={growthRadarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="Class Avg" dataKey="Class" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.15} />
                <Radar name="Student" dataKey="Student" stroke="#0EA5E9" fill="#0EA5E9" fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-3xl">
          <CardHeader><CardTitle className="text-base">Class Comparison</CardTitle><CardDescription>Overall growth scores by class</CardDescription></CardHeader>
          <CardContent>
            {growthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={growthData.filter(g => g.classAverages).map(g => ({ name: g.class.name, overall: Math.round(g.classAverages!.overall) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <RTooltip />
                  <Bar dataKey="overall" fill="#7C3AED" radius={[8, 8, 0, 0]} name="Overall Score" />
                </BarChart>
              </ResponsiveContainer>
            ) : <Skeleton className="h-[300px] w-full" />}
          </CardContent>
        </Card>
      </div>

      {growthData.some(g => g.needsAttention.length > 0) && (
        <Card className="rounded-3xl">
          <CardHeader><CardTitle className="text-base text-amber-600">Needs Attention</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {growthData.flatMap(g => g.needsAttention).map(n => (
                <Badge key={n.id} variant="outline" className="text-xs border-amber-300 text-amber-700">{n.name} — {n.weakestArea}: {n.overall}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {growthData.some(g => g.topPerformers.length > 0) && (
        <Card className="rounded-3xl">
          <CardHeader><CardTitle className="text-base text-emerald-600">Top Performers</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {growthData.flatMap(g => g.topPerformers).map(t => (
                <Badge key={t.id} variant="outline" className="text-xs border-emerald-300 text-emerald-700"><Star className="h-3 w-3 mr-0.5" />{t.name} — {t.overall}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // ============================================================
  // RENDER: COMMUNICATION
  // ============================================================
  const renderCommunication = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Announcements</h3>
        <Dialog open={addAnnouncementOpen} onOpenChange={setAddAnnouncementOpen}>
          <Button onClick={() => setAddAnnouncementOpen(true)} className="bg-gradient-to-r from-violet-600 to-sky-500 text-white rounded-xl">
            <Plus className="h-4 w-4 mr-1" /> New Announcement
          </Button>
          <DialogContent className="rounded-3xl">
            <DialogHeader><DialogTitle>Create Announcement</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div><Label>Title</Label><Input value={newAnnouncement.title} onChange={e => setNewAnnouncement(a => ({ ...a, title: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Type</Label><Select value={newAnnouncement.type} onValueChange={v => setNewAnnouncement(a => ({ ...a, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="General">General</SelectItem><SelectItem value="Event">Event</SelectItem><SelectItem value="Fee">Fee</SelectItem><SelectItem value="Academic">Academic</SelectItem><SelectItem value="Health">Health</SelectItem></SelectContent></Select></div>
                <div><Label>Target</Label><Select value={newAnnouncement.target} onValueChange={v => setNewAnnouncement(a => ({ ...a, target: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All</SelectItem><SelectItem value="Parents">Parents</SelectItem><SelectItem value="Teachers">Teachers</SelectItem></SelectContent></Select></div>
              </div>
              <div><Label>Priority</Label><Select value={newAnnouncement.priority} onValueChange={v => setNewAnnouncement(a => ({ ...a, priority: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="LOW">Low</SelectItem><SelectItem value="NORMAL">Normal</SelectItem><SelectItem value="HIGH">High</SelectItem></SelectContent></Select></div>
              <div><Label>Content</Label><Textarea value={newAnnouncement.content} onChange={e => setNewAnnouncement(a => ({ ...a, content: e.target.value }))} rows={4} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddAnnouncementOpen(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleAddAnnouncement} className="bg-gradient-to-r from-violet-600 to-sky-500 text-white rounded-xl">Publish</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading.communication ? <StatsSkeleton count={3} /> : announcements.length > 0 ? (
        <div className="space-y-3">
          {announcements.map(a => (
            <Card key={a.id} className="rounded-3xl">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium">{a.title}</p>
                      <Badge className={`text-[10px] ${priorityColors[a.priority] || ''}`}>{a.priority}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-[10px]">{a.type}</Badge>
                      <Badge variant="outline" className="text-[10px]">{a.target}</Badge>
                      <span className="text-[10px] text-muted-foreground">{formatDate(a.publishedAt || a.createdAt)}</span>
                    </div>
                  </div>
                  <Megaphone className="h-5 w-5 text-violet-400 shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : <p className="text-muted-foreground text-center py-8">No announcements found</p>}
    </div>
  );

  // ============================================================
  // RENDER: SETTINGS
  // ============================================================
  const renderSettings = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Settings</h3>
      <Card className="rounded-3xl">
        <CardHeader><CardTitle className="text-base">School Information</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label className="text-xs text-muted-foreground">School Name</Label><p className="text-sm font-medium">Little Stars Preschool</p></div>
            <div><Label className="text-xs text-muted-foreground">Academic Year</Label><p className="text-sm font-medium">2024-2025</p></div>
            <div><Label className="text-xs text-muted-foreground">Board</Label><p className="text-sm font-medium">CBSE</p></div>
            <div><Label className="text-xs text-muted-foreground">School Code</Label><p className="text-sm font-medium">LSP-001</p></div>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-3xl">
        <CardHeader><CardTitle className="text-base">Account</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label className="text-xs text-muted-foreground">Name</Label><p className="text-sm font-medium">{user?.name || 'Admin'}</p></div>
            <div><Label className="text-xs text-muted-foreground">Email</Label><p className="text-sm font-medium">{user?.email || 'admin@preone.com'}</p></div>
            <div><Label className="text-xs text-muted-foreground">Role</Label><p className="text-sm font-medium">{user?.role || 'ADMIN'}</p></div>
          </div>
          <Button variant="outline" onClick={handleLogout} className="rounded-xl mt-4"><LogOut className="h-4 w-4 mr-2" />Sign Out</Button>
        </CardContent>
      </Card>
    </div>
  );

  // ============================================================
  // RENDER: SECTION CONTENT
  // ============================================================
  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return renderDashboard();
      case 'students': return renderStudents();
      case 'teachers': return renderTeachers();
      case 'attendance': return renderAttendance();
      case 'fees': return renderFees();
      case 'crm': return renderCRM();
      case 'activities': return renderActivities();
      case 'growth': return renderGrowth();
      case 'communication': return renderCommunication();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================
  if (!authChecked) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-500" /></div>;

  if (!token || !user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen flex bg-gray-50/80">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-[260px] bg-gradient-to-b from-violet-700 via-violet-600 to-sky-600 text-white flex flex-col shrink-0 sticky top-0 h-screen">
          <SidebarContent />
        </aside>
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="p-0 w-[260px] bg-gradient-to-b from-violet-700 via-violet-600 to-sky-600 border-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button onClick={() => setMobileSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-muted">
                <Menu className="h-5 w-5" />
              </button>
            )}
            <h1 className="text-base sm:text-lg font-semibold capitalize">{activeSection === 'crm' ? 'Admission CRM' : activeSection}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] hidden sm:flex">{user.role}</Badge>
            <Avatar className="h-8 w-8 bg-gradient-to-br from-violet-500 to-sky-500">
              <AvatarFallback className="bg-transparent text-white text-xs">{user.name?.charAt(0) || 'A'}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Section Content */}
        <div className="p-4 sm:p-6 max-w-7xl mx-auto">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}
