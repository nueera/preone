'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import {
  LayoutDashboard, Users, GraduationCap, ClipboardCheck, Receipt,
  Megaphone, Palette, TrendingUp, MessageSquare, Settings, ChevronLeft,
  ChevronRight, Search, Plus, MoreVertical, Phone, Mail, Star, Clock,
  CheckCircle2, XCircle, AlertTriangle, ArrowUpRight, ArrowDownRight,
  IndianRupee, UserPlus, Calendar, Filter, Download, Bell, Send,
  BarChart3, Activity, Baby, Heart, Eye, BookOpen, Target, Sparkles,
  Bot, FileText, Image as ImageIcon, Video, MapPin, Zap, CircleDot, UserCheck,
  UserX, Timer, TrendingDown, Award, ChevronDown, Edit, Trash2,
  ExternalLink, Home, Building2, Smile, Frown, Meh, X, Check,
  LogOut, Loader2
} from 'lucide-react';

// Dynamic imports for role-based portals (code splitting)
const ParentPortal = dynamic(() => import('@/components/parent-portal'), { ssr: false });
const TeacherPortal = dynamic(() => import('@/components/teacher-portal'), { ssr: false });
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, PieChart,
  Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, Legend,
} from 'recharts';

// ============================================================
// TYPES
// ============================================================
type Section = 'dashboard' | 'students' | 'teachers' | 'attendance' | 'fees' | 'crm' | 'activities' | 'growth' | 'communication' | 'settings';

interface NavItem {
  id: Section;
  label: string;
  icon: React.ElementType;
}

interface AuthUser {
  userId: string;
  email: string;
  role: string;
  branchId?: string | null;
}

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalRevenue: number;
  thisMonthRevenue: number;
  newAdmissions: number;
  occupancyRate: number;
  satisfactionRate: number;
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
  admissionNo?: string;
  class?: { id: string; name: string; program?: { name: string } };
  parents?: { parent: { id: string; firstName: string; lastName: string; phone: string; relation: string } }[];
  _count?: { attendance: number; invoices: number };
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
  staffType?: string;
  class?: { id: string; name: string };
  _count?: { qualifications: number; leaves: number };
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
  nextFollowUpDate?: string;
  programInterest?: string;
  notes?: string;
  estimatedFee?: number;
}

interface InvoiceData {
  id: string;
  invoiceNo: string;
  totalAmount: number;
  paidAmount: number;
  amount: number;
  status: string;
  dueDate: string;
  student: { id: string; firstName: string; lastName: string };
  feeStructure?: { id: string; name: string; feeType: string };
}

interface AttendanceStatsData {
  date: string;
  students: { total: number; marked: number; present: number; absent: number; late: number; attendanceRate: number };
  staff: { total: number; present: number; absent: number; onLeave: number; late: number };
  classWise: { classId: string; className: string; totalStudents: number; present: number; absent: number; late: number; attendanceRate: number }[];
}

interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  type: string;
  targetAudience: string;
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
  feeType: string;
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
  teacher?: { id: string; firstName: string; lastName: string };
  class?: { id: string; name: string };
}

interface GrowthClassData {
  class: { id: string; name: string; program: { name: string } };
  classAverages?: {
    creativity: number; communication: number; socialSkills: number;
    confidence: number; cognitive: number; physical: number; overall: number;
  };
  students: { id: string; firstName: string; lastName: string; growthScore?: { creativity: number; communication: number; socialSkills: number; confidence: number; cognitive: number; physical: number; overall: number } }[];
  needsAttention: { id: string; name: string; overall: number; weakestArea: string }[];
  topPerformers: { id: string; name: string; overall: number }[];
}

interface CommStats {
  announcements: { total: number; publishedThisMonth: number; scheduled: number; byType: Record<string, number> };
  chat: { activeThreads: number; messagesThisMonth: number };
  notifications: { feeRemindersSent: number };
}

// ============================================================
// CONSTANTS
// ============================================================
const NAV_ITEMS: NavItem[] = [
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
  NewInquiry: 'New Inquiry', Visit: 'Visit Scheduled', Tour: 'School Tour',
  Demo: 'Demo Given', FollowUp: 'Follow-up', Confirmed: 'Confirmed', Enrolled: 'Enrolled', Lost: 'Lost',
};

const stageColors: Record<string, string> = {
  NewInquiry: '#7C3AED', Visit: '#0EA5E9', Tour: '#f97316', Demo: '#ea580c',
  FollowUp: '#10b981', Confirmed: '#059669', Enrolled: '#047857', Lost: '#94a3b8',
};

const Globe = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
);

const Brain = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></svg>
);

// ============================================================
// HELPER: API fetch with auth
// ============================================================
async function apiFetch(url: string, token: string | null, options?: RequestInit) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

function formatCurrency(value: number) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return `₹${value.toLocaleString()}`;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  try { return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return dateStr; }
}

function timeAgo(dateStr: string) {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = now.getTime() - then.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getActivityIcon(type: string) {
  switch (type) {
    case 'student_enrollment': return UserPlus;
    case 'payment_received': return IndianRupee;
    case 'attendance_marked': return ClipboardCheck;
    case 'new_lead': return Megaphone;
    case 'announcement': return Bell;
    default: return Activity;
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case 'student_enrollment': return 'text-emerald-500';
    case 'payment_received': return 'text-sky-500';
    case 'attendance_marked': return 'text-blue-500';
    case 'new_lead': return 'text-orange-500';
    case 'announcement': return 'text-rose-500';
    default: return 'text-purple-500';
  }
}

// ============================================================
// LOGIN SCREEN COMPONENT
// ============================================================
function LoginScreen({ onLogin }: { onLogin: (token: string, user: Record<string, unknown>) => void }) {
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
    <div className="min-h-screen flex items-center justify-center bg-login-gradient space-dots p-4">
      <Card className="w-full max-w-md shadow-xl border-0 rounded-3xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-violet-500/25">
            <Image src="/preonelogo.png" alt="PreOne" width={64} height={64} className="w-full h-full object-cover" />
          </div>
          <CardTitle className="text-2xl font-bold">PreOne</CardTitle>
          <CardDescription>Preschool ERP System</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 text-sm bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">{error}</div>
            )}
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
                <Badge variant="outline" className="text-[10px] cursor-pointer" onClick={() => { setEmail('admin@preone.com'); setPassword('password123'); }}>Admin</Badge>
                <Badge variant="outline" className="text-[10px] cursor-pointer" onClick={() => { setEmail('kavitha.raman@littlestars.com'); setPassword('password123'); }}>Teacher</Badge>
                <Badge variant="outline" className="text-[10px] cursor-pointer" onClick={() => { setEmail('rajesh.sharma@email.com'); setPassword('password123'); }}>Parent</Badge>
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
        <Card key={i}><CardContent className="p-4"><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-8 w-16" /></CardContent></Card>
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>{Array.from({ length: cols }).map((_, i) => <TableHead key={i}><Skeleton className="h-4 w-20" /></TableHead>)}</TableRow></TableHeader>
          <TableBody>{Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>{Array.from({ length: cols }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}</TableRow>
          ))}</TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function CardSkeleton() {
  return <Card><CardHeader><Skeleton className="h-5 w-40" /><Skeleton className="h-3 w-60" /></CardHeader><CardContent><Skeleton className="h-[200px] w-full" /></CardContent></Card>;
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function PreOneDashboard() {
  // Auth state
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Navigation
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
  const [commStats, setCommStats] = useState<CommStats | null>(null);
  const [activitiesDB, setActivitiesDB] = useState<ActivityDB[]>([]);
  const [growthData, setGrowthData] = useState<GrowthClassData[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string; program: { name: string } }[]>([]);

  // Loading states
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // UI states
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState('all');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addTeacherOpen, setAddTeacherOpen] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [addActivityOpen, setAddActivityOpen] = useState(false);
  const [addAnnouncementOpen, setAddAnnouncementOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('all');

  // Form states
  const [newStudent, setNewStudent] = useState({ firstName: '', lastName: '', dob: '', gender: 'Male', bloodGroup: '', parentFirstName: '', parentLastName: '', parentPhone: '', address: '' });
  const [newTeacher, setNewTeacher] = useState({ firstName: '', lastName: '', qualification: '', specialization: '', experience: '', phone: '', email: '' });
  const [newLead, setNewLead] = useState({ parentName: '', parentPhone: '', childName: '', programInterest: 'Nursery', source: 'WalkIn', priority: 'Medium', notes: '' });
  const [newActivity, setNewActivity] = useState({ title: '', type: 'Art', description: '', date: '', time: '09:00 - 11:00', classId: 'all' });
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', type: 'General', targetAudience: 'All', content: '', priority: 'Normal' });

  // ============================================================
  // AUTH
  // ============================================================
  useEffect(() => {
    const savedToken = localStorage.getItem('preone_token');
    const savedUser = localStorage.getItem('preone_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      try { setUser(JSON.parse(savedUser)); } catch { setUser({}); }
    }
    setAuthChecked(true);
  }, []);

  const handleLogin = (newToken: string, newUser: Record<string, unknown>) => {
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
  const setLoadingState = useCallback((key: string, val: boolean) => {
    setLoading(prev => ({ ...prev, [key]: val }));
  }, []);

  const setErrorState = useCallback((key: string, val: string) => {
    setErrors(prev => ({ ...prev, [key]: val }));
  }, []);

  const fetchDashboardStats = useCallback(async () => {
    setLoadingState('dashboard', true);
    try {
      const data = await apiFetch('/api/dashboard/stats', null); // No auth for demo
      setDashboardStats(data);
      setErrorState('dashboard', '');
    } catch (err: unknown) {
      setErrorState('dashboard', err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally { setLoadingState('dashboard', false); }
  }, [setLoadingState, setErrorState]);

  const fetchRevenueData = useCallback(async () => {
    if (!token) return;
    setLoadingState('revenue', true);
    try {
      const data = await apiFetch('/api/dashboard/revenue', token);
      setRevenueData(data);
    } catch { /* ignore */ }
    finally { setLoadingState('revenue', false); }
  }, [token, setLoadingState]);

  const fetchRecentActivities = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch('/api/dashboard/activities?limit=10', token);
      setRecentActivities(data.activities || []);
    } catch { /* ignore */ }
  }, [token]);

  const fetchStudents = useCallback(async () => {
    if (!token) return;
    setLoadingState('students', true);
    try {
      const data = await apiFetch(`/api/students?page=1&limit=50&search=${encodeURIComponent(studentSearch)}`, token);
      setStudents(data.students || []);
    } catch { setErrorState('students', 'Failed to load students'); }
    finally { setLoadingState('students', false); }
  }, [token, studentSearch, setLoadingState, setErrorState]);

  const fetchTeachers = useCallback(async () => {
    if (!token) return;
    setLoadingState('teachers', true);
    try {
      const data = await apiFetch(`/api/teachers?page=1&limit=50&search=${encodeURIComponent(teacherSearch)}`, token);
      setTeachers(data.teachers || []);
    } catch { setErrorState('teachers', 'Failed to load teachers'); }
    finally { setLoadingState('teachers', false); }
  }, [token, teacherSearch, setLoadingState, setErrorState]);

  const fetchLeads = useCallback(async () => {
    if (!token) return;
    setLoadingState('leads', true);
    try {
      const data = await apiFetch('/api/crm/leads?page=1&limit=50', token);
      setLeads(data.leads || []);
    } catch { setErrorState('leads', 'Failed to load leads'); }
    finally { setLoadingState('leads', false); }
  }, [token, setLoadingState, setErrorState]);

  const fetchInvoices = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch('/api/fees/invoices?page=1&limit=20', token);
      setInvoices(data.invoices || []);
    } catch { /* ignore */ }
  }, [token]);

  const fetchFeeOverview = useCallback(async () => {
    if (!token) return;
    setLoadingState('fees', true);
    try {
      const data = await apiFetch('/api/fees/overview', token);
      setFeeOverview(data);
    } catch { setErrorState('fees', 'Failed to load fees'); }
    finally { setLoadingState('fees', false); }
  }, [token, setLoadingState, setErrorState]);

  const fetchFeeStructures = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch('/api/fees/structures', token);
      setFeeStructures(data.feeStructures || []);
    } catch { /* ignore */ }
  }, [token]);

  const fetchAttendanceStats = useCallback(async () => {
    if (!token) return;
    setLoadingState('attendance', true);
    try {
      const data = await apiFetch(`/api/attendance/stats?date=${attendanceDate}`, token);
      setAttendanceStats(data);
    } catch { setErrorState('attendance', 'Failed to load attendance'); }
    finally { setLoadingState('attendance', false); }
  }, [token, attendanceDate, setLoadingState, setErrorState]);

  const fetchCRMPipeline = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch('/api/crm/pipeline', token);
      setCRMPipeline(data);
    } catch { /* ignore */ }
  }, [token]);

  const fetchAnnouncements = useCallback(async () => {
    if (!token) return;
    setLoadingState('communication', true);
    try {
      const data = await apiFetch('/api/communication/announcements?page=1&limit=20', token);
      setAnnouncements(data.announcements || []);
    } catch { /* ignore */ }
    finally { setLoadingState('communication', false); }
  }, [token, setLoadingState]);

  const fetchCommStats = useCallback(async () => {
    if (!token) return;
    try {
      const data = await apiFetch('/api/communication/stats', token);
      setCommStats(data);
    } catch { /* ignore */ }
  }, [token]);

  const fetchActivities = useCallback(async () => {
    if (!token) return;
    setLoadingState('activities', true);
    try {
      // Use dashboard activities endpoint as there's no direct activities list endpoint
      // We'll also fetch from students to have activities data
      const data = await apiFetch('/api/dashboard/activities?limit=20', token);
      setActivitiesDB((data.activities || []).map((a: ActivityItem) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        type: a.type,
        date: a.timestamp,
        status: 'Completed',
      })));
    } catch { /* ignore */ }
    finally { setLoadingState('activities', false); }
  }, [token, setLoadingState]);

  const fetchClasses = useCallback(async () => {
    if (!token) return;
    try {
      // Fetch students to extract class info
      const data = await apiFetch('/api/students?page=1&limit=50', token);
      const classMap = new Map<string, { id: string; name: string; program: { name: string } }>();
      (data.students || []).forEach((s: StudentData) => {
        if (s.class && !classMap.has(s.class.id)) {
          classMap.set(s.class.id, { id: s.class.id, name: s.class.name, program: s.class.program || { name: '' } });
        }
      });
      const classList = Array.from(classMap.values());
      setClasses(classList);

      // Fetch growth data for each class
      const growthResults: GrowthClassData[] = [];
      for (const cls of classList.slice(0, 6)) {
        try {
          const growthData = await apiFetch(`/api/growth/class/${cls.id}`, token);
          growthResults.push(growthData);
        } catch { /* skip */ }
      }
      setGrowthData(growthResults);
    } catch { /* ignore */ }
  }, [token]);

  // ============================================================
  // INITIAL DATA LOAD
  // ============================================================
  useEffect(() => {
    if (token) {
      fetchDashboardStats();
      fetchRevenueData();
      fetchRecentActivities();
    }
  }, [token, fetchDashboardStats, fetchRevenueData, fetchRecentActivities]);

  // Load section-specific data on navigation
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
      case 'communication': fetchAnnouncements(); fetchCommStats(); break;
    }
  }, [activeSection, token, fetchStudents, fetchTeachers, fetchAttendanceStats, fetchFeeOverview, fetchInvoices, fetchFeeStructures, fetchLeads, fetchCRMPipeline, fetchActivities, fetchClasses, fetchAnnouncements, fetchCommStats]);

  // ============================================================
  // COMPUTED DATA
  // ============================================================
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const name = `${s.firstName} ${s.lastName}`.toLowerCase();
      const parentName = s.parents?.[0]?.parent ? `${s.parents[0].parent.firstName} ${s.parents[0].parent.lastName}`.toLowerCase() : '';
      const matchesSearch = name.includes(studentSearch.toLowerCase()) || parentName.includes(studentSearch.toLowerCase());
      const matchesFilter = studentFilter === 'all' || s.class?.name.toLowerCase().replace(/\s+/g, '-').toLowerCase() === studentFilter || s.status.toLowerCase() === studentFilter;
      return matchesSearch && matchesFilter;
    });
  }, [students, studentSearch, studentFilter]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t =>
      `${t.firstName} ${t.lastName}`.toLowerCase().includes(teacherSearch.toLowerCase()) || (t.qualification || '').toLowerCase().includes(teacherSearch.toLowerCase())
    );
  }, [teachers, teacherSearch]);

  const feePieData = useMemo(() => {
    if (feeOverview?.statusBreakdown) {
      const sb = feeOverview.statusBreakdown;
      return [
        { name: 'Collected', value: sb.Paid?.collected || feeOverview.totalCollected, color: '#10b981' },
        { name: 'Pending', value: sb.Pending?.amount || feeOverview.totalPending, color: '#f59e0b' },
        { name: 'Overdue', value: sb.Overdue?.amount || 0, color: '#ef4444' },
      ].filter(d => d.value > 0);
    }
    if (dashboardStats?.feeBreakdown) {
      return [
        { name: 'Collected', value: dashboardStats.feeBreakdown.collected, color: '#10b981' },
        { name: 'Pending', value: dashboardStats.feeBreakdown.pending, color: '#f59e0b' },
        { name: 'Overdue', value: dashboardStats.feeBreakdown.overdue, color: '#ef4444' },
      ].filter(d => d.value > 0);
    }
    return [
      { name: 'Collected', value: 0, color: '#10b981' },
      { name: 'Pending', value: 0, color: '#f59e0b' },
      { name: 'Overdue', value: 0, color: '#ef4444' },
    ];
  }, [feeOverview, dashboardStats]);

  const growthChartData = useMemo(() => {
    return growthData.filter(g => g.classAverages).map(g => ({
      class: g.class.name,
      creativity: Math.round(g.classAverages!.creativity),
      communication: Math.round(g.classAverages!.communication),
      socialSkills: Math.round(g.classAverages!.socialSkills),
      confidence: Math.round(g.classAverages!.confidence),
      cognitive: Math.round(g.classAverages!.cognitive),
      physical: Math.round(g.classAverages!.physical),
    }));
  }, [growthData]);

  const growthRadarData = useMemo(() => {
    if (growthData.length > 0 && growthData[0].students.length > 0) {
      const studentWithScore = growthData[0].students.find(s => s.growthScore);
      if (studentWithScore?.growthScore && growthData[0].classAverages) {
        const s = studentWithScore.growthScore;
        const c = growthData[0].classAverages;
        return [
          { subject: 'Creativity', A: Math.round(s.creativity), B: Math.round(c.creativity) },
          { subject: 'Communication', A: Math.round(s.communication), B: Math.round(c.communication) },
          { subject: 'Social Skills', A: Math.round(s.socialSkills), B: Math.round(c.socialSkills) },
          { subject: 'Confidence', A: Math.round(s.confidence), B: Math.round(c.confidence) },
          { subject: 'Cognitive', A: Math.round(s.cognitive), B: Math.round(c.cognitive) },
          { subject: 'Physical', A: Math.round(s.physical), B: Math.round(c.physical) },
        ];
      }
    }
    return [
      { subject: 'Creativity', A: 0, B: 0 },
      { subject: 'Communication', A: 0, B: 0 },
      { subject: 'Social Skills', A: 0, B: 0 },
      { subject: 'Confidence', A: 0, B: 0 },
      { subject: 'Cognitive', A: 0, B: 0 },
      { subject: 'Physical', A: 0, B: 0 },
    ];
  }, [growthData]);

  const userBranchId = useMemo(() => {
    return (user?.branchId as string) || '';
  }, [user]);

  // ============================================================
  // FORM SUBMISSIONS
  // ============================================================
  const handleAddStudent = async () => {
    if (!token) return;
    try {
      await apiFetch('/api/students', token, {
        method: 'POST',
        body: JSON.stringify({
          ...newStudent,
          branchId: userBranchId || 'default',
          experience: parseInt(newTeacher.experience) || 0,
        }),
      });
      setAddStudentOpen(false);
      setNewStudent({ firstName: '', lastName: '', dob: '', gender: 'Male', bloodGroup: '', parentFirstName: '', parentLastName: '', parentPhone: '', address: '' });
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
        body: JSON.stringify({
          ...newTeacher,
          branchId: userBranchId || 'default',
          experience: parseInt(newTeacher.experience) || 0,
        }),
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
        body: JSON.stringify({
          ...newLead,
          branchId: userBranchId || 'default',
        }),
      });
      setAddLeadOpen(false);
      setNewLead({ parentName: '', parentPhone: '', childName: '', programInterest: 'Nursery', source: 'WalkIn', priority: 'Medium', notes: '' });
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
        body: JSON.stringify({
          ...newAnnouncement,
          branchId: userBranchId || 'default',
        }),
      });
      setAddAnnouncementOpen(false);
      setNewAnnouncement({ title: '', type: 'General', targetAudience: 'All', content: '', priority: 'Normal' });
      fetchAnnouncements();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to create announcement');
    }
  };

  // ============================================================
  // RENDER: DASHBOARD
  // ============================================================
  const renderDashboard = () => {
    if (loading.dashboard && !dashboardStats) return <div className="space-y-6"><StatsSkeleton /><CardSkeleton /><CardSkeleton /></div>;
    if (errors.dashboard) return <div className="p-8 text-center text-rose-600">{errors.dashboard}</div>;

    const stats = dashboardStats || { totalStudents: 0, totalTeachers: 0, thisMonthRevenue: 0, newAdmissions: 0, occupancyRate: 0, satisfactionRate: 0, attendanceRate: 0, feeBreakdown: { collected: 0, pending: 0, overdue: 0 }, activeLeads: 0 };

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Students', value: stats.totalStudents, icon: GraduationCap, change: `+${stats.newAdmissions}`, up: true, color: 'bg-violet-50 text-violet-600', iconBg: 'bg-violet-100' },
            { label: 'Total Teachers', value: stats.totalTeachers, icon: Users, change: '', up: true, color: 'bg-emerald-50 text-emerald-600', iconBg: 'bg-emerald-100' },
            { label: 'Monthly Revenue', value: formatCurrency(stats.thisMonthRevenue), icon: IndianRupee, change: '', up: true, color: 'bg-sky-50 text-sky-600', iconBg: 'bg-sky-100' },
            { label: 'Admissions', value: stats.newAdmissions, icon: UserPlus, change: '', up: true, color: 'bg-rose-50 text-rose-600', iconBg: 'bg-rose-100' },
            { label: 'Occupancy', value: `${stats.occupancyRate}%`, icon: Building2, change: '', up: true, color: 'bg-indigo-50 text-indigo-600', iconBg: 'bg-indigo-100' },
            { label: 'Attendance', value: `${stats.attendanceRate}%`, icon: ClipboardCheck, change: '', up: true, color: 'bg-yellow-50 text-yellow-600', iconBg: 'bg-yellow-100' },
          ].map((stat) => (
            <Card key={stat.label} className="relative overflow-hidden rounded-3xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color.split(' ')[1]}`} />
                  </div>
                  {stat.change && (
                    <span className="text-xs font-medium flex items-center gap-0.5 text-emerald-600">
                      <ArrowUpRight className="h-3 w-3" />{stat.change}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Chart + Admission Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue vs collections</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueData?.monthly ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={revenueData.monthly.filter(m => m.revenue > 0 || m.collections > 0)}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCollections" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `₹${(v / 100000).toFixed(1)}L`} />
                    <RTooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, '']} />
                    <Area type="monotone" dataKey="revenue" stroke="#7C3AED" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} name="Revenue" />
                    <Area type="monotone" dataKey="collections" stroke="#10b981" fillOpacity={1} fill="url(#colorCollections)" strokeWidth={2} name="Collections" />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
                  {loading.revenue ? <Loader2 className="h-6 w-6 animate-spin" /> : 'No revenue data available'}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Admission Pipeline</CardTitle>
              <CardDescription>Current lead stages</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {crmPipeline?.pipeline ? (
                crmPipeline.pipeline.filter(s => s.stage !== 'Lost').map((stage) => (
                  <div key={stage.stage} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stageColors[stage.stage] || '#94a3b8' }} />
                    <span className="text-sm flex-1 truncate">{stageLabels[stage.stage] || stage.stage}</span>
                    <span className="text-sm font-semibold">{stage.count}</span>
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div className="h-2 rounded-full" style={{ width: `${Math.min((stage.count / Math.max(crmPipeline.totalLeads, 1)) * 100, 100)}%`, backgroundColor: stageColors[stage.stage] || '#94a3b8' }} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">Loading pipeline...</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Fee Overview + Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fee Collection</CardTitle>
              <CardDescription>Current quarter overview</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={feePieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                    {feePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RTooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, '']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {feePieData.map((item) => (
                  <div key={item.name} className="text-center">
                    <p className="text-xs text-muted-foreground">{item.name}</p>
                    <p className="text-sm font-semibold">{formatCurrency(item.value)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Recent Activities</CardTitle>
              <CardDescription>Latest updates from your preschool</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[320px]">
                <div className="space-y-4">
                  {recentActivities.length > 0 ? recentActivities.map((activity, idx) => {
                    const Icon = getActivityIcon(activity.type);
                    const color = getActivityColor(activity.type);
                    return (
                      <div key={activity.id || idx} className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg bg-muted ${color}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{activity.description || activity.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(activity.timestamp)}</p>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-sm text-muted-foreground text-center py-8">No recent activities</div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { label: 'Add Student', icon: UserPlus, action: () => { setActiveSection('students'); setAddStudentOpen(true); } },
                { label: 'Mark Attendance', icon: ClipboardCheck, action: () => setActiveSection('attendance') },
                { label: 'Collect Fee', icon: IndianRupee, action: () => setActiveSection('fees') },
                { label: 'New Lead', icon: Megaphone, action: () => { setActiveSection('crm'); setAddLeadOpen(true); } },
                { label: 'Send Message', icon: Send, action: () => setActiveSection('communication') },
                { label: 'Add Activity', icon: Plus, action: () => { setActiveSection('activities'); setAddActivityOpen(true); } },
              ].map((item) => (
                <Button key={item.label} variant="outline" className="h-auto py-3 flex flex-col items-center gap-2 hover:bg-violet-50 hover:border-violet-200 transition-all" onClick={item.action}>
                  <item.icon className="h-5 w-5 text-violet-600" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ============================================================
  // RENDER: STUDENTS
  // ============================================================
  const renderStudents = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Students</h2>
          <p className="text-muted-foreground text-sm">Manage all student records</p>
        </div>
        <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 hover:from-violet-700 hover:to-sky-600 text-white shadow-sm hover:shadow-md transition-all">
              <Plus className="h-4 w-4 mr-2" /> Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>Enter student details to enroll them</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>First Name</Label><Input placeholder="First name" value={newStudent.firstName} onChange={e => setNewStudent(s => ({ ...s, firstName: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Last Name</Label><Input placeholder="Last name" value={newStudent.lastName} onChange={e => setNewStudent(s => ({ ...s, lastName: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Date of Birth</Label><Input type="date" value={newStudent.dob} onChange={e => setNewStudent(s => ({ ...s, dob: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Gender</Label><Select value={newStudent.gender} onValueChange={v => setNewStudent(s => ({ ...s, gender: v }))}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Blood Group</Label><Input placeholder="e.g. A+" value={newStudent.bloodGroup} onChange={e => setNewStudent(s => ({ ...s, bloodGroup: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Admission No</Label><Input placeholder="Auto-generated" disabled /></div>
              </div>
              <Separator />
              <p className="text-sm font-semibold">Parent/Guardian Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Parent Name</Label><Input placeholder="Parent first name" value={newStudent.parentFirstName} onChange={e => setNewStudent(s => ({ ...s, parentFirstName: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Parent Last Name</Label><Input placeholder="Parent last name" value={newStudent.parentLastName} onChange={e => setNewStudent(s => ({ ...s, parentLastName: e.target.value }))} /></div>
              </div>
              <div className="space-y-2"><Label>Phone</Label><Input placeholder="+91 XXXXX XXXXX" value={newStudent.parentPhone} onChange={e => setNewStudent(s => ({ ...s, parentPhone: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Address</Label><Textarea placeholder="Full address" value={newStudent.address} onChange={e => setNewStudent(s => ({ ...s, address: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddStudentOpen(false)}>Cancel</Button>
              <Button className="bg-gradient-to-r from-violet-600 to-sky-500 hover:from-violet-700 hover:to-sky-600 text-white shadow-sm hover:shadow-md transition-all" onClick={handleAddStudent} disabled={!newStudent.firstName || !newStudent.lastName}>Enroll Student</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by name or parent..." className="pl-9" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
        </div>
        <Select value={studentFilter} onValueChange={setStudentFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Student Table */}
      {loading.students ? <TableSkeleton rows={6} cols={6} /> : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Class</TableHead>
                  <TableHead className="hidden lg:table-cell">Parent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => {
                  const name = `${student.firstName} ${student.lastName}`;
                  const parent = student.parents?.[0]?.parent;
                  const parentName = parent ? `${parent.firstName} ${parent.lastName}` : '—';
                  return (
                    <TableRow key={student.id} className="cursor-pointer" onClick={() => setSelectedStudent(student)}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{student.admissionNo || student.id.slice(-5)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-violet-100 text-violet-700 text-xs font-semibold">
                              {student.firstName[0]}{student.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{name}</p>
                            <p className="text-xs text-muted-foreground md:hidden">{student.class?.name || 'Unassigned'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="secondary" className="text-xs">{student.class?.name || 'Unassigned'}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{parentName}</TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${student.status === 'Active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-100'}`}>
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setSelectedStudent(student); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No students found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Student Detail Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedStudent && (() => {
            const s = selectedStudent;
            const name = `${s.firstName} ${s.lastName}`;
            const parent = s.parents?.[0]?.parent;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-violet-100 text-violet-700 text-lg font-semibold">
                        {s.firstName[0]}{s.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle>{name}</DialogTitle>
                      <DialogDescription>{s.class?.name || 'Unassigned'} • {s.admissionNo || s.id.slice(-5)}</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><p className="text-xs text-muted-foreground">Gender</p><p className="text-sm font-medium">{s.gender || '—'}</p></div>
                    <div><p className="text-xs text-muted-foreground">Date of Birth</p><p className="text-sm font-medium">{formatDate(s.dob)}</p></div>
                    <div><p className="text-xs text-muted-foreground">Blood Group</p><p className="text-sm font-medium">{s.bloodGroup || '—'}</p></div>
                    <div><p className="text-xs text-muted-foreground">Status</p><Badge className={s.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>{s.status}</Badge></div>
                  </div>
                  <Separator />
                  {parent && (
                    <div>
                      <p className="text-xs text-muted-foreground">Parent/Guardian</p>
                      <p className="text-sm font-medium">{parent.firstName} {parent.lastName} ({parent.relation})</p>
                      <p className="text-sm text-muted-foreground">{parent.phone}</p>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );

  // ============================================================
  // RENDER: TEACHERS
  // ============================================================
  const renderTeachers = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Teachers</h2>
          <p className="text-muted-foreground text-sm">Manage teaching staff</p>
        </div>
        <Dialog open={addTeacherOpen} onOpenChange={setAddTeacherOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 hover:from-violet-700 hover:to-sky-600 text-white shadow-sm hover:shadow-md transition-all">
              <Plus className="h-4 w-4 mr-2" /> Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Teacher</DialogTitle>
              <DialogDescription>Enter teacher details</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>First Name</Label><Input placeholder="First name" value={newTeacher.firstName} onChange={e => setNewTeacher(s => ({ ...s, firstName: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Last Name</Label><Input placeholder="Last name" value={newTeacher.lastName} onChange={e => setNewTeacher(s => ({ ...s, lastName: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Qualification</Label><Input placeholder="e.g. M.Ed" value={newTeacher.qualification} onChange={e => setNewTeacher(s => ({ ...s, qualification: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Specialization</Label><Input placeholder="e.g. Montessori" value={newTeacher.specialization} onChange={e => setNewTeacher(s => ({ ...s, specialization: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Experience (Years)</Label><Input type="number" placeholder="0" value={newTeacher.experience} onChange={e => setNewTeacher(s => ({ ...s, experience: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input placeholder="+91 XXXXX XXXXX" value={newTeacher.phone} onChange={e => setNewTeacher(s => ({ ...s, phone: e.target.value }))} /></div>
              </div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="email@example.com" value={newTeacher.email} onChange={e => setNewTeacher(s => ({ ...s, email: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddTeacherOpen(false)}>Cancel</Button>
              <Button className="bg-gradient-to-r from-violet-600 to-sky-500 hover:from-violet-700 hover:to-sky-600 text-white shadow-sm hover:shadow-md transition-all" onClick={handleAddTeacher} disabled={!newTeacher.firstName || !newTeacher.lastName}>Add Teacher</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search teachers..." className="pl-9 max-w-sm" value={teacherSearch} onChange={e => setTeacherSearch(e.target.value)} />
      </div>

      {loading.teachers ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-6 w-32 mb-2" /><Skeleton className="h-4 w-24 mb-4" /><Skeleton className="h-4 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map((teacher) => {
            const name = `${teacher.firstName} ${teacher.lastName}`;
            return (
              <Card key={teacher.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <Avatar className="h-11 w-11">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                        {teacher.firstName[0]}{teacher.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{name}</p>
                      <p className="text-xs text-muted-foreground">{teacher.qualification || 'No qualification'}</p>
                    </div>
                    <Badge className={teacher.status === 'Active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-violet-100 text-violet-700 hover:bg-violet-100'}>
                      {teacher.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Class</p>
                      <Badge variant="secondary" className="text-xs mt-0.5">{teacher.class?.name || 'Unassigned'}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Experience</p>
                      <p className="font-medium">{teacher.experience || 0} yrs</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Specialization</p>
                      <p className="font-medium text-xs">{teacher.specialization || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Staff Type</p>
                      <p className="font-medium text-xs">{teacher.staffType || 'Teaching'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs"><Phone className="h-3 w-3 mr-1" /> Call</Button>
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs"><Mail className="h-3 w-3 mr-1" /> Email</Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filteredTeachers.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-8">No teachers found</div>
          )}
        </div>
      )}
    </div>
  );

  // ============================================================
  // RENDER: ATTENDANCE
  // ============================================================
  const renderAttendance = () => {
    const stats = attendanceStats;
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Attendance</h2>
            <p className="text-muted-foreground text-sm">Track daily attendance records</p>
          </div>
          <div className="flex items-center gap-3">
            <Input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="w-[180px]" />
          </div>
        </div>

        {/* Today's Stats */}
        {loading.attendance ? <StatsSkeleton count={4} /> : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Students', value: stats.students.total, icon: GraduationCap, color: 'bg-violet-100 text-violet-600' },
              { label: 'Present Today', value: stats.students.present, icon: UserCheck, color: 'bg-emerald-100 text-emerald-600' },
              { label: 'Absent Today', value: stats.students.absent, icon: UserX, color: 'bg-rose-100 text-rose-600' },
              { label: 'Late Arrivals', value: stats.students.late, icon: Timer, color: 'bg-orange-100 text-orange-600' },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.color.split(' ')[0]}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color.split(' ')[1]}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">No attendance data for selected date</div>
        )}

        {/* Attendance Rate */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today&apos;s Attendance Rate: {stats.students.attendanceRate}%</CardTitle>
              <CardDescription>Class-wise attendance breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.classWise}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="className" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RTooltip />
                  <Bar dataKey="present" fill="#10b981" name="Present" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="late" fill="#f59e0b" name="Late" radius={[4, 4, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Class-wise Table */}
        {stats && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Class-wise Attendance</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
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
                  {stats.classWise.map((cls) => (
                    <TableRow key={cls.classId}>
                      <TableCell className="font-medium">{cls.className}</TableCell>
                      <TableCell>{cls.totalStudents}</TableCell>
                      <TableCell className="text-emerald-600 font-medium">{cls.present}</TableCell>
                      <TableCell className="text-rose-600 font-medium">{cls.absent}</TableCell>
                      <TableCell className="text-amber-600 font-medium">{cls.late}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={cls.attendanceRate} className="w-16 h-2" />
                          <span className="text-xs font-medium">{cls.attendanceRate}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // ============================================================
  // RENDER: FEES
  // ============================================================
  const renderFees = () => {
    const overview = feeOverview;
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Fee Management</h2>
            <p className="text-muted-foreground text-sm">Track collections, invoices, and payments</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline"><Download className="h-4 w-4 mr-2" /> Export</Button>
          </div>
        </div>

        {/* Fee Collection Overview */}
        {loading.fees ? <StatsSkeleton count={3} /> : overview ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Total Collected</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(overview.totalCollected)}</p>
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1"><CheckCircle2 className="h-3 w-3" /> {overview.collectionRate}% collection rate</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-violet-500">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Pending Payments</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(overview.totalPending)}</p>
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-1"><Clock className="h-3 w-3" /> {overview.statusBreakdown?.Pending?.count || 0} invoices pending</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-rose-500">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Overdue Amount</p>
                <p className="text-2xl font-bold text-rose-600">{formatCurrency(overview.statusBreakdown?.Overdue?.amount || 0)}</p>
                <p className="text-xs text-rose-600 flex items-center gap-1 mt-1"><AlertTriangle className="h-3 w-3" /> {overview.statusBreakdown?.Overdue?.count || 0} invoices overdue</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">No fee data available</div>
        )}

        {/* Fee Collection Chart */}
        {revenueData?.monthly && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Fee Collection Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={revenueData.monthly.filter(m => m.revenue > 0 || m.collections > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `₹${(v / 100000).toFixed(1)}L`} />
                  <RTooltip formatter={(value: number) => [`₹${value.toLocaleString()}`, '']} />
                  <Bar dataKey="collections" fill="#10b981" name="Collected" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="revenue" fill="#7C3AED" name="Expected" radius={[6, 6, 0, 0]} />
                  <Legend />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Fee Structure */}
        {feeStructures.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fee Structures</CardTitle>
              <CardDescription>Academic Year 2024-2025</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Class</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeStructures.map((fs) => (
                    <TableRow key={fs.id}>
                      <TableCell className="font-medium">{fs.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{fs.feeType}</Badge></TableCell>
                      <TableCell>₹{fs.amount.toLocaleString()}</TableCell>
                      <TableCell>{fs.frequency}</TableCell>
                      <TableCell>{fs.class?.name || 'All'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Invoice List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">{inv.invoiceNo}</TableCell>
                    <TableCell className="text-sm font-medium">{inv.student.firstName} {inv.student.lastName}</TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant="outline" className="text-xs">{inv.feeStructure?.feeType || inv.feeStructure?.name || 'Fee'}</Badge></TableCell>
                    <TableCell className="text-sm">₹{inv.totalAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(inv.dueDate)}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : inv.status === 'Pending' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : inv.status === 'Overdue' ? 'bg-rose-100 text-rose-700 hover:bg-rose-100' : 'bg-blue-100 text-blue-700 hover:bg-blue-100'}`}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {invoices.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No invoices found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ============================================================
  // RENDER: CRM
  // ============================================================
  const renderCRM = () => {
    const hotLeads = leads.filter(l => l.priority === 'Hot').length;
    const crmStats = [
      { label: 'Total Leads', value: crmPipeline?.totalLeads || leads.length, icon: Megaphone, color: 'text-violet-600' },
      { label: 'Conversion Rate', value: `${crmPipeline?.conversionRate || 0}%`, icon: Target, color: 'text-emerald-600' },
      { label: 'Active Leads', value: crmPipeline?.pipeline?.filter(s => !['Enrolled', 'Lost'].includes(s.stage)).reduce((sum, s) => sum + s.count, 0) || leads.filter(l => !['Enrolled', 'Lost'].includes(l.stage)).length, icon: Activity, color: 'text-orange-600' },
      { label: 'Hot Leads', value: hotLeads, icon: Zap, color: 'text-rose-600' },
    ];

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Admission CRM</h2>
            <p className="text-muted-foreground text-sm">Manage leads and track admissions pipeline</p>
          </div>
          <Dialog open={addLeadOpen} onOpenChange={setAddLeadOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-violet-600 to-sky-500 hover:from-violet-700 hover:to-sky-600 text-white shadow-sm hover:shadow-md transition-all">
                <Plus className="h-4 w-4 mr-2" /> Add Lead
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Lead</DialogTitle>
                <DialogDescription>Enter inquiry details</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Parent Name</Label><Input placeholder="Parent name" value={newLead.parentName} onChange={e => setNewLead(s => ({ ...s, parentName: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Phone</Label><Input placeholder="+91 XXXXX XXXXX" value={newLead.parentPhone} onChange={e => setNewLead(s => ({ ...s, parentPhone: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Child Name</Label><Input placeholder="Child name" value={newLead.childName} onChange={e => setNewLead(s => ({ ...s, childName: e.target.value }))} /></div>
                  <div className="space-y-2"><Label>Program Interest</Label>
                    <Select value={newLead.programInterest} onValueChange={v => setNewLead(s => ({ ...s, programInterest: v }))}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>
                      <SelectItem value="PlayGroup">PlayGroup</SelectItem><SelectItem value="Nursery">Nursery</SelectItem>
                      <SelectItem value="LKG">LKG</SelectItem><SelectItem value="UKG">UKG</SelectItem>
                    </SelectContent></Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Source</Label>
                    <Select value={newLead.source} onValueChange={v => setNewLead(s => ({ ...s, source: v }))}><SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger><SelectContent>
                      <SelectItem value="WalkIn">Walk-in</SelectItem><SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem><SelectItem value="SocialMedia">Social Media</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem><SelectItem value="Call">Call</SelectItem>
                    </SelectContent></Select>
                  </div>
                  <div className="space-y-2"><Label>Priority</Label>
                    <Select value={newLead.priority} onValueChange={v => setNewLead(s => ({ ...s, priority: v }))}><SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger><SelectContent>
                      <SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem><SelectItem value="Hot">Hot</SelectItem>
                    </SelectContent></Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Notes</Label><Textarea placeholder="Additional notes..." value={newLead.notes} onChange={e => setNewLead(s => ({ ...s, notes: e.target.value }))} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddLeadOpen(false)}>Cancel</Button>
                <Button className="bg-gradient-to-r from-violet-600 to-sky-500 hover:from-violet-700 hover:to-sky-600 text-white shadow-sm hover:shadow-md transition-all" onClick={handleAddLead} disabled={!newLead.parentName || !newLead.childName}>Add Lead</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* CRM Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {crmStats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pipeline View */}
        {crmPipeline?.pipeline && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Admission Pipeline</CardTitle>
              <CardDescription>Kanban-style pipeline view</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar">
                {crmPipeline.pipeline.filter(s => s.stage !== 'Lost').map((stage) => (
                  <div key={stage.stage} className="min-w-[180px] flex-shrink-0">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stageColors[stage.stage] || '#94a3b8' }} />
                      <span className="text-xs font-semibold uppercase tracking-wider">{stageLabels[stage.stage] || stage.stage}</span>
                      <Badge variant="secondary" className="text-xs ml-auto">{stage.count}</Badge>
                    </div>
                    <div className="space-y-2">
                      {leads.filter(l => l.stage === stage.stage).slice(0, 3).map((lead) => (
                        <div key={lead.id} className="p-2.5 bg-muted/50 rounded-lg border border-border/50 hover:bg-muted transition-colors cursor-pointer">
                          <p className="text-sm font-medium truncate">{lead.parentName}</p>
                          <p className="text-xs text-muted-foreground">{lead.childName}</p>
                          <div className="flex items-center gap-1 mt-1.5">
                            <Badge variant="outline" className="text-[10px] h-5 px-1">{lead.source}</Badge>
                            {lead.priority === 'Hot' && <Badge className="text-[10px] h-5 px-1 bg-rose-100 text-rose-700">🔥 Hot</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Insights */}
        <Card className="border-violet-200 bg-gradient-to-r from-violet-50/50 to-sky-50/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              AI CRM Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white rounded-lg border border-violet-100">
                <div className="flex items-center gap-2 mb-2"><Bot className="h-4 w-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700">Lead Scoring</span></div>
                <p className="text-sm">{hotLeads > 0 ? `${hotLeads} hot lead${hotLeads > 1 ? 's' : ''} detected with high conversion probability. Prioritize immediate follow-ups.` : 'No hot leads currently. Focus on nurturing existing leads through the pipeline.'}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-emerald-500" /><span className="text-xs font-semibold text-emerald-700">Conversion Trend</span></div>
                <p className="text-sm">Current conversion rate is {crmPipeline?.conversionRate || 0}%. {crmPipeline?.sourceBreakdown && Object.entries(crmPipeline.sourceBreakdown).sort((a, b) => b[1] - a[1])[0] ? `${Object.entries(crmPipeline.sourceBreakdown).sort((a, b) => b[1] - a[1])[0][0]} is the top lead source.` : ''}</p>
              </div>
              <div className="p-4 bg-white rounded-lg border border-orange-100">
                <div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4 text-orange-500" /><span className="text-xs font-semibold text-orange-700">At-Risk Leads</span></div>
                <p className="text-sm">{leads.filter(l => l.nextFollowUpDate && new Date(l.nextFollowUpDate) < new Date() && !['Enrolled', 'Lost'].includes(l.stage)).length} leads have overdue follow-ups. Immediate action recommended.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lead List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lead List</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parent</TableHead>
                  <TableHead>Child</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="hidden lg:table-cell">Follow-up</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div><p className="text-sm font-medium">{lead.parentName}</p><p className="text-xs text-muted-foreground">{lead.parentPhone}</p></div>
                    </TableCell>
                    <TableCell className="text-sm">{lead.childName}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{lead.source}</Badge></TableCell>
                    <TableCell>
                      <Badge className="text-xs" style={{ backgroundColor: (stageColors[lead.stage] || '#94a3b8') + '20', color: stageColors[lead.stage] || '#94a3b8' }}>
                        {stageLabels[lead.stage] || lead.stage}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${lead.priority === 'Hot' ? 'bg-rose-100 text-rose-700 hover:bg-rose-100' : lead.priority === 'High' ? 'bg-orange-100 text-orange-700 hover:bg-orange-100' : lead.priority === 'Medium' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-100'}`}>
                        {lead.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{lead.nextFollowUpDate ? formatDate(lead.nextFollowUpDate) : '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Phone className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {leads.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No leads found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ============================================================
  // RENDER: ACTIVITIES
  // ============================================================
  const renderActivities = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Activities</h2>
          <p className="text-muted-foreground text-sm">Plan and track school activities</p>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: recentActivities.length + activitiesDB.length, icon: Calendar, color: 'text-violet-600' },
          { label: 'Enrollments', value: recentActivities.filter(a => a.type === 'student_enrollment').length, icon: CheckCircle2, color: 'text-emerald-600' },
          { label: 'Payments', value: recentActivities.filter(a => a.type === 'payment_received').length, icon: IndianRupee, color: 'text-orange-600' },
          { label: 'Announcements', value: recentActivities.filter(a => a.type === 'announcement').length, icon: Bell, color: 'text-rose-600' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity Timeline</CardTitle>
          <CardDescription>Recent school activities and events</CardDescription>
        </CardHeader>
        <CardContent>
          {loading.activities ? (
            <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((activity, idx) => {
                const Icon = getActivityIcon(activity.type);
                const color = getActivityColor(activity.type);
                return (
                  <div key={activity.id || idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`p-2 rounded-lg bg-muted ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{timeAgo(activity.timestamp)}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{activity.type.replace(/_/g, ' ')}</Badge>
                  </div>
                );
              })}
              {recentActivities.length === 0 && (
                <div className="text-center text-muted-foreground py-8">No activities found</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Gallery Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Photo Gallery</CardTitle>
          <CardDescription>Recent activity photos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-gradient-to-br from-violet-100 to-sky-100 border border-violet-200/50 flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-violet-400" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ============================================================
  // RENDER: GROWTH
  // ============================================================
  const renderGrowth = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Growth & Development</h2>
        <p className="text-muted-foreground text-sm">Track student development and AI-powered insights</p>
      </div>

      {/* Class-wise Growth */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Class-wise Growth Overview</CardTitle>
          <CardDescription>Average scores across development areas</CardDescription>
        </CardHeader>
        <CardContent>
          {growthChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={growthChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="class" tick={{ fontSize: 11 }} width={80} />
                <RTooltip />
                <Legend />
                <Bar dataKey="creativity" fill="#7C3AED" name="Creativity" />
                <Bar dataKey="communication" fill="#10b981" name="Communication" />
                <Bar dataKey="socialSkills" fill="#f97316" name="Social" />
                <Bar dataKey="cognitive" fill="#fb7185" name="Cognitive" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
              {loading.growth ? <Loader2 className="h-6 w-6 animate-spin" /> : 'No growth data available. Loading...'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Growth Radar + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Student Growth Radar</CardTitle>
            <CardDescription>
              {growthData.length > 0 && growthData[0].students.find(s => s.growthScore)
                ? `${growthData[0].students.find(s => s.growthScore)!.firstName} vs Class Average`
                : 'Student vs Class Average'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={growthRadarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="Student" dataKey="A" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Class Avg" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                <Legend />
                <RTooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Growth Score Distribution</CardTitle>
            <CardDescription>Students by overall score range</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { range: '0-20', count: growthData.flatMap(g => g.students.filter(s => s.growthScore && s.growthScore.overall < 20)).length },
                { range: '21-40', count: growthData.flatMap(g => g.students.filter(s => s.growthScore && s.growthScore.overall >= 20 && s.growthScore.overall < 40)).length },
                { range: '41-60', count: growthData.flatMap(g => g.students.filter(s => s.growthScore && s.growthScore.overall >= 40 && s.growthScore.overall < 60)).length },
                { range: '61-80', count: growthData.flatMap(g => g.students.filter(s => s.growthScore && s.growthScore.overall >= 60 && s.growthScore.overall < 80)).length },
                { range: '81-100', count: growthData.flatMap(g => g.students.filter(s => s.growthScore && s.growthScore.overall >= 80)).length },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <RTooltip />
                <Bar dataKey="count" fill="#7C3AED" radius={[6, 6, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50/50 to-teal-50/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            AI Growth Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {growthData.some(g => g.topPerformers.length > 0) && (
              <div className="p-4 bg-white rounded-lg border border-emerald-100">
                <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-4 w-4 text-emerald-500" /><span className="text-xs font-semibold text-emerald-700">Top Performers</span></div>
                <p className="text-sm">{growthData.flatMap(g => g.topPerformers).slice(0, 3).map(p => `${p.name} (${p.overall}%)`).join(', ') || 'No top performers identified yet.'}</p>
              </div>
            )}
            {growthData.some(g => g.needsAttention.length > 0) && (
              <div className="p-4 bg-white rounded-lg border border-violet-100">
                <div className="flex items-center gap-2 mb-2"><AlertTriangle className="h-4 w-4 text-violet-500" /><span className="text-xs font-semibold text-violet-700">Attention Needed</span></div>
                <p className="text-sm">{growthData.flatMap(g => g.needsAttention).slice(0, 3).map(n => `${n.name} - weak in ${n.weakestArea}`).join(', ') || 'No students needing attention.'}</p>
              </div>
            )}
            <div className="p-4 bg-white rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-2"><Brain className="h-4 w-4 text-blue-500" /><span className="text-xs font-semibold text-blue-700">Cognitive Milestone</span></div>
              <p className="text-sm">Growth tracking is active across {growthData.filter(g => g.classAverages).length} classes. Continue regular assessments for more accurate AI predictions.</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-rose-100">
              <div className="flex items-center gap-2 mb-2"><Heart className="h-4 w-4 text-rose-500" /><span className="text-xs font-semibold text-rose-700">Emotional Wellness</span></div>
              <p className="text-sm">Monitor daily mood patterns and social interaction scores for early detection of behavioral changes.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ============================================================
  // RENDER: COMMUNICATION
  // ============================================================
  const renderCommunication = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Communication</h2>
          <p className="text-muted-foreground text-sm">Announcements, messages, and notifications</p>
        </div>
        <Dialog open={addAnnouncementOpen} onOpenChange={setAddAnnouncementOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 hover:from-violet-700 hover:to-sky-600 text-white shadow-sm hover:shadow-md transition-all">
              <Plus className="h-4 w-4 mr-2" /> New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
              <DialogDescription>Send announcement to parents/teachers</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2"><Label>Title</Label><Input placeholder="Announcement title" value={newAnnouncement.title} onChange={e => setNewAnnouncement(s => ({ ...s, title: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Type</Label>
                  <Select value={newAnnouncement.type} onValueChange={v => setNewAnnouncement(s => ({ ...s, type: v }))}><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger><SelectContent>
                    <SelectItem value="General">General</SelectItem><SelectItem value="Event">Event</SelectItem><SelectItem value="Fee">Fee</SelectItem>
                    <SelectItem value="Health">Health</SelectItem><SelectItem value="Academic">Academic</SelectItem>
                  </SelectContent></Select>
                </div>
                <div className="space-y-2"><Label>Audience</Label>
                  <Select value={newAnnouncement.targetAudience} onValueChange={v => setNewAnnouncement(s => ({ ...s, targetAudience: v }))}><SelectTrigger><SelectValue placeholder="Audience" /></SelectTrigger><SelectContent>
                    <SelectItem value="All">All</SelectItem><SelectItem value="Parents">Parents</SelectItem><SelectItem value="Teachers">Teachers</SelectItem>
                  </SelectContent></Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Content</Label><Textarea placeholder="Announcement content..." rows={4} value={newAnnouncement.content} onChange={e => setNewAnnouncement(s => ({ ...s, content: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Priority</Label>
                <Select value={newAnnouncement.priority} onValueChange={v => setNewAnnouncement(s => ({ ...s, priority: v }))}><SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger><SelectContent>
                  <SelectItem value="Low">Low</SelectItem><SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="High">High</SelectItem><SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent></Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddAnnouncementOpen(false)}>Cancel</Button>
              <Button className="bg-gradient-to-r from-violet-600 to-sky-500 hover:from-violet-700 hover:to-sky-600 text-white shadow-sm hover:shadow-md transition-all" onClick={handleAddAnnouncement} disabled={!newAnnouncement.title || !newAnnouncement.content}>
                <Send className="h-4 w-4 mr-2" /> Publish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Notification Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(commStats ? [
          { channel: 'Announcements', sent: commStats.announcements.total, delivered: commStats.announcements.publishedThisMonth, failed: commStats.announcements.scheduled, icon: Bell },
          { channel: 'Chat Threads', sent: commStats.chat.activeThreads, delivered: commStats.chat.messagesThisMonth, failed: 0, icon: MessageSquare },
          { channel: 'Fee Reminders', sent: commStats.notifications.feeRemindersSent, delivered: commStats.notifications.feeRemindersSent, failed: 0, icon: Receipt },
          { channel: 'This Month', sent: commStats.announcements.publishedThisMonth, delivered: commStats.chat.messagesThisMonth, failed: 0, icon: Calendar },
        ] : [
          { channel: 'Announcements', sent: 0, delivered: 0, failed: 0, icon: Bell },
          { channel: 'Chat Threads', sent: 0, delivered: 0, failed: 0, icon: MessageSquare },
          { channel: 'Fee Reminders', sent: 0, delivered: 0, failed: 0, icon: Receipt },
          { channel: 'This Month', sent: 0, delivered: 0, failed: 0, icon: Calendar },
        ]).map((stat) => (
          <Card key={stat.channel}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{stat.channel}</span>
              </div>
              <p className="text-2xl font-bold">{stat.sent.toLocaleString()}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-emerald-600">{stat.delivered} active</span>
                {stat.failed > 0 && <span className="text-xs text-rose-500">{stat.failed} pending</span>}
              </div>
              <Progress value={stat.sent > 0 ? (stat.delivered / stat.sent) * 100 : 0} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Announcements */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Announcements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading.communication ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (
            announcements.map((ann) => (
              <div key={ann.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`p-2 rounded-lg shrink-0 ${ann.priority === 'Urgent' ? 'bg-rose-100' : ann.priority === 'High' ? 'bg-violet-100' : 'bg-muted'}`}>
                  <Bell className={`h-4 w-4 ${ann.priority === 'Urgent' ? 'text-rose-600' : ann.priority === 'High' ? 'text-violet-600' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-sm">{ann.title}</p>
                    <Badge variant="outline" className="text-[10px]">{ann.type}</Badge>
                    {ann.priority === 'Urgent' && <Badge className="text-[10px] bg-rose-100 text-rose-700 hover:bg-rose-100">Urgent</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{ann.content}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                    <span>{formatDate(ann.publishedAt || ann.createdAt)}</span>
                    <span>•</span>
                    <span>{ann.targetAudience}</span>
                    <Badge className={`text-[10px] ml-auto ${ann.publishedAt ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-100'}`}>{ann.publishedAt ? 'Published' : 'Draft'}</Badge>
                  </div>
                </div>
              </div>
            ))
          )}
          {announcements.length === 0 && !loading.communication && (
            <div className="text-center text-muted-foreground py-8">No announcements found</div>
          )}
        </CardContent>
      </Card>

      {/* Message Center */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Message Center</CardTitle>
          <CardDescription>Recent conversations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {students.slice(0, 4).map((student) => {
            const parent = student.parents?.[0]?.parent;
            if (!parent) return null;
            return (
              <div key={student.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-violet-100 text-violet-700 text-xs">{parent.firstName[0]}{parent.lastName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{parent.firstName} {parent.lastName}</p>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">Parent of {student.firstName} {student.lastName} • {parent.phone}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-3.5 w-3.5" /></Button>
              </div>
            );
          })}
          {students.length === 0 && (
            <div className="text-center text-muted-foreground py-8">No conversations yet</div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // ============================================================
  // RENDER: SETTINGS
  // ============================================================
  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground text-sm">Manage school and account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* School Profile */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">School Profile</CardTitle>
            <CardDescription>Basic information about your school</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>School Name</Label><Input defaultValue="PreOne Preschool" /></div>
              <div className="space-y-2"><Label>Tagline</Label><Input defaultValue="Where learning begins with joy" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Phone</Label><Input defaultValue="+91 11 4567 8900" /></div>
              <div className="space-y-2"><Label>Email</Label><Input defaultValue="hello@preone.edu" /></div>
            </div>
            <div className="space-y-2"><Label>Address</Label><Textarea defaultValue="123, Learning Lane, Knowledge Park, New Delhi - 110001" /></div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 hover:from-violet-700 hover:to-sky-600 text-white shadow-sm hover:shadow-md transition-all">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-sky-400 text-white text-lg">
                  {user?.email ? (user.email as string).slice(0, 2).toUpperCase() : 'AD'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{(user?.role as string) || 'Admin'}</p>
                <p className="text-sm text-muted-foreground">{(user?.email as string) || 'admin@preone.com'}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue={(user?.email as string) || 'admin@preone.com'} />
            </div>
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Select defaultValue="2024-2025">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-2025">2024-2025</SelectItem>
                  <SelectItem value="2023-2024">2023-2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Select defaultValue="dd-mm-yyyy">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd-mm-yyyy">DD-MM-YYYY</SelectItem>
                  <SelectItem value="mm-dd-yyyy">MM-DD-YYYY</SelectItem>
                  <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select defaultValue="inr">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inr">₹ Indian Rupee (INR)</SelectItem>
                  <SelectItem value="usd">$ US Dollar (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ============================================================
  // RENDER MAIN LAYOUT
  // ============================================================
  const sectionRenderers: Record<Section, () => React.ReactNode> = {
    dashboard: renderDashboard,
    students: renderStudents,
    teachers: renderTeachers,
    attendance: renderAttendance,
    fees: renderFees,
    crm: renderCRM,
    activities: renderActivities,
    growth: renderGrowth,
    communication: renderCommunication,
    settings: renderSettings,
  };

  // Show login screen if not authenticated
  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-500" /></div>;
  }

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // ============================================================
  // ROLE-BASED ROUTING
  // ============================================================
  const userRole = (user?.role as string) || 'Admin';

  // If user is a Parent, render the Parent Portal
  if (userRole === 'Parent') {
    return (
      <ParentPortal
        token={token!}
        user={{ userId: (user?.userId as string) || '', email: (user?.email as string) || '', role: userRole, branchId: (user?.branchId as string) || null }}
        onLogout={handleLogout}
      />
    );
  }

  // If user is a Teacher, render the Teacher Portal
  if (userRole === 'Teacher') {
    return (
      <TeacherPortal
        token={token!}
        user={{ userId: (user?.userId as string) || '', email: (user?.email as string) || '', role: userRole, branchId: (user?.branchId as string) || null }}
        onLogout={handleLogout}
      />
    );
  }

  // Default: Admin — render the admin dashboard
  const userName = user?.email ? (user.email as string).split('@')[0] : 'Admin';

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar */}
        <aside className={`${sidebarCollapsed ? 'w-[76px]' : 'w-[280px]'} bg-sidebar-gradient text-white flex flex-col transition-all duration-300 shrink-0`}>
          {/* Logo */}
          <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10">
            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 shadow-lg shadow-violet-400/30">
              <Image src="/preonelogo.png" alt="PreOne" width={36} height={36} className="w-full h-full object-cover" />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold tracking-tight text-white">PreOne</h1>
                <p className="text-[10px] text-sky-300/70 -mt-0.5">Preschool OS</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-3">
            <nav className="space-y-1 px-2">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <Tooltip key={item.id} delayDuration={sidebarCollapsed ? 0 : 1000}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                          isActive
                            ? 'nav-active-pill font-medium shadow-sm'
                            : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                        }`}
                      >
                        <item.icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-white' : ''}`} />
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                        {isActive && !sidebarCollapsed && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-400" />
                        )}
                      </button>
                    </TooltipTrigger>
                    {sidebarCollapsed && (
                      <TooltipContent side="right" className="font-medium">
                        {item.label}
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Sidebar Toggle */}
          <div className="px-2 py-2 border-t border-white/10">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/50 hover:bg-white/8 hover:text-white/80 transition-colors"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronLeft className="h-4 w-4 shrink-0" />}
              {!sidebarCollapsed && <span>Collapse</span>}
            </button>
          </div>

          {/* User Profile */}
          <div className="px-3 py-3 border-t border-white/10">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-sky-400 text-white text-xs font-semibold">
                  {userName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!sidebarCollapsed && (
                <div className="overflow-hidden flex-1">
                  <p className="text-sm font-medium text-white truncate capitalize">{userName}</p>
                  <p className="text-xs text-white/40 truncate capitalize">{(user?.role as string) || 'Admin'}</p>
                </div>
              )}
              {!sidebarCollapsed && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10" onClick={handleLogout}>
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">/</span>
              <span className="text-sm font-medium capitalize">{activeSection === 'crm' ? 'Admission CRM' : activeSection}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search anything..." className="pl-9 w-[240px] h-9 text-sm" />
              </div>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">{recentActivities.length > 0 ? Math.min(recentActivities.length, 9) : 0}</span>
              </Button>
            </div>
          </header>

          {/* Content Area */}
          <div className="p-6 max-w-[1400px]">
            {sectionRenderers[activeSection]?.()}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
