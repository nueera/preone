'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import {
  Plus,
  Calendar,
  ClipboardList,
  CheckCircle2,
  Archive,
  Pencil,
  Trash2,
  Eye,
  Send,
  Loader2,
  ChevronRight,
  Flame,
  UtensilsCrossed,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
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
import { NutritionBar } from '@/components/meals/NutritionBar';
import type { MealType } from '@/components/meals/types';
import { MEAL_TYPE_LABELS, MEAL_TYPE_COLORS } from '@/components/meals/types';

// ── Types ──
interface MealPlan {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  branchId: string;
  branch?: { id: string; name: string };
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  targetClasses?: { id: string; name: string }[];
  mealTypes?: MealType[];
  items?: { id: string; mealItem: { calories: number; protein: number } }[];
  createdAt: string;
  _count?: { items: number };
}

interface Branch {
  id: string;
  name: string;
}

interface ClassInfo {
  id: string;
  name: string;
}

const STATUS_CONFIG = {
  DRAFT: { color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: ClipboardList, label: 'Draft' },
  PUBLISHED: { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: CheckCircle2, label: 'Published' },
  ARCHIVED: { color: 'bg-white/10 text-white/40 border-white/10', icon: Archive, label: 'Archived' },
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

export default function MealPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formBranchId, setFormBranchId] = useState('');
  const [formClassIds, setFormClassIds] = useState<string[]>([]);
  const [formMealTypes, setFormMealTypes] = useState<MealType[]>(['BREAKFAST', 'LUNCH']);

  // ── Fetch plans ──
  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch('/api/meal-plans', {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setPlans(Array.isArray(data) ? data : data.plans || []);
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err);
      toast.error('Failed to load meal plans');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch branches ──
  useEffect(() => {
    async function fetchBranches() {
      try {
        const token = getToken();
        const res = await fetch('/api/branches', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setBranches(Array.isArray(data) ? data : data.branches || []);
        }
      } catch (_) {}
    }
    fetchBranches();
  }, []);

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
          const classList = data.classes || data || [];
          setClasses(Array.isArray(classList) ? classList : []);
        }
      } catch (_) {}
    }
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // ── Stats ──
  const activePlans = plans.filter((p) => p.status === 'PUBLISHED').length;
  const upcomingPlans = plans.filter((p) => p.status === 'DRAFT').length;
  const currentWeek = plans.find((p) => {
    if (p.status !== 'PUBLISHED') return false;
    const now = new Date();
    const start = parseISO(p.startDate);
    const end = parseISO(p.endDate);
    return now >= start && now <= end;
  });

  const avgCalories = plans.length > 0
    ? Math.round(
        plans.reduce((sum, p) => {
          const items = p.items || [];
          const cal = items.reduce((s, i) => s + (i.mealItem?.calories || 0), 0);
          return sum + cal;
        }, 0) / plans.length
      )
    : 0;

  // ── Handlers ──
  const openCreateDialog = () => {
    setFormName('');
    setFormStartDate(format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    setFormEndDate(format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    setFormBranchId(branches[0]?.id || '');
    setFormClassIds([]);
    setFormMealTypes(['BREAKFAST', 'LUNCH']);
    setDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!formName.trim() || !formStartDate || !formEndDate) {
      toast.error('Name, start and end dates are required');
      return;
    }
    setSaving(true);
    try {
      const token = getToken();
      const res = await fetch('/api/meal-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formName,
          startDate: formStartDate,
          endDate: formEndDate,
          branchId: formBranchId || undefined,
          targetClassIds: formClassIds,
          mealTypes: formMealTypes,
        }),
      });
      if (res.ok) {
        const plan = await res.json();
        toast.success('Meal plan created');
        setDialogOpen(false);
        fetchPlans();
        // Navigate to builder
        router.push(`/admin/meals/plans/${plan.id}/builder`);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to create plan');
      }
    } catch (err) {
      toast.error('Failed to create plan');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (planId: string) => {
    setPublishing(planId);
    try {
      const token = getToken();
      const res = await fetch(`/api/meal-plans/${planId}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.ok) {
        toast.success('Plan published');
        fetchPlans();
      } else {
        toast.error('Failed to publish plan');
      }
    } catch (err) {
      toast.error('Failed to publish plan');
    } finally {
      setPublishing(null);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('Delete this meal plan?')) return;
    setDeleting(planId);
    try {
      const token = getToken();
      const res = await fetch(`/api/meal-plans/${planId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.ok) {
        toast.success('Plan deleted');
        fetchPlans();
      } else {
        toast.error('Failed to delete plan');
      }
    } catch (err) {
      toast.error('Failed to delete plan');
    } finally {
      setDeleting(null);
    }
  };

  const toggleClass = (classId: string) => {
    setFormClassIds((prev) =>
      prev.includes(classId) ? prev.filter((c) => c !== classId) : [...prev, classId]
    );
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
            <Calendar className="h-6 w-6 text-purple-400" />
            Meal Plans
          </h1>
          <p className="text-sm text-white/50">Plan and manage weekly meal schedules</p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 hover:from-purple-700 hover:to-pink-700"
        >
          <Plus className="h-4 w-4" />
          Create Meal Plan
        </Button>
      </motion.div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Plans', value: activePlans, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Upcoming Drafts', value: upcomingPlans, icon: ClipboardList, color: 'text-amber-400' },
          { label: 'Avg Daily Cal', value: avgCalories, icon: Flame, color: 'text-orange-400' },
          { label: 'Total Plans', value: plans.length, icon: Calendar, color: 'text-purple-400' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
              <span className="text-xs text-white/40">{stat.label}</span>
            </div>
            <p className="text-lg font-bold text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Current Week Card ── */}
      {currentWeek && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 backdrop-blur-sm p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-emerald-400 font-medium uppercase tracking-wider">This Week&apos;s Plan</p>
              <h2 className="text-lg font-bold text-white mt-1">{currentWeek.name}</h2>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Published
            </Badge>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-white/60">
            <span>{format(parseISO(currentWeek.startDate), 'MMM d')} – {format(parseISO(currentWeek.endDate), 'MMM d, yyyy')}</span>
            <span>{currentWeek._count?.items || 0} items</span>
          </div>
          <Button
            variant="ghost"
            className="mt-3 text-emerald-400 hover:text-emerald-300 gap-1"
            onClick={() => router.push(`/admin/meals/plans/${currentWeek.id}/builder`)}
          >
            View Builder <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* ── Meal Plan List ── */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl bg-white/5" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-white/30">
          <Calendar className="h-16 w-16 mb-4" />
          <p className="text-lg font-medium">No meal plans yet</p>
          <p className="text-sm">Create your first meal plan to get started</p>
          <Button
            onClick={openCreateDialog}
            className="mt-4 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0"
          >
            <Plus className="h-4 w-4" /> Create Meal Plan
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {plans.map((plan) => {
              const statusCfg = STATUS_CONFIG[plan.status];
              const itemCount = plan._count?.items || plan.items?.length || 0;
              const totalCal = (plan.items || []).reduce((s, i) => s + (i.mealItem?.calories || 0), 0);
              const totalProtein = (plan.items || []).reduce((s, i) => s + (i.mealItem?.protein || 0), 0);

              return (
                <motion.div
                  key={plan.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 hover:border-white/20 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-semibold text-white truncate">{plan.name}</h3>
                        <Badge className={`${statusCfg.color} border text-[10px]`}>
                          <statusCfg.icon className="h-3 w-3 mr-1" />
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-white/40">
                        <span>{format(parseISO(plan.startDate), 'MMM d')} – {format(parseISO(plan.endDate), 'MMM d, yyyy')}</span>
                        {plan.branch && <span>{plan.branch.name}</span>}
                        <span>{itemCount} items</span>
                      </div>
                      {itemCount > 0 && (
                        <div className="mt-3 flex gap-6 max-w-md">
                          <NutritionBar label="Calories" value={totalCal} recommended={1200} unit="kcal" color="bg-amber-400" />
                          <NutritionBar label="Protein" value={Math.round(totalProtein)} recommended={16} unit="g" />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white/50 hover:text-white gap-1"
                        onClick={() => router.push(`/admin/meals/plans/${plan.id}/builder`)}
                      >
                        <Eye className="h-4 w-4" /> Builder
                      </Button>
                      {plan.status === 'DRAFT' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-amber-400 hover:text-amber-300 gap-1"
                          onClick={() => router.push(`/admin/meals/plans/${plan.id}/builder`)}
                        >
                          <Pencil className="h-4 w-4" /> Edit
                        </Button>
                      )}
                      {plan.status === 'DRAFT' && (
                        <Button
                          size="sm"
                          className="gap-1 bg-emerald-600/80 text-white hover:bg-emerald-600"
                          disabled={publishing === plan.id}
                          onClick={() => handlePublish(plan.id)}
                        >
                          {publishing === plan.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Publish
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-400 hover:text-red-300"
                        disabled={deleting === plan.id}
                        onClick={() => handleDelete(plan.id)}
                      >
                        {deleting === plan.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ── Create Plan Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg bg-[#0f0f2e] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Create Meal Plan</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white/60 text-xs">Plan Name *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                placeholder="e.g., Week 12 Meal Plan"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/60 text-xs">Start Date *</Label>
                <Input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white/60 text-xs">End Date *</Label>
                <Input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div>
              <Label className="text-white/60 text-xs">Branch</Label>
              <Select value={formBranchId} onValueChange={setFormBranchId}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Target Classes */}
            {classes.length > 0 && (
              <div>
                <Label className="text-white/60 text-xs">Target Classes</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {classes.map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => toggleClass(cls.id)}
                      className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                        formClassIds.includes(cls.id)
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : 'bg-white/5 text-white/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {cls.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Meal Types */}
            <div>
              <Label className="text-white/60 text-xs">Meal Types</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {(Object.entries(MEAL_TYPE_LABELS) as [MealType, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => toggleMealType(key)}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs border transition-colors"
                    style={{
                      borderColor: formMealTypes.includes(key) ? `${MEAL_TYPE_COLORS[key]}50` : 'rgba(255,255,255,0.1)',
                      backgroundColor: formMealTypes.includes(key) ? `${MEAL_TYPE_COLORS[key]}15` : 'rgba(255,255,255,0.03)',
                      color: formMealTypes.includes(key) ? MEAL_TYPE_COLORS[key] : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: MEAL_TYPE_COLORS[key] }} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
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
              onClick={handleCreate}
              disabled={saving}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 hover:from-purple-700 hover:to-pink-700"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create & Open Builder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
