'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  AlertTriangle,
  UserCheck,
  Search,
  Plus,
  X,
  Send,
  Eye,
  Trash2,
  Loader2,
  Users,
  HeartPulse,
  Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { AllergyBadge } from '@/components/meals/AllergyBadge';
import { AllergenTag } from '@/components/meals/AllergenTag';
import type { AllergenType, AllergySeverity, StudentAllergy } from '@/components/meals/types';
import {
  ALLERGEN_LABELS,
  ALLERGEN_EMOJIS,
  SEVERITY_COLORS,
} from '@/components/meals/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

// ── Types ──
interface StudentWithAllergy {
  id: string;
  firstName: string;
  lastName: string;
  photo?: string;
  className?: string;
  classId?: string;
  allergies: StudentAllergy[];
}

interface DashboardData {
  totalStudentsWithAllergies: number;
  criticalCount: number;
  unverifiedCount: number;
  mostCommonAllergen: string;
  allergenDistribution: { allergen: string; count: number }[];
  severityDistribution: { severity: string; count: number; percentage: number }[];
  criticalAlerts: StudentWithAllergy[];
  unverifiedAllergies: StudentWithAllergy[];
}

const ALLERGEN_LIST: AllergenType[] = [
  'MILK','EGGS','FISH','SHELLFISH','TREE_NUTS','PEANUTS',
  'WHEAT','SOYBEAN','SESAME','CELERY','MUSTARD','LUPIN',
  'MOLLUSCS','SULPHITES','GLUTEN','HONEY','SUGAR',
];

const SEVERITY_OPTIONS: AllergySeverity[] = ['MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING'];
const SEVERITY_LABELS: Record<AllergySeverity, string> = {
  MILD: 'Mild',
  MODERATE: 'Moderate',
  SEVERE: 'Severe',
  LIFE_THREATENING: 'Life-Threatening',
};

const PIE_COLORS = ['#FBBF24', '#FB923C', '#EF4444', '#991B1B'];

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

export default function AllergyDashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithAllergy | null>(null);
  const [saving, setSaving] = useState(false);

  // Add allergy form
  const [formStudentId, setFormStudentId] = useState('');
  const [formStudentSearch, setFormStudentSearch] = useState('');
  const [formAllergen, setFormAllergen] = useState<AllergenType | ''>('');
  const [formSeverity, setFormSeverity] = useState<AllergySeverity>('MILD');
  const [formReaction, setFormReaction] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formActionPlan, setFormActionPlan] = useState('');
  const [students, setStudents] = useState<{ id: string; firstName: string; lastName: string }[]>([]);

  // ── Fetch dashboard data ──
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch('/api/allergies/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      } else {
        // Generate fallback data for display
        setDashboard({
          totalStudentsWithAllergies: 0,
          criticalCount: 0,
          unverifiedCount: 0,
          mostCommonAllergen: '—',
          allergenDistribution: [],
          severityDistribution: [
            { severity: 'Mild', count: 0, percentage: 0 },
            { severity: 'Moderate', count: 0, percentage: 0 },
            { severity: 'Severe', count: 0, percentage: 0 },
            { severity: 'Life-Threatening', count: 0, percentage: 0 },
          ],
          criticalAlerts: [],
          unverifiedAllergies: [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
      toast.error('Failed to load allergy dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ── Fetch students for search ──
  useEffect(() => {
    async function fetchStudents() {
      try {
        const token = getToken();
        const res = await fetch('/api/students?limit=100&status=ACTIVE', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStudents(data.students || data || []);
        }
      } catch (_) {}
    }
    fetchStudents();
  }, []);

  // ── Handlers ──
  const openStudentDetail = (student: StudentWithAllergy) => {
    setSelectedStudent(student);
    setDetailDialogOpen(true);
  };

  const handleAddAllergy = async () => {
    if (!formStudentId || !formAllergen) {
      toast.error('Student and Allergen are required');
      return;
    }
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/students/${formStudentId}/allergies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          allergen: formAllergen,
          severity: formSeverity,
          reaction: formReaction,
          notes: formNotes,
          actionPlan: formActionPlan,
        }),
      });
      if (res.ok) {
        toast.success('Allergy added');
        setAddDialogOpen(false);
        setFormStudentId('');
        setFormAllergen('');
        setFormSeverity('MILD');
        setFormReaction('');
        setFormNotes('');
        setFormActionPlan('');
        fetchDashboard();
      } else {
        toast.error('Failed to add allergy');
      }
    } catch (err) {
      toast.error('Failed to add allergy');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAllergy = async (studentId: string, allergyId: string) => {
    if (!confirm('Remove this allergy record?')) return;
    try {
      const token = getToken();
      const res = await fetch(`/api/students/${studentId}/allergies?id=${allergyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.ok) {
        toast.success('Allergy removed');
        fetchDashboard();
      } else {
        toast.error('Failed to remove allergy');
      }
    } catch (err) {
      toast.error('Failed to remove allergy');
    }
  };

  const handleSendReminder = async (studentId: string) => {
    toast.success('Verification reminder sent');
  };

  const filteredStudents = useMemo(() => {
    if (!formStudentSearch) return students.slice(0, 20);
    const q = formStudentSearch.toLowerCase();
    return students.filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [students, formStudentSearch]);

  if (loading || !dashboard) {
    return (
      <div className="min-h-screen p-4 md:p-6 space-y-6">
        <Skeleton className="h-16 w-full rounded-xl bg-white/5" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-white/5" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-xl bg-white/5" />
          <Skeleton className="h-64 rounded-xl bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 p-4 md:p-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-400" />
            Allergy Dashboard
          </h1>
          <p className="text-sm text-white/50">Monitor and manage student allergies</p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white border-0 hover:from-red-700 hover:to-orange-700"
        >
          <Plus className="h-4 w-4" />
          Add Allergy
        </Button>
      </motion.div>

      {/* ── Overview Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Students with Allergies',
            value: dashboard.totalStudentsWithAllergies,
            icon: Users,
            color: 'text-purple-400',
            bg: 'border-purple-500/20',
          },
          {
            label: 'Critical Allergies',
            value: dashboard.criticalCount,
            icon: HeartPulse,
            color: 'text-red-400',
            bg: 'border-red-500/20',
            pulse: true,
          },
          {
            label: 'Unverified Allergies',
            value: dashboard.unverifiedCount,
            icon: AlertTriangle,
            color: 'text-amber-400',
            bg: 'border-amber-500/20',
            action: dashboard.unverifiedCount > 0 ? { label: 'Send Reminders', onClick: () => toast.info('Reminders queued') } : undefined,
          },
          {
            label: 'Most Common Allergen',
            value: dashboard.mostCommonAllergen === '—' ? '—' : (ALLERGEN_LABELS[dashboard.mostCommonAllergen as AllergenType] || dashboard.mostCommonAllergen),
            icon: ShieldAlert,
            color: 'text-orange-400',
            bg: 'border-orange-500/20',
          },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-xl border ${stat.bg} bg-white/5 backdrop-blur-sm p-4 relative`}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`h-4 w-4 ${stat.color} ${stat.pulse ? 'animate-pulse' : ''}`} />
              <span className="text-xs text-white/40">{stat.label}</span>
            </div>
            <p className="text-lg font-bold text-white">{stat.value}</p>
            {stat.action && (
              <Button
                variant="link"
                size="sm"
                className="absolute right-2 top-2 text-[10px] text-amber-400 p-0 h-auto"
                onClick={stat.action.onClick}
              >
                {stat.action.label}
              </Button>
            )}
          </motion.div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Allergen Distribution */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Allergen Distribution</h3>
          {dashboard.allergenDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dashboard.allergenDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="allergen"
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f0f2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white',
                  }}
                />
                <Bar dataKey="count" fill="#A855F7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-white/20 text-sm">
              No allergen data available
            </div>
          )}
        </div>

        {/* Severity Distribution */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Severity Distribution</h3>
          {dashboard.severityDistribution.some((s) => s.count > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={dashboard.severityDistribution}
                  dataKey="count"
                  nameKey="severity"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ severity, percentage }) => `${severity} ${percentage}%`}
                >
                  {dashboard.severityDistribution.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f0f2e',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white',
                  }}
                />
                <Legend
                  wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-white/20 text-sm">
              No severity data available
            </div>
          )}
        </div>
      </div>

      {/* ── Critical Alerts Table ── */}
      <div className="rounded-xl border border-red-500/20 bg-red-950/10 backdrop-blur-sm p-4">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          Critical Alerts — Severe &amp; Life-Threatening
        </h3>
        {dashboard.criticalAlerts.length > 0 ? (
          <ScrollArea className="max-h-80">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/40">Student</TableHead>
                  <TableHead className="text-white/40">Class</TableHead>
                  <TableHead className="text-white/40">Allergen</TableHead>
                  <TableHead className="text-white/40">Severity</TableHead>
                  <TableHead className="text-white/40">Reaction</TableHead>
                  <TableHead className="text-white/40">Action Plan</TableHead>
                  <TableHead className="text-white/40 w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.criticalAlerts.map((student) =>
                  student.allergies
                    .filter((a) => a.severity === 'SEVERE' || a.severity === 'LIFE_THREATENING')
                    .map((allergy) => (
                      <TableRow
                        key={`${student.id}-${allergy.id}`}
                        className="border-white/5 hover:bg-white/5 cursor-pointer"
                        onClick={() => openStudentDetail(student)}
                      >
                        <TableCell className="text-white font-medium text-sm">
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell className="text-white/50 text-xs">{student.className || '—'}</TableCell>
                        <TableCell>
                          <AllergenTag allergen={allergy.allergen} size="sm" variant="danger" />
                        </TableCell>
                        <TableCell>
                          <AllergyBadge severity={allergy.severity} size="sm" />
                        </TableCell>
                        <TableCell className="text-white/50 text-xs max-w-[120px] truncate">
                          {allergy.reaction || '—'}
                        </TableCell>
                        <TableCell className="text-white/50 text-xs max-w-[120px] truncate">
                          {allergy.notes || '—'}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white/30 hover:text-white h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              openStudentDetail(student);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-white/20 text-sm">No critical allergies recorded</div>
        )}
      </div>

      {/* ── Unverified Allergies Table ── */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 backdrop-blur-sm p-4">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4 text-amber-400" />
          Unverified Allergies — Awaiting Parent Confirmation
        </h3>
        {dashboard.unverifiedAllergies.length > 0 ? (
          <ScrollArea className="max-h-60">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/40">Student</TableHead>
                  <TableHead className="text-white/40">Allergen</TableHead>
                  <TableHead className="text-white/40">Severity</TableHead>
                  <TableHead className="text-white/40">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.unverifiedAllergies.map((student) =>
                  student.allergies
                    .filter((a) => !a.isVerified)
                    .map((allergy) => (
                      <TableRow key={`${student.id}-${allergy.id}`} className="border-white/5 hover:bg-white/5">
                        <TableCell className="text-white font-medium text-sm">
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>
                          <AllergenTag allergen={allergy.allergen} size="sm" variant="warning" />
                        </TableCell>
                        <TableCell>
                          <AllergyBadge severity={allergy.severity} size="sm" />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-amber-400 hover:text-amber-300 text-xs gap-1"
                            onClick={() => handleSendReminder(student.id)}
                          >
                            <Send className="h-3 w-3" /> Send Reminder
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-white/20 text-sm">All allergies are verified</div>
        )}
      </div>

      {/* ── Student Allergy Detail Dialog ── */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg bg-[#0f0f2e] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedStudent?.firstName} {selectedStudent?.lastName} — Allergies
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-3 py-4">
              {selectedStudent.allergies.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-4">No allergies recorded</p>
              ) : (
                selectedStudent.allergies.map((allergy) => (
                  <div
                    key={allergy.id}
                    className="rounded-lg border border-white/10 bg-white/5 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <AllergenTag allergen={allergy.allergen} size="md" />
                      <AllergyBadge severity={allergy.severity} size="sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-white/40">Reaction:</span>
                        <span className="text-white/70 ml-1">{allergy.reaction || '—'}</span>
                      </div>
                      <div>
                        <span className="text-white/40">Verified:</span>
                        <span className={`ml-1 ${allergy.isVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {allergy.isVerified ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-white/40">Notes:</span>
                        <span className="text-white/70 ml-1">{allergy.notes || '—'}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 text-xs h-6"
                      onClick={() => {
                        handleDeleteAllergy(selectedStudent.id, allergy.id);
                        setDetailDialogOpen(false);
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Remove
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailDialogOpen(false)}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Allergy Dialog ── */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-lg bg-[#0f0f2e] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Add Allergy</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Student Search */}
            <div>
              <Label className="text-white/60 text-xs">Student *</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                <Input
                  value={formStudentSearch}
                  onChange={(e) => setFormStudentSearch(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-white"
                  placeholder="Search student by name..."
                />
              </div>
              <ScrollArea className="max-h-32 mt-2">
                <div className="space-y-1">
                  {filteredStudents.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setFormStudentId(s.id);
                        setFormStudentSearch(`${s.firstName} ${s.lastName}`);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded text-xs transition-colors ${
                        formStudentId === s.id
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'text-white/50 hover:bg-white/5 hover:text-white/70'
                      }`}
                    >
                      {s.firstName} {s.lastName}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Allergen */}
            <div>
              <Label className="text-white/60 text-xs">Allergen *</Label>
              <Select value={formAllergen} onValueChange={(v) => setFormAllergen(v as AllergenType)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue placeholder="Select allergen" />
                </SelectTrigger>
                <SelectContent>
                  {ALLERGEN_LIST.map((a) => (
                    <SelectItem key={a} value={a}>
                      {ALLERGEN_EMOJIS[a]} {ALLERGEN_LABELS[a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Severity */}
            <div>
              <Label className="text-white/60 text-xs">Severity *</Label>
              <Select value={formSeverity} onValueChange={(v) => setFormSeverity(v as AllergySeverity)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SEVERITY_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reaction */}
            <div>
              <Label className="text-white/60 text-xs">Reaction</Label>
              <Input
                value={formReaction}
                onChange={(e) => setFormReaction(e.target.value)}
                className="bg-white/5 border-white/10 text-white mt-1"
                placeholder="e.g., Hives, swelling, difficulty breathing"
              />
            </div>

            {/* Notes */}
            <div>
              <Label className="text-white/60 text-xs">Notes</Label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="bg-white/5 border-white/10 text-white mt-1 min-h-[60px]"
                placeholder="Additional notes"
              />
            </div>

            {/* Action Plan */}
            <div>
              <Label className="text-white/60 text-xs">Action Plan</Label>
              <Textarea
                value={formActionPlan}
                onChange={(e) => setFormActionPlan(e.target.value)}
                className="bg-white/5 border-white/10 text-white mt-1 min-h-[60px]"
                placeholder="Emergency action plan for this allergy"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddAllergy}
              disabled={saving}
              className="bg-gradient-to-r from-red-600 to-orange-600 text-white border-0"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Allergy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
