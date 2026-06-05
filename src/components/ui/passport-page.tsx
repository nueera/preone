'use client';
 
 

// ============================================================
// PassportPage — Shared Childhood Passport component
// Used by Admin, Teacher, and Parent portals
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Camera, Trophy, Award, Target, TrendingUp,
  Plus, X, Image as ImageIcon, Calendar, Heart, PartyPopper,
  Star, Zap, ThumbsUp, ChevronRight, BookOpen,
  CheckCircle2, Circle, Clock, Download, ExternalLink,
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';
import { PageTransition } from '@/components/ui/page-transition';
import { AnimatedCard } from '@/components/ui/animated-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PORTAL_THEMES, GROWTH_COLORS } from '@/lib/theme-tokens';

// ── Types ──

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  dob: string;
  gender: string;
  bloodGroup: string | null;
  rollNumber: string | null;
  status: string;
  admissionDate: string;
  class: {
    id: string;
    name: string;
    program: { id: string; name: string } | null;
    teacher: {
      id: string;
      firstName: string;
      lastName: string;
      photo: string | null;
    } | null;
  } | null;
}

interface Memory {
  id: string;
  studentId: string;
  title: string;
  description: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  date: string | null;
  createdAt: string;
}

interface Achievement {
  id: string;
  studentId: string;
  title: string;
  description: string | null;
  icon: string | null;
  date: string | null;
  createdAt: string;
}

interface Certificate {
  id: string;
  studentId: string;
  title: string;
  template: string | null;
  pdfUrl: string | null;
  issuedAt: string | null;
  createdAt: string;
}

interface MilestoneEntry {
  id: string;
  name: string;
  ageGroup: string;
  category: string;
  description: string | null;
  achieved: boolean;
  achievedDate: string | null;
  status: string;
  notes: string | null;
  timelineId: string | null;
}

interface GrowthScore {
  id: string;
  studentId: string;
  period: string;
  creativity: number;
  communication: number;
  social: number;
  confidence: number;
  cognitive: number;
  physical: number;
  overall: number | null;
  comments: string | null;
  createdAt: string;
}

interface DailyUpdate {
  id: string;
  studentId: string;
  date: string;
  breakfast: string | null;
  lunch: string | null;
  snacks: string | null;
  sleepStart: string | null;
  sleepEnd: string | null;
  moodMorning: string | null;
  moodAfternoon: string | null;
  highlights: string | null;
}

interface Observation {
  id: string;
  studentId: string;
  teacherId: string | null;
  category: string;
  content: string;
  priority: string;
  isShared: boolean;
  parentAck: boolean;
  createdAt: string;
}

interface Reaction {
  id: string;
  studentId: string;
  parentId: string;
  targetType: string;
  targetId: string;
  reaction: string;
  comment: string | null;
  createdAt: string;
}

interface PassportData {
  student: Student;
  memories: Memory[];
  achievements: Achievement[];
  certificates: Certificate[];
  milestones: MilestoneEntry[];
  growthSummary: GrowthScore | null;
  growthHistory: GrowthScore[];
  recentUpdates: DailyUpdate[];
  recentObservations: Observation[];
  reactions: Reaction[];
}

interface PassportPageProps {
  studentId: string;
  role: 'ADMIN' | 'TEACHER' | 'PARENT';
  portalPrefix: '/admin' | '/teacher' | '/parent';
}

// ── Reaction types ──
const REACTION_EMOJIS: Record<string, { emoji: string; label: string; icon: React.ElementType }> = {
  love: { emoji: '❤️', label: 'Love', icon: Heart },
  celebrate: { emoji: '🎉', label: 'Celebrate', icon: PartyPopper },
  proud: { emoji: '🌟', label: 'Proud', icon: Star },
  wow: { emoji: '😮', label: 'Wow', icon: Zap },
  heart: { emoji: '💙', label: 'Heart', icon: ThumbsUp },
};

// ── Theme per role ──
function getThemeColors(role: string) {
  if (role === 'ADMIN') return PORTAL_THEMES.admin;
  if (role === 'TEACHER') return PORTAL_THEMES.teacher;
  return PORTAL_THEMES.parent;
}

function getAccentClass(role: string) {
  if (role === 'ADMIN') return 'bg-purple-600 hover:bg-purple-700 text-white';
  if (role === 'TEACHER') return 'bg-emerald-600 hover:bg-emerald-700 text-white';
  return 'bg-sky-600 hover:bg-sky-700 text-white';
}

function getAccentBg(role: string) {
  if (role === 'ADMIN') return 'bg-purple-50 border-purple-200';
  if (role === 'TEACHER') return 'bg-emerald-50 border-emerald-200';
  return 'bg-sky-50 border-sky-200';
}

function getAccentText(role: string) {
  if (role === 'ADMIN') return 'text-purple-700';
  if (role === 'TEACHER') return 'text-emerald-700';
  return 'text-sky-700';
}

// ── Helper: Calculate age from DOB ──
function calculateAge(dob: string): string {
  const birth = new Date(dob);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  const totalMonths = years * 12 + months;
  const y = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  if (y === 0) return `${m} months`;
  if (m === 0) return `${y} year${y > 1 ? 's' : ''}`;
  return `${y}y ${m}m`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ── Timeline entry type ──
interface TimelineEntry {
  id: string;
  type: 'memory' | 'achievement' | 'milestone';
  title: string;
  description: string | null;
  date: string | null;
  icon: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function PassportPage({ studentId, role, portalPrefix }: PassportPageProps) {
  const theme = getThemeColors(role);
  const [data, setData] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('timeline');
  const [showAddMemory, setShowAddMemory] = useState(false);
  const [showAddAchievement, setShowAddAchievement] = useState(false);
  const [showAddCertificate, setShowAddCertificate] = useState(false);
  const [showMarkMilestone, setShowMarkMilestone] = useState<MilestoneEntry | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  // ── Fetch passport data ──
  const fetchPassport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('preone_token');
      if (!token) {
        setError('Authentication required');
        return;
      }
      const res = await fetch(`/api/passport/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to load passport' }));
        throw new Error(err.error || 'Failed to load passport');
      }
      const passportData = await res.json();
      setData(passportData);
      if (passportData.growthHistory?.length > 0) {
        setSelectedPeriod(passportData.growthHistory[0].period);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load passport');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchPassport();
  }, [fetchPassport]);

  // ── Reaction handler (parents only) ──
  const handleReact = useCallback(async (targetType: string, targetId: string, reaction: string) => {
    try {
      const token = localStorage.getItem('preone_token');
      if (!token) return;

      const res = await fetch(`/api/passport/${studentId}/reactions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, reaction }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.action === 'removed') {
          toast.success('Reaction removed');
        } else {
          toast.success('Reaction added! 💕');
        }
        fetchPassport(); // Refresh to get updated reactions
      }
    } catch {
      toast.error('Failed to add reaction');
    }
  }, [studentId, fetchPassport]);

  // ── Loading state ──
  if (loading) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-8 w-8 border-3 border-gray-300 border-t-purple-600 rounded-full animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading Childhood Passport...</p>
        </div>
      </PageTransition>
    );
  }

  // ── Error state ──
  if (error || !data) {
    return (
      <PageTransition>
        <EmptyState
          icon={<BookOpen className="h-12 w-12" />}
          title="Could not load passport"
          description={error || 'An error occurred'}
          action={
            <Button onClick={fetchPassport} variant="outline">
              Try Again
            </Button>
          }
        />
      </PageTransition>
    );
  }

  const { student, memories, achievements, certificates, milestones, growthSummary, growthHistory, recentUpdates, reactions } = data;

  // ── Build timeline entries ──
  const timelineEntries: TimelineEntry[] = [
    ...memories.map((m) => ({
      id: m.id,
      type: 'memory' as const,
      title: m.title,
      description: m.description,
      date: m.date || m.createdAt,
      icon: null,
      mediaUrl: m.mediaUrl,
      mediaType: m.mediaType,
    })),
    ...achievements.map((a) => ({
      id: a.id,
      type: 'achievement' as const,
      title: a.title,
      description: a.description,
      date: a.date || a.createdAt,
      icon: a.icon,
      mediaUrl: null,
      mediaType: null,
    })),
    ...milestones
      .filter((m) => m.achieved)
      .map((m) => ({
        id: m.id,
        type: 'milestone' as const,
        title: m.name,
        description: m.description,
        date: m.achievedDate,
        icon: '🎯',
        mediaUrl: null,
        mediaType: null,
      })),
  ].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  // ── Group reactions by target ──
  const reactionMap = new Map<string, Reaction[]>();
  for (const r of reactions) {
    const key = `${r.targetType}:${r.targetId}`;
    if (!reactionMap.has(key)) reactionMap.set(key, []);
    reactionMap.get(key)!.push(r);
  }

  // ── Group milestones by ageGroup ──
  const milestoneGroups = milestones.reduce<Record<string, MilestoneEntry[]>>((acc, m) => {
    const group = m.ageGroup || 'Unspecified';
    if (!acc[group]) acc[group] = [];
    acc[group].push(m);
    return acc;
  }, {});

  // ── Growth radar data ──
  const selectedGrowth = growthHistory.find((g) => g.period === selectedPeriod) || growthSummary;
  const radarData = selectedGrowth ? [
    { dimension: 'Creativity', value: selectedGrowth.creativity, fullMark: 100 },
    { dimension: 'Communication', value: selectedGrowth.communication, fullMark: 100 },
    { dimension: 'Social', value: selectedGrowth.social, fullMark: 100 },
    { dimension: 'Confidence', value: selectedGrowth.confidence, fullMark: 100 },
    { dimension: 'Cognitive', value: selectedGrowth.cognitive, fullMark: 100 },
    { dimension: 'Physical', value: selectedGrowth.physical, fullMark: 100 },
  ] : [];

  const canAdd = role === 'ADMIN' || role === 'TEACHER';
  const canReact = role === 'PARENT';
  const canIssueCert = role === 'ADMIN';

  return (
    <PageTransition>
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        {/* ── Header ── */}
        <div className={cn('rounded-2xl border p-5 sm:p-6', getAccentBg(role))}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white shadow-md">
              <AvatarImage src={student.photo || undefined} />
              <AvatarFallback className={cn('text-lg font-bold', theme.avatarFallbackClass)}>
                {student.firstName[0]}{student.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold">
                  {student.firstName} {student.lastName}
                </h1>
                <Badge variant="secondary" className={cn('text-xs', getAccentText(role))}>
                  {student.status}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                {student.class && (
                  <span>📚 {student.class.name}{student.class.program ? ` · ${student.class.program.name}` : ''}</span>
                )}
                <span>🎂 {calculateAge(student.dob)}</span>
                {student.rollNumber && <span>🔢 Roll #{student.rollNumber}</span>}
                {student.class?.teacher && (
                  <span>👩‍🏫 {student.class.teacher.firstName} {student.class.teacher.lastName}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/70 backdrop-blur-sm shadow-sm">
              <Sparkles className={cn('h-5 w-5', getAccentText(role))} />
              <span className={cn('font-semibold text-sm', getAccentText(role))}>Childhood Passport</span>
            </div>
          </div>

          {/* ── Quick Stats ── */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
            {[
              { label: 'Memories', value: memories.length, icon: Camera, color: 'text-pink-600 bg-pink-50' },
              { label: 'Achievements', value: achievements.length, icon: Trophy, color: 'text-amber-600 bg-amber-50' },
              { label: 'Milestones', value: milestones.filter(m => m.achieved).length + '/' + milestones.length, icon: Target, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Certificates', value: certificates.length, icon: Award, color: 'text-purple-600 bg-purple-50' },
              { label: 'Reactions', value: reactions.length, icon: Heart, color: 'text-red-500 bg-red-50' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white shadow-sm border">
                <div className={cn('p-1.5 rounded-lg', stat.color)}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-sm font-bold">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full sm:w-auto flex-wrap h-auto gap-1 p-1 bg-muted/50">
            <TabsTrigger value="timeline" className="gap-1.5 text-xs sm:text-sm">
              <BookOpen className="h-3.5 w-3.5" /> Timeline
            </TabsTrigger>
            <TabsTrigger value="memories" className="gap-1.5 text-xs sm:text-sm">
              <Camera className="h-3.5 w-3.5" /> Memories
            </TabsTrigger>
            <TabsTrigger value="achievements" className="gap-1.5 text-xs sm:text-sm">
              <Trophy className="h-3.5 w-3.5" /> Achievements
            </TabsTrigger>
            <TabsTrigger value="milestones" className="gap-1.5 text-xs sm:text-sm">
              <Target className="h-3.5 w-3.5" /> Milestones
            </TabsTrigger>
            <TabsTrigger value="growth" className="gap-1.5 text-xs sm:text-sm">
              <TrendingUp className="h-3.5 w-3.5" /> Growth
            </TabsTrigger>
            <TabsTrigger value="certificates" className="gap-1.5 text-xs sm:text-sm">
              <Award className="h-3.5 w-3.5" /> Certificates
            </TabsTrigger>
          </TabsList>

          {/* ── Timeline Tab ── */}
          <TabsContent value="timeline">
            <div className="space-y-4">
              {canAdd && (
                <div className="flex gap-2">
                  <Button size="sm" className={cn('gap-1.5', getAccentClass(role))} onClick={() => setShowAddMemory(true)}>
                    <Plus className="h-3.5 w-3.5" /> Add Memory
                  </Button>
                  <Button size="sm" className={cn('gap-1.5', getAccentClass(role))} onClick={() => setShowAddAchievement(true)}>
                    <Plus className="h-3.5 w-3.5" /> Add Achievement
                  </Button>
                </div>
              )}

              {timelineEntries.length === 0 ? (
                <EmptyState
                  icon={<BookOpen className="h-12 w-12" />}
                  title="No entries yet"
                  description="Start building this child's passport by adding memories and achievements"
                  action={
                    canAdd ? (
                      <Button size="sm" className={getAccentClass(role)} onClick={() => setShowAddMemory(true)}>
                        Add First Memory
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

                  <div className="space-y-4">
                    {timelineEntries.map((entry, idx) => {
                      const typeIconName = entry.type === 'memory' ? 'camera' :
                        entry.type === 'achievement' ? 'trophy' : 'target';
                      const typeColor = entry.type === 'memory' ? 'bg-pink-100 text-pink-600' :
                        entry.type === 'achievement' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600';
                      const reactionKey = `${entry.type}:${entry.id}`;
                      const entryReactions = reactionMap.get(reactionKey) || [];

                      const TypeIconComponent = entry.type === 'memory' ? Camera :
                        entry.type === 'achievement' ? Trophy : Target;

                      return (
                        <AnimatedCard key={entry.id} delay={idx * 0.05} hover={false}>
                          <div className="flex gap-4 p-4">
                            {/* Timeline dot */}
                            <div className="relative z-10 flex-shrink-0">
                              <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shadow-sm', typeColor)}>
                                {entry.icon ? (
                                  <span className="text-lg">{entry.icon}</span>
                                ) : (
                                  <TypeIconComponent className="h-4 w-4" />
                                )}
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-sm">{entry.title}</h3>
                                  {entry.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{entry.description}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant="outline" className="text-[10px] capitalize">
                                      {entry.type}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">
                                      {formatDate(entry.date)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Photo */}
                              {entry.mediaUrl && entry.mediaType === 'image' && (
                                <div className="mt-3">
                                  <img
                                    src={entry.mediaUrl}
                                    alt={entry.title}
                                    className="rounded-xl max-h-48 object-cover shadow-sm"
                                  />
                                </div>
                              )}

                              {/* Reactions */}
                              <div className="mt-3">
                                <ReactionBar
                                  targetType={entry.type}
                                  targetId={entry.id}
                                  reactions={entryReactions}
                                  canReact={canReact}
                                  onReact={handleReact}
                                />
                              </div>
                            </div>
                          </div>
                        </AnimatedCard>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Memories Tab ── */}
          <TabsContent value="memories">
            <div className="space-y-4">
              {canAdd && (
                <Button size="sm" className={cn('gap-1.5', getAccentClass(role))} onClick={() => setShowAddMemory(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add Memory
                </Button>
              )}

              {memories.length === 0 ? (
                <EmptyState
                  icon={<Camera className="h-12 w-12" />}
                  title="No memories yet"
                  description="Add photos and moments to this child's passport"
                  action={
                    canAdd ? (
                      <Button size="sm" className={getAccentClass(role)} onClick={() => setShowAddMemory(true)}>
                        Add First Memory
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {memories.map((memory, idx) => {
                    const reactionKey = `memory:${memory.id}`;
                    const memReactions = reactionMap.get(reactionKey) || [];

                    return (
                      <AnimatedCard key={memory.id} delay={idx * 0.05}>
                        <div className="overflow-hidden rounded-xl">
                          {memory.mediaUrl && memory.mediaType === 'image' ? (
                            <div className="aspect-video bg-gray-100 relative">
                              <img
                                src={memory.mediaUrl}
                                alt={memory.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className={cn('aspect-video flex items-center justify-center', getAccentBg(role))}>
                              <ImageIcon className={cn('h-8 w-8', getAccentText(role))} />
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="font-semibold text-sm">{memory.title}</h3>
                            {memory.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{memory.description}</p>
                            )}
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-[10px] text-muted-foreground">
                                {formatDate(memory.date || memory.createdAt)}
                              </span>
                            </div>
                            <div className="mt-2">
                              <ReactionBar
                                targetType="memory"
                                targetId={memory.id}
                                reactions={memReactions}
                                canReact={canReact}
                                onReact={handleReact}
                              />
                            </div>
                          </div>
                        </div>
                      </AnimatedCard>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Achievements Tab ── */}
          <TabsContent value="achievements">
            <div className="space-y-4">
              {canAdd && (
                <Button size="sm" className={cn('gap-1.5', getAccentClass(role))} onClick={() => setShowAddAchievement(true)}>
                  <Plus className="h-3.5 w-3.5" /> Add Achievement
                </Button>
              )}

              {achievements.length === 0 ? (
                <EmptyState
                  icon={<Trophy className="h-12 w-12" />}
                  title="No achievements yet"
                  description="Celebrate this child's milestones by adding achievements"
                  action={
                    canAdd ? (
                      <Button size="sm" className={getAccentClass(role)} onClick={() => setShowAddAchievement(true)}>
                        Add First Achievement
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement, idx) => {
                    const reactionKey = `achievement:${achievement.id}`;
                    const achReactions = reactionMap.get(reactionKey) || [];

                    return (
                      <AnimatedCard key={achievement.id} delay={idx * 0.05}>
                        <div className="p-5 text-center">
                          <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 flex items-center justify-center shadow-sm mb-3">
                            <span className="text-2xl">{achievement.icon || '🏆'}</span>
                          </div>
                          <h3 className="font-semibold text-sm">{achievement.title}</h3>
                          {achievement.description && (
                            <p className="text-xs text-muted-foreground mt-1.5">{achievement.description}</p>
                          )}
                          <Badge variant="secondary" className="mt-3 text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                            {formatDate(achievement.date || achievement.createdAt)}
                          </Badge>
                          <div className="mt-3">
                            <ReactionBar
                              targetType="achievement"
                              targetId={achievement.id}
                              reactions={achReactions}
                              canReact={canReact}
                              onReact={handleReact}
                            />
                          </div>
                        </div>
                      </AnimatedCard>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Milestones Tab ── */}
          <TabsContent value="milestones">
            <div className="space-y-6">
              {Object.keys(milestoneGroups).length === 0 ? (
                <EmptyState
                  icon={<Target className="h-12 w-12" />}
                  title="No milestones defined"
                  description="Milestone definitions will appear here once configured"
                />
              ) : (
                Object.entries(milestoneGroups).map(([ageGroup, groupMilestones]) => (
                  <div key={ageGroup}>
                    <h3 className={cn('text-sm font-bold mb-3 flex items-center gap-2', getAccentText(role))}>
                      <Clock className="h-4 w-4" />
                      {ageGroup}
                      <Badge variant="secondary" className="text-[10px]">
                        {groupMilestones.filter(m => m.achieved).length}/{groupMilestones.length}
                      </Badge>
                    </h3>
                    <div className="space-y-2">
                      {groupMilestones.map((milestone, idx) => (
                        <AnimatedCard key={milestone.id} delay={idx * 0.03} hover={false}>
                          <div className="flex items-center gap-3 p-3 sm:p-4">
                            {milestone.achieved ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={cn('text-sm font-medium', milestone.achieved ? '' : 'text-gray-500')}>
                                  {milestone.name}
                                </span>
                                <Badge variant="outline" className="text-[9px] capitalize">
                                  {milestone.category}
                                </Badge>
                              </div>
                              {milestone.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">{milestone.description}</p>
                              )}
                              {milestone.achieved && milestone.achievedDate && (
                                <span className="text-[10px] text-emerald-600 mt-1 block">
                                  Achieved on {formatDate(milestone.achievedDate)}
                                  {milestone.notes ? ` · ${milestone.notes}` : ''}
                                </span>
                              )}
                            </div>
                            {!milestone.achieved && canAdd && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs gap-1 flex-shrink-0"
                                onClick={() => setShowMarkMilestone(milestone)}
                              >
                                Mark Achieved
                              </Button>
                            )}
                          </div>
                        </AnimatedCard>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* ── Growth Tab ── */}
          <TabsContent value="growth">
            <div className="space-y-4">
              {growthHistory.length === 0 ? (
                <EmptyState
                  icon={<TrendingUp className="h-12 w-12" />}
                  title="No growth data yet"
                  description="Growth scores will appear here once assessments are recorded"
                />
              ) : (
                <>
                  {/* Period Selector */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground font-medium">Period:</span>
                    {growthHistory.map((g) => (
                      <Button
                        key={g.id}
                        size="sm"
                        variant={selectedPeriod === g.period ? 'default' : 'outline'}
                        className={cn('text-xs', selectedPeriod === g.period ? getAccentClass(role) : '')}
                        onClick={() => setSelectedPeriod(g.period)}
                      >
                        {g.period}
                      </Button>
                    ))}
                  </div>

                  {/* Radar Chart */}
                  {radarData.length > 0 && (
                    <AnimatedCard>
                      <div className="p-4 sm:p-6">
                        <h3 className={cn('text-sm font-bold mb-4', getAccentText(role))}>
                          Growth Radar — {selectedPeriod || 'Latest'}
                        </h3>
                        <div className="h-72 sm:h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                              <PolarGrid stroke="#e5e7eb" />
                              <PolarAngleAxis
                                dataKey="dimension"
                                tick={{ fontSize: 11, fill: '#6b7280' }}
                              />
                              <PolarRadiusAxis
                                angle={30}
                                domain={[0, 100]}
                                tick={{ fontSize: 9, fill: '#9ca3af' }}
                              />
                              <Radar
                                name="Score"
                                dataKey="value"
                                stroke={theme.primary}
                                fill={theme.primary}
                                fillOpacity={0.2}
                                strokeWidth={2}
                              />
                              <RechartsTooltip />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Dimension Bars */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                          {radarData.map((d) => {
                            const colorKey = d.dimension.toLowerCase();
                            const colors = GROWTH_COLORS[colorKey] || { bg: 'bg-gray-100', text: 'text-gray-700', hex: '#9ca3af' };
                            return (
                              <div key={d.dimension} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                                <div className={cn('h-2 w-2 rounded-full flex-shrink-0')} style={{ backgroundColor: colors.hex }} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] text-muted-foreground">{d.dimension}</p>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${d.value}%`, backgroundColor: colors.hex }}
                                      />
                                    </div>
                                    <span className="text-xs font-bold">{d.value}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {selectedGrowth?.comments && (
                          <div className="mt-4 p-3 rounded-lg bg-gray-50 border">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Teacher Comments</p>
                            <p className="text-sm">{selectedGrowth.comments}</p>
                          </div>
                        )}
                      </div>
                    </AnimatedCard>
                  )}

                  {/* Overall Score */}
                  {selectedGrowth?.overall && (
                    <div className={cn('rounded-xl border p-4 text-center', getAccentBg(role))}>
                      <p className="text-xs text-muted-foreground">Overall Score</p>
                      <p className={cn('text-3xl font-bold', getAccentText(role))}>{Math.round(selectedGrowth.overall)}</p>
                      <p className="text-xs text-muted-foreground mt-1">out of 100</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          {/* ── Certificates Tab ── */}
          <TabsContent value="certificates">
            <div className="space-y-4">
              {canIssueCert && (
                <Button size="sm" className={cn('gap-1.5', getAccentClass(role))} onClick={() => setShowAddCertificate(true)}>
                  <Plus className="h-3.5 w-3.5" /> Issue Certificate
                </Button>
              )}

              {certificates.length === 0 ? (
                <EmptyState
                  icon={<Award className="h-12 w-12" />}
                  title="No certificates yet"
                  description="Issued certificates will appear here"
                  action={
                    canIssueCert ? (
                      <Button size="sm" className={getAccentClass(role)} onClick={() => setShowAddCertificate(true)}>
                        Issue First Certificate
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {certificates.map((cert, idx) => (
                    <AnimatedCard key={cert.id} delay={idx * 0.05}>
                      <div className="p-5 flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                          <Award className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm">{cert.title}</h3>
                          {cert.template && (
                            <Badge variant="outline" className="mt-1 text-[10px]">{cert.template}</Badge>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-1.5">
                            Issued: {formatDate(cert.issuedAt || cert.createdAt)}
                          </p>
                          {cert.pdfUrl && (
                            <Button size="sm" variant="outline" className="mt-2 text-xs gap-1.5" asChild>
                              <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-3 w-3" /> Download PDF
                              </a>
                            </Button>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0 mt-1" />
                      </div>
                    </AnimatedCard>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* ── Add Memory Dialog ── */}
        <AddMemoryDialog
          open={showAddMemory}
          onClose={() => setShowAddMemory(false)}
          studentId={studentId}
          onSaved={fetchPassport}
          role={role}
        />

        {/* ── Add Achievement Dialog ── */}
        <AddAchievementDialog
          open={showAddAchievement}
          onClose={() => setShowAddAchievement(false)}
          studentId={studentId}
          onSaved={fetchPassport}
          role={role}
        />

        {/* ── Add Certificate Dialog ── */}
        <AddCertificateDialog
          open={showAddCertificate}
          onClose={() => setShowAddCertificate(false)}
          studentId={studentId}
          onSaved={fetchPassport}
        />

        {/* ── Mark Milestone Dialog ── */}
        <MarkMilestoneDialog
          milestone={showMarkMilestone}
          onClose={() => setShowMarkMilestone(null)}
          studentId={studentId}
          onSaved={fetchPassport}
        />
      </div>
    </PageTransition>
  );
}

// ============================================================
// REACTION BAR COMPONENT
// ============================================================

function ReactionBar({
  targetType,
  targetId,
  reactions,
  canReact,
  onReact,
}: {
  targetType: string;
  targetId: string;
  reactions: Reaction[];
  canReact: boolean;
  onReact: (targetType: string, targetId: string, reaction: string) => void;
}) {
  // Count reactions by type
  const reactionCounts = reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.reaction] = (acc[r.reaction] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Show existing reactions with counts */}
      {Object.entries(reactionCounts).map(([type, count]) => {
        const config = REACTION_EMOJIS[type];
        if (!config) return null;
        return (
          <button
            key={type}
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all',
              'bg-gray-100 hover:bg-gray-200 border border-transparent hover:border-gray-300'
            )}
            onClick={() => canReact && onReact(targetType, targetId, type)}
            disabled={!canReact}
            title={canReact ? `React with ${config.label}` : config.label}
          >
            <span className="text-sm">{config.emoji}</span>
            {count > 0 && <span className="text-[10px] text-muted-foreground font-medium">{count}</span>}
          </button>
        );
      })}

      {/* Add reaction buttons (parents only) */}
      {canReact && (
        <div className="flex items-center gap-0.5 ml-1">
          {Object.entries(REACTION_EMOJIS).map(([type, config]) => (
            <button
              key={type}
              className="h-6 w-6 rounded-full hover:bg-gray-100 flex items-center justify-center transition-all text-sm opacity-60 hover:opacity-100"
              onClick={() => onReact(targetType, targetId, type)}
              title={config.label}
            >
              {config.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// ADD MEMORY DIALOG
// ============================================================

function AddMemoryDialog({
  open,
  onClose,
  studentId,
  onSaved,
  role,
}: {
  open: boolean;
  onClose: () => void;
  studentId: string;
  onSaved: () => void;
  role: string;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [mediaUrl, setMediaUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('preone_token');
      if (!token) return;

      const res = await fetch(`/api/passport/${studentId}/memories`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          date: date || undefined,
          mediaUrl: mediaUrl.trim() || undefined,
          mediaType: mediaUrl.trim() ? 'image' : undefined,
        }),
      });

      if (res.ok) {
        toast.success('Memory added! 📸');
        onSaved();
        onClose();
        setTitle('');
        setDescription('');
        setMediaUrl('');
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to add memory' }));
        toast.error(err.error || 'Failed to add memory');
      }
    } catch {
      toast.error('Error adding memory');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed inset-x-4 top-[10%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 bg-white rounded-2xl shadow-xl border overflow-hidden"
          >
            <div className={cn('flex items-center justify-between px-5 py-4 border-b', getAccentBg(role))}>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Camera className="h-4 w-4" /> Add Memory
              </h3>
              <button onClick={onClose} className="p-1 rounded-md hover:bg-black/5">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="A beautiful moment..."
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell the story behind this memory..."
                  className="text-sm min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Photo URL</label>
                  <Input
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="https://..."
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 px-5 py-4 border-t bg-gray-50">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className={cn('flex-1', getAccentClass(role))} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Add Memory'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// ADD ACHIEVEMENT DIALOG
// ============================================================

function AddAchievementDialog({
  open,
  onClose,
  studentId,
  onSaved,
  role,
}: {
  open: boolean;
  onClose: () => void;
  studentId: string;
  onSaved: () => void;
  role: string;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🏆');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const emojiOptions = ['🏆', '⭐', '🌟', '🎨', '🎵', '📚', '💪', '🧠', '🏃', '🎪', '🌈', '🎭', '🦋', '🌱', '🚀', '💎'];

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('preone_token');
      if (!token) return;

      const res = await fetch(`/api/passport/${studentId}/achievements`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          icon: icon || undefined,
          date: date || undefined,
        }),
      });

      if (res.ok) {
        toast.success('Achievement unlocked! 🏆');
        onSaved();
        onClose();
        setTitle('');
        setDescription('');
        setIcon('🏆');
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to add achievement' }));
        toast.error(err.error || 'Failed to add achievement');
      }
    } catch {
      toast.error('Error adding achievement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed inset-x-4 top-[10%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 bg-white rounded-2xl shadow-xl border overflow-hidden"
          >
            <div className={cn('flex items-center justify-between px-5 py-4 border-b', getAccentBg(role))}>
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Trophy className="h-4 w-4" /> Add Achievement
              </h3>
              <button onClick={onClose} className="p-1 rounded-md hover:bg-black/5">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="First Steps!"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this achievement..."
                  className="text-sm min-h-[60px]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Icon</label>
                <div className="flex flex-wrap gap-1.5">
                  {emojiOptions.map((e) => (
                    <button
                      key={e}
                      className={cn(
                        'h-8 w-8 rounded-lg text-lg flex items-center justify-center border transition-all',
                        icon === e ? 'border-amber-400 bg-amber-50 scale-110' : 'border-gray-200 hover:border-gray-300'
                      )}
                      onClick={() => setIcon(e)}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Date</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-sm" />
              </div>
            </div>
            <div className="flex gap-2 px-5 py-4 border-t bg-gray-50">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className={cn('flex-1', getAccentClass(role))} onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Add Achievement'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// ADD CERTIFICATE DIALOG (Admin only)
// ============================================================

function AddCertificateDialog({
  open,
  onClose,
  studentId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  studentId: string;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('preone_token');
      if (!token) return;

      const res = await fetch(`/api/passport/${studentId}/certificates`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          template: template.trim() || undefined,
          pdfUrl: pdfUrl.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast.success('Certificate issued! 🎓');
        onSaved();
        onClose();
        setTitle('');
        setTemplate('');
        setPdfUrl('');
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to issue certificate' }));
        toast.error(err.error || 'Failed to issue certificate');
      }
    } catch {
      toast.error('Error issuing certificate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed inset-x-4 top-[15%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 bg-white rounded-2xl shadow-xl border overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b bg-purple-50">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Award className="h-4 w-4" /> Issue Certificate
              </h3>
              <button onClick={onClose} className="p-1 rounded-md hover:bg-black/5">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Title *</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Certificate of Excellence"
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Template</label>
                <Input
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  placeholder="graduation, achievement, etc."
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">PDF URL</label>
                <Input
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  placeholder="https://..."
                  className="text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 px-5 py-4 border-t bg-gray-50">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-white" onClick={handleSave} disabled={saving}>
                {saving ? 'Issuing...' : 'Issue Certificate'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================
// MARK MILESTONE DIALOG
// ============================================================

function MarkMilestoneDialog({
  milestone,
  onClose,
  studentId,
  onSaved,
}: {
  milestone: MilestoneEntry | null;
  onClose: () => void;
  studentId: string;
  onSaved: () => void;
}) {
  const [achievedDate, setAchievedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!milestone) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('preone_token');
      if (!token) return;

      const res = await fetch(`/api/passport/${studentId}/milestones`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId: milestone.id,
          achievedDate: achievedDate || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast.success('Milestone achieved! 🎯');
        onSaved();
        onClose();
        setNotes('');
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to mark milestone' }));
        toast.error(err.error || 'Failed to mark milestone');
      }
    } catch {
      toast.error('Error marking milestone');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {milestone && (
        <>
          <div className="fixed inset-0 bg-black/30 z-50" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed inset-x-4 top-[20%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 bg-white rounded-2xl shadow-xl border overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b bg-emerald-50">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-600" /> Mark Milestone Achieved
              </h3>
              <button onClick={onClose} className="p-1 rounded-md hover:bg-black/5">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="font-semibold text-sm text-emerald-800">{milestone.name}</p>
                {milestone.description && (
                  <p className="text-xs text-emerald-600 mt-1">{milestone.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="outline" className="text-[9px]">{milestone.ageGroup}</Badge>
                  <Badge variant="outline" className="text-[9px] capitalize">{milestone.category}</Badge>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Achieved Date</label>
                <Input type="date" value={achievedDate} onChange={(e) => setAchievedDate(e.target.value)} className="text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any observations or notes..."
                  className="text-sm min-h-[60px]"
                />
              </div>
            </div>
            <div className="flex gap-2 px-5 py-4 border-t bg-gray-50">
              <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Mark Achieved'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
