'use client';

// ============================================================
// PreOne — Onboarding Wizard Shell
//
// Full-page wizard layout with:
//   - Sticky header: PreOne logo + title + save indicator + step nav + progress bar
//   - Scrollable content area (children)
//   - Sticky footer: Back / Step indicator / Next buttons
//
// Color rules:
//   ALL colors use var(--admin-*) CSS variables — no hardcoded
//   hex or Tailwind color classes in JSX.
// ============================================================

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  Check,
} from 'lucide-react';
import { PreOneCard } from '@/components/ui/preone-card';
import { OnboardingProgressBar } from '@/components/onboarding/progress-bar';

// ── Step definitions with lucide icons ──

const STEPS = [
  { number: 1, label: 'School', Icon: School },
  { number: 2, label: 'Branch', Icon: Building2 },
  { number: 3, label: 'Classes', Icon: BookOpen },
  { number: 4, label: 'Subjects', Icon: PenTool },
  { number: 5, label: 'Teachers', Icon: Users },
  { number: 6, label: 'Students', Icon: GraduationCap },
  { number: 7, label: 'Updates', Icon: Smartphone },
  { number: 8, label: 'Launch', Icon: Rocket },
];

interface WizardShellProps {
  children: React.ReactNode;
  currentStep: number;
  completedSteps: number[];
  sessionId?: string;
  onStepClick?: (step: number) => void;
  onNext?: () => void;
  onBack?: () => void;
  /** Whether the next button is disabled */
  isNextDisabled?: boolean;
  /** Whether data is currently being saved */
  isSaving?: boolean;
  /** Last saved timestamp */
  lastSaved?: Date | null;
}

export function WizardShell({
  children,
  currentStep,
  completedSteps,
  sessionId,
  onStepClick,
  onNext,
  onBack,
  isNextDisabled = false,
  isSaving = false,
  lastSaved,
}: WizardShellProps) {
  const router = useRouter();

  const maxCompleted = completedSteps.length > 0 ? Math.max(...completedSteps) : 0;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (currentStep > 1) {
      const base = sessionId ? `/admin/onboarding/${sessionId}` : '/admin/onboarding';
      router.push(`${base}/step/${currentStep - 1}`);
    }
  };

  const handleNext = () => {
    if (currentStep === 8) {
      onNext?.();
      return;
    }
    if (onNext) {
      onNext();
    } else {
      const base = sessionId ? `/admin/onboarding/${sessionId}` : '/admin/onboarding';
      router.push(`${base}/step/${currentStep + 1}`);
    }
  };

  const formatLastSaved = (date: Date | null | undefined) => {
    if (!date) return null;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 5) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--admin-bg)' }}
    >
      {/* ── Top Header ── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl px-4 py-4 safe-top"
        style={{
          background: 'color-mix(in srgb, var(--admin-surface) 80%, transparent)',
          borderBottom: '1px solid var(--admin-border)',
        }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Logo + Title */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-md"
                style={{
                  background: 'var(--admin-primary)',
                  color: 'var(--admin-primary-foreground, #FFFFFF)',
                }}
              >
                P
              </div>
              <div>
                <h1
                  className="text-lg font-bold"
                  style={{ color: 'var(--admin-text)' }}
                >
                  PreOne School Setup
                </h1>
                <p
                  className="text-xs"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  Let&apos;s get your school ready!
                </p>
              </div>
            </div>

            {/* Save indicator */}
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: 'var(--admin-text-muted)' }}
            >
              {isSaving ? (
                <>
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: 'var(--admin-warning)' }}
                  />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: 'var(--admin-success)' }}
                  />
                  <span>
                    {lastSaved
                      ? `Saved ${formatLastSaved(lastSaved)}`
                      : 'Auto-saving'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Step indicators */}
          <nav
            aria-label="Onboarding steps"
            className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none"
          >
            {STEPS.map((step) => {
              const isCompleted = completedSteps.includes(step.number);
              const isCurrent = currentStep === step.number;
              const isClickable =
                isCompleted || step.number <= maxCompleted + 1;

              return (
                <button
                  key={step.number}
                  onClick={() => isClickable && onStepClick?.(step.number)}
                  disabled={!isClickable}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`Step ${step.number}: ${step.label}${isCompleted ? ' (completed)' : ''}`}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-200',
                    isCurrent && 'shadow-md',
                    isClickable && !isCurrent && 'cursor-pointer',
                    !isClickable && 'cursor-not-allowed opacity-50'
                  )}
                  style={{
                    background: isCurrent
                      ? 'var(--admin-primary)'
                      : isCompleted
                        ? 'var(--admin-primary-soft)'
                        : 'transparent',
                    color: isCurrent
                      ? 'var(--admin-primary-foreground, #FFFFFF)'
                      : isCompleted
                        ? 'var(--admin-primary)'
                        : 'var(--admin-text-muted)',
                    boxShadow: isCurrent
                      ? '0 4px 6px rgba(0,0,0,0.15)'
                      : undefined,
                  }}
                >
                  {isCompleted && !isCurrent ? (
                    <Check
                      className="h-3.5 w-3.5"
                      style={{ color: 'var(--admin-success)' }}
                      aria-hidden="true"
                    />
                  ) : (
                    <step.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Progress Bar */}
          <OnboardingProgressBar
            currentStep={currentStep}
            totalSteps={8}
            size="sm"
            className="mt-2"
          />
        </div>
      </header>

      {/* ── Step Content ── */}
      <main className="flex-1 px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ── Bottom Navigation ── */}
      <footer
        className="sticky bottom-0 backdrop-blur-xl px-4 py-3 safe-bottom"
        style={{
          background: 'color-mix(in srgb, var(--admin-surface) 80%, transparent)',
          borderTop: '1px solid var(--admin-border)',
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            aria-label="Go to previous step"
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px]"
            style={{
              color: 'var(--admin-text-muted)',
            }}
          >
            &larr; Back
          </button>

          <span
            className="text-sm"
            style={{ color: 'var(--admin-text-subtle)' }}
            aria-live="polite"
          >
            Step {currentStep} of 8
          </span>

          <button
            onClick={handleNext}
            disabled={isNextDisabled}
            aria-label={
              currentStep === 8 ? 'Launch your school' : 'Go to next step'
            }
            className={cn(
              'px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 min-h-[44px]',
              isNextDisabled && 'opacity-50 cursor-not-allowed'
            )}
            style={{
              background: currentStep === 8
                ? 'var(--admin-success)'
                : 'var(--admin-primary)',
              color: 'var(--admin-primary-foreground, #FFFFFF)',
            }}
          >
            {currentStep === 8 ? 'Launch!' : 'Next \u2192'}
          </button>
        </div>
      </footer>
    </div>
  );
}
