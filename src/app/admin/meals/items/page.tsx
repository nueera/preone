'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  X,
  Filter,
  UtensilsCrossed,
  Coffee,
  Apple,
  Soup,
  Leaf,
  Vegan,
  Egg,
  Flame,
  ChevronDown,
  ChevronUp,
  Trash2,
  Pencil,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MealCard } from '@/components/meals/MealCard';
import { AllergenTag } from '@/components/meals/AllergenTag';
import type { MealItem, MealType, AllergenType } from '@/components/meals/types';
import {
  MEAL_TYPE_LABELS,
  ALLERGEN_LABELS,
  ALLERGEN_EMOJIS,
} from '@/components/meals/types';

// ── Constants ──
const ALLERGEN_LIST: AllergenType[] = [
  'MILK','EGGS','FISH','SHELLFISH','TREE_NUTS','PEANUTS',
  'WHEAT','SOYBEAN','SESAME','CELERY','MUSTARD','LUPIN',
  'MOLLUSCS','SULPHITES','GLUTEN','HONEY','SUGAR',
];

const CATEGORIES = ['Grains','Pulses','Vegetables','Fruits','Dairy','Protein','Snacks','Beverages','Dessert'];
const CUISINES = ['Indian','Continental','Chinese','Italian','Mexican','Thai','Mediterranean'];

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

// ── Meal Item Form ──
interface MealItemForm {
  name: string;
  description: string;
  image: string;
  mealType: MealType | '';
  isVegetarian: boolean;
  isVegan: boolean;
  isEggless: boolean;
  servingSize: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  calcium: number;
  iron: number;
  vitaminC: number;
  allergens: AllergenType[];
  mayContain: AllergenType[];
  ingredients: { name: string; quantity: string }[];
  category: string;
  cuisine: string;
  tags: string;
  prepTime: number;
  cookTime: number;
  costPerServing: number;
}

const emptyForm: MealItemForm = {
  name: '',
  description: '',
  image: '',
  mealType: '',
  isVegetarian: true,
  isVegan: false,
  isEggless: false,
  servingSize: '1 serving',
  calories: 0,
  protein: 0,
  carbohydrates: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  calcium: 0,
  iron: 0,
  vitaminC: 0,
  allergens: [],
  mayContain: [],
  ingredients: [{ name: '', quantity: '' }],
  category: '',
  cuisine: '',
  tags: '',
  prepTime: 0,
  cookTime: 0,
  costPerServing: 0,
};

export default function MealItemsPage() {
  // ── State ──
  const [items, setItems] = useState<MealItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [mealTypeFilter, setMealTypeFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [vegOnly, setVegOnly] = useState(false);
  const [veganOnly, setVeganOnly] = useState(false);
  const [allergenFreeFilter, setAllergenFreeFilter] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MealItem | null>(null);
  const [form, setForm] = useState<MealItemForm>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [nutritionOpen, setNutritionOpen] = useState(false);
  const limit = 20;

  // ── Debounce search ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Fetch items ──
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (mealTypeFilter && mealTypeFilter !== 'ALL') params.set('mealType', mealTypeFilter);
      if (categoryFilter && categoryFilter !== 'ALL') params.set('category', categoryFilter);
      if (vegOnly) params.set('isVegetarian', 'true');
      if (veganOnly) params.set('isVegan', 'true');
      if (allergenFreeFilter) params.set('allergenFree', 'true');

      const res = await fetch(`/api/meal-items?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || data || []);
        setTotal(data.total || (data.items || data || []).length);
      }
    } catch (err) {
      console.error('Failed to fetch meal items:', err);
      toast.error('Failed to load meal items');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, mealTypeFilter, categoryFilter, vegOnly, veganOnly, allergenFreeFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ── Stats ──
  const breakfastCount = items.filter((i) => i.mealType === 'BREAKFAST').length;
  const snackCount = items.filter(
    (i) => i.mealType === 'MID_MORNING_SNACK' || i.mealType === 'AFTERNOON_SNACK'
  ).length;
  const lunchCount = items.filter((i) => i.mealType === 'LUNCH').length;
  const mostUsedItem = items.length > 0 ? items[0]?.name : '—';

  // ── Handlers ──
  const openCreateDialog = () => {
    setEditingItem(null);
    setForm({ ...emptyForm });
    setNutritionOpen(false);
    setDialogOpen(true);
  };

  const openEditDialog = (item: MealItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description || '',
      image: item.image || '',
      mealType: item.mealType,
      isVegetarian: item.isVegetarian,
      isVegan: item.isVegan,
      isEggless: item.isEggless,
      servingSize: item.servingSize || '1 serving',
      calories: item.calories,
      protein: item.protein,
      carbohydrates: item.carbohydrates,
      fat: item.fat,
      fiber: item.fiber,
      sugar: item.sugar,
      calcium: item.calcium,
      iron: item.iron,
      vitaminC: item.vitaminC,
      allergens: item.allergens || [],
      mayContain: item.mayContain || [],
      ingredients: (item as unknown as Record<string, unknown>).ingredients
        ? ((item as unknown as Record<string, unknown>).ingredients as { name: string; quantity: string }[])
        : [{ name: '', quantity: '' }],
      category: item.category || '',
      cuisine: item.cuisine || '',
      tags: item.tags?.join(', ') || '',
      prepTime: item.prepTime || 0,
      cookTime: item.cookTime || 0,
      costPerServing: item.costPerServing || 0,
    });
    setNutritionOpen(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.mealType) {
      toast.error('Name and Meal Type are required');
      return;
    }
    setSaving(true);
    try {
      const token = getToken();
      const payload = {
        ...form,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const url = editingItem
        ? `/api/meal-items/${editingItem.id}`
        : '/api/meal-items';
      const method = editingItem ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingItem ? 'Meal item updated' : 'Meal item created');
        setDialogOpen(false);
        fetchItems();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to save meal item');
      }
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('Failed to save meal item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: MealItem) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try {
      const token = getToken();
      const res = await fetch(`/api/meal-items/${item.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (res.ok) {
        toast.success('Meal item deleted');
        fetchItems();
      } else {
        toast.error('Failed to delete meal item');
      }
    } catch (err) {
      toast.error('Failed to delete meal item');
    }
  };

  const toggleAllergen = (allergen: AllergenType, type: 'contains' | 'mayContain') => {
    setForm((prev) => {
      const list = type === 'contains' ? prev.allergens : prev.mayContain;
      const other = type === 'contains' ? prev.mayContain : prev.allergens;
      const updated = list.includes(allergen)
        ? list.filter((a) => a !== allergen)
        : [...list, allergen];
      // Remove from the other list if present
      const cleanedOther = other.filter((a) => a !== allergen);
      return type === 'contains'
        ? { ...prev, allergens: updated, mayContain: cleanedOther }
        : { ...prev, mayContain: updated, allergens: cleanedOther };
    });
  };

  const addIngredient = () => {
    setForm((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', quantity: '' }],
    }));
  };

  const removeIngredient = (index: number) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const updateIngredient = (index: number, field: 'name' | 'quantity', value: string) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) =>
        i === index ? { ...ing, [field]: value } : ing
      ),
    }));
  };

  const totalPages = Math.ceil(total / limit);

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
            <UtensilsCrossed className="h-6 w-6 text-purple-400" />
            Meal Items
          </h1>
          <p className="text-sm text-white/50">Manage your meal item library</p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 hover:from-purple-700 hover:to-pink-700"
        >
          <Plus className="h-4 w-4" />
          Create Meal Item
        </Button>
      </motion.div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Items', value: total, icon: UtensilsCrossed, color: 'text-purple-400' },
          { label: 'Breakfast', value: breakfastCount, icon: Coffee, color: 'text-amber-400' },
          { label: 'Snacks', value: snackCount, icon: Apple, color: 'text-pink-400' },
          { label: 'Lunch', value: lunchCount, icon: Soup, color: 'text-emerald-400' },
          { label: 'Most Used', value: mostUsedItem, icon: Flame, color: 'text-orange-400' },
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
            <p className="text-lg font-bold text-white truncate">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-white/60">
          <Filter className="h-4 w-4" />
          Filters
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <Input
              placeholder="Search by name, ingredient, or tag..."
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

          {/* Meal Type */}
          <Select value={mealTypeFilter} onValueChange={(v) => { setMealTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Meal Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Meal Types</SelectItem>
              {Object.entries(MEAL_TYPE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category */}
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Vegetarian Toggle */}
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <Leaf className="h-4 w-4 text-emerald-400" />
            <Label className="text-xs text-white/60">Veg</Label>
            <Switch checked={vegOnly} onCheckedChange={(v) => { setVegOnly(v); setPage(1); }} />
          </div>

          {/* Vegan Toggle */}
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <Vegan className="h-4 w-4 text-green-400" />
            <Label className="text-xs text-white/60">Vegan</Label>
            <Switch checked={veganOnly} onCheckedChange={(v) => { setVeganOnly(v); setPage(1); }} />
          </div>

          {/* Allergen-Free Toggle */}
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
            <Egg className="h-4 w-4 text-amber-400" />
            <Label className="text-xs text-white/60">Allergen-Free</Label>
            <Switch checked={allergenFreeFilter} onCheckedChange={(v) => { setAllergenFreeFilter(v); setPage(1); }} />
          </div>
        </div>
      </div>

      {/* ── Meal Items Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-white/5" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-white/30">
          <UtensilsCrossed className="h-16 w-16 mb-4" />
          <p className="text-lg font-medium">No meal items found</p>
          <p className="text-sm">Create your first meal item to get started</p>
          <Button
            onClick={openCreateDialog}
            className="mt-4 gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0"
          >
            <Plus className="h-4 w-4" />
            Create Meal Item
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <MealCard
                  mealItem={item}
                  variant="compact"
                  onEdit={() => openEditDialog(item)}
                  onDelete={() => handleDelete(item)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Pagination ── */}
      {!loading && total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/40">
            Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Previous
            </Button>
            <span className="text-sm text-white/60">{page} / {totalPages || 1}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* ── Create/Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0f0f2e] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingItem ? 'Edit Meal Item' : 'Create Meal Item'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-white/60 text-xs">Name *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="e.g., Paneer Butter Masala"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-white/60 text-xs">Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="bg-white/5 border-white/10 text-white min-h-[60px]"
                    placeholder="Brief description of the meal item"
                  />
                </div>
                <div>
                  <Label className="text-white/60 text-xs">Image URL</Label>
                  <Input
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label className="text-white/60 text-xs">Meal Type *</Label>
                  <Select value={form.mealType} onValueChange={(v) => setForm({ ...form, mealType: v as MealType })}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(MEAL_TYPE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dietary Toggles */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={form.isVegetarian} onCheckedChange={(v) => setForm({ ...form, isVegetarian: v })} />
                  <Label className="text-white/60 text-xs flex items-center gap-1">
                    <Leaf className="h-3 w-3 text-emerald-400" /> Vegetarian
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.isVegan} onCheckedChange={(v) => setForm({ ...form, isVegan: v })} />
                  <Label className="text-white/60 text-xs flex items-center gap-1">
                    <Vegan className="h-3 w-3 text-green-400" /> Vegan
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.isEggless} onCheckedChange={(v) => setForm({ ...form, isEggless: v })} />
                  <Label className="text-white/60 text-xs flex items-center gap-1">
                    <Egg className="h-3 w-3 text-amber-400" /> Eggless
                  </Label>
                </div>
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Nutrition Section (Expandable) */}
            <Collapsible open={nutritionOpen} onOpenChange={setNutritionOpen}>
              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-white/5 p-3 hover:bg-white/10 transition-colors">
                <span className="text-sm font-medium text-white flex items-center gap-2">
                  <Flame className="h-4 w-4 text-amber-400" />
                  Nutrition Information
                </span>
                {nutritionOpen ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'calories', label: 'Calories (kcal)', icon: '🔥' },
                    { key: 'protein', label: 'Protein (g)', icon: '💪' },
                    { key: 'carbohydrates', label: 'Carbs (g)', icon: '🍞' },
                    { key: 'fat', label: 'Fat (g)', icon: '🧈' },
                    { key: 'fiber', label: 'Fiber (g)', icon: '🌾' },
                    { key: 'sugar', label: 'Sugar (g)', icon: '🍬' },
                    { key: 'calcium', label: 'Calcium (mg)', icon: '🦴' },
                    { key: 'iron', label: 'Iron (mg)', icon: '🔩' },
                    { key: 'vitaminC', label: 'Vitamin C (mg)', icon: '🍊' },
                  ].map((field) => (
                    <div key={field.key}>
                      <Label className="text-white/50 text-[10px]">
                        {field.icon} {field.label}
                      </Label>
                      <Input
                        type="number"
                        value={form[field.key as keyof MealItemForm] as number}
                        onChange={(e) => setForm({ ...form, [field.key]: Number(e.target.value) })}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator className="bg-white/10" />

            {/* Allergen Checkboxes */}
            <div className="space-y-3">
              <Label className="text-white/60 text-xs font-medium">Allergen Information</Label>
              <div className="grid grid-cols-2 gap-4">
                {/* Contains */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">Contains</p>
                  <div className="space-y-1">
                    {ALLERGEN_LIST.map((allergen) => (
                      <div key={allergen} className="flex items-center gap-2">
                        <Checkbox
                          checked={form.allergens.includes(allergen)}
                          onCheckedChange={() => toggleAllergen(allergen, 'contains')}
                          className="border-white/20 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                        />
                        <span className="text-xs text-white/60">
                          {ALLERGEN_EMOJIS[allergen]} {ALLERGEN_LABELS[allergen]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* May Contain */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">May Contain</p>
                  <div className="space-y-1">
                    {ALLERGEN_LIST.map((allergen) => (
                      <div key={allergen} className="flex items-center gap-2">
                        <Checkbox
                          checked={form.mayContain.includes(allergen)}
                          onCheckedChange={() => toggleAllergen(allergen, 'mayContain')}
                          className="border-white/20 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                        />
                        <span className="text-xs text-white/60">
                          {ALLERGEN_EMOJIS[allergen]} {ALLERGEN_LABELS[allergen]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Ingredients */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-white/60 text-xs font-medium">Ingredients</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addIngredient}
                  className="text-purple-400 hover:text-purple-300 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {form.ingredients.map((ing, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={ing.name}
                      onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                      className="bg-white/5 border-white/10 text-white flex-1"
                      placeholder="Ingredient"
                    />
                    <Input
                      value={ing.quantity}
                      onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}
                      className="bg-white/5 border-white/10 text-white w-24"
                      placeholder="Qty"
                    />
                    {form.ingredients.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeIngredient(idx)}
                        className="text-red-400 hover:text-red-300 shrink-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Category, Cuisine, Tags, Times */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/60 text-xs">Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/60 text-xs">Cuisine</Label>
                <Select value={form.cuisine} onValueChange={(v) => setForm({ ...form, cuisine: v })}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Select cuisine" />
                  </SelectTrigger>
                  <SelectContent>
                    {CUISINES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/60 text-xs">Tags (comma-separated)</Label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="e.g., spicy, popular, seasonal"
                />
              </div>
              <div>
                <Label className="text-white/60 text-xs">Serving Size</Label>
                <Input
                  value={form.servingSize}
                  onChange={(e) => setForm({ ...form, servingSize: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="1 serving"
                />
              </div>
              <div>
                <Label className="text-white/60 text-xs">Prep Time (min)</Label>
                <Input
                  type="number"
                  value={form.prepTime}
                  onChange={(e) => setForm({ ...form, prepTime: Number(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white/60 text-xs">Cook Time (min)</Label>
                <Input
                  type="number"
                  value={form.cookTime}
                  onChange={(e) => setForm({ ...form, cookTime: Number(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-white/60 text-xs">Cost per Serving (₹)</Label>
                <Input
                  type="number"
                  value={form.costPerServing}
                  onChange={(e) => setForm({ ...form, costPerServing: Number(e.target.value) })}
                  className="bg-white/5 border-white/10 text-white"
                  placeholder="0.00"
                />
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
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 hover:from-purple-700 hover:to-pink-700"
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingItem ? 'Update Item' : 'Create Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
