'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';

// ── Portal Types ──
type PortalType = 'admin' | 'teacher' | 'parent';

// ── Celebration Portal Context ──
const CelebrationPortalContext = createContext<PortalType>('admin');

/**
 * Hook to get the current portal context for celebration styling.
 */
export function useCelebrationPortal(): PortalType {
  return useContext(CelebrationPortalContext);
}

/**
 * Provider component to set portal context for nested celebrations.
 */
export function CelebrationPortalProvider({
  portal,
  children,
}: {
  portal: PortalType;
  children: React.ReactNode;
}) {
  return (
    <CelebrationPortalContext.Provider value={portal}>
      {children}
    </CelebrationPortalContext.Provider>
  );
}

// ── Portal Celebration Color Configurations ──
const PORTAL_CELEBRATION_CONFIG: Record<PortalType, {
  primary: string;
  secondary: string;
  tertiary: string;
  accent: string;
  confettiColors: string[];
}> = {
  admin: {
    primary: '#7C3AED',
    secondary: '#8B5CF6',
    tertiary: '#A78BFA',
    accent: '#EC4899',
    confettiColors: ['#7C3AED', '#8B5CF6', '#A78BFA', '#EC4899', '#F97316', '#10B981'],
  },
  teacher: {
    primary: '#10B981',
    secondary: '#34D399',
    tertiary: '#6EE7B7',
    accent: '#0EA5E9',
    confettiColors: ['#10B981', '#34D399', '#6EE7B7', '#0EA5E9', '#F59E0B', '#7C3AED'],
  },
  parent: {
    primary: '#0EA5E9',
    secondary: '#38BDF8',
    tertiary: '#7DD3FC',
    accent: '#10B981',
    confettiColors: ['#0EA5E9', '#38BDF8', '#7DD3FC', '#10B981', '#F97316', '#A78BFA'],
  },
};

// ── Animation Duration Configurations ──
const CELEBRATION_DURATION = {
  short: 2000,
  medium: 4000,
  long: 6000,
};

/**
 * SuccessCelebration — Portal-colored success celebration animation
 * 
 * Features:
 * - Confetti burst with portal-colored particles
 * - Animated success icon (checkmark/star/trophy)
 * - Optional celebration message
 * - Auto-dismiss after duration
 * - GPU-optimized animations
 * - Multiple celebration variants
 * 
 * Variants:
 * - confetti: Full confetti burst explosion
 * - pop: Simple pop animation with icon
 * - sparkle: Sparkle animation around content
 * - stars: Star burst animation
 * - trophy: Trophy animation with celebration
 * - wave: Wave/hand animation
 * 
 * Usage:
 * ```tsx
 * <SuccessCelebration portal="admin" trigger={successState} />
 * ```
 */
export interface SuccessCelebrationProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Portal override - defaults to context value */
  portal?: PortalType;
  /** Trigger the celebration */
  trigger?: boolean;
  /** Celebration variant */
  variant?: 'confetti' | 'pop' | 'sparkle' | 'stars' | 'trophy' | 'wave';
  /** Duration in milliseconds or preset */
  duration?: 'short' | 'medium' | 'long' | number;
  /** Celebration message */
  message?: string;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Auto-dismiss after duration */
  autoDismiss?: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Position for confetti origin */
  position?: 'center' | 'top' | 'top-left' | 'top-right';
}

export function SuccessCelebration({
  className,
  portal,
  trigger = false,
  variant = 'confetti',
  duration = 'medium',
  message = 'Success!',
  icon,
  autoDismiss = true,
  onComplete,
  position = 'center',
  children,
  ...props
}: SuccessCelebrationProps) {
  const contextPortal = useCelebrationPortal();
  const activePortal = portal || contextPortal;
  const config = PORTAL_CELEBRATION_CONFIG[activePortal];
  
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{
    id: number;
    color: string;
    x: number;
    y: number;
    delay: number;
    size: number;
  }>>([]);

  // Calculate duration
  const durationMs = typeof duration === 'number' 
    ? duration 
    : CELEBRATION_DURATION[duration];

  // Generate particles for confetti
  const generateParticles = useCallback(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      color: config.confettiColors[Math.floor(Math.random() * config.confettiColors.length)],
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.5,
      size: Math.random() * 8 + 4,
    }));
    setParticles(newParticles);
  }, [config]);

  // Handle trigger
  useEffect(() => {
    if (trigger) {
      setIsVisible(true);
      if (variant === 'confetti') {
        generateParticles();
      }
      
      if (autoDismiss) {
        setTimeout(() => {
          setIsVisible(false);
          setParticles([]);
          onComplete?.();
        }, durationMs);
      }
    }
  }, [trigger, variant, autoDismiss, durationMs, generateParticles, onComplete]);

  // Position configurations
  const positionClasses = {
    center: 'items-center justify-center',
    top: 'items-start justify-center pt-20',
    'top-left': 'items-start justify-start pl-8 pt-20',
    'top-right': 'items-start justify-end pr-8 pt-20',
  };

  // Render variants
  if (variant === 'confetti') {
    return (
      <div
        data-slot="success-celebration"
        data-portal={activePortal}
        data-variant="confetti"
        className={cn('relative', className)}
        {...props}
      >
        {children}
        
        {/* Confetti Container */}
        {isVisible && (
          <div
            className={cn(
              'fixed inset-0 z-50 pointer-events-none flex',
              positionClasses[position]
            )}
          >
            {/* Confetti particles */}
            <div className="celebration-confetti-container">
              {particles.map((particle) => (
                <div
                  key={particle.id}
                  className="celebration-confetti-particle"
                  style={{
                    backgroundColor: particle.color,
                    width: particle.size,
                    height: particle.size,
                    left: `${particle.x}%`,
                    animationDelay: `${particle.delay}s`,
                  }}
                />
              ))}
            </div>
            
            {/* Success Icon */}
            <div className="celebration-success-icon" style={{ animationDuration: `${durationMs / 2}ms` }}>
              {icon || (
                <svg viewBox="0 0 24 24" className="w-16 h-16" style={{ color: config.primary }}>
                  <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.1" />
                  <path
                    d="M9 12l2 2 4-4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    className="celebration-check-path"
                  />
                </svg>
              )}
              {message && (
                <p className="mt-4 text-lg font-semibold celebration-message" style={{ color: config.primary }}>
                  {message}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'pop') {
    return (
      <div
        data-slot="success-celebration"
        data-portal={activePortal}
        data-variant="pop"
        className={cn('relative', className)}
        {...props}
      >
        {children}
        
        {isVisible && (
          <div className={cn('fixed inset-0 z-50 pointer-events-none flex', positionClasses[position])}>
            <div className="celebration-pop-icon" style={{ animationDuration: `${durationMs}ms` }}>
              {icon || (
                <div
                  className="w-16 h-16 rounded-full celebration-pop-circle"
                  style={{ backgroundColor: config.primary }}
                >
                  <svg viewBox="0 0 24 24" className="w-8 h-8 text-white mx-auto">
                    <path
                      d="M9 12l2 2 4-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </div>
              )}
              {message && (
                <p className="mt-3 text-sm font-medium" style={{ color: config.primary }}>
                  {message}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'sparkle') {
    return (
      <div
        data-slot="success-celebration"
        data-portal={activePortal}
        data-variant="sparkle"
        className={cn('relative inline-flex items-center', className)}
        {...props}
      >
        {isVisible && (
          <>
            {/* Sparkle particles around content */}
            <div className="celebration-sparkle-container">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="celebration-sparkle"
                  style={{
                    color: config.confettiColors[i % config.confettiColors.length],
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </>
        )}
        {children}
      </div>
    );
  }

  if (variant === 'stars') {
    return (
      <div
        data-slot="success-celebration"
        data-portal={activePortal}
        data-variant="stars"
        className={cn('relative', className)}
        {...props}
      >
        {children}
        
        {isVisible && (
          <div className={cn('fixed inset-0 z-50 pointer-events-none flex', positionClasses[position])}>
            <div className="celebration-stars-container">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="celebration-star"
                  style={{
                    color: config.confettiColors[i % config.confettiColors.length],
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
              <div className="celebration-center-icon" style={{ color: config.primary }}>
                {icon || (
                  <svg viewBox="0 0 24 24" className="w-12 h-12">
                    <path
                      d="M9 12l2 2 4-4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                )}
              </div>
            </div>
            {message && (
              <p className="mt-4 text-lg font-semibold" style={{ color: config.primary }}>
                {message}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'trophy') {
    return (
      <div
        data-slot="success-celebration"
        data-portal={activePortal}
        data-variant="trophy"
        className={cn('relative', className)}
        {...props}
      >
        {children}
        
        {isVisible && (
          <div className={cn('fixed inset-0 z-50 pointer-events-none flex flex-col', positionClasses[position])}>
            <div className="celebration-trophy-container" style={{ animationDuration: `${durationMs}ms` }}>
              <div className="celebration-trophy-glow" style={{ backgroundColor: config.primary }} />
              <svg viewBox="0 0 24 24" className="w-16 h-16 celebration-trophy-icon" style={{ color: config.primary }}>
                <path
                  d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M12 15a6 6 0 0 0 6-6V3H6v6a6 6 0 0 0 6 6z"
                  fill="currentColor"
                />
                <path
                  d="M12 15v4M8 19h8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
            {message && (
              <p className="mt-4 text-lg font-semibold celebration-message" style={{ color: config.primary }}>
                {message}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'wave') {
    return (
      <div
        data-slot="success-celebration"
        data-portal={activePortal}
        data-variant="wave"
        className={cn('relative', className)}
        {...props}
      >
        {children}
        
        {isVisible && (
          <div className={cn('fixed inset-0 z-50 pointer-events-none flex flex-col', positionClasses[position])}>
            <div className="celebration-wave-container">
              <div className="celebration-wave-hand" style={{ color: config.primary }}>
                <svg viewBox="0 0 24 24" className="w-16 h-16">
                  <path
                    d="M18.5 12.5c0-1.5-1-2.5-2.5-2.5h-1v-3c0-1.5-1-2.5-2.5-2.5s-2.5 1-2.5 2.5v.5h-1c-1.5 0-2.5 1-2.5 2.5s1 2.5 2.5 2.5h1v3c0 1.5 1 2.5 2.5 2.5s2.5-1 2.5-2.5v-.5h1c1.5 0 2.5-1 2.5-2.5z"
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>
            {message && (
              <p className="mt-4 text-lg font-medium" style={{ color: config.primary }}>
                {message}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}

/**
 * SuccessCelebrationStyles — CSS animations for celebration effects
 * 
 * All animations are GPU-optimized (transform + opacity only).
 */
export function SuccessCelebrationStyles() {
  return (
    <style jsx global>{`
      /* Confetti Animation */
      .celebration-confetti-container {
        position: absolute;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      .celebration-confetti-particle {
        position: absolute;
        border-radius: 2px;
        animation: celebration-confetti-fall 2s ease-out forwards;
      }
      @keyframes celebration-confetti-fall {
        0% {
          transform: translateY(-100vh) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateY(100vh) rotate(720deg);
          opacity: 0;
        }
      }

      /* Success Icon Pop */
      .celebration-success-icon {
        display: flex;
        flex-direction: column;
        align-items: center;
        animation: celebration-icon-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      }
      @keyframes celebration-icon-pop {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); opacity: 1; }
      }
      .celebration-check-path {
        stroke-dasharray: 20;
        stroke-dashoffset: 20;
        animation: celebration-check-draw 0.5s ease-out forwards 0.3s;
      }
      @keyframes celebration-check-draw {
        to { stroke-dashoffset: 0; }
      }
      .celebration-message {
        opacity: 0;
        animation: celebration-message-appear 0.3s ease-out forwards 0.5s;
      }
      @keyframes celebration-message-appear {
        to { opacity: 1; }
      }

      /* Pop Animation */
      .celebration-pop-icon {
        display: flex;
        flex-direction: column;
        align-items: center;
        animation: celebration-pop-bounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      }
      @keyframes celebration-pop-bounce {
        0% { transform: scale(0) rotate(-10deg); opacity: 0; }
        50% { transform: scale(1.3) rotate(5deg); }
        70% { transform: scale(0.9) rotate(-3deg); }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }
      .celebration-pop-circle {
        display: flex;
        align-items: center;
        justify-content: center;
        animation: celebration-pop-pulse 1s ease-in-out infinite 0.6s;
      }
      @keyframes celebration-pop-pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4); }
        50% { box-shadow: 0 0 0 10px rgba(124, 58, 237, 0); }
      }

      /* Sparkle Animation */
      .celebration-sparkle-container {
        position: absolute;
        inset: -10px;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
      }
      .celebration-sparkle {
        animation: celebration-sparkle 1s ease-in-out infinite;
        opacity: 0;
        font-size: 12px;
      }
      .celebration-sparkle:nth-child(1) { grid-area: 1 / 1; content: '✦'; }
      .celebration-sparkle:nth-child(2) { grid-area: 1 / 2; content: '✧'; }
      .celebration-sparkle:nth-child(3) { grid-area: 1 / 3; content: '✦'; }
      .celebration-sparkle:nth-child(4) { grid-area: 2 / 1; content: '✧'; }
      .celebration-sparkle:nth-child(5) { grid-area: 2 / 3; content: '✧'; }
      .celebration-sparkle:nth-child(6) { grid-area: 3 / 1; content: '✦'; }
      .celebration-sparkle:nth-child(7) { grid-area: 3 / 2; content: '✧'; }
      .celebration-sparkle:nth-child(8) { grid-area: 3 / 3; content: '✦'; }
      .celebration-sparkle:nth-child(n+9) { display: none; }
      @keyframes celebration-sparkle {
        0%, 100% { opacity: 0; transform: scale(0.5); }
        50% { opacity: 1; transform: scale(1); }
      }

      /* Stars Animation */
      .celebration-stars-container {
        position: relative;
        width: 200px;
        height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .celebration-star {
        position: absolute;
        animation: celebration-star-burst 1s ease-out forwards;
        font-size: 20px;
      }
      .celebration-star:nth-child(1) { transform: rotate(0deg) translateX(50px); }
      .celebration-star:nth-child(2) { transform: rotate(45deg) translateX(50px); }
      .celebration-star:nth-child(3) { transform: rotate(90deg) translateX(50px); }
      .celebration-star:nth-child(4) { transform: rotate(135deg) translateX(50px); }
      .celebration-star:nth-child(5) { transform: rotate(180deg) translateX(50px); }
      .celebration-star:nth-child(6) { transform: rotate(225deg) translateX(50px); }
      .celebration-star:nth-child(7) { transform: rotate(270deg) translateX(50px); }
      .celebration-star:nth-child(8) { transform: rotate(315deg) translateX(50px); }
      @keyframes celebration-star-burst {
        0% { opacity: 0; transform: rotate(var(--rotation, 0deg)) translateX(0) scale(0); }
        50% { opacity: 1; transform: rotate(var(--rotation, 0deg)) translateX(80px) scale(1.5); }
        100% { opacity: 0; transform: rotate(var(--rotation, 0deg)) translateX(120px) scale(0); }
      }
      .celebration-center-icon {
        animation: celebration-center-pulse 0.5s ease-out forwards 0.5s;
      }
      @keyframes celebration-center-pulse {
        0% { transform: scale(0); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }

      /* Trophy Animation */
      .celebration-trophy-container {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: celebration-trophy-rise 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      }
      .celebration-trophy-glow {
        position: absolute;
        width: 80px;
        height: 80px;
        border-radius: 50%;
        opacity: 0.3;
        animation: celebration-glow-pulse 1.5s ease-in-out infinite;
      }
      @keyframes celebration-trophy-rise {
        0% { transform: translateY(50px) scale(0.5); opacity: 0; }
        100% { transform: translateY(0) scale(1); opacity: 1; }
      }
      @keyframes celebration-glow-pulse {
        0%, 100% { transform: scale(1); opacity: 0.3; }
        50% { transform: scale(1.3); opacity: 0.5; }
      }
      .celebration-trophy-icon {
        animation: celebration-trophy-shine 0.5s ease-out forwards 0.3s;
      }
      @keyframes celebration-trophy-shine {
        0% { filter: brightness(1); }
        50% { filter: brightness(1.5); }
        100% { filter: brightness(1); }
      }

      /* Wave Animation */
      .celebration-wave-container {
        display: flex;
        align-items: center;
        justify-content: center;
        animation: celebration-wave-appear 0.5s ease-out forwards;
      }
      .celebration-wave-hand {
        animation: celebration-wave-wave 1s ease-in-out infinite 0.5s;
        transform-origin: bottom center;
      }
      @keyframes celebration-wave-appear {
        0% { transform: scale(0); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes celebration-wave-wave {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(20deg); }
        75% { transform: rotate(-10deg); }
      }
    `}</style>
  );
}

/**
 * QuickSuccess — Minimal inline success indicator
 */
export function QuickSuccess({
  portal,
  size = 'md',
  className,
}: {
  portal?: PortalType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const contextPortal = useCelebrationPortal();
  const activePortal = portal || contextPortal;
  const config = PORTAL_CELEBRATION_CONFIG[activePortal];

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={cn(
        'quick-success-icon inline-flex items-center justify-center rounded-full',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: config.primary,
        animation: 'quick-success-pop 0.3s ease-out forwards',
      }}
    >
      <svg viewBox="0 0 12 12" className="w-3 h-3 text-white">
        <path
          d="M3 6l2 2 4-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
}

// Export all
export { PORTAL_CELEBRATION_CONFIG, CELEBRATION_DURATION };