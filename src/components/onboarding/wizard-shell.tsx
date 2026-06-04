'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { PreOneCard } from '@/components/ui/preone-card';
import { OnboardingProgressBar } from '@/components/onboarding/progress-bar';

const STEPS = [
  { number: 1, label: 'School', icon: '🏫' },
  { number: 2, label: 'Branch', icon: '🏢' },
  { number: 3, label: 'Classes', icon: '📚' },
  { number: 4, label: 'Subjects', icon: '✏️' },
  { number: 5, label: 'Teachers', icon: '👩‍🏫' },
  { number: 6, label: 'Students', icon: '👨‍🎓' },
  { number: 7, label: 'Updates', icon: '📱' },
  { number: 8, label: 'Launch', icon: '🚀' },
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
      // Launch handled by step 8 component
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
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0a0a1a]/80 backdrop-blur-xl border-b border-[var(--border-default)] px-4 py-4 safe-top">
        <div className="max-w-4xl mx-auto">
          {/* Logo + Title */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--preone-primary)] to-[var(--preone-primary-light)] flex items-center justify-center text-white font-bold text-lg shadow-md">
                P
              </div>
              <div>
                <h1 className="text-lg font-bold text-[var(--text-primary)] font-[var(--font-primary)]">
                  PreOne School Setup
                </h1>
                <p className="text-xs text-[var(--text-secondary)]">
                  Let&apos;s get your school ready!
                </p>
              </div>
            </div>

            {/* Save indicator */}
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              {isSaving ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
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
                    isCurrent &&
                      'bg-[var(--preone-primary)] text-white shadow-md shadow-[var(--preone-primary)]/25',
                    isCompleted &&
                      !isCurrent &&
                      'bg-[var(--preone-primary-50)] text-[var(--preone-primary)] dark:bg-[var(--preone-primary)]/20 dark:text-[var(--preone-primary-light)]',
                    !isCurrent &&
                      !isCompleted &&
                      'text-[var(--text-muted)]',
                    isClickable &&
                      !isCurrent &&
                      'cursor-pointer hover:bg-[var(--bg-secondary)]',
                    !isClickable && 'cursor-not-allowed opacity-50'
                  )}
                >
                  <span className="text-sm" role="img" aria-hidden="true">
                    {step.icon}
                  </span>
                  <span className="hidden sm:inline">{step.label}</span>
                  {isCompleted && !isCurrent && (
                    <span className="text-emerald-500 ml-0.5" aria-hidden="true">
                      ✓
                    </span>
                  )}
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
      <footer className="sticky bottom-0 bg-white/80 dark:bg-[#0a0a1a]/80 backdrop-blur-xl border-t border-[var(--border-default)] px-4 py-3 safe-bottom">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            aria-label="Go to previous step"
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px]"
          >
            ← Back
          </button>

          <span className="text-sm text-[var(--text-muted)]" aria-live="polite">
            Step {currentStep} of 8
          </span>

          <button
            onClick={handleNext}
            disabled={isNextDisabled}
            aria-label={
              currentStep === 8 ? 'Launch your school' : 'Go to next step'
            }
            className={cn(
              'px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-200 min-h-[44px]',
              currentStep === 8
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 hover:shadow-lg hover:shadow-emerald-500/25'
                : 'bg-gradient-to-r from-[var(--preone-primary)] to-[var(--preone-primary-light)] hover:shadow-lg hover:shadow-[var(--preone-primary)]/25',
              isNextDisabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {currentStep === 8 ? 'Launch! 🚀' : 'Next →'}
          </button>
        </div>
      </footer>
    </div>
  );
}
