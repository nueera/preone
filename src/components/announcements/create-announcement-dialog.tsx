'use client';

import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Send,
  Loader2,
  Calendar,
  Clock,
  Image as ImageIcon,
  Paperclip,
  MessageSquare,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAnnouncementStore } from '@/lib/stores/announcement-store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── Types ──
interface Branch {
  id: string;
  name: string;
}

interface ClassItem {
  id: string;
  name: string;
  program?: { name: string };
}

interface CreateAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId?: string | null;
  defaultTarget?: string;
  restrictedTargets?: string[];
  onCreated?: () => void;
}

// ── Announcement Types Config ──
const ANNOUNCEMENT_TYPES = [
  { value: 'GENERAL', label: 'General', emoji: '📋' },
  { value: 'EVENT', label: 'Event', emoji: '🎉' },
  { value: 'HOLIDAY', label: 'Holiday', emoji: '🏖️' },
  { value: 'FEE_REMINDER', label: 'Fee Reminder', emoji: '💰' },
  { value: 'EMERGENCY', label: 'Emergency', emoji: '🚨' },
  { value: 'ACHIEVEMENT', label: 'Achievement', emoji: '🏆' },
  { value: 'CONCERN', label: 'Concern', emoji: '⚠️' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low', color: 'text-green-600' },
  { value: 'NORMAL', label: 'Normal', color: 'text-sky-600' },
  { value: 'HIGH', label: 'High', color: 'text-orange-600' },
  { value: 'CONCERN', label: 'Concern', color: 'text-red-600' },
];

const TARGET_OPTIONS = [
  { value: 'ALL', label: 'Everyone', icon: '👥' },
  { value: 'BRANCH', label: 'Branch', icon: '🏢' },
  { value: 'CLASS', label: 'Class', icon: '📚' },
  { value: 'TEACHERS', label: 'Teachers', icon: '👨‍🏫' },
  { value: 'PARENTS', label: 'Parents', icon: '👨‍👩‍👧' },
  { value: 'SPECIFIC', label: 'Specific People', icon: '🎯' },
];

const CHANNEL_OPTIONS = [
  { value: 'app', label: 'In-App' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
];

// ── Helper ──
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

// ── Component ──
export function CreateAnnouncementDialog({
  open,
  onOpenChange,
  editId,
  defaultTarget,
  restrictedTargets,
  onCreated,
}: CreateAnnouncementDialogProps) {
  const { createAnnouncement, updateAnnouncement } = useAnnouncementStore();

  // ── Form State ──
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('GENERAL');
  const [priority, setPriority] = useState('NORMAL');
  const [target, setTarget] = useState(defaultTarget || 'ALL');
  const [branchId, setBranchId] = useState('');
  const [classId, setClassId] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>(['app']);
  const [sendAsChat, setSendAsChat] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [saving, setSaving] = useState(false);

  // ── Dropdowns ──
  const [branches, setBranches] = useState<Branch[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  // ── Filtered target options ──
  const filteredTargets = restrictedTargets
    ? TARGET_OPTIONS.filter((t) => restrictedTargets.includes(t.value))
    : TARGET_OPTIONS;

  // ── Fetch branches and classes ──
  useEffect(() => {
    if (open) {
      fetchDropdownData();
    }
  }, [open]);

  const fetchDropdownData = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const [branchesRes, classesRes] = await Promise.all([
        fetch('/api/branches', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/classes', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (branchesRes.ok) {
        const data = await branchesRes.json();
        setBranches(data.branches || []);
      }

      if (classesRes.ok) {
        const data = await classesRes.json();
        setClasses(data.classes || []);
      }
    } catch (err) {
      console.error('Failed to fetch dropdown data:', err);
    }
  };

  // ── Reset form ──
  const resetForm = () => {
    setTitle('');
    setContent('');
    setType('GENERAL');
    setPriority('NORMAL');
    setTarget(defaultTarget || 'ALL');
    setBranchId('');
    setClassId('');
    setCoverImage('');
    setAttachments([]);
    setChannels(['app']);
    setSendAsChat(false);
    setScheduledAt('');
  };

  // ── Handle save draft ──
  const handleSaveDraft = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      setSaving(true);
      const data: Record<string, unknown> = {
        title: title.trim(),
        content: content.trim(),
        type,
        priority,
        target,
        branchId: target === 'BRANCH' ? branchId : null,
        classId: target === 'CLASS' ? classId : null,
        coverImage: coverImage || null,
        attachments: attachments.length > 0 ? attachments : null,
        channels: channels.join(','),
        sendAsChat,
        scheduledAt: scheduledAt || null,
        status: 'DRAFT',
      };

      if (editId) {
        await updateAnnouncement(editId, data);
        toast.success('Draft updated');
      } else {
        await createAnnouncement(data);
        toast.success('Draft saved');
      }

      resetForm();
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      toast.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  // ── Handle publish ──
  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      setSaving(true);
      const data: Record<string, unknown> = {
        title: title.trim(),
        content: content.trim(),
        type,
        priority,
        target,
        branchId: target === 'BRANCH' ? branchId : null,
        classId: target === 'CLASS' ? classId : null,
        coverImage: coverImage || null,
        attachments: attachments.length > 0 ? attachments : null,
        channels: channels.join(','),
        sendAsChat,
        scheduledAt: scheduledAt || null,
        status: scheduledAt ? 'SCHEDULED' : 'PUBLISHED',
      };

      if (editId) {
        await updateAnnouncement(editId, data);
        toast.success(scheduledAt ? 'Announcement scheduled' : 'Announcement published');
      } else {
        await createAnnouncement(data);
        toast.success(scheduledAt ? 'Announcement scheduled' : 'Announcement published');
      }

      resetForm();
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      toast.error('Failed to publish announcement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Megaphone className="h-5 w-5 text-portal-600" />
            {editId ? 'Edit Announcement' : 'New Announcement'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="ann-title" className="text-sm font-medium">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ann-title"
              placeholder="Enter announcement title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* Type + Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ANNOUNCEMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.emoji} {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className={p.color}>{p.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Target Audience</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                {filteredTargets.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.icon} {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Branch Dropdown (when BRANCH selected) */}
          {target === 'BRANCH' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Branch</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Class Dropdown (when CLASS selected) */}
          {target === 'CLASS' && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Class</Label>
              <Select value={classId} onValueChange={setClassId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.program ? `(${c.program.name})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="ann-content" className="text-sm font-medium">
              Content <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="ann-content"
              placeholder="Write your announcement content here..."
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="rounded-xl resize-none"
            />
          </div>

          {/* Cover Image URL */}
          <div className="space-y-2">
            <Label htmlFor="ann-cover" className="text-sm font-medium flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-gray-400" />
              Cover Image URL
            </Label>
            <Input
              id="ann-cover"
              placeholder="https://example.com/image.jpg"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              <Paperclip className="h-3.5 w-3.5 text-gray-400" />
              Attachments
            </Label>
            <div className="space-y-2">
              {attachments.map((att, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    value={att}
                    onChange={(e) => {
                      const updated = [...attachments];
                      updated[idx] = e.target.value;
                      setAttachments(updated);
                    }}
                    placeholder="File URL or name"
                    className="rounded-xl text-xs"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 shrink-0"
                    onClick={() => {
                      setAttachments(attachments.filter((_, i) => i !== idx));
                    }}
                  >
                    ✕
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="text-xs rounded-xl"
                onClick={() => setAttachments([...attachments, ''])}
              >
                + Add Attachment
              </Button>
            </div>
          </div>

          <Separator />

          {/* Channels */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Delivery Channels</Label>
            <div className="flex flex-wrap gap-4">
              {CHANNEL_OPTIONS.map((ch) => (
                <div key={ch.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`ch-${ch.value}`}
                    checked={channels.includes(ch.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setChannels([...channels, ch.value]);
                      } else {
                        setChannels(channels.filter((c) => c !== ch.value));
                      }
                    }}
                  />
                  <Label
                    htmlFor={`ch-${ch.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {ch.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Send as Chat Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                Post in Class Chat
              </Label>
              <p className="text-[11px] text-gray-500">
                Send this announcement as a chat message
              </p>
            </div>
            <Switch checked={sendAsChat} onCheckedChange={setSendAsChat} />
          </div>

          {/* Schedule */}
          <div className="space-y-2">
            <Label
              htmlFor="ann-schedule"
              className="text-sm font-medium flex items-center gap-1.5"
            >
              <Calendar className="h-3.5 w-3.5 text-gray-400" />
              Schedule for Later
            </Label>
            <Input
              id="ann-schedule"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="rounded-xl"
            />
            {scheduledAt && (
              <p className="text-[11px] text-amber-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Will be set to &quot;Scheduled&quot; status
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={saving || !title.trim() || !content.trim()}
            className="rounded-xl"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : null}
            Save Draft
          </Button>
          <Button
            onClick={handlePublish}
            disabled={saving || !title.trim() || !content.trim()}
            className="rounded-xl bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Send className="h-4 w-4 mr-1" />
            )}
            {scheduledAt ? 'Schedule' : 'Publish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
