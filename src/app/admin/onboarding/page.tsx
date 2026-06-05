'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { WizardShell } from '@/components/onboarding/wizard-shell';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { motion } from 'framer-motion';

/** Get auth headers for API calls */
function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('preone_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/**
 * Onboarding Entry Page
 *
 * This is the main entry point for the onboarding wizard.
 * It:
 * 1. Fetches onboarding status from the API on mount
 * 2. Initializes the Zustand store with the draft data
 * 3. Starts an auto-save interval (every 30s)
 * 4. Redirects to dashboard if onboarding is already complete
 * 5. Renders the WizardShell with step 1 content
 */
export default function OnboardingPage() {
  const router = useRouter();
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // ── Fetch onboarding status on mount ──
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/onboarding/status', {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error('Failed to fetch status');

        const data = await res.json();

        if (data.onboardingComplete) {
          // Onboarding already done — redirect to dashboard
          localStorage.setItem('preone_onboarding_complete', 'true');
          router.replace('/admin/dashboard');
          return;
        }

        // Initialize store with fetched data
        initialize({
          ...data.draft,
          currentStep: data.currentStep ?? 1,
          completedSteps: data.completedSteps ?? [],
          onboardingComplete: data.onboardingComplete ?? false,
        });

        // Navigate to the current step
        const step = data.currentStep ?? 1;
        if (step > 1) {
          router.replace(`/admin/onboarding/step/${step}`);
        }
      } catch (error) {
        console.error('Failed to load onboarding status:', error);
        // Initialize with defaults so the wizard still works
        initialize({});
      }
    };

    fetchStatus();
  }, [initialize, router]);

  // ── Auto-save interval (every 30s) ──
  const saveDraft = useCallback(async () => {
    if (!isDirty || isSaving) return;

    setSaving(true);
    try {
      const res = await fetch('/api/onboarding/draft', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(draft),
      });

      if (res.ok) {
        markSaved();
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setSaving(false);
    }
  }, [draft, isDirty, isSaving, setSaving, markSaved]);

  useEffect(() => {
    // Only start auto-save after initial load
    if (isLoading) return;

    autoSaveRef.current = setInterval(saveDraft, 30000);

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, [isLoading, saveDraft]);

  // ── Save before leaving the page ──
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // ── Step navigation handler ──
  const handleStepClick = useCallback(
    (step: number) => {
      setCurrentStep(step);
      router.push(`/admin/onboarding/step/${step}`);
    },
    [setCurrentStep, router]
  );

  const handleNext = useCallback(() => {
    const nextStep = Math.min(draft.currentStep + 1, 8);
    completeStep(draft.currentStep);
    setCurrentStep(nextStep);
    router.push(`/admin/onboarding/step/${nextStep}`);
  }, [draft.currentStep, completeStep, setCurrentStep, router]);

  const handleBack = useCallback(() => {
    const prevStep = Math.max(draft.currentStep - 1, 1);
    setCurrentStep(prevStep);
    router.push(`/admin/onboarding/step/${prevStep}`);
  }, [draft.currentStep, setCurrentStep, router]);

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
            Loading your setup wizard...
          </h2>
          <div className="w-48 h-1.5 rounded-full bg-[var(--bg-tertiary)] mx-auto overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[var(--preone-primary)] to-[var(--preone-primary-light)]"
              initial={{ width: '0%' }}
              animate={{ width: '60%' }}
              transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Render WizardShell with Step 1 (School Profile) placeholder ──
  return (
    <WizardShell
      currentStep={draft.currentStep}
      completedSteps={draft.completedSteps}
      onStepClick={handleStepClick}
      onNext={handleNext}
      onBack={handleBack}
      isSaving={isSaving}
      lastSaved={lastSaved}
    >
      <PreOneCard variant="default">
        <PreOneCardContent>
          <div className="text-center py-12">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="text-5xl mb-4 block">🏫</span>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2 font-[var(--font-primary)]">
                Welcome to PreOne!
              </h2>
              <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-6">
                Let&apos;s set up your school in a few simple steps. We&apos;ll walk you
                through everything you need to get started.
              </p>
              <button
                onClick={() => {
                  setCurrentStep(1);
                  router.push('/admin/onboarding/step/1');
                }}
                className="px-8 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-[var(--preone-primary)] to-[var(--preone-primary-light)] hover:shadow-lg hover:shadow-[var(--preone-primary)]/25 transition-all duration-200 min-h-[44px]"
              >
                Let&apos;s Begin →
              </button>
            </motion.div>
          </div>
        </PreOneCardContent>
      </PreOneCard>
    </WizardShell>
  );
}
