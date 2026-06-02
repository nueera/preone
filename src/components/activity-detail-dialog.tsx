'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  CalendarIcon,
  Clock,
  MapPin,
  BookOpen,
  Package,
  Pencil,
  Trash2,
  Globe,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ACTIVITY_COLORS } from '@/lib/theme-tokens';

// ── Types ──
interface ActivityClass {
  id: string;
  name: string;
  program: { name: string };
}

interface Activity {
  id: string;
  title: string;
  type: string;
  description: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  materials: string | null;
  learningOutcomes: string | null;
  media: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  status: string;
  classId: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  class: ActivityClass | null;
}

interface ActivityDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity | null;
  onActivityChanged: () => void;
}

// ── Constants — using centralized theme tokens ──
const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ART: { label: 'Art', color: ACTIVITY_COLORS.ART?.text ?? 'text-pink-700', bg: ACTIVITY_COLORS.ART ? `${ACTIVITY_COLORS.ART.bg} border-pink-200` : 'bg-pink-50 border-pink-200' },
  MUSIC: { label: 'Music', color: ACTIVITY_COLORS.MUSIC?.text ?? 'text-purple-700', bg: ACTIVITY_COLORS.MUSIC ? `${ACTIVITY_COLORS.MUSIC.bg} border-purple-200` : 'bg-purple-50 border-purple-200' },
  DANCE: { label: 'Dance', color: ACTIVITY_COLORS.DANCE?.text ?? 'text-orange-700', bg: ACTIVITY_COLORS.DANCE ? `${ACTIVITY_COLORS.DANCE.bg} border-orange-200` : 'bg-orange-50 border-orange-200' },
  SPORTS: { label: 'Sports', color: ACTIVITY_COLORS.SPORTS?.text ?? 'text-green-700', bg: ACTIVITY_COLORS.SPORTS ? `${ACTIVITY_COLORS.SPORTS.bg} border-green-200` : 'bg-green-50 border-green-200' },
  ACADEMIC: { label: 'Academic', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  OUTDOOR: { label: 'Outdoor', color: ACTIVITY_COLORS.OUTDOOR?.text ?? 'text-teal-700', bg: ACTIVITY_COLORS.OUTDOOR ? `${ACTIVITY_COLORS.OUTDOOR.bg} border-teal-200` : 'bg-teal-50 border-teal-200' },
  INDOOR: { label: 'Indoor', color: ACTIVITY_COLORS.INDOOR?.text ?? 'text-indigo-700', bg: ACTIVITY_COLORS.INDOOR ? `${ACTIVITY_COLORS.INDOOR.bg} border-indigo-200` : 'bg-indigo-50 border-indigo-200' },
  CRAFT: { label: 'Craft', color: ACTIVITY_COLORS.CRAFT?.text ?? 'text-yellow-700', bg: ACTIVITY_COLORS.CRAFT ? `${ACTIVITY_COLORS.CRAFT.bg} border-yellow-200` : 'bg-yellow-50 border-yellow-200' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  UPCOMING: { label: 'Upcoming', color: 'text-blue-600', bg: 'bg-blue-50' },
  ONGOING: { label: 'Ongoing', color: 'text-green-600', bg: 'bg-green-50' },
  COMPLETED: { label: 'Completed', color: 'text-gray-600', bg: 'bg-gray-50' },
  CANCELLED: { label: 'Cancelled', color: 'text-red-600', bg: 'bg-red-50' },
};

const ACTIVITY_TYPES = [
  { value: 'ART', label: 'Art' },
  { value: 'MUSIC', label: 'Music' },
  { value: 'DANCE', label: 'Dance' },
  { value: 'SPORTS', label: 'Sports' },
  { value: 'ACADEMIC', label: 'Academic' },
  { value: 'OUTDOOR', label: 'Outdoor' },
  { value: 'INDOOR', label: 'Indoor' },
  { value: 'CRAFT', label: 'Craft' },
];

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

export function ActivityDetailDialog({ open, onOpenChange, activity, onActivityChanged }: ActivityDetailDialogProps) {
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    type: '',
    description: '',
    startTime: '',
    endTime: '',
    location: '',
    materials: '',
    learningOutcomes: '',
    status: '',
    isPublished: false,
  });

  useEffect(() => {
    if (open && activity) {
      setForm({
        title: activity.title,
        type: activity.type,
        description: activity.description || '',
        startTime: activity.startTime || '',
        endTime: activity.endTime || '',
        location: activity.location || '',
        materials: activity.materials || '',
        learningOutcomes: activity.learningOutcomes || '',
        status: activity.status,
        isPublished: activity.isPublished,
      });
      setEditMode(false);
      setDeleteConfirm(false);
      setError('');
    }
  }, [open, activity]);

  if (!activity) return null;

  const typeCfg = TYPE_CONFIG[activity.type] || TYPE_CONFIG.ART;
  const statusCfg = STATUS_CONFIG[activity.status] || STATUS_CONFIG.UPCOMING;

  const handleSave = async () => {
    if (!activity) return;
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/activities/${activity.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          description: form.description || null,
          startTime: form.startTime || null,
          endTime: form.endTime || null,
          location: form.location || null,
          materials: form.materials || null,
          learningOutcomes: form.learningOutcomes || null,
          status: form.status,
          isPublished: form.isPublished,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update activity');
      }

      setEditMode(false);
      onActivityChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activity) return;
    try {
      const token = getToken();
      const res = await fetch(`/api/activities/${activity.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDeleteConfirm(false);
        onOpenChange(false);
        onActivityChanged();
      }
    } catch (err) {
      console.error('Failed to delete activity:', err);
    }
  };

  const handlePublish = async () => {
    if (!activity) return;
    try {
      const token = getToken();
      const res = await fetch(`/api/activities/${activity.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublished: true }),
      });
      if (res.ok) {
        onActivityChanged();
      }
    } catch (err) {
      console.error('Failed to publish activity:', err);
    }
  };

  const updateField = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-bold">{activity.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={cn('text-xs', typeCfg.bg, typeCfg.color)}>{typeCfg.label}</Badge>
                <Badge variant="outline" className={cn('text-xs', statusCfg.bg, statusCfg.color)}>{statusCfg.label}</Badge>
                {activity.isPublished ? (
                  <Badge className="bg-green-50 text-green-700 text-xs border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />Published
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-gray-400">Draft</Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
        )}

        {editMode ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Title</Label>
                <Input className="h-8 text-sm" value={form.title} onChange={(e) => updateField('title', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Type</Label>
                <Select value={form.type} onValueChange={(v) => updateField('type', v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea className="text-sm" value={form.description} onChange={(e) => updateField('description', e.target.value)} rows={3} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Start Time</Label>
                <Input type="time" className="h-8 text-sm" value={form.startTime} onChange={(e) => updateField('startTime', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">End Time</Label>
                <Input type="time" className="h-8 text-sm" value={form.endTime} onChange={(e) => updateField('endTime', e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={(v) => updateField('status', v)}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPCOMING">Upcoming</SelectItem>
                    <SelectItem value="ONGOING">Ongoing</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs">Location</Label>
              <Input className="h-8 text-sm" value={form.location} onChange={(e) => updateField('location', e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Materials</Label>
              <Textarea className="text-sm" value={form.materials} onChange={(e) => updateField('materials', e.target.value)} rows={2} />
            </div>
            <div>
              <Label className="text-xs">Learning Outcomes</Label>
              <Textarea className="text-sm" value={form.learningOutcomes} onChange={(e) => updateField('learningOutcomes', e.target.value)} rows={2} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isPublished} onChange={(e) => updateField('isPublished', e.target.checked)} className="rounded" />
              <span className="text-sm">Published to Parents</span>
            </label>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-brand-gradient text-white border-0">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Info rows */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{format(new Date(activity.date), 'dd MMMM yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {activity.startTime && activity.endTime ? `${activity.startTime} - ${activity.endTime}` : 'Time not set'}
                </span>
              </div>
              {activity.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{activity.location}</span>
                </div>
              )}
              <div className="text-sm text-gray-600">
                Class: {activity.class?.name || 'All Classes'}
              </div>
            </div>

            <Separator />

            {activity.description && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1">Description</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{activity.description}</p>
              </div>
            )}

            {activity.learningOutcomes && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <BookOpen className="h-4 w-4" /> Learning Outcomes
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">{activity.learningOutcomes}</p>
              </div>
            )}

            {activity.materials && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Package className="h-4 w-4" /> Materials Needed
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">{activity.materials}</p>
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)} className="gap-1">
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              {!activity.isPublished && (
                <Button size="sm" onClick={handlePublish} className="gap-1 bg-green-600 text-white hover:bg-green-700">
                  <Globe className="h-3.5 w-3.5" /> Publish to Parents
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-red-500 hover:text-red-600 hover:bg-red-50 ml-auto"
                onClick={() => setDeleteConfirm(true)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>

            {activity.publishedAt && (
              <p className="text-xs text-gray-400">
                Published on {format(new Date(activity.publishedAt), 'dd MMM yyyy, hh:mm a')}
              </p>
            )}
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteConfirm && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 mb-2 flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Are you sure you want to delete &quot;{activity.title}&quot;?
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
