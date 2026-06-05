'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, AlertTriangle, Leaf, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  MealPlanItem,
  MealType,
  DayOfWeek,
  StudentAllergy,
  AllergenType,
} from './types';
import {
  MEAL_TYPE_COLORS,
  MEAL_TYPE_LABELS,
  DAY_SHORT_LABELS,
  MEAL_TYPES_ORDER,
} from './types';

interface WeeklyDayMeals {
  day: DayOfWeek;
  meals: Partial<Record<MealType, MealPlanItem[]>>;
}

interface ConflictWarning {
  dayOfWeek: DayOfWeek;
  mealType: MealType;
  allergens: AllergenType[];
}

interface MealPlanGridProps {
  weeklyMenu: WeeklyDayMeals[];
  studentAllergies?: StudentAllergy[];
  editable?: boolean;
  onCellClick?: (dayOfWeek: DayOfWeek, mealType: MealType) => void;
  conflictWarnings?: ConflictWarning[];
  className?: string;
}

const DAYS: DayOfWeek[] = [1, 2, 3, 4, 5];

function getConflictKey(day: DayOfWeek, mealType: MealType) {
  return `${day}-${mealType}`;
}

export function MealPlanGrid({
  weeklyMenu,
  studentAllergies,
  editable = false,
  onCellClick,
  conflictWarnings,
  className,
}: MealPlanGridProps) {
  const [expandedDay, setExpandedDay] = useState<DayOfWeek | null>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const conflictMap = new Map<string, ConflictWarning>();
  conflictWarnings?.forEach((cw) => {
    conflictMap.set(getConflictKey(cw.dayOfWeek, cw.mealType), cw);
  });

  const studentAllergenSet = new Set<AllergenType>(
    studentAllergies?.map((sa) => sa.allergen) ?? []
  );

  function getMealsForCell(day: DayOfWeek, mealType: MealType): MealPlanItem[] {
    const dayData = weeklyMenu.find((d) => d.day === day);
    if (!dayData?.meals) return [];
    return dayData.meals[mealType] ?? [];
  }

  function getDayTotals(day: DayOfWeek) {
    let cal = 0;
    let protein = 0;
    for (const mt of MEAL_TYPES_ORDER) {
      const items = getMealsForCell(day, mt);
      for (const item of items) {
        if (item.mealItem && !item.isAlternative) {
          cal += item.mealItem.calories;
          protein += item.mealItem.protein;
        }
      }
    }
    return { cal, protein: Math.round(protein) };
  }

  // ============================================================
  // Single cell
  // ============================================================

  function Cell({ day, mealType }: { day: DayOfWeek; mealType: MealType }) {
    const items = getMealsForCell(day, mealType);
    const mainItem = items.find((i) => !i.isAlternative);
    const alternatives = items.filter((i) => i.isAlternative);
    const conflict = conflictMap.get(getConflictKey(day, mealType));
    const hasConflict = !!conflict;
    const mealColor = MEAL_TYPE_COLORS[mealType];

    return (
      <motion.div
        whileHover={{ scale: editable ? 1.03 : 1 }}
        whileTap={{ scale: editable ? 0.97 : 1 }}
        className={cn(
          'relative flex flex-col gap-1 rounded-lg border p-2 transition-colors cursor-pointer min-h-[72px]',
          hasConflict
            ? 'border-red-500/50 bg-red-950/30'
            : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]',
          !mainItem && editable && 'border-dashed border-white/20'
        )}
        onClick={() => onCellClick?.(day, mealType)}
      >
        {/* Main meal */}
        {mainItem?.mealItem ? (
          <>
            <div className="flex items-center gap-1.5">
              <Leaf
                className={cn(
                  'h-3 w-3 shrink-0',
                  mainItem.mealItem.isVegetarian
                    ? 'text-emerald-400'
                    : 'text-red-400'
                )}
              />
              <span className="text-xs font-medium text-white/90 truncate">
                {mainItem.mealItem.name}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-white/40">
              <span>{mainItem.mealItem.calories} kcal</span>
              {mainItem.mealItem.allergens.some((a) =>
                studentAllergenSet.has(a)
              ) && (
                <AlertTriangle className="h-3 w-3 text-amber-400" />
              )}
            </div>
            {/* Alternatives */}
            {alternatives.map((alt) => (
              <div
                key={alt.id}
                className="mt-0.5 flex items-center gap-1 text-[10px] text-white/30 italic border-t border-white/5 pt-1"
              >
                <Leaf className="h-2.5 w-2.5 text-emerald-400/60" />
                <span className="truncate">{alt.mealItem?.name}</span>
              </div>
            ))}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            {editable ? (
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{ backgroundColor: `${mealColor}20` }}
              >
                <Plus
                  className="h-4 w-4"
                  style={{ color: mealColor }}
                />
              </div>
            ) : (
              <span className="text-[10px] text-white/20">—</span>
            )}
          </div>
        )}

        {/* Conflict indicator */}
        {hasConflict && (
          <div className="absolute right-1 top-1">
            <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
          </div>
        )}
      </motion.div>
    );
  }

  // ============================================================
  // Mobile: stacked by day
  // ============================================================

  function MobileDay({ day }: { day: DayOfWeek }) {
    const isExpanded = expandedDay === day;
    const totals = getDayTotals(day);

    return (
      <div className="rounded-xl border border-white/10 bg-[#121234]/80 overflow-hidden">
        {/* Day header */}
        <button
          className="flex w-full items-center justify-between p-3 hover:bg-white/5 transition-colors"
          onClick={() => setExpandedDay(isExpanded ? null : day)}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white">
              {DAY_SHORT_LABELS[day]}
            </span>
            <span className="text-[10px] text-white/40">
              {totals.cal} kcal · {totals.protein}g protein
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-white/40" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/40" />
          )}
        </button>

        {/* Meal rows */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-1 px-3 pb-3">
                {MEAL_TYPES_ORDER.map((mt) => (
                  <div key={mt} className="flex items-stretch gap-2">
                    {/* Meal type label */}
                    <div
                      className="w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: MEAL_TYPE_COLORS[mt] }}
                    />
                    <div className="flex-1 text-xs text-white/40 py-0.5">
                      {MEAL_TYPE_LABELS[mt]}
                    </div>
                    <div className="flex-1">
                      <Cell day={day} mealType={mt} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ============================================================
  // Desktop: grid layout
  // ============================================================

  return (
    <div className={cn('space-y-2', className)}>
      {/* Mobile view */}
      <div className="flex flex-col gap-2 md:hidden">
        {DAYS.map((day) => (
          <MobileDay key={day} day={day} />
        ))}
      </div>

      {/* Desktop view */}
      <div className="hidden md:block overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Header row */}
          <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-2 mb-2">
            <div /> {/* empty corner */}
            {DAYS.map((day) => {
              const totals = getDayTotals(day);
              return (
                <div
                  key={day}
                  className="flex flex-col items-center gap-0.5 rounded-lg bg-white/[0.03] p-2"
                >
                  <span className="text-xs font-semibold text-white">
                    {DAY_SHORT_LABELS[day]}
                  </span>
                  <span className="text-[10px] text-white/30">
                    {totals.cal} kcal
                  </span>
                </div>
              );
            })}
          </div>

          {/* Meal type rows */}
          {MEAL_TYPES_ORDER.map((mealType) => (
            <div
              key={mealType}
              className="grid grid-cols-[100px_repeat(5,1fr)] gap-2 mb-2"
            >
              {/* Meal type label */}
              <div
                className="flex items-center gap-2 rounded-lg px-3"
                style={{ backgroundColor: `${MEAL_TYPE_COLORS[mealType]}15` }}
              >
                <div
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: MEAL_TYPE_COLORS[mealType],
                  }}
                />
                <span
                  className="text-[11px] font-medium truncate"
                  style={{ color: MEAL_TYPE_COLORS[mealType] }}
                >
                  {MEAL_TYPE_LABELS[mealType]}
                </span>
              </div>

              {/* Day cells */}
              {DAYS.map((day) => (
                <Cell key={`${day}-${mealType}`} day={day} mealType={mealType} />
              ))}
            </div>
          ))}

          {/* Daily nutrition summary row */}
          <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-2 mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center px-3">
              <span className="text-[11px] font-medium text-white/40">
                Daily Total
              </span>
            </div>
            {DAYS.map((day) => {
              const totals = getDayTotals(day);
              return (
                <div
                  key={`total-${day}`}
                  className="flex flex-col items-center gap-0.5 rounded-lg bg-white/[0.03] p-2"
                >
                  <span className="text-xs font-semibold text-white">
                    {totals.cal} kcal
                  </span>
                  <span className="text-[10px] text-white/30">
                    {totals.protein}g protein
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
