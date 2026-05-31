'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LayoutDashboard, GraduationCap, ClipboardCheck, Sun, Eye, Palette,
  TrendingUp, Calendar, MessageSquare, Settings, ChevronLeft, ChevronRight,
  Search, Plus, Phone, Clock, CheckCircle2, XCircle, AlertTriangle,
  Baby, LogOut, Loader2, Send, BookOpen, Heart, Star, Award,
  ChevronDown, Filter, Bell, Home, Edit, Users, Moon, Droplets,
  Utensils, Smile, Frown, Meh, Zap, Coffee, BedDouble, GlassWater,
  Menu, X, ArrowUpRight, Sparkles, Activity, Target, CircleDot, Lock,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  PieChart, Pie, Cell, ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from 'recharts';

// ============================================================
// TYPES
// ============================================================
type Section = 'dashboard' | 'my-class' | 'attendance' | 'daily-updates' | 'observations' | 'activities' | 'growth' | 'schedule-leave' | 'communication' | 'settings';

interface TeacherPortalProps {
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
  id: Section;
  label: string;
  icon: React.ElementType;
}

interface ClassInfo {
  id: string;
  name: string;
  program?: { name: string };
  room?: string;
  capacity?: number;
  students?: StudentInfo[];
}

interface StudentInfo {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo?: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  medicalAlerts?: string;
  attendanceRate?: number;
  parents?: { id: string; firstName: string; lastName: string; phone: string; relation: string }[];
  growthScore?: {
    creativity: number; communication: number; socialSkills: number;
    confidence: number; cognitive: number; physical: number; overall: number;
  };
}

interface ScheduleSlot {
  day: string;
  startTime: string;
  endTime: string;
  subject: string;
}

interface AttendanceRecord {
  studentId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'UNMARKED';
}

interface DailyUpdateData {
  id?: string;
  studentId: string;
  date: string;
  breakfast?: { status: string; menu?: string };
  lunch?: { status: string; menu?: string };
  snacks?: { status: string; menu?: string };
  sleep?: { quality: string; duration?: string; notes?: string };
  morningMood?: string;
  afternoonMood?: string;
  waterGlasses?: number;
  highlights?: string;
  notes?: string;
  status?: 'DRAFT' | 'PUBLISHED';
}

interface ObservationData {
  id?: string;
  studentId: string;
  category: string;
  content: string;
  priority: string;
  shareWithParent: boolean;
  createdAt?: string;
  student?: { firstName: string; lastName: string };
}

interface ActivityData {
  id?: string;
  title: string;
  type: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  classId?: string;
}

interface LeaveData {
  id?: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status?: string;
  days?: number;
}

interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  publishedAt?: string;
  createdAt: string;
}

interface GrowthClassData {
  classAverages?: {
    creativity: number; communication: number; socialSkills: number;
    confidence: number; cognitive: number; physical: number; overall: number;
  };
  students: { id: string; firstName: string; lastName: string; growthScore?: {
    creativity: number; communication: number; socialSkills: number;
    confidence: number; cognitive: number; physical: number; overall: number;
  } }[];
  needsAttention?: { id: string; name: string; overall: number; weakestArea: string }[];
  topPerformers?: { id: string; name: string; overall: number }[];
}

interface LeaveBalance {
  type: string;
  total: number;
  used: number;
  available: number;
}

// ============================================================
// CONSTANTS
// ============================================================
const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'my-class', label: 'My Class', icon: GraduationCap },
  { id: 'attendance', label: 'Attendance', icon: ClipboardCheck },
  { id: 'daily-updates', label: 'Daily Updates', icon: Sun },
  { id: 'observations', label: 'Observations', icon: Eye },
  { id: 'activities', label: 'Activities', icon: Palette },
  { id: 'growth', label: 'Growth', icon: TrendingUp },
  { id: 'schedule-leave', label: 'Schedule & Leave', icon: Calendar },
  { id: 'communication', label: 'Communication', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const ATTENDANCE_COLORS = {
  PRESENT: 'bg-emerald-100 border-emerald-400 text-emerald-800',
  ABSENT: 'bg-rose-100 border-rose-400 text-rose-800',
  LATE: 'bg-amber-100 border-amber-400 text-amber-800',
  UNMARKED: 'bg-gray-100 border-gray-300 text-gray-600',
};

const FOOD_OPTIONS = ['Eaten', 'Partial', 'Not Eaten', 'Skipped'];
const SLEEP_QUALITIES = ['Good', 'Fair', 'Poor', 'None', 'Restless'];
const MOOD_OPTIONS = ['Happy', 'Sad', 'Angry', 'Calm', 'Excited', 'Tired', 'Sick', 'Fussy'];
const OBSERVATION_CATEGORIES = ['Behavior', 'Academic', 'Social', 'Emotional', 'Physical', 'Creative', 'Other'];
const ACTIVITY_TYPES = ['Art', 'Music', 'Dance', 'Sports', 'Story', 'Science', 'Field Trip', 'Celebration', 'Other'];
const LEAVE_TYPES = ['Casual', 'Sick', 'Earned', 'Maternity', 'Paternity', 'Comp Off'];

const MOOD_EMOJIS: Record<string, string> = {
  Happy: '😊', Sad: '😢', Angry: '😠', Calm: '😌', Excited: '🤩', Tired: '😴', Sick: '🤒', Fussy: '😤',
};

const GROWTH_DIMENSIONS = ['creativity', 'communication', 'socialSkills', 'confidence', 'cognitive', 'physical'] as const;
const GROWTH_LABELS: Record<string, string> = {
  creativity: 'Creativity', communication: 'Communication', socialSkills: 'Social Skills',
  confidence: 'Confidence', cognitive: 'Cognitive', physical: 'Physical',
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

function todayStr() {
  return new Date().toISOString().split('T')[0];
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

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function TeacherPortal({ token, user, onLogout }: TeacherPortalProps) {
  // Navigation
  const [activeSection, setActiveSection] = useState<Section>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Data states
  const [dashboardData, setDashboardData] = useState<Record<string, unknown> | null>(null);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [dailyUpdates, setDailyUpdates] = useState<DailyUpdateData[]>([]);
  const [observations, setObservations] = useState<ObservationData[]>([]);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [growthData, setGrowthData] = useState<GrowthClassData | null>(null);
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [leaves, setLeaves] = useState<LeaveData[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);

  // Loading / Error states
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // UI states
  const [attendanceDate, setAttendanceDate] = useState(todayStr());
  const [updateDate, setUpdateDate] = useState(todayStr());
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
  const [studentDetailOpen, setStudentDetailOpen] = useState(false);
  const [observationFilter, setObservationFilter] = useState('all');
  const [observationStudentFilter, setObservationStudentFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [selectedGrowthStudent, setSelectedGrowthStudent] = useState<string>('');

  // Form states
  const [newObservation, setNewObservation] = useState<ObservationData>({
    studentId: '', category: 'Behavior', content: '', priority: 'Medium', shareWithParent: false,
  });
  const [newActivity, setNewActivity] = useState<ActivityData>({
    title: '', type: 'Art', description: '', date: todayStr(), startTime: '09:00', endTime: '11:00',
  });
  const [newLeave, setNewLeave] = useState<LeaveData>({
    type: 'Casual', startDate: todayStr(), endDate: todayStr(), reason: '',
  });
  const [currentDailyUpdate, setCurrentDailyUpdate] = useState<DailyUpdateData | null>(null);
  const [dailyUpdateStudentId, setDailyUpdateStudentId] = useState<string>('');
  const [growthEntry, setGrowthEntry] = useState({
    studentId: '', period: '', creativity: 50, communication: 50, socialSkills: 50, confidence: 50, cognitive: 50, physical: 50,
  });
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', email: '', qualification: '' });
  const [notifPrefs, setNotifPrefs] = useState({ attendance: true, dailyUpdates: true, announcements: true, messages: true });

  const teacherName = user.email ? user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Teacher';

  // ============================================================
  // DATA FETCHING
  // ============================================================
  const setLoadingState = useCallback((key: string, val: boolean) => {
    setLoading(prev => ({ ...prev, [key]: val }));
  }, []);

  const setErrorState = useCallback((key: string, val: string) => {
    setErrors(prev => ({ ...prev, [key]: val }));
  }, []);

  const fetchDashboard = useCallback(async () => {
    setLoadingState('dashboard', true);
    try {
      const data = await apiFetch('/api/teacher/dashboard', token);
      setDashboardData(data);
      setErrorState('dashboard', '');
    } catch (err: unknown) {
      setErrorState('dashboard', err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally { setLoadingState('dashboard', false); }
  }, [token, setLoadingState, setErrorState]);

  const fetchClass = useCallback(async () => {
    setLoadingState('class', true);
    try {
      const data = await apiFetch('/api/teacher/class', token);
      setClassInfo(data.class || data);
      setStudents(data.students || (data.class?.students) || []);
      setErrorState('class', '');
    } catch (err: unknown) {
      setErrorState('class', err instanceof Error ? err.message : 'Failed to load class');
    } finally { setLoadingState('class', false); }
  }, [token, setLoadingState, setErrorState]);

  const fetchObservations = useCallback(async () => {
    setLoadingState('observations', true);
    try {
      const data = await apiFetch('/api/teacher/observations', token);
      setObservations(data.observations || data || []);
      setErrorState('observations', '');
    } catch (err: unknown) {
      setErrorState('observations', err instanceof Error ? err.message : 'Failed to load observations');
    } finally { setLoadingState('observations', false); }
  }, [token, setLoadingState, setErrorState]);

  const fetchActivities = useCallback(async () => {
    setLoadingState('activities', true);
    try {
      const data = await apiFetch('/api/teacher/activities', token);
      setActivities(data.activities || data || []);
      setErrorState('activities', '');
    } catch (err: unknown) {
      setErrorState('activities', err instanceof Error ? err.message : 'Failed to load activities');
    } finally { setLoadingState('activities', false); }
  }, [token, setLoadingState, setErrorState]);

  const fetchGrowth = useCallback(async () => {
    setLoadingState('growth', true);
    try {
      const data = await apiFetch('/api/teacher/growth', token);
      setGrowthData(data);
      setErrorState('growth', '');
    } catch (err: unknown) {
      setErrorState('growth', err instanceof Error ? err.message : 'Failed to load growth data');
    } finally { setLoadingState('growth', false); }
  }, [token, setLoadingState, setErrorState]);

  const fetchSchedule = useCallback(async () => {
    setLoadingState('schedule', true);
    try {
      const data = await apiFetch('/api/teacher/schedule', token);
      setSchedule(data.schedule || data || []);
      setErrorState('schedule', '');
    } catch (err: unknown) {
      setErrorState('schedule', err instanceof Error ? err.message : 'Failed to load schedule');
    } finally { setLoadingState('schedule', false); }
  }, [token, setLoadingState, setErrorState]);

  const fetchLeaves = useCallback(async () => {
    setLoadingState('leaves', true);
    try {
      const data = await apiFetch('/api/teacher/leaves', token);
      setLeaves(data.leaves || data || []);
      setLeaveBalance(data.balance || []);
      setErrorState('leaves', '');
    } catch (err: unknown) {
      setErrorState('leaves', err instanceof Error ? err.message : 'Failed to load leaves');
    } finally { setLoadingState('leaves', false); }
  }, [token, setLoadingState, setErrorState]);

  const fetchDailyUpdates = useCallback(async () => {
    setLoadingState('daily-updates', true);
    try {
      const data = await apiFetch(`/api/teacher/daily-updates?date=${updateDate}`, token);
      setDailyUpdates(data.updates || data || []);
      setErrorState('daily-updates', '');
    } catch (err: unknown) {
      setErrorState('daily-updates', err instanceof Error ? err.message : 'Failed to load daily updates');
    } finally { setLoadingState('daily-updates', false); }
  }, [token, updateDate, setLoadingState, setErrorState]);

  const fetchAnnouncements = useCallback(async () => {
    setLoadingState('communication', true);
    try {
      const data = await apiFetch('/api/communication/announcements?page=1&limit=10', token);
      setAnnouncements(data.announcements || []);
    } catch { /* ignore */ }
    finally { setLoadingState('communication', false); }
  }, [token, setLoadingState]);

  // Initial data load
  useEffect(() => {
    fetchDashboard();
    fetchClass();
  }, [fetchDashboard, fetchClass]);

  // Section-specific data load
  useEffect(() => {
    switch (activeSection) {
      case 'my-class': fetchClass(); break;
      case 'attendance': fetchClass(); break;
      case 'daily-updates': fetchDailyUpdates(); break;
      case 'observations': fetchObservations(); break;
      case 'activities': fetchActivities(); break;
      case 'growth': fetchGrowth(); fetchClass(); break;
      case 'schedule-leave': fetchSchedule(); fetchLeaves(); break;
      case 'communication': fetchAnnouncements(); break;
    }
  }, [activeSection, fetchClass, fetchDailyUpdates, fetchObservations, fetchActivities, fetchGrowth, fetchSchedule, fetchLeaves, fetchAnnouncements]);

  // Initialize attendance records when students change
  useEffect(() => {
    if (students.length > 0 && activeSection === 'attendance') {
      setAttendanceRecords(students.map(s => ({ studentId: s.id, status: 'UNMARKED' as const })));
    }
  }, [students, activeSection]);

  // Initialize profile form
  useEffect(() => {
    if (user) {
      setProfileForm(prev => ({
        ...prev,
        name: teacherName,
        email: user.email,
        phone: prev.phone || '',
        qualification: prev.qualification || '',
      }));
    }
  }, [user, teacherName]);

  // ============================================================
  // FORM HANDLERS
  // ============================================================
  const handleMarkAttendance = async () => {
    const marked = attendanceRecords.filter(r => r.status !== 'UNMARKED');
    if (marked.length === 0) return;
    try {
      await apiFetch('/api/teacher/attendance/mark', token, {
        method: 'POST',
        body: JSON.stringify({ date: attendanceDate, records: marked }),
      });
      alert('Attendance saved successfully!');
      fetchDashboard();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save attendance');
    }
  };

  const handleBulkMark = (status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setAttendanceRecords(prev => prev.map(r => ({ ...r, status })));
  };

  const toggleAttendance = (studentId: string) => {
    setAttendanceRecords(prev => prev.map(r => {
      if (r.studentId !== studentId) return r;
      const next = r.status === 'UNMARKED' ? 'PRESENT' : r.status === 'PRESENT' ? 'ABSENT' : r.status === 'ABSENT' ? 'LATE' : 'UNMARKED';
      return { ...r, status: next as AttendanceRecord['status'] };
    }));
  };

  const handleSaveDailyUpdate = async (publish: boolean) => {
    if (!currentDailyUpdate) return;
    try {
      await apiFetch('/api/teacher/daily-updates', token, {
        method: 'POST',
        body: JSON.stringify({ ...currentDailyUpdate, status: publish ? 'PUBLISHED' : 'DRAFT' }),
      });
      alert(publish ? 'Daily update published!' : 'Daily update saved as draft!');
      setCurrentDailyUpdate(null);
      setDailyUpdateStudentId('');
      fetchDailyUpdates();
      fetchDashboard();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save daily update');
    }
  };

  const handleAddObservation = async () => {
    try {
      await apiFetch('/api/teacher/observations', token, {
        method: 'POST',
        body: JSON.stringify(newObservation),
      });
      setNewObservation({ studentId: '', category: 'Behavior', content: '', priority: 'Medium', shareWithParent: false });
      fetchObservations();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add observation');
    }
  };

  const handleAddActivity = async () => {
    try {
      await apiFetch('/api/teacher/activities', token, {
        method: 'POST',
        body: JSON.stringify(newActivity),
      });
      setNewActivity({ title: '', type: 'Art', description: '', date: todayStr(), startTime: '09:00', endTime: '11:00' });
      fetchActivities();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add activity');
    }
  };

  const handleApplyLeave = async () => {
    try {
      await apiFetch('/api/teacher/leaves', token, {
        method: 'POST',
        body: JSON.stringify(newLeave),
      });
      setNewLeave({ type: 'Casual', startDate: todayStr(), endDate: todayStr(), reason: '' });
      fetchLeaves();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to apply leave');
    }
  };

  const handleSaveGrowth = async () => {
    try {
      await apiFetch('/api/teacher/growth', token, {
        method: 'POST',
        body: JSON.stringify(growthEntry),
      });
      setGrowthEntry({ studentId: '', period: '', creativity: 50, communication: 50, socialSkills: 50, confidence: 50, cognitive: 50, physical: 50 });
      fetchGrowth();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save growth score');
    }
  };

  // ============================================================
  // COMPUTED DATA
  // ============================================================
  const attendanceSummary = useMemo(() => {
    const present = attendanceRecords.filter(r => r.status === 'PRESENT').length;
    const absent = attendanceRecords.filter(r => r.status === 'ABSENT').length;
    const late = attendanceRecords.filter(r => r.status === 'LATE').length;
    const unmarked = attendanceRecords.filter(r => r.status === 'UNMARKED').length;
    return { present, absent, late, unmarked, total: attendanceRecords.length };
  }, [attendanceRecords]);

  const attendancePieData = useMemo(() => [
    { name: 'Present', value: attendanceSummary.present, color: '#10b981' },
    { name: 'Absent', value: attendanceSummary.absent, color: '#ef4444' },
    { name: 'Late', value: attendanceSummary.late, color: '#f59e0b' },
    { name: 'Unmarked', value: attendanceSummary.unmarked, color: '#94a3b8' },
  ].filter(d => d.value > 0), [attendanceSummary]);

  const filteredObservations = useMemo(() => {
    return observations.filter(o => {
      const matchCategory = observationFilter === 'all' || o.category === observationFilter;
      const matchStudent = observationStudentFilter === 'all' || o.studentId === observationStudentFilter;
      return matchCategory && matchStudent;
    });
  }, [observations, observationFilter, observationStudentFilter]);

  const filteredActivities = useMemo(() => {
    if (activityFilter === 'all') return activities;
    return activities.filter(a => a.type === activityFilter || a.status === activityFilter);
  }, [activities, activityFilter]);

  const growthRadarData = useMemo(() => {
    if (!growthData?.classAverages) {
      return GROWTH_DIMENSIONS.map(d => ({ subject: GROWTH_LABELS[d], Class: 0, Student: 0 }));
    }
    const c = growthData.classAverages;
    const s = selectedGrowthStudent
      ? growthData.students.find(st => st.id === selectedGrowthStudent)?.growthScore
      : null;
    return GROWTH_DIMENSIONS.map(d => ({
      subject: GROWTH_LABELS[d],
      Class: Math.round(c[d]),
      Student: s ? Math.round(s[d]) : 0,
    }));
  }, [growthData, selectedGrowthStudent]);

  const sectionLabel = useMemo(() => {
    const item = NAV_ITEMS.find(n => n.id === activeSection);
    return item?.label || activeSection;
  }, [activeSection]);

  // ============================================================
  // RENDER: SIDEBAR NAVIGATION
  // ============================================================
  const renderSidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
          <Baby className="h-5 w-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold tracking-tight text-white">PreOne</h1>
            <p className="text-[10px] text-amber-300/70 -mt-0.5">Teacher Portal</p>
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
                    onClick={() => { setActiveSection(item.id); setMobileSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 font-medium shadow-sm'
                        : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                    }`}
                  >
                    <item.icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-amber-400' : ''}`} />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    {isActive && !sidebarCollapsed && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                  </button>
                </TooltipTrigger>
                {sidebarCollapsed && (
                  <TooltipContent side="right" className="font-medium">{item.label}</TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Sidebar Toggle (desktop only) */}
      <div className="px-2 py-2 border-t border-white/10 hidden lg:block">
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
            <AvatarFallback className="bg-emerald-500 text-white text-xs font-semibold">
              {teacherName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!sidebarCollapsed && (
            <>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-medium text-white truncate">{teacherName}</p>
                <p className="text-xs text-white/40 truncate">{user.email}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10" onClick={onLogout}>
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  );

  // ============================================================
  // RENDER: DASHBOARD
  // ============================================================
  const renderDashboard = () => {
    if (loading.dashboard && !dashboardData) {
      return <div className="space-y-6"><StatsSkeleton /><CardSkeleton /><CardSkeleton /></div>;
    }
    if (errors.dashboard) {
      return (
        <div className="p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-rose-400 mx-auto mb-3" />
          <p className="text-rose-600 mb-3">{errors.dashboard}</p>
          <Button variant="outline" onClick={fetchDashboard}><Zap className="h-4 w-4 mr-2" />Retry</Button>
        </div>
      );
    }

    const dashData = dashboardData as Record<string, unknown> || {};
    const className = classInfo?.name || (dashData.className as string) || '—';
    const program = classInfo?.program?.name || (dashData.programName as string) || '—';
    const studentCount = students.length || (dashData.studentCount as number) || 0;
    const capacity = classInfo?.capacity || (dashData.capacity as number) || 0;
    const pendingUpdates = (dashData.pendingUpdates as number) || 0;
    const recentActivitiesList = (dashData.recentActivities as Array<Record<string, string>>) || [];
    const todaySchedule = (dashData.todaySchedule as Array<Record<string, string>>) || [];
    const todayAttendance = (dashData.todayAttendance as Record<string, number>) || {};

    return (
      <div className="space-y-6">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {teacherName}! 👋</h2>
            <p className="text-muted-foreground mt-1">Here&apos;s what&apos;s happening with your class today.</p>
          </div>
          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 px-3 py-1">
            <Clock className="h-3 w-3 mr-1" /> {new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Class', value: className, icon: GraduationCap, color: 'bg-amber-50 text-amber-600', iconBg: 'bg-amber-100' },
            { label: 'Program', value: program, icon: BookOpen, color: 'bg-emerald-50 text-emerald-600', iconBg: 'bg-emerald-100' },
            { label: 'Students', value: `${studentCount}${capacity ? `/${capacity}` : ''}`, icon: Users, color: 'bg-teal-50 text-teal-600', iconBg: 'bg-teal-100' },
            { label: 'Pending Updates', value: pendingUpdates, icon: Sun, color: 'bg-orange-50 text-orange-600', iconBg: 'bg-orange-100' },
          ].map((stat) => (
            <Card key={stat.label} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color.split(' ')[1]}`} />
                  </div>
                </div>
                <p className="text-xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today&apos;s Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {todaySchedule.length > 0 ? (
                <div className="space-y-3">
                  {todaySchedule.map((slot, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{slot.subject || slot.title || 'Activity'}</p>
                        <p className="text-xs text-muted-foreground">{slot.startTime || ''}{slot.endTime ? ` - ${slot.endTime}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No schedule for today</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today&apos;s Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {(todayAttendance.present || todayAttendance.absent || todayAttendance.late) ? (
                <div className="space-y-4">
                  <div className="h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[
                          { name: 'Present', value: todayAttendance.present || 0, color: '#10b981' },
                          { name: 'Absent', value: todayAttendance.absent || 0, color: '#ef4444' },
                          { name: 'Late', value: todayAttendance.late || 0, color: '#f59e0b' },
                        ].filter(d => d.value > 0)} dataKey="value" innerRadius={40} outerRadius={60} paddingAngle={4}>
                          {[
                            { name: 'Present', value: todayAttendance.present || 0, color: '#10b981' },
                            { name: 'Absent', value: todayAttendance.absent || 0, color: '#ef4444' },
                            { name: 'Late', value: todayAttendance.late || 0, color: '#f59e0b' },
                          ].filter(d => d.value > 0).map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-emerald-50"><p className="text-lg font-bold text-emerald-600">{todayAttendance.present || 0}</p><p className="text-[10px] text-emerald-600/70">Present</p></div>
                    <div className="p-2 rounded-lg bg-rose-50"><p className="text-lg font-bold text-rose-600">{todayAttendance.absent || 0}</p><p className="text-[10px] text-rose-600/70">Absent</p></div>
                    <div className="p-2 rounded-lg bg-amber-50"><p className="text-lg font-bold text-amber-600">{todayAttendance.late || 0}</p><p className="text-[10px] text-amber-600/70">Late</p></div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No attendance marked yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-amber-500 hover:bg-amber-600 text-white" onClick={() => setActiveSection('attendance')}>
                <ClipboardCheck className="h-4 w-4 mr-2" /> Mark Attendance
              </Button>
              <Button className="w-full justify-start bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => setActiveSection('daily-updates')}>
                <Sun className="h-4 w-4 mr-2" /> Fill Daily Updates
              </Button>
              <Button className="w-full justify-start bg-teal-500 hover:bg-teal-600 text-white" onClick={() => setActiveSection('observations')}>
                <Eye className="h-4 w-4 mr-2" /> Add Observation
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivitiesList.length > 0 ? (
              <div className="space-y-3">
                {recentActivitiesList.slice(0, 5).map((act, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-amber-50">
                      <Activity className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{act.title || act.type || 'Activity'}</p>
                      <p className="text-xs text-muted-foreground truncate">{act.description || act.timestamp || ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No recent activities</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // ============================================================
  // RENDER: MY CLASS
  // ============================================================
  const renderMyClass = () => {
    if (loading.class && !classInfo) {
      return <div className="space-y-6"><StatsSkeleton /><CardSkeleton /></div>;
    }
    if (errors.class) {
      return (
        <div className="p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-rose-400 mx-auto mb-3" />
          <p className="text-rose-600 mb-3">{errors.class}</p>
          <Button variant="outline" onClick={fetchClass}><Zap className="h-4 w-4 mr-2" />Retry</Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Class Header */}
        <Card className="bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border-amber-200/50">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{classInfo?.name || 'No Class Assigned'}</h2>
                <p className="text-muted-foreground mt-1">
                  {classInfo?.program?.name || '—'} • Room {classInfo?.room || '—'} • {students.length} students{classInfo?.capacity ? ` / ${classInfo.capacity} capacity` : ''}
                </p>
              </div>
              <Badge className="bg-emerald-500 text-white px-3 py-1">
                <GraduationCap className="h-3 w-3 mr-1" /> Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Student List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Students</CardTitle>
                <CardDescription>{students.length} students enrolled</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {students.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No students yet</p>
                <p className="text-sm">Students will appear here once enrolled in your class.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Adm. No</TableHead>
                      <TableHead className="hidden md:table-cell">Parent Phone</TableHead>
                      <TableHead className="hidden lg:table-cell">Attendance</TableHead>
                      <TableHead>Alerts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s) => (
                      <TableRow
                        key={s.id}
                        className="cursor-pointer hover:bg-amber-50/50"
                        onClick={() => { setSelectedStudent(s); setStudentDetailOpen(true); }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
                                {s.firstName[0]}{s.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{s.firstName} {s.lastName}</p>
                              <p className="text-xs text-muted-foreground sm:hidden">{s.admissionNo || '—'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">{s.admissionNo || '—'}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {s.parents?.[0]?.phone ? (
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{s.parents[0].phone}</span>
                          ) : '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <Progress value={s.attendanceRate || 0} className="h-2 w-16" />
                            <span className="text-xs text-muted-foreground">{s.attendanceRate || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {s.medicalAlerts ? (
                            <Badge variant="outline" className="text-rose-600 border-rose-300 bg-rose-50 text-[10px]">
                              <AlertTriangle className="h-3 w-3 mr-0.5" />{s.medicalAlerts}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Detail Dialog */}
        <Dialog open={studentDetailOpen} onOpenChange={setStudentDetailOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedStudent?.firstName} {selectedStudent?.lastName}</DialogTitle>
              <DialogDescription>Student Details</DialogDescription>
            </DialogHeader>
            {selectedStudent && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-amber-100 text-amber-700 text-xl">
                      {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                    <p className="text-sm text-muted-foreground">Adm: {selectedStudent.admissionNo || '—'}</p>
                    <div className="flex gap-2 mt-1">
                      {selectedStudent.gender && <Badge variant="outline" className="text-xs">{selectedStudent.gender}</Badge>}
                      {selectedStudent.bloodGroup && <Badge variant="outline" className="text-xs text-rose-600 border-rose-300">{selectedStudent.bloodGroup}</Badge>}
                    </div>
                  </div>
                </div>
                <Separator />
                {/* Parents */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Parents / Guardians</h4>
                  {selectedStudent.parents && selectedStudent.parents.length > 0 ? (
                    <div className="space-y-2">
                      {selectedStudent.parents.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <div>
                            <p className="text-sm font-medium">{p.firstName} {p.lastName}</p>
                            <p className="text-xs text-muted-foreground">{p.relation}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Phone className="h-3.5 w-3.5" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No parent info available</p>
                  )}
                </div>
                <Separator />
                {/* Medical */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Medical Records</h4>
                  {selectedStudent.medicalAlerts ? (
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200">
                      <p className="text-sm text-rose-700 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> {selectedStudent.medicalAlerts}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No medical alerts</p>
                  )}
                </div>
                {/* Growth Summary */}
                {selectedStudent.growthScore && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium text-sm mb-2">Growth Summary</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {GROWTH_DIMENSIONS.map(d => (
                          <div key={d} className="text-center p-2 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">{GROWTH_LABELS[d]}</p>
                            <p className="font-semibold text-sm">{Math.round(selectedStudent.growthScore![d])}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 text-center">
                        <p className="text-xs text-muted-foreground">Overall</p>
                        <p className="text-xl font-bold text-amber-600">{Math.round(selectedStudent.growthScore.overall)}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  // ============================================================
  // RENDER: ATTENDANCE
  // ============================================================
  const renderAttendance = () => {
    if (loading.class && students.length === 0) {
      return <div className="space-y-6"><StatsSkeleton /><CardSkeleton /></div>;
    }

    return (
      <div className="space-y-6">
        {/* Date & Bulk Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Mark Attendance</h2>
            <p className="text-muted-foreground mt-1">Select date and mark each student&apos;s attendance</p>
          </div>
          <div className="flex items-center gap-2">
            <Input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="w-[160px] h-9" />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Present', value: attendanceSummary.present, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Absent', value: attendanceSummary.absent, color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Late', value: attendanceSummary.late, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Unmarked', value: attendanceSummary.unmarked, color: 'text-gray-600', bg: 'bg-gray-50' },
          ].map((s) => (
            <Card key={s.label} className={`${s.bg} border-0`}>
              <CardContent className="p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bulk Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium mr-2">Bulk Mark:</span>
              <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-600 hover:bg-emerald-50" onClick={() => handleBulkMark('PRESENT')}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> All Present
              </Button>
              <Button size="sm" variant="outline" className="border-rose-300 text-rose-600 hover:bg-rose-50" onClick={() => handleBulkMark('ABSENT')}>
                <XCircle className="h-3.5 w-3.5 mr-1" /> All Absent
              </Button>
              <div className="flex-1" />
              <Button className="bg-amber-500 hover:bg-amber-600 text-white" onClick={handleMarkAttendance} disabled={attendanceSummary.unmarked === attendanceSummary.total}>
                <CheckCircle2 className="h-4 w-4 mr-2" /> Save Attendance
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Student Cards */}
        {students.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No students in your class</p>
              <p className="text-sm">Students will appear here for attendance marking.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {students.map((student) => {
              const record = attendanceRecords.find(r => r.studentId === student.id);
              const status = record?.status || 'UNMARKED';
              return (
                <button
                  key={student.id}
                  onClick={() => toggleAttendance(student.id)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${ATTENDANCE_COLORS[status]} hover:shadow-md active:scale-[0.98]`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={`text-xs font-semibold ${
                        status === 'PRESENT' ? 'bg-emerald-200 text-emerald-700' :
                        status === 'ABSENT' ? 'bg-rose-200 text-rose-700' :
                        status === 'LATE' ? 'bg-amber-200 text-amber-700' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {student.firstName[0]}{student.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{student.firstName} {student.lastName}</p>
                      <p className="text-xs opacity-70">{student.admissionNo || ''}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${
                      status === 'PRESENT' ? 'border-emerald-400 text-emerald-700' :
                      status === 'ABSENT' ? 'border-rose-400 text-rose-700' :
                      status === 'LATE' ? 'border-amber-400 text-amber-700' :
                      'border-gray-300 text-gray-500'
                    }`}>
                      {status === 'UNMARKED' ? 'Tap' : status}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // RENDER: DAILY UPDATES
  // ============================================================
  const renderDailyUpdates = () => {
    if (loading['daily-updates'] && dailyUpdates.length === 0) {
      return <div className="space-y-6"><StatsSkeleton /><CardSkeleton /></div>;
    }
    if (errors['daily-updates']) {
      return (
        <div className="p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-rose-400 mx-auto mb-3" />
          <p className="text-rose-600 mb-3">{errors['daily-updates']}</p>
          <Button variant="outline" onClick={fetchDailyUpdates}><Zap className="h-4 w-4 mr-2" />Retry</Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Daily Updates</h2>
            <p className="text-muted-foreground mt-1">Fill daily updates for each student — food, sleep, mood, and more</p>
          </div>
          <Input type="date" value={updateDate} onChange={e => setUpdateDate(e.target.value)} className="w-[160px] h-9" />
        </div>

        {/* Student selector or update form */}
        {dailyUpdateStudentId ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Update for {students.find(s => s.id === dailyUpdateStudentId)?.firstName} {students.find(s => s.id === dailyUpdateStudentId)?.lastName}
                  </CardTitle>
                  <CardDescription>{formatDate(updateDate)}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setDailyUpdateStudentId(''); setCurrentDailyUpdate(null); }}>
                  <X className="h-4 w-4 mr-1" /> Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentDailyUpdate && (
                <>
                  {/* Food Section */}
                  <div>
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2"><Utensils className="h-4 w-4 text-amber-500" /> Food</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(['breakfast', 'lunch', 'snacks'] as const).map(meal => (
                        <div key={meal} className="space-y-2">
                          <Label className="capitalize text-xs">{meal}</Label>
                          <Select
                            value={currentDailyUpdate[meal]?.status || ''}
                            onValueChange={v => setCurrentDailyUpdate(prev => prev ? {
                              ...prev, [meal]: { ...prev[meal], status: v, menu: prev[meal]?.menu || '' }
                            } : prev)}
                          >
                            <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {FOOD_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Menu (optional)"
                            className="h-8 text-sm"
                            value={currentDailyUpdate[meal]?.menu || ''}
                            onChange={e => setCurrentDailyUpdate(prev => prev ? {
                              ...prev, [meal]: { ...prev[meal], menu: e.target.value }
                            } : prev)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  {/* Sleep Section */}
                  <div>
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2"><BedDouble className="h-4 w-4 text-indigo-500" /> Sleep</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Quality</Label>
                        <Select
                          value={currentDailyUpdate.sleep?.quality || ''}
                          onValueChange={v => setCurrentDailyUpdate(prev => prev ? {
                            ...prev, sleep: { ...prev.sleep, quality: v, duration: prev.sleep?.duration || '', notes: prev.sleep?.notes || '' }
                          } : prev)}
                        >
                          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                          <SelectContent>
                            {SLEEP_QUALITIES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Duration</Label>
                        <Input
                          placeholder="e.g., 2 hours"
                          className="h-8 text-sm"
                          value={currentDailyUpdate.sleep?.duration || ''}
                          onChange={e => setCurrentDailyUpdate(prev => prev ? {
                            ...prev, sleep: { ...prev.sleep, duration: e.target.value }
                          } : prev)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Notes</Label>
                        <Input
                          placeholder="Any notes"
                          className="h-8 text-sm"
                          value={currentDailyUpdate.sleep?.notes || ''}
                          onChange={e => setCurrentDailyUpdate(prev => prev ? {
                            ...prev, sleep: { ...prev.sleep, notes: e.target.value }
                          } : prev)}
                        />
                      </div>
                    </div>
                  </div>
                  <Separator />
                  {/* Mood Section */}
                  <div>
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-2"><Smile className="h-4 w-4 text-emerald-500" /> Mood</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Morning</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {MOOD_OPTIONS.map(m => (
                            <button
                              key={`morning-${m}`}
                              onClick={() => setCurrentDailyUpdate(prev => prev ? { ...prev, morningMood: m } : prev)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                                currentDailyUpdate.morningMood === m
                                  ? 'bg-amber-100 border-amber-400 text-amber-700 font-medium'
                                  : 'bg-background border-muted hover:bg-muted/50'
                              }`}
                            >
                              {MOOD_EMOJIS[m]} {m}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Afternoon</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {MOOD_OPTIONS.map(m => (
                            <button
                              key={`afternoon-${m}`}
                              onClick={() => setCurrentDailyUpdate(prev => prev ? { ...prev, afternoonMood: m } : prev)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                                currentDailyUpdate.afternoonMood === m
                                  ? 'bg-emerald-100 border-emerald-400 text-emerald-700 font-medium'
                                  : 'bg-background border-muted hover:bg-muted/50'
                              }`}
                            >
                              {MOOD_EMOJIS[m]} {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  {/* Water & Highlights */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs flex items-center gap-1"><GlassWater className="h-3.5 w-3.5 text-blue-500" /> Water (glasses)</Label>
                      <div className="flex items-center gap-3">
                        <Slider
                          value={[currentDailyUpdate.waterGlasses || 0]}
                          max={10}
                          step={1}
                          onValueChange={v => setCurrentDailyUpdate(prev => prev ? { ...prev, waterGlasses: v[0] } : prev)}
                          className="flex-1"
                        />
                        <span className="text-sm font-medium w-8 text-center">{currentDailyUpdate.waterGlasses || 0}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Highlights</Label>
                      <Textarea
                        placeholder="Today's highlights..."
                        className="min-h-[80px] text-sm"
                        value={currentDailyUpdate.highlights || ''}
                        onChange={e => setCurrentDailyUpdate(prev => prev ? { ...prev, highlights: e.target.value } : prev)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Additional Notes</Label>
                    <Textarea
                      placeholder="Any other notes for parents..."
                      className="min-h-[60px] text-sm"
                      value={currentDailyUpdate.notes || ''}
                      onChange={e => setCurrentDailyUpdate(prev => prev ? { ...prev, notes: e.target.value } : prev)}
                    />
                  </div>
                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button variant="outline" onClick={() => handleSaveDailyUpdate(false)} className="flex-1">
                      <Edit className="h-4 w-4 mr-2" /> Save as Draft
                    </Button>
                    <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => handleSaveDailyUpdate(true)}>
                      <Send className="h-4 w-4 mr-2" /> Publish for Parents
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Existing updates */}
            {dailyUpdates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Today&apos;s Updates ({dailyUpdates.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {dailyUpdates.map(u => {
                      const student = students.find(s => s.id === u.studentId);
                      return (
                        <div key={u.id || u.studentId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
                                {student?.firstName[0] || '?'}{student?.lastName[0] || ''}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{student?.firstName} {student?.lastName}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {u.morningMood && `${MOOD_EMOJIS[u.morningMood] || ''} ${u.morningMood}`}
                                {u.breakfast?.status && ` • 🍽 ${u.breakfast.status}`}
                              </p>
                            </div>
                          </div>
                          <Badge variant={u.status === 'PUBLISHED' ? 'default' : 'outline'} className={u.status === 'PUBLISHED' ? 'bg-emerald-500 text-white text-[10px]' : 'text-[10px]'}>
                            {u.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Student picker */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fill Update for Student</CardTitle>
                <CardDescription>Click on a student to fill their daily update</CardDescription>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sun className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No students in your class</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {students.map(student => {
                      const existing = dailyUpdates.find(u => u.studentId === student.id);
                      return (
                        <button
                          key={student.id}
                          onClick={() => {
                            setDailyUpdateStudentId(student.id);
                            setCurrentDailyUpdate(existing || {
                              studentId: student.id, date: updateDate,
                              breakfast: { status: '', menu: '' }, lunch: { status: '', menu: '' }, snacks: { status: '', menu: '' },
                              sleep: { quality: '', duration: '', notes: '' },
                              morningMood: '', afternoonMood: '', waterGlasses: 0, highlights: '', notes: '', status: 'DRAFT',
                            });
                          }}
                          className={`p-3 rounded-xl border-2 text-center transition-all hover:shadow-md ${
                            existing?.status === 'PUBLISHED' ? 'border-emerald-300 bg-emerald-50' :
                            existing?.status === 'DRAFT' ? 'border-amber-300 bg-amber-50' :
                            'border-muted hover:border-amber-300'
                          }`}
                        >
                          <Avatar className="h-10 w-10 mx-auto mb-1.5">
                            <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
                              {student.firstName[0]}{student.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-xs font-medium truncate">{student.firstName}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{student.lastName}</p>
                          {existing && (
                            <Badge variant="outline" className={`mt-1 text-[9px] ${
                              existing.status === 'PUBLISHED' ? 'text-emerald-600 border-emerald-300' : 'text-amber-600 border-amber-300'
                            }`}>
                              {existing.status === 'PUBLISHED' ? '✓ Done' : 'Draft'}
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  };

  // ============================================================
  // RENDER: OBSERVATIONS
  // ============================================================
  const renderObservations = () => {
    if (loading.observations && observations.length === 0) {
      return <div className="space-y-6"><CardSkeleton /><CardSkeleton /></div>;
    }
    if (errors.observations) {
      return (
        <div className="p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-rose-400 mx-auto mb-3" />
          <p className="text-rose-600 mb-3">{errors.observations}</p>
          <Button variant="outline" onClick={fetchObservations}><Zap className="h-4 w-4 mr-2" />Retry</Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Observations</h2>
            <p className="text-muted-foreground mt-1">Record and track student observations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Observation Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">New Observation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Student</Label>
                <Select value={newObservation.studentId} onValueChange={v => setNewObservation(prev => ({ ...prev, studentId: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {students.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Category</Label>
                <Select value={newObservation.category} onValueChange={v => setNewObservation(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OBSERVATION_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Content</Label>
                <Textarea
                  placeholder="Describe your observation..."
                  className="min-h-[100px] text-sm"
                  value={newObservation.content}
                  onChange={e => setNewObservation(prev => ({ ...prev, content: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Priority</Label>
                <Select value={newObservation.priority} onValueChange={v => setNewObservation(prev => ({ ...prev, priority: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Low', 'Medium', 'High', 'Critical'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={newObservation.shareWithParent}
                  onCheckedChange={v => setNewObservation(prev => ({ ...prev, shareWithParent: v }))}
                />
                <Label className="text-xs">Share with parent</Label>
              </div>
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white" onClick={handleAddObservation} disabled={!newObservation.studentId || !newObservation.content}>
                <Plus className="h-4 w-4 mr-2" /> Add Observation
              </Button>
            </CardContent>
          </Card>

          {/* Observations List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-base">All Observations ({filteredObservations.length})</CardTitle>
                <div className="flex gap-2">
                  <Select value={observationFilter} onValueChange={setObservationFilter}>
                    <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {OBSERVATION_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={observationStudentFilter} onValueChange={setObservationStudentFilter}>
                    <SelectTrigger className="h-8 w-[120px] text-xs"><SelectValue placeholder="Student" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      {students.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredObservations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Eye className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No observations yet</p>
                  <p className="text-sm">Start by adding your first observation.</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-3">
                    {filteredObservations.map((obs, i) => (
                      <div key={obs.id || i} className="p-4 rounded-lg border hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={`text-[10px] ${
                                obs.category === 'Behavior' ? 'border-amber-300 text-amber-600' :
                                obs.category === 'Academic' ? 'border-emerald-300 text-emerald-600' :
                                obs.category === 'Social' ? 'border-blue-300 text-blue-600' :
                                obs.category === 'Emotional' ? 'border-rose-300 text-rose-600' :
                                obs.category === 'Physical' ? 'border-teal-300 text-teal-600' :
                                'border-purple-300 text-purple-600'
                              }`}>{obs.category}</Badge>
                              <Badge variant="outline" className={`text-[10px] ${
                                obs.priority === 'Critical' ? 'border-rose-400 text-rose-600' :
                                obs.priority === 'High' ? 'border-orange-400 text-orange-600' :
                                obs.priority === 'Medium' ? 'border-amber-400 text-amber-600' :
                                'border-gray-300 text-gray-600'
                              }`}>{obs.priority}</Badge>
                              {obs.shareWithParent && (
                                <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-0">
                                  <Send className="h-2.5 w-2.5 mr-0.5" />Shared
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">{obs.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {obs.student?.firstName || students.find(s => s.id === obs.studentId)?.firstName || 'Unknown'} {obs.student?.lastName || students.find(s => s.id === obs.studentId)?.lastName || ''}
                              {obs.createdAt ? ` • ${formatDate(obs.createdAt)}` : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER: ACTIVITIES
  // ============================================================
  const renderActivities = () => {
    if (loading.activities && activities.length === 0) {
      return <div className="space-y-6"><CardSkeleton /><CardSkeleton /></div>;
    }
    if (errors.activities) {
      return (
        <div className="p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-rose-400 mx-auto mb-3" />
          <p className="text-rose-600 mb-3">{errors.activities}</p>
          <Button variant="outline" onClick={fetchActivities}><Zap className="h-4 w-4 mr-2" />Retry</Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Activities</h2>
            <p className="text-muted-foreground mt-1">Plan and manage class activities</p>
          </div>
          <div className="flex gap-2">
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue placeholder="Filter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {ACTIVITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* New Activity Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">New Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Title</Label>
                <Input placeholder="Activity title" className="h-9 text-sm" value={newActivity.title} onChange={e => setNewActivity(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Type</Label>
                <Select value={newActivity.type} onValueChange={v => setNewActivity(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Description</Label>
                <Textarea placeholder="Activity description..." className="min-h-[80px] text-sm" value={newActivity.description || ''} onChange={e => setNewActivity(prev => ({ ...prev, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Date</Label>
                  <Input type="date" className="h-9 text-sm" value={newActivity.date} onChange={e => setNewActivity(prev => ({ ...prev, date: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Start</Label>
                    <Input type="time" className="h-9 text-sm" value={newActivity.startTime || ''} onChange={e => setNewActivity(prev => ({ ...prev, startTime: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">End</Label>
                    <Input type="time" className="h-9 text-sm" value={newActivity.endTime || ''} onChange={e => setNewActivity(prev => ({ ...prev, endTime: e.target.value }))} />
                  </div>
                </div>
              </div>
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white" onClick={handleAddActivity} disabled={!newActivity.title}>
                <Plus className="h-4 w-4 mr-2" /> Add Activity
              </Button>
            </CardContent>
          </Card>

          {/* Activity Cards */}
          <div className="lg:col-span-2">
            {filteredActivities.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <Palette className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No activities planned</p>
                  <p className="text-sm">Create your first activity to get started.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredActivities.map((act, i) => {
                  const typeColors: Record<string, string> = {
                    Art: 'bg-amber-100 text-amber-700', Music: 'bg-purple-100 text-purple-700',
                    Dance: 'bg-pink-100 text-pink-700', Sports: 'bg-emerald-100 text-emerald-700',
                    Story: 'bg-blue-100 text-blue-700', Science: 'bg-teal-100 text-teal-700',
                    Celebration: 'bg-orange-100 text-orange-700', Other: 'bg-gray-100 text-gray-700',
                  };
                  return (
                    <Card key={act.id || i} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge className={`text-[10px] border-0 ${typeColors[act.type] || typeColors.Other}`}>
                            {act.type}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] ${
                            act.status === 'Completed' ? 'text-emerald-600 border-emerald-300' :
                            act.status === 'Scheduled' ? 'text-blue-600 border-blue-300' :
                            'text-amber-600 border-amber-300'
                          }`}>
                            {act.status || 'Planned'}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-sm mb-1">{act.title}</h3>
                        {act.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{act.description}</p>}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {act.date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(act.date)}</span>}
                          {act.startTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{act.startTime}{act.endTime ? `-${act.endTime}` : ''}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER: GROWTH
  // ============================================================
  const renderGrowth = () => {
    if (loading.growth && !growthData) {
      return <div className="space-y-6"><CardSkeleton /><CardSkeleton /></div>;
    }
    if (errors.growth) {
      return (
        <div className="p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-rose-400 mx-auto mb-3" />
          <p className="text-rose-600 mb-3">{errors.growth}</p>
          <Button variant="outline" onClick={fetchGrowth}><Zap className="h-4 w-4 mr-2" />Retry</Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Growth Tracking</h2>
            <p className="text-muted-foreground mt-1">Monitor student development across 6 dimensions</p>
          </div>
          <Select value={selectedGrowthStudent} onValueChange={setSelectedGrowthStudent}>
            <SelectTrigger className="h-9 w-[180px] text-sm"><SelectValue placeholder="Compare student" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Class Average Only</SelectItem>
              {growthData?.students?.filter(s => s.growthScore).map(s => (
                <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {selectedGrowthStudent
                  ? `${students.find(s => s.id === selectedGrowthStudent)?.firstName || 'Student'} vs Class Average`
                  : 'Class Growth Overview'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={growthRadarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Class Avg" dataKey="Class" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={2} />
                  {selectedGrowthStudent && (
                    <Radar name="Student" dataKey="Student" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={2} />
                  )}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Growth Entry Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Enter Growth Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Student</Label>
                  <Select value={growthEntry.studentId} onValueChange={v => setGrowthEntry(prev => ({ ...prev, studentId: v }))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {students.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Period</Label>
                  <Input placeholder="e.g., Q1 2025" className="h-9 text-sm" value={growthEntry.period} onChange={e => setGrowthEntry(prev => ({ ...prev, period: e.target.value }))} />
                </div>
              </div>
              {GROWTH_DIMENSIONS.map(d => (
                <div key={d} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{GROWTH_LABELS[d]}</Label>
                    <span className="text-xs font-medium">{growthEntry[d]}</span>
                  </div>
                  <Slider
                    value={[growthEntry[d]]}
                    max={100}
                    step={1}
                    onValueChange={v => setGrowthEntry(prev => ({ ...prev, [d]: v[0] }))}
                  />
                </div>
              ))}
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white" onClick={handleSaveGrowth} disabled={!growthEntry.studentId || !growthEntry.period}>
                <Target className="h-4 w-4 mr-2" /> Save Growth Score
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Needs Attention */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Needs Attention</CardTitle>
            </CardHeader>
            <CardContent>
              {growthData?.needsAttention && growthData.needsAttention.length > 0 ? (
                <div className="space-y-2">
                  {growthData.needsAttention.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <div>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs text-amber-600">Weak: {s.weakestArea}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-amber-600">{Math.round(s.overall)}</p>
                        <p className="text-[10px] text-amber-500">overall</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
                  <p className="text-sm">All students on track!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4 text-amber-500" /> Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              {growthData?.topPerformers && growthData.topPerformers.length > 0 ? (
                <div className="space-y-2">
                  {growthData.topPerformers.map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-200 text-emerald-700 text-xs font-bold">
                          {i + 1}
                        </span>
                        <p className="text-sm font-medium">{s.name}</p>
                      </div>
                      <p className="text-lg font-bold text-emerald-600">{Math.round(s.overall)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Star className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No growth data available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER: SCHEDULE & LEAVE
  // ============================================================
  const renderScheduleLeave = () => {
    const scheduleLoading = loading.schedule && schedule.length === 0;
    const leaveLoading = loading.leaves && leaves.length === 0;

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Schedule & Leave</h2>
          <p className="text-muted-foreground mt-1">View your weekly schedule and manage leave requests</p>
        </div>

        <Tabs defaultValue="schedule">
          <TabsList>
            <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
            <TabsTrigger value="leave">Leave Management</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-4 mt-4">
            {scheduleLoading ? (
              <CardSkeleton />
            ) : schedule.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Day</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Subject</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {schedule.map((slot, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium text-sm">{slot.day}</TableCell>
                            <TableCell className="text-sm">{slot.startTime} - {slot.endTime}</TableCell>
                            <TableCell className="text-sm">{slot.subject}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* Show default weekly schedule */
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {DAYS.map(day => (
                      <div key={day} className="p-3 rounded-lg border bg-muted/30">
                        <p className="font-medium text-sm mb-2">{day}</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            09:00 - 10:30 • Circle Time & Learning
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            10:30 - 11:00 • Snack & Play
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                            11:00 - 12:30 • Activity Time
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            12:30 - 01:30 • Lunch & Rest
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            01:30 - 03:00 • Free Play & Dismissal
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="leave" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Apply Leave */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Apply for Leave</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Leave Type</Label>
                    <Select value={newLeave.type} onValueChange={v => setNewLeave(prev => ({ ...prev, type: v }))}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LEAVE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Start Date</Label>
                      <Input type="date" className="h-9 text-sm" value={newLeave.startDate} onChange={e => setNewLeave(prev => ({ ...prev, startDate: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">End Date</Label>
                      <Input type="date" className="h-9 text-sm" value={newLeave.endDate} onChange={e => setNewLeave(prev => ({ ...prev, endDate: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Reason</Label>
                    <Textarea placeholder="Reason for leave..." className="min-h-[80px] text-sm" value={newLeave.reason} onChange={e => setNewLeave(prev => ({ ...prev, reason: e.target.value }))} />
                  </div>
                  <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white" onClick={handleApplyLeave} disabled={!newLeave.reason}>
                    <Send className="h-4 w-4 mr-2" /> Apply Leave
                  </Button>
                </CardContent>
              </Card>

              {/* Leave Balance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Leave Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  {leaveBalance.length > 0 ? (
                    <div className="space-y-3">
                      {leaveBalance.map((lb, i) => (
                        <div key={i} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{lb.type}</span>
                            <span className="text-muted-foreground">{lb.available}/{lb.total} left</span>
                          </div>
                          <Progress value={(lb.available / lb.total) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {LEAVE_TYPES.slice(0, 4).map(type => {
                        const defaults: Record<string, number> = { Casual: 12, Sick: 10, Earned: 15, CompOff: 2 };
                        return (
                          <div key={type} className="space-y-1.5">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{type}</span>
                              <span className="text-muted-foreground">{defaults[type] || 10}/{defaults[type] || 10} left</span>
                            </div>
                            <Progress value={100} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Leave History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Leave History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {leaveLoading ? (
                  <div className="p-4"><Skeleton className="h-40 w-full" /></div>
                ) : leaves.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Start</TableHead>
                          <TableHead>End</TableHead>
                          <TableHead>Days</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leaves.map((l, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium text-sm">{l.type}</TableCell>
                            <TableCell className="text-sm">{formatDate(l.startDate)}</TableCell>
                            <TableCell className="text-sm">{formatDate(l.endDate)}</TableCell>
                            <TableCell className="text-sm">{l.days || '—'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] ${
                                l.status === 'Approved' ? 'text-emerald-600 border-emerald-300' :
                                l.status === 'Rejected' ? 'text-rose-600 border-rose-300' :
                                'text-amber-600 border-amber-300'
                              }`}>
                                {l.status || 'Pending'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="p-12 text-center text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No leave history</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // ============================================================
  // RENDER: COMMUNICATION
  // ============================================================
  const renderCommunication = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Communication</h2>
          <p className="text-muted-foreground mt-1">Announcements and parent messages</p>
        </div>

        <Tabs defaultValue="announcements">
          <TabsList>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="chat">Parent Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="announcements" className="mt-4">
            {loading.communication ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
              </div>
            ) : announcements.length > 0 ? (
              <div className="space-y-3">
                {announcements.map((a) => (
                  <Card key={a.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm">{a.title}</h3>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ml-2 ${
                          a.priority === 'Urgent' ? 'text-rose-600 border-rose-300' :
                          a.priority === 'High' ? 'text-orange-600 border-orange-300' :
                          'text-amber-600 border-amber-300'
                        }`}>{a.priority}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{a.content}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[10px]">{a.type}</Badge>
                        {a.publishedAt && <span>{formatDate(a.publishedAt)}</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No announcements</p>
                  <p className="text-sm">School announcements will appear here.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="chat" className="mt-4">
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p className="font-medium">Parent Chat</p>
                <p className="text-sm mb-4">Direct messaging with parents will be available soon.</p>
                {students.length > 0 && (
                  <div className="max-w-md mx-auto text-left space-y-2">
                    <p className="text-xs font-medium text-center mb-3">Parent Contacts</p>
                    {students.slice(0, 5).map(s => s.parents?.[0] && (
                      <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{s.parents[0].firstName} {s.parents[0].lastName}</p>
                          <p className="text-xs text-muted-foreground">{s.firstName}&apos;s {s.parents[0].relation.toLowerCase()}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Phone className="h-3.5 w-3.5" /></Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // ============================================================
  // RENDER: SETTINGS
  // ============================================================
  const renderSettings = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground mt-1">Manage your profile and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xl">
                    {teacherName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{teacherName}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <Badge className="mt-1 bg-emerald-100 text-emerald-700 border-0 text-xs">Teacher</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Full Name</Label>
                <Input className="h-9 text-sm" value={profileForm.name} onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Phone</Label>
                <Input className="h-9 text-sm" placeholder="Enter phone number" value={profileForm.phone} onChange={e => setProfileForm(prev => ({ ...prev, phone: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Email</Label>
                <Input className="h-9 text-sm" value={profileForm.email} disabled />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Qualification</Label>
                <Input className="h-9 text-sm" placeholder="e.g., B.Ed, Montessori Certified" value={profileForm.qualification} onChange={e => setProfileForm(prev => ({ ...prev, qualification: e.target.value }))} />
              </div>
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                <Edit className="h-4 w-4 mr-2" /> Update Profile
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Current Password</Label>
                  <Input type="password" className="h-9 text-sm" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">New Password</Label>
                  <Input type="password" className="h-9 text-sm" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Confirm New Password</Label>
                  <Input type="password" className="h-9 text-sm" placeholder="••••••••" />
                </div>
                <Button variant="outline" className="w-full">
                  <Lock className="h-4 w-4 mr-2" /> Change Password
                </Button>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'attendance' as const, label: 'Attendance Reminders', desc: 'Get reminded to mark attendance' },
                  { key: 'dailyUpdates' as const, label: 'Daily Update Reminders', desc: 'Reminder to fill daily updates' },
                  { key: 'announcements' as const, label: 'Announcements', desc: 'School-wide announcements' },
                  { key: 'messages' as const, label: 'Parent Messages', desc: 'Messages from parents' },
                ].map(pref => (
                  <div key={pref.key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{pref.label}</p>
                      <p className="text-xs text-muted-foreground">{pref.desc}</p>
                    </div>
                    <Switch
                      checked={notifPrefs[pref.key]}
                      onCheckedChange={v => setNotifPrefs(prev => ({ ...prev, [pref.key]: v }))}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // SECTION RENDERER MAP
  // ============================================================
  const sectionRenderers: Record<Section, () => React.ReactNode> = {
    'dashboard': renderDashboard,
    'my-class': renderMyClass,
    'attendance': renderAttendance,
    'daily-updates': renderDailyUpdates,
    'observations': renderObservations,
    'activities': renderActivities,
    'growth': renderGrowth,
    'schedule-leave': renderScheduleLeave,
    'communication': renderCommunication,
    'settings': renderSettings,
  };

  // ============================================================
  // MAIN LAYOUT
  // ============================================================
  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className={`${sidebarCollapsed ? 'w-[68px]' : 'w-[260px]'} bg-[oklch(0.22_0.03_50)] text-[oklch(0.92_0.01_80)] flex-col transition-all duration-300 shrink-0 hidden lg:flex`}>
          {renderSidebarContent()}
        </aside>

        {/* Mobile Sidebar */}
        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent side="left" className="p-0 w-[260px] bg-[oklch(0.22_0.03_50)] text-[oklch(0.92_0.01_80)] border-0">
            {renderSidebarContent()}
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b px-4 sm:px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setMobileSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <Home className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <span className="text-sm text-muted-foreground hidden sm:inline">/</span>
              <span className="text-sm font-medium">{sectionLabel}</span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Content Area */}
          <div className="p-4 sm:p-6 max-w-[1400px]">
            {sectionRenderers[activeSection]?.()}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
