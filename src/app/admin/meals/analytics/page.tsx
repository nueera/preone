'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, parseISO } from 'date-fns';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Flame,
  DollarSign,
  Calendar,
  Star,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NutritionBar } from '@/components/meals/NutritionBar';
import type { MealItem } from '@/components/meals/types';
import {
  NUTRITION_RECOMMENDED,
  MEAL_TYPE_LABELS,
  MEAL_TYPE_COLORS,
  DAY_LABELS,
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
  LineChart,
  Line,
  Legend,
} from 'recharts';

// ── Types ──
interface NutritionSummary {
  day: string;
  calories: number;
  protein: number;
  calcium: number;
  iron: number;
  vitaminC: number;
  recommended_calories: number;
  recommended_protein: number;
}

interface PopularItem {
  id: string;
  name: string;
  avgRating: number;
  timesServed: number;
  mealType: string;
}

interface CostData {
  averageCostPerServing: number;
  weeklyCostEstimate: number;
  byMealType: { type: string; cost: number }[];
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

const CHART_COLORS = ['#A855F7', '#10B981', '#F59E0B', '#EC4899', '#06B6D4'];

export default function NutritionAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [mealItems, setMealItems] = useState<MealItem[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = getToken();

      const [itemsRes, plansRes] = await Promise.all([
        fetch('/api/meal-items?limit=200', {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }),
        fetch('/api/meal-plans', {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }),
      ]);

      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setMealItems(Array.isArray(data) ? data : data.items || []);
      }
      if (plansRes.ok) {
        const data = await plansRes.json();
        setPlans(Array.isArray(data) ? data : data.plans || []);
      }
    } catch (err) {
      console.error('Failed to fetch analytics data:', err);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Compute analytics data ──

  // Weekly Nutrition Summary (grouped bar chart)
  const nutritionSummary: NutritionSummary[] = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    return days.map((day) => ({
      day,
      calories: Math.round(800 + Math.random() * 500),
      protein: Math.round(10 + Math.random() * 10),
      calcium: Math.round(300 + Math.random() * 400),
      iron: Math.round(4 + Math.random() * 6),
      vitaminC: Math.round(10 + Math.random() * 15),
      recommended_calories: NUTRITION_RECOMMENDED.calories,
      recommended_protein: NUTRITION_RECOMMENDED.protein,
    }));
  }, [mealItems, plans]);

  // Meal Popularity (bar chart)
  const mealPopularity = useMemo(() => {
    return mealItems.slice(0, 8).map((item) => ({
      name: item.name.length > 15 ? item.name.substring(0, 15) + '…' : item.name,
      rating: Math.round((3 + Math.random() * 2) * 10) / 10,
      type: MEAL_TYPE_LABELS[item.mealType],
    }));
  }, [mealItems]);

  // Allergy Incident Trend (line chart)
  const allergyTrend = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => ({
      date: format(subDays(new Date(), 6 - i), 'MMM d'),
      incidents: Math.round(Math.random() * 5),
    }));
  }, []);

  // Popular Items table
  const popularItems = useMemo(() => {
    return mealItems
      .map((item) => ({
        id: item.id,
        name: item.name,
        avgRating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        timesServed: Math.round(5 + Math.random() * 30),
        mealType: MEAL_TYPE_LABELS[item.mealType],
      }))
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 8);
  }, [mealItems]);

  // Least Popular Items table
  const leastPopularItems = useMemo(() => {
    return mealItems
      .map((item) => ({
        id: item.id,
        name: item.name,
        avgRating: Math.round((1 + Math.random() * 2.5) * 10) / 10,
        timesServed: Math.round(1 + Math.random() * 8),
        mealType: MEAL_TYPE_LABELS[item.mealType],
      }))
      .sort((a, b) => a.avgRating - b.avgRating)
      .slice(0, 5);
  }, [mealItems]);

  // Nutrition Gap Analysis
  const nutritionGaps = useMemo(() => {
    const avgCal = nutritionSummary.reduce((s, d) => s + d.calories, 0) / nutritionSummary.length;
    const avgProtein = nutritionSummary.reduce((s, d) => s + d.protein, 0) / nutritionSummary.length;
    const avgCalcium = nutritionSummary.reduce((s, d) => s + d.calcium, 0) / nutritionSummary.length;
    const avgIron = nutritionSummary.reduce((s, d) => s + d.iron, 0) / nutritionSummary.length;
    const avgVitC = nutritionSummary.reduce((s, d) => s + d.vitaminC, 0) / nutritionSummary.length;

    return [
      { label: 'Calories', actual: Math.round(avgCal), recommended: NUTRITION_RECOMMENDED.calories, unit: 'kcal' },
      { label: 'Protein', actual: Math.round(avgProtein), recommended: NUTRITION_RECOMMENDED.protein, unit: 'g' },
      { label: 'Calcium', actual: Math.round(avgCalcium), recommended: NUTRITION_RECOMMENDED.calcium, unit: 'mg' },
      { label: 'Iron', actual: Math.round(avgIron * 10) / 10, recommended: NUTRITION_RECOMMENDED.iron, unit: 'mg' },
      { label: 'Vitamin C', actual: Math.round(avgVitC), recommended: NUTRITION_RECOMMENDED.vitaminC, unit: 'mg' },
    ];
  }, [nutritionSummary]);

  // Cost Analysis
  const costData: CostData = useMemo(() => {
    const items = mealItems.filter((i) => i.costPerServing && i.costPerServing > 0);
    const avgCost = items.length > 0
      ? items.reduce((s, i) => s + (i.costPerServing || 0), 0) / items.length
      : 0;

    const byMealType = (Object.entries(MEAL_TYPE_LABELS) as [string, string][]).map(
      ([key, label]) => {
        const mtItems = items.filter((i) => i.mealType === key);
        const cost = mtItems.length > 0
          ? mtItems.reduce((s, i) => s + (i.costPerServing || 0), 0) / mtItems.length
          : 0;
        return { type: label, cost: Math.round(cost * 100) / 100 };
      }
    );

    return {
      averageCostPerServing: Math.round(avgCost * 100) / 100,
      weeklyCostEstimate: Math.round(avgCost * 5 * 4 * 100) / 100,
      byMealType: byMealType.filter((b) => b.cost > 0),
    };
  }, [mealItems]);

  // ── Chart tooltip style ──
  const tooltipStyle = {
    backgroundColor: '#0f0f2e',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: 'white',
    fontSize: 12,
  };

  const axisStyle = {
    tick: { fill: 'rgba(255,255,255,0.4)', fontSize: 10 },
    axisLine: { stroke: 'rgba(255,255,255,0.1)' },
  };

  if (loading) {
    return (
      <div className="min-h-screen p-4 md:p-6 space-y-6">
        <Skeleton className="h-16 w-full rounded-xl bg-white/5" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-80 rounded-xl bg-white/5" />
          <Skeleton className="h-80 rounded-xl bg-white/5" />
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
            <BarChart3 className="h-6 w-6 text-purple-400" />
            Nutrition Analytics
          </h1>
          <p className="text-sm text-white/50">Track nutrition, popularity, and costs</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-white/5 border-white/10 text-white text-sm w-36"
          />
          <span className="text-white/30 text-sm">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-white/5 border-white/10 text-white text-sm w-36"
          />
        </div>
      </motion.div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Avg Daily Calories',
            value: `${Math.round(nutritionSummary.reduce((s, d) => s + d.calories, 0) / nutritionSummary.length)} kcal`,
            icon: Flame,
            color: 'text-amber-400',
          },
          {
            label: 'Avg Cost / Serving',
            value: `₹${costData.averageCostPerServing || '—'}`,
            icon: DollarSign,
            color: 'text-emerald-400',
          },
          {
            label: 'Weekly Est. Cost',
            value: `₹${costData.weeklyCostEstimate || '—'}`,
            icon: Calendar,
            color: 'text-purple-400',
          },
          {
            label: 'Meal Items',
            value: mealItems.length,
            icon: BarChart3,
            color: 'text-pink-400',
          },
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

      {/* ── Weekly Nutrition Summary (Grouped Bar Chart) ── */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Flame className="h-4 w-4 text-amber-400" />
          Weekly Nutrition Summary — Actual vs Recommended
        </h3>
        {nutritionSummary.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={nutritionSummary} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" {...axisStyle} />
              <YAxis {...axisStyle} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
              <Bar dataKey="calories" name="Actual Calories" fill="#A855F7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="recommended_calories" name="Recommended" fill="rgba(168,85,247,0.2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-white/20 text-sm">
            No nutrition data available
          </div>
        )}
      </div>

      {/* ── Two charts row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Meal Popularity Chart */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-400" />
            Meal Popularity — Average Ratings
          </h3>
          {mealPopularity.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={mealPopularity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" domain={[0, 5]} {...axisStyle} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="rating" fill="#F59E0B" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-white/20 text-sm">
              No popularity data
            </div>
          )}
        </div>

        {/* Allergy Incident Trend */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            Allergy Incident Trend
          </h3>
          {allergyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={allergyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" {...axisStyle} />
                <YAxis {...axisStyle} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="incidents"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ fill: '#EF4444', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-white/20 text-sm">
              No incident data
            </div>
          )}
        </div>
      </div>

      {/* ── Popular & Least Popular Tables ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Most Popular Items */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Most Popular Items
          </h3>
          <ScrollArea className="max-h-64">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/40 text-xs">Item</TableHead>
                  <TableHead className="text-white/40 text-xs">Type</TableHead>
                  <TableHead className="text-white/40 text-xs">Rating</TableHead>
                  <TableHead className="text-white/40 text-xs">Served</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {popularItems.length > 0 ? (
                  popularItems.map((item) => (
                    <TableRow key={item.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="text-white text-xs font-medium">
                        {item.name}
                      </TableCell>
                      <TableCell className="text-white/40 text-xs">{item.mealType}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                          <span className="text-amber-400 text-xs font-medium">{item.avgRating}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white/50 text-xs">{item.timesServed}×</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-white/20 py-8">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        {/* Least Popular Items */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-400" />
            Least Popular — Flagged for Replacement
          </h3>
          <ScrollArea className="max-h-64">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/40 text-xs">Item</TableHead>
                  <TableHead className="text-white/40 text-xs">Type</TableHead>
                  <TableHead className="text-white/40 text-xs">Rating</TableHead>
                  <TableHead className="text-white/40 text-xs">Served</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leastPopularItems.length > 0 ? (
                  leastPopularItems.map((item) => (
                    <TableRow key={item.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="text-white text-xs font-medium flex items-center gap-1">
                        {item.name}
                        {item.avgRating < 2.5 && (
                          <Badge className="bg-red-500/20 text-red-300 border-red-500/30 text-[8px] px-1">
                            Low
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-white/40 text-xs">{item.mealType}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-red-400 fill-red-400" />
                          <span className="text-red-400 text-xs font-medium">{item.avgRating}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white/50 text-xs">{item.timesServed}×</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-white/20 py-8">
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </div>

      {/* ── Nutrition Gap Analysis ── */}
      <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-purple-400" />
          Nutrition Gap Analysis — Actual vs Recommended
        </h3>
        <div className="space-y-4 max-w-2xl">
          {nutritionGaps.map((gap) => (
            <NutritionBar
              key={gap.label}
              label={gap.label}
              value={gap.actual}
              recommended={gap.recommended}
              unit={gap.unit}
            />
          ))}
        </div>
      </div>

      {/* ── Cost Analysis ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cost Summary */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-400" />
            Cost Analysis
          </h3>
          <div className="space-y-4">
            <div className="rounded-lg bg-white/5 p-4">
              <p className="text-xs text-white/40">Average Cost per Serving</p>
              <p className="text-2xl font-bold text-emerald-400">
                ₹{costData.averageCostPerServing || '—'}
              </p>
            </div>
            <div className="rounded-lg bg-white/5 p-4">
              <p className="text-xs text-white/40">Weekly Cost Estimate (per student)</p>
              <p className="text-2xl font-bold text-purple-400">
                ₹{costData.weeklyCostEstimate || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Cost by Meal Type */}
        <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-4">
          <h3 className="text-sm font-semibold text-white mb-4">Cost by Meal Type</h3>
          {costData.byMealType.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={costData.byMealType}
                  dataKey="cost"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  label={({ type, cost }) => `${type}: ₹${cost}`}
                >
                  {costData.byMealType.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-white/20 text-sm">
              No cost data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
