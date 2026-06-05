'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { MealCard } from '@/components/meals/MealCard';
import { MealPlanGrid } from '@/components/meals/MealPlanGrid';
import { AllergyBadge } from '@/components/meals/AllergyBadge';
import { AllergenTag } from '@/components/meals/AllergenTag';
import { NutritionBar } from '@/components/meals/NutritionBar';
import { MealFeedbackForm } from '@/components/meals/MealFeedbackForm';
import { AllergyConflictPanel } from '@/components/meals/AllergyConflictPanel';
import type {
  MealItem,
  MealPlanItem,
  AllergyConflict,
  MealType,
  StudentAllergy,
} from '@/components/meals/types';

// ============================================================
// Mock data
// ============================================================

const sampleMealItem: MealItem = {
  id: 'mi-1',
  name: 'Oats Porridge with Banana',
  description:
    'Warm oats cooked in milk topped with sliced banana and a drizzle of honey. Rich in fiber and calcium.',
  image: '',
  mealType: 'BREAKFAST',
  isVegetarian: true,
  isVegan: false,
  isEggless: true,
  servingSize: '1 bowl (200g)',
  calories: 280,
  protein: 8,
  carbohydrates: 45,
  fat: 6,
  fiber: 4,
  sugar: 12,
  calcium: 150,
  iron: 2.5,
  vitaminC: 3,
  allergens: ['MILK', 'GLUTEN', 'HONEY'],
  mayContain: ['TREE_NUTS'],
  category: 'Healthy',
  cuisine: 'Universal',
  tags: ['warm', 'fiber-rich'],
  prepTime: 5,
  cookTime: 10,
  costPerServing: 25,
};

const sampleMealItem2: MealItem = {
  id: 'mi-2',
  name: 'Egg Bhurji with Roti',
  description:
    'Spiced scrambled eggs served with fresh whole wheat roti. High in protein.',
  mealType: 'BREAKFAST',
  isVegetarian: false,
  isVegan: false,
  isEggless: false,
  servingSize: '1 plate',
  calories: 320,
  protein: 15,
  carbohydrates: 30,
  fat: 14,
  fiber: 3,
  sugar: 2,
  calcium: 80,
  iron: 3,
  vitaminC: 2,
  allergens: ['EGGS', 'WHEAT', 'GLUTEN'],
  mayContain: ['MILK'],
  category: 'Indian',
  cuisine: 'North Indian',
};

const sampleMealItem3: MealItem = {
  id: 'mi-3',
  name: 'Fruit Bowl with Yogurt',
  description: 'Seasonal fruits with fresh yogurt dip.',
  mealType: 'MID_MORNING_SNACK',
  isVegetarian: true,
  isVegan: false,
  isEggless: true,
  servingSize: '1 cup',
  calories: 150,
  protein: 4,
  carbohydrates: 25,
  fat: 3,
  fiber: 2,
  sugar: 15,
  calcium: 100,
  iron: 0.5,
  vitaminC: 12,
  allergens: ['MILK'],
  mayContain: [],
  category: 'Healthy',
  cuisine: 'Universal',
};

const sampleMealItem4: MealItem = {
  id: 'mi-4',
  name: 'Rajma Chawal',
  description: 'Kidney bean curry with steamed rice. Classic Indian comfort food.',
  mealType: 'LUNCH',
  isVegetarian: true,
  isVegan: true,
  isEggless: true,
  servingSize: '1 plate',
  calories: 450,
  protein: 14,
  carbohydrates: 65,
  fat: 10,
  fiber: 8,
  sugar: 4,
  calcium: 80,
  iron: 4.5,
  vitaminC: 5,
  allergens: [],
  mayContain: ['GLUTEN'],
  category: 'Indian',
  cuisine: 'North Indian',
};

const sampleMealItem5: MealItem = {
  id: 'mi-5',
  name: 'Peanut Chikki & Milk',
  description: 'Traditional peanut brittle with warm milk.',
  mealType: 'AFTERNOON_SNACK',
  isVegetarian: true,
  isVegan: false,
  isEggless: true,
  servingSize: '1 piece + 1 glass',
  calories: 200,
  protein: 7,
  carbohydrates: 22,
  fat: 9,
  fiber: 2,
  sugar: 14,
  calcium: 120,
  iron: 1.5,
  vitaminC: 0,
  allergens: ['PEANUTS', 'MILK', 'SUGAR'],
  mayContain: [],
  category: 'Snack',
  cuisine: 'Indian',
};

// Weekly menu mock
const weeklyMenu = [
  {
    day: 1 as const,
    meals: {
      BREAKFAST: [
        { id: 'mpi-1', mealPlanId: 'mp-1', mealItemId: 'mi-1', dayOfWeek: 1 as const, mealType: 'BREAKFAST' as MealType, isAlternative: false, sortOrder: 0, mealItem: sampleMealItem },
      ],
      MID_MORNING_SNACK: [
        { id: 'mpi-2', mealPlanId: 'mp-1', mealItemId: 'mi-3', dayOfWeek: 1 as const, mealType: 'MID_MORNING_SNACK' as MealType, isAlternative: false, sortOrder: 0, mealItem: sampleMealItem3 },
      ],
      LUNCH: [
        { id: 'mpi-3', mealPlanId: 'mp-1', mealItemId: 'mi-4', dayOfWeek: 1 as const, mealType: 'LUNCH' as MealType, isAlternative: false, sortOrder: 0, mealItem: sampleMealItem4 },
      ],
      AFTERNOON_SNACK: [
        { id: 'mpi-4', mealPlanId: 'mp-1', mealItemId: 'mi-5', dayOfWeek: 1 as const, mealType: 'AFTERNOON_SNACK' as MealType, isAlternative: false, sortOrder: 0, mealItem: sampleMealItem5 },
      ],
    },
  },
  {
    day: 2 as const,
    meals: {
      BREAKFAST: [
        { id: 'mpi-5', mealPlanId: 'mp-1', mealItemId: 'mi-2', dayOfWeek: 2 as const, mealType: 'BREAKFAST' as MealType, isAlternative: false, sortOrder: 0, mealItem: sampleMealItem2 },
      ],
      MID_MORNING_SNACK: [
        { id: 'mpi-6', mealPlanId: 'mp-1', mealItemId: 'mi-3', dayOfWeek: 2 as const, mealType: 'MID_MORNING_SNACK' as MealType, isAlternative: false, sortOrder: 0, mealItem: sampleMealItem3 },
      ],
      LUNCH: [
        { id: 'mpi-7', mealPlanId: 'mp-1', mealItemId: 'mi-4', dayOfWeek: 2 as const, mealType: 'LUNCH' as MealType, isAlternative: false, sortOrder: 0, mealItem: sampleMealItem4 },
        { id: 'mpi-7a', mealPlanId: 'mp-1', mealItemId: 'mi-4', dayOfWeek: 2 as const, mealType: 'LUNCH' as MealType, isAlternative: true, alternativeFor: 'PEANUTS', sortOrder: 1, mealItem: { ...sampleMealItem4, id: 'mi-4-alt', name: 'Dal Chawal (Alt)', allergens: [], mayContain: [] } },
      ],
    },
  },
  {
    day: 3 as const,
    meals: {
      BREAKFAST: [
        { id: 'mpi-8', mealPlanId: 'mp-1', mealItemId: 'mi-1', dayOfWeek: 3 as const, mealType: 'BREAKFAST' as MealType, isAlternative: false, sortOrder: 0, mealItem: sampleMealItem },
      ],
      LUNCH: [
        { id: 'mpi-9', mealPlanId: 'mp-1', mealItemId: 'mi-4', dayOfWeek: 3 as const, mealType: 'LUNCH' as MealType, isAlternative: false, sortOrder: 0, mealItem: sampleMealItem4 },
      ],
    },
  },
  {
    day: 4 as const,
    meals: {
      BREAKFAST: [
        { id: 'mpi-10', mealPlanId: 'mp-1', mealItemId: 'mi-2', dayOfWeek: 4 as const, mealType: 'BREAKFAST' as MealType, isAlternative: false, sortOrder: 0, mealItem: sampleMealItem2 },
      ],
      AFTERNOON_SNACK: [
        { id: 'mpi-11', mealPlanId: 'mp-1', mealItemId: 'mi-5', dayOfWeek: 4 as const, mealType: 'AFTERNOON_SNACK' as MealType, isAlternative: false, sortOrder: 0, mealItem: sampleMealItem5 },
      ],
    },
  },
  {
    day: 5 as const,
    meals: {
      MID_MORNING_SNACK: [
        { id: 'mpi-12', mealPlanId: 'mp-1', mealItemId: 'mi-3', dayOfWeek: 5 as const, mealType: 'MID_MORNING_SNACK' as MealType, isAlternative: false, sortOrder: 0, mealItem: sampleMealItem3 },
      ],
      LUNCH: [
        { id: 'mpi-13', mealPlanId: 'mp-1', mealItemId: 'mi-4', dayOfWeek: 5 as const, mealType: 'LUNCH' as MealType, isAlternative: false, sortOrder: 0, mealItem: sampleMealItem4 },
      ],
    },
  },
];

const sampleAllergies: StudentAllergy[] = [
  { id: 'sa-1', studentId: 's-1', allergen: 'PEANUTS', severity: 'SEVERE', isVerified: true, isActive: true },
  { id: 'sa-2', studentId: 's-1', allergen: 'MILK', severity: 'MODERATE', isVerified: true, isActive: true },
  { id: 'sa-3', studentId: 's-2', allergen: 'EGGS', severity: 'MILD', isVerified: true, isActive: true },
  { id: 'sa-4', studentId: 's-3', allergen: 'GLUTEN', severity: 'LIFE_THREATENING', isVerified: true, isActive: true },
];

const sampleConflicts: AllergyConflict[] = [
  {
    student: { id: 's-1', name: 'Aarav Patel', photoUrl: '' },
    mealType: 'BREAKFAST',
    dayOfWeek: 1,
    mealItem: sampleMealItem,
    allergens: ['MILK'],
    severity: 'MODERATE',
    isMayContain: false,
  },
  {
    student: { id: 's-1', name: 'Aarav Patel', photoUrl: '' },
    mealType: 'AFTERNOON_SNACK',
    dayOfWeek: 1,
    mealItem: sampleMealItem5,
    allergens: ['PEANUTS', 'MILK'],
    severity: 'SEVERE',
    isMayContain: false,
  },
  {
    student: { id: 's-2', name: 'Priya Sharma', photoUrl: '' },
    mealType: 'BREAKFAST',
    dayOfWeek: 2,
    mealItem: sampleMealItem2,
    allergens: ['EGGS'],
    severity: 'MILD',
    isMayContain: false,
  },
  {
    student: { id: 's-3', name: 'Rohan Kumar', photoUrl: '' },
    mealType: 'BREAKFAST',
    dayOfWeek: 1,
    mealItem: sampleMealItem,
    allergens: ['GLUTEN'],
    severity: 'LIFE_THREATENING',
    isMayContain: false,
  },
  {
    student: { id: 's-3', name: 'Rohan Kumar', photoUrl: '' },
    mealType: 'LUNCH',
    dayOfWeek: 2,
    mealItem: sampleMealItem4,
    allergens: ['GLUTEN'],
    severity: 'LIFE_THREATENING',
    isMayContain: true,
  },
];

const feedbackStudents = [
  { id: 's-1', name: 'Aarav Patel' },
  { id: 's-2', name: 'Priya Sharma' },
  { id: 's-3', name: 'Rohan Kumar' },
  { id: 's-4', name: 'Ananya Iyer' },
  { id: 's-5', name: 'Vivaan Singh' },
];

const feedbackMealPlanItems: MealPlanItem[] = [
  { id: 'mpi-1', mealPlanId: 'mp-1', mealItemId: 'mi-1', dayOfWeek: 1, mealType: 'BREAKFAST', isAlternative: false, sortOrder: 0 },
  { id: 'mpi-2', mealPlanId: 'mp-1', mealItemId: 'mi-3', dayOfWeek: 1, mealType: 'MID_MORNING_SNACK', isAlternative: false, sortOrder: 0 },
  { id: 'mpi-3', mealPlanId: 'mp-1', mealItemId: 'mi-4', dayOfWeek: 1, mealType: 'LUNCH', isAlternative: false, sortOrder: 0 },
  { id: 'mpi-4', mealPlanId: 'mp-1', mealItemId: 'mi-5', dayOfWeek: 1, mealType: 'AFTERNOON_SNACK', isAlternative: false, sortOrder: 0 },
];

// ============================================================
// Section wrapper
// ============================================================

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-sm text-white/40 mt-1">{description}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-[#121234]/60 p-6">
        {children}
      </div>
    </section>
  );
}

// ============================================================
// Demo page
// ============================================================

export default function MealComponentsDemo() {
  const [activeTab, setActiveTab] = useState('all');

  const handleSubmitFeedback = async (data: unknown[]) => {
    toast.success(`Submitted ${data.length} feedback entries!`);
  };

  const tabs = [
    { id: 'all', label: 'All Components' },
    { id: 'badges', label: 'Badges & Tags' },
    { id: 'cards', label: 'Meal Cards' },
    { id: 'grid', label: 'Meal Plan Grid' },
    { id: 'feedback', label: 'Feedback Form' },
    { id: 'conflicts', label: 'Conflict Panel' },
    { id: 'nutrition', label: 'Nutrition Bars' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] to-[#121234]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a1a]/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/20">
              <span className="text-lg">🍽️</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">
                PreOne Meals & Nutrition
              </h1>
              <p className="text-xs text-white/40">
                Shared Component Library Demo
              </p>
            </div>
          </div>
          {/* Tab bar */}
          <div className="mt-3 flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : 'text-white/40 hover:bg-white/5 hover:text-white/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 space-y-12">
        {/* ---- Badges & Tags ---- */}
        {(activeTab === 'all' || activeTab === 'badges') && (
          <Section
            title="AllergyBadge & AllergenTag"
            description="Severity badges with pulse animations and allergen tags with emoji icons"
          >
            <div className="space-y-6">
              {/* Allergy Badges */}
              <div>
                <h3 className="text-sm font-semibold text-white/60 mb-3">
                  AllergySeverity Badges
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <AllergyBadge severity="MILD" size="sm" />
                  <AllergyBadge severity="MILD" size="md" />
                  <AllergyBadge severity="MODERATE" size="md" />
                  <AllergyBadge severity="SEVERE" size="md" />
                  <AllergyBadge severity="LIFE_THREATENING" size="md" />
                  <AllergyBadge severity="LIFE_THREATENING" size="lg" />
                </div>
              </div>

              {/* Allergen Tags */}
              <div>
                <h3 className="text-sm font-semibold text-white/60 mb-3">
                  AllergenTag Variants
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-white/30 mb-1.5">Default</p>
                    <div className="flex flex-wrap gap-2">
                      <AllergenTag allergen="MILK" />
                      <AllergenTag allergen="EGGS" />
                      <AllergenTag allergen="PEANUTS" />
                      <AllergenTag allergen="GLUTEN" />
                      <AllergenTag allergen="FISH" />
                      <AllergenTag allergen="SOYBEAN" />
                      <AllergenTag allergen="TREE_NUTS" />
                      <AllergenTag allergen="SESAME" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-white/30 mb-1.5">Warning (may-contain)</p>
                    <div className="flex flex-wrap gap-2">
                      <AllergenTag allergen="MILK" variant="warning" />
                      <AllergenTag allergen="GLUTEN" variant="warning" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-white/30 mb-1.5">Danger (direct conflict)</p>
                    <div className="flex flex-wrap gap-2">
                      <AllergenTag allergen="PEANUTS" variant="danger" />
                      <AllergenTag allergen="EGGS" variant="danger" />
                      <AllergenTag allergen="SHELLFISH" variant="danger" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-white/30 mb-1.5">Small size</p>
                    <div className="flex flex-wrap gap-1.5">
                      <AllergenTag allergen="HONEY" size="sm" />
                      <AllergenTag allergen="WHEAT" size="sm" />
                      <AllergenTag allergen="SUGAR" size="sm" />
                      <AllergenTag allergen="SULPHITES" size="sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* ---- Nutrition Bars ---- */}
        {(activeTab === 'all' || activeTab === 'nutrition') && (
          <Section
            title="NutritionBar"
            description="Horizontal nutrition bars showing value vs recommended daily intake"
          >
            <div className="max-w-md space-y-4">
              <NutritionBar
                label="Calories"
                value={980}
                recommended={1200}
                unit="kcal"
              />
              <NutritionBar
                label="Protein"
                value={18}
                recommended={16}
                unit="g"
              />
              <NutritionBar
                label="Calcium"
                value={350}
                recommended={600}
                unit="mg"
              />
              <NutritionBar
                label="Iron"
                value={4.5}
                recommended={8}
                unit="mg"
              />
              <NutritionBar
                label="Vitamin C"
                value={20}
                recommended={20}
                unit="mg"
              />
            </div>
          </Section>
        )}

        {/* ---- Meal Cards ---- */}
        {(activeTab === 'all' || activeTab === 'cards') && (
          <Section
            title="MealCard"
            description="Three variants: Compact, Detailed, and Feedback"
          >
            <div className="space-y-8">
              {/* Compact variants */}
              <div>
                <h3 className="text-sm font-semibold text-white/60 mb-3">
                  Compact Variant
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <MealCard mealItem={sampleMealItem} variant="compact" />
                  <MealCard mealItem={sampleMealItem2} variant="compact" />
                  <MealCard
                    mealItem={sampleMealItem5}
                    variant="compact"
                    allergyConflict
                  />
                </div>
              </div>

              {/* Detailed variants */}
              <div>
                <h3 className="text-sm font-semibold text-white/60 mb-3">
                  Detailed Variant
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <MealCard
                    mealItem={sampleMealItem}
                    variant="detailed"
                    onEdit={() => toast.info('Edit clicked!')}
                    onDelete={() => toast.info('Delete clicked!')}
                  />
                  <MealCard
                    mealItem={sampleMealItem2}
                    variant="detailed"
                  />
                  <MealCard
                    mealItem={sampleMealItem5}
                    variant="detailed"
                    allergyConflict
                    studentAllergies={sampleAllergies.filter(
                      (a) => a.studentId === 's-1'
                    )}
                  />
                </div>
              </div>

              {/* Feedback variants */}
              <div>
                <h3 className="text-sm font-semibold text-white/60 mb-3">
                  Feedback Variant
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <MealCard
                    mealItem={sampleMealItem4}
                    variant="feedback"
                    rating={5}
                    eatenPercent={100}
                  />
                  <MealCard
                    mealItem={sampleMealItem3}
                    variant="feedback"
                    rating={3}
                    eatenPercent={50}
                  />
                  <MealCard
                    mealItem={sampleMealItem5}
                    variant="feedback"
                    rating={1}
                    eatenPercent={25}
                    allergyConflict
                  />
                </div>
              </div>
            </div>
          </Section>
        )}

        {/* ---- Meal Plan Grid ---- */}
        {(activeTab === 'all' || activeTab === 'grid') && (
          <Section
            title="MealPlanGrid"
            description="Weekly meal plan grid (Days × Meal Types) with conflict warnings"
          >
            <MealPlanGrid
              weeklyMenu={weeklyMenu}
              studentAllergies={sampleAllergies}
              editable
              onCellClick={(day, mt) =>
                toast.info(`Cell clicked: Day ${day} - ${mt}`)
              }
              conflictWarnings={[
                { dayOfWeek: 1, mealType: 'BREAKFAST', allergens: ['MILK', 'GLUTEN'] },
                { dayOfWeek: 2, mealType: 'BREAKFAST', allergens: ['EGGS'] },
                { dayOfWeek: 1, mealType: 'AFTERNOON_SNACK', allergens: ['PEANUTS'] },
              ]}
            />
          </Section>
        )}

        {/* ---- Feedback Form ---- */}
        {(activeTab === 'all' || activeTab === 'feedback') && (
          <Section
            title="MealFeedbackForm"
            description="Teacher's class-wide meal feedback grid"
          >
            <MealFeedbackForm
              students={feedbackStudents}
              meals={['BREAKFAST', 'MID_MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK']}
              mealPlanItems={feedbackMealPlanItems}
              date="Monday, June 9, 2026"
              onSubmit={handleSubmitFeedback}
            />
          </Section>
        )}

        {/* ---- Conflict Panel ---- */}
        {(activeTab === 'all' || activeTab === 'conflicts') && (
          <Section
            title="AllergyConflictPanel"
            description="Students with allergy conflicts in current meal plan"
          >
            <AllergyConflictPanel
              conflicts={sampleConflicts}
              onSelectStudent={(id) =>
                toast.info(`Selected student: ${id}`)
              }
            />
          </Section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0a0a1a] py-6 mt-12">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <p className="text-xs text-white/20">
            PreOne Meals & Nutrition · Shared Component Library · 7 Components
          </p>
        </div>
      </footer>
    </div>
  );
}
