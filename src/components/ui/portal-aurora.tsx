'use client';

import React, { createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

// ── Portal Types ──
type PortalType = 'admin' | 'teacher' | 'parent';

// ── Aurora Portal Context ──
const AuroraPortalContext = createContext<PortalType>('admin');

/**
 * Hook to get the current portal context for Aurora styling.
 */
export function useAuroraPortal(): PortalType {
  return useContext(AuroraPortalContext);
}

/**
 * Provider component to set portal context for nested Aurora backgrounds.
 */
export function AuroraPortalProvider({
  portal,
  children,
}: {
  portal: PortalType;
  children: React.ReactNode;
}) {
  return (
    <AuroraPortalContext.Provider value={portal}>
      {children}
    </AuroraPortalContext.Provider>
  );
}

// ── Portal Color Configurations ──
const PORTAL_AURORA_CONFIG: Record<PortalType, {
  blob1: { light: string; dark: string };
  blob2: { light: string; dark: string };
  blob3: { light: string; dark: string };
}> = {
  admin: {
    // Purple/Violet - Admin Portal
    blob1: {
      light: 'from-purple-300 via-violet-200 to-indigo-200',
      dark: 'from-violet-500/40 via-purple-400/30 to-indigo-500/20',
    },
    blob2: {
      light: 'from-pink-300 via-rose-200 to-purple-200',
      dark: 'from-rose-500/30 via-pink-400/25 to-violet-500/15',
    },
    blob3: {
      light: 'from-indigo-200 via-blue-200 to-purple-200',
      dark: 'from-indigo-500/25 via-violet-400/20 to-purple-500/15',
    },
  },
  teacher: {
    // Emerald/Teal - Teacher Portal
    blob1: {
      light: 'from-emerald-300 via-teal-200 to-green-200',
      dark: 'from-emerald-500/40 via-teal-400/30 to-green-500/20',
    },
    blob2: {
      light: 'from-teal-300 via-cyan-200 to-emerald-200',
      dark: 'from-teal-500/30 via-cyan-400/25 to-emerald-500/15',
    },
    blob3: {
      light: 'from-green-200 via-lime-200 to-teal-200',
      dark: 'from-green-500/25 via-lime-400/20 to-teal-500/15',
    },
  },
  parent: {
    // Sky/Blue - Parent Portal
    blob1: {
      light: 'from-sky-300 via-blue-200 to-cyan-200',
      dark: 'from-sky-500/40 via-blue-400/30 to-cyan-500/20',
    },
    blob2: {
      light: 'from-cyan-300 via-teal-200 to-sky-200',
      dark: 'from-cyan-500/30 via-teal-400/25 to-sky-500/15',
    },
    blob3: {
      light: 'from-blue-200 via-indigo-200 to-sky-200',
      dark: 'from-blue-500/25 via-indigo-400/20 to-sky-500/15',
    },
  },
};

// ── Animation Configurations ──
const AURORA_ANIMATIONS = {
  blob1: {
    keyframes: 'portal-aurora-float-1',
    duration: '20s',
  },
  blob2: {
    keyframes: 'portal-aurora-float-2',
    duration: '25s',
  },
  blob3: {
    keyframes: 'portal-aurora-float-3',
    duration: '18s',
  },
};

// ── Intensity Opacity Map ──
const INTENSITY_MAP = {
  subtle: 'opacity-20 dark:opacity-30',
  medium: 'opacity-35 dark:opacity-50',
  vibrant: 'opacity-50 dark:opacity-70',
};

/**
 * PortalAuroraBackground — Portal-colored ambient background
 * 
 * Renders animated gradient blobs that float gently behind content.
 * Each portal has unique color palettes:
 * - Admin: Purple/Violet/Indigo gradients
 * - Teacher: Emerald/Teal/Green gradients
 * - Parent: Sky/Blue/Cyan gradients
 * 
 * Features:
 * - GPU-accelerated animations (transform + opacity only)
 * - Portal-aware color palettes
 * - Configurable intensity levels
 * - Responsive to dark mode
 */
export function PortalAuroraBackground({
  children,
  className,
  intensity = 'subtle',
  portal,
  enableAnimations = true,
}: {
  children: React.ReactNode;
  className?: string;
  /** How visible the aurora effect is */
  intensity?: 'subtle' | 'medium' | 'vibrant';
  /** Portal override - defaults to context value */
  portal?: PortalType;
  /** Enable/disable animations for performance */
  enableAnimations?: boolean;
}) {
  const contextPortal = useAuroraPortal();
  const activePortal = portal || contextPortal;
  const config = PORTAL_AURORA_CONFIG[activePortal];

  return (
    <div className={cn('relative min-h-0 flex-1', className)}>
      {/* Aurora layer — fixed behind content */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 overflow-hidden',
          INTENSITY_MAP[intensity]
        )}
        aria-hidden="true"
      >
        {/* Blob 1 — Top-left: Portal Primary */}
        <div
          className={cn(
            'absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full blur-3xl',
            'bg-gradient-to-br',
            config.blob1.light,
            'dark:bg-gradient-to-br',
            config.blob1.dark
          )}
          style={{
            animation: enableAnimations
              ? `${AURORA_ANIMATIONS.blob1.keyframes} ${AURORA_ANIMATIONS.blob1.duration} ease-in-out infinite`
              : 'none',
          }}
        />
        
        {/* Blob 2 — Bottom-right: Portal Secondary */}
        <div
          className={cn(
            'absolute -right-32 -bottom-32 h-[400px] w-[400px] rounded-full blur-3xl',
            'bg-gradient-to-tl',
            config.blob2.light,
            'dark:bg-gradient-to-tl',
            config.blob2.dark
          )}
          style={{
            animation: enableAnimations
              ? `${AURORA_ANIMATIONS.blob2.keyframes} ${AURORA_ANIMATIONS.blob2.duration} ease-in-out infinite`
              : 'none',
          }}
        />
        
        {/* Blob 3 — Center: Portal Accent */}
        <div
          className={cn(
            'absolute top-1/2 left-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl',
            'bg-gradient-to-br',
            config.blob3.light,
            'dark:bg-gradient-to-br',
            config.blob3.dark
          )}
          style={{
            animation: enableAnimations
              ? `${AURORA_ANIMATIONS.blob3.keyframes} ${AURORA_ANIMATIONS.blob3.duration} ease-in-out infinite`
              : 'none',
          }}
        />
      </div>

      {/* Content above aurora */}
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  );
}

/**
 * PortalAuroraStyles — CSS keyframes for portal aurora animations
 * 
 * Inject these styles once in your layout or use the global styles.
 * GPU-optimized: only uses transform and opacity for smooth 60fps.
 */
export function PortalAuroraStyles() {
  return (
    <style jsx global>{`
      @keyframes portal-aurora-float-1 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(40px, -30px) scale(1.05); }
        66% { transform: translate(-20px, 20px) scale(0.95); }
      }
      @keyframes portal-aurora-float-2 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(-30px, 25px) scale(1.08); }
        66% { transform: translate(25px, -15px) scale(0.93); }
      }
      @keyframes portal-aurora-float-3 {
        0%, 100% { transform: translate(-50%, -50%) scale(1); }
        33% { transform: translate(calc(-50% + 20px), calc(-50% - 20px)) scale(1.1); }
        66% { transform: translate(calc(-50% - 15px), calc(-50% + 15px)) scale(0.9); }
      }
    `}</style>
  );
}

// Export all
export { PORTAL_AURORA_CONFIG, AURORA_ANIMATIONS };