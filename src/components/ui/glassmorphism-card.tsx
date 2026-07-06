'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { createContext, useContext } from 'react';

// ── Portal Types ──
type PortalType = 'admin' | 'teacher' | 'parent';

// ── Glass Portal Context ──
const GlassPortalContext = createContext<PortalType>('admin');

/**
 * Hook to get the current portal context for glass card styling.
 */
export function useGlassPortal(): PortalType {
  return useContext(GlassPortalContext);
}

/**
 * Provider component to set portal context for nested glass cards.
 */
export function GlassPortalProvider({
  portal,
  children,
}: {
  portal: PortalType;
  children: React.ReactNode;
}) {
  return (
    <GlassPortalContext.Provider value={portal}>
      {children}
    </GlassPortalContext.Provider>
  );
}

// ── Portal Glass Token Configurations ──
const PORTAL_GLASS_CONFIG: Record<PortalType, {
  primarySoft: string;
  border: string;
  gradientFrom: string;
  gradientTo: string;
  darkPrimarySoft: string;
  darkBorder: string;
  darkGradientFrom: string;
  darkGradientTo: string;
}> = {
  admin: {
    primarySoft: 'var(--admin-primary-soft)',
    border: 'var(--admin-border)',
    gradientFrom: 'rgba(124, 58, 237, 0.08)',
    gradientTo: 'rgba(139, 92, 246, 0.04)',
    darkPrimarySoft: 'rgba(167,139,250,0.15)',
    darkBorder: 'rgba(255,255,255,0.1)',
    darkGradientFrom: 'rgba(167, 139, 250, 0.12)',
    darkGradientTo: 'rgba(139, 92, 246, 0.06)',
  },
  teacher: {
    primarySoft: 'var(--teacher-primary-soft)',
    border: 'var(--teacher-border)',
    gradientFrom: 'rgba(16, 185, 129, 0.08)',
    gradientTo: 'rgba(52, 211, 153, 0.04)',
    darkPrimarySoft: 'rgba(52,211,153,0.15)',
    darkBorder: 'rgba(255,255,255,0.1)',
    darkGradientFrom: 'rgba(52, 211, 153, 0.12)',
    darkGradientTo: 'rgba(16, 185, 129, 0.06)',
  },
  parent: {
    primarySoft: 'var(--parent-primary-soft)',
    border: 'var(--parent-border)',
    gradientFrom: 'rgba(14, 165, 233, 0.08)',
    gradientTo: 'rgba(56, 189, 248, 0.04)',
    darkPrimarySoft: 'rgba(56,189,248,0.15)',
    darkBorder: 'rgba(255,255,255,0.1)',
    darkGradientFrom: 'rgba(56, 189, 248, 0.12)',
    darkGradientTo: 'rgba(14, 165, 233, 0.06)',
  },
};

/**
 * GlassmorphismCard — Portal-aware glass effect card
 * 
 * Features:
 * - Frosted glass effect with backdrop-blur
 * - Portal-colored gradient overlays
 * - Refractive border effects
 * - GPU-accelerated hover animations
 * - Responsive to dark mode
 * 
 * Variants:
 * - subtle: Light frosted glass, minimal color
 * - medium: Balanced glass with portal color overlay
 * - vibrant: Strong glass effect with prominent portal color
 * - frosted: Heavy blur, white/opaque appearance
 * - crystalline: Ultra-light glass with subtle portal accent
 */
export interface GlassmorphismCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Portal override - defaults to context value */
  portal?: PortalType;
  /** Glass intensity variant */
  variant?: 'subtle' | 'medium' | 'vibrant' | 'frosted' | 'crystalline';
  /** Enable hover lift and glow effect */
  hover?: boolean;
  /** Enable portal-colored left accent border */
  accentBorder?: boolean;
  /** Enable gradient overlay */
  gradientOverlay?: boolean;
  /** Enable inner glow effect */
  innerGlow?: boolean;
}

const GLASS_VARIANTS = {
  subtle: {
    blur: 'backdrop-blur-sm',
    opacity: 'bg-white/50 dark:bg-slate-900/50',
    borderOpacity: 'border-white/20 dark:border-white/10',
  },
  medium: {
    blur: 'backdrop-blur-md',
    opacity: 'bg-white/60 dark:bg-slate-900/60',
    borderOpacity: 'border-white/30 dark:border-white/15',
  },
  vibrant: {
    blur: 'backdrop-blur-xl',
    opacity: 'bg-white/70 dark:bg-slate-900/70',
    borderOpacity: 'border-white/40 dark:border-white/20',
  },
  frosted: {
    blur: 'backdrop-blur-2xl',
    opacity: 'bg-white/80 dark:bg-slate-900/80',
    borderOpacity: 'border-white/50 dark:border-white/25',
  },
  crystalline: {
    blur: 'backdrop-blur-lg',
    opacity: 'bg-white/40 dark:bg-slate-900/40',
    borderOpacity: 'border-white/15 dark:border-white/8',
  },
};

export function GlassmorphismCard({
  className,
  portal,
  variant = 'medium',
  hover = false,
  accentBorder = false,
  gradientOverlay = true,
  innerGlow = false,
  children,
  ...props
}: GlassmorphismCardProps) {
  const contextPortal = useGlassPortal();
  const activePortal = portal || contextPortal;
  const config = PORTAL_GLASS_CONFIG[activePortal];
  const glassStyle = GLASS_VARIANTS[variant];

  return (
    <div
      data-slot="glassmorphism-card"
      data-portal={activePortal}
      className={cn(
        'relative rounded-3xl overflow-hidden',
        glassStyle.blur,
        glassStyle.opacity,
        'shadow-lg',
        hover && 'transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl',
        className
      )}
      style={{
        borderColor: config.border,
      }}
      {...props}
    >
      {/* Gradient Overlay */}
      {gradientOverlay && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo})`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Inner Glow */}
      {innerGlow && (
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            boxShadow: `inset 0 1px 1px 0 rgba(255,255,255,0.3)`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Portal Accent Border */}
      {accentBorder && (
        <div
          className="absolute left-0 top-4 bottom-4 w-1 rounded-full"
          style={{
            background: config.primarySoft,
          }}
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Dark mode gradient override */}
      <div
        className="absolute inset-0 pointer-events-none hidden dark:block"
        style={{
          background: `linear-gradient(135deg, ${config.darkGradientFrom}, ${config.darkGradientTo})`,
        }}
        aria-hidden="true"
      />
    </div>
  );
}

/**
 * GlassmorphismCardContent — Inner content wrapper with padding
 */
export function GlassmorphismCardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="glassmorphism-card-content"
      className={cn('p-4 sm:p-6', className)}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * GlassmorphismCardHeader — Header section with optional portal accent
 */
export function GlassmorphismCardHeader({
  className,
  children,
  showAccent = false,
  portal,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { showAccent?: boolean; portal?: PortalType }) {
  const contextPortal = useGlassPortal();
  const activePortal = portal || contextPortal;
  const config = PORTAL_GLASS_CONFIG[activePortal];

  return (
    <div
      data-slot="glassmorphism-card-header"
      className={cn(
        'px-4 sm:px-6 py-4 border-b',
        'border-white/10 dark:border-white/5',
        className
      )}
      {...props}
    >
      {showAccent && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ background: config.primarySoft }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

/**
 * GlassmorphismCardFooter — Footer section for actions
 */
export function GlassmorphismCardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="glassmorphism-card-footer"
      className={cn(
        'px-4 sm:px-6 py-4 border-t',
        'border-white/10 dark:border-white/5',
        'flex items-center justify-end gap-3',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Export all
export { PORTAL_GLASS_CONFIG, GLASS_VARIANTS };