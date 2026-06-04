'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Bell, Clock, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnboardingStore } from '@/lib/stores/onboarding-store';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';

interface CategoryOption {
  id: string;
  label: string;
  icon: string;
  description: string;
  defaultOn: boolean;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'attendance', label: 'Attendance', icon: '✅', description: 'Daily check-in/out status', defaultOn: true },
  { id: 'mood', label: 'Mood', icon: '😊', description: 'How the child is feeling', defaultOn: false },
  { id: 'activities', label: 'Activities', icon: '🎨', description: 'Learning activities & play', defaultOn: false },
  { id: 'meals', label: 'Meals', icon: '🍽️', description: 'Meal details & nutrition info', defaultOn: false },
  { id: 'nap', label: 'Nap', icon: '😴', description: 'Nap time & duration', defaultOn: false },
  { id: 'photos', label: 'Photos', icon: '📸', description: 'Daily photos & moments', defaultOn: false },
  { id: 'teacher_notes', label: 'Teacher Notes', icon: '💬', description: 'Personal notes from teachers', defaultOn: false },
];

interface FrequencyOption {
  id: string;
  label: string;
  icon: string;
  description: string;
}

const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { id: 'realtime', label: 'Real-time', icon: '⚡', description: 'Instant notifications as events happen' },
  { id: 'hourly', label: 'Hourly', icon: '🕐', description: 'Summary every hour during school hours' },
  { id: 'end_of_day', label: 'End of Day', icon: '🌆', description: 'Complete summary at the end of the day' },
];

interface ChannelOption {
  id: string;
  label: string;
  icon: string;
  defaultOn: boolean;
}

const CHANNEL_OPTIONS: ChannelOption[] = [
  { id: 'app', label: 'App', icon: '📱', defaultOn: true },
  { id: 'email', label: 'Email', icon: '📧', defaultOn: true },
  { id: 'sms', label: 'SMS', icon: '💬', defaultOn: false },
  { id: 'whatsapp', label: 'WhatsApp', icon: '📲', defaultOn: false },
];

export function DailyUpdatesStep() {
  const { draft, updateDraftBatch, completeStep } = useOnboardingStore();

  // Initialize categories from draft or defaults
  const [enabledCategories, setEnabledCategories] = useState<Set<string>>(() => {
    if (draft.updateCategories.length > 0) {
      return new Set(draft.updateCategories);
    }
    return new Set(CATEGORIES.filter((c) => c.defaultOn).map((c) => c.id));
  });

  const [frequency, setFrequency] = useState<string>('end_of_day');
  const [endTime, setEndTime] = useState('17:00');
  const [channels, setChannels] = useState<Set<string>>(() => new Set(
    CHANNEL_OPTIONS.filter((c) => c.defaultOn).map((c) => c.id)
  ));

  // Sync to store on changes
  useEffect(() => {
    updateDraftBatch({
      dailyUpdatesEnabled: enabledCategories.size > 0,
      updateCategories: Array.from(enabledCategories),
    });
  }, [enabledCategories, updateDraftBatch]);

  const toggleCategory = (id: string) => {
    setEnabledCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleChannel = (id: string) => {
    setChannels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleContinue = () => {
    updateDraftBatch({
      dailyUpdatesEnabled: enabledCategories.size > 0,
      updateCategories: Array.from(enabledCategories),
    });
    completeStep(7);
    toast.success('Daily update preferences saved!');
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
          📱 Daily Updates
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Choose what information to share with parents throughout the day
        </p>
      </motion.div>

      {/* What to share with parents */}
      <PreOneCard variant="default">
        <PreOneCardContent>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[var(--preone-primary)]" />
            What to share with parents
          </h3>

          <div className="space-y-2">
            {CATEGORIES.map((category) => {
              const isEnabled = enabledCategories.has(category.id);

              return (
                <div
                  key={category.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl transition-all',
                    isEnabled
                      ? 'bg-[var(--preone-primary-50)] border border-[var(--preone-primary)]/20'
                      : 'bg-[var(--bg-secondary)] border border-transparent hover:border-[var(--border-default)]'
                  )}
                >
                  {/* Icon */}
                  <span className="text-xl flex-shrink-0" role="img" aria-hidden="true">
                    {category.icon}
                  </span>

                  {/* Label & Description */}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm font-medium',
                      isEnabled ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                    )}>
                      {category.label}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{category.description}</p>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isEnabled}
                    aria-label={`Toggle ${category.label}`}
                    onClick={() => toggleCategory(category.id)}
                    className={cn(
                      'relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center',
                      isEnabled
                        ? 'bg-[var(--preone-primary)]'
                        : 'bg-[var(--border-default)]'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 top-0.5',
                        isEnabled ? 'left-[22px]' : 'left-0.5'
                      )}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </PreOneCardContent>
      </PreOneCard>

      {/* When to send */}
      <PreOneCard variant="default">
        <PreOneCardContent>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--preone-primary)]" />
            When to send
          </h3>

          <div className="space-y-2">
            {FREQUENCY_OPTIONS.map((option) => {
              const isSelected = frequency === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFrequency(option.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left',
                    isSelected
                      ? 'bg-[var(--preone-primary-50)] border-2 border-[var(--preone-primary)]'
                      : 'bg-[var(--bg-secondary)] border-2 border-transparent hover:border-[var(--border-default)]'
                  )}
                >
                  {/* Radio indicator */}
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                      isSelected
                        ? 'border-[var(--preone-primary)]'
                        : 'border-[var(--border-default)]'
                    )}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[var(--preone-primary)]" />
                    )}
                  </div>

                  {/* Icon */}
                  <span className="text-xl flex-shrink-0" role="img" aria-hidden="true">
                    {option.icon}
                  </span>

                  {/* Label & Description */}
                  <div className="flex-1">
                    <p className={cn(
                      'text-sm font-medium',
                      isSelected ? 'text-[var(--preone-primary)]' : 'text-[var(--text-primary)]'
                    )}>
                      {option.label}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{option.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Time picker for End of Day */}
          {frequency === 'end_of_day' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 flex items-center gap-3"
            >
              <label className="text-sm font-medium text-[var(--text-primary)]">Send at:</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--preone-primary)] focus:border-transparent outline-none transition-all"
              />
            </motion.div>
          )}
        </PreOneCardContent>
      </PreOneCard>

      {/* Notify parents via */}
      <PreOneCard variant="default">
        <PreOneCardContent>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <Send className="w-5 h-5 text-[var(--preone-primary)]" />
            Notify parents via
          </h3>

          <div className="flex flex-wrap gap-3">
            {CHANNEL_OPTIONS.map((channel) => {
              const isSelected = channels.has(channel.id);

              return (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => toggleChannel(channel.id)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm font-medium min-h-[44px]',
                    isSelected
                      ? 'bg-[var(--preone-primary)] text-white shadow-md shadow-[var(--preone-primary)]/25'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:border-[var(--preone-primary)]/50'
                  )}
                >
                  <span className="text-lg" role="img" aria-hidden="true">
                    {channel.icon}
                  </span>
                  {channel.label}
                </button>
              );
            })}
          </div>

          {channels.size === 0 && (
            <p className="mt-2 text-xs text-amber-500">
              Please select at least one notification channel
            </p>
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

DailyUpdatesStep.displayName = 'DailyUpdatesStep';

export default DailyUpdatesStep;
