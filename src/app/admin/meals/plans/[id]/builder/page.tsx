'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import {
  Save,
  Send,
  Search,
  X,
  Loader2,
  ArrowLeft,
  ClipboardCopy,
  BookmarkPlus,
  ChevronDown,
  Plus,
  Minus,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
import { MealCard } from '@/components/meals/MealCard';
import { MealPlanGrid } from '@/components/meals/MealPlanGrid';
import { NutritionBar } from '@/components/meals/NutritionBar';
import { AllergyConflictPanel } from '@/components/meals/AllergyConflictPanel';
import type {
  MealItem,
  MealPlanItem,
  MealType,
  DayOfWeek,
  AllergyConflict,
  AllergenType,
} from '@/components/meals/types';
import {
  MEAL_TYPE_LABELS,
  MEAL_TYPE_COLORS,
  MEAL_TYPES_ORDER,
  DAY_LABELS,
  NUTRITION_RECOMMENDED,
} from '@/components/meals/types';

// ── Types ──
interface PlanData {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  branch?: { id: string; name: string };
  items: MealPlanItem[];
}

interface Template {
  id: string;
  name: string;
  description?: string;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

const DAYS: DayOfWeek[] = [1, 2, 3, 4, 5];

export default function MealPlanBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;

  // ── State ──
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [mealItems, setMealItems] = useState<MealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('BREAKFAST');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MealItem | null>(null);
  const [activeCell, setActiveCell] = useState<{ day: DayOfWeek; mealType: MealType } | null>(null);
  const [planItems, setPlanItems] = useState<MealPlanItem[]>([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [showCellDropdown, setShowCellDropdown] = useState<{
    day: DayOfWeek;
    mealType: MealType;
  } | null>(null);

  // ── Fetch plan data ──
  const fetchPlan = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/meal-plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setPlan(data);
        setPlanItems(data.items || []);
      } else {
        toast.error('Failed to load plan');
        router.push('/admin/meals/plans');
      }
    } catch (err) {
      toast.error('Failed to load plan');
    } finally {
      setLoading(false);
    }
  }, [planId, router]);

  // ── Fetch meal items for palette ──
  useEffect(() => {
    async function fetchItems() {
      try {
        const token = getToken();
        const res = await fetch('/api/meal-items?limit=200', {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setMealItems(Array.isArray(data) ? data : data.items || []);
        }
      } catch (_) {}
    }
    fetchItems();
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  // ── Filter items for palette ──
  const filteredItems = useMemo(() => {
    let items = mealItems.filter((i) => i.mealType === selectedMealType);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.tags?.some((t) => t.toLowerCase().includes(q)) ||
          i.category?.toLowerCase().includes(q)
      );
    }
    return items;
  }, [mealItems, selectedMealType, searchQuery]);

  // ── Build weekly menu for MealPlanGrid ──
  const weeklyMenu = useMemo(() => {
    return DAYS.map((day) => ({
      day,
      meals: MEAL_TYPES_ORDER.reduce(
        (acc, mt) => {
          const cellItems = planItems.filter(
            (pi) => pi.dayOfWeek === day && pi.mealType === mt
          );
          if (cellItems.length > 0) acc[mt] = cellItems;
          return acc;
        },
        {} as Partial<Record<MealType, MealPlanItem[]>>
      ),
    }));
  }, [planItems]);

  // ── Compute allergy conflicts ──
  const conflicts: AllergyConflict[] = useMemo(() => {
    // This is a placeholder — in production you'd cross-reference with student allergies
    return [];
  }, [planItems]);

  // ── Daily nutrition ──
  const dailyNutrition = useMemo(() => {
    return DAYS.map((day) => {
      const dayItems = planItems.filter((pi) => pi.dayOfWeek === day && !pi.isAlternative);
      return {
        day,
        calories: dayItems.reduce((s, pi) => s + (pi.mealItem?.calories || 0), 0),
        protein: Math.round(dayItems.reduce((s, pi) => s + (pi.mealItem?.protein || 0), 0)),
        carbohydrates: Math.round(dayItems.reduce((s, pi) => s + (pi.mealItem?.carbohydrates || 0), 0)),
        fat: Math.round(dayItems.reduce((s, pi) => s + (pi.mealItem?.fat || 0), 0)),
        calcium: Math.round(dayItems.reduce((s, pi) => s + (pi.mealItem?.calcium || 0), 0)),
        iron: Math.round(dayItems.reduce((s, pi) => s + (pi.mealItem?.iron || 0), 0) * 10) / 10,
        vitaminC: Math.round(dayItems.reduce((s, pi) => s + (pi.mealItem?.vitaminC || 0), 0)),
      };
    });
  }, [planItems]);

  // ── Handlers ──
  const handleCellClick = (day: DayOfWeek, mealType: MealType) => {
    if (selectedItem && selectedItem.mealType === mealType) {
      // Assign selected item to cell
      assignItemToCell(day, mealType, selectedItem, false);
      setSelectedItem(null);
    } else {
      // Open dropdown for this cell
      setSelectedMealType(mealType);
      setShowCellDropdown({ day, mealType });
    }
  };

  const assignItemToCell = (day: DayOfWeek, mealType: MealType, item: MealItem, isAlternative: boolean) => {
    setPlanItems((prev) => {
      // Remove existing item from same slot (unless adding alternative)
      if (!isAlternative) {
        prev = prev.filter(
          (pi) => !(pi.dayOfWeek === day && pi.mealType === mealType && !pi.isAlternative)
        );
      }

      const newItem: MealPlanItem = {
        id: `temp-${Date.now()}-${Math.random()}`,
        mealPlanId: planId,
        mealItemId: item.id,
        dayOfWeek: day,
        mealType,
        isAlternative,
        sortOrder: prev.filter((pi) => pi.dayOfWeek === day && pi.mealType === mealType).length,
        mealItem: item,
      };

      return [...prev, newItem];
    });
    setShowCellDropdown(null);
  };

  const removeItemFromCell = (day: DayOfWeek, mealType: MealType) => {
    setPlanItems((prev) =>
      prev.filter((pi) => !(pi.dayOfWeek === day && pi.mealType === mealType))
    );
  };

  const addAlternative = (day: DayOfWeek, mealType: MealType) => {
    // Open the item picker for alternatives
    setSelectedMealType(mealType);
    setActiveCell({ day, mealType });
    setShowCellDropdown({ day, mealType });
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const token = getToken();
      const itemsPayload = planItems.map((pi, idx) => ({
        mealItemId: pi.mealItemId,
        dayOfWeek: pi.dayOfWeek,
        mealType: pi.mealType,
        isAlternative: pi.isAlternative,
        sortOrder: idx,
      }));

      const res = await fetch(`/api/meal-plans/${planId}/items`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ items: itemsPayload }),
      });

      if (res.ok) {
        toast.success('Draft saved');
        fetchPlan();
      } else {
        toast.error('Failed to save draft');
      }
    } catch (err) {
      toast.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const token = getToken();
      // Save first
      const itemsPayload = planItems.map((pi, idx) => ({
        mealItemId: pi.mealItemId,
        dayOfWeek: pi.dayOfWeek,
        mealType: pi.mealType,
        isAlternative: pi.isAlternative,
        sortOrder: idx,
      }));

      await fetch(`/api/meal-plans/${planId}/items`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ items: itemsPayload }),
      });

      // Then publish
      const res = await fetch(`/api/meal-plans/${planId}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });

      if (res.ok) {
        toast.success('Plan published successfully');
        fetchPlan();
      } else {
        toast.error('Failed to publish plan');
      }
    } catch (err) {
      toast.error('Failed to publish plan');
    } finally {
      setPublishing(false);
    }
  };

  // ── Template handlers ──
  const fetchTemplates = async () => {
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
    } catch (_) {}
  };

  const handleCopyFromTemplate = async () => {
    if (!selectedTemplate) {
      toast.error('Select a template');
      return;
    }
    try {
      const token = getToken();
      const res = await fetch(`/api/meal-templates/${selectedTemplate}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.ok) {
        const template = await res.json();
        if (template.items) {
          setPlanItems(
            template.items.map((ti: MealPlanItem, idx: number) => ({
              ...ti,
              id: `temp-${Date.now()}-${idx}`,
              mealPlanId: planId,
            }))
          );
          toast.success('Template applied');
          setShowTemplateDialog(false);
        }
      }
    } catch (err) {
      toast.error('Failed to apply template');
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Template name is required');
      return;
    }
    try {
      const token = getToken();
      const res = await fetch('/api/meal-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          name: templateName,
          description: templateDesc,
          items: planItems.map((pi) => ({
            mealItemId: pi.mealItemId,
            dayOfWeek: pi.dayOfWeek,
            mealType: pi.mealType,
            isAlternative: pi.isAlternative,
          })),
        }),
      });
      if (res.ok) {
        toast.success('Template saved');
        setShowSaveTemplateDialog(false);
        setTemplateName('');
        setTemplateDesc('');
      } else {
        toast.error('Failed to save template');
      }
    } catch (err) {
      toast.error('Failed to save template');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-6 space-y-6">
        <Skeleton className="h-16 w-full rounded-xl bg-white/5" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-96 rounded-xl bg-white/5" />
          <Skeleton className="h-96 rounded-xl bg-white/5 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/30">
        <p>Plan not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-4 p-4 md:p-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/50 hover:text-white"
            onClick={() => router.push('/admin/meals/plans')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white">{plan.name}</h1>
            <p className="text-xs text-white/40">
              {format(parseISO(plan.startDate), 'MMM d')} – {format(parseISO(plan.endDate), 'MMM d, yyyy')}
              {plan.branch && ` · ${plan.branch.name}`}
            </p>
          </div>
          <Badge
            className={
              plan.status === 'PUBLISHED'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : plan.status === 'DRAFT'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-white/10 text-white/40 border-white/10'
            }
          >
            {plan.status}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={() => {
              fetchTemplates();
              setShowTemplateDialog(true);
            }}
          >
            <ClipboardCopy className="h-4 w-4" /> Copy Template
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={() => setShowSaveTemplateDialog(true)}
          >
            <BookmarkPlus className="h-4 w-4" /> Save as Template
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={handleSaveDraft}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Draft
          </Button>
          {plan.status !== 'PUBLISHED' && (
            <Button
              size="sm"
              className="gap-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 hover:from-purple-700 hover:to-pink-700"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Publish
            </Button>
          )}
        </div>
      </motion.div>

      {/* ── Two-panel Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left: Item Palette */}
        <div className="lg:col-span-1 space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Item Palette</h3>

            {/* Meal Type Tabs */}
            <Tabs value={selectedMealType} onValueChange={(v) => setSelectedMealType(v as MealType)}>
              <TabsList className="w-full bg-white/5 h-auto flex-wrap gap-1">
                {MEAL_TYPES_ORDER.map((mt) => (
                  <TabsTrigger
                    key={mt}
                    value={mt}
                    className="text-[10px] px-2 py-1 data-[state=active]:bg-white/10"
                    style={{
                      color: selectedMealType === mt ? MEAL_TYPE_COLORS[mt] : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {MEAL_TYPE_LABELS[mt].split(' ')[0]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Search */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
              <Input
                placeholder="Search items..."
                className="pl-9 bg-white/5 border-white/10 text-white text-xs h-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Selected Item Indicator */}
            {selectedItem && (
              <div className="mt-2 rounded-lg border border-purple-500/30 bg-purple-500/10 p-2 flex items-center gap-2">
                <span className="text-xs text-purple-300">Selected:</span>
                <span className="text-xs text-white font-medium truncate">{selectedItem.name}</span>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-white/30 hover:text-white/60 ml-auto"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Items List */}
            <ScrollArea className="h-[400px] mt-3 -mx-1 px-1">
              <div className="space-y-2">
                {filteredItems.length === 0 ? (
                  <p className="text-xs text-white/30 text-center py-8">No items for this meal type</p>
                ) : (
                  filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className={`cursor-pointer rounded-lg transition-colors ${
                        selectedItem?.id === item.id
                          ? 'ring-1 ring-purple-500/50'
                          : ''
                      }`}
                      onClick={() => setSelectedItem(selectedItem?.id === item.id ? null : item)}
                    >
                      <MealCard mealItem={item} variant="compact" />
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Right: Meal Plan Grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Weekly Plan</h3>
              <p className="text-xs text-white/30">
                {selectedItem
                  ? `Click a ${MEAL_TYPE_LABELS[selectedItem.mealType]} cell to assign`
                  : 'Select an item from the palette, then click a cell'}
              </p>
            </div>
            <MealPlanGrid
              weeklyMenu={weeklyMenu}
              editable={plan.status !== 'PUBLISHED'}
              onCellClick={handleCellClick}
              conflictWarnings={[]}
            />
          </div>

          {/* Cell Dropdown (for quick assign) */}
          {showCellDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-white/10 bg-[#0f0f2e]/95 backdrop-blur-md p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-white">
                  Assign {MEAL_TYPE_LABELS[showCellDropdown.mealType]} — {DAY_LABELS[showCellDropdown.day]}
                </h4>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-amber-400 hover:text-amber-300 gap-1 h-7"
                    onClick={() => {
                      addAlternative(showCellDropdown.day, showCellDropdown.mealType);
                    }}
                  >
                    <Plus className="h-3 w-3" /> Add Alternative
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-red-400 hover:text-red-300 gap-1 h-7"
                    onClick={() => {
                      removeItemFromCell(showCellDropdown.day, showCellDropdown.mealType);
                      setShowCellDropdown(null);
                    }}
                  >
                    <Minus className="h-3 w-3" /> Remove
                  </Button>
                  <button onClick={() => setShowCellDropdown(null)} className="text-white/30 hover:text-white/60">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                <Input
                  placeholder={`Search ${MEAL_TYPE_LABELS[showCellDropdown.mealType]} items...`}
                  className="pl-9 bg-white/5 border-white/10 text-white text-xs h-8"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedMealType(showCellDropdown.mealType);
                  }}
                />
              </div>
              <ScrollArea className="max-h-60">
                <div className="space-y-1">
                  {mealItems
                    .filter((i) => i.mealType === showCellDropdown.mealType)
                    .filter((i) => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        i.name.toLowerCase().includes(q) ||
                        i.tags?.some((t) => t.toLowerCase().includes(q))
                      );
                    })
                    .map((item) => (
                      <div
                        key={item.id}
                        className="cursor-pointer hover:bg-white/5 rounded-lg transition-colors"
                        onClick={() => {
                          const isAddingAlternative = planItems.some(
                            (pi) =>
                              pi.dayOfWeek === showCellDropdown.day &&
                              pi.mealType === showCellDropdown.mealType &&
                              !pi.isAlternative
                          );
                          assignItemToCell(
                            showCellDropdown.day,
                            showCellDropdown.mealType,
                            item,
                            isAddingAlternative
                          );
                        }}
                      >
                        <MealCard mealItem={item} variant="compact" />
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </motion.div>
          )}

          {/* ── Daily Nutrition Summary ── */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-400" /> Daily Nutrition Summary
            </h3>
            <div className="space-y-4">
              {dailyNutrition.map((day) => (
                <div key={day.day} className="space-y-2">
                  <p className="text-xs font-medium text-white/60">{DAY_LABELS[day.day]}</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <NutritionBar label="Calories" value={day.calories} recommended={NUTRITION_RECOMMENDED.calories} unit="kcal" color="bg-amber-400" />
                    <NutritionBar label="Protein" value={day.protein} recommended={NUTRITION_RECOMMENDED.protein} unit="g" />
                    <NutritionBar label="Calcium" value={day.calcium} recommended={NUTRITION_RECOMMENDED.calcium} unit="mg" />
                    <NutritionBar label="Iron" value={day.iron} recommended={NUTRITION_RECOMMENDED.iron} unit="mg" />
                    <NutritionBar label="Vit C" value={day.vitaminC} recommended={NUTRITION_RECOMMENDED.vitaminC} unit="mg" color="bg-orange-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Allergy Conflict Panel ── */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
            <AllergyConflictPanel conflicts={conflicts} />
          </div>
        </div>
      </div>

      {/* ── Copy from Template Dialog ── */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-md bg-[#0f0f2e] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Copy from Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-xs text-white/50">
              Select a template to copy its meal items into this plan. This will replace any existing items.
            </p>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTemplateDialog(false)}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCopyFromTemplate}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0"
            >
              Apply Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Save as Template Dialog ── */}
      <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
        <DialogContent className="max-w-md bg-[#0f0f2e] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Save as Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white/60 text-xs">Template Name *</Label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                placeholder="e.g., Standard Vegetarian Week"
              />
            </div>
            <div>
              <Label className="text-white/60 text-xs">Description</Label>
              <Input
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSaveTemplateDialog(false)}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAsTemplate}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0"
            >
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
