'use client';

import React, { Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  TrendingUp,
  AlertTriangle,
  Star,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
  Save,
  Users,
  BarChart3,
  Eye,
  ClipboardEdit,
  Search,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { toast } from 'sonner';
import { PORTAL_THEMES, GROWTH_COLORS, CHART_PALETTE } from '@/lib/theme-tokens';
const theme = PORTAL_THEMES.teacher;

// ── Types ──
interface DimensionScore {
  creativity: number;
  communication: number;
  social: number;
  confidence: number;
  cognitive: number;
  physical: number;
  overall: number;
}

interface StudentScore {
  studentId: string;
  studentName: string;
  studentPhoto: string | null;
  rollNumber: string | null;
  period: string | null;
  scores: DimensionScore | null;
  comments: string | null;
  updatedAt: string | null;
}

interface AttentionItem {
  studentId: string;
  studentName: string;
  dimension: string;
  score: number;
}

interface TopPerformer {
  studentId: string;
  studentName: string;
  overall: number;
  topDimension: string;
  topScore: number;
}

interface ClassData {
  period: string | null;
  classAverage: DimensionScore | null;
  students: StudentScore[];
  needsAttention: AttentionItem[];
  topPerformers: TopPerformer[];
  classId: string | null;
  className: string | null;
  totalStudents: number;
  assessedCount: number;
}

interface StudentDetail {
  student: {
    id: string;
    name: string;
    photo: string | null;
    rollNumber: string | null;
  };
  className: string;
  currentPeriod: {
    period: string;
    creativity: number;
    communication: number;
    social: number;
    confidence: number;
    cognitive: number;
    physical: number;
    overall: number;
    comments: string | null;
  } | null;
  trend: {
    period: string;
    overall: number;
    creativity: number;
    communication: number;
    social: number;
    confidence: number;
    cognitive: number;
    physical: number;
    comments: string | null;
    updatedAt: string;
  }[];
  classAverage: Omit<DimensionScore, 'overall'> & { overall: number } | null;
}

// ── Dimension Config ──
const DIMENSIONS = [
  { key: 'creativity', label: 'Creativity', color: GROWTH_COLORS.creativity.hex, bg: GROWTH_COLORS.creativity.bg, text: GROWTH_COLORS.creativity.text, icon: '🎨' },
  { key: 'communication', label: 'Communication', color: GROWTH_COLORS.communication.hex, bg: GROWTH_COLORS.communication.bg, text: GROWTH_COLORS.communication.text, icon: '💬' },
  { key: 'social', label: 'Social Skills', color: GROWTH_COLORS.social.hex, bg: GROWTH_COLORS.social.bg, text: GROWTH_COLORS.social.text, icon: '🤝' },
  { key: 'confidence', label: 'Confidence', color: GROWTH_COLORS.physical.hex, bg: GROWTH_COLORS.physical.bg, text: GROWTH_COLORS.physical.text, icon: '💪' },
  { key: 'cognitive', label: 'Cognitive', color: GROWTH_COLORS.cognitive.hex, bg: GROWTH_COLORS.cognitive.bg, text: GROWTH_COLORS.cognitive.text, icon: '🧠' },
  { key: 'physical', label: 'Physical', color: GROWTH_COLORS.emotional.hex, bg: GROWTH_COLORS.emotional.bg, text: GROWTH_COLORS.emotional.text, icon: '🏃' },
] as const;

type DimensionKey = (typeof DIMENSIONS)[number]['key'];

const PERIODS = [
  { value: 'Q1', label: 'Q1 (Jan-Mar)' },
  { value: 'Q2', label: 'Q2 (Apr-Jun)' },
  { value: 'Q3', label: 'Q3 (Jul-Sep)' },
  { value: 'Q4', label: 'Q4 (Oct-Dec)' },
  { value: 'Annual', label: 'Annual' },
];

// ── Helpers ──
function getInitials(name: string): string {
  return name.split(' ').map((n) => n.charAt(0)).join('').toUpperCase().slice(0, 2);
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

function getScoreTextColor(score: number): string {
  if (score >= 70) return 'text-emerald-700';
  if (score >= 40) return 'text-amber-700';
  return 'text-red-700';
}

function getScoreBgColor(score: number): string {
  if (score >= 70) return 'bg-emerald-50';
  if (score >= 40) return 'bg-amber-50';
  return 'bg-red-50';
}

function getRating(score: number): { label: string; color: string; bg: string } {
  if (score >= 90) return { label: 'Excellent', color: 'text-emerald-700', bg: 'bg-emerald-100' };
  if (score >= 70) return { label: 'Good', color: 'text-blue-700', bg: 'bg-blue-100' };
  if (score >= 40) return { label: 'Average', color: 'text-amber-700', bg: 'bg-amber-100' };
  return { label: 'Needs Attention', color: 'text-red-700', bg: 'bg-red-100' };
}

function getOverallLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 40) return 'Average';
  return 'Needs Attention';
}

function getCurrentPeriod(): string {
  const month = new Date().getMonth(); // 0-indexed
  if (month <= 2) return 'Q1';
  if (month <= 5) return 'Q2';
  if (month <= 8) return 'Q3';
  return 'Q4';
}

/**
 * GrowthContent — Inner component that uses useSearchParams
 */
function GrowthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── State ──
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ClassData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(getCurrentPeriod());
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Score entry state
  const [entryStudentId, setEntryStudentId] = useState<string | null>(null);
  const [entryStudentName, setEntryStudentName] = useState('');
  const [entryScores, setEntryScores] = useState<Record<DimensionKey, number>>({
    creativity: 0, communication: 0, social: 0, confidence: 0, cognitive: 0, physical: 0,
  });
  const [entryComments, setEntryComments] = useState('');
  const [saving, setSaving] = useState(false);

  // Bulk entry state
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkScores, setBulkScores] = useState<Record<string, Record<DimensionKey, number>>>({});
  const [savingBulk, setSavingBulk] = useState(false);

  // Detail dialog
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<StudentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // ── Fetch class growth data ──
  const fetchClassData = useCallback(async () => {
    const token = localStorage.getItem('preone_token');
    if (!token) { router.push('/login'); return; }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/teacher/growth?period=${selectedPeriod}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to load growth data');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [router, selectedPeriod]);

  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

  // ── Fetch student detail ──
  const fetchStudentDetail = useCallback(async (studentId: string) => {
    const token = localStorage.getItem('preone_token');
    if (!token) return;

    try {
      setDetailLoading(true);
      const res = await fetch(`/api/teacher/growth/student/${studentId}?period=${selectedPeriod}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load student detail');
      const json = await res.json();
      setDetailData(json);
    } catch {
      toast.error('Failed to load student detail');
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  }, [selectedPeriod]);

  // ── Open score entry for a student ──
  const openScoreEntry = (student: StudentScore) => {
    setEntryStudentId(student.studentId);
    setEntryStudentName(student.studentName);
    setEntryScores(
      student.scores
        ? {
            creativity: student.scores.creativity,
            communication: student.scores.communication,
            social: student.scores.social,
            confidence: student.scores.confidence,
            cognitive: student.scores.cognitive,
            physical: student.scores.physical,
          }
        : { creativity: 0, communication: 0, social: 0, confidence: 0, cognitive: 0, physical: 0 }
    );
    setEntryComments(student.comments || '');
    setActiveTab('entry');
  };

  // ── Save single student scores ──
  const handleSaveSingle = async () => {
    const token = localStorage.getItem('preone_token');
    if (!token || !entryStudentId) return;

    try {
      setSaving(true);
      const res = await fetch('/api/teacher/growth', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: entryStudentId,
          period: selectedPeriod,
          ...entryScores,
          comments: entryComments || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      toast.success(`Growth scores saved for ${entryStudentName}`);
      setEntryStudentId(null);
      setEntryStudentName('');
      setActiveTab('overview');
      await fetchClassData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save scores');
    } finally {
      setSaving(false);
    }
  };

  // ── Initiate bulk entry ──
  const startBulkEntry = () => {
    if (!data) return;
    const initial: Record<string, Record<DimensionKey, number>> = {};
    data.students.forEach((s) => {
      initial[s.studentId] = s.scores
        ? {
            creativity: s.scores.creativity,
            communication: s.scores.communication,
            social: s.scores.social,
            confidence: s.scores.confidence,
            cognitive: s.scores.cognitive,
            physical: s.scores.physical,
          }
        : { creativity: 0, communication: 0, social: 0, confidence: 0, cognitive: 0, physical: 0 };
    });
    setBulkScores(initial);
    setBulkMode(true);
    setActiveTab('entry');
  };

  // ── Save bulk scores ──
  const handleSaveBulk = async () => {
    const token = localStorage.getItem('preone_token');
    if (!token || !data) return;

    try {
      setSavingBulk(true);
      const scores = Object.entries(bulkScores).map(([studentId, dims]) => ({
        studentId,
        period: selectedPeriod,
        ...dims,
      }));

      const res = await fetch('/api/teacher/growth/scores', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scores }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      toast.success(`Growth scores saved for ${scores.length} students`);
      setBulkMode(false);
      setBulkScores({});
      setActiveTab('overview');
      await fetchClassData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save scores');
    } finally {
      setSavingBulk(false);
    }
  };

  // ── Open detail dialog ──
  const openDetail = (studentId: string) => {
    setDetailStudentId(studentId);
    fetchStudentDetail(studentId);
  };

  // ── Computed: filtered students ──
  const filteredStudents = useMemo(() => {
    if (!data) return [];
    if (!searchQuery) return data.students;
    const q = searchQuery.toLowerCase();
    return data.students.filter(
      (s) =>
        s.studentName.toLowerCase().includes(q) ||
        (s.rollNumber && s.rollNumber.toLowerCase().includes(q))
    );
  }, [data, searchQuery]);

  // ── Computed: radar chart data ──
  const radarData = useMemo(() => {
    if (!data?.classAverage) return [];
    return DIMENSIONS.map((dim) => ({
      dimension: dim.label,
      classAverage: data.classAverage![dim.key],
      fullMark: 100,
    }));
  }, [data]);

  // ── Computed: entry overall ──
  const entryOverall = useMemo(() => {
    const vals = Object.values(entryScores);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [entryScores]);

  // ── Loading state ──
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Growth Data</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button
          onClick={fetchClassData}
          className="bg-portal-600 hover:bg-portal-700 rounded-xl"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-portal-500" />
                Growth Assessment
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {data?.className || 'Class'} | {data?.assessedCount || 0}/{data?.totalStudents || 0} Assessed
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[160px] h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="bg-portal-600 hover:bg-portal-700 rounded-xl text-sm"
                onClick={startBulkEntry}
              >
                <ClipboardEdit className="h-4 w-4 mr-1" /> Bulk Entry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Main Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg text-xs">
            <BarChart3 className="h-3.5 w-3.5 mr-1" /> Class Overview
          </TabsTrigger>
          <TabsTrigger value="entry" className="rounded-lg text-xs">
            <ClipboardEdit className="h-3.5 w-3.5 mr-1" /> Score Entry
          </TabsTrigger>
        </TabsList>

        {/* ────────────────────────────────────────────────────────────
            CLASS OVERVIEW TAB
        ──────────────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          {/* Radar Chart + Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-portal-600" />
                  Class Growth Radar — {selectedPeriod}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                      <PolarGrid stroke={CHART_PALETTE.grid} />
                      <PolarAngleAxis
                        dataKey="dimension"
                        tick={{ fontSize: 11, fill: CHART_PALETTE.axis }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fontSize: 9, fill: CHART_PALETTE.axisLight }}
                      />
                      <Radar
                        name="Class Average"
                        dataKey="classAverage"
                        stroke={CHART_PALETTE.series[2]}
                        fill={CHART_PALETTE.series[2]}
                        fillOpacity={0.25}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                    No assessment data available for {selectedPeriod}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary Stats */}
            <div className="space-y-4">
              {/* Class Average Card */}
              {data?.classAverage && (
                <Card className="border-0 shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4 text-portal-600" />
                      Class Average — {selectedPeriod}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-3xl font-bold text-portal-600">
                        {Math.round(data.classAverage.overall)}
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Overall Score</div>
                        <Badge className={`${getRating(data.classAverage.overall).bg} ${getRating(data.classAverage.overall).color} border-0 text-xs px-2 py-0.5`}>
                          {getRating(data.classAverage.overall).label}
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {DIMENSIONS.map((dim) => {
                        const val = data.classAverage![dim.key];
                        return (
                          <div key={dim.key} className="text-center">
                            <div className="text-xs text-gray-500 mb-0.5">{dim.icon} {dim.label.split(' ')[0]}</div>
                            <div className={`text-sm font-bold ${getScoreTextColor(val)}`}>{Math.round(val)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Needs Attention */}
              {data?.needsAttention && data.needsAttention.length > 0 && (
                <Card className="border-0 shadow-md border-l-4 border-l-red-400">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-4 w-4" />
                      Needs Attention ({data.needsAttention.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.needsAttention.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex items-center justify-between bg-red-50 p-2.5 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-xs font-semibold text-red-700">
                              {getInitials(item.studentName)}
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-900">{item.studentName}</div>
                              <div className="text-[10px] text-gray-500">{item.dimension}: <span className="text-red-600 font-semibold">{item.score}/100</span></div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-[10px] h-7 rounded-lg text-red-700 hover:bg-red-100"
                            onClick={() => {
                              const student = data.students.find(s => s.studentId === item.studentId);
                              if (student) openScoreEntry(student);
                            }}
                          >
                            Update
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Performers */}
              {data?.topPerformers && data.topPerformers.length > 0 && (
                <Card className="border-0 shadow-md border-l-4 border-l-portal-400">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-portal-700">
                      <Star className="h-4 w-4" />
                      Top Performers ({data.topPerformers.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.topPerformers.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex items-center justify-between bg-portal-50 p-2.5 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-portal-100 flex items-center justify-center text-xs font-semibold text-portal-700">
                              {getInitials(item.studentName)}
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-900">{item.studentName}</div>
                              <div className="text-[10px] text-gray-500">
                                {item.topDimension}: <span className="text-portal-600 font-semibold">{item.topScore}/100</span>
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-portal-100 text-portal-700 border-0 text-[10px] px-2 py-0.5">
                            {Math.round(item.overall)} Overall
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search student..."
              className="pl-8 h-8 text-xs rounded-xl"
            />
          </div>

          {/* Student Score Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredStudents.map((student) => (
              <Card key={student.studentId} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  {/* Student header */}
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-9 w-9">
                      {student.studentPhoto ? (
                        <AvatarImage src={student.studentPhoto} alt={student.studentName} />
                      ) : (
                        <AvatarFallback className={`${theme.avatarFallbackClass} text-xs font-semibold`}>
                          {getInitials(student.studentName)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{student.studentName}</div>
                      <div className="text-[10px] text-gray-500">
                        {student.rollNumber ? `Roll: ${student.rollNumber}` : 'No roll number'}
                        {student.period && ` | ${student.period}`}
                      </div>
                    </div>
                  </div>

                  {student.scores ? (
                    <>
                      {/* Overall score */}
                      <div className="flex items-center gap-3 mb-3 p-2.5 bg-gray-50 rounded-lg">
                        <div className={`text-xl font-bold ${getScoreTextColor(student.scores.overall)}`}>
                          {Math.round(student.scores.overall)}
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-600 mb-1">Overall: {Math.round(student.scores.overall)}/100</div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${getScoreColor(student.scores.overall)}`}
                              style={{ width: `${student.scores.overall}%` }}
                            />
                          </div>
                        </div>
                        <Badge className={`${getRating(student.scores.overall).bg} ${getRating(student.scores.overall).color} border-0 text-[10px] px-2 py-0.5`}>
                          {getOverallLabel(student.scores.overall)}
                        </Badge>
                      </div>

                      {/* Dimension bars */}
                      <div className="space-y-1.5 mb-3">
                        {DIMENSIONS.map((dim) => {
                          const val = student.scores![dim.key];
                          return (
                            <div key={dim.key} className="flex items-center gap-2 text-xs">
                              <span className="w-[70px] text-gray-600 truncate">{dim.label.split(' ')[0]}</span>
                              <span className={`w-7 text-right font-semibold ${getScoreTextColor(val)}`}>{val}</span>
                              <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full transition-all"
                                  style={{ width: `${val}%`, backgroundColor: dim.color }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 text-gray-400 text-xs">
                      No scores for {selectedPeriod}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
              className={`flex-1 h-7 text-[11px] rounded-lg ${theme.selectedClass} border-portal-200 hover:bg-portal-50`}
                      onClick={() => openScoreEntry(student)}
                    >
                      <ClipboardEdit className="h-3 w-3 mr-1" />
                      {student.scores ? 'Update Scores' : 'Add Scores'}
                    </Button>
                    {student.scores && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-[11px] rounded-lg border-blue-200 text-blue-700 hover:bg-blue-50"
                        onClick={() => openDetail(student.studentId)}
                      >
                        <Eye className="h-3 w-3 mr-1" /> Detail
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredStudents.length === 0 && (
            <Card className="border-0 shadow-md">
              <CardContent className="py-12 text-center">
                <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-gray-900 mb-1">No Students Found</h3>
                <p className="text-xs text-gray-500">Try adjusting your search query</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ────────────────────────────────────────────────────────────
            SCORE ENTRY TAB
        ──────────────────────────────────────────────────────────── */}
        <TabsContent value="entry" className="space-y-6 mt-4">
          {bulkMode ? (
            /* ── BULK ENTRY MODE ── */
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-portal-600" />
                  Bulk Score Entry — {selectedPeriod}
                </CardTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Adjust scores for all students using the sliders. Click Save All when done.
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-medium text-gray-600 sticky left-0 bg-white min-w-[120px]">Student</th>
                        {DIMENSIONS.map((dim) => (
                          <th key={dim.key} className="text-center py-2 px-2 font-medium text-gray-600 min-w-[130px]">
                            {dim.icon} {dim.label.split(' ')[0]}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data?.students.map((student) => {
                        const scores = bulkScores[student.studentId];
                        if (!scores) return null;
                        return (
                          <tr key={student.studentId} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="py-2 px-2 sticky left-0 bg-white">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-portal-50 flex items-center justify-center text-[9px] font-semibold text-portal-700 shrink-0">
                                  {getInitials(student.studentName)}
                                </div>
                                <span className="font-medium text-gray-900 truncate max-w-[90px]">{student.studentName}</span>
                              </div>
                            </td>
                            {DIMENSIONS.map((dim) => (
                              <td key={dim.key} className="py-2 px-2">
                                <div className="flex items-center gap-2">
                                  <Slider
                                    value={[scores[dim.key]]}
                                    min={0}
                                    max={100}
                                    step={1}
                                    className="flex-1"
                                    onValueChange={(val) => {
                                      setBulkScores((prev) => ({
                                        ...prev,
                                        [student.studentId]: {
                                          ...prev[student.studentId],
                                          [dim.key]: val[0],
                                        },
                                      }));
                                    }}
                                  />
                                  <span className={`w-6 text-right font-mono font-semibold ${getScoreTextColor(scores[dim.key])}`}>
                                    {scores[dim.key]}
                                  </span>
                                </div>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      setBulkMode(false);
                      setBulkScores({});
                      setActiveTab('overview');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-portal-600 hover:bg-portal-700 rounded-xl"
                    onClick={handleSaveBulk}
                    disabled={savingBulk}
                  >
                    {savingBulk ? (
                      <>Saving...</>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1" /> Save All ({data?.students.length} Students)
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : entryStudentId ? (
            /* ── SINGLE STUDENT ENTRY ── */
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardEdit className="h-5 w-5 text-portal-600" />
                      Growth Assessment — {entryStudentName}
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-1">
                      Period: {PERIODS.find(p => p.value === selectedPeriod)?.label || selectedPeriod}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs rounded-xl text-gray-500"
                    onClick={() => {
                      setEntryStudentId(null);
                      setActiveTab('overview');
                    }}
                  >
                    <X className="h-4 w-4" /> Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-5 max-w-xl">
                  {DIMENSIONS.map((dim) => {
                    const val = entryScores[dim.key];
                    return (
                      <div key={dim.key} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium flex items-center gap-1.5">
                            <span className={`inline-block w-2 h-2 rounded-full`} style={{ backgroundColor: dim.color }} />
                            {dim.icon} {dim.label}
                          </Label>
                          <span className={`text-sm font-bold font-mono ${getScoreTextColor(val)}`}>
                            {val}/100
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Slider
                            value={[val]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={(v) =>
                              setEntryScores((prev) => ({ ...prev, [dim.key]: v[0] }))
                            }
                            className="flex-1"
                          />
                          <Badge className={`${getRating(val).bg} ${getRating(val).color} border-0 text-[10px] px-2 py-0.5 min-w-[70px] justify-center`}>
                            {getRating(val).label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}

                  {/* Overall */}
                  <div className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-gray-700">Overall Score</div>
                      <div className="text-[10px] text-gray-500">Auto-calculated average of 6 dimensions</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${getScoreTextColor(entryOverall)}`}>{entryOverall}</span>
                      <Badge className={`${getRating(entryOverall).bg} ${getRating(entryOverall).color} border-0 text-xs px-2.5 py-1`}>
                        {getRating(entryOverall).label}
                      </Badge>
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Comments</Label>
                    <Textarea
                      value={entryComments}
                      onChange={(e) => setEntryComments(e.target.value)}
                      placeholder="Add notes about the student's growth..."
                      className="min-h-[80px] rounded-xl text-sm resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => {
                        setEntryStudentId(null);
                        setActiveTab('overview');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-portal-600 hover:bg-portal-700 rounded-xl"
                      onClick={handleSaveSingle}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : <><Save className="h-4 w-4 mr-1" /> Save Scores</>}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* ── NO STUDENT SELECTED ── */
            <Card className="border-0 shadow-md">
              <CardContent className="py-16 text-center">
                <ClipboardEdit className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-gray-900 mb-1">No Student Selected</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Go to Class Overview and click &quot;Update Scores&quot; on a student card, or use Bulk Entry
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    className="rounded-xl text-xs"
                    onClick={() => setActiveTab('overview')}
                  >
                    Go to Overview
                  </Button>
                  <Button
                    className="bg-portal-600 hover:bg-portal-700 rounded-xl text-xs"
                    onClick={startBulkEntry}
                  >
                    <Users className="h-3.5 w-3.5 mr-1" /> Bulk Entry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ────────────────────────────────────────────────────────────
          STUDENT DETAIL DIALOG
      ──────────────────────────────────────────────────────────── */}
      <Dialog open={!!detailStudentId} onOpenChange={(open) => { if (!open) setDetailStudentId(null); }}>
        <DialogContent className="sm:max-w-4xl rounded-2xl max-h-[90vh] overflow-y-auto">
          {detailLoading ? (
            <div className="space-y-4 py-8">
              <Skeleton className="h-6 w-48 rounded-lg" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Skeleton className="h-72 rounded-lg" />
                <Skeleton className="h-72 rounded-lg" />
              </div>
              <Skeleton className="h-40 rounded-lg" />
            </div>
          ) : detailData ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-5 w-5 text-portal-600" />
                  {detailData.student.name} — Growth Detail
                </DialogTitle>
                <DialogDescription>
                  {detailData.className} | {detailData.currentPeriod?.period || 'No assessment'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-2">
                {/* Radar: Student vs Class Average */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-1">
                      <CardTitle className="text-xs font-semibold">Student vs Class Average</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {detailData.currentPeriod && detailData.classAverage ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <RadarChart
                            data={DIMENSIONS.map((dim) => ({
                              dimension: dim.label.split(' ')[0],
                              student: detailData.currentPeriod![dim.key],
                              classAverage: detailData.classAverage![dim.key],
                              fullMark: 100,
                            }))}
                            cx="50%"
                            cy="50%"
                            outerRadius="70%"
                          >
                            <PolarGrid stroke={CHART_PALETTE.grid} />
                            <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 10, fill: CHART_PALETTE.axis }} />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 8, fill: CHART_PALETTE.axisLight }} />
                            <Radar name="Student" dataKey="student" stroke={GROWTH_COLORS.social?.hex || CHART_PALETTE.series[2]} fill={GROWTH_COLORS.social?.hex || CHART_PALETTE.series[2]} fillOpacity={0.3} strokeWidth={2} />
                            <Radar name="Class Avg" dataKey="classAverage" stroke={CHART_PALETTE.series[1]} fill={CHART_PALETTE.series[1]} fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="5 5" />
                            <Legend wrapperStyle={{ fontSize: 10 }} />
                          </RadarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-48 text-gray-400 text-xs">
                          Insufficient data for comparison
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Trend Line Chart */}
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-1">
                      <CardTitle className="text-xs font-semibold">Growth Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {detailData.trend.length > 1 ? (
                        <ResponsiveContainer width="100%" height={280}>
                          <LineChart data={detailData.trend}>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_PALETTE.gridLight} />
                            <XAxis dataKey="period" tick={{ fontSize: 10, fill: CHART_PALETTE.axis }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: CHART_PALETTE.axisLight }} />
                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                            {DIMENSIONS.map((dim) => (
                              <Line
                                key={dim.key}
                                type="monotone"
                                dataKey={dim.key}
                                name={dim.label}
                                stroke={dim.color}
                                strokeWidth={2}
                                dot={{ r: 3 }}
                                activeDot={{ r: 5 }}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-48 text-gray-400 text-xs">
                          Need at least 2 periods of data for trend
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Score Breakdown Table */}
                {detailData.currentPeriod && detailData.classAverage && (
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-1">
                      <CardTitle className="text-xs font-semibold">Score Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 font-medium text-gray-600">Dimension</th>
                              <th className="text-center py-2 px-3 font-medium text-gray-600">Score</th>
                              <th className="text-center py-2 px-3 font-medium text-gray-600">Class Avg</th>
                              <th className="text-center py-2 px-3 font-medium text-gray-600">Difference</th>
                              <th className="text-center py-2 px-3 font-medium text-gray-600">Rating</th>
                            </tr>
                          </thead>
                          <tbody>
                            {DIMENSIONS.map((dim) => {
                              const score = detailData.currentPeriod![dim.key];
                              const avg = detailData.classAverage![dim.key];
                              const diff = score - Math.round(avg);
                              const rating = getRating(score);
                              return (
                                <tr key={dim.key} className="border-b border-gray-50 hover:bg-gray-50/50">
                                  <td className="py-2 px-3 font-medium">
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: dim.color }} />
                                      {dim.label}
                                    </span>
                                  </td>
                                  <td className="text-center py-2 px-3 font-semibold">{score}</td>
                                  <td className="text-center py-2 px-3 text-gray-500">{Math.round(avg)}</td>
                                  <td className="text-center py-2 px-3">
                                    <span className={`inline-flex items-center gap-0.5 font-medium ${diff > 0 ? 'text-portal-600' : diff < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                      {diff > 0 ? <ArrowUpRight className="h-3 w-3" /> : diff < 0 ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                                      {diff > 0 ? '+' : ''}{diff}
                                    </span>
                                  </td>
                                  <td className="text-center py-2 px-3">
                                    <Badge className={`${rating.bg} ${rating.color} border-0 text-[10px] px-2 py-0.5`}>
                                      {rating.label}
                                    </Badge>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Comments */}
                      {detailData.currentPeriod.comments && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="text-[10px] font-medium text-gray-500 mb-1">Teacher Comments</div>
                          <p className="text-xs text-gray-700">{detailData.currentPeriod.comments}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setDetailStudentId(null)}
                >
                  Close
                </Button>
                {detailData.currentPeriod && (
                  <Button
                    className="bg-portal-600 hover:bg-portal-700 rounded-xl"
                    onClick={() => {
                      setDetailStudentId(null);
                      const student = data?.students.find(s => s.studentId === detailData.student.id);
                      if (student) openScoreEntry(student);
                    }}
                  >
                    <ClipboardEdit className="h-3.5 w-3.5 mr-1" /> Update Scores
                  </Button>
                )}
              </DialogFooter>
            </>
          ) : (
            <div className="py-12 text-center text-gray-400 text-sm">
              No data available
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Page export with Suspense boundary ──
export default function GrowthPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-10 w-full rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </div>
      }
    >
      <GrowthContent />
    </Suspense>
  );
}
