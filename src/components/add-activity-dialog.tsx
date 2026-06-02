'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Clock, MapPin, BookOpen, Package } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { ACTIVITY_COLORS } from '@/lib/theme-tokens';

// ── Constants ──
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

interface ClassInfo {
  id: string;
  name: string;
  program: { name: string };
}

interface AddActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivityCreated: () => void;
  defaultDate?: Date | null;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

export function AddActivityDialog({ open, onOpenChange, onActivityCreated, defaultDate }: AddActivityDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState<ClassInfo[]>([]);

  const [form, setForm] = useState({
    title: '',
    type: '',
    description: '',
    date: null as Date | null,
    startTime: '',
    endTime: '',
    classId: '',
    location: '',
    materials: '',
    learningOutcomes: '',
    isPublished: true,
    publishSchedule: null as Date | null,
  });

  // ── Fetch classes ──
  useEffect(() => {
    async function fetchClasses() {
      try {
        const token = getToken();
        const res = await fetch('/api/classes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setClasses(data.classes || []);
        }
      } catch (err) {
        console.error('Failed to fetch classes:', err);
      }
    }
    if (open) fetchClasses();
  }, [open]);

  // ── Reset form when dialog opens ──
  useEffect(() => {
    if (open) {
      setError('');
      setForm({
        title: '',
        type: '',
        description: '',
        date: defaultDate || null,
        startTime: '',
        endTime: '',
        classId: '',
        location: '',
        materials: '',
        learningOutcomes: '',
        isPublished: true,
        publishSchedule: null,
      });
    }
  }, [open, defaultDate]);

  const updateField = (field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError('');

    if (!form.title || form.title.trim().length < 2) {
      setError('Title is required');
      return;
    }
    if (!form.type) {
      setError('Type is required');
      return;
    }
    if (!form.date) {
      setError('Date is required');
      return;
    }
    if (!form.startTime || !form.endTime) {
      setError('Start and end time are required');
      return;
    }

    setSubmitting(true);
    try {
      const token = getToken();
      const payload = {
        title: form.title.trim(),
        type: form.type,
        description: form.description.trim() || undefined,
        date: form.date.toISOString(),
        startTime: form.startTime,
        endTime: form.endTime,
        classId: form.classId || undefined,
        location: form.location.trim() || undefined,
        materials: form.materials.trim() || undefined,
        learningOutcomes: form.learningOutcomes.trim() || undefined,
        isPublished: form.isPublished,
        publishedAt: form.isPublished && form.publishSchedule ? form.publishSchedule.toISOString() : undefined,
        status: 'UPCOMING',
      };

      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create activity');
      }

      onOpenChange(false);
      onActivityCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create activity');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add New Activity</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="Activity title" />
            </div>
            <div>
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={(v) => updateField('type', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Description *</Label>
            <Textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Describe the activity..." rows={3} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !form.date && 'text-muted-foreground')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.date ? format(form.date, 'dd MMM yyyy') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={form.date || undefined} onSelect={(d) => updateField('date', d)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Start Time *</Label>
              <Input type="time" value={form.startTime} onChange={(e) => updateField('startTime', e.target.value)} />
            </div>
            <div>
              <Label>End Time *</Label>
              <Input type="time" value={form.endTime} onChange={(e) => updateField('endTime', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Class</Label>
              <Select value={form.classId} onValueChange={(v) => updateField('classId', v === 'NONE' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">All Classes</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.program.name})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => updateField('location', e.target.value)} placeholder="e.g., Art Room" />
            </div>
          </div>

          <div>
            <Label>Materials Needed</Label>
            <Textarea value={form.materials} onChange={(e) => updateField('materials', e.target.value)} placeholder="List materials..." rows={2} />
          </div>

          <div>
            <Label>Learning Outcomes</Label>
            <Textarea value={form.learningOutcomes} onChange={(e) => updateField('learningOutcomes', e.target.value)} placeholder="What will children learn?" rows={2} />
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => updateField('isPublished', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Publish to Parents</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end mt-6 pt-4 border-t gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="gap-1 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover">
            {submitting ? 'Creating...' : 'Create Activity'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
