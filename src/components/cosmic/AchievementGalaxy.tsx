'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { GROWTH_COLORS } from '@/lib/theme-tokens';

/**
 * AchievementGalaxy — Visualizes growth dimensions as orbiting skill planets
 * Each dimension (creativity, communication, etc.) is shown as a "planet"
 * with size and brightness proportional to its score.
 */

interface SkillPlanet {
  /** Dimension key, e.g. "creativity" */
  key: string;
  /** Display label */
  label: string;
  /** Score 0-100 */
  score: number;
  /** Emoji icon */
  emoji: string;
}

interface AchievementGalaxyProps {
  /** Skill planets to render */
  skills: SkillPlanet[];
  /** Overall score 0-100 */
  overallScore?: number;
  className?: string;
}

const defaultSkills: SkillPlanet[] = [];

export function AchievementGalaxy({
  skills = defaultSkills,
  overallScore,
  className,
}: AchievementGalaxyProps) {
  // Sort by score descending so the brightest planets are in center
  const sorted = [...skills].sort((a, b) => b.score - a.score);

  // Map dimension key to color
  function getColor(key: string): string {
    const colors = GROWTH_COLORS[key];
    if (colors) return colors.hex;
    return '#9ca3af'; // gray fallback
  }

  return (
    <div className={cn('relative flex flex-col items-center', className)}>
      {/* Galaxy visualization */}
      <div className="relative h-48 w-48 mx-auto">
        {/* Central star (overall score) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-300/30"
            style={{
              width: 56,
              height: 56,
              animation: 'galaxy-pulse 3s ease-in-out infinite',
            }}
          >
            <span className="text-lg font-bold text-white">
              {overallScore ?? '✨'}
            </span>
          </div>
        </div>

        {/* Orbiting skill planets */}
        {sorted.map((skill, index) => {
          const angle = (index / sorted.length) * 360;
          const radius = 60 + (index % 2) * 15; // Alternate orbit radius
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          const size = Math.max(24, 20 + (skill.score / 100) * 20); // 24-44px
          const opacity = 0.5 + (skill.score / 100) * 0.5; // 0.5-1.0

          return (
            <div
              key={skill.key}
              className="absolute flex flex-col items-center gap-0.5"
              style={{
                left: `calc(50% + ${x}px - ${size / 2}px)`,
                top: `calc(50% + ${y}px - ${size / 2}px)`,
                opacity,
                animation: `galaxy-orbit-${index % 3} ${12 + index * 3}s ease-in-out infinite`,
              }}
              title={`${skill.label}: ${skill.score}/100`}
            >
              <div
                className="rounded-full flex items-center justify-center shadow-md"
                style={{
                  width: size,
                  height: size,
                  background: `linear-gradient(135deg, ${getColor(skill.key)}, ${getColor(skill.key)}88)`,
                }}
              >
                <span className="text-xs" style={{ fontSize: Math.max(12, size * 0.4) }}>
                  {skill.emoji}
                </span>
              </div>
              <span className="text-[8px] font-medium text-muted-foreground whitespace-nowrap">
                {skill.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Skill bars below galaxy */}
      <div className="w-full mt-4 space-y-2">
        {sorted.map((skill) => {
          const colors = GROWTH_COLORS[skill.key];
          return (
            <div key={skill.key} className="flex items-center gap-2">
              <span className="text-sm shrink-0">{skill.emoji}</span>
              <span className="text-xs text-muted-foreground w-20 truncate">
                {skill.label}
              </span>
              <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${skill.score}%`,
                    backgroundColor: colors?.hex || '#9ca3af',
                  }}
                />
              </div>
              <span className="text-xs font-medium w-8 text-right">
                {skill.score}
              </span>
            </div>
          );
        })}
      </div>

      <style jsx global>{`
        @keyframes galaxy-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(251, 191, 36, 0.3); }
          50% { transform: scale(1.05); box-shadow: 0 0 30px rgba(251, 191, 36, 0.5); }
        }
        @keyframes galaxy-orbit-0 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(3px, -3px); }
        }
        @keyframes galaxy-orbit-1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-2px, 4px); }
        }
        @keyframes galaxy-orbit-2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(4px, 2px); }
        }
      `}</style>
    </div>
  );
}
