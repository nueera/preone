'use client';

// ============================================================
// PreOne — Onboarding Entry Page (/admin/onboarding)
//
// Landing page for the onboarding wizard.
// Fetches onboarding status, initializes Zustand store,
// starts auto-save, and redirects to dashboard if complete.
//
// Color rules:
//   ALL colors use var(--admin-*) CSS variables — no hardcoded
//   hex or Tailwind color classes in JSX.
// ============================================================

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { WizardShell } from '@/components/onboarding/wizard-shell';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { motion } from 'framer-motion';
import { School, ArrowRight } from 'lucide-react';

/** Get auth headers for API calls */
function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('preone_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

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
          localStorage.setItem('preone_onboarding_complete', 'true');
          router.replace('/admin/dashboard');
          return;
        }

        initialize({
          ...data.draft,
          currentStep: data.currentStep ?? 1,
          completedSteps: data.completedSteps ?? [],
          onboardingComplete: data.onboardingComplete ?? false,
        });

        const step = data.currentStep ?? 1;
        if (step > 1) {
          router.replace(`/admin/onboarding/step/${step}`);
        }
      } catch (error) {
        console.error('Failed to load onboarding status:', error);
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
            Loading your setup wizard...
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
              transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Render WizardShell with Welcome content ──
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
              {/* Icon */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--admin-primary-soft)' }}
              >
                <School
                  className="h-8 w-8"
                  style={{ color: 'var(--admin-primary)' }}
                />
              </div>

              <h2
                className="text-2xl font-bold mb-2"
                style={{ color: 'var(--admin-text)' }}
              >
                Welcome to PreOne!
              </h2>
              <p
                className="max-w-md mx-auto mb-6"
                style={{ color: 'var(--admin-text-muted)' }}
              >
                Let&apos;s set up your school in a few simple steps. We&apos;ll walk you
                through everything you need to get started.
              </p>
              <button
                onClick={() => {
                  setCurrentStep(1);
                  router.push('/admin/onboarding/step/1');
                }}
                className="px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[44px] inline-flex items-center gap-2"
                style={{
                  background: 'var(--admin-primary)',
                  color: 'var(--admin-primary-foreground, #FFFFFF)',
                }}
              >
                Let&apos;s Begin
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </motion.div>
          </div>
        </PreOneCardContent>
      </PreOneCard>
    </WizardShell>
  );
}
