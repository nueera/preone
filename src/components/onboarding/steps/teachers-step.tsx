'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, Trash2, Upload, Download, X, UserPlus, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';

const genId = () => crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);

interface TeacherAssignment {
  classId: string;
  subjectId: string;
  role: 'class_teacher' | 'subject_teacher' | 'assistant';
}

const GRADIENT_COLORS = [
  'from-violet-500 to-purple-500',
  'from-sky-500 to-blue-500',
  'from-emerald-500 to-teal-500',
  'from-rose-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-indigo-500 to-violet-500',
];

const ROLE_LABELS: Record<string, string> = {
  class_teacher: 'Class Teacher',
  subject_teacher: 'Subject Teacher',
  assistant: 'Assistant',
};

export function TeachersStep() {
  const { draft, updateDraft, completeStep } = useOnboardingStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [qualification, setQualification] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [branchId, setBranchId] = useState(
    draft.branches.find((b) => b.isPrimary)?.id || draft.branches[0]?.id || ''
  );
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([
    { classId: '', subjectId: '', role: 'subject_teacher' },
  ]);
  const [isImporting, setIsImporting] = useState(false);

  const addAssignment = () => {
    setAssignments([...assignments, { classId: '', subjectId: '', role: 'subject_teacher' }]);
  };

  const removeAssignment = (index: number) => {
    if (assignments.length <= 1) return;
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const updateAssignment = (index: number, field: keyof TeacherAssignment, value: string) => {
    const updated = [...assignments];
    updated[index] = { ...updated[index], [field]: value };
    setAssignments(updated);
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setQualification('');
    setSpecialization('');
    setBranchId(draft.branches.find((b) => b.isPrimary)?.id || draft.branches[0]?.id || '');
    setAssignments([{ classId: '', subjectId: '', role: 'subject_teacher' }]);
  };

  const handleAddTeacher = () => {
    const name = `${firstName} ${lastName}`.trim();
    if (!name) {
      toast.error('Please enter the teacher name');
      return;
    }

    const validAssignments = assignments.filter((a) => a.classId || a.subjectId);
    const classIds = [...new Set(validAssignments.map((a) => a.classId).filter(Boolean))];
    const subjectIds = [...new Set(validAssignments.map((a) => a.subjectId).filter(Boolean))];

    const newTeacher = {
      id: genId(),
      name,
      email,
      phone,
      subjectIds,
      classIds,
    };

    updateDraft('teachers', [...draft.teachers, newTeacher]);
    toast.success(`${name} added as a teacher!`);
    resetForm();
  };

  const handleRemoveTeacher = (id: string) => {
    const teacher = draft.teachers.find((t) => t.id === id);
    updateDraft(
      'teachers',
      draft.teachers.filter((t) => t.id !== id)
    );
    if (teacher) toast.success(`${teacher.name} removed`);
  };

  const handleCSVImport = async (file: File) => {
    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/onboarding/teachers/import', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Import failed');

      const data = await res.json();
      const imported = data.teachers || [];

      const newTeachers = imported.map(
        (t: { name: string; email: string; phone: string; subjectIds: string[]; classIds: string[] }) => ({
          id: genId(),
          name: t.name || '',
          email: t.email || '',
          phone: t.phone || '',
          subjectIds: t.subjectIds || [],
          classIds: t.classIds || [],
        })
      );

      updateDraft('teachers', [...draft.teachers, ...newTeachers]);
      toast.success(`Imported ${newTeachers.length} teachers!`);
    } catch {
      toast.error('Failed to import teachers. Please check your CSV file.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
      handleCSVImport(file);
    } else {
      toast.error('Please upload a CSV or XLSX file');
    }
  };

  const handleContinue = () => {
    completeStep(5);
  };

  // Get classes filtered by branch
  const filteredClasses = branchId
    ? draft.classes.filter((c) => c.branchId === branchId)
    : draft.classes;

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-primary)' }}>
          👩‍🏫 Add Teachers
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Add your teachers and assign them to classes and subjects
        </p>
      </motion.div>

      {/* Add Teacher Form */}
      <PreOneCard variant="default">
        <PreOneCardContent>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[var(--preone-primary)]" />
            Add Teacher
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">
                First Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Priya"
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">
                Last Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Sharma"
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.com"
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Qualification */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">Qualification</label>
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="e.g. B.Ed, M.Ed"
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Specialization */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">Specialization</label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g. Early Childhood Education"
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          {/* Branch Selector */}
          {draft.branches.length > 1 && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">Branch</label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all"
              >
                {draft.branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.isPrimary ? '(Primary)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Assignments Section */}
          <div className="mt-6 border-t border-[var(--border-light)] pt-4">
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[var(--preone-primary)]" />
              Class & Subject Assignments
            </h4>

            <AnimatePresence>
              {assignments.map((assignment, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap items-end gap-3 mb-3"
                >
                  {/* Class selector */}
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">Class</label>
                    <select
                      value={assignment.classId}
                      onChange={(e) => updateAssignment(index, 'classId', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all"
                    >
                      <option value="">Select class</option>
                      {filteredClasses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.section ? `- ${c.section}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subject selector */}
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">Subject</label>
                    <select
                      value={assignment.subjectId}
                      onChange={(e) => updateAssignment(index, 'subjectId', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all"
                    >
                      <option value="">Select subject</option>
                      {draft.subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Role selector */}
                  <div className="flex-1 min-w-[130px]">
                    <label className="block text-xs font-medium mb-1 text-[var(--text-secondary)]">Role</label>
                    <select
                      value={assignment.role}
                      onChange={(e) => updateAssignment(index, 'role', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all"
                    >
                      <option value="class_teacher">Class Teacher</option>
                      <option value="subject_teacher">Subject Teacher</option>
                      <option value="assistant">Assistant</option>
                    </select>
                  </div>

                  {/* Remove assignment */}
                  {assignments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAssignment(index)}
                      className="p-2.5 rounded-xl text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-all min-h-[44px]"
                      aria-label="Remove assignment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            <button
              type="button"
              onClick={addAssignment}
              className="flex items-center gap-1.5 text-sm font-medium text-[var(--preone-primary)] hover:text-[var(--preone-primary-dark)] transition-colors mt-1 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              Add Another Assignment
            </button>
          </div>

          {/* Submit button */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleAddTeacher}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--preone-primary)] to-[var(--preone-primary-light)] text-white font-medium shadow-md hover:shadow-lg hover:shadow-[var(--preone-primary)]/25 transition-all active:scale-[0.97] min-h-[44px]"
            >
              <Plus className="w-4 h-4 inline-block mr-1.5" />
              Add Teacher
            </button>
          </div>
        </PreOneCardContent>
      </PreOneCard>

      {/* Added Teachers List */}
      {draft.teachers.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            Added Teachers
            <span className="text-sm font-normal text-[var(--text-muted)]">
              ({draft.teachers.length})
            </span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto custom-scrollbar">
            <AnimatePresence>
              {draft.teachers.map((teacher, idx) => {
                const gradient = GRADIENT_COLORS[idx % GRADIENT_COLORS.length];
                const initial = teacher.name.charAt(0).toUpperCase();

                const teacherClasses = draft.classes.filter((c) =>
                  teacher.classIds.includes(c.id)
                );
                const teacherSubjects = draft.subjects.filter((s) =>
                  teacher.subjectIds.includes(s.id)
                );

                return (
                  <motion.div
                    key={teacher.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PreOneCard variant="default" className="relative">
                      <PreOneCardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Avatar */}
                          <div
                            className={cn(
                              'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm flex-shrink-0',
                              gradient
                            )}
                          >
                            {initial}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[var(--text-primary)] text-sm truncate">
                              {teacher.name}
                            </p>
                            {teacher.phone && (
                              <p className="text-xs text-[var(--text-muted)] truncate">{teacher.phone}</p>
                            )}

                            {/* Assignment badges */}
                            {(teacherClasses.length > 0 || teacherSubjects.length > 0) && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {teacherClasses.map((c) => (
                                  <span
                                    key={c.id}
                                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 text-xs font-medium"
                                  >
                                    {c.name} {c.section ? `- ${c.section}` : ''}
                                  </span>
                                ))}
                                {teacherSubjects.map((s) => (
                                  <span
                                    key={s.id}
                                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 text-xs font-medium"
                                  >
                                    {s.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Remove button */}
                          <button
                            onClick={() => handleRemoveTeacher(teacher.id)}
                            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                            aria-label={`Remove ${teacher.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </PreOneCardContent>
                    </PreOneCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* CSV Import */}
      <PreOneCard variant="glass">
        <PreOneCardContent>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <Upload className="w-5 h-5 text-[var(--preone-primary)]" />
            Import from CSV
          </h3>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Download template */}
            <a
              href="/api/onboarding/template/teachers"
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-all text-sm font-medium min-h-[44px] justify-center"
            >
              <Download className="w-4 h-4" />
              Download Template
            </a>

            {/* File upload area */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-[var(--border-default)] hover:border-[var(--preone-primary)] bg-[var(--bg-secondary)] cursor-pointer transition-all min-h-[44px]"
            >
              <Upload className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-secondary)]">
                Drop CSV here or click to browse
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleCSVImport(file);
                }}
              />
            </div>
          </div>

          {isImporting && (
            <div className="mt-3 flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <div className="w-4 h-4 border-2 border-[var(--preone-primary)] border-t-transparent rounded-full animate-spin" />
              Importing teachers...
            </div>
          )}
        </PreOneCardContent>
      </PreOneCard>

      {/* Continue button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={handleContinue}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--preone-primary)] to-[var(--preone-primary-light)] text-white font-medium shadow-md hover:shadow-lg hover:shadow-[var(--preone-primary)]/25 transition-all active:scale-[0.97] min-h-[44px]"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

TeachersStep.displayName = 'TeachersStep';

export default TeachersStep;
