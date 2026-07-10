'use client';

/**
 * Warm Premium line-art SVG illustrations.
 * Single-color, sophisticated line drawings — preschool-themed but not childish.
 * Used in EmptyState components and onboarding moments.
 *
 * Strokes use currentColor so the parent can tint via text color.
 */

import React from 'react';

type IllustrationProps = {
  className?: string;
  /** Stroke width — default 1.5 for premium feel */
  strokeWidth?: number;
};

// ── Seedling — growth, new leads, "your first family is just around the corner" ──
export function WarmSeedling({ className, strokeWidth = 1.5 }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M60 100 V60" />
      <path d="M60 70 C 50 70, 38 64, 38 50 C 50 50, 60 56, 60 70 Z" />
      <path d="M60 64 C 70 64, 82 58, 82 44 C 70 44, 60 50, 60 64 Z" />
      <path d="M40 100 H 80" />
      <path d="M44 100 C 44 92, 50 88, 60 88 C 70 88, 76 92, 76 100" />
      <circle cx="60" cy="34" r="3" />
      <path d="M60 28 V 20" />
      <path d="M52 24 L 48 20" />
      <path d="M68 24 L 72 20" />
    </svg>
  );
}

// ── Open book — leads, enquiries, knowledge ──
export function WarmBook({ className, strokeWidth = 1.5 }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M60 40 C 50 34, 36 32, 24 34 V 88 C 36 86, 50 88, 60 94" />
      <path d="M60 40 C 70 34, 84 32, 96 34 V 88 C 84 86, 70 88, 60 94" />
      <path d="M60 40 V 94" />
      <path d="M32 46 H 52" />
      <path d="M32 54 H 52" />
      <path d="M32 62 H 48" />
      <path d="M68 46 H 88" />
      <path d="M68 54 H 88" />
      <path d="M68 62 H 84" />
    </svg>
  );
}

// ── Calendar with check — visits, follow-ups ──
export function WarmCalendarCheck({ className, strokeWidth = 1.5 }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="20" y="32" width="80" height="68" rx="8" />
      <path d="M20 50 H 100" />
      <path d="M40 24 V 40" />
      <path d="M80 24 V 40" />
      <path d="M44 72 L 56 84 L 80 60" />
    </svg>
  );
}

// ── Magnifying glass — search, no results ──
export function WarmSearch({ className, strokeWidth = 1.5 }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="52" cy="52" r="28" />
      <path d="M72 72 L 96 96" />
      <path d="M40 52 H 64" />
      <path d="M52 40 V 64" />
    </svg>
  );
}

// ── Pencil & paper — tasks, notes ──
export function WarmPencil({ className, strokeWidth = 1.5 }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M28 92 L 30 78 L 78 30 L 90 42 L 42 90 Z" />
      <path d="M70 38 L 82 50" />
      <path d="M28 92 L 36 88" />
      <path d="M30 78 L 38 86" />
    </svg>
  );
}

// ── Puzzle pieces — pipeline, kanban ──
export function WarmPuzzle({ className, strokeWidth = 1.5 }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M24 24 H 52 C 52 32, 60 32, 60 24 H 88 V 52 C 80 52, 80 60, 88 60 V 88 H 60 C 60 80, 52 80, 52 88 H 24 V 60 C 32 60, 32 52, 24 52 Z" />
    </svg>
  );
}

// ── Phone — follow-ups, calls ──
export function WarmPhone({ className, strokeWidth = 1.5 }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M40 30 C 40 28, 42 26, 44 26 H 56 C 58 26, 60 28, 60 30 V 48 C 60 50, 58 52, 56 52 H 52 C 50 70, 70 90, 88 88 V 84 C 88 82, 90 80, 92 80 H 110 C 112 80, 114 82, 114 84 V 96 C 114 98, 112 100, 110 100 C 60 100, 20 60, 20 10 C 20 8, 22 6, 24 6 H 36 C 38 6, 40 8, 40 10 Z" transform="scale(0.78) translate(14, 14)" />
    </svg>
  );
}

// ── Children holding hands — community, families ──
export function WarmChildren({ className, strokeWidth = 1.5 }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 140 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="40" cy="36" r="10" />
      <circle cx="70" cy="32" r="11" />
      <circle cx="100" cy="36" r="10" />
      <path d="M28 96 V 70 C 28 62, 34 58, 40 58 C 46 58, 52 62, 52 70 V 96" />
      <path d="M58 96 V 68 C 58 60, 64 55, 70 55 C 76 55, 82 60, 82 68 V 96" />
      <path d="M88 96 V 70 C 88 62, 94 58, 100 58 C 106 58, 112 62, 112 70 V 96" />
      <path d="M52 78 H 58" />
      <path d="M82 78 H 88" />
      <path d="M30 96 H 50" />
      <path d="M60 96 H 80" />
      <path d="M90 96 H 110" />
    </svg>
  );
}

// ── Map / journey path — lead detail timeline ──
export function WarmJourney({ className, strokeWidth = 1.5 }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 140 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 90 C 30 90, 30 50, 50 50 C 70 50, 70 80, 90 80 C 110 80, 110 30, 120 30" strokeDasharray="4 4" />
      <circle cx="20" cy="90" r="4" />
      <circle cx="50" cy="50" r="4" />
      <circle cx="90" cy="80" r="4" />
      <circle cx="120" cy="30" r="5" />
      <path d="M115 26 L 120 30 L 115 34" />
    </svg>
  );
}

// ── Sparkle — celebration, lead converted ──
export function WarmSparkle({ className, strokeWidth = 1.5 }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M60 20 L 66 50 L 96 56 L 66 62 L 60 92 L 54 62 L 24 56 L 54 50 Z" />
      <path d="M96 28 L 98 36 L 106 38 L 98 40 L 96 48 L 94 40 L 86 38 L 94 36 Z" />
    </svg>
  );
}

// ── Decorative: warm scribble underline for headings ──
export function WarmScribble({ className, strokeWidth = 2 }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path d="M4 8 C 40 2, 80 10, 120 6 C 160 2, 180 8, 196 6" />
    </svg>
  );
}
