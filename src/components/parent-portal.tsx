'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
  LayoutDashboard, Baby, ClipboardCheck, Receipt, Sun, Eye,
  TrendingUp, MessageSquare, Settings, ChevronLeft, ChevronRight,
  Search, Phone, Mail, Clock, CheckCircle2, XCircle, AlertTriangle,
  IndianRupee, Calendar, Bell, Heart, Award, BookOpen, Star,
  Smile, Frown, Meh, LogOut, Loader2, Moon, Droplets,
  Utensils, BedDouble, Sparkles, Image as ImageIcon, Video,
  Trophy, FileText, Send, Megaphone, ChevronDown, ExternalLink,
  Coffee, Apple, Sandwich, Cake, Zap, Shield, Brain, Palette,
  Users, Baby as BabyIcon, Activity, MapPin, Home, GraduationCap,
  Menu,
} from 'lucide-react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
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
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
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
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

// ============================================================
// TYPES
// ============================================================
type ParentSection = 'dashboard' | 'children' | 'attendance' | 'fees' | 'daily-updates' | 'observations' | 'growth' | 'communication' | 'settings';

interface ParentPortalProps {
  token: string;
  user: {
    userId: string;
    email: string;
    role: string;
    branchId?: string | null;
  };
  onLogout: () => void;
}

interface NavItem {
  id: ParentSection;
  label: string;
  icon: React.ElementType;
}

interface ChildBasic {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo?: string;
  photo?: string | null;
  status: string;
  class?: {
    id: string;
    name: string;
    program?: { id?: string; name?: string; code?: string; color?: string; icon?: string };
  } | null;
  isPrimary?: boolean;
}

interface ChildDetail {
  id: string;
  admissionNo?: string;
  firstName: string;
  lastName: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  photo?: string | null;
  address?: string;
  emergencyContact?: string;
  enrollmentDate?: string;
  status: string;
  class?: {
    id: string;
    name: string;
    program?: { id?: string; name?: string; code?: string; color?: string; icon?: string };
    teacher?: { id: string; firstName: string; lastName: string; photo?: string | null };
  } | null;
  section?: { id: string; name: string } | null;
  medicalRecords?: Array<{
    id: string;
    type: string;
    description?: string;
    date?: string;
    doctor?: string;
    isActive?: boolean;
  }>;
  siblings?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    photo?: string | null;
    status: string;
    relation?: string;
  }>;
  growthScores?: Array<{
    id: string;
    creativity: number;
    communication: number;
    socialSkills: number;
    confidence: number;
    cognitive: number;
    physical: number;
    overall: number;
    assessmentDate: string;
  }>;
}

interface DashboardData {
  children: ChildBasic[];
  recentDailyUpdates: Array<{
    id: string;
    date: string;
    food?: string;
    mood?: string;
    sleep?: string;
    highlights?: string;
    student: { id: string; firstName: string; lastName: string; photo?: string | null };
  }>;
  upcomingFees: Array<{
    id: string;
    invoiceNo: string;
    totalAmount: number;
    paidAmount: number;
    dueDate: string;
    status: string;
    student: { id: string; firstName: string; lastName: string };
    feeStructure?: { id: string; name: string; feeType: string; frequency: string };
  }>;
  announcements: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
    priority: string;
    publishedAt?: string;
    image?: string | null;
  }>;
  attendanceSummary: {
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    excused: number;
    total: number;
  };
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  checkIn?: string;
  checkOut?: string;
  student: { id: string; firstName: string; lastName: string; photo?: string | null };
}

interface AttendanceData {
  records: AttendanceRecord[];
  summary: { present: number; absent: number; late: number; halfDay: number; excused: number; total: number };
  month: string;
}

interface FeeData {
  invoices: Array<{
    id: string;
    invoiceNo: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
    dueDate: string;
    student: { id: string; firstName: string; lastName: string; admissionNo?: string };
    feeStructure?: { id: string; name: string; feeType: string; frequency: string; amount: number; academicYear?: string; description?: string };
    payments?: Array<{
      id: string;
      amount: number;
      paymentMethod: string;
      transactionRef?: string;
      paidByName?: string;
      paidAt: string;
      status: string;
      receipt?: { id: string; receiptNo: string };
    }>;
  }>;
  paymentHistory: Array<{
    id: string;
    amount: number;
    paymentMethod: string;
    transactionRef?: string;
    paidByName?: string;
    paidAt: string;
    status: string;
    invoice: { id: string; invoiceNo: string; student: { id: string; firstName: string; lastName: string } };
    receipt?: { id: string; receiptNo: string };
  }>;
  totalPending: number;
  totalOverdue: number;
  totalPaid: number;
}

interface DailyUpdateData {
  updates: Array<{
    id: string;
    date: string;
    food?: string;
    mood?: string;
    sleep?: string;
    waterIntake?: string;
    highlights?: string;
    notes?: string;
    status: string;
    student: { id: string; firstName: string; lastName: string; photo?: string | null };
  }>;
  date: string;
}

interface ObservationData {
  observations: Array<{
    id: string;
    title?: string;
    content: string;
    category: string;
    priority?: string;
    date: string;
    isShared: boolean;
    student: { id: string; firstName: string; lastName: string; photo?: string | null };
    teacher: { id: string; firstName: string; lastName: string; photo?: string | null; specialization?: string };
  }>;
  total: number;
  categories: Record<string, number>;
}

interface GrowthData {
  growthScores: Array<{
    id: string;
    creativity: number;
    communication: number;
    socialSkills: number;
    confidence: number;
    cognitive: number;
    physical: number;
    overall: number;
    assessmentDate: string;
    student: { id: string; firstName: string; lastName: string; photo?: string | null };
  }>;
  milestoneTimelines: Array<{
    id: string;
    achievedDate: string;
    notes?: string;
    student: { id: string; firstName: string; lastName: string; photo?: string | null };
    milestone: { id: string; name: string; category: string; ageRange?: string; indicators?: string };
  }>;
  aiObservations: Array<{
    id: string;
    content: string;
    category?: string;
    createdAt: string;
    isReviewed: boolean;
    student: { id: string; firstName: string; lastName: string; photo?: string | null };
  }>;
  achievements: Array<{
    id: string;
    title: string;
    description?: string;
    date: string;
    type?: string;
    student: { id: string; firstName: string; lastName: string; photo?: string | null };
  }>;
  memories: Array<{
    id: string;
    title?: string;
    description?: string;
    date: string;
    type?: string;
    mediaUrl?: string;
    isPublic: boolean;
    student: { id: string; firstName: string; lastName: string; photo?: string | null };
  }>;
}

interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  publishedAt?: string;
  image?: string | null;
  branch?: { id: string; name: string; logo?: string | null };
}

// ============================================================
// CONSTANTS
// ============================================================
const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'children', label: 'My Children', icon: Baby },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { id: 'fees', label: 'Fees', icon: Receipt },
  { id: 'daily-updates', label: 'Daily Updates', icon: Sun },
  { id: 'observations', label: 'Observations', icon: Eye },
  { id: 'growth', label: 'Growth', icon: TrendingUp },
  { id: 'communication', label: 'Communication', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const CATEGORY_COLORS: Record<string, string> = {
  Behavioral: 'bg-violet-100 text-violet-700',
  Academic: 'bg-emerald-100 text-emerald-700',
  Social: 'bg-blue-100 text-blue-700',
  Emotional: 'bg-rose-100 text-rose-700',
  Physical: 'bg-orange-100 text-orange-700',
  Cognitive: 'bg-purple-100 text-purple-700',
};

const PRIORITY_COLORS: Record<string, string> = {
  High: 'text-rose-600',
  Medium: 'text-violet-600',
  Low: 'text-emerald-600',
};

const GROWTH_DIMENSIONS = [
  { key: 'creativity', label: 'Creativity', color: '#7C3AED' },
  { key: 'communication', label: 'Communication', color: '#10b981' },
  { key: 'socialSkills', label: 'Social Skills', color: '#3b82f6' },
  { key: 'confidence', label: 'Confidence', color: '#8b5cf6' },
  { key: 'cognitive', label: 'Cognitive', color: '#ef4444' },
  { key: 'physical', label: 'Physical', color: '#0EA5E9' },
];

// ============================================================
// HELPERS
// ============================================================
async function apiFetch(url: string, token: string, options?: RequestInit) {
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

function getMoodEmoji(mood?: string) {
  if (!mood) return '😊';
  const m = mood.toLowerCase();
  if (m.includes('happy') || m.includes('great') || m.includes('excited')) return '😄';
  if (m.includes('sad') || m.includes('upset')) return '😢';
  if (m.includes('angry') || m.includes('cranky')) return '😠';
  if (m.includes('tired') || m.includes('sleepy')) return '😴';
  if (m.includes('calm') || m.includes('peaceful')) return '😌';
  return '😊';
}

function getFoodEmoji(food?: string) {
  if (!food) return '🍽️';
  const f = food.toLowerCase();
  if (f.includes('breakfast')) return '🥣';
  if (f.includes('lunch')) return '🍱';
  if (f.includes('snack')) return '🍎';
  if (f.includes('full') || f.includes('ate well') || f.includes('completed')) return '👍';
  if (f.includes('partial') || f.includes('half')) return '🤏';
  if (f.includes('refused') || f.includes('not')) return '❌';
  return '🍽️';
}

function getSleepEmoji(sleep?: string) {
  if (!sleep) return '😴';
  const s = sleep.toLowerCase();
  if (s.includes('good') || s.includes('deep') || s.includes('well')) return '💤';
  if (s.includes('light') || s.includes('restless')) return '🔄';
  if (s.includes('none') || s.includes('no')) return '👀';
  return '😴';
}

function getAttendanceColor(status: string) {
  switch (status) {
    case 'Present': return 'bg-emerald-500';
    case 'Absent': return 'bg-rose-500';
    case 'Late': return 'bg-amber-500';
    case 'HalfDay': return 'bg-yellow-500';
    case 'Excused': return 'bg-blue-500';
    default: return 'bg-gray-300';
  }
}

function getInvoiceStatusBadge(status: string) {
  switch (status) {
    case 'Paid': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Paid</Badge>;
    case 'Pending': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>;
    case 'Overdue': return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Overdue</Badge>;
    case 'Partial': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Partial</Badge>;
    default: return <Badge variant="secondary">{status}</Badge>;
  }
}

// ============================================================
// SKELETON LOADERS
// ============================================================
function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}><CardContent className="p-4"><Skeleton className="h-4 w-20 mb-2" /><Skeleton className="h-8 w-16" /></CardContent></Card>
      ))}
    </div>
  );
}

function CardSkeleton() {
  return <Card><CardHeader><Skeleton className="h-5 w-40" /><Skeleton className="h-3 w-60" /></CardHeader><CardContent><Skeleton className="h-[200px] w-full" /></CardContent></Card>;
}

function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// ERROR/EMPTY STATES
// ============================================================
function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertTriangle className="h-10 w-10 text-violet-500 mb-3" />
      <p className="text-muted-foreground mb-3">{message}</p>
      {onRetry && <Button variant="outline" onClick={onRetry} size="sm">Try Again</Button>}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-10 w-10 text-muted-foreground/40 mb-3" />
      <p className="font-medium text-muted-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground/70 mt-1">{description}</p>}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function ParentPortal({ token, user, onLogout }: ParentPortalProps) {
  const isMobile = useIsMobile();

  // Navigation
  const [activeSection, setActiveSection] = useState<ParentSection>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [children, setChildren] = useState<ChildDetail[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
  const [feeData, setFeeData] = useState<FeeData | null>(null);
  const [dailyUpdateData, setDailyUpdateData] = useState<DailyUpdateData | null>(null);
  const [observationData, setObservationData] = useState<ObservationData | null>(null);
  const [growthData, setGrowthData] = useState<GrowthData | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);

  // Loading & error states
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // UI states
  const [attendanceMonth, setAttendanceMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [observationComment, setObservationComment] = useState('');
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedObservationId, setSelectedObservationId] = useState<string | null>(null);

  // Settings
  const [notifAnnouncements, setNotifAnnouncements] = useState(true);
  const [notifFees, setNotifFees] = useState(true);
  const [notifAttendance, setNotifAttendance] = useState(true);
  const [notifDailyUpdates, setNotifDailyUpdates] = useState(true);
  const [langPref, setLangPref] = useState('en');

  // Helpers
  const setLoadingState = useCallback((key: string, val: boolean) => {
    setLoading(prev => ({ ...prev, [key]: val }));
  }, []);

  const setErrorState = useCallback((key: string, val: string) => {
    setErrors(prev => ({ ...prev, [key]: val }));
  }, []);

  const activeChild = useMemo(() => {
    if (!selectedChildId && children.length > 0) return children[0];
    return children.find(c => c.id === selectedChildId) || children[0] || null;
  }, [children, selectedChildId]);

  const activeChildId = activeChild?.id || null;

  // ============================================================
  // DATA FETCHING
  // ============================================================
  const fetchDashboard = useCallback(async () => {
    setLoadingState('dashboard', true);
    try {
      const data = await apiFetch('/api/parent/dashboard', token);
      setDashboardData(data);
      // Set default child from dashboard data
      if (data.children?.length > 0 && !selectedChildId) {
        const primary = data.children.find((c: ChildBasic) => c.isPrimary);
        setSelectedChildId((primary || data.children[0]).id);
      }
      setErrorState('dashboard', '');
    } catch (err: unknown) {
      setErrorState('dashboard', err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally { setLoadingState('dashboard', false); }
  }, [token, setLoadingState, setErrorState, selectedChildId]);

  const fetchChildren = useCallback(async () => {
    setLoadingState('children', true);
    try {
      const data = await apiFetch('/api/parent/children', token);
      setChildren(data.children || []);
      if (data.children?.length > 0 && !selectedChildId) {
        setSelectedChildId(data.children[0].id);
      }
      setErrorState('children', '');
    } catch (err: unknown) {
      setErrorState('children', err instanceof Error ? err.message : 'Failed to load children');
    } finally { setLoadingState('children', false); }
  }, [token, setLoadingState, setErrorState, selectedChildId]);

  const fetchAttendance = useCallback(async () => {
    if (!activeChildId) return;
    setLoadingState('attendance', true);
    try {
      const data = await apiFetch(`/api/parent/attendance?childId=${activeChildId}&month=${attendanceMonth}`, token);
      setAttendanceData(data);
      setErrorState('attendance', '');
    } catch (err: unknown) {
      setErrorState('attendance', err instanceof Error ? err.message : 'Failed to load attendance');
    } finally { setLoadingState('attendance', false); }
  }, [token, activeChildId, attendanceMonth, setLoadingState, setErrorState]);

  const fetchFees = useCallback(async () => {
    if (!activeChildId) return;
    setLoadingState('fees', true);
    try {
      const data = await apiFetch(`/api/parent/fees?childId=${activeChildId}`, token);
      setFeeData(data);
      setErrorState('fees', '');
    } catch (err: unknown) {
      setErrorState('fees', err instanceof Error ? err.message : 'Failed to load fees');
    } finally { setLoadingState('fees', false); }
  }, [token, activeChildId, setLoadingState, setErrorState]);

  const fetchDailyUpdates = useCallback(async () => {
    if (!activeChildId) return;
    setLoadingState('daily-updates', true);
    try {
      const data = await apiFetch(`/api/parent/daily-updates?childId=${activeChildId}&date=${selectedDate}`, token);
      setDailyUpdateData(data);
      setErrorState('daily-updates', '');
    } catch (err: unknown) {
      setErrorState('daily-updates', err instanceof Error ? err.message : 'Failed to load daily updates');
    } finally { setLoadingState('daily-updates', false); }
  }, [token, activeChildId, selectedDate, setLoadingState, setErrorState]);

  const fetchObservations = useCallback(async () => {
    if (!activeChildId) return;
    setLoadingState('observations', true);
    try {
      const data = await apiFetch(`/api/parent/observations?childId=${activeChildId}`, token);
      setObservationData(data);
      setErrorState('observations', '');
    } catch (err: unknown) {
      setErrorState('observations', err instanceof Error ? err.message : 'Failed to load observations');
    } finally { setLoadingState('observations', false); }
  }, [token, activeChildId, setLoadingState, setErrorState]);

  const fetchGrowth = useCallback(async () => {
    if (!activeChildId) return;
    setLoadingState('growth', true);
    try {
      const data = await apiFetch(`/api/parent/growth?childId=${activeChildId}`, token);
      setGrowthData(data);
      setErrorState('growth', '');
    } catch (err: unknown) {
      setErrorState('growth', err instanceof Error ? err.message : 'Failed to load growth data');
    } finally { setLoadingState('growth', false); }
  }, [token, activeChildId, setLoadingState, setErrorState]);

  const fetchAnnouncements = useCallback(async () => {
    setLoadingState('communication', true);
    try {
      const data = await apiFetch('/api/parent/announcements?page=1&limit=20', token);
      setAnnouncements(data.announcements || []);
      setErrorState('communication', '');
    } catch (err: unknown) {
      setErrorState('communication', err instanceof Error ? err.message : 'Failed to load announcements');
    } finally { setLoadingState('communication', false); }
  }, [token, setLoadingState, setErrorState]);

  // ============================================================
  // LOAD DATA ON SECTION CHANGE
  // ============================================================
  useEffect(() => {
    fetchDashboard();
    fetchChildren();
  }, []);

  useEffect(() => {
    switch (activeSection) {
      case 'attendance': fetchAttendance(); break;
      case 'fees': fetchFees(); break;
      case 'daily-updates': fetchDailyUpdates(); break;
      case 'observations': fetchObservations(); break;
      case 'growth': fetchGrowth(); break;
      case 'communication': fetchAnnouncements(); break;
      case 'children': fetchChildren(); break;
    }
  }, [activeSection, fetchAttendance, fetchFees, fetchDailyUpdates, fetchObservations, fetchGrowth, fetchAnnouncements, fetchChildren]);

  // Refetch when child or month changes
  useEffect(() => {
    if (activeSection === 'attendance' && activeChildId) fetchAttendance();
  }, [activeChildId, attendanceMonth]);

  useEffect(() => {
    if (activeSection === 'fees' && activeChildId) fetchFees();
  }, [activeChildId]);

  useEffect(() => {
    if (activeSection === 'daily-updates' && activeChildId) fetchDailyUpdates();
  }, [activeChildId, selectedDate]);

  useEffect(() => {
    if (activeSection === 'observations' && activeChildId) fetchObservations();
  }, [activeChildId]);

  useEffect(() => {
    if (activeSection === 'growth' && activeChildId) fetchGrowth();
  }, [activeChildId]);

  // ============================================================
  // COMPUTED DATA
  // ============================================================
  const childSelectorItems = useMemo(() => {
    return dashboardData?.children || children.map(c => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      photo: c.photo,
      status: c.status,
      class: c.class,
    }));
  }, [dashboardData, children]);

  const attendanceCalendarData = useMemo(() => {
    if (!attendanceData?.records) return [];
    const map = new Map<string, string>();
    attendanceData.records.forEach(r => {
      const day = new Date(r.date).getDate();
      map.set(String(day), r.status);
    });
    return map;
  }, [attendanceData]);

  const attendanceRate = useMemo(() => {
    if (!attendanceData?.summary || attendanceData.summary.total === 0) return 0;
    return Math.round((attendanceData.summary.present / attendanceData.summary.total) * 100);
  }, [attendanceData]);

  const growthRadarData = useMemo(() => {
    if (!activeChild?.growthScores?.length) {
      return GROWTH_DIMENSIONS.map(d => ({ subject: d.label, value: 0 }));
    }
    const latest = activeChild.growthScores[0];
    return GROWTH_DIMENSIONS.map(d => ({
      subject: d.label,
      value: Math.round((latest as Record<string, number>)[d.key] || 0),
    }));
  }, [activeChild]);

  const growthTrendData = useMemo(() => {
    if (!activeChild?.growthScores?.length) return [];
    return [...activeChild.growthScores].reverse().map(gs => ({
      date: formatDate(gs.assessmentDate),
      overall: Math.round(gs.overall),
      creativity: Math.round(gs.creativity),
      communication: Math.round(gs.communication),
      socialSkills: Math.round(gs.socialSkills),
    }));
  }, [activeChild]);

  // ============================================================
  // RENDER: CHILD SELECTOR
  // ============================================================
  const renderChildSelector = () => {
    if (childSelectorItems.length <= 1) return null;
    return (
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {childSelectorItems.map(child => {
          const isActive = child.id === activeChildId;
          return (
            <Button
              key={child.id}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              className={`shrink-0 ${isActive ? 'bg-gradient-to-r from-violet-600 to-sky-500 hover:from-violet-700 hover:to-sky-600 text-white shadow-sm hover:shadow-md transition-all' : ''}`}
              onClick={() => setSelectedChildId(child.id)}
            >
              <Avatar className="h-5 w-5 mr-2">
                <AvatarFallback className="text-[10px]">{child.firstName[0]}{child.lastName[0]}</AvatarFallback>
              </Avatar>
              {child.firstName}
            </Button>
          );
        })}
      </div>
    );
  };

  // ============================================================
  // RENDER: DASHBOARD
  // ============================================================
  const renderDashboard = () => {
    if (loading.dashboard && !dashboardData) return <div className="space-y-6"><StatsSkeleton /><CardSkeleton /><CardSkeleton /></div>;
    if (errors.dashboard) return <ErrorState message={errors.dashboard} onRetry={fetchDashboard} />;

    const data = dashboardData;
    if (!data) return null;

    const presentDays = data.attendanceSummary.present;
    const pendingFees = data.upcomingFees.reduce((s, f) => s + (f.totalAmount - f.paidAmount), 0);
    const newObs = 0; // placeholder

    return (
      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back! 👋</h2>
          <p className="text-muted-foreground">{user.email}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Present Days', value: presentDays, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100' },
            { label: 'Pending Fees', value: formatCurrency(pendingFees), icon: IndianRupee, color: 'text-violet-600', bg: 'bg-violet-50', iconBg: 'bg-violet-100' },
            { label: 'New Observations', value: newObs, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50', iconBg: 'bg-blue-100' },
            { label: 'Children', value: data.children.length, icon: Baby, color: 'text-orange-600', bg: 'bg-orange-50', iconBg: 'bg-orange-100' },
          ].map((stat) => (
            <Card key={stat.label} className="relative overflow-hidden rounded-3xl">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Children Overview */}
        {data.children.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">My Children</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.children.map(child => (
                <Card key={child.id} className="hover:shadow-md transition-all duration-300 cursor-pointer rounded-3xl" onClick={() => { setSelectedChildId(child.id); setActiveSection('children'); }}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-violet-200">
                        {child.photo && <AvatarImage src={child.photo} />}
                        <AvatarFallback className="bg-violet-100 text-violet-700 font-semibold">
                          {child.firstName[0]}{child.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{child.firstName} {child.lastName}</p>
                        <p className="text-sm text-muted-foreground">{child.class?.name || 'No class assigned'}</p>
                        {child.class?.program?.name && (
                          <Badge variant="secondary" className="text-[10px] mt-1">{child.class.program.name}</Badge>
                        )}
                      </div>
                      <div className="flex items-center">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Update Preview */}
          <Card className="rounded-3xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sun className="h-4 w-4 text-violet-500" /> Recent Daily Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentDailyUpdates.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {data.recentDailyUpdates.slice(0, 3).map(update => (
                    <div key={update.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-[10px]">{update.student.firstName[0]}{update.student.lastName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{update.student.firstName}</p>
                          <span className="text-xs text-muted-foreground">{formatDate(update.date)}</span>
                        </div>
                        <div className="flex gap-2 mt-1 text-xs">
                          {update.food && <span>{getFoodEmoji(update.food)} {update.food.substring(0, 20)}</span>}
                          {update.mood && <span>{getMoodEmoji(update.mood)} {update.mood.substring(0, 15)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Sun} title="No updates yet" description="Daily updates will appear here" />
              )}
            </CardContent>
          </Card>

          {/* Announcements */}
          <Card className="rounded-3xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-emerald-500" /> Recent Announcements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.announcements.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {data.announcements.slice(0, 3).map(ann => (
                    <div key={ann.id} className="p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{ann.title}</p>
                        <Badge variant="secondary" className="text-[10px]">{ann.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ann.content}</p>
                      {ann.publishedAt && <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(ann.publishedAt)}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Megaphone} title="No announcements" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Fee Reminders */}
        {data.upcomingFees.length > 0 && (
          <Card className="rounded-3xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4 text-violet-500" /> Upcoming Fee Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.upcomingFees.slice(0, 4).map(fee => (
                  <div key={fee.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{fee.feeStructure?.name || fee.invoiceNo}</p>
                      <p className="text-xs text-muted-foreground">Due: {formatDate(fee.dueDate)} • {fee.student.firstName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-amber-600">{formatCurrency(fee.totalAmount - fee.paidAmount)}</p>
                      <Badge className={`text-[10px] ${fee.status === 'Overdue' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {fee.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // ============================================================
  // RENDER: MY CHILDREN
  // ============================================================
  const renderChildren = () => {
    if (loading.children && children.length === 0) return <div className="space-y-6"><CardSkeleton /><CardSkeleton /></div>;
    if (errors.children) return <ErrorState message={errors.children} onRetry={fetchChildren} />;
    if (!activeChild) return <EmptyState icon={Baby} title="No children found" description="Your children will appear here once enrolled" />;

    const child = activeChild;

    return (
      <div className="space-y-6">
        {renderChildSelector()}

        {/* Child Profile Card */}
        <Card className="rounded-3xl">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Avatar className="h-20 w-20 border-4 border-violet-200">
                {child.photo && <AvatarImage src={child.photo} />}
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-sky-400 text-white text-2xl font-bold">
                  {child.firstName[0]}{child.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{child.firstName} {child.lastName}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 mt-3 text-sm">
                  <div><span className="text-muted-foreground">Class:</span> <span className="font-medium">{child.class?.name || '—'}</span></div>
                  <div><span className="text-muted-foreground">Program:</span> <span className="font-medium">{child.class?.program?.name || '—'}</span></div>
                  <div><span className="text-muted-foreground">Admission No:</span> <span className="font-medium">{child.admissionNo || '—'}</span></div>
                  <div><span className="text-muted-foreground">DOB:</span> <span className="font-medium">{formatDate(child.dob || '')}</span></div>
                  <div><span className="text-muted-foreground">Gender:</span> <span className="font-medium">{child.gender || '—'}</span></div>
                  <div><span className="text-muted-foreground">Blood Group:</span> <span className="font-medium">{child.bloodGroup || '—'}</span></div>
                  <div><span className="text-muted-foreground">Status:</span> <Badge variant="secondary" className="text-xs">{child.status}</Badge></div>
                  <div><span className="text-muted-foreground">Enrolled:</span> <span className="font-medium">{formatDate(child.enrollmentDate || '')}</span></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Class Teacher Info */}
          {child.class?.teacher && (
            <Card className="rounded-3xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><GraduationCap className="h-4 w-4 text-violet-500" /> Class Teacher</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-emerald-200">
                    {child.class.teacher.photo && <AvatarImage src={child.class.teacher.photo} />}
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                      {child.class.teacher.firstName[0]}{child.class.teacher.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{child.class.teacher.firstName} {child.class.teacher.lastName}</p>
                    <p className="text-sm text-muted-foreground">{child.class.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Medical Records */}
          <Card className="rounded-3xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Heart className="h-4 w-4 text-rose-500" /> Medical Records</CardTitle>
            </CardHeader>
            <CardContent>
              {child.medicalRecords && child.medicalRecords.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {child.medicalRecords.map(record => (
                    <div key={record.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                      <Activity className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{record.type}</p>
                        {record.description && <p className="text-xs text-muted-foreground">{record.description}</p>}
                        {record.date && <p className="text-[10px] text-muted-foreground">{formatDate(record.date)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Heart} title="No medical records" />
              )}
            </CardContent>
          </Card>

          {/* Siblings */}
          <Card className="rounded-3xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-blue-500" /> Siblings</CardTitle>
            </CardHeader>
            <CardContent>
              {child.siblings && child.siblings.length > 0 ? (
                <div className="space-y-2">
                  {child.siblings.map(sib => (
                    <div key={sib.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-[10px]">{sib.firstName[0]}{sib.lastName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{sib.firstName} {sib.lastName}</p>
                        {sib.relation && <p className="text-xs text-muted-foreground">{sib.relation}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Users} title="No siblings recorded" />
              )}
            </CardContent>
          </Card>

          {/* Growth Score Card */}
          <Card className="rounded-3xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-violet-500" /> Latest Growth Score</CardTitle>
            </CardHeader>
            <CardContent>
              {child.growthScores && child.growthScores.length > 0 ? (
                <div className="space-y-3">
                  {GROWTH_DIMENSIONS.map(dim => {
                    const val = Math.round((child.growthScores![0] as Record<string, number>)[dim.key] || 0);
                    return (
                      <div key={dim.key} className="flex items-center gap-3">
                        <span className="text-xs w-24 text-muted-foreground">{dim.label}</span>
                        <div className="flex-1">
                          <Progress value={val} className="h-2" />
                        </div>
                        <span className="text-xs font-medium w-8 text-right">{val}%</span>
                      </div>
                    );
                  })}
                  <Separator className="my-2" />
                  <div className="flex items-center gap-3">
                    <span className="text-xs w-24 font-medium">Overall</span>
                    <div className="flex-1">
                      <Progress value={Math.round(child.growthScores[0].overall)} className="h-3" />
                    </div>
                    <span className="text-sm font-bold w-8 text-right">{Math.round(child.growthScores[0].overall)}%</span>
                  </div>
                </div>
              ) : (
                <EmptyState icon={TrendingUp} title="No growth data yet" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER: ATTENDANCE
  // ============================================================
  const renderAttendance = () => {
    if (loading.attendance && !attendanceData) return <div className="space-y-6"><StatsSkeleton /><CardSkeleton /></div>;
    if (errors.attendance) return <ErrorState message={errors.attendance} onRetry={fetchAttendance} />;
    if (!activeChild) return <EmptyState icon={ClipboardCheck} title="No child selected" />;

    const summary = attendanceData?.summary || { present: 0, absent: 0, late: 0, halfDay: 0, excused: 0, total: 0 };
    const [year, month] = attendanceMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1).getDay();

    return (
      <div className="space-y-6">
        {renderChildSelector()}

        {/* Month Selector */}
        <div className="flex items-center gap-3">
          <Label className="text-sm">Month:</Label>
          <Input
            type="month"
            value={attendanceMonth}
            onChange={e => setAttendanceMonth(e.target.value)}
            className="w-44"
          />
        </div>

        {/* Calendar */}
        <Card className="rounded-3xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Attendance Calendar</CardTitle>
            <CardDescription>
              <span className="inline-flex items-center gap-1 mr-3"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Present</span>
              <span className="inline-flex items-center gap-1 mr-3"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Absent</span>
              <span className="inline-flex items-center gap-1 mr-3"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Late</span>
              <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> Half Day</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const status = attendanceCalendarData.get(String(day));
                const isToday = day === new Date().getDate() && month === new Date().getMonth() + 1 && year === new Date().getFullYear();
                return (
                  <TooltipProvider key={day}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`aspect-square flex items-center justify-center text-sm rounded-lg cursor-default transition-colors
                            ${isToday ? 'ring-2 ring-violet-400' : ''}
                            ${status ? getAttendanceColor(status) + ' text-white' : 'bg-muted/50 hover:bg-muted'}
                          `}
                        >
                          {day}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Day {day}: {status || 'No record'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Present', value: summary.present, color: 'text-emerald-600', bg: 'bg-emerald-50', iconBg: 'bg-emerald-100' },
            { label: 'Absent', value: summary.absent, color: 'text-rose-600', bg: 'bg-rose-50', iconBg: 'bg-rose-100' },
            { label: 'Late', value: summary.late, color: 'text-amber-600', bg: 'bg-amber-50', iconBg: 'bg-amber-100' },
            { label: 'Half Day', value: summary.halfDay, color: 'text-yellow-600', bg: 'bg-yellow-50', iconBg: 'bg-yellow-100' },
            { label: 'Excused', value: summary.excused, color: 'text-blue-600', bg: 'bg-blue-50', iconBg: 'bg-blue-100' },
          ].map(stat => (
            <Card key={stat.label} className="rounded-3xl">
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Attendance Rate */}
        <Card className="rounded-3xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Attendance Rate</span>
              <span className="text-lg font-bold text-emerald-600">{attendanceRate}%</span>
            </div>
            <Progress value={attendanceRate} className="h-3" />
          </CardContent>
        </Card>
      </div>
    );
  };

  // ============================================================
  // RENDER: FEES
  // ============================================================
  const renderFees = () => {
    if (loading.fees && !feeData) return <div className="space-y-6"><StatsSkeleton /><CardSkeleton /></div>;
    if (errors.fees) return <ErrorState message={errors.fees} onRetry={fetchFees} />;
    if (!activeChild) return <EmptyState icon={Receipt} title="No child selected" />;

    const data = feeData || { invoices: [], paymentHistory: [], totalPending: 0, totalOverdue: 0, totalPaid: 0 };

    return (
      <div className="space-y-6">
        {renderChildSelector()}

        {/* Fee Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-amber-200 bg-amber-50/50 rounded-3xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <IndianRupee className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-muted-foreground">Total Pending</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">{formatCurrency(data.totalPending)}</p>
            </CardContent>
          </Card>
          <Card className="border-rose-200 bg-rose-50/50 rounded-3xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span className="text-sm text-muted-foreground">Overdue</span>
              </div>
              <p className="text-2xl font-bold text-rose-600">{formatCurrency(data.totalOverdue)}</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50/50 rounded-3xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-sm text-muted-foreground">Paid This Year</span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(data.totalPaid)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Invoice List */}
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base">Invoices</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice No</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.invoices.map(inv => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.invoiceNo}</TableCell>
                        <TableCell className="text-sm">{inv.feeStructure?.name || '—'}</TableCell>
                        <TableCell>{formatCurrency(inv.totalAmount)}</TableCell>
                        <TableCell>{formatCurrency(inv.paidAmount)}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(inv.totalAmount - inv.paidAmount)}</TableCell>
                        <TableCell>{formatDate(inv.dueDate)}</TableCell>
                        <TableCell>{getInvoiceStatusBadge(inv.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-6">
                <EmptyState icon={Receipt} title="No invoices found" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        {data.paymentHistory.length > 0 && (
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base">Payment History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt No</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Paid By</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.paymentHistory.map(pay => (
                      <TableRow key={pay.id}>
                        <TableCell className="font-medium">{pay.receipt?.receiptNo || '—'}</TableCell>
                        <TableCell>{pay.invoice.invoiceNo}</TableCell>
                        <TableCell>{formatCurrency(pay.amount)}</TableCell>
                        <TableCell>{pay.paymentMethod}</TableCell>
                        <TableCell>{pay.paidByName || '—'}</TableCell>
                        <TableCell>{formatDate(pay.paidAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fee Structure */}
        {data.invoices.length > 0 && (
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base">Fee Structure Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.invoices.filter(inv => inv.feeStructure).map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{inv.feeStructure!.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.feeStructure!.feeType} • {inv.feeStructure!.frequency}
                        {inv.feeStructure!.academicYear && ` • ${inv.feeStructure!.academicYear}`}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(inv.feeStructure!.amount)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // ============================================================
  // RENDER: DAILY UPDATES
  // ============================================================
  const renderDailyUpdates = () => {
    if (loading['daily-updates'] && !dailyUpdateData) return <div className="space-y-6"><CardSkeleton /><CardSkeleton /></div>;
    if (errors['daily-updates']) return <ErrorState message={errors['daily-updates']} onRetry={fetchDailyUpdates} />;
    if (!activeChild) return <EmptyState icon={Sun} title="No child selected" />;

    const updates = dailyUpdateData?.updates || [];

    return (
      <div className="space-y-6">
        {renderChildSelector()}

        {/* Date Picker */}
        <div className="flex items-center gap-3">
          <Label className="text-sm">Date:</Label>
          <Input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-44"
          />
        </div>

        {updates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {updates.map(update => (
              <React.Fragment key={update.id}>
                {/* Food */}
                <Card className="rounded-3xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Utensils className="h-4 w-4 text-violet-500" /> Food
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {update.food ? (
                      <div className="text-sm">
                        <span className="text-2xl mr-2">{getFoodEmoji(update.food)}</span>
                        {update.food}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No food update</p>
                    )}
                  </CardContent>
                </Card>

                {/* Sleep */}
                <Card className="rounded-3xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BedDouble className="h-4 w-4 text-blue-500" /> Sleep
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {update.sleep ? (
                      <div className="text-sm">
                        <span className="text-2xl mr-2">{getSleepEmoji(update.sleep)}</span>
                        {update.sleep}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No sleep update</p>
                    )}
                  </CardContent>
                </Card>

                {/* Mood */}
                <Card className="rounded-3xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Smile className="h-4 w-4 text-emerald-500" /> Mood
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {update.mood ? (
                      <div className="text-sm">
                        <span className="text-2xl mr-2">{getMoodEmoji(update.mood)}</span>
                        {update.mood}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No mood update</p>
                    )}
                  </CardContent>
                </Card>

                {/* Water Intake */}
                <Card className="rounded-3xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-cyan-500" /> Water Intake
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {update.waterIntake ? (
                      <div className="text-sm">
                        <span className="text-2xl mr-2">💧</span>
                        {update.waterIntake}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No water intake update</p>
                    )}
                  </CardContent>
                </Card>

                {/* Highlights */}
                {update.highlights && (
                  <Card className="md:col-span-2 rounded-3xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-violet-500" /> Highlights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{update.highlights}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Notes */}
                {update.notes && (
                  <Card className="md:col-span-2 rounded-3xl">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-purple-500" /> Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{update.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <EmptyState icon={Sun} title="No daily update for this date" description="Updates are shared by teachers during the day" />
        )}
      </div>
    );
  };

  // ============================================================
  // RENDER: OBSERVATIONS
  // ============================================================
  const renderObservations = () => {
    if (loading.observations && !observationData) return <div className="space-y-6"><ListSkeleton /></div>;
    if (errors.observations) return <ErrorState message={errors.observations} onRetry={fetchObservations} />;
    if (!activeChild) return <EmptyState icon={Eye} title="No child selected" />;

    const obs = observationData?.observations || [];
    const cats = observationData?.categories || {};

    return (
      <div className="space-y-6">
        {renderChildSelector()}

        {/* Category Summary */}
        {Object.keys(cats).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(cats).map(([cat, count]) => (
              <Badge key={cat} className={CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-700'}>
                {cat} ({count})
              </Badge>
            ))}
          </div>
        )}

        {/* Observations List */}
        {obs.length > 0 ? (
          <div className="space-y-4">
            {obs.map(o => (
              <Card key={o.id} className="hover:shadow-md transition-all duration-300 rounded-3xl">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={CATEGORY_COLORS[o.category] || 'bg-gray-100 text-gray-700'}>
                        {o.category}
                      </Badge>
                      {o.priority && (
                        <span className={`text-xs font-medium ${PRIORITY_COLORS[o.priority] || ''}`}>
                          {o.priority} Priority
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(o.date)}</span>
                  </div>
                  {o.title && <p className="font-medium mb-1">{o.title}</p>}
                  <p className="text-sm text-muted-foreground">{o.content}</p>
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        {o.teacher.photo && <AvatarImage src={o.teacher.photo} />}
                        <AvatarFallback className="text-[8px]">{o.teacher.firstName[0]}{o.teacher.lastName[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {o.teacher.firstName} {o.teacher.lastName}
                        {o.teacher.specialization && ` • ${o.teacher.specialization}`}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => { setSelectedObservationId(o.id); setCommentDialogOpen(true); }}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" /> Comment
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Acknowledge
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon={Eye} title="No observations shared" description="Teacher observations will appear here when shared" />
        )}

        {/* Comment Dialog */}
        <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Comment</DialogTitle>
              <DialogDescription>Share your thoughts on this observation with the teacher</DialogDescription>
            </DialogHeader>
            <Textarea
              value={observationComment}
              onChange={e => setObservationComment(e.target.value)}
              placeholder="Write your comment..."
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
              <Button className="bg-gradient-to-r from-violet-600 to-sky-500 hover:from-violet-700 hover:to-sky-600 text-white shadow-sm hover:shadow-md transition-all" onClick={() => { setCommentDialogOpen(false); setObservationComment(''); }}>
                <Send className="h-4 w-4 mr-2" /> Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // ============================================================
  // RENDER: GROWTH
  // ============================================================
  const renderGrowth = () => {
    if (loading.growth && !growthData) return <div className="space-y-6"><CardSkeleton /><CardSkeleton /></div>;
    if (errors.growth) return <ErrorState message={errors.growth} onRetry={fetchGrowth} />;
    if (!activeChild) return <EmptyState icon={TrendingUp} title="No child selected" />;

    const gData = growthData;

    return (
      <div className="space-y-6">
        {renderChildSelector()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Growth Radar Chart */}
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base">Growth Radar</CardTitle>
              <CardDescription>Six dimensions of development</CardDescription>
            </CardHeader>
            <CardContent>
              {growthRadarData.some(d => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={growthRadarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name="Score" dataKey="value" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.3} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                  No growth data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Growth Trend */}
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base">Growth Trend</CardTitle>
              <CardDescription>Progress over time</CardDescription>
            </CardHeader>
            <CardContent>
              {growthTrendData.length > 1 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={growthTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <RTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="overall" stroke="#7C3AED" strokeWidth={2} name="Overall" />
                    <Line type="monotone" dataKey="creativity" stroke="#10b981" strokeWidth={1} strokeDasharray="4 2" name="Creativity" />
                    <Line type="monotone" dataKey="communication" stroke="#3b82f6" strokeWidth={1} strokeDasharray="4 2" name="Communication" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                  Need at least 2 assessments for trend
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Milestone Timeline */}
        {gData && gData.milestoneTimelines.length > 0 && (
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-violet-500" /> Milestone Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {gData.milestoneTimelines.map(mt => (
                  <div key={mt.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-violet-500" />
                      <div className="w-0.5 flex-1 bg-violet-200" />
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-sm">{mt.milestone.name}</p>
                      <p className="text-xs text-muted-foreground">{mt.milestone.category} • {formatDate(mt.achievedDate)}</p>
                      {mt.notes && <p className="text-xs text-muted-foreground mt-1">{mt.notes}</p>}
                      {mt.milestone.ageRange && (
                        <Badge variant="secondary" className="text-[10px] mt-1">Age: {mt.milestone.ageRange}</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Observations */}
        {gData && gData.aiObservations.length > 0 && (
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" /> AI Observations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {gData.aiObservations.map(aio => (
                  <div key={aio.id} className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                    <p className="text-sm">{aio.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">{formatDate(aio.createdAt)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Childhood Passport */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Memories */}
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-pink-500" /> Memories
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gData && gData.memories.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {gData.memories.slice(0, 6).map(mem => (
                    <div key={mem.id} className="aspect-square rounded-lg bg-gradient-to-br from-violet-100 to-sky-100 flex flex-col items-center justify-center p-2">
                      {mem.type === 'video' ? <Video className="h-8 w-8 text-violet-400" /> : <ImageIcon className="h-8 w-8 text-violet-400" />}
                      <p className="text-[10px] text-center mt-1 line-clamp-1">{mem.title || formatDate(mem.date)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={ImageIcon} title="No memories yet" description="Photos and videos will appear here" />
              )}
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="h-4 w-4 text-violet-500" /> Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gData && gData.achievements.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {gData.achievements.map(ach => (
                    <div key={ach.id} className="flex items-center gap-3 p-2 rounded-lg bg-violet-50 border border-violet-100">
                      <div className="p-2 rounded-lg bg-violet-100">
                        <Trophy className="h-4 w-4 text-violet-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{ach.title}</p>
                        {ach.description && <p className="text-xs text-muted-foreground">{ach.description}</p>}
                        <p className="text-[10px] text-muted-foreground">{formatDate(ach.date)}</p>
                      </div>
                      <Badge className="bg-violet-100 text-violet-700 text-[10px]">{ach.type || 'Award'}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Trophy} title="No achievements yet" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER: COMMUNICATION
  // ============================================================
  const renderCommunication = () => {
    if (loading.communication && announcements.length === 0) return <div className="space-y-6"><ListSkeleton /></div>;
    if (errors.communication) return <ErrorState message={errors.communication} onRetry={fetchAnnouncements} />;

    return (
      <div className="space-y-6">
        {/* Announcements */}
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-emerald-500" /> Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {announcements.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {announcements.map(ann => (
                  <div key={ann.id} className="p-4 rounded-lg bg-muted/50 border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{ann.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px]">{ann.type}</Badge>
                          {ann.priority === 'High' && <Badge className="bg-rose-100 text-rose-700 text-[10px]">Urgent</Badge>}
                        </div>
                      </div>
                      {ann.publishedAt && (
                        <span className="text-xs text-muted-foreground shrink-0">{timeAgo(ann.publishedAt)}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{ann.content}</p>
                    {ann.branch && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {ann.branch.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Megaphone} title="No announcements" description="Announcements from the school will appear here" />
            )}
          </CardContent>
        </Card>

        {/* Chat Placeholder */}
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-500" /> Chat with Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="font-medium text-muted-foreground">Chat Coming Soon</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Direct messaging with teachers will be available in a future update</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ============================================================
  // RENDER: SETTINGS
  // ============================================================
  const renderSettings = () => {
    return (
      <div className="space-y-6">
        {/* Profile Info */}
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4 text-violet-500" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-violet-200">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-sky-400 text-white text-xl font-bold">
                  {user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-lg">{user.email}</p>
                <Badge className="bg-violet-100 text-violet-700">Parent</Badge>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-sm font-medium">{user.email}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Role</Label>
                <p className="text-sm font-medium">{user.role}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">User ID</Label>
                <p className="text-sm font-medium font-mono">{user.userId.substring(0, 12)}...</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" /> Change Password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" placeholder="Enter current password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" placeholder="Enter new password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input id="confirm-password" type="password" placeholder="Confirm new password" />
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 hover:from-violet-700 hover:to-sky-600 text-white shadow-sm hover:shadow-md transition-all">Update Password</Button>
          </CardContent>
        </Card>

        {/* Notification Preferences */}
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-violet-500" /> Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Announcements', desc: 'Receive notifications about school announcements', value: notifAnnouncements, onChange: setNotifAnnouncements },
              { label: 'Fee Reminders', desc: 'Get reminders about upcoming fee due dates', value: notifFees, onChange: setNotifFees },
              { label: 'Attendance Alerts', desc: 'Be notified about your child\'s attendance', value: notifAttendance, onChange: setNotifAttendance },
              { label: 'Daily Updates', desc: 'Receive daily update summaries', value: notifDailyUpdates, onChange: setNotifDailyUpdates },
            ].map(pref => (
              <div key={pref.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{pref.label}</p>
                  <p className="text-xs text-muted-foreground">{pref.desc}</p>
                </div>
                <Switch checked={pref.value} onCheckedChange={pref.onChange} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Language Preference */}
        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-violet-500" /> Language
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={langPref} onValueChange={setLangPref}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                <SelectItem value="mr">मराठी (Marathi)</SelectItem>
                <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ============================================================
  // RENDER: SECTION CONTENT
  // ============================================================
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return renderDashboard();
      case 'children': return renderChildren();
      case 'attendance': return renderAttendance();
      case 'fees': return renderFees();
      case 'daily-updates': return renderDailyUpdates();
      case 'observations': return renderObservations();
      case 'growth': return renderGrowth();
      case 'communication': return renderCommunication();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  };

  // ============================================================
  // SIDEBAR CONTENT (shared for desktop & mobile)
  // ============================================================
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-violet-400/30 shrink-0">
          <Image src="/preonelogo.png" alt="PreOne" width={36} height={36} className="w-full h-full object-cover" />
        </div>
        {!sidebarCollapsed && (
          <div>
            <h1 className="font-bold text-base leading-tight">PreOne</h1>
            <p className="text-[10px] text-sky-300/70">Parent Portal</p>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <ScrollArea className="flex-1 py-2">
        <nav className="px-2 space-y-1">
          {NAV_ITEMS.map(item => {
            const isActive = activeSection === item.id;
            return (
              <TooltipProvider key={item.id} delayDuration={sidebarCollapsed ? 0 : 1000}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => { setActiveSection(item.id); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                        ${isActive
                          ? 'bg-white/15 text-white font-medium'
                          : 'text-white/60 hover:bg-white/5 hover:text-white'}
                      `}
                    >
                      <item.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : ''}`} />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      {isActive && !sidebarCollapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sky-400" />
                      )}
                    </button>
                  </TooltipTrigger>
                  {sidebarCollapsed && (
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Sidebar Toggle (desktop) */}
      {!isMobile && (
        <div className="px-2 py-2 border-t border-white/10">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white transition-all"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronLeft className="h-4 w-4 shrink-0" />}
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
        </div>
      )}

      {/* User & Logout */}
      <div className="px-3 py-3 border-t border-white/10">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border border-white/20 shrink-0">
            <AvatarFallback className="bg-white/15 text-white text-xs font-semibold">
              {user.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{user.email}</p>
              <p className="text-[10px] opacity-50">Parent</p>
            </div>
          )}
          {!sidebarCollapsed && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onLogout}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-rose-400 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Logout</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );

  // ============================================================
  // MAIN LAYOUT
  // ============================================================
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className={`${sidebarCollapsed ? 'w-[68px]' : 'w-[280px]'} bg-sidebar-gradient text-white flex flex-col transition-all duration-300 shrink-0`}>
          {sidebarContent}
        </aside>
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-[280px] bg-sidebar-gradient text-white border-none">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b bg-white flex items-center px-4 gap-3 shrink-0">
          {isMobile && (
            <Button variant="ghost" size="sm" className="p-1" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <h2 className="font-semibold text-lg capitalize">
            {activeSection.replace(/-/g, ' ')}
          </h2>
          <div className="ml-auto flex items-center gap-2">
            {isMobile && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onLogout}
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-rose-600 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Logout</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
