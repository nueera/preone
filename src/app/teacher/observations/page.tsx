'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  Plus,
  Search,
  Trash2,
  Edit3,
  Share2,
  ShieldOff,
  AlertTriangle,
  Filter,
  X,
  ChevronDown,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  Tag,
  Star,
  FileText,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// ── Types ──
type ObservationCategory = 'BEHAVIORAL' | 'ACADEMIC' | 'SOCIAL' | 'EMOTIONAL' | 'PHYSICAL' | 'COGNITIVE';
type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'CONCERN';

interface ObservationRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentPhoto: string | null;
  studentRollNumber: string | null;
  className: string;
  category: ObservationCategory;
  content: string;
  priority: Priority;
  isShared: boolean;
  parentAck: boolean;
  parentComment: string | null;
  media: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StudentOption {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  rollNumber: string | null;
}

interface ObservationsData {
  observations: ObservationRecord[];
  className: string;
  total: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ── Category Config ──
const CATEGORY_CONFIG: Record<ObservationCategory, { label: string; color: string; bg: string; border: string; icon: string; guidance: string }> = {
  BEHAVIORAL: {
    label: 'Behavioral',
    color: 'text-orange-700',
    bg: 'bg-orange-100',
    border: 'border-orange-300',
    icon: '🧠',
    guidance: 'Describe the behavior, when it occurred, and context',
  },
  ACADEMIC: {
    label: 'Academic',
    color: 'text-blue-700',
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    icon: '📚',
    guidance: 'Note learning progress, areas of strength/weakness',
  },
  SOCIAL: {
    label: 'Social',
    color: 'text-green-700',
    bg: 'bg-green-100',
    border: 'border-green-300',
    icon: '🤝',
    guidance: 'Describe interaction with peers, sharing, cooperation',
  },
  EMOTIONAL: {
    label: 'Emotional',
    color: 'text-purple-700',
    bg: 'bg-purple-100',
    border: 'border-purple-300',
    icon: '💜',
    guidance: 'Note emotional responses, triggers, coping',
  },
  PHYSICAL: {
    label: 'Physical',
    color: 'text-teal-700',
    bg: 'bg-teal-100',
    border: 'border-teal-300',
    icon: '🏃',
    guidance: 'Describe motor skills, coordination, health observations',
  },
  COGNITIVE: {
    label: 'Cognitive',
    color: 'text-pink-700',
    bg: 'bg-pink-100',
    border: 'border-pink-300',
    icon: '💡',
    guidance: 'Note problem-solving, reasoning, attention span',
  },
};

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; border: string; dot: string }> = {
  LOW:    { label: 'Low',    color: 'text-gray-600',   bg: 'bg-gray-100',   border: 'border-gray-300',   dot: 'bg-gray-400' },
  NORMAL: { label: 'Normal', color: 'text-blue-700',   bg: 'bg-blue-100',   border: 'border-blue-300',   dot: 'bg-blue-500' },
  HIGH:   { label: 'High',   color: 'text-orange-700', bg: 'bg-orange-100', border: 'border-orange-300', dot: 'bg-orange-500' },
  CONCERN:{ label: 'Concern',color: 'text-red-700',    bg: 'bg-red-100',    border: 'border-red-300',    dot: 'bg-red-500' },
};

// ── Helpers ──
function getInitials(name: string): string {
  return name.split(' ').map((n) => n.charAt(0)).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function truncate(str: string, len: number): string {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

/**
 * ObservationsContent — Inner component that uses useSearchParams
 */
function ObservationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedStudent = searchParams.get('student');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [data, setData] = useState<ObservationsData | null>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterShared, setFilterShared] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStudentId, setActiveStudentId] = useState<string | null>(preselectedStudent);

  // Create dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({
    studentId: '',
    category: '' as ObservationCategory | '',
    content: '',
    priority: 'NORMAL' as Priority,
    isShared: false,
  });
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [creating, setCreating] = useState(false);

  // Detail dialog
  const [selectedObservation, setSelectedObservation] = useState<ObservationRecord | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  // Edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    category: '' as ObservationCategory | '',
    content: '',
    priority: 'NORMAL' as Priority,
  });
  const [editing, setEditing] = useState(false);

  // Delete confirmation
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ObservationRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Share confirmation
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareTarget, setShareTarget] = useState<ObservationRecord | null>(null);
  const [sharing, setSharing] = useState(false);

  // ── Fetch observations ──
  const fetchObservations = useCallback(async () => {
    const token = localStorage.getItem('preone_token');
    if (!token) { router.push('/login'); return; }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (activeStudentId) params.set('studentId', activeStudentId);
      if (filterCategory !== 'all') params.set('category', filterCategory);
      if (filterPriority !== 'all') params.set('priority', filterPriority);
      if (filterShared !== 'all') params.set('isShared', filterShared);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/teacher/observations?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to load observations');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [router, activeStudentId, filterCategory, filterPriority, filterShared, searchQuery]);

  useEffect(() => {
    fetchObservations();
  }, [fetchObservations]);

  // ── Fetch students for create dialog ──
  const fetchStudents = useCallback(async () => {
    const token = localStorage.getItem('preone_token');
    if (!token) return;

    try {
      const res = await fetch('/api/teacher/class', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      const studentList = (json.students || []).map((s: any) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        photo: s.photo,
        rollNumber: s.rollNumber,
      }));
      setStudents(studentList);

      // Pre-select student if from query param
      if (preselectedStudent && !createForm.studentId) {
        setCreateForm((prev) => ({ ...prev, studentId: preselectedStudent }));
      }
    } catch {
      // silently fail
    }
  }, [preselectedStudent]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // ── Create observation ──
  const handleCreate = async () => {
    if (!createForm.studentId || !createForm.category || !createForm.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (createForm.content.trim().length < 10) {
      toast.error('Content must be at least 10 characters');
      return;
    }

    const token = localStorage.getItem('preone_token');
    if (!token) return;

    try {
      setCreating(true);
      const res = await fetch('/api/teacher/observations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: createForm.studentId,
          category: createForm.category,
          content: createForm.content,
          priority: createForm.priority,
          isShared: createForm.isShared,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create');
      }

      toast.success('Observation created successfully');
      setShowCreateDialog(false);
      setCreateForm({
        studentId: activeStudentId || '',
        category: '',
        content: '',
        priority: 'NORMAL',
        isShared: false,
      });
      await fetchObservations();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create observation');
    } finally {
      setCreating(false);
    }
  };

  // ── Edit observation ──
  const handleEdit = async () => {
    const token = localStorage.getItem('preone_token');
    if (!token || !editForm.id) return;

    try {
      setEditing(true);
      const res = await fetch(`/api/teacher/observations/${editForm.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: editForm.category,
          content: editForm.content,
          priority: editForm.priority,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update');
      }

      toast.success('Observation updated successfully');
      setShowEditDialog(false);
      await fetchObservations();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setEditing(false);
    }
  };

  // ── Delete observation ──
  const handleDelete = async () => {
    const token = localStorage.getItem('preone_token');
    if (!token || !deleteTarget) return;

    try {
      setDeleting(true);
      const res = await fetch(`/api/teacher/observations/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete');
      }

      toast.success('Observation deleted');
      setShowDeleteDialog(false);
      setDeleteTarget(null);
      setShowDetailDialog(false);
      await fetchObservations();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  // ── Share/Unshare observation ──
  const handleShare = async () => {
    const token = localStorage.getItem('preone_token');
    if (!token || !shareTarget) return;

    try {
      setSharing(true);
      const willShare = !shareTarget.isShared;
      const res = await fetch(`/api/teacher/observations/${shareTarget.id}/share`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isShared: willShare }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update');
      }

      toast.success(willShare ? 'Observation shared with parent' : 'Observation unshared from parent');
      setShowShareDialog(false);
      setShareTarget(null);
      await fetchObservations();
      // Update detail view if open
      if (selectedObservation?.id === shareTarget.id) {
        setSelectedObservation((prev) => prev ? { ...prev, isShared: willShare } : null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update sharing');
    } finally {
      setSharing(false);
    }
  };

  // ── Open edit dialog ──
  const openEdit = (obs: ObservationRecord) => {
    setEditForm({
      id: obs.id,
      category: obs.category,
      content: obs.content,
      priority: obs.priority,
    });
    setShowEditDialog(true);
  };

  // ── Loading state ──
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Observations</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button
          onClick={fetchObservations}
          className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
        >
          Retry
        </Button>
      </div>
    );
  }

  const hasActiveFilters = filterCategory !== 'all' || filterPriority !== 'all' || filterShared !== 'all' || searchQuery || activeStudentId;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Eye className="h-5 w-5 text-emerald-500" />
                Observations
                {activeStudentId && data?.observations[0] && (
                  <span className="text-sm font-normal text-gray-500">
                    — {data.observations[0].studentName}
                  </span>
                )}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {data?.className || 'Class'} | {data?.total || 0} Observations
              </p>
            </div>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> Create Observation
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search student or content..."
                className="pl-8 h-8 text-xs rounded-xl"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[140px] h-8 text-xs rounded-xl">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    {cfg.icon} {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[120px] h-8 text-xs rounded-xl">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterShared} onValueChange={setFilterShared}>
              <SelectTrigger className="w-[130px] h-8 text-xs rounded-xl">
                <SelectValue placeholder="Shared" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Shared</SelectItem>
                <SelectItem value="false">Not Shared</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs rounded-xl text-gray-500 hover:text-gray-700 h-8"
                onClick={() => {
                  setFilterCategory('all');
                  setFilterPriority('all');
                  setFilterShared('all');
                  setSearchQuery('');
                  setActiveStudentId(null);
                }}
              >
                <X className="h-3 w-3 mr-1" /> Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Observations List ── */}
      {!data || data.observations.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-16 text-center">
            <Eye className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No Observations Found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {hasActiveFilters
                ? 'Try adjusting your filters to see more results'
                : 'Create your first observation to get started'}
            </p>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> Create Observation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.observations.map((obs) => {
            const catConfig = CATEGORY_CONFIG[obs.category];
            const priConfig = PRIORITY_CONFIG[obs.priority];

            return (
              <Card key={obs.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Student avatar */}
                    <Avatar className="h-10 w-10 shrink-0 mt-0.5">
                      {obs.studentPhoto ? (
                        <AvatarImage src={obs.studentPhoto} alt={obs.studentName} />
                      ) : (
                        <AvatarFallback className="bg-emerald-50 text-emerald-700 text-xs font-semibold">
                          {getInitials(obs.studentName)}
                        </AvatarFallback>
                      )}
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-gray-900">{obs.studentName}</span>
                        <span className="text-xs text-gray-400">Roll: {obs.studentRollNumber || '-'}</span>
                        <span className="text-xs text-gray-400">|</span>
                        <span className="text-xs text-gray-400">{obs.className}</span>
                      </div>

                      {/* Category + Priority badges */}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${catConfig.bg} ${catConfig.color} ${catConfig.border} border text-[10px] px-2 py-0.5 rounded-md font-medium`}>
                          {catConfig.icon} {catConfig.label}
                        </Badge>
                        <Badge className={`${priConfig.bg} ${priConfig.color} ${priConfig.border} border text-[10px] px-2 py-0.5 rounded-md font-medium`}>
                          {obs.priority === 'CONCERN' && (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-pulse" />
                          )}
                          {priConfig.label}
                        </Badge>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formatDate(obs.createdAt)}
                        </span>
                      </div>

                      {/* Content preview */}
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {activeStudentId ? obs.content : truncate(obs.content, 150)}
                      </p>

                      {/* Shared status */}
                      <div className="flex items-center gap-3 mt-2">
                        {obs.isShared ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Shared
                            {obs.parentAck && (
                              <span className="text-emerald-700 font-medium" title="Parent acknowledged">
                                <CheckCircle2 className="h-3.5 w-3.5 ml-0.5" />
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <XCircle className="h-3.5 w-3.5" /> Not Shared
                          </span>
                        )}
                        {obs.parentComment && (
                          <span className="flex items-center gap-1 text-xs text-blue-600" title={obs.parentComment}>
                            <MessageSquare className="h-3 w-3" /> Parent commented
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
                        onClick={() => {
                          setSelectedObservation(obs);
                          setShowDetailDialog(true);
                        }}
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => openEdit(obs)}
                        title="Edit"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50"
                        onClick={() => {
                          setShareTarget(obs);
                          setShowShareDialog(true);
                        }}
                        title={obs.isShared ? 'Unshare' : 'Share with Parent'}
                      >
                        {obs.isShared ? <ShieldOff className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setDeleteTarget(obs);
                          setShowDeleteDialog(true);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Create Observation Dialog ── */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-600" />
              Create Observation
            </DialogTitle>
            <DialogDescription>
              Record a new observation about a student
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Student */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                Student <span className="text-red-500">*</span>
              </Label>
              <Select
                value={createForm.studentId}
                onValueChange={(v) => setCreateForm((prev) => ({ ...prev, studentId: v }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select a student..." />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} {s.rollNumber ? `(Roll: ${s.rollNumber})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={createForm.category}
                onValueChange={(v) => setCreateForm((prev) => ({ ...prev, category: v as ObservationCategory }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.icon} {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {createForm.category && CATEGORY_CONFIG[createForm.category] && (
                <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                  💡 {CATEGORY_CONFIG[createForm.category].guidance}
                </p>
              )}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                Content <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={createForm.content}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Describe your observation in detail..."
                className="min-h-[140px] rounded-xl text-sm resize-none"
              />
              <p className="text-[10px] text-gray-400 text-right">
                {createForm.content.length} characters (minimum 10)
              </p>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                Priority <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setCreateForm((prev) => ({ ...prev, priority: key }))}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                      ${createForm.priority === key
                        ? `${cfg.bg} ${cfg.color} ${cfg.border} shadow-sm`
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                      }
                    `}
                  >
                    {key === 'CONCERN' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-pulse" />}
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Share with Parent */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <Label className="text-xs font-medium">Share with Parent</Label>
                <p className="text-[10px] text-gray-500">Parent will be notified when shared</p>
              </div>
              <Switch
                checked={createForm.isShared}
                onCheckedChange={(checked) => setCreateForm((prev) => ({ ...prev, isShared: checked }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              onClick={handleCreate}
              disabled={creating || !createForm.studentId || !createForm.category || createForm.content.trim().length < 10}
            >
              {creating ? 'Creating...' : 'Create Observation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Observation Detail Dialog ── */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          {selectedObservation && (() => {
            const catConfig = CATEGORY_CONFIG[selectedObservation.category];
            const priConfig = PRIORITY_CONFIG[selectedObservation.priority];
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`${catConfig.bg} ${catConfig.color} ${catConfig.border} border text-xs px-2.5 py-1 rounded-md font-medium`}>
                      {catConfig.icon} {catConfig.label}
                    </Badge>
                    <Badge className={`${priConfig.bg} ${priConfig.color} ${priConfig.border} border text-xs px-2.5 py-1 rounded-md font-medium`}>
                      {selectedObservation.priority === 'CONCERN' && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1 animate-pulse" />
                      )}
                      {priConfig.label} Priority
                    </Badge>
                  </div>
                  <DialogTitle className="text-base">
                    {selectedObservation.studentName}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedObservation.className} | {formatDateTime(selectedObservation.createdAt)}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  {/* Content */}
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {selectedObservation.content}
                    </p>
                  </div>

                  {/* Parent Visibility */}
                  <div className="p-4 border border-gray-200 rounded-xl">
                    <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5" /> Parent Visibility
                    </h4>
                    {selectedObservation.isShared ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="font-medium">Shared with Parent</span>
                        </div>
                        {selectedObservation.parentAck ? (
                          <div className="bg-emerald-50 p-2.5 rounded-lg">
                            <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Parent has acknowledged this observation
                            </p>
                            {selectedObservation.parentComment && (
                              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" /> Parent comment: &quot;{selectedObservation.parentComment}&quot;
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">Not yet acknowledged by parent</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-500">Currently: Not Shared</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => {
                            setShareTarget(selectedObservation);
                            setShowShareDialog(true);
                          }}
                        >
                          <Share2 className="h-3 w-3 mr-1" /> Share with Parent
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setShowDetailDialog(false)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                    onClick={() => {
                      setShowDetailDialog(false);
                      openEdit(selectedObservation);
                    }}
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  {selectedObservation.isShared ? (
                    <Button
                      variant="outline"
                      className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
                      onClick={() => {
                        setShareTarget(selectedObservation);
                        setShowShareDialog(true);
                      }}
                    >
                      <ShieldOff className="h-3.5 w-3.5 mr-1" /> Unshare
                    </Button>
                  ) : (
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                      onClick={() => {
                        setShareTarget(selectedObservation);
                        setShowShareDialog(true);
                      }}
                    >
                      <Share2 className="h-3.5 w-3.5 mr-1" /> Share with Parent
                    </Button>
                  )}
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Edit Observation Dialog ── */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-blue-600" />
              Edit Observation
            </DialogTitle>
            <DialogDescription>Update the observation details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Category</Label>
              <Select
                value={editForm.category}
                onValueChange={(v) => setEditForm((prev) => ({ ...prev, category: v as ObservationCategory }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      {cfg.icon} {cfg.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Content</Label>
              <Textarea
                value={editForm.content}
                onChange={(e) => setEditForm((prev) => ({ ...prev, content: e.target.value }))}
                className="min-h-[120px] rounded-xl text-sm resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Priority</Label>
              <div className="flex items-center gap-2">
                {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG[Priority]][]).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setEditForm((prev) => ({ ...prev, priority: key }))}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                      ${editForm.priority === key
                        ? `${cfg.bg} ${cfg.color} ${cfg.border} shadow-sm`
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                      }
                    `}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              onClick={handleEdit}
              disabled={editing || editForm.content.trim().length < 10}
            >
              {editing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Share Confirmation Dialog ── */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {shareTarget?.isShared ? (
                <>
                  <ShieldOff className="h-5 w-5 text-amber-500" />
                  Unshare Observation
                </>
              ) : (
                <>
                  <Share2 className="h-5 w-5 text-emerald-500" />
                  Share with Parent
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {shareTarget?.isShared
                ? `Remove this ${CATEGORY_CONFIG[shareTarget.category as ObservationCategory]?.label.toLowerCase()} observation from parent view?`
                : `Share this ${CATEGORY_CONFIG[shareTarget?.category as ObservationCategory]?.label?.toLowerCase() || ''} observation with ${shareTarget?.studentName}'s parents?`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button
              className={shareTarget?.isShared
                ? 'bg-amber-600 hover:bg-amber-700 rounded-xl'
                : 'bg-emerald-600 hover:bg-emerald-700 rounded-xl'
              }
              onClick={handleShare}
              disabled={sharing}
            >
              {sharing ? 'Updating...' : shareTarget?.isShared ? 'Unshare' : 'Share'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Observation
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this observation?
              {deleteTarget?.isShared && (
                <span className="block mt-1 text-amber-600 font-medium">
                  This observation is shared with the parent.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 rounded-xl"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Default export wrapped in Suspense for useSearchParams ──
export default function ObservationsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48 rounded-xl" />
            <Skeleton className="h-10 w-40 rounded-xl" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      }
    >
      <ObservationsContent />
    </Suspense>
  );
}
