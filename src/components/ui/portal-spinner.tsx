'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { createContext, useContext } from 'react';

// ── Portal Types ──
type PortalType = 'admin' | 'teacher' | 'parent';

// ── Spinner Portal Context ──
const SpinnerPortalContext = createContext<PortalType>('admin');

/**
 * Hook to get the current portal context for spinner styling.
 */
export function useSpinnerPortal(): PortalType {
  return useContext(SpinnerPortalContext);
}

/**
 * Provider component to set portal context for nested spinners.
 */
export function SpinnerPortalProvider({
  portal,
  children,
}: {
  portal: PortalType;
  children: React.ReactNode;
}) {
  return (
    <SpinnerPortalContext.Provider value={portal}>
      {children}
    </SpinnerPortalContext.Provider>
  );
}

// ── Portal Spinner Color Configurations ──
const PORTAL_SPINNER_CONFIG: Record<PortalType, {
  primary: string;
  secondary: string;
  tertiary: string;
  background: string;
}> = {
  admin: {
    primary: '#7C3AED',
    secondary: '#8B5CF6',
    tertiary: '#A78BFA',
    background: 'rgba(124, 58, 237, 0.1)',
  },
  teacher: {
    primary: '#10B981',
    secondary: '#34D399',
    tertiary: '#6EE7B7',
    background: 'rgba(16, 185, 129, 0.1)',
  },
  parent: {
    primary: '#0EA5E9',
    secondary: '#38BDF8',
    tertiary: '#7DD3FC',
    background: 'rgba(14, 165, 233, 0.1)',
  },
};

// ── Size Configurations ──
const SIZE_CONFIG = {
  xs: { dimension: 12, strokeWidth: 2 },
  sm: { dimension: 16, strokeWidth: 2 },
  md: { dimension: 24, strokeWidth: 3 },
  lg: { dimension: 32, strokeWidth: 3 },
  xl: { dimension: 48, strokeWidth: 4 },
  '2xl': { dimension: 64, strokeWidth: 4 },
};

// ── Animation Speed Configurations ──
const SPINNER_SPEED = {
  slow: '2s',
  medium: '1s',
  fast: '0.6s',
  veryFast: '0.4s',
};

/**
 * PortalSpinner — Portal-colored animated loading spinner
 * 
 * Features:
 * - Animated gradient colors matching portal theme
 * - Multiple sizes (xs to 2xl)
 * - Multiple animation speeds
 * - Multiple variants (ring, dots, pulse, orbit, gradient)
 * - GPU-optimized animations (transform + opacity only)
 * - Responsive to dark mode (uses CSS variables)
 * 
 * Variants:
 * - ring: Classic circular spinner with gradient stroke
 * - dots: Three animated dots bouncing in sequence
 * - pulse: Pulsing dot with expanding rings
 * - orbit: Single dot orbiting around center
 * - gradient: Full gradient circle rotating
 * 
 * Usage:
 * ```tsx
 * <PortalSpinner portal="admin" size="lg" variant="gradient" />
 * ```
 */
export interface PortalSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Portal override - defaults to context value */
  portal?: PortalType;
  /** Spinner size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Animation speed */
  speed?: 'slow' | 'medium' | 'fast' | 'veryFast';
  /** Spinner variant */
  variant?: 'ring' | 'dots' | 'pulse' | 'orbit' | 'gradient';
  /** Custom color (overrides portal color) */
  customColor?: string;
  /** Show loading text */
  showText?: boolean;
  /** Loading text content */
  text?: string;
}

export function PortalSpinner({
  className,
  portal,
  size = 'md',
  speed = 'medium',
  variant = 'ring',
  customColor,
  showText = false,
  text = 'Loading...',
  ...props
}: PortalSpinnerProps) {
  const contextPortal = useSpinnerPortal();
  const activePortal = portal || contextPortal;
  const config = PORTAL_SPINNER_CONFIG[activePortal];
  const sizeConfig = SIZE_CONFIG[size];
  const animationDuration = SPINNER_SPEED[speed];
  
  const primaryColor = customColor || config.primary;
  const secondaryColor = customColor || config.secondary;
  const tertiaryColor = customColor || config.tertiary;

  // Ring Variant - Classic spinner with gradient
  if (variant === 'ring') {
    return (
      <div
        data-slot="portal-spinner"
        data-portal={activePortal}
        data-variant="ring"
        className={cn('flex items-center gap-3', className)}
        {...props}
      >
        <div
          className="portal-spinner-ring"
          style={{
            width: sizeConfig.dimension,
            height: sizeConfig.dimension,
            borderWidth: sizeConfig.strokeWidth,
            borderStyle: 'solid',
            borderColor: config.background,
            borderTopColor: primaryColor,
            borderRightColor: secondaryColor,
            animationDuration,
          }}
        />
        {showText && (
          <span className="text-sm text-muted-foreground animate-pulse">
            {text}
          </span>
        )}
      </div>
    );
  }

  // Dots Variant - Three bouncing dots
  if (variant === 'dots') {
    return (
      <div
        data-slot="portal-spinner"
        data-portal={activePortal}
        data-variant="dots"
        className={cn('flex items-center gap-2', className)}
        {...props}
      >
        <div className="portal-spinner-dots" style={{ gap: sizeConfig.dimension / 8 }}>
          <div
            className="portal-spinner-dot"
            style={{
              width: sizeConfig.dimension / 4,
              height: sizeConfig.dimension / 4,
              backgroundColor: primaryColor,
              animationDuration,
              animationDelay: '0s',
            }}
          />
          <div
            className="portal-spinner-dot"
            style={{
              width: sizeConfig.dimension / 4,
              height: sizeConfig.dimension / 4,
              backgroundColor: secondaryColor,
              animationDuration,
              animationDelay: `${parseFloat(animationDuration) / 3}s`,
            }}
          />
          <div
            className="portal-spinner-dot"
            style={{
              width: sizeConfig.dimension / 4,
              height: sizeConfig.dimension / 4,
              backgroundColor: tertiaryColor,
              animationDuration,
              animationDelay: `${(parseFloat(animationDuration) / 3) * 2}s`,
            }}
          />
        </div>
        {showText && (
          <span className="text-sm text-muted-foreground animate-pulse">
            {text}
          </span>
        )}
      </div>
    );
  }

  // Pulse Variant - Pulsing dot with expanding rings
  if (variant === 'pulse') {
    return (
      <div
        data-slot="portal-spinner"
        data-portal={activePortal}
        data-variant="pulse"
        className={cn('flex items-center gap-3', className)}
        {...props}
      >
        <div
          className="portal-spinner-pulse-container"
          style={{
            width: sizeConfig.dimension,
            height: sizeConfig.dimension,
          }}
        >
          {/* Outer ring */}
          <div
            className="portal-spinner-pulse-ring"
            style={{
              borderColor: primaryColor,
              animationDuration,
            }}
          />
          {/* Inner ring */}
          <div
            className="portal-spinner-pulse-ring"
            style={{
              borderColor: secondaryColor,
              animationDuration,
              animationDelay: `${parseFloat(animationDuration) / 2}s`,
              width: sizeConfig.dimension * 0.7,
              height: sizeConfig.dimension * 0.7,
            }}
          />
          {/* Center dot */}
          <div
            className="portal-spinner-pulse-dot"
            style={{
              width: sizeConfig.dimension / 4,
              height: sizeConfig.dimension / 4,
              backgroundColor: tertiaryColor,
            }}
          />
        </div>
        {showText && (
          <span className="text-sm text-muted-foreground animate-pulse">
            {text}
          </span>
        )}
      </div>
    );
  }

  // Orbit Variant - Single dot orbiting around center
  if (variant === 'orbit') {
    return (
      <div
        data-slot="portal-spinner"
        data-portal={activePortal}
        data-variant="orbit"
        className={cn('flex items-center gap-3', className)}
        {...props}
      >
        <div
          className="portal-spinner-orbit-container"
          style={{
            width: sizeConfig.dimension,
            height: sizeConfig.dimension,
          }}
        >
          {/* Orbit path */}
          <div
            className="portal-spinner-orbit-path"
            style={{
              borderColor: config.background,
              borderWidth: 1,
            }}
          />
          {/* Orbiting dot */}
          <div
            className="portal-spinner-orbit-dot"
            style={{
              width: sizeConfig.dimension / 5,
              height: sizeConfig.dimension / 5,
              backgroundColor: primaryColor,
              animationDuration,
            }}
          />
          {/* Center dot */}
          <div
            className="portal-spinner-orbit-center"
            style={{
              width: sizeConfig.dimension / 6,
              height: sizeConfig.dimension / 6,
              backgroundColor: secondaryColor,
            }}
          />
        </div>
        {showText && (
          <span className="text-sm text-muted-foreground animate-pulse">
            {text}
          </span>
        )}
      </div>
    );
  }

  // Gradient Variant - Full gradient circle rotating
  if (variant === 'gradient') {
    return (
      <div
        data-slot="portal-spinner"
        data-portal={activePortal}
        data-variant="gradient"
        className={cn('flex items-center gap-3', className)}
        {...props}
      >
        <div
          className="portal-spinner-gradient"
          style={{
            width: sizeConfig.dimension,
            height: sizeConfig.dimension,
            background: `conic-gradient(from 0deg, ${primaryColor}, ${secondaryColor}, ${tertiaryColor}, ${primaryColor})`,
            animationDuration,
          }}
        >
          {/* Inner circle to create ring effect */}
          <div
            className="portal-spinner-gradient-inner"
            style={{
              width: sizeConfig.dimension - sizeConfig.strokeWidth * 2,
              height: sizeConfig.dimension - sizeConfig.strokeWidth * 2,
              margin: sizeConfig.strokeWidth,
            }}
          />
        </div>
        {showText && (
          <span className="text-sm text-muted-foreground animate-pulse">
            {text}
          </span>
        )}
      </div>
    );
  }

  // Default fallback
  return null;
}

/**
 * PortalSpinnerStyles — CSS animations for all spinner variants
 * 
 * All animations are GPU-optimized (transform + opacity only).
 */
export function PortalSpinnerStyles() {
  return (
    <style jsx global>{`
      /* Ring Spinner - Rotation */
      .portal-spinner-ring {
        border-radius: 50%;
        animation: portal-spinner-rotate linear infinite;
      }
      @keyframes portal-spinner-rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      /* Dots Spinner - Bounce */
      .portal-spinner-dots {
        display: flex;
        align-items: center;
      }
      .portal-spinner-dot {
        border-radius: 50%;
        animation: portal-spinner-bounce ease-in-out infinite;
      }
      @keyframes portal-spinner-bounce {
        0%, 100% { transform: translateY(0); opacity: 1; }
        50% { transform: translateY(-8px); opacity: 0.7; }
      }

      /* Pulse Spinner - Expanding rings */
      .portal-spinner-pulse-container {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }
      .portal-spinner-pulse-ring {
        position: absolute;
        border-radius: 50%;
        border-style: solid;
        animation: portal-spinner-pulse-expand ease-out infinite;
        width: 100%;
        height: 100%;
      }
      .portal-spinner-pulse-dot {
        border-radius: 50%;
        animation: portal-spinner-pulse-dot ease-in-out 1s infinite;
      }
      @keyframes portal-spinner-pulse-expand {
        0% { transform: scale(0.5); opacity: 1; }
        100% { transform: scale(1.5); opacity: 0; }
      }
      @keyframes portal-spinner-pulse-dot {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
      }

      /* Orbit Spinner - Circular orbit */
      .portal-spinner-orbit-container {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      }
      .portal-spinner-orbit-path {
        position: absolute;
        border-radius: 50%;
        width: 100%;
        height: 100%;
        border-style: solid;
        opacity: 0.3;
      }
      .portal-spinner-orbit-dot {
        position: absolute;
        border-radius: 50%;
        animation: portal-spinner-orbit linear infinite;
      }
      .portal-spinner-orbit-center {
        border-radius: 50%;
      }
      @keyframes portal-spinner-orbit {
        from {
          transform: rotate(0deg) translateX(calc(50% - 4px)) rotate(0deg);
        }
        to {
          transform: rotate(360deg) translateX(calc(50% - 4px)) rotate(-360deg);
        }
      }

      /* Gradient Spinner - Conic rotation */
      .portal-spinner-gradient {
        border-radius: 50%;
        animation: portal-spinner-gradient-rotate linear infinite;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .portal-spinner-gradient-inner {
        border-radius: 50%;
        background: white;
      }
      .dark .portal-spinner-gradient-inner {
        background: rgb(15, 23, 42);
      }
      @keyframes portal-spinner-gradient-rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `}</style>
  );
}

/**
 * InlineSpinner — Minimal inline spinner for text contexts
 */
export function InlineSpinner({
  portal,
  size = 'sm',
  className,
}: {
  portal?: PortalType;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  return (
    <PortalSpinner
      portal={portal}
      size={size}
      variant="ring"
      className={cn('inline-flex', className)}
    />
  );
}

/**
 * PageSpinner — Large centered spinner for page loading states
 */
export function PageSpinner({
  portal,
  size = 'xl',
  variant = 'gradient',
  showText = true,
  text = 'Loading...',
  className,
}: {
  portal?: PortalType;
  size?: 'lg' | 'xl' | '2xl';
  variant?: 'ring' | 'gradient' | 'orbit' | 'pulse';
  showText?: boolean;
  text?: string;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 p-8', className)}>
      <PortalSpinner
        portal={portal}
        size={size}
        variant={variant}
        showText={showText}
        text={text}
      />
    </div>
  );
}

// Export all
export { PORTAL_SPINNER_CONFIG, SIZE_CONFIG, SPINNER_SPEED };