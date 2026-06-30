'use client';

// ============================================================
// PreOne — Onboarding Step Page (/admin/onboarding/step/[step])
//
// Dynamic step page that renders the appropriate step component
// wrapped in WizardShell.
//
// Color rules:
//   ALL colors use var(--admin-*) CSS variables — no hardcoded
//   hex or Tailwind color classes in JSX.
// ============================================================

import { useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { WizardShell } from '@/components/onboarding/wizard-shell';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { cn } from '@/lib/utils';
import {
  School,
  Building2,
  BookOpen,
  PenTool,
  Users,
  GraduationCap,
  Smartphone,
  Rocket,
} from 'lucide-react';
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
 * Step metadata for placeholder rendering.
 * Uses lucide icons instead of emojis.
 * Colors use var(--admin-*) exclusively.
 */
const STEP_META: Record<
  number,
  {
    label: string;
    Icon: React.ElementType;
    description: string;
  }
> = {
  1: {
    label: 'School Profile',
    Icon: School,
    description:
      'Tell us about your school — name, logo, contact details, and the board you follow.',
  },
  2: {
    label: 'Branch Setup',
    Icon: Building2,
    description:
      'Add your school branches — campuses, locations, and branch-specific settings.',
  },
  3: {
    label: 'Academic Year & Classes',
    Icon: BookOpen,
    description:
      'Define the academic year, create classes, and set up sections for each branch.',
  },
  4: {
    label: 'Subjects',
    Icon: PenTool,
    description:
      'Configure the subjects taught at your school and assign them to classes.',
  },
  5: {
    label: 'Teachers',
    Icon: Users,
    description:
      'Add teachers, assign subjects and classes, and set up their profiles.',
  },
  6: {
    label: 'Students',
    Icon: GraduationCap,
    description:
      'Enroll students, assign them to classes, and add parent contact information.',
  },
  7: {
    label: 'Daily Updates',
    Icon: Smartphone,
    description:
      'Configure daily update categories, notification preferences, and parent communication settings.',
  },
  8: {
    label: 'Review & Launch',
    Icon: Rocket,
    description:
      'Review all your settings and launch your school on PreOne!',
  },
};

/**
 * StepPlaceholder — rendered when the actual step component doesn't exist yet.
 * Shows a friendly preview of what the step will contain.
 */
function StepPlaceholder({ step }: { step: number }) {
  const meta = STEP_META[step];
  if (!meta) return null;
  const { Icon } = meta;

  return (
    <PreOneCard variant="default">
      <PreOneCardContent>
        <div className="py-8">
          {/* Step header */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
              style={{ background: 'var(--admin-primary-soft)' }}
            >
              <Icon
                className="h-6 w-6"
                style={{ color: 'var(--admin-primary)' }}
              />
            </div>
            <div>
              <h2
                className="text-xl font-bold"
                style={{ color: 'var(--admin-text)' }}
              >
                Step {step}: {meta.label}
              </h2>
              <p
                className="text-sm"
                style={{ color: 'var(--admin-text-muted)' }}
              >
                This step is coming soon
              </p>
            </div>
          </div>

          {/* Description */}
          <p
            className="mb-6 leading-relaxed"
            style={{ color: 'var(--admin-text-muted)' }}
          >
            {meta.description}
          </p>

          {/* Visual placeholder */}
          <div
            className="rounded-2xl p-8 border border-dashed"
            style={{
              background: 'var(--admin-primary-soft)',
              borderColor: 'var(--admin-border)',
            }}
          >
            <motion.div
              className="flex flex-col items-center justify-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Icon
                className="h-12 w-12"
                style={{ color: 'var(--admin-primary)' }}
                aria-hidden="true"
              />
              <p
                className="text-sm text-center max-w-sm"
                style={{ color: 'var(--admin-text-subtle)' }}
              >
                The <strong style={{ color: 'var(--admin-text)' }}>{meta.label}</strong> form will be available here.
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
    if (isNaN(step) || step < 1 || step > 8) {
      router.replace('/admin/onboarding/step/1');
      return;
    }

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
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--admin-bg)' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-sm font-bold shadow-lg mx-auto mb-4"
            style={{
              background: 'var(--admin-primary)',
              color: 'var(--admin-primary-foreground, #FFFFFF)',
            }}
          >
            P
          </div>
          <h2
            className="text-lg font-semibold mb-2"
            style={{ color: 'var(--admin-text)' }}
          >
            Loading Step {step}...
          </h2>
          <div
            className="w-48 h-1.5 rounded-full mx-auto overflow-hidden"
            style={{ background: 'var(--admin-surface-2)' }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'var(--admin-primary)' }}
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
  const renderStepContent = () => {
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
