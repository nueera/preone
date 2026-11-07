'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { createContext, useContext } from 'react';

// ── Portal Types ──
type PortalType = 'admin' | 'teacher' | 'parent';

// ── Gradient Border Portal Context ──
const GradientBorderPortalContext = createContext<PortalType>('admin');

/**
 * Hook to get the current portal context for gradient border styling.
 */
export function useGradientBorderPortal(): PortalType {
  return useContext(GradientBorderPortalContext);
}

/**
 * Provider component to set portal context for nested gradient borders.
 */
export function GradientBorderPortalProvider({
  portal,
  children,
}: {
  portal: PortalType;
  children: React.ReactNode;
}) {
  return (
    <GradientBorderPortalContext.Provider value={portal}>
      {children}
    </GradientBorderPortalContext.Provider>
  );
}

// ── Portal Gradient Configurations ──
const PORTAL_GRADIENT_CONFIG: Record<PortalType, {
  colors: string[];
  darkColors: string[];
}> = {
  admin: {
    // Purple/Violet gradient - Admin Portal
    colors: ['#7C3AED', '#8B5CF6', '#A78BFA', '#6D28D9', '#7C3AED'],
    darkColors: ['#A78BFA', '#C4B5FD', '#8B5CF6', '#9333EA', '#A78BFA'],
  },
  teacher: {
    // Emerald/Teal gradient - Teacher Portal
    colors: ['#10B981', '#34D399', '#6EE7B7', '#059669', '#10B981'],
    darkColors: ['#34D399', '#6EE7B7', '#10B981', '#047857', '#34D399'],
  },
  parent: {
    // Sky/Blue gradient - Parent Portal
    colors: ['#0EA5E9', '#38BDF8', '#7DD3FC', '#0284C7', '#0EA5E9'],
    darkColors: ['#38BDF8', '#7DD3FC', '#0EA5E9', '#0369A1', '#38BDF8'],
  },
};

// ── Animation Speed Configurations ──
const ANIMATION_SPEEDS = {
  slow: { duration: '8s', delay: '-4s' },
  medium: { duration: '4s', delay: '-2s' },
  fast: { duration: '2s', delay: '-1s' },
  veryFast: { duration: '1s', delay: '-0.5s' },
};

/**
 * AnimatedGradientBorder — Portal-colored animated gradient border wrapper
 * 
 * Features:
 * - Smooth rotating gradient animation (GPU-optimized)
 * - Portal-specific color palettes
 * - Multiple animation speeds
 * - Customizable border width
 * - Responsive to dark mode
 * - Inner content stays static while border animates
 * 
 * Animation technique:
 * Uses CSS conic-gradient with animation rotation.
 * Only uses transform: rotate() for GPU acceleration.
 * 
 * Usage:
 * ```tsx
 * <AnimatedGradientBorder portal="admin" speed="medium">
 *   <YourCard />
 * </AnimatedGradientBorder>
 * ```
 */
export interface AnimatedGradientBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Portal override - defaults to context value */
  portal?: PortalType;
  /** Animation speed */
  speed?: 'slow' | 'medium' | 'fast' | 'veryFast';
  /** Border width in pixels */
  borderWidth?: number;
  /** Enable hover pause animation */
  pauseOnHover?: boolean;
  /** Rounded corners variant */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  /** Enable glow effect around border */
  glow?: boolean;
  /** Glow intensity */
  glowIntensity?: 'subtle' | 'medium' | 'strong';
}

const ROUNDED_CLASSES = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
};

const GLOW_INTENSITY = {
  subtle: 'opacity-30',
  medium: 'opacity-50',
  strong: 'opacity-70',
};

export function AnimatedGradientBorder({
  children,
  className,
  portal,
  speed = 'medium',
  borderWidth = 2,
  pauseOnHover = false,
  rounded = '3xl',
  glow = false,
  glowIntensity = 'medium',
  style,
  ...props
}: AnimatedGradientBorderProps) {
  const contextPortal = useGradientBorderPortal();
  const activePortal = portal || contextPortal;
  const config = PORTAL_GRADIENT_CONFIG[activePortal];
  const speedConfig = ANIMATION_SPEEDS[speed];
  const roundedClass = ROUNDED_CLASSES[rounded];

  // Build gradient color string
  const gradientColors = config.colors.join(', ');
  const darkGradientColors = config.darkColors.join(', ');

  return (
    <div
      data-slot="animated-gradient-border"
      data-portal={activePortal}
      className={cn(
        'relative p-[2px] group',
        roundedClass,
        className
      )}
      style={{
        ...style,
      }}
      {...props}
    >
      {/* Animated Gradient Border */}
      <div
        className={cn(
          'absolute inset-0',
          roundedClass,
          'animated-gradient-border-bg',
          pauseOnHover && 'group-hover:[animation-play-state:paused]'
        )}
        style={{
          background: `conic-gradient(from var(--gradient-angle, 0deg), ${gradientColors})`,
          animationDuration: speedConfig.duration,
          animationDelay: speedConfig.delay,
        }}
        aria-hidden="true"
      />

      {/* Glow Effect */}
      {glow && (
        <div
          className={cn(
            'absolute -inset-1',
            roundedClass,
            'blur-md',
            GLOW_INTENSITY[glowIntensity],
            'animated-gradient-border-bg',
            pauseOnHover && 'group-hover:[animation-play-state:paused]'
          )}
          style={{
            background: `conic-gradient(from var(--gradient-angle, 0deg), ${gradientColors})`,
            animationDuration: speedConfig.duration,
            animationDelay: speedConfig.delay,
          }}
          aria-hidden="true"
        />
      )}

      {/* Dark mode gradient override */}
      <div
        className={cn(
          'absolute inset-0',
          roundedClass,
          'animated-gradient-border-bg hidden dark:block',
          pauseOnHover && 'group-hover:[animation-play-state:paused]'
        )}
        style={{
          background: `conic-gradient(from var(--gradient-angle, 0deg), ${darkGradientColors})`,
          animationDuration: speedConfig.duration,
          animationDelay: speedConfig.delay,
        }}
        aria-hidden="true"
      />

      {/* Inner Content Container */}
      <div
        className={cn(
          'relative bg-white dark:bg-slate-900',
          roundedClass,
          'overflow-hidden'
        )}
        style={{
          margin: borderWidth,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * AnimatedGradientBorderStyles — CSS animations for gradient borders
 * 
 * Uses CSS custom property (@property) for smooth gradient rotation.
 * This is the modern, GPU-optimized approach.
 */
export function AnimatedGradientBorderStyles() {
  return (
    <style jsx global>{`
      @property --gradient-angle {
        syntax: '<angle>';
        initial-value: 0deg;
        inherits: false;
      }

      .animated-gradient-border-bg {
        animation: gradient-rotate var(--animation-duration, 4s) linear infinite;
      }

      @keyframes gradient-rotate {
        0% { --gradient-angle: 0deg; }
        100% { --gradient-angle: 360deg; }
      }
    `}</style>
  );
}

/**
 * GradientBorderWrapper — Simple gradient border without animation
 * 
 * Useful for static gradient borders with portal colors.
 */
export function GradientBorderWrapper({
  children,
  className,
  portal,
  borderWidth = 2,
  rounded = '3xl',
  style,
  ...props
}: AnimatedGradientBorderProps) {
  const contextPortal = useGradientBorderPortal();
  const activePortal = portal || contextPortal;
  const config = PORTAL_GRADIENT_CONFIG[activePortal];
  const roundedClass = ROUNDED_CLASSES[rounded];

  // Build linear gradient for static border
  const gradientColors = config.colors.join(', ');

  return (
    <div
      data-slot="gradient-border-wrapper"
      data-portal={activePortal}
      className={cn(
        'relative',
        roundedClass,
        className
      )}
      style={{
        padding: borderWidth,
        background: `linear-gradient(135deg, ${gradientColors})`,
        ...style,
      }}
      {...props}
    >
      <div
        className={cn(
          'bg-white dark:bg-slate-900',
          roundedClass,
          'h-full'
        )}
      >
        {children}
      </div>
    </div>
  );
}

// Export all
export { PORTAL_GRADIENT_CONFIG, ANIMATION_SPEEDS };