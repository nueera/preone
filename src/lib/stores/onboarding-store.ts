'use client';

import { create } from 'zustand';

export interface OnboardingDraft {
  /** School profile data */
  schoolName: string;
  schoolLogo: string;
  schoolPhone: string;
  schoolEmail: string;
  schoolAddress: string;
  schoolType: string;
  schoolBoard: string;
  schoolWebsite: string;

  /** Branch data */
  branches: Array<{
    id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    isPrimary: boolean;
  }>;

  /** Academic year / classes */
  academicYear: string;
  academicYearStart: string;
  academicYearEnd: string;
  classes: Array<{
    id: string;
    name: string;
    section: string;
    branchId: string;
  }>;

  /** Subjects */
  subjects: Array<{
    id: string;
    name: string;
    classIds: string[];
  }>;

  /** Teachers */
  teachers: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    subjectIds: string[];
    classIds: string[];
  }>;

  /** Students */
  students: Array<{
    id: string;
    name: string;
    classId: string;
    parentName: string;
    parentPhone: string;
    parentEmail: string;
  }>;

  /** Daily updates config */
  dailyUpdatesEnabled: boolean;
  updateCategories: string[];

  /** Meta */
  currentStep: number;
  completedSteps: number[];
  onboardingComplete: boolean;
}

interface OnboardingState {
  /** The draft data */
  draft: OnboardingDraft;

  /** Loading state */
  isLoading: boolean;

  /** Whether there are unsaved changes */
  isDirty: boolean;

  /** Last save timestamp */
  lastSaved: Date | null;

  /** Whether auto-save is currently running */
  isSaving: boolean;

  // ── Actions ──

  /** Initialize the store from API data */
  initialize: (data: Partial<OnboardingDraft>) => void;

  /** Update a single field in the draft */
  updateDraft: <K extends keyof OnboardingDraft>(key: K, value: OnboardingDraft[K]) => void;

  /** Update multiple fields at once */
  updateDraftBatch: (updates: Partial<OnboardingDraft>) => void;

  /** Mark a step as completed */
  completeStep: (step: number) => void;

  /** Set the current step */
  setCurrentStep: (step: number) => void;

  /** Mark saving state */
  setSaving: (saving: boolean) => void;

  /** Mark the draft as saved (resets dirty flag) */
  markSaved: () => void;

  /** Mark onboarding as complete */
  completeOnboarding: () => void;

  /** Reset the store */
  reset: () => void;
}

const INITIAL_DRAFT: OnboardingDraft = {
  schoolName: '',
  schoolLogo: '',
  schoolPhone: '',
  schoolEmail: '',
  schoolAddress: '',
  schoolType: '',
  schoolBoard: '',
  schoolWebsite: '',
  branches: [],
  academicYear: '',
  academicYearStart: '',
  academicYearEnd: '',
  classes: [],
  subjects: [],
  teachers: [],
  students: [],
  dailyUpdatesEnabled: false,
  updateCategories: [],
  currentStep: 1,
  completedSteps: [],
  onboardingComplete: false,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  draft: { ...INITIAL_DRAFT },
  isLoading: true,
  isDirty: false,
  lastSaved: null,
  isSaving: false,

  initialize: (data) =>
    set((state) => ({
      draft: { ...state.draft, ...data },
      isLoading: false,
      isDirty: false,
    })),

  updateDraft: (key, value) =>
    set((state) => ({
      draft: { ...state.draft, [key]: value },
      isDirty: true,
    })),

  updateDraftBatch: (updates) =>
    set((state) => ({
      draft: { ...state.draft, ...updates },
      isDirty: true,
    })),

  completeStep: (step) =>
    set((state) => {
      const completed = state.draft.completedSteps.includes(step)
        ? state.draft.completedSteps
        : [...state.draft.completedSteps, step];
      return {
        draft: { ...state.draft, completedSteps: completed },
        isDirty: true,
      };
    }),

  setCurrentStep: (step) =>
    set((state) => ({
      draft: { ...state.draft, currentStep: step },
    })),

  setSaving: (saving) => set({ isSaving: saving }),

  markSaved: () =>
    set({
      isDirty: false,
      lastSaved: new Date(),
      isSaving: false,
    }),

  completeOnboarding: () =>
    set((state) => ({
      draft: { ...state.draft, onboardingComplete: true },
      isDirty: true,
    })),

  reset: () =>
    set({
      draft: { ...INITIAL_DRAFT },
      isLoading: false,
      isDirty: false,
      lastSaved: null,
      isSaving: false,
    }),
}));
