'use client';

import { useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { WizardShell } from '@/components/onboarding/wizard-shell';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { cn } from '@/lib/utils';
import { SchoolProfileStep } from '@/components/onboarding/steps/school-profile-step';
import { BranchSetupStep } from '@/components/onboarding/steps/branch-setup-step';
import { AcademicYearStep } from '@/components/onboarding/steps/academic-year-step';
import { SubjectsStep } from '@/components/onboarding/steps/subjects-step';
import { TeachersStep } from '@/components/onboarding/steps/teachers-step';
import { StudentsStep } from '@/components/onboarding/steps/students-step';
import { DailyUpdatesStep } from '@/components/onboarding/steps/daily-updates-step';
import { ReviewLaunchStep } from '@/components/onboarding/steps/review-launch-step';

/** Get auth headers for API calls */
function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('preone_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/**
 * Step metadata for placeholder rendering
 * Each step component will be created in separate files later
 */
const STEP_META: Record<
  number,
  {
    label: string;
    icon: string;
    description: string;
    color: string;
    bgGradient: string;
  }
> = {
  1: {
    label: 'School Profile',
    icon: '🏫',
    description:
      'Tell us about your school — name, logo, contact details, and the board you follow.',
    color: 'text-violet-600',
    bgGradient: 'from-violet-50 to-purple-50',
  },
  2: {
    label: 'Branch Setup',
    icon: '🏢',
    description:
      'Add your school branches — campuses, locations, and branch-specific settings.',
    color: 'text-sky-600',
    bgGradient: 'from-sky-50 to-blue-50',
  },
  3: {
    label: 'Academic Year & Classes',
    icon: '📚',
    description:
      'Define the academic year, create classes, and set up sections for each branch.',
    color: 'text-emerald-600',
    bgGradient: 'from-emerald-50 to-green-50',
  },
  4: {
    label: 'Subjects',
    icon: '✏️',
    description:
      'Configure the subjects taught at your school and assign them to classes.',
    color: 'text-amber-600',
    bgGradient: 'from-amber-50 to-yellow-50',
  },
  5: {
    label: 'Teachers',
    icon: '👩‍🏫',
    description:
      'Add teachers, assign subjects and classes, and set up their profiles.',
    color: 'text-pink-600',
    bgGradient: 'from-pink-50 to-rose-50',
  },
  6: {
    label: 'Students',
    icon: '👨‍🎓',
    description:
      'Enroll students, assign them to classes, and add parent contact information.',
    color: 'text-indigo-600',
    bgGradient: 'from-indigo-50 to-blue-50',
  },
  7: {
    label: 'Daily Updates',
    icon: '📱',
    description:
      'Configure daily update categories, notification preferences, and parent communication settings.',
    color: 'text-teal-600',
    bgGradient: 'from-teal-50 to-cyan-50',
  },
  8: {
    label: 'Review & Launch',
    icon: '🚀',
    description:
      'Review all your settings and launch your school on PreOne!',
    color: 'text-emerald-600',
    bgGradient: 'from-emerald-50 to-teal-50',
  },
};

/**
 * StepPlaceholder — rendered when the actual step component doesn't exist yet.
 * Shows a friendly preview of what the step will contain.
 */
function StepPlaceholder({ step }: { step: number }) {
  const meta = STEP_META[step];
  if (!meta) return null;

  return (
    <PreOneCard variant="default">
      <PreOneCardContent>
        <div className="py-8">
          {/* Step header */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className={cn(
                'w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl shadow-sm',
                meta.bgGradient
              )}
            >
              {meta.icon}
            </div>
            <div>
              <h2
                className={cn(
                  'text-xl font-bold font-[var(--font-primary)]',
                  meta.color
                )}
              >
                Step {step}: {meta.label}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                This step is coming soon
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">
            {meta.description}
          </p>

          {/* Visual placeholder */}
          <div
            className={cn(
              'rounded-2xl bg-gradient-to-br p-8 border border-dashed',
              meta.bgGradient,
              'border-current/10'
            )}
          >
            <motion.div
              className="flex flex-col items-center justify-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-6xl">{meta.icon}</span>
              <p className="text-sm text-[var(--text-tertiary)] text-center max-w-sm">
                The <strong>{meta.label}</strong> form will be available here.
                <br />
                You can still navigate through other steps.
              </p>
            </motion.div>
          </div>
        </div>
      </PreOneCardContent>
    </PreOneCard>
  );
}

/**
 * Dynamic Step Page
 *
 * Uses useParams() to get the step number and renders the appropriate step component.
 * Wrapped in WizardShell for consistent navigation.
 */
export default function OnboardingStepPage() {
  const params = useParams();
  const router = useRouter();
  const stepParam = params.step as string;
  const step = parseInt(stepParam, 10);

  const {
    draft,
    isLoading,
    isDirty,
    isSaving,
    lastSaved,
    initialize,
    completeStep,
    setCurrentStep,
    setSaving,
    markSaved,
  } = useOnboardingStore();

  // ── Validate step and sync store ──
  useEffect(() => {
    // If step is invalid, redirect to step 1
    if (isNaN(step) || step < 1 || step > 8) {
      router.replace('/admin/onboarding/step/1');
      return;
    }

    // If store hasn't been initialized yet, fetch status
    if (isLoading) {
      const fetchStatus = async () => {
        try {
          const res = await fetch('/api/onboarding/status', {
            headers: getAuthHeaders(),
          });
          if (!res.ok) throw new Error('Failed to fetch status');

          const data = await res.json();

          if (data.onboardingComplete) {
            router.replace('/admin/dashboard');
            return;
          }

          initialize({
            ...data.draft,
            currentStep: step,
            completedSteps: data.completedSteps ?? [],
            onboardingComplete: data.onboardingComplete ?? false,
          });
        } catch (error) {
          console.error('Failed to load onboarding status:', error);
          initialize({ currentStep: step });
        }
      };

      fetchStatus();
    } else {
      // Store is initialized, just update current step
      setCurrentStep(step);
    }
  }, [step, isLoading, initialize, setCurrentStep, router]);

  // ── Auto-save on step change ──
  useEffect(() => {
    if (!isDirty || isSaving) return;

    const timeout = setTimeout(async () => {
      setSaving(true);
      try {
        const res = await fetch('/api/onboarding/draft', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(draft),
        });
        if (res.ok) markSaved();
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setSaving(false);
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [step, isDirty, isSaving, draft, setSaving, markSaved]);

  // ── Navigation handlers ──
  const handleStepClick = useCallback(
    (targetStep: number) => {
      setCurrentStep(targetStep);
      router.push(`/admin/onboarding/step/${targetStep}`);
    },
    [setCurrentStep, router]
  );

  const handleNext = useCallback(() => {
    completeStep(step);
    if (step < 8) {
      const nextStep = step + 1;
      setCurrentStep(nextStep);
      router.push(`/admin/onboarding/step/${nextStep}`);
    }
  }, [step, completeStep, setCurrentStep, router]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      const prevStep = step - 1;
      setCurrentStep(prevStep);
      router.push(`/admin/onboarding/step/${prevStep}`);
    }
  }, [step, setCurrentStep, router]);

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--preone-primary)] to-[var(--preone-primary-light)] flex items-center justify-center text-white font-bold text-2xl shadow-lg mx-auto mb-4">
            P
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Loading Step {step}...
          </h2>
          <div className="w-48 h-1.5 rounded-full bg-[var(--bg-tertiary)] mx-auto overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[var(--preone-primary)] to-[var(--preone-primary-light)]"
              initial={{ width: '0%' }}
              animate={{ width: '60%' }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Render step component ──
  // Step components will be imported here as they are created.
  // For now, all steps render the StepPlaceholder.
  // Example: when Step 1 component exists:
  //   case 1: return <SchoolProfileStep />;
  const renderStepContent = () => {
    // All steps use placeholder for now — individual step components
    // will be created in separate files and imported here.
    // Pattern: import { SchoolProfileStep } from '@/components/onboarding/steps/school-profile-step';
    switch (step) {
      case 1:
        return <SchoolProfileStep />;
      case 2:
        return <BranchSetupStep />;
      case 3:
        return <AcademicYearStep />;
      case 4:
        return <SubjectsStep />;
      case 5:
        return <TeachersStep />;
      case 6:
        return <StudentsStep />;
      case 7:
        return <DailyUpdatesStep />;
      case 8:
        return <ReviewLaunchStep />;
      default:
        return <StepPlaceholder step={1} />;
    }
  };

  return (
    <WizardShell
      currentStep={step}
      completedSteps={draft.completedSteps}
      onStepClick={handleStepClick}
      onNext={handleNext}
      onBack={handleBack}
      isSaving={isSaving}
      lastSaved={lastSaved}
    >
      {renderStepContent()}
    </WizardShell>
  );
}
