'use client';

import { motion } from 'framer-motion';
import {
  Star,
  AlertTriangle,
  Pencil,
  Trash2,
  Leaf,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { MealItem, AllergenType, StudentAllergy } from './types';
import { MEAL_TYPE_COLORS, MEAL_TYPE_LABELS } from './types';
import { AllergenTag } from './AllergenTag';
import { NutritionBar } from './NutritionBar';

interface MealCardProps {
  mealItem: MealItem;
  variant?: 'compact' | 'detailed' | 'feedback';
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  allergyConflict?: boolean;
  studentAllergies?: StudentAllergy[];
  /** Feedback variant props */
  rating?: number;
  eatenPercent?: number;
  className?: string;
}

// ============================================================
// Veg indicator dot
// ============================================================

function VegDot({ isVegetarian }: { isVegetarian: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex h-4 w-4 items-center justify-center rounded-full border',
        isVegetarian
          ? 'border-emerald-500/40 bg-emerald-500/20'
          : 'border-red-500/40 bg-red-500/20'
      )}
      title={isVegetarian ? 'Vegetarian' : 'Non-Vegetarian'}
    >
      <Leaf
        className={cn(
          'h-2.5 w-2.5',
          isVegetarian ? 'text-emerald-400' : 'text-red-400'
        )}
      />
    </span>
  );
}

// ============================================================
// Star rating display
// ============================================================

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3.5 w-3.5',
            i < rating
              ? 'fill-amber-400 text-amber-400'
              : 'fill-transparent text-white/20'
          )}
        />
      ))}
    </div>
  );
}

// ============================================================
// Eaten % bar
// ============================================================

function EatenBar({ percent }: { percent: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full',
            percent >= 75
              ? 'bg-emerald-400'
              : percent >= 50
                ? 'bg-amber-400'
                : 'bg-red-400'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
      <span className="text-[10px] text-white/50 tabular-nums w-8 text-right">
        {percent}%
      </span>
    </div>
  );
}

// ============================================================
// Allergen warning overlay
// ============================================================

function AllergyOverlay() {
  return (
    <motion.div
      className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-red-900/60 backdrop-blur-[2px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-2 rounded-lg bg-red-950/80 px-3 py-2">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <span className="text-sm font-semibold text-red-300">
          Allergy Conflict
        </span>
      </div>
    </motion.div>
  );
}

// ============================================================
// COMPACT variant
// ============================================================

function MealCardCompact({
  mealItem,
  onClick,
  allergyConflict,
}: MealCardProps) {
  const mealColor = MEAL_TYPE_COLORS[mealItem.mealType];

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        'relative flex overflow-hidden rounded-xl border border-white/10 bg-[#121234]/80 cursor-pointer transition-shadow hover:shadow-lg',
        allergyConflict && 'border-red-500/40'
      )}
      onClick={onClick}
    >
      {/* Meal type color stripe */}
      <div
        className="w-1 shrink-0"
        style={{ backgroundColor: mealColor }}
      />

      <div className="flex flex-1 items-center gap-3 p-3">
        {/* Veg dot */}
        <VegDot isVegetarian={mealItem.isVegetarian} />

        {/* Name + allergens */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {mealItem.name}
          </p>
          {mealItem.allergens.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {mealItem.allergens.slice(0, 3).map((a) => (
                <AllergenTag
                  key={a}
                  allergen={a}
                  size="sm"
                  variant={
                    allergyConflict
                      ? 'danger'
                      : 'default'
                  }
                />
              ))}
              {mealItem.allergens.length > 3 && (
                <span className="text-[10px] text-white/40">
                  +{mealItem.allergens.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Calorie badge */}
        <Badge
          variant="secondary"
          className="gap-1 bg-white/10 text-white/70 hover:bg-white/15"
        >
          <Flame className="h-3 w-3 text-amber-400" />
          {mealItem.calories}
        </Badge>
      </div>

      {allergyConflict && <AllergyOverlay />}
    </motion.div>
  );
}

// ============================================================
// DETAILED variant
// ============================================================

function MealCardDetailed({
  mealItem,
  onClick,
  onEdit,
  onDelete,
  allergyConflict,
  studentAllergies,
}: MealCardProps) {
  const mealColor = MEAL_TYPE_COLORS[mealItem.mealType];
  const conflictAllergens = new Set<AllergenType>(
    studentAllergies?.map((sa) => sa.allergen) ?? []
  );

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        'relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#121234]/80 cursor-pointer transition-shadow hover:shadow-xl',
        allergyConflict && 'border-red-500/40'
      )}
      onClick={onClick}
    >
      {/* Meal type color header stripe */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: mealColor }}
      />

      {/* Image placeholder */}
      <div className="relative h-36 w-full bg-gradient-to-br from-white/5 to-white/[0.02] flex items-center justify-center">
        {mealItem.image ? (
          <img
            src={mealItem.image}
            alt={mealItem.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-4xl">🍽️</span>
        )}

        {/* Action buttons */}
        {(onEdit || onDelete) && (
          <div className="absolute right-2 top-2 flex gap-1">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="rounded-md bg-black/50 p-1.5 text-white/70 hover:bg-black/70 hover:text-white transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="rounded-md bg-black/50 p-1.5 text-white/70 hover:bg-red-500/80 hover:text-white transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Meal type label */}
        <span
          className="absolute left-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
          style={{ backgroundColor: mealColor }}
        >
          {MEAL_TYPE_LABELS[mealItem.mealType]}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white truncate">
              {mealItem.name}
            </h3>
            {mealItem.description && (
              <p className="mt-0.5 text-xs text-white/50 line-clamp-2">
                {mealItem.description}
              </p>
            )}
          </div>
          <VegDot isVegetarian={mealItem.isVegetarian} />
        </div>

        {/* Category / Cuisine tags */}
        {(mealItem.category || mealItem.cuisine) && (
          <div className="flex flex-wrap gap-1.5">
            {mealItem.category && (
              <Badge
                variant="secondary"
                className="bg-white/10 text-white/60 hover:bg-white/15"
              >
                {mealItem.category}
              </Badge>
            )}
            {mealItem.cuisine && (
              <Badge
                variant="secondary"
                className="bg-white/10 text-white/60 hover:bg-white/15"
              >
                {mealItem.cuisine}
              </Badge>
            )}
            {mealItem.isVegan && (
              <Badge className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30">
                Vegan
              </Badge>
            )}
            {mealItem.isEggless && (
              <Badge className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/30">
                Eggless
              </Badge>
            )}
          </div>
        )}

        {/* Nutrition bars */}
        <div className="space-y-2">
          <NutritionBar
            label="Calories"
            value={mealItem.calories}
            recommended={1200}
            unit="kcal"
            color="bg-amber-400"
          />
          <NutritionBar
            label="Protein"
            value={mealItem.protein}
            recommended={16}
            unit="g"
          />
          <NutritionBar
            label="Calcium"
            value={mealItem.calcium}
            recommended={600}
            unit="mg"
          />
        </div>

        {/* Allergen tags */}
        {(mealItem.allergens.length > 0 || mealItem.mayContain.length > 0) && (
          <div className="space-y-1.5">
            {mealItem.allergens.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {mealItem.allergens.map((a) => (
                  <AllergenTag
                    key={a}
                    allergen={a}
                    size="sm"
                    variant={
                      conflictAllergens.has(a)
                        ? 'danger'
                        : allergyConflict
                          ? 'warning'
                          : 'default'
                    }
                  />
                ))}
              </div>
            )}
            {mealItem.mayContain.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-[10px] text-white/30 mr-1">May contain:</span>
                {mealItem.mayContain.map((a) => (
                  <AllergenTag
                    key={a}
                    allergen={a}
                    size="sm"
                    variant={
                      conflictAllergens.has(a)
                        ? 'warning'
                        : 'default'
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {allergyConflict && <AllergyOverlay />}
    </motion.div>
  );
}

// ============================================================
// FEEDBACK variant
// ============================================================

function MealCardFeedback({
  mealItem,
  onClick,
  allergyConflict,
  rating = 0,
  eatenPercent = 0,
}: MealCardProps) {
  const mealColor = MEAL_TYPE_COLORS[mealItem.mealType];

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={cn(
        'relative flex overflow-hidden rounded-xl border border-white/10 bg-[#121234]/80 cursor-pointer transition-shadow hover:shadow-lg',
        allergyConflict && 'border-red-500/40'
      )}
      onClick={onClick}
    >
      {/* Meal type color stripe */}
      <div
        className="w-1 shrink-0"
        style={{ backgroundColor: mealColor }}
      />

      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Top row: veg + name + calories */}
        <div className="flex items-center gap-2">
          <VegDot isVegetarian={mealItem.isVegetarian} />
          <span className="flex-1 text-sm font-medium text-white truncate">
            {mealItem.name}
          </span>
          <Badge
            variant="secondary"
            className="gap-1 bg-white/10 text-white/70 hover:bg-white/15"
          >
            <Flame className="h-3 w-3 text-amber-400" />
            {mealItem.calories}
          </Badge>
        </div>

        {/* Star rating */}
        <div className="flex items-center gap-3">
          <StarRating rating={rating} />
          <span className="text-[10px] text-white/30">
            {rating > 0 ? `${rating}/5` : 'No rating'}
          </span>
        </div>

        {/* Eaten % bar */}
        <EatenBar percent={eatenPercent} />

        {/* Allergens */}
        {mealItem.allergens.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {mealItem.allergens.slice(0, 3).map((a) => (
              <AllergenTag
                key={a}
                allergen={a}
                size="sm"
                variant={allergyConflict ? 'danger' : 'default'}
              />
            ))}
            {mealItem.allergens.length > 3 && (
              <span className="text-[10px] text-white/40">
                +{mealItem.allergens.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {allergyConflict && <AllergyOverlay />}
    </motion.div>
  );
}

// ============================================================
// Main exported component
// ============================================================

export function MealCard(props: MealCardProps) {
  switch (props.variant ?? 'compact') {
    case 'detailed':
      return <MealCardDetailed {...props} />;
    case 'feedback':
      return <MealCardFeedback {...props} />;
    case 'compact':
    default:
      return <MealCardCompact {...props} />;
  }
}
