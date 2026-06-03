'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * StudentPlanet — A visual representation of a student as a planet
 * Used in the Hero card to show the child's "planet" with mood-based coloring.
 */

interface StudentPlanetProps {
  /** Child's first name — displayed on the planet */
  name: string;
  /** Child's photo URL — rendered as the planet surface if available */
  photo?: string | null;
  /** Current mood — affects the planet's glow color */
  mood?: string | null;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const moodColors: Record<string, string> = {
  happy: 'from-amber-300 to-yellow-400 shadow-amber-300/50',
  excited: 'from-pink-400 to-rose-500 shadow-pink-400/50',
  calm: 'from-sky-300 to-blue-400 shadow-sky-300/50',
  sad: 'from-blue-300 to-indigo-400 shadow-blue-300/50',
  tired: 'from-purple-300 to-indigo-400 shadow-purple-300/50',
  angry: 'from-red-400 to-orange-500 shadow-red-400/50',
  peaceful: 'from-emerald-300 to-teal-400 shadow-emerald-300/50',
};

const sizeMap = {
  sm: 'h-16 w-16 text-lg',
  md: 'h-24 w-24 text-xl',
  lg: 'h-32 w-32 text-2xl',
};

const ringSizeMap = {
  sm: 'h-20 w-20',
  md: 'h-28 w-28',
  lg: 'h-36 w-36',
};

function getMoodGradient(mood: string | null | undefined): string {
  if (!mood) return 'from-sky-400 to-blue-500 shadow-sky-400/40';
  const m = mood.toLowerCase();
  for (const [key, gradient] of Object.entries(moodColors)) {
    if (m.includes(key)) return gradient;
  }
  return 'from-sky-400 to-blue-500 shadow-sky-400/40';
}

export function StudentPlanet({
  name,
  photo,
  mood,
  size = 'md',
  className,
}: StudentPlanetProps) {
  const gradient = getMoodGradient(mood);
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      {/* Orbital ring */}
      <div
        className={cn(
          'absolute rounded-full border-2 border-dashed border-white/20',
          ringSizeMap[size]
        )}
        style={{ animation: 'planet-orbit 15s linear infinite' }}
      />

      {/* Glow halo */}
      <div
        className={cn(
          'absolute rounded-full bg-gradient-to-br blur-md',
          sizeMap[size],
          gradient
        )}
      />

      {/* Planet body */}
      <div
        className={cn(
          'relative rounded-full bg-gradient-to-br shadow-lg flex items-center justify-center overflow-hidden',
          sizeMap[size],
          gradient
        )}
      >
        {photo ? (
          <img
            src={photo}
            alt={name}
            className="h-full w-full object-cover rounded-full"
          />
        ) : (
          <span className="font-bold text-white drop-shadow-md">{initials}</span>
        )}
      </div>

      {/* Orbiting star */}
      <div
        className="absolute text-sm"
        style={{
          animation: 'planet-star 8s ease-in-out infinite',
          top: '-4px',
          right: '-4px',
        }}
      >
        ⭐
      </div>

      <style jsx global>{`
        @keyframes planet-orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes planet-star {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 1; }
          50% { transform: translate(2px, -4px) scale(1.2); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
