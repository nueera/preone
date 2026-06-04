'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, Trash2, Upload, Download, Users, GraduationCap, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';

const genId = () => crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);

const AVATAR_GRADIENTS = [
  'from-rose-400 to-pink-500',
  'from-sky-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-violet-400 to-purple-500',
  'from-cyan-400 to-sky-500',
];

const GENDER_OPTIONS = [
  { value: '', label: 'Select gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function StudentsStep() {
  const { draft, updateDraft, completeStep } = useOnboardingStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [classId, setClassId] = useState(draft.classes[0]?.id || '');
  const [bloodGroup, setBloodGroup] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const generateAdmissionNo = () => {
    const prefix = draft.schoolName ? draft.schoolName.substring(0, 3).toUpperCase() : 'STD';
    const num = (draft.students.length + 1).toString().padStart(4, '0');
    setAdmissionNo(`${prefix}${num}`);
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setDateOfBirth('');
    setGender('');
    setClassId(draft.classes[0]?.id || '');
    setBloodGroup('');
    setAdmissionNo('');
    setFatherName('');
    setFatherPhone('');
    setMotherName('');
    setMotherPhone('');
    setParentEmail('');
  };

  const handleAddStudent = () => {
    const name = `${firstName} ${lastName}`.trim();
    if (!name) {
      toast.error('Please enter the student name');
      return;
    }
    if (!classId) {
      toast.error('Please select a class');
      return;
    }
    if (!fatherName && !fatherPhone) {
      toast.error('Please provide at least father\'s name or phone');
      return;
    }

    const newStudent = {
      id: genId(),
      name,
      classId,
      parentName: fatherName || motherName || '',
      parentPhone: fatherPhone || motherPhone || '',
      parentEmail,
    };

    updateDraft('students', [...draft.students, newStudent]);
    toast.success(`${name} added as a student!`);
    resetForm();
  };

  const handleRemoveStudent = (id: string) => {
    const student = draft.students.find((s) => s.id === id);
    updateDraft(
      'students',
      draft.students.filter((s) => s.id !== id)
    );
    if (student) toast.success(`${student.name} removed`);
  };

  const handleCSVImport = async (file: File) => {
    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/onboarding/students/import', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Import failed');

      const data = await res.json();
      const imported = data.students || [];

      const newStudents = imported.map(
        (s: { name: string; classId: string; parentName: string; parentPhone: string; parentEmail: string }) => ({
          id: genId(),
          name: s.name || '',
          classId: s.classId || '',
          parentName: s.parentName || '',
          parentPhone: s.parentPhone || '',
          parentEmail: s.parentEmail || '',
        })
      );

      updateDraft('students', [...draft.students, ...newStudents]);
      toast.success(`Imported ${newStudents.length} students!`);
    } catch {
      toast.error('Failed to import students. Please check your CSV file.');
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
    completeStep(6);
  };

  // Group students by class
  const studentsByClass = draft.classes.map((cls) => {
    const students = draft.students.filter((s) => s.classId === cls.id);
    return { ...cls, students };
  }).filter((c) => c.students.length > 0);

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-primary)' }}>
          👨‍🎓 Add Students
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Add students and assign them to classes with parent details
        </p>
      </motion.div>

      {/* Add Student Form */}
      <PreOneCard variant="default">
        <PreOneCardContent>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[var(--preone-primary)]" />
            Add Student
          </h3>

          {/* Student Details */}
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
                placeholder="e.g. Aarav"
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
                placeholder="e.g. Patel"
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all"
              >
                {GENDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Assignment */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">
                Class <span className="text-red-400">*</span>
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all"
              >
                <option value="">Select class</option>
                {draft.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section ? `- ${c.section}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all"
              >
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>
                    {bg || 'Select blood group'}
                  </option>
                ))}
              </select>
            </div>

            {/* Admission No */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">Admission No</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={admissionNo}
                  onChange={(e) => setAdmissionNo(e.target.value)}
                  placeholder="Auto-generatable"
                  className="flex-1 px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={generateAdmissionNo}
                  className="px-3 py-3 rounded-xl border border-[var(--border-default)] text-[var(--preone-primary)] hover:bg-[var(--preone-primary-50)] transition-all text-xs font-medium min-h-[44px]"
                >
                  Auto
                </button>
              </div>
            </div>
          </div>

          {/* Parent/Guardian Section */}
          <div className="mt-6 border-t border-[var(--border-light)] pt-4">
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-[var(--preone-primary)]" />
              Parent / Guardian Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Father's Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">
                  Father&apos;s Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="e.g. Rajesh Patel"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Father's Phone */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">
                  Father&apos;s Phone <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={fatherPhone}
                  onChange={(e) => setFatherPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Mother's Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">Mother&apos;s Name</label>
                <input
                  type="text"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  placeholder="e.g. Meera Patel"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Mother's Phone */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">Mother&apos;s Phone</label>
                <input
                  type="tel"
                  value={motherPhone}
                  onChange={(e) => setMotherPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Parent Email */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5 text-[var(--text-primary)]">
                  Email <span className="text-xs font-normal text-[var(--text-muted)]">(for app login)</span>
                </label>
                <input
                  type="email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="parent@email.com"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Submit button */}
          <div className="mt-6">
            <button
              type="button"
              onClick={handleAddStudent}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--preone-primary)] to-[var(--preone-primary-light)] text-white font-medium shadow-md hover:shadow-lg hover:shadow-[var(--preone-primary)]/25 transition-all active:scale-[0.97] min-h-[44px]"
            >
              <Plus className="w-4 h-4 inline-block mr-1.5" />
              Add Student
            </button>
          </div>
        </PreOneCardContent>
      </PreOneCard>

      {/* Students Grouped by Class */}
      {studentsByClass.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
            Students by Class
            <span className="text-sm font-normal text-[var(--text-muted)]">
              ({draft.students.length} total)
            </span>
          </h3>

          {studentsByClass.map((cls) => (
            <PreOneCard key={cls.id} variant="default">
              <PreOneCardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-[var(--text-primary)] text-sm">
                    {cls.name} {cls.section ? `- ${cls.section}` : ''}
                  </h4>
                  <span className="text-xs text-[var(--text-muted)] px-2 py-1 rounded-lg bg-[var(--bg-tertiary)]">
                    {cls.students.length} student{cls.students.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {cls.students.map((student, idx) => {
                    const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
                    const initial = student.name.charAt(0).toUpperCase();

                    return (
                      <motion.div
                        key={student.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative group flex flex-col items-center p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-all"
                      >
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm mb-1.5',
                            gradient
                          )}
                        >
                          {initial}
                        </div>
                        <p className="text-xs font-medium text-[var(--text-primary)] text-center truncate w-full">
                          {student.name}
                        </p>
                        {student.parentPhone && (
                          <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-0.5 mt-0.5">
                            <Phone className="w-2.5 h-2.5" />
                            {student.parentPhone}
                          </p>
                        )}

                        {/* Remove on hover */}
                        <button
                          onClick={() => handleRemoveStudent(student.id)}
                          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-100 text-red-500 hover:bg-red-200 items-center justify-center transition-all hidden group-hover:flex"
                          aria-label={`Remove ${student.name}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </PreOneCardContent>
            </PreOneCard>
          ))}
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
            <a
              href="/api/onboarding/template/students"
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-all text-sm font-medium min-h-[44px] justify-center"
            >
              <Download className="w-4 h-4" />
              Download Template
            </a>

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
              Importing students...
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

StudentsStep.displayName = 'StudentsStep';

export default StudentsStep;
