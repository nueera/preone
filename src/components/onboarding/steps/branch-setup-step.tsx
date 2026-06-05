'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';

// ── Types ──

interface BranchDraft {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  isPrimary: boolean;
  code: string;
  startTime: string;
  endTime: string;
  workingDays: string[];
}

// ── Constants ──

const DAYS_OF_WEEK = [
  { id: 'MON', label: 'Mon' },
  { id: 'TUE', label: 'Tue' },
  { id: 'WED', label: 'Wed' },
  { id: 'THU', label: 'Thu' },
  { id: 'FRI', label: 'Fri' },
  { id: 'SAT', label: 'Sat' },
  { id: 'SUN', label: 'Sun' },
] as const;

const DEFAULT_WORKING_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

const INPUT_CLASS =
  'w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all';

const LABEL_CLASS = 'block text-sm font-medium mb-1.5 text-[var(--text-primary)]';

function generateId(): string {
  return crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function createDefaultBranch(index: number, isPrimary: boolean): BranchDraft {
  return {
    id: generateId(),
    name: isPrimary ? 'Main Campus' : `Campus ${index + 1}`,
    code: isPrimary ? 'MAIN' : `BR${String(index + 1).padStart(2, '0')}`,
    address: '',
    phone: '',
    email: '',
    isPrimary,
    startTime: '08:00',
    endTime: '14:00',
    workingDays: [...DEFAULT_WORKING_DAYS],
  };
}

// ── Animation variants ──

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const branchCardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

// ── Branch Card Sub-component ──

function BranchCard({
  branch,
  index,
  totalBranches,
  isMultiCampus,
  onUpdate,
  onRemove,
  onSetPrimary,
}: {
  branch: BranchDraft;
  index: number;
  totalBranches: number;
  isMultiCampus: boolean;
  onUpdate: (id: string, updates: Partial<BranchDraft>) => void;
  onRemove: (id: string) => void;
  onSetPrimary: (id: string) => void;
}) {
  const toggleWorkingDay = (dayId: string) => {
    const current = branch.workingDays;
    const next = current.includes(dayId)
      ? current.filter((d) => d !== dayId)
      : [...current, dayId];
    onUpdate(branch.id, { workingDays: next });
  };

  return (
    <PreOneCard
      variant={branch.isPrimary ? 'hero' : 'default'}
      className="mb-4"
    >
      <PreOneCardContent>
        <div className="space-y-5">
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold',
                  branch.isPrimary
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--preone-primary-50)] text-[var(--preone-primary)]'
                )}
              >
                {index + 1}
              </div>
              <div>
                <h3
                  className={cn(
                    'text-base font-semibold font-[var(--font-primary)]',
                    branch.isPrimary ? 'text-white' : 'text-[var(--text-primary)]'
                  )}
                >
                  {branch.isPrimary ? '⭐ Head Office' : `Campus ${index + 1}`}
                </h3>
                <p
                  className={cn(
                    'text-xs',
                    branch.isPrimary ? 'text-white/70' : 'text-[var(--text-muted)]'
                  )}
                >
                  Code: {branch.code}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Head Office Toggle (only in multi-campus) */}
              {isMultiCampus && !branch.isPrimary && (
                <button
                  type="button"
                  onClick={() => onSetPrimary(branch.id)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--preone-primary-50)] hover:text-[var(--preone-primary)] transition-all min-h-[36px]"
                >
                  Set as Head Office
                </button>
              )}

              {/* Remove branch (only in multi-campus, not primary) */}
              {isMultiCampus && totalBranches > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(branch.id)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-500 transition-all min-h-[36px]"
                  aria-label="Remove campus"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Branch Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={cn(LABEL_CLASS, branch.isPrimary && 'text-white/90')}>
                Campus Name
              </label>
              <input
                type="text"
                placeholder="e.g., Main Campus"
                value={branch.name}
                onChange={(e) => onUpdate(branch.id, { name: e.target.value })}
                className={cn(
                  INPUT_CLASS,
                  branch.isPrimary && 'bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-white/50'
                )}
              />
            </div>
            <div>
              <label className={cn(LABEL_CLASS, branch.isPrimary && 'text-white/90')}>
                Campus Code
              </label>
              <input
                type="text"
                placeholder="e.g., MAIN"
                value={branch.code}
                onChange={(e) =>
                  onUpdate(branch.id, { code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })
                }
                className={cn(
                  INPUT_CLASS,
                  branch.isPrimary && 'bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-white/50'
                )}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className={cn(LABEL_CLASS, branch.isPrimary && 'text-white/90')}>
              Address
            </label>
            <input
              type="text"
              placeholder="Campus address"
              value={branch.address}
              onChange={(e) => onUpdate(branch.id, { address: e.target.value })}
              className={cn(
                INPUT_CLASS,
                branch.isPrimary && 'bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-white/50'
              )}
            />
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={cn(LABEL_CLASS, branch.isPrimary && 'text-white/90')}>
                Phone
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={branch.phone}
                onChange={(e) => onUpdate(branch.id, { phone: e.target.value })}
                className={cn(
                  INPUT_CLASS,
                  branch.isPrimary && 'bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-white/50'
                )}
              />
            </div>
            <div>
              <label className={cn(LABEL_CLASS, branch.isPrimary && 'text-white/90')}>
                Email
              </label>
              <input
                type="email"
                placeholder="campus@school.com"
                value={branch.email}
                onChange={(e) => onUpdate(branch.id, { email: e.target.value })}
                className={cn(
                  INPUT_CLASS,
                  branch.isPrimary && 'bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-white/50'
                )}
              />
            </div>
          </div>

          {/* Start/End Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={cn(LABEL_CLASS, branch.isPrimary && 'text-white/90')}>
                Start Time
              </label>
              <input
                type="time"
                value={branch.startTime}
                onChange={(e) => onUpdate(branch.id, { startTime: e.target.value })}
                className={cn(
                  INPUT_CLASS,
                  branch.isPrimary && 'bg-white/10 border-white/20 text-white focus:ring-white/50'
                )}
              />
            </div>
            <div>
              <label className={cn(LABEL_CLASS, branch.isPrimary && 'text-white/90')}>
                End Time
              </label>
              <input
                type="time"
                value={branch.endTime}
                onChange={(e) => onUpdate(branch.id, { endTime: e.target.value })}
                className={cn(
                  INPUT_CLASS,
                  branch.isPrimary && 'bg-white/10 border-white/20 text-white focus:ring-white/50'
                )}
              />
            </div>
          </div>

          {/* Working Days */}
          <div>
            <label className={cn(LABEL_CLASS, branch.isPrimary && 'text-white/90')}>
              Working Days
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isActive = branch.workingDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleWorkingDay(day.id)}
                    className={cn(
                      'px-3.5 py-2 rounded-xl text-xs font-semibold transition-all min-h-[40px]',
                      isActive
                        ? 'bg-[var(--preone-primary)] text-white shadow-md shadow-[var(--preone-primary)]/25'
                        : cn(
                            'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]',
                            branch.isPrimary && 'bg-white/10 text-white/60 hover:bg-white/20'
                          )
                    )}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </PreOneCardContent>
    </PreOneCard>
  );
}

// ── Main Component ──

export function BranchSetupStep() {
  const { draft, updateDraft, completeStep } = useOnboardingStore();
  const [isMultiCampus, setIsMultiCampus] = useState(draft.branches.length > 1);

  // ── Local branch state (extended with extra fields) ──
  const [branches, setBranches] = useState<BranchDraft[]>(() => {
    if (draft.branches.length > 0) {
      // Hydrate from store — add missing extended fields with defaults
      return draft.branches.map((b, i) => ({
        ...b,
        code: (b as Record<string, unknown>).code as string || (i === 0 ? 'MAIN' : `BR${String(i + 1).padStart(2, '0')}`),
        startTime: (b as Record<string, unknown>).startTime as string || '08:00',
        endTime: (b as Record<string, unknown>).endTime as string || '14:00',
        workingDays: (b as Record<string, unknown>).workingDays as string[] || [...DEFAULT_WORKING_DAYS],
      }));
    }
    return [createDefaultBranch(0, true)];
  });

  // ── Sync branches to store ──
  const syncToStore = useCallback(
    (updatedBranches: BranchDraft[]) => {
      // Map extended branch type to store's Branch type
      const storeBranches = updatedBranches.map((b) => ({
        id: b.id,
        name: b.name,
        address: b.address,
        phone: b.phone,
        email: b.email,
        isPrimary: b.isPrimary,
      }));
      updateDraft('branches', storeBranches);
    },
    [updateDraft]
  );

  // ── Update a single branch ──
  const handleUpdateBranch = useCallback(
    (id: string, updates: Partial<BranchDraft>) => {
      setBranches((prev) => {
        const next = prev.map((b) => (b.id === id ? { ...b, ...updates } : b));
        syncToStore(next);
        return next;
      });
    },
    [syncToStore]
  );

  // ── Add a new campus ──
  const handleAddCampus = useCallback(() => {
    setBranches((prev) => {
      const next = [...prev, createDefaultBranch(prev.length, false)];
      syncToStore(next);
      toast.success('New campus added!');
      return next;
    });
  }, [syncToStore]);

  // ── Remove a campus ──
  const handleRemoveCampus = useCallback(
    (id: string) => {
      setBranches((prev) => {
        if (prev.length <= 1) return prev;
        const next = prev.filter((b) => b.id !== id);
        syncToStore(next);
        toast.success('Campus removed');
        return next;
      });
    },
    [syncToStore]
  );

  // ── Set a branch as primary ──
  const handleSetPrimary = useCallback(
    (id: string) => {
      setBranches((prev) => {
        const next = prev.map((b) => ({
          ...b,
          isPrimary: b.id === id,
          code: b.id === id ? 'MAIN' : b.code === 'MAIN' ? `BR${String(prev.indexOf(b) + 1).padStart(2, '0')}` : b.code,
        }));
        syncToStore(next);
        toast.success('Head office updated!');
        return next;
      });
    },
    [syncToStore]
  );

  // ── Toggle between single and multi campus ──
  const handleCampusModeToggle = useCallback(
    (multi: boolean) => {
      setIsMultiCampus(multi);
      if (!multi && branches.length > 1) {
        // Keep only the primary branch
        const primary = branches.find((b) => b.isPrimary) || branches[0];
        const updated = [{ ...primary, isPrimary: true }];
        setBranches(updated);
        syncToStore(updated);
      }
    },
    [branches, syncToStore]
  );

  // ── Mark step as completed when at least one branch has a name ──
  useEffect(() => {
    const hasValidBranch = branches.some((b) => b.name.trim());
    if (hasValidBranch && !draft.completedSteps.includes(2)) {
      completeStep(2);
    }
  }, [branches, draft.completedSteps, completeStep]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* ── Step Header ── */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center text-2xl shadow-sm">
            🏢
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] font-[var(--font-primary)]">
              Branch / Campus Setup
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Add your school branches, campuses, and their settings
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Single vs Multi Toggle ── */}
      <motion.div variants={itemVariants} className="mb-6">
        <PreOneCard variant="default">
          <PreOneCardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  How many campuses do you have?
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  You can add more later
                </p>
              </div>
              <div className="flex items-center bg-[var(--bg-tertiary)] rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => handleCampusModeToggle(false)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-xs font-medium transition-all min-h-[40px]',
                    !isMultiCampus
                      ? 'bg-[var(--preone-primary)] text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  )}
                >
                  Single Campus
                </button>
                <button
                  type="button"
                  onClick={() => handleCampusModeToggle(true)}
                  className={cn(
                    'px-4 py-2 rounded-lg text-xs font-medium transition-all min-h-[40px]',
                    isMultiCampus
                      ? 'bg-[var(--preone-primary)] text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  )}
                >
                  Multi-Campus
                </button>
              </div>
            </div>
          </PreOneCardContent>
        </PreOneCard>
      </motion.div>

      {/* ── Branch Cards ── */}
      <AnimatePresence mode="popLayout">
        {branches.map((branch, index) => (
          <motion.div
            key={branch.id}
            variants={branchCardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
          >
            <BranchCard
              branch={branch}
              index={index}
              totalBranches={branches.length}
              isMultiCampus={isMultiCampus}
              onUpdate={handleUpdateBranch}
              onRemove={handleRemoveCampus}
              onSetPrimary={handleSetPrimary}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ── Add Another Campus Button ── */}
      {isMultiCampus && (
        <motion.div variants={itemVariants}>
          <button
            type="button"
            onClick={handleAddCampus}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--preone-primary)] hover:text-[var(--preone-primary)] hover:bg-[var(--preone-primary-50)] transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <span className="text-lg">+</span>
            <span className="text-sm font-medium">Add Another Campus</span>
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

BranchSetupStep.displayName = 'BranchSetupStep';

export default BranchSetupStep;
