'use client';

import { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';

// ── Constants ──

const COUNTRIES = [
  { value: 'IN', label: 'India' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AE', label: 'UAE' },
  { value: 'SG', label: 'Singapore' },
] as const;

const BOARDS = [
  { value: 'CBSE', label: 'CBSE' },
  { value: 'ICSE', label: 'ICSE' },
  { value: 'STATE', label: 'State Board' },
  { value: 'IB', label: 'IB' },
  { value: 'IGCSE', label: 'IGCSE' },
  { value: 'OTHER', label: 'Other' },
] as const;

const THEMES = [
  { id: 'space', label: 'Space', icon: '🚀', gradient: 'from-indigo-500 to-purple-600' },
  { id: 'rainbow', label: 'Rainbow', icon: '🌈', gradient: 'from-pink-500 to-yellow-400' },
  { id: 'animals', label: 'Animals', icon: '🐼', gradient: 'from-emerald-500 to-teal-500' },
  { id: 'fairytale', label: 'Fairytale', icon: '🏰', gradient: 'from-violet-500 to-pink-500' },
  { id: 'nature', label: 'Nature', icon: '🌳', gradient: 'from-green-500 to-emerald-500' },
  { id: 'adventure', label: 'Adventure', icon: '🏴‍☠️', gradient: 'from-amber-500 to-orange-600' },
] as const;

const INPUT_CLASS =
  'w-full px-4 py-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all';

const LABEL_CLASS = 'block text-sm font-medium mb-1.5 text-[var(--text-primary)]';

function generateId(): string {
  return crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function generateSubdomain(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 30);
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

// ── Component ──

export function SchoolProfileStep() {
  const { draft, updateDraft, updateDraftBatch, completeStep } = useOnboardingStore();

  // ── Local form state (synced from store on mount) ──
  // We use the store directly as the source of truth

  // ── Auto-generate subdomain from school name ──
  const handleSchoolNameChange = useCallback(
    (value: string) => {
      updateDraftBatch({
        schoolName: value,
        schoolType: draft.schoolType || generateSubdomain(value),
      });
    },
    [draft.schoolType, updateDraftBatch]
  );

  // ── Mark step as completed when required fields are filled ──
  useEffect(() => {
    if (draft.schoolName.trim() && draft.schoolEmail.trim() && draft.schoolBoard) {
      if (!draft.completedSteps.includes(1)) {
        completeStep(1);
      }
    }
  }, [draft.schoolName, draft.schoolEmail, draft.schoolBoard, draft.completedSteps, completeStep]);

  // ── Handle theme selection ──
  const handleThemeSelect = useCallback(
    (themeId: string) => {
      updateDraft('schoolLogo', themeId);
      toast.success(`${THEMES.find((t) => t.id === themeId)?.label} theme selected!`);
    },
    [updateDraft]
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* ── Step Header ── */}
      <motion.div variants={itemVariants} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center text-2xl shadow-sm">
            🏫
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] font-[var(--font-primary)]">
              School Profile
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Tell us about your school — name, contact details, and board
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Basic Info Card ── */}
      <PreOneCard variant="default" className="mb-4">
        <PreOneCardContent>
          <motion.div variants={itemVariants} className="space-y-5">
            <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <span className="text-lg">📋</span> Basic Information
            </h3>

            {/* School Name */}
            <div>
              <label htmlFor="schoolName" className={LABEL_CLASS}>
                School Name <span className="text-red-500">*</span>
              </label>
              <input
                id="schoolName"
                type="text"
                placeholder="e.g., Sunshine International School"
                value={draft.schoolName}
                onChange={(e) => handleSchoolNameChange(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            {/* School Code / Subdomain */}
            <div>
              <label htmlFor="schoolCode" className={LABEL_CLASS}>
                School Code / Subdomain
              </label>
              <div className="relative">
                <input
                  id="schoolCode"
                  type="text"
                  placeholder="Auto-generated from school name"
                  value={draft.schoolType || ''}
                  onChange={(e) => updateDraft('schoolType', e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                  className={cn(INPUT_CLASS, 'pr-40')}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-1 rounded-lg">
                  .preone.app
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1.5">
                Preview: <span className="font-medium text-[var(--preone-primary)]">{draft.schoolType || 'yourschool'}.preone.app</span>
              </p>
            </div>

            {/* Board */}
            <div>
              <label className={LABEL_CLASS}>
                Board <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {BOARDS.map((board) => (
                  <button
                    key={board.value}
                    type="button"
                    onClick={() => updateDraft('schoolBoard', board.value)}
                    className={cn(
                      'px-3 py-2.5 rounded-xl text-xs font-medium border transition-all min-h-[44px]',
                      draft.schoolBoard === board.value
                        ? 'bg-[var(--preone-primary)] text-white border-[var(--preone-primary)] shadow-md shadow-[var(--preone-primary)]/20'
                        : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-default)] hover:border-[var(--preone-primary)]/50 hover:bg-[var(--preone-primary-50)]'
                    )}
                  >
                    {board.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </PreOneCardContent>
      </PreOneCard>

      {/* ── Address Card ── */}
      <PreOneCard variant="default" className="mb-4">
        <PreOneCardContent>
          <motion.div variants={itemVariants} className="space-y-5">
            <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <span className="text-lg">📍</span> Address
            </h3>

            {/* Address Line */}
            <div>
              <label htmlFor="schoolAddress" className={LABEL_CLASS}>
                Address
              </label>
              <input
                id="schoolAddress"
                type="text"
                placeholder="Street address, area, landmark"
                value={draft.schoolAddress}
                onChange={(e) => updateDraft('schoolAddress', e.target.value)}
                className={INPUT_CLASS}
              />
            </div>

            {/* City, State, Pincode row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="city" className={LABEL_CLASS}>
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  placeholder="City"
                  value={draft.schoolWebsite || ''}
                  onChange={(e) => updateDraft('schoolWebsite', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="state" className={LABEL_CLASS}>
                  State
                </label>
                <input
                  id="state"
                  type="text"
                  placeholder="State"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="pincode" className={LABEL_CLASS}>
                  Pincode
                </label>
                <input
                  id="pincode"
                  type="text"
                  placeholder="Pincode"
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            {/* Country dropdown */}
            <div>
              <label htmlFor="country" className={LABEL_CLASS}>
                Country
              </label>
              <select
                id="country"
                className={cn(INPUT_CLASS, 'appearance-none cursor-pointer')}
                defaultValue="IN"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        </PreOneCardContent>
      </PreOneCard>

      {/* ── Contact Card ── */}
      <PreOneCard variant="default" className="mb-4">
        <PreOneCardContent>
          <motion.div variants={itemVariants} className="space-y-5">
            <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <span className="text-lg">📞</span> Contact Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <label htmlFor="schoolPhone" className={LABEL_CLASS}>
                  Phone
                </label>
                <input
                  id="schoolPhone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={draft.schoolPhone}
                  onChange={(e) => updateDraft('schoolPhone', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="schoolEmail" className={LABEL_CLASS}>
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="schoolEmail"
                  type="email"
                  placeholder="admin@school.com"
                  value={draft.schoolEmail}
                  onChange={(e) => updateDraft('schoolEmail', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <label htmlFor="schoolWebsiteInput" className={LABEL_CLASS}>
                Website
              </label>
              <input
                id="schoolWebsiteInput"
                type="url"
                placeholder="https://www.yourschool.com"
                className={INPUT_CLASS}
              />
            </div>
          </motion.div>
        </PreOneCardContent>
      </PreOneCard>

      {/* ── Theme Picker Card ── */}
      <PreOneCard variant="default" className="mb-4">
        <PreOneCardContent>
          <motion.div variants={itemVariants} className="space-y-5">
            <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <span className="text-lg">🎨</span> Choose a Theme
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Pick a fun theme for your school app — parents and kids will love it!
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {THEMES.map((theme) => {
                const isSelected = draft.schoolLogo === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleThemeSelect(theme.id)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all min-h-[44px]',
                      isSelected
                        ? 'border-[var(--preone-primary)] shadow-lg shadow-[var(--preone-primary)]/20 bg-[var(--preone-primary-50)]'
                        : 'border-[var(--border-default)] hover:border-[var(--preone-primary)]/40 bg-[var(--bg-primary)]'
                    )}
                  >
                    <span className="text-2xl">{theme.icon}</span>
                    <span
                      className={cn(
                        'text-xs font-medium',
                        isSelected ? 'text-[var(--preone-primary)]' : 'text-[var(--text-secondary)]'
                      )}
                    >
                      {theme.label}
                    </span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 rounded-full bg-[var(--preone-primary)]"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </PreOneCardContent>
      </PreOneCard>
    </motion.div>
  );
}

SchoolProfileStep.displayName = 'SchoolProfileStep';

export default SchoolProfileStep;
