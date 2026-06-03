'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * EmotionalTimeline — Instagram Stories-style day timeline
 * Shows moments from the child's day as circular story-like items.
 */

export interface TimelineMoment {
  /** Unique ID */
  id: string;
  /** Time label, e.g. "8:30 AM" */
  time: string;
  /** Title, e.g. "Morning Check-in" */
  title: string;
  /** Emoji representing the moment */
  emoji: string;
  /** Optional photo URL */
  photo?: string | null;
  /** Optional short description */
  description?: string;
}

interface EmotionalTimelineProps {
  /** Timeline moments to render */
  moments: TimelineMoment[];
  className?: string;
}

export function EmotionalTimeline({
  moments,
  className,
}: EmotionalTimelineProps) {
  if (!moments || moments.length === 0) {
    return (
      <div className={cn('text-center py-8', className)}>
        <p className="text-4xl mb-2">🌅</p>
        <p className="text-sm text-muted-foreground">
          Today&apos;s story is still unfolding...
        </p>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      {/* Stories-style circles row */}
      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none">
        {moments.map((moment, index) => (
          <button
            key={moment.id}
            className="flex flex-col items-center gap-1.5 shrink-0 group"
            title={`${moment.time} — ${moment.title}`}
          >
            {/* Circle with gradient ring */}
            <div
              className={cn(
                'relative rounded-full p-[3px]',
                'bg-gradient-to-br from-purple-500 via-sky-500 to-pink-500',
                'group-hover:scale-105 transition-transform'
              )}
            >
              <div
                className={cn(
                  'rounded-full flex items-center justify-center',
                  'bg-white dark:bg-gray-900',
                  moment.photo ? 'h-16 w-16' : 'h-16 w-16'
                )}
              >
                {moment.photo ? (
                  <img
                    src={moment.photo}
                    alt={moment.title}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">{moment.emoji}</span>
                )}
              </div>
            </div>
            {/* Time label */}
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              {moment.time}
            </span>
          </button>
        ))}
      </div>

      {/* Vertical timeline detail */}
      <div className="mt-4 space-y-3">
        {moments.map((moment, index) => (
          <div
            key={`detail-${moment.id}`}
            className="flex items-start gap-3 group"
          >
            {/* Timeline connector */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm',
                  'bg-gradient-to-br from-sky-100 to-purple-100 dark:from-sky-900/40 dark:to-purple-900/40',
                  'group-hover:from-sky-200 group-hover:to-purple-200 dark:group-hover:from-sky-800/60 dark:group-hover:to-purple-800/60',
                  'transition-colors'
                )}
              >
                {moment.emoji}
              </div>
              {index < moments.length - 1 && (
                <div className="w-px h-4 bg-gradient-to-b from-purple-300/40 to-transparent" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-2">
              <div className="flex items-baseline gap-2">
                <p className="text-sm font-medium">{moment.title}</p>
                <span className="text-[10px] text-muted-foreground">
                  {moment.time}
                </span>
              </div>
              {moment.description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {moment.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
