'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  School,
  Building2,
  BookOpen,
  GraduationCap,
  Users,
  Bell,
  Pencil,
  Rocket,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';

interface SummaryCardProps {
  icon: React.ReactNode;
  title: string;
  step: number;
  children: React.ReactNode;
  onEdit: (step: number) => void;
  isComplete: boolean;
}

function SummaryCard({ icon, title, step, children, onEdit, isComplete }: SummaryCardProps) {
  return (
    <PreOneCard variant="default" className="relative">
      <PreOneCardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--preone-primary-50)] flex items-center justify-center text-[var(--preone-primary)]">
              {icon}
            </div>
            <h4 className="font-semibold text-[var(--text-primary)] text-sm">{title}</h4>
            {isComplete ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            )}
          </div>

          <button
            onClick={() => onEdit(step)}
            className="flex items-center gap-1 text-xs font-medium text-[var(--preone-primary)] hover:text-[var(--preone-primary-dark)] transition-colors px-2 py-1.5 rounded-lg hover:bg-[var(--preone-primary-50)] min-h-[44px]"
            aria-label={`Edit ${title}`}
          >
            <Pencil className="w-3 h-3" />
            Edit
          </button>
        </div>

        <div className="text-sm text-[var(--text-secondary)]">{children}</div>
      </PreOneCardContent>
    </PreOneCard>
  );
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  attendance: { label: 'Attendance', icon: '✅' },
  mood: { label: 'Mood', icon: '😊' },
  activities: { label: 'Activities', icon: '🎨' },
  meals: { label: 'Meals', icon: '🍽️' },
  nap: { label: 'Nap', icon: '😴' },
  photos: { label: 'Photos', icon: '📸' },
  teacher_notes: { label: 'Teacher Notes', icon: '💬' },
};

const CHANNEL_LABELS: Record<string, { label: string; icon: string }> = {
  app: { label: 'App', icon: '📱' },
  email: { label: 'Email', icon: '📧' },
  sms: { label: 'SMS', icon: '💬' },
  whatsapp: { label: 'WhatsApp', icon: '📲' },
};

export function ReviewLaunchStep() {
  const router = useRouter();
  const { draft, completeOnboarding } = useOnboardingStore();
  const [isLaunching, setIsLaunching] = useState(false);

  const handleEditStep = (step: number) => {
    router.push(`/admin/onboarding/step/${step}`);
  };

  const handleLaunch = async () => {
    setIsLaunching(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('preone_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers,
        body: JSON.stringify(draft),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to complete onboarding');
      }

      completeOnboarding();
      toast.success('🎉 PreOne is ready! Redirecting to dashboard...');
      router.push('/admin/dashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(message);
    } finally {
      setIsLaunching(false);
    }
  };

  // Derived data for summary
  const schoolCity = draft.schoolAddress
    ? draft.schoolAddress.split(',').slice(-2, -1)[0]?.trim() || ''
    : '';

  const studentsByClass = draft.classes.map((cls) => ({
    ...cls,
    studentCount: draft.students.filter((s) => s.classId === cls.id).length,
  }));

  const subjectCountByClass = draft.classes.map((cls) => ({
    ...cls,
    subjectCount: draft.subjects.filter((s) => s.classIds.includes(cls.id)).length,
  }));

  const hasMinimumData = draft.schoolName && draft.branches.length > 0;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-primary)' }}>
          🚀 Review & Launch
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Review your setup and launch PreOne for your school
        </p>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        {/* School Card */}
        <motion.div variants={itemVariants}>
          <SummaryCard
            icon={<School className="w-4 h-4" />}
            title="School Details"
            step={1}
            onEdit={handleEditStep}
            isComplete={!!draft.schoolName}
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div>
                <span className="text-[var(--text-muted)] text-xs">Name:</span>{' '}
                <span className="font-medium text-[var(--text-primary)]">
                  {draft.schoolName || 'Not set'}
                </span>
              </div>
              {schoolCity && (
                <div>
                  <span className="text-[var(--text-muted)] text-xs">City:</span>{' '}
                  <span className="font-medium text-[var(--text-primary)]">{schoolCity}</span>
                </div>
              )}
              {draft.schoolType && (
                <div>
                  <span className="text-[var(--text-muted)] text-xs">Type:</span>{' '}
                  <span className="font-medium text-[var(--text-primary)]">{draft.schoolType}</span>
                </div>
              )}
              {draft.schoolBoard && (
                <div>
                  <span className="text-[var(--text-muted)] text-xs">Board:</span>{' '}
                  <span className="font-medium text-[var(--text-primary)]">{draft.schoolBoard}</span>
                </div>
              )}
            </div>
          </SummaryCard>
        </motion.div>

        {/* Branches Card */}
        <motion.div variants={itemVariants}>
          <SummaryCard
            icon={<Building2 className="w-4 h-4" />}
            title="Branches"
            step={2}
            onEdit={handleEditStep}
            isComplete={draft.branches.length > 0}
          >
            {draft.branches.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {draft.branches.map((branch) => (
                  <span
                    key={branch.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] text-xs font-medium text-[var(--text-primary)]"
                  >
                    {branch.isPrimary && (
                      <span className="text-amber-500" aria-label="Primary branch">⭐</span>
                    )}
                    {branch.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[var(--text-muted)] text-xs">No branches added</p>
            )}
          </SummaryCard>
        </motion.div>

        {/* Classes Card */}
        <motion.div variants={itemVariants}>
          <SummaryCard
            icon={<BookOpen className="w-4 h-4" />}
            title="Classes & Subjects"
            step={3}
            onEdit={handleEditStep}
            isComplete={draft.classes.length > 0}
          >
            {draft.classes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {studentsByClass.map((cls) => {
                  const subjectCount = subjectCountByClass.find((c) => c.id === cls.id)?.subjectCount || 0;
                  return (
                    <span
                      key={cls.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300 text-xs font-medium"
                    >
                      {cls.name} {cls.section ? `- ${cls.section}` : ''}
                      <span className="text-[var(--text-muted)]">
                        ({cls.studentCount} students, {subjectCount} subjects)
                      </span>
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-[var(--text-muted)] text-xs">No classes configured</p>
            )}
          </SummaryCard>
        </motion.div>

        {/* Teachers Card */}
        <motion.div variants={itemVariants}>
          <SummaryCard
            icon={<GraduationCap className="w-4 h-4" />}
            title="Teachers"
            step={5}
            onEdit={handleEditStep}
            isComplete={draft.teachers.length > 0}
          >
            {draft.teachers.length > 0 ? (
              <div className="space-y-1">
                <p className="text-xs text-[var(--text-muted)]">
                  {draft.teachers.length} teacher{draft.teachers.length !== 1 ? 's' : ''} added
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {draft.teachers.map((teacher) => {
                    const teacherClasses = draft.classes.filter((c) =>
                      teacher.classIds.includes(c.id)
                    );
                    const teacherSubjects = draft.subjects.filter((s) =>
                      teacher.subjectIds.includes(s.id)
                    );

                    return (
                      <span
                        key={teacher.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300 text-xs font-medium"
                      >
                        {teacher.name}
                        {(teacherClasses.length > 0 || teacherSubjects.length > 0) && (
                          <span className="text-violet-400 dark:text-violet-500">
                            ({[
                              ...teacherClasses.map((c) => c.name),
                              ...teacherSubjects.map((s) => s.name),
                            ].join(', ')})
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-[var(--text-muted)] text-xs">No teachers added yet</p>
            )}
          </SummaryCard>
        </motion.div>

        {/* Students Card */}
        <motion.div variants={itemVariants}>
          <SummaryCard
            icon={<Users className="w-4 h-4" />}
            title="Students"
            step={6}
            onEdit={handleEditStep}
            isComplete={draft.students.length > 0}
          >
            {draft.students.length > 0 ? (
              <div className="space-y-1">
                <p className="text-xs text-[var(--text-muted)]">
                  {draft.students.length} student{draft.students.length !== 1 ? 's' : ''} total
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {studentsByClass
                    .filter((c) => c.studentCount > 0)
                    .map((cls) => (
                      <span
                        key={cls.id}
                        className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 text-xs font-medium"
                      >
                        {cls.name} {cls.section ? `- ${cls.section}` : ''}: {cls.studentCount}
                      </span>
                    ))}
                </div>
              </div>
            ) : (
              <p className="text-[var(--text-muted)] text-xs">No students added yet</p>
            )}
          </SummaryCard>
        </motion.div>

        {/* Daily Updates Card */}
        <motion.div variants={itemVariants}>
          <SummaryCard
            icon={<Bell className="w-4 h-4" />}
            title="Daily Updates"
            step={7}
            onEdit={handleEditStep}
            isComplete={draft.dailyUpdatesEnabled}
          >
            {draft.dailyUpdatesEnabled ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {draft.updateCategories.map((cat) => {
                    const info = CATEGORY_LABELS[cat];
                    return info ? (
                      <span
                        key={cat}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[var(--preone-primary-50)] text-[var(--preone-primary)] text-xs font-medium"
                      >
                        {info.icon} {info.label}
                      </span>
                    ) : null;
                  })}
                </div>
                {/* Channels */}
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <span>Via:</span>
                  {Object.entries(CHANNEL_LABELS).map(([key, info]) => (
                    <span key={key} className="inline-flex items-center gap-0.5">
                      {info.icon} {info.label}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[var(--text-muted)] text-xs">Daily updates not configured</p>
            )}
          </SummaryCard>
        </motion.div>
      </motion.div>

      {/* Launch Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="pt-4"
      >
        {/* Note */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/30 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            This will send welcome emails/SMS to all added teachers and parents
          </p>
        </div>

        {/* Launch Button */}
        <motion.button
          type="button"
          onClick={handleLaunch}
          disabled={isLaunching || !hasMinimumData}
          whileHover={hasMinimumData && !isLaunching ? { scale: 1.02, boxShadow: '0 20px 40px rgba(99, 102, 241, 0.35)' } : {}}
          whileTap={hasMinimumData && !isLaunching ? { scale: 0.98 } : {}}
          className={cn(
            'w-full py-4 rounded-2xl text-white font-bold text-lg transition-all min-h-[56px] flex items-center justify-center gap-2',
            hasMinimumData && !isLaunching
              ? 'bg-gradient-to-r from-[var(--preone-primary)] via-[var(--preone-primary-light)] to-emerald-400 shadow-lg shadow-[var(--preone-primary)]/25 cursor-pointer'
              : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed'
          )}
        >
          {isLaunching ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Launching PreOne...
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5" />
              Launch PreOne for {draft.schoolName || 'Your School'}!
            </>
          )}
        </motion.button>

        {!hasMinimumData && (
          <p className="text-xs text-[var(--text-muted)] mt-2 text-center">
            Please complete the School and Branch steps before launching
          </p>
        )}
      </motion.div>
    </div>
  );
}

ReviewLaunchStep.displayName = 'ReviewLaunchStep';

export default ReviewLaunchStep;
