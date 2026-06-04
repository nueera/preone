'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';

// ── Types ──

type SubjectType = 'academic' | 'co-curricular' | 'extra-curricular';

interface SubjectDraft {
  id: string;
  name: string;
  type: SubjectType;
  classIds: string[];
  color: string;
}

// ── Constants ──

const SUBJECT_COLORS = [
  '#6366F1', '#0EA5E9', '#10B981', '#F59E0B',
  '#EC4899', '#8B5CF6', '#14B8A6', '#F97316',
  '#EF4444', '#06B6D4', '#84CC16', '#E11D48',
] as const;

const SUBJECT_TYPE_OPTIONS: { value: SubjectType; label: string }[] = [
  { value: 'academic', label: 'Academic' },
  { value: 'co-curricular', label: 'Co-curricular' },
  { value: 'extra-curricular', label: 'Extra-curricular' },
];

const CBSE_PRIMARY_SUBJECTS: Omit<SubjectDraft, 'id' | 'classIds'>[] = [
  { name: 'English', type: 'academic', color: '#6366F1' },
  { name: 'Hindi', type: 'academic', color: '#0EA5E9' },
  { name: 'Mathematics', type: 'academic', color: '#10B981' },
  { name: 'EVS', type: 'academic', color: '#F59E0B' },
  { name: 'Computer Science', type: 'academic', color: '#8B5CF6' },
  { name: 'Art', type: 'co-curricular', color: '#EC4899' },
  { name: 'Physical Education', type: 'co-curricular', color: '#14B8A6' },
  { name: 'Music', type: 'co-curricular', color: '#F97316' },
];

const MONTESSORI_SUBJECTS: Omit<SubjectDraft, 'id' | 'classIds'>[] = [
  { name: 'Language', type: 'academic', color: '#6366F1' },
  { name: 'Math', type: 'academic', color: '#10B981' },
  { name: 'Sensorial', type: 'academic', color: '#0EA5E9' },
  { name: 'Practical Life', type: 'co-curricular', color: '#F59E0B' },
  { name: 'Culture', type: 'academic', color: '#8B5CF6' },
  { name: 'Art', type: 'co-curricular', color: '#EC4899' },
];

const SUBJECT_PACKS = [
  {
    id: 'cbse-primary',
    label: 'CBSE Primary',
    icon: '📘',
    description: 'English, Hindi, Math, EVS, CS, Art, PE, Music',
    subjects: CBSE_PRIMARY_SUBJECTS,
  },
  {
    id: 'montessori',
    label: 'Montessori',
    icon: '🌿',
    description: 'Language, Math, Sensorial, Practical Life, Culture, Art',
    subjects: MONTESSORI_SUBJECTS,
  },
  {
    id: 'custom',
    label: 'Custom',
    icon: '✏️',
    description: 'Start from scratch and add your own subjects',
    subjects: [],
  },
] as const;

const INPUT_CLASS =
  'w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all';

const SMALL_INPUT_CLASS =
  'px-3 py-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all text-sm';

const LABEL_CLASS = 'block text-sm font-medium mb-1.5 text-[var(--text-primary)]';

function generateId(): string {
  return crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getRandomColor(): string {
  return SUBJECT_COLORS[Math.floor(Math.random() * SUBJECT_COLORS.length)];
}

function createEmptySubject(classIds: string[] = []): SubjectDraft {
  return {
    id: generateId(),
    name: '',
    type: 'academic',
    classIds,
    color: getRandomColor(),
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

const subjectVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10, transition: { duration: 0.2 } },
};

// ── Subject Row Sub-component ──

function SubjectRow({
  subject,
  onUpdate,
  onRemove,
}: {
  subject: SubjectDraft;
  onUpdate: (id: string, updates: Partial<SubjectDraft>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <motion.div
      variants={subjectVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-secondary)]"
    >
      {/* Color Dot */}
      <div
        className="w-4 h-4 rounded-full flex-shrink-0 cursor-pointer border-2 border-white shadow-sm"
        style={{ backgroundColor: subject.color }}
        title="Subject color"
      />

      {/* Subject Name */}
      <div className="flex-1 min-w-0">
        <input
          type="text"
          placeholder="Subject name"
          value={subject.name}
          onChange={(e) => onUpdate(subject.id, { name: e.target.value })}
          className={cn(SMALL_INPUT_CLASS, 'w-full')}
        />
      </div>

      {/* Type Selector */}
      <div className="flex-shrink-0">
        <select
          value={subject.type}
          onChange={(e) => onUpdate(subject.id, { type: e.target.value as SubjectType })}
          className={cn(SMALL_INPUT_CLASS, 'text-xs pr-6')}
        >
          {SUBJECT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Remove Button */}
      <button
        type="button"
        onClick={() => onRemove(subject.id)}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-500 transition-all flex-shrink-0"
        aria-label="Remove subject"
      >
        ✕
      </button>
    </motion.div>
  );
}

// ── Main Component ──

export function SubjectsStep() {
  const { draft, updateDraft, completeStep } = useOnboardingStore();

  // ── Local subjects state ──
  const [subjects, setSubjects] = useState<SubjectDraft[]>(() => {
    if (draft.subjects.length > 0) {
      return draft.subjects.map((s) => ({
        ...s,
        type: (s as Record<string, unknown>).type as SubjectType || 'academic',
        color: (s as Record<string, unknown>).color as string || getRandomColor(),
      }));
    }
    return [];
  });

  const [selectedPack, setSelectedPack] = useState<string | null>(null);

  // ── Get all classes from draft ──
  const allClasses = draft.classes;
  const allClassIds = allClasses.map((c) => c.id);

  // ── Sync to store ──
  const syncToStore = useCallback(
    (updatedSubjects: SubjectDraft[]) => {
      const storeSubjects = updatedSubjects.map((s) => ({
        id: s.id,
        name: s.name,
        classIds: s.classIds,
      }));
      updateDraft('subjects', storeSubjects);
    },
    [updateDraft]
  );

  // ── Handle subject update ──
  const handleUpdateSubject = useCallback(
    (id: string, updates: Partial<SubjectDraft>) => {
      setSubjects((prev) => {
        const next = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
        syncToStore(next);
        return next;
      });
    },
    [syncToStore]
  );

  // ── Remove a subject ──
  const handleRemoveSubject = useCallback(
    (id: string) => {
      setSubjects((prev) => {
        const next = prev.filter((s) => s.id !== id);
        syncToStore(next);
        return next;
      });
    },
    [syncToStore]
  );

  // ── Add a new subject ──
  const handleAddSubject = useCallback(
    (classIds: string[] = allClassIds) => {
      setSubjects((prev) => {
        const next = [...prev, createEmptySubject(classIds)];
        syncToStore(next);
        return next;
      });
    },
    [allClassIds, syncToStore]
  );

  // ── Select a preset pack ──
  const handleSelectPack = useCallback(
    (packId: string) => {
      setSelectedPack(packId);

      const pack = SUBJECT_PACKS.find((p) => p.id === packId);
      if (!pack || pack.id === 'custom') {
        // Custom: just add one empty subject if none exist
        if (subjects.length === 0) {
          handleAddSubject();
        }
        return;
      }

      // Auto-add preset subjects assigned to all classes
      const newSubjects: SubjectDraft[] = pack.subjects.map((s) => ({
        ...s,
        id: generateId(),
        classIds: allClassIds,
      }));

      setSubjects(newSubjects);
      syncToStore(newSubjects);
      toast.success(`${pack.label} subjects added to all classes!`);
    },
    [allClassIds, subjects.length, handleAddSubject, syncToStore]
  );

  // ── Add subject for a specific class ──
  const handleAddSubjectForClass = useCallback(
    (classId: string) => {
      setSubjects((prev) => {
        const next = [...prev, createEmptySubject([classId])];
        syncToStore(next);
        return next;
      });
    },
    [syncToStore]
  );

  // ── Mark step as completed ──
  useEffect(() => {
    const hasValidSubjects = subjects.some((s) => s.name.trim());
    if (hasValidSubjects && !draft.completedSteps.includes(4)) {
      completeStep(4);
    }
  }, [subjects, draft.completedSteps, completeStep]);

  // ── Group subjects by class for display ──
  const subjectsByClass = allClasses.map((cls) => ({
    classInfo: cls,
    subjects: subjects.filter((s) => s.classIds.includes(cls.id)),
  }));

  // ── Subjects assigned to ALL classes ──
  const globalSubjects = subjects.filter(
    (s) => s.classIds.length === allClassIds.length && allClassIds.every((id) => s.classIds.includes(id))
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* ── Step Header ── */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 flex items-center justify-center text-2xl shadow-sm">
            ✏️
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] font-[var(--font-primary)]">
              Subjects
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Configure subjects and assign them to classes
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Subject Pack Selector Card ── */}
      <PreOneCard variant="default" className="mb-4">
        <PreOneCardContent>
          <motion.div variants={itemVariants} className="space-y-5">
            <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <span className="text-lg">📦</span> Subject Packs
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Start with a preset pack or create custom subjects
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SUBJECT_PACKS.map((pack) => {
                const isSelected = selectedPack === pack.id;
                return (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => handleSelectPack(pack.id)}
                    className={cn(
                      'flex flex-col items-start p-4 rounded-2xl border-2 transition-all text-left min-h-[44px]',
                      isSelected
                        ? 'border-[var(--preone-primary)] bg-[var(--preone-primary-50)] shadow-lg shadow-[var(--preone-primary)]/10'
                        : 'border-[var(--border-default)] bg-[var(--bg-primary)] hover:border-[var(--preone-primary)]/40'
                    )}
                  >
                    <span className="text-2xl mb-2">{pack.icon}</span>
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        isSelected ? 'text-[var(--preone-primary)]' : 'text-[var(--text-primary)]'
                      )}
                    >
                      {pack.label}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] mt-1">
                      {pack.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </PreOneCardContent>
      </PreOneCard>

      {/* ── Global Subjects (assigned to all classes) ── */}
      {globalSubjects.length > 0 && (
        <PreOneCard variant="default" className="mb-4">
          <PreOneCardContent>
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <span className="text-lg">🌐</span> All Classes
                  <span className="text-xs font-normal text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-lg">
                    {globalSubjects.length} subject{globalSubjects.length !== 1 ? 's' : ''}
                  </span>
                </h3>
              </div>

              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {globalSubjects.map((subject) => (
                    <SubjectRow
                      key={subject.id}
                      subject={subject}
                      onUpdate={handleUpdateSubject}
                      onRemove={handleRemoveSubject}
                    />
                  ))}
                </AnimatePresence>
              </div>

              <button
                type="button"
                onClick={() => handleAddSubject()}
                className="w-full py-2.5 rounded-xl border border-dashed border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--preone-primary)] hover:text-[var(--preone-primary)] transition-all text-sm font-medium min-h-[40px]"
              >
                + Add Subject
              </button>
            </motion.div>
          </PreOneCardContent>
        </PreOneCard>
      )}

      {/* ── Per-Class Subject Cards ── */}
      {allClasses.length > 0 && subjectsByClass.map(({ classInfo, subjects: classSubjects }) => {
        // Only show subjects that are NOT global (not assigned to ALL classes)
        const localSubjects = classSubjects.filter(
          (s) => !(s.classIds.length === allClassIds.length && allClassIds.every((id) => s.classIds.includes(id)))
        );

        return (
          <motion.div key={classInfo.id} variants={itemVariants}>
            <PreOneCard variant="strip" className="mb-4">
              <PreOneCardContent>
                <div className="space-y-4">
                  {/* Class Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {classInfo.section}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                          {classInfo.name} - Section {classInfo.section}
                        </h4>
                        <p className="text-xs text-[var(--text-muted)]">
                          {classSubjects.length} subject{classSubjects.length !== 1 ? 's' : ''} assigned
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Subjects for this class */}
                  {localSubjects.length > 0 && (
                    <div className="space-y-2">
                      <AnimatePresence mode="popLayout">
                        {localSubjects.map((subject) => (
                          <SubjectRow
                            key={subject.id}
                            subject={subject}
                            onUpdate={handleUpdateSubject}
                            onRemove={handleRemoveSubject}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Add Subject Button per class */}
                  <button
                    type="button"
                    onClick={() => handleAddSubjectForClass(classInfo.id)}
                    className="w-full py-2.5 rounded-xl border border-dashed border-[var(--border-default)] text-[var(--text-muted)] hover:border-[var(--preone-primary)] hover:text-[var(--preone-primary)] transition-all text-sm font-medium min-h-[40px]"
                  >
                    + Add Subject for {classInfo.name} - {classInfo.section}
                  </button>
                </div>
              </PreOneCardContent>
            </PreOneCard>
          </motion.div>
        );
      })}

      {/* ── Empty state ── */}
      {subjects.length === 0 && (
        <motion.div variants={itemVariants}>
          <div className="text-center py-8">
            <span className="text-4xl block mb-3">✏️</span>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Select a subject pack above or add subjects manually
            </p>
            <button
              type="button"
              onClick={() => handleSelectPack('custom')}
              className="px-6 py-2.5 rounded-xl bg-[var(--preone-primary)] text-white text-sm font-medium hover:shadow-md transition-all min-h-[44px]"
            >
              Start Adding Subjects
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Summary ── */}
      {subjects.length > 0 && (
        <motion.div variants={itemVariants}>
          <PreOneCard variant="achievement" className="mb-4">
            <PreOneCardContent>
              <div className="flex items-center gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {subjects.filter((s) => s.name.trim()).length} subjects configured
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {subjects.filter((s) => s.type === 'academic' && s.name.trim()).length} academic •{' '}
                    {subjects.filter((s) => s.type === 'co-curricular' && s.name.trim()).length} co-curricular •{' '}
                    {subjects.filter((s) => s.type === 'extra-curricular' && s.name.trim()).length} extra-curricular
                  </p>
                </div>
              </div>
            </PreOneCardContent>
          </PreOneCard>
        </motion.div>
      )}
    </motion.div>
  );
}

SubjectsStep.displayName = 'SubjectsStep';

export default SubjectsStep;
