'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  Heart,
  Droplets,
  TrendingUp,
  Calendar,
  FileText,
  Sun,
  Eye,
  ShieldCheck,
  Syringe,
  Stethoscope,
  Utensils,
  Moon,
  Smile,
  Coffee,
  Cookie,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import { PORTAL_THEMES, ATTENDANCE_COLORS, GROWTH_COLORS, MOOD_COLORS, MEAL_COLORS, CHART_PALETTE } from '@/lib/theme-tokens';
const theme = PORTAL_THEMES.teacher;

// ── Types ──
interface GrowthScoreDetail {
  id: string;
  period: string;
  creativity: number;
  communication: number;
  social: number;
  confidence: number;
  cognitive: number;
  physical: number;
  overall: number | null;
  comments: string | null;
  assessedBy: string | null;
  createdAt: string;
}

interface ParentDetail {
  isPrimary: boolean;
  parent: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    occupation: string | null;
    address: string | null;
    relation: string;
    isEmergencyContact: boolean;
  };
}

interface MedicalRecordDetail {
  id: string;
  allergies: string | null;
  conditions: string | null;
  medications: string | null;
  vaccinationStatus: string | null;
  doctorName: string | null;
  doctorPhone: string | null;
  notes: string | null;
}

interface AttendanceRecord {
  date: string;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
}

interface DailyUpdateDetail {
  id: string;
  date: string;
  breakfast: string | null;
  breakfastMenu: string | null;
  lunch: string | null;
  lunchMenu: string | null;
  snacks: string | null;
  snacksMenu: string | null;
  sleepStart: string | null;
  sleepEnd: string | null;
  sleepQuality: string | null;
  moodMorning: string | null;
  moodAfternoon: string | null;
  waterGlasses: number;
  highlights: string | null;
  status: string;
}

interface StudentDetail {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  bloodGroup: string | null;
  aadhaarNumber: string | null;
  photo: string | null;
  rollNumber: string | null;
  admissionDate: string;
  status: string;
  class: { id: string; name: string; program: { id: string; name: string } };
  parents: ParentDetail[];
  medicalRecords: MedicalRecordDetail[];
  medicalAlerts: boolean;
  growthScores: GrowthScoreDetail[];
  attendance: {
    thisMonth: { present: number; absent: number; late: number; rate: number };
    records: AttendanceRecord[];
  };
  recentDailyUpdates: DailyUpdateDetail[];
}

// ── Helpers ──
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function calculateAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) { years--; months += 12; }
  return `${years} years ${months} months`;
}

function maskAadhaar(aadhaar: string | null): string {
  if (!aadhaar) return 'N/A';
  if (aadhaar.length <= 8) return aadhaar;
  return `${aadhaar.slice(0, 4)}****${aadhaar.slice(-4)}`;
}

function getGrowthColor(score: number): string {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-red-600';
}

function getGrowthBarColor(score: number): string {
  if (score >= 70) return '[&>div]:bg-emerald-500';
  if (score >= 40) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-red-500';
}

function getGrowthLabel(score: number): string {
  if (score >= 80) return 'A+';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

// Attendance calendar color
function getAttendanceColor(status: string): string {
  const upper = status.toUpperCase();
  if (upper === 'PRESENT') return ATTENDANCE_COLORS.PRESENT?.dot || 'bg-emerald-500';
  if (upper === 'ABSENT') return ATTENDANCE_COLORS.ABSENT?.dot || 'bg-red-500';
  if (upper === 'LATE') return ATTENDANCE_COLORS.LATE?.dot || 'bg-amber-500';
  return 'bg-gray-200';
}

// Mood icon
function getMoodEmoji(mood: string | null): string {
  if (!mood) return '';
  const m = mood.toUpperCase();
  if (MOOD_COLORS[m]) return MOOD_COLORS[m].emoji;
  const lower = mood.toLowerCase();
  if (lower.includes('happy') || lower.includes('great')) return MOOD_COLORS.HAPPY.emoji;
  if (lower.includes('sad') || lower.includes('upset')) return MOOD_COLORS.SAD.emoji;
  if (lower.includes('tired') || lower.includes('sleepy')) return '😴';
  if (lower.includes('excited') || lower.includes('energetic')) return MOOD_COLORS.EXCITED.emoji;
  if (lower.includes('calm') || lower.includes('quiet')) return MOOD_COLORS.CALM.emoji;
  if (lower.includes('angry') || lower.includes('cranky')) return '😤';
  return MOOD_COLORS.HAPPY.emoji;
}

/**
 * StudentProfilePage — Detailed student profile with tabs.
 */
export default function StudentProfilePage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.studentId as string;

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('latest');

  // ── Fetch data ──
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('preone_token');
      if (!token) { router.push('/login'); return; }

      try {
        setLoading(true);
        const res = await fetch(`/api/teacher/students/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load student data');
        const json = await res.json();
        setStudent(json.student);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId, router]);

  // ── Loading state ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-8 w-48 rounded-xl" />
        </div>
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  // ── Error state ──
  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Student Not Found</h3>
        <p className="text-gray-500 mb-4">{error || 'Could not load student details.'}</p>
        <Button
          onClick={() => router.push('/teacher/my-class')}
          className={`bg-gradient-to-r ${theme.btnGradientClass} text-white rounded-xl`}
        >
          Back to My Class
        </Button>
      </div>
    );
  }

  const initials = `${student.firstName.charAt(0)}${student.lastName.charAt(0)}`.toUpperCase();

  // ── Growth data for radar chart ──
  const activeGrowth = selectedPeriod === 'latest'
    ? student.growthScores[0]
    : student.growthScores.find((g) => g.period === selectedPeriod) || student.growthScores[0];

  const radarData = activeGrowth
    ? [
        { dimension: 'Creativity', value: activeGrowth.creativity, fullMark: 100 },
        { dimension: 'Communication', value: activeGrowth.communication, fullMark: 100 },
        { dimension: 'Social', value: activeGrowth.social, fullMark: 100 },
        { dimension: 'Confidence', value: activeGrowth.confidence, fullMark: 100 },
        { dimension: 'Cognitive', value: activeGrowth.cognitive, fullMark: 100 },
        { dimension: 'Physical', value: activeGrowth.physical, fullMark: 100 },
      ]
    : [];

  const growthDimensions = activeGrowth
    ? [
        { label: 'Creativity', value: activeGrowth.creativity },
        { label: 'Communication', value: activeGrowth.communication },
        { label: 'Social Skills', value: activeGrowth.social },
        { label: 'Confidence', value: activeGrowth.confidence },
        { label: 'Cognitive', value: activeGrowth.cognitive },
        { label: 'Physical', value: activeGrowth.physical },
      ]
    : [];

  const overallScore = activeGrowth?.overall ?? 0;

  // ── Attendance calendar data ──
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  // Build a map of date -> status
  const attendanceMap = new Map<string, string>();
  student.attendance.records.forEach((r) => {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    attendanceMap.set(key, r.status);
  });

  // ── Primary parent ──
  const primaryParent = student.parents.find((p) => p.isPrimary)?.parent || student.parents[0]?.parent;

  return (
    <div className="space-y-6">
      {/* ── Back Button ── */}
      <Button
        variant="ghost"
        size="sm"
        className="text-gray-600 hover:text-gray-900 -ml-2 rounded-xl"
        onClick={() => router.push('/teacher/my-class')}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to My Class
      </Button>

      {/* ── Profile Header ── */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div
          className="h-24 bg-portal-gradient"
        />
        <CardContent className="relative -mt-12 px-6 pb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg">
              {student.photo ? (
                <AvatarImage src={student.photo} alt={student.firstName} />
              ) : (
                <AvatarFallback className={`${theme.avatarFallbackClass} text-2xl font-bold`}>
                  {initials}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">
                  {student.firstName} {student.lastName}
                </h1>
                <Badge
                  className={`w-fit rounded-md text-xs ${
                    student.status === 'ACTIVE'
                      ? `${theme.selectedClass} border-emerald-200`
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                >
                  {student.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {student.class.name} &middot; Roll No: {student.rollNumber || 'N/A'} &middot; {student.class.program.name}
              </p>
            </div>
            {primaryParent && (
              <Button
                variant="outline"
                size="sm"
                className={`border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-xl`}
                onClick={() => router.push(`/teacher/communication?parent=${primaryParent.id}`)}
              >
                <MessageCircle className="h-4 w-4 mr-1.5" />
                Contact Parent
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Tabs ── */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="bg-gray-100 p-1 rounded-xl h-auto flex-wrap">
          <TabsTrigger value="personal" className="rounded-lg text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <FileText className="h-3.5 w-3.5 mr-1.5" /> Personal
          </TabsTrigger>
          <TabsTrigger value="parents" className="rounded-lg text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Heart className="h-3.5 w-3.5 mr-1.5" /> Parents
          </TabsTrigger>
          <TabsTrigger value="growth" className="rounded-lg text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <TrendingUp className="h-3.5 w-3.5 mr-1.5" /> Growth
          </TabsTrigger>
          <TabsTrigger value="medical" className="rounded-lg text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Stethoscope className="h-3.5 w-3.5 mr-1.5" /> Medical
          </TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-lg text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Calendar className="h-3.5 w-3.5 mr-1.5" /> Attendance
          </TabsTrigger>
          <TabsTrigger value="updates" className="rounded-lg text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Sun className="h-3.5 w-3.5 mr-1.5" /> Daily Updates
          </TabsTrigger>
        </TabsList>

        {/* ── Tab 1: Personal Info ── */}
        <TabsContent value="personal">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                <InfoRow label="Full Name" value={`${student.firstName} ${student.lastName}`} />
                <InfoRow
                  label="Date of Birth"
                  value={`${formatDate(student.dob)} (Age: ${calculateAge(student.dob)})`}
                />
                <InfoRow label="Gender" value={student.gender} />
                <InfoRow label="Blood Group" value={student.bloodGroup || 'N/A'} />
                <InfoRow label="Aadhaar" value={maskAadhaar(student.aadhaarNumber)} />
                <InfoRow label="Admission Date" value={formatDate(student.admissionDate)} />
                <InfoRow label="Class" value={student.class.name} />
                <InfoRow label="Program" value={student.class.program.name} />
                <InfoRow label="Roll Number" value={student.rollNumber || 'N/A'} />
                <InfoRow label="Status" value={student.status} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Parent Info ── */}
        <TabsContent value="parents">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {student.parents.map((sp, idx) => {
              const p = sp.parent;
              const pInitials = `${p.firstName.charAt(0)}${p.lastName.charAt(0)}`.toUpperCase();
              return (
                <Card key={p.id} className="border-0 shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className={`${theme.avatarFallbackClass} font-semibold`}>
                          {pInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {p.firstName} {p.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {p.occupation || 'N/A'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="outline"
                            className="text-[10px] rounded-md capitalize"
                          >
                            {p.relation}
                          </Badge>
                          {sp.isPrimary && (
                            <Badge className={`text-[10px] rounded-md ${theme.selectedClass} border-emerald-200`}>
                              Primary
                            </Badge>
                          )}
                          {p.isEmergencyContact && (
                            <Badge className="text-[10px] rounded-md bg-red-50 text-red-700 border-red-200">
                              Emergency
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{p.phone}</span>
                      </div>
                      {p.email && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-3.5 w-3.5" />
                          <span>{p.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => window.open(`tel:${p.phone}`, '_self')}
                      >
                        <Phone className="h-3 w-3 mr-1" /> Call
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs rounded-xl border-green-200 text-green-700 hover:bg-green-50"
                        onClick={() => window.open(`https://wa.me/${p.phone.replace(/\D/g, '')}`, '_blank')}
                      >
                        <MessageCircle className="h-3 w-3 mr-1" /> WhatsApp
                      </Button>
                      {p.email && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                          onClick={() => window.open(`mailto:${p.email}`, '_self')}
                        >
                          <Mail className="h-3 w-3 mr-1" /> Email
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {student.parents.length === 0 && (
              <Card className="border-0 shadow-md col-span-full">
                <CardContent className="py-8 text-center text-gray-500">
                  No parent information available.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ── Tab 3: Growth ── */}
        <TabsContent value="growth">
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-base">Growth Assessment</CardTitle>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedPeriod}
                  onValueChange={setSelectedPeriod}
                >
                  <SelectTrigger className="w-28 h-8 text-xs rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest</SelectItem>
                    {student.growthScores.map((g) => (
                      <SelectItem key={g.id} value={g.period}>
                        {g.period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => router.push(`/teacher/growth?student=${student.id}`)}
                >
                  Update Growth
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeGrowth ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Radar Chart */}
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={280}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke={CHART_PALETTE.grid} />
                        <PolarAngleAxis
                          dataKey="dimension"
                          tick={{ fontSize: 11, fill: CHART_PALETTE.axis }}
                        />
                        <PolarRadiusAxis
                          angle={30}
                          domain={[0, 100]}
                          tick={{ fontSize: 9, fill: CHART_PALETTE.axisLight }}
                        />
                        <Radar
                          name="Score"
                          dataKey="value"
                          stroke={theme.primary}
                          fill={theme.primary}
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Score Breakdown */}
                  <div className="space-y-3">
                    {growthDimensions.map((dim) => (
                      <div key={dim.label} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{dim.label}</span>
                          <span className={`font-semibold ${getGrowthColor(dim.value)}`}>
                            {dim.value}
                          </span>
                        </div>
                        <Progress value={dim.value} className={`h-2 ${getGrowthBarColor(dim.value)}`} />
                      </div>
                    ))}
                    <Separator className="my-3" />
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">Overall</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${getGrowthColor(overallScore)}`}>
                          {overallScore}
                        </span>
                        <Badge
                          className={`rounded-md text-xs ${
                            overallScore >= 70
                              ? `${theme.selectedClass}`
                              : overallScore >= 40
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {getGrowthLabel(overallScore)}
                        </Badge>
                      </div>
                    </div>
                    {activeGrowth.comments && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
                        <span className="font-medium text-gray-700">Comments: </span>
                        {activeGrowth.comments}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-1">No Growth Assessment Yet</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Start tracking this student&apos;s growth across 6 dimensions.
                  </p>
                  <Button
                    className={`bg-gradient-to-r ${theme.btnGradientClass} text-white rounded-xl`}
                    onClick={() => router.push(`/teacher/growth?student=${student.id}`)}
                  >
                    Add Growth Assessment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 4: Medical ── */}
        <TabsContent value="medical">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                Medical Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Alert banner if medical alerts exist */}
              {student.medicalAlerts && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Medical Alert</p>
                    <p className="text-xs text-red-600">
                      This student has reported allergies or medical conditions. Please review carefully.
                    </p>
                  </div>
                </div>
              )}

              {student.medicalRecords.length > 0 ? (
                <div className="space-y-4">
                  {student.medicalRecords.map((record) => (
                    <div key={record.id} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <MedicalField
                          icon={<AlertTriangle className="h-4 w-4" />}
                          label="Allergies"
                          value={record.allergies || 'None'}
                          alert={record.allergies && record.allergies.toLowerCase() !== 'none' && record.allergies.toLowerCase() !== 'nil'}
                        />
                        <MedicalField
                          icon={<Heart className="h-4 w-4" />}
                          label="Conditions"
                          value={record.conditions || 'None'}
                          alert={record.conditions && record.conditions.toLowerCase() !== 'none' && record.conditions.toLowerCase() !== 'nil'}
                        />
                        <MedicalField
                          icon={<FileText className="h-4 w-4" />}
                          label="Medications"
                          value={record.medications || 'None'}
                        />
                        <MedicalField
                          icon={<Syringe className="h-4 w-4" />}
                          label="Vaccination"
                          value={record.vaccinationStatus || 'N/A'}
                          good={record.vaccinationStatus?.toLowerCase().includes('up-to-date')}
                        />
                        <MedicalField
                          icon={<Stethoscope className="h-4 w-4" />}
                          label="Doctor"
                          value={record.doctorName ? `${record.doctorName}${record.doctorPhone ? ` (${record.doctorPhone})` : ''}` : 'N/A'}
                        />
                      </div>
                      {record.notes && (
                        <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600">
                          <span className="font-medium text-gray-700">Notes: </span>
                          {record.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <ShieldCheck className="h-10 w-10 text-emerald-300 mx-auto mb-2" />
                  <p className="font-medium text-gray-700">No Medical Records</p>
                  <p className="text-sm">Medical records have not been added yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 5: Attendance ── */}
        <TabsContent value="attendance">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Attendance — {now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="p-3 bg-emerald-50 rounded-xl text-center">
                  <p className="text-lg font-bold text-emerald-700">{student.attendance.thisMonth.present}</p>
                  <p className="text-xs text-emerald-600">Present</p>
                </div>
                <div className="p-3 bg-red-50 rounded-xl text-center">
                  <p className="text-lg font-bold text-red-700">{student.attendance.thisMonth.absent}</p>
                  <p className="text-xs text-red-600">Absent</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl text-center">
                  <p className="text-lg font-bold text-amber-700">{student.attendance.thisMonth.late}</p>
                  <p className="text-xs text-amber-600">Late</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl text-center">
                  <p className="text-lg font-bold text-blue-700">{student.attendance.thisMonth.rate}%</p>
                  <p className="text-xs text-blue-600">Rate</p>
                </div>
              </div>

              {/* Calendar grid */}
              <div className="space-y-2">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="text-xs font-medium text-gray-500 py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for days before the 1st */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-9" />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const key = `${currentYear}-${currentMonth}-${day}`;
                    const status = attendanceMap.get(key);
                    const isToday = day === now.getDate();
                    const isFuture = new Date(currentYear, currentMonth, day) > now;

                    return (
                      <div
                        key={day}
                        className={`
                          h-9 flex flex-col items-center justify-center rounded-lg text-xs relative
                          ${isToday ? 'ring-2 ring-portal-500 ring-offset-1' : ''}
                          ${isFuture ? 'text-gray-300' : 'text-gray-700'}
                        `}
                      >
                        <span className="font-medium">{day}</span>
                        {status && !isFuture && (
                          <div className={`absolute bottom-0.5 h-1 w-3 rounded-full ${getAttendanceColor(status)}`} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <div className={`h-2.5 w-2.5 rounded-full ${ATTENDANCE_COLORS.PRESENT?.dot || 'bg-emerald-500'}`} /> Present
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`h-2.5 w-2.5 rounded-full ${ATTENDANCE_COLORS.ABSENT?.dot || 'bg-red-500'}`} /> Absent
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`h-2.5 w-2.5 rounded-full ${ATTENDANCE_COLORS.LATE?.dot || 'bg-amber-500'}`} /> Late
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 6: Daily Updates ── */}
        <TabsContent value="updates">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sun className="h-4 w-4" />
                Recent Daily Updates
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.recentDailyUpdates.length > 0 ? (
                <div className="space-y-3">
                  {student.recentDailyUpdates.map((update) => (
                    <div
                      key={update.id}
                      className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatDate(update.date)}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] rounded-md ${
                            update.status === 'PUBLISHED'
                              ? 'border-emerald-200 text-emerald-700'
                              : 'border-gray-200 text-gray-500'
                          }`}
                        >
                          {update.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        {/* Breakfast */}
                        <div className="flex items-center gap-1.5">
                          <Coffee className="h-3.5 w-3.5 text-amber-500" />
                          <div>
                            <p className="text-gray-500">Breakfast</p>
                            <p className="font-medium text-gray-700">{update.breakfast || '-'}</p>
                          </div>
                        </div>

                        {/* Lunch */}
                        <div className="flex items-center gap-1.5">
                          <Utensils className="h-3.5 w-3.5 text-green-500" />
                          <div>
                            <p className="text-gray-500">Lunch</p>
                            <p className="font-medium text-gray-700">{update.lunch || '-'}</p>
                          </div>
                        </div>

                        {/* Snacks */}
                        <div className="flex items-center gap-1.5">
                          <Cookie className="h-3.5 w-3.5 text-orange-500" />
                          <div>
                            <p className="text-gray-500">Snacks</p>
                            <p className="font-medium text-gray-700">{update.snacks || '-'}</p>
                          </div>
                        </div>

                        {/* Sleep */}
                        <div className="flex items-center gap-1.5">
                          <Moon className="h-3.5 w-3.5 text-indigo-500" />
                          <div>
                            <p className="text-gray-500">Sleep</p>
                            <p className="font-medium text-gray-700">
                              {update.sleepStart && update.sleepEnd
                                ? `${update.sleepStart}-${update.sleepEnd}`
                                : update.sleepQuality || '-'}
                            </p>
                          </div>
                        </div>

                        {/* Mood Morning */}
                        <div className="flex items-center gap-1.5">
                          <Smile className="h-3.5 w-3.5 text-yellow-500" />
                          <div>
                            <p className="text-gray-500">Morning Mood</p>
                            <p className="font-medium text-gray-700">
                              {getMoodEmoji(update.moodMorning)} {update.moodMorning || '-'}
                            </p>
                          </div>
                        </div>

                        {/* Mood Afternoon */}
                        <div className="flex items-center gap-1.5">
                          <Smile className="h-3.5 w-3.5 text-yellow-500" />
                          <div>
                            <p className="text-gray-500">Afternoon Mood</p>
                            <p className="font-medium text-gray-700">
                              {getMoodEmoji(update.moodAfternoon)} {update.moodAfternoon || '-'}
                            </p>
                          </div>
                        </div>

                        {/* Water */}
                        <div className="flex items-center gap-1.5">
                          <Droplets className="h-3.5 w-3.5 text-blue-500" />
                          <div>
                            <p className="text-gray-500">Water</p>
                            <p className="font-medium text-gray-700">{update.waterGlasses} glasses</p>
                          </div>
                        </div>

                        {/* Highlights */}
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-purple-500" />
                          <div>
                            <p className="text-gray-500">Highlights</p>
                            <p className="font-medium text-gray-700 truncate max-w-[120px]" title={update.highlights || ''}>
                              {update.highlights || '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    className="w-full text-xs rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 mt-2"
                    onClick={() => router.push(`/teacher/daily-updates?student=${student.id}`)}
                  >
                    View All Updates
                  </Button>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <Sun className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="font-medium text-gray-700">No Daily Updates</p>
                  <p className="text-sm">Daily updates for this student will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Sticky Quick Actions Bar ── */}
      <div className="sticky bottom-0 z-20 -mx-6 px-6 py-3 bg-white/80 backdrop-blur-lg border-t border-gray-100">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="flex-1 text-xs rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            onClick={() => router.push(`/teacher/observations?student=${student.id}`)}
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Observation
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-xs rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
            onClick={() => router.push(`/teacher/daily-updates?student=${student.id}`)}
          >
            <Sun className="h-3.5 w-3.5 mr-1.5" />
            Daily Update
          </Button>
          {primaryParent && (
            <Button
              variant="outline"
              className="flex-1 text-xs rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={() => window.open(`tel:${primaryParent.phone}`, '_self')}
            >
              <Phone className="h-3.5 w-3.5 mr-1.5" />
              Contact Parent
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Info Row Component ──
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

// ── Medical Field Component ──
function MedicalField({
  icon,
  label,
  value,
  alert,
  good,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  alert?: boolean;
  good?: boolean;
}) {
  return (
    <div className={`p-3 rounded-xl ${alert ? 'bg-red-50 border border-red-200' : good ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={alert ? 'text-red-500' : good ? 'text-emerald-500' : 'text-gray-400'}>
          {icon}
        </span>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className={`text-sm font-medium ${alert ? 'text-red-700' : good ? 'text-emerald-700' : 'text-gray-700'}`}>
        {value}
        {good && <CheckCircle2 className="inline h-3.5 w-3.5 ml-1" />}
      </p>
    </div>
  );
}
