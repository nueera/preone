'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Star,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Send,
  Loader2,
  UtensilsCrossed,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import type { MealType, MealPlanItem } from './types';
import { MEAL_TYPE_COLORS, MEAL_TYPE_LABELS, MEAL_TYPES_ORDER } from './types';

interface Student {
  id: string;
  name: string;
  photoUrl?: string;
}

interface CellData {
  rating: number;
  eatenPercent: number;
  comment: string;
  alternativeServed: boolean;
}

interface GridData {
  [studentId: string]: {
    [mealType: string]: CellData;
  };
}

interface FeedbackPayload {
  studentId: string;
  mealType: MealType;
  mealPlanItemId: string;
  rating: number;
  eatenPercent: number;
  comment: string;
  alternativeServed: boolean;
}

interface MealFeedbackFormProps {
  students: Student[];
  meals: MealType[];
  mealPlanItems: MealPlanItem[];
  date: string;
  onSubmit: (data: FeedbackPayload[]) => void | Promise<void>;
  isLoading?: boolean;
  className?: string;
}

const EATEN_OPTIONS = [0, 25, 50, 75, 100] as const;

function getMealPlanItemId(
  mealPlanItems: MealPlanItem[],
  mealType: MealType
): string {
  return (
    mealPlanItems.find((item) => item.mealType === mealType)?.id ?? ''
  );
}

export function MealFeedbackForm({
  students,
  meals,
  mealPlanItems,
  date,
  onSubmit,
  isLoading = false,
  className,
}: MealFeedbackFormProps) {
  const orderedMeals = meals
    .filter((m) => MEAL_TYPES_ORDER.includes(m))
    .sort(
      (a, b) =>
        MEAL_TYPES_ORDER.indexOf(a) - MEAL_TYPES_ORDER.indexOf(b)
    );

  // Initialize grid data
  const [grid, setGrid] = useState<GridData>(() => {
    const initial: GridData = {};
    for (const s of students) {
      initial[s.id] = {};
      for (const m of orderedMeals) {
        initial[s.id][m] = {
          rating: 0,
          eatenPercent: 0,
          comment: '',
          alternativeServed: false,
        };
      }
    }
    return initial;
  });

  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set()
  );

  // Update a single cell
  const updateCell = useCallback(
    (
      studentId: string,
      mealType: string,
      field: keyof CellData,
      value: number | string | boolean
    ) => {
      setGrid((prev) => ({
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [mealType]: {
            ...prev[studentId]?.[mealType],
            [field]: value,
          },
        },
      }));
    },
    []
  );

  // Quick fill: All 100%
  const fillAll100 = useCallback(() => {
    setGrid((prev) => {
      const next = { ...prev };
      for (const s of students) {
        next[s.id] = { ...next[s.id] };
        for (const m of orderedMeals) {
          next[s.id][m] = {
            ...next[s.id][m],
            rating: 5,
            eatenPercent: 100,
          };
        }
      }
      return next;
    });
  }, [students, orderedMeals]);

  // Quick fill: All 50%
  const fillAll50 = useCallback(() => {
    setGrid((prev) => {
      const next = { ...prev };
      for (const s of students) {
        next[s.id] = { ...next[s.id] };
        for (const m of orderedMeals) {
          next[s.id][m] = {
            ...next[s.id][m],
            rating: 3,
            eatenPercent: 50,
          };
        }
      }
      return next;
    });
  }, [students, orderedMeals]);

  // Reset
  const resetAll = useCallback(() => {
    setGrid((prev) => {
      const next = { ...prev };
      for (const s of students) {
        next[s.id] = { ...next[s.id] };
        for (const m of orderedMeals) {
          next[s.id][m] = {
            rating: 0,
            eatenPercent: 0,
            comment: '',
            alternativeServed: false,
          };
        }
      }
      return next;
    });
  }, [students, orderedMeals]);

  // Submit
  const handleSubmit = async () => {
    const payload: FeedbackPayload[] = [];
    for (const s of students) {
      for (const m of orderedMeals) {
        const cell = grid[s.id]?.[m];
        if (cell && cell.rating > 0) {
          payload.push({
            studentId: s.id,
            mealType: m as MealType,
            mealPlanItemId: getMealPlanItemId(mealPlanItems, m as MealType),
            rating: cell.rating,
            eatenPercent: cell.eatenPercent,
            comment: cell.comment,
            alternativeServed: cell.alternativeServed,
          });
        }
      }
    }
    if (payload.length > 0) {
      await onSubmit(payload);
    }
  };

  const toggleComment = (studentId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">
            Meal Feedback
          </h3>
          <p className="text-xs text-white/40">
            {date} · {students.length} students · {orderedMeals.length} meals
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fillAll100}
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
          >
            All 100%
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fillAll50}
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
          >
            All 50%
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetAll}
            className="border-white/20 text-white/50 hover:bg-white/5"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="min-w-[700px]">
          {/* Column headers */}
          <div
            className="grid gap-2 mb-2 sticky top-0 z-10"
            style={{
              gridTemplateColumns: `180px repeat(${orderedMeals.length}, minmax(140px, 1fr)) 40px`,
            }}
          >
            <div className="flex items-center px-2">
              <span className="text-xs font-medium text-white/40">
                Student
              </span>
            </div>
            {orderedMeals.map((mt) => (
              <div
                key={mt}
                className="flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5"
                style={{
                  backgroundColor: `${MEAL_TYPE_COLORS[mt]}15`,
                }}
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: MEAL_TYPE_COLORS[mt] }}
                />
                <span
                  className="text-[11px] font-semibold truncate"
                  style={{ color: MEAL_TYPE_COLORS[mt] }}
                >
                  {MEAL_TYPE_LABELS[mt]}
                </span>
              </div>
            ))}
            <div /> {/* comment toggle col */}
          </div>

          {/* Student rows */}
          {students.map((student) => {
            const isExpanded = expandedComments.has(student.id);
            return (
              <motion.div
                key={student.id}
                layout
                className="mb-2 rounded-xl border border-white/10 bg-[#121234]/60 overflow-hidden"
              >
                {/* Main row */}
                <div
                  className="grid gap-2 p-2 items-center"
                  style={{
                    gridTemplateColumns: `180px repeat(${orderedMeals.length}, minmax(140px, 1fr)) 40px`,
                  }}
                >
                  {/* Student info */}
                  <div className="flex items-center gap-2 px-1">
                    <Avatar className="h-7 w-7 shrink-0">
                      {student.photoUrl ? (
                        <AvatarImage src={student.photoUrl} alt={student.name} />
                      ) : null}
                      <AvatarFallback className="bg-indigo-500/20 text-indigo-300 text-[10px]">
                        {student.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-white truncate">
                      {student.name}
                    </span>
                  </div>

                  {/* Meal cells */}
                  {orderedMeals.map((mt) => {
                    const cell = grid[student.id]?.[mt] ?? {
                      rating: 0,
                      eatenPercent: 0,
                      comment: '',
                      alternativeServed: false,
                    };
                    return (
                      <MealCell
                        key={`${student.id}-${mt}`}
                        rating={cell.rating}
                        eatenPercent={cell.eatenPercent}
                        alternativeServed={cell.alternativeServed}
                        onRatingChange={(r) =>
                          updateCell(student.id, mt, 'rating', r)
                        }
                        onEatenChange={(e) =>
                          updateCell(student.id, mt, 'eatenPercent', e)
                        }
                        onAlternativeToggle={(v) =>
                          updateCell(student.id, mt, 'alternativeServed', v)
                        }
                      />
                    );
                  })}

                  {/* Comment toggle */}
                  <button
                    onClick={() => toggleComment(student.id)}
                    className={cn(
                      'flex items-center justify-center rounded-md p-1.5 transition-colors',
                      isExpanded
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'text-white/30 hover:bg-white/5 hover:text-white/60'
                    )}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                </div>

                {/* Expanded comment section */}
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/5 px-4 py-3 space-y-2"
                  >
                    <Textarea
                      placeholder={`Add comments about ${student.name}'s meal today...`}
                      className="min-h-[60px] bg-white/5 border-white/10 text-white placeholder:text-white/20 text-xs"
                      value={
                        grid[student.id]?.[orderedMeals[0]]?.comment ?? ''
                      }
                      onChange={(e) => {
                        // Apply same comment to all meals for this student
                        for (const m of orderedMeals) {
                          updateCell(student.id, m, 'comment', e.target.value);
                        }
                      }}
                    />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-indigo-500 hover:bg-indigo-600 text-white gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Submit Feedback
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Individual meal cell (star rating + eaten % + alternative toggle)
// ============================================================

interface MealCellProps {
  rating: number;
  eatenPercent: number;
  alternativeServed: boolean;
  onRatingChange: (rating: number) => void;
  onEatenChange: (percent: number) => void;
  onAlternativeToggle: (value: boolean) => void;
}

function MealCell({
  rating,
  eatenPercent,
  alternativeServed,
  onRatingChange,
  onEatenChange,
  onAlternativeToggle,
}: MealCellProps) {
  const [showAlt, setShowAlt] = useState(false);

  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-white/[0.03] p-2">
      {/* Star rating */}
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onRatingChange(i + 1 === rating ? 0 : i + 1)}
            className="p-0 hover:scale-110 transition-transform"
          >
            <Star
              className={cn(
                'h-3.5 w-3.5',
                i < rating
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-white/15 hover:text-white/30'
              )}
            />
          </button>
        ))}
      </div>

      {/* Eaten % buttons */}
      <div className="flex items-center gap-0.5">
        {EATEN_OPTIONS.map((pct) => (
          <button
            key={pct}
            type="button"
            onClick={() => onEatenChange(pct)}
            className={cn(
              'flex-1 rounded px-1 py-0.5 text-[9px] font-medium transition-colors',
              eatenPercent === pct
                ? 'bg-indigo-500/30 text-indigo-300'
                : 'bg-white/5 text-white/30 hover:bg-white/10'
            )}
          >
            {pct}%
          </button>
        ))}
      </div>

      {/* Alternative toggle */}
      <button
        type="button"
        onClick={() => {
          setShowAlt(!showAlt);
          if (!showAlt) onAlternativeToggle(true);
          else onAlternativeToggle(false);
        }}
        className={cn(
          'flex items-center gap-1 text-[10px] transition-colors',
          alternativeServed
            ? 'text-violet-400'
            : 'text-white/20 hover:text-white/40'
        )}
      >
        <UtensilsCrossed className="h-2.5 w-2.5" />
        Alt served
      </button>
    </div>
  );
}
