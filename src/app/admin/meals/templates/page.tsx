'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutTemplate,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Eye,
  Loader2,
  Search,
  X,
  BookmarkPlus,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Separator } from '@/components/ui/separator';
import type { MealType, MealPlanItem } from '@/components/meals/types';
import { MEAL_TYPE_LABELS, MEAL_TYPE_COLORS } from '@/components/meals/types';

// ── Types ──
interface MealTemplate {
  id: string;
  name: string;
  description?: string;
  mealTypes?: MealType[];
  usageCount?: number;
  items?: MealPlanItem[];
  createdAt: string;
  updatedAt: string;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

export default function MealTemplatesPage() {
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState<MealTemplate | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<MealTemplate | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMealTypes, setFormMealTypes] = useState<MealType[]>(['BREAKFAST', 'LUNCH']);

  // ── Fetch templates ──
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch('/api/meal-templates', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(Array.isArray(data) ? data : data.templates || []);
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // ── Filtered templates ──
  const filteredTemplates = templates.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q)
    );
  });

  // ── Handlers ──
  const openCreateDialog = () => {
    setEditMode(false);
    setEditingId(null);
    setFormName('');
    setFormDescription('');
    setFormMealTypes(['BREAKFAST', 'LUNCH']);
    setDialogOpen(true);
  };

  const openEditDialog = (template: MealTemplate) => {
    setEditMode(true);
    setEditingId(template.id);
    setFormName(template.name);
    setFormDescription(template.description || '');
    setFormMealTypes(template.mealTypes || ['BREAKFAST', 'LUNCH']);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('Template name is required');
      return;
    }
    setSaving(true);
    try {
      const token = getToken();
      const url = editMode && editingId
        ? `/api/meal-templates/${editingId}`
        : '/api/meal-templates';
      const method = editMode ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          mealTypes: formMealTypes,
        }),
      });

      if (res.ok) {
        toast.success(editMode ? 'Template updated' : 'Template created');
        setDialogOpen(false);
        fetchTemplates();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to save template');
      }
    } catch (err) {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Delete this template?')) return;
    setDeleting(templateId);
    try {
      const token = getToken();
      const res = await fetch(`/api/meal-templates/${templateId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.ok) {
        toast.success('Template deleted');
        fetchTemplates();
      } else {
        toast.error('Failed to delete template');
      }
    } catch (err) {
      toast.error('Failed to delete template');
    } finally {
      setDeleting(null);
    }
  };

  const handleApplyTemplate = async () => {
    if (!applyingTemplate) return;
    try {
      const token = getToken();
      // Create a new meal plan draft from the template
      const res = await fetch('/api/meal-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          name: `${applyingTemplate.name} — Copy`,
          templateId: applyingTemplate.id,
          startDate: new Date().toISOString().split('T')[0],
        }),
      });
      if (res.ok) {
        toast.success('Meal plan created from template');
        setApplyDialogOpen(false);
        setApplyingTemplate(null);
      } else {
        toast.error('Failed to apply template');
      }
    } catch (err) {
      toast.error('Failed to apply template');
    }
  };

  const openPreview = (template: MealTemplate) => {
    setPreviewTemplate(template);
    setPreviewDialogOpen(true);
  };

  const toggleMealType = (mt: MealType) => {
    setFormMealTypes((prev) =>
      prev.includes(mt) ? prev.filter((t) => t !== mt) : [...prev, mt]
    );
  };

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
            <LayoutTemplate className="h-6 w-6 text-purple-400" />
            Meal Templates
          </h1>
          <p className="text-sm text-white/50">Reusable meal plan templates</p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 hover:from-purple-700 hover:to-pink-700"
        >
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </motion.div>

      {/* ── Search ── */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
        <Input
          placeholder="Search templates..."
          className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Template Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl bg-white/5" />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-white/30">
          <LayoutTemplate className="h-16 w-16 mb-4" />
          <p className="text-lg font-medium">
            {search ? 'No templates match your search' : 'No templates yet'}
          </p>
          <p className="text-sm">Create reusable templates for common meal plans</p>
          <Button
            onClick={openCreateDialog}
            className="mt-4 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0"
          >
            <Plus className="h-4 w-4" /> Create Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredTemplates.map((template) => {
              const mealTypeBadges = template.mealTypes || [];
              const itemCount = template.items?.length || 0;

              return (
                <motion.div
                  key={template.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 hover:border-white/20 transition-colors flex flex-col"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-white truncate">
                        {template.name}
                      </h3>
                      {template.description && (
                        <p className="text-xs text-white/40 mt-0.5 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/30 hover:text-white/60"
                        onClick={() => openPreview(template)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white/30 hover:text-white/60"
                        onClick={() => openEditDialog(template)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-400/50 hover:text-red-400"
                        disabled={deleting === template.id}
                        onClick={() => handleDelete(template.id)}
                      >
                        {deleting === template.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Meal Types */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {mealTypeBadges.map((mt) => (
                      <Badge
                        key={mt}
                        className="border text-[10px] px-2 py-0"
                        style={{
                          borderColor: `${MEAL_TYPE_COLORS[mt]}40`,
                          backgroundColor: `${MEAL_TYPE_COLORS[mt]}15`,
                          color: MEAL_TYPE_COLORS[mt],
                        }}
                      >
                        {MEAL_TYPE_LABELS[mt]}
                      </Badge>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-white/30 mb-4">
                    <span>{itemCount} items</span>
                    <span>Used {template.usageCount || 0} times</span>
                  </div>

                  {/* Mini Preview */}
                  {template.items && template.items.length > 0 && (
                    <div className="mt-auto pt-3 border-t border-white/5">
                      <p className="text-[10px] text-white/20 mb-1.5">Preview</p>
                      <div className="space-y-0.5">
                        {template.items
                          .filter((i) => !i.isAlternative)
                          .slice(0, 4)
                          .map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5 text-[10px] text-white/40"
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full shrink-0"
                                style={{
                                  backgroundColor:
                                    MEAL_TYPE_COLORS[item.mealType] || '#888',
                                }}
                              />
                              <span className="truncate">
                                {item.mealItem?.name || 'Unnamed item'}
                              </span>
                            </div>
                          ))}
                        {template.items.filter((i) => !i.isAlternative).length > 4 && (
                          <p className="text-[10px] text-white/20">
                            +{template.items.filter((i) => !i.isAlternative).length - 4} more...
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Apply Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-1 border-white/10 bg-white/5 text-white hover:bg-white/10 text-xs"
                    onClick={() => {
                      setApplyingTemplate(template);
                      setApplyDialogOpen(true);
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" /> Apply Template
                  </Button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Create/Edit Template Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-[#0f0f2e] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editMode ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white/60 text-xs">Template Name *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                placeholder="e.g., Standard Vegetarian Week"
              />
            </div>

            <div>
              <Label className="text-white/60 text-xs">Description</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="bg-white/5 border-white/10 text-white min-h-[60px]"
                placeholder="Describe this template..."
              />
            </div>

            <div>
              <Label className="text-white/60 text-xs">Meal Types</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Object.entries(MEAL_TYPE_LABELS) as [MealType, string][]).map(
                  ([key, label]) => (
                    <button
                      key={key}
                      onClick={() => toggleMealType(key)}
                      className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border transition-colors"
                      style={{
                        borderColor: formMealTypes.includes(key)
                          ? `${MEAL_TYPE_COLORS[key]}50`
                          : 'rgba(255,255,255,0.1)',
                        backgroundColor: formMealTypes.includes(key)
                          ? `${MEAL_TYPE_COLORS[key]}15`
                          : 'rgba(255,255,255,0.03)',
                        color: formMealTypes.includes(key)
                          ? MEAL_TYPE_COLORS[key]
                          : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: MEAL_TYPE_COLORS[key] }}
                      />
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>

            {!editMode && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-xs text-amber-300/60">
                  <BookmarkPlus className="h-3 w-3 inline mr-1" />
                  After creating, you can populate items from the Meal Plan Builder by using
                  &quot;Save as Template&quot;.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 hover:from-purple-700 hover:to-pink-700"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editMode ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Apply Template Dialog ── */}
      <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
        <DialogContent className="max-w-md bg-[#0f0f2e] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Apply Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {applyingTemplate && (
              <>
                <p className="text-sm text-white/60">
                  This will create a new meal plan draft based on
                  <span className="text-white font-medium"> {applyingTemplate.name}</span>.
                </p>
                <div className="rounded-lg bg-white/5 p-3 space-y-1">
                  <p className="text-xs text-white/40">Template details:</p>
                  <p className="text-sm text-white">{applyingTemplate.name}</p>
                  {applyingTemplate.description && (
                    <p className="text-xs text-white/30">{applyingTemplate.description}</p>
                  )}
                  <p className="text-xs text-white/30">
                    {(applyingTemplate.items || []).length} items ·{' '}
                    {(applyingTemplate.mealTypes || []).map((mt) => MEAL_TYPE_LABELS[mt]).join(', ')}
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setApplyDialogOpen(false);
                setApplyingTemplate(null);
              }}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyTemplate}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0"
            >
              <Copy className="h-4 w-4 mr-2" />
              Create Plan from Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Preview Template Dialog ── */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-lg bg-[#0f0f2e] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              {previewTemplate?.name}
            </DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4 py-4">
              {previewTemplate.description && (
                <p className="text-sm text-white/50">{previewTemplate.description}</p>
              )}

              {/* Meal types */}
              <div className="flex flex-wrap gap-1.5">
                {(previewTemplate.mealTypes || []).map((mt) => (
                  <Badge
                    key={mt}
                    className="border text-[10px]"
                    style={{
                      borderColor: `${MEAL_TYPE_COLORS[mt]}40`,
                      backgroundColor: `${MEAL_TYPE_COLORS[mt]}15`,
                      color: MEAL_TYPE_COLORS[mt],
                    }}
                  >
                    {MEAL_TYPE_LABELS[mt]}
                  </Badge>
                ))}
              </div>

              <Separator className="bg-white/10" />

              {/* Items Preview */}
              {(previewTemplate.items || []).length > 0 ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {(['BREAKFAST', 'MID_MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK'] as MealType[]).map(
                    (mt) => {
                      const mtItems = (previewTemplate.items || []).filter(
                        (i) => i.mealType === mt
                      );
                      if (mtItems.length === 0) return null;
                      const main = mtItems.find((i) => !i.isAlternative);
                      const alts = mtItems.filter((i) => i.isAlternative);

                      return (
                        <div key={mt}>
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: MEAL_TYPE_COLORS[mt] }}
                            />
                            <span
                              className="text-xs font-semibold"
                              style={{ color: MEAL_TYPE_COLORS[mt] }}
                            >
                              {MEAL_TYPE_LABELS[mt]}
                            </span>
                          </div>
                          {main?.mealItem && (
                            <div className="ml-4 text-sm text-white/70">
                              {main.mealItem.name}
                              <span className="text-[10px] text-white/30 ml-2">
                                {main.mealItem.calories} kcal
                              </span>
                            </div>
                          )}
                          {alts.map((alt, idx) => (
                            <div
                              key={idx}
                              className="ml-4 text-xs text-white/30 italic"
                            >
                              ↳ {alt.mealItem?.name || 'Alternative'}
                            </div>
                          ))}
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <p className="text-white/20 text-sm text-center py-8">
                  No items in this template yet. Use the Meal Plan Builder to add items.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPreviewDialogOpen(false)}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
