'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';

// ── Types ──

interface SectionDraft {
  id: string;
  name: string;
  capacity: number;
}

interface GradeConfig {
  gradeName: string;
  branchId: string;
  sections: SectionDraft[];
}

// ── Constants ──

const GRADE_PRESETS = [
  'Playgroup',
  'Nursery',
  'LKG',
  'UKG',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
] as const;

const INPUT_CLASS =
  'w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all';

const SMALL_INPUT_CLASS =
  'px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all text-sm';

const LABEL_CLASS = 'block text-sm font-medium mb-1.5 text-[var(--text-primary)]';

function generateId(): string {
  return crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function createSection(): SectionDraft {
  return {
    id: generateId(),
    name: 'A',
    capacity: 30,
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

const sectionVariants = {
  hidden: { opacity: 0, height: 0 },
  visible: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 },
};

// ── Main Component ──

export function AcademicYearStep() {
  const { draft, updateDraft, updateDraftBatch, completeStep } = useOnboardingStore();

  // ── Local state ──
  const [academicYear, setAcademicYear] = useState(draft.academicYear || '');
  const [startDate, setStartDate] = useState(draft.academicYearStart || '');
  const [endDate, setEndDate] = useState(draft.academicYearEnd || '');
  const [selectedGrades, setSelectedGrades] = useState<string[]>(() => {
    // Hydrate from existing classes
    const existingGrades = [...new Set(draft.classes.map((c) => c.name))];
    return existingGrades;
  });
  const [customGradeInput, setCustomGradeInput] = useState('');
  const [gradeConfigs, setGradeConfigs] = useState<GradeConfig[]>(() => {
    // Hydrate from store classes
    if (draft.classes.length > 0) {
      const grouped = new Map<string, SectionDraft[]>();
      draft.classes.forEach((c) => {
        if (!grouped.has(c.name)) {
          grouped.set(c.name, []);
        }
        grouped.get(c.name)!.push({
          id: c.id,
          name: c.section,
          capacity: 30,
        });
      });
      const primaryBranchId = draft.branches.find((b) => b.isPrimary)?.id || draft.branches[0]?.id || '';
      return Array.from(grouped.entries()).map(([name, sections]) => ({
        gradeName: name,
        branchId: primaryBranchId,
        sections,
      }));
    }
    return [];
  });

  // ── Get available branches ──
  const branches = draft.branches.length > 0
    ? draft.branches
    : [{ id: 'default', name: 'Main Campus', address: '', phone: '', email: '', isPrimary: true }];

  // ── Auto-generate academic year name from dates ──
  // Compute the display value: use explicit academicYear if set, otherwise auto-generate
  const displayAcademicYear = academicYear || (() => {
    if (startDate && endDate) {
      const startYear = new Date(startDate).getFullYear();
      const endYear = new Date(endDate).getFullYear();
      return `${startYear}-${endYear}`;
    }
    return '';
  })();

  // ── Sync to store ──
  const syncToStore = useCallback(() => {
    // Build classes array from grade configs
    const classes = gradeConfigs.flatMap((gc) =>
      gc.sections.map((s) => ({
        id: s.id,
        name: gc.gradeName,
        section: s.name,
        branchId: gc.branchId,
      }))
    );

    updateDraftBatch({
      academicYear: displayAcademicYear,
      academicYearStart: startDate,
      academicYearEnd: endDate,
      classes,
    });
  }, [displayAcademicYear, startDate, endDate, gradeConfigs, updateDraftBatch]);

  // ── Sync when local state changes ──
  useEffect(() => {
    syncToStore();
  }, [syncToStore]);

  // ── Toggle a grade preset ──
  const handleToggleGrade = useCallback(
    (grade: string) => {
      setSelectedGrades((prev) => {
        const next = prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade];

        // Update grade configs
        setGradeConfigs((prevConfigs) => {
          if (next.includes(grade) && !prev.includes(grade)) {
            // Add grade with default section
            const primaryBranchId = branches[0]?.id || '';
            return [
              ...prevConfigs,
              {
                gradeName: grade,
                branchId: primaryBranchId,
                sections: [createSection()],
              },
            ];
          } else if (!next.includes(grade) && prev.includes(grade)) {
            // Remove grade
            return prevConfigs.filter((gc) => gc.gradeName !== grade);
          }
          return prevConfigs;
        });

        return next;
      });
    },
    [branches]
  );

  // ── Add custom grade ──
  const handleAddCustomGrade = useCallback(() => {
    const trimmed = customGradeInput.trim();
    if (!trimmed) return;
    if (selectedGrades.includes(trimmed)) {
      toast.error('Grade already exists');
      return;
    }

    setSelectedGrades((prev) => [...prev, trimmed]);
    setGradeConfigs((prev) => [
      ...prev,
      {
        gradeName: trimmed,
        branchId: branches[0]?.id || '',
        sections: [createSection()],
      },
    ]);
    setCustomGradeInput('');
    toast.success(`Added "${trimmed}"`);
  }, [customGradeInput, selectedGrades, branches]);

  // ── Add section to a grade ──
  const handleAddSection = useCallback((gradeName: string) => {
    setGradeConfigs((prev) =>
      prev.map((gc) => {
        if (gc.gradeName !== gradeName) return gc;
        const nextSectionLetter = String.fromCharCode(65 + gc.sections.length); // A, B, C, ...
        return {
          ...gc,
          sections: [
            ...gc.sections,
            { id: generateId(), name: nextSectionLetter, capacity: 30 },
          ],
        };
      })
    );
  }, []);

  // ── Remove a section from a grade ──
  const handleRemoveSection = useCallback((gradeName: string, sectionId: string) => {
    setGradeConfigs((prev) =>
      prev.map((gc) => {
        if (gc.gradeName !== gradeName) return gc;
        if (gc.sections.length <= 1) return gc; // Keep at least one section
        return {
          ...gc,
          sections: gc.sections.filter((s) => s.id !== sectionId),
        };
      })
    );
  }, []);

  // ── Update a section ──
  const handleUpdateSection = useCallback(
    (gradeName: string, sectionId: string, updates: Partial<SectionDraft>) => {
      setGradeConfigs((prev) =>
        prev.map((gc) => {
          if (gc.gradeName !== gradeName) return gc;
          return {
            ...gc,
            sections: gc.sections.map((s) =>
              s.id === sectionId ? { ...s, ...updates } : s
            ),
          };
        })
      );
    },
    []
  );

  // ── Update branch assignment for a grade ──
  const handleGradeBranchChange = useCallback(
    (gradeName: string, branchId: string) => {
      setGradeConfigs((prev) =>
        prev.map((gc) =>
          gc.gradeName === gradeName ? { ...gc, branchId } : gc
        )
      );
    },
    []
  );

  // ── Mark step as completed ──
  useEffect(() => {
    if (
      displayAcademicYear.trim() &&
      startDate &&
      endDate &&
      gradeConfigs.length > 0 &&
      gradeConfigs.every((gc) => gc.sections.length > 0) &&
      !draft.completedSteps.includes(3)
    ) {
      completeStep(3);
    }
  }, [displayAcademicYear, startDate, endDate, gradeConfigs, draft.completedSteps, completeStep]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* ── Step Header ── */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center text-2xl shadow-sm">
            📚
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] font-[var(--font-primary)]">
              Academic Year &amp; Classes
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Define the academic year and set up classes with sections
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Academic Year Card ── */}
      <PreOneCard variant="default" className="mb-4">
        <PreOneCardContent>
          <motion.div variants={itemVariants} className="space-y-5">
            <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <span className="text-lg">📅</span> Academic Year
            </h3>

            {/* Year Name */}
            <div>
              <label htmlFor="academicYear" className={LABEL_CLASS}>
                Academic Year Name
              </label>
              <input
                id="academicYear"
                type="text"
                placeholder="e.g., 2024-2025"
                value={displayAcademicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            {/* Start & End Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className={LABEL_CLASS}>
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="endDate" className={LABEL_CLASS}>
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>
          </motion.div>
        </PreOneCardContent>
      </PreOneCard>

      {/* ── Grade Presets Card ── */}
      <PreOneCard variant="default" className="mb-4">
        <PreOneCardContent>
          <motion.div variants={itemVariants} className="space-y-5">
            <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <span className="text-lg">🎓</span> Select Grades
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Tap to select the grades/classes your school offers
            </p>

            {/* Grade chips */}
            <div className="flex flex-wrap gap-2">
              {GRADE_PRESETS.map((grade) => {
                const isSelected = selectedGrades.includes(grade);
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => handleToggleGrade(grade)}
                    className={cn(
                      'px-4 py-2.5 rounded-xl text-sm font-medium border transition-all min-h-[40px]',
                      isSelected
                        ? 'bg-[var(--preone-primary)] text-white border-[var(--preone-primary)] shadow-md shadow-[var(--preone-primary)]/20'
                        : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--preone-primary)]/50'
                    )}
                  >
                    {isSelected && <span className="mr-1">✓</span>}
                    {grade}
                  </button>
                );
              })}
            </div>

            {/* Add Custom Grade */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Custom grade name (e.g., Grade 11)"
                value={customGradeInput}
                onChange={(e) => setCustomGradeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomGrade()}
                className={cn(INPUT_CLASS, 'flex-1')}
              />
              <button
                type="button"
                onClick={handleAddCustomGrade}
                disabled={!customGradeInput.trim()}
                className="px-4 py-3 rounded-xl bg-[var(--preone-primary)] text-white text-sm font-medium hover:shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
              >
                Add
              </button>
            </div>
          </motion.div>
        </PreOneCardContent>
      </PreOneCard>

      {/* ── Section Configuration per Grade ── */}
      <AnimatePresence mode="popLayout">
        {gradeConfigs.map((gc) => (
          <motion.div
            key={gc.gradeName}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
          >
            <PreOneCard variant="strip" className="mb-4">
              <PreOneCardContent>
                <div className="space-y-4">
                  {/* Grade Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--preone-primary)] to-[var(--preone-primary-light)] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                        {gc.gradeName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                          {gc.gradeName}
                        </h4>
                        <p className="text-xs text-[var(--text-muted)]">
                          {gc.sections.length} section{gc.sections.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Branch selector (multi-campus) */}
                    {branches.length > 1 && (
                      <select
                        value={gc.branchId}
                        onChange={(e) => handleGradeBranchChange(gc.gradeName, e.target.value)}
                        className={cn(SMALL_INPUT_CLASS, 'text-xs')}
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Sections */}
                  <div className="space-y-2">
                    {gc.sections.map((section, sIdx) => (
                      <div
                        key={section.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]"
                      >
                        {/* Section number */}
                        <span className="text-xs font-medium text-[var(--text-muted)] w-6 text-center">
                          {sIdx + 1}
                        </span>

                        {/* Section Name */}
                        <div className="flex-1">
                          <label className="text-xs text-[var(--text-muted)] mb-0.5 block">
                            Section
                          </label>
                          <input
                            type="text"
                            value={section.name}
                            onChange={(e) =>
                              handleUpdateSection(gc.gradeName, section.id, {
                                name: e.target.value,
                              })
                            }
                            className={cn(SMALL_INPUT_CLASS, 'w-20')}
                            maxLength={5}
                          />
                        </div>

                        {/* Capacity */}
                        <div className="flex-1">
                          <label className="text-xs text-[var(--text-muted)] mb-0.5 block">
                            Capacity
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={section.capacity}
                            onChange={(e) =>
                              handleUpdateSection(gc.gradeName, section.id, {
                                capacity: parseInt(e.target.value) || 30,
                              })
                            }
                            className={cn(SMALL_INPUT_CLASS, 'w-24')}
                          />
                        </div>

                        {/* Remove Section */}
                        {gc.sections.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSection(gc.gradeName, section.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-500 transition-all mt-4"
                            aria-label="Remove section"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add Section Button */}
                  <button
                    type="button"
                    onClick={() => handleAddSection(gc.gradeName)}
                    className="w-full py-2.5 rounded-xl border border-dashed border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--preone-primary)] hover:text-[var(--preone-primary)] transition-all text-sm font-medium min-h-[40px]"
                  >
                    + Add Section
                  </button>
                </div>
              </PreOneCardContent>
            </PreOneCard>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ── Empty state when no grades selected ── */}
      {gradeConfigs.length === 0 && (
        <motion.div variants={itemVariants}>
          <div className="text-center py-8">
            <span className="text-4xl block mb-3">📚</span>
            <p className="text-sm text-[var(--text-muted)]">
              Select grades above to configure sections
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

AcademicYearStep.displayName = 'AcademicYearStep';

export default AcademicYearStep;
