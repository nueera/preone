// ============================================================
// PreOne Meal & Nutrition — Shared Types
// Aligned with Prisma schema enums: MealType, AllergenType, AllergySeverity
// ============================================================

export type MealType = 'BREAKFAST' | 'MID_MORNING_SNACK' | 'LUNCH' | 'AFTERNOON_SNACK';

export type AllergenType =
  | 'MILK'
  | 'EGGS'
  | 'FISH'
  | 'SHELLFISH'
  | 'TREE_NUTS'
  | 'PEANUTS'
  | 'WHEAT'
  | 'SOYBEAN'
  | 'SESAME'
  | 'CELERY'
  | 'MUSTARD'
  | 'LUPIN'
  | 'MOLLUSCS'
  | 'SULPHITES'
  | 'GLUTEN'
  | 'HONEY'
  | 'SUGAR';

export type AllergySeverity = 'MILD' | 'MODERATE' | 'SEVERE' | 'LIFE_THREATENING';

export type DayOfWeek = 1 | 2 | 3 | 4 | 5; // 1=Monday, 5=Friday

export interface MealItem {
  id: string;
  name: string;
  description?: string;
  image?: string;
  mealType: MealType;
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
  category?: string;
  cuisine?: string;
  tags?: string[];
  prepTime?: number;
  cookTime?: number;
  costPerServing?: number;
}

export interface MealPlanItem {
  id: string;
  mealPlanId: string;
  mealItemId: string;
  dayOfWeek: DayOfWeek;
  mealType: MealType;
  isAlternative: boolean;
  alternativeFor?: string;
  sortOrder: number;
  mealItem?: MealItem;
}

export interface StudentAllergy {
  id: string;
  studentId: string;
  allergen: AllergenType;
  severity: AllergySeverity;
  reaction?: string;
  notes?: string;
  isVerified: boolean;
  isActive: boolean;
}

export interface MealFeedbackEntry {
  id?: string;
  mealPlanItemId: string;
  studentId: string;
  date: string;
  mealType: MealType;
  rating: number; // 1-5
  eatenPercent: number; // 0, 25, 50, 75, 100
  comments?: string;
}

export interface AllergyConflict {
  student: {
    id: string;
    name: string;
    photoUrl?: string;
  };
  mealType: MealType;
  dayOfWeek: DayOfWeek;
  mealItem: MealItem;
  allergens: AllergenType[];
  severity: AllergySeverity;
  isMayContain?: boolean; // true = "may contain" match (yellow), false = direct match (red)
}

// ============================================================
// Design system constants
// ============================================================

export const MEAL_TYPE_COLORS: Record<MealType, string> = {
  BREAKFAST: '#F59E0B',           // amber
  MID_MORNING_SNACK: '#EC4899',   // pink
  LUNCH: '#10B981',               // emerald
  AFTERNOON_SNACK: '#8B5CF6',     // violet
};

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  BREAKFAST: 'Breakfast',
  MID_MORNING_SNACK: 'Mid-Morning Snack',
  LUNCH: 'Lunch',
  AFTERNOON_SNACK: 'Afternoon Snack',
};

export const DAY_LABELS: Record<DayOfWeek, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
};

export const DAY_SHORT_LABELS: Record<DayOfWeek, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
};

export const ALLERGEN_EMOJIS: Record<AllergenType, string> = {
  MILK: '🥛',
  EGGS: '🥚',
  FISH: '🐟',
  SHELLFISH: '🦐',
  TREE_NUTS: '🌰',
  PEANUTS: '🥜',
  WHEAT: '🌾',
  SOYBEAN: '🫘',
  SESAME: '⚪',
  CELERY: '🥬',
  MUSTARD: '🟡',
  LUPIN: '🌸',
  MOLLUSCS: '🐚',
  SULPHITES: '🧪',
  GLUTEN: '🍞',
  HONEY: '🍯',
  SUGAR: '🍬',
};

export const ALLERGEN_LABELS: Record<AllergenType, string> = {
  MILK: 'Milk',
  EGGS: 'Eggs',
  FISH: 'Fish',
  SHELLFISH: 'Shellfish',
  TREE_NUTS: 'Tree Nuts',
  PEANUTS: 'Peanuts',
  WHEAT: 'Wheat',
  SOYBEAN: 'Soybean',
  SESAME: 'Sesame',
  CELERY: 'Celery',
  MUSTARD: 'Mustard',
  LUPIN: 'Lupin',
  MOLLUSCS: 'Molluscs',
  SULPHITES: 'Sulphites',
  GLUTEN: 'Gluten',
  HONEY: 'Honey',
  SUGAR: 'Sugar',
};

export const SEVERITY_COLORS: Record<AllergySeverity, { dot: string; bg: string; text: string; label: string }> = {
  MILD: { dot: 'bg-yellow-400', bg: 'bg-yellow-400/10', text: 'text-yellow-400', label: 'Mild' },
  MODERATE: { dot: 'bg-orange-400', bg: 'bg-orange-400/10', text: 'text-orange-400', label: 'Moderate' },
  SEVERE: { dot: 'bg-red-500', bg: 'bg-red-500/10', text: 'text-red-500', label: 'Severe' },
  LIFE_THREATENING: { dot: 'bg-red-700', bg: 'bg-red-700/20', text: 'text-red-700', label: 'CRITICAL' },
};

// Preschool daily recommended values
export const NUTRITION_RECOMMENDED = {
  calories: 1200,
  protein: 16,
  calcium: 600,
  iron: 8,
  vitaminC: 20,
} as const;

export const MEAL_TYPES_ORDER: MealType[] = [
  'BREAKFAST',
  'MID_MORNING_SNACK',
  'LUNCH',
  'AFTERNOON_SNACK',
];
