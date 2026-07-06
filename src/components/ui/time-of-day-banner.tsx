'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Portal Types ──
type PortalType = 'admin' | 'teacher' | 'parent';

// ── Time Period Types ──
type TimePeriod = 'morning' | 'afternoon' | 'evening' | 'night' | 'lateNight';

// ── Welcome Banner Portal Context ──
const WelcomeBannerPortalContext = createContext<PortalType>('admin');

/**
 * Hook to get the current portal context for welcome banner styling.
 */
export function useWelcomeBannerPortal(): PortalType {
  return useContext(WelcomeBannerPortalContext);
}

/**
 * Provider component to set portal context for nested welcome banners.
 */
export function WelcomeBannerPortalProvider({
  portal,
  children,
}: {
  portal: PortalType;
  children: React.ReactNode;
}) {
  return (
    <WelcomeBannerPortalContext.Provider value={portal}>
      {children}
    </WelcomeBannerPortalContext.Provider>
  );
}

// ── Time Period Detection ──
function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  if (hour >= 21 || hour < 5) return 'night';
  return 'lateNight';
}

// ── Time Period Configuration ──
const TIME_PERIOD_CONFIG: Record<TimePeriod, {
  greeting: string;
  emoji: string;
  backgroundGradient: string[];
  accentColor: string;
  secondaryColor: string;
  textColor: string;
  animationType: 'rise' | 'glow' | 'wave' | 'pulse';
  description: string;
}> = {
  morning: {
    greeting: 'Good Morning',
    emoji: '☀️',
    backgroundGradient: ['#FEF3C7', '#FDE68A', '#FBBF24'],
    accentColor: '#F59E0B',
    secondaryColor: '#D97706',
    textColor: '#78350F',
    animationType: 'rise',
    description: 'Ready to make today amazing?',
  },
  afternoon: {
    greeting: 'Good Afternoon',
    emoji: '🌤️',
    backgroundGradient: ['#E0F2FE', '#BAE6FD', '#38BDF8'],
    accentColor: '#0EA5E9',
    secondaryColor: '#0284C7',
    textColor: '#0C4A6E',
    animationType: 'wave',
    description: 'Stay productive and keep going!',
  },
  evening: {
    greeting: 'Good Evening',
    emoji: '🌆',
    backgroundGradient: ['#FED7AA', '#FDBA74', '#FB923C'],
    accentColor: '#F97316',
    secondaryColor: '#EA580C',
    textColor: '#7C2D12',
    animationType: 'glow',
    description: 'Great work today! Time to wind down.',
  },
  night: {
    greeting: 'Good Evening',
    emoji: '🌙',
    backgroundGradient: ['#1E293B', '#334155', '#475569'],
    accentColor: '#8B5CF6',
    secondaryColor: '#7C3AED',
    textColor: '#E2E8F0',
    animationType: 'pulse',
    description: 'Still working? You\'re dedicated!',
  },
  lateNight: {
    greeting: 'Good Night',
    emoji: '🌃',
    backgroundGradient: ['#0F172A', '#1E293B', '#334155'],
    accentColor: '#6366F1',
    secondaryColor: '#4F46E5',
    textColor: '#CBD5E1',
    animationType: 'pulse',
    description: 'Take a rest. Tomorrow awaits!',
  },
};

// ── Portal Color Overrides ──
const PORTAL_ACCENT_CONFIG: Record<PortalType, {
  primary: string;
  secondary: string;
  gradient: string[];
}> = {
  admin: {
    primary: '#7C3AED',
    secondary: '#8B5CF6',
    gradient: ['#7C3AED', '#8B5CF6', '#EC4899'],
  },
  teacher: {
    primary: '#10B981',
    secondary: '#34D399',
    gradient: ['#10B981', '#34D399', '#0EA5E9'],
  },
  parent: {
    primary: '#0EA5E9',
    secondary: '#38BDF8',
    gradient: ['#0EA5E9', '#38BDF8', '#10B981'],
  },
};

// ── Banner Style Variants ──
type BannerStyle = 'gradient' | 'minimal' | 'card' | 'inline' | 'hero';

/**
 * TimeOfDayBanner — Time-aware welcome banner component
 * 
 * Features:
 * - Dynamic greeting based on current time
 * - Portal-aware accent colors
 * - Multiple visual style variants
 * - Animated background effects
 * - Personalized messages
 * - GPU-optimized animations
 * 
 * Usage:
 * ```tsx
 * <TimeOfDayBanner portal="parent" userName="Sarah" style="gradient" />
 * ```
 */
export interface TimeOfDayBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Portal override - defaults to context value */
  portal?: PortalType;
  /** User name to display */
  userName?: string;
  /** Override time period (for testing/demo) */
  overrideTimePeriod?: TimePeriod;
  /** Banner visual style */
  style?: BannerStyle;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show emoji */
  showEmoji?: boolean;
  /** Show description */
  showDescription?: boolean;
  /** Custom message */
  customMessage?: string;
  /** Custom description */
  customDescription?: string;
  /** Show animated background */
  showAnimatedBackground?: boolean;
  /** Animation speed multiplier */
  animationSpeed?: number;
  /** On dismiss callback */
  onDismiss?: () => void;
  /** Dismissible */
  dismissible?: boolean;
  /** Show action button */
  showAction?: boolean;
  /** Action button text */
  actionText?: string;
  /** Action button callback */
  onAction?: () => void;
}

export function TimeOfDayBanner({
  className,
  portal,
  userName,
  overrideTimePeriod,
  style = 'gradient',
  size = 'md',
  showEmoji = true,
  showDescription = true,
  customMessage,
  customDescription,
  showAnimatedBackground = true,
  animationSpeed = 1,
  onDismiss,
  dismissible = false,
  showAction = false,
  actionText = 'View Dashboard',
  onAction,
  ...props
}: TimeOfDayBannerProps) {
  const contextPortal = useWelcomeBannerPortal();
  const activePortal = portal || contextPortal;
  const portalConfig = PORTAL_ACCENT_CONFIG[activePortal];
  
  const [currentTimePeriod, setCurrentTimePeriod] = useState<TimePeriod>(() => 
    overrideTimePeriod || getTimePeriod(new Date().getHours())
  );
  const [isVisible, setIsVisible] = useState(true);

  // Update time period every minute
  useEffect(() => {
    if (overrideTimePeriod) {
      setCurrentTimePeriod(overrideTimePeriod);
      return;
    }

    const interval = setInterval(() => {
      setCurrentTimePeriod(getTimePeriod(new Date().getHours()));
    }, 60000);

    return () => clearInterval(interval);
  }, [overrideTimePeriod]);

  // Get configuration
  const timeConfig = TIME_PERIOD_CONFIG[currentTimePeriod];
  const greeting = customMessage || `${timeConfig.greeting}${userName ? `, ${userName}` : ''}!`;
  const description = customDescription || timeConfig.description;

  // Size configurations
  const sizeConfig = {
    sm: {
      padding: 'py-2 px-4',
      titleClass: 'text-sm font-medium',
      descClass: 'text-xs',
      emojiSize: 20,
    },
    md: {
      padding: 'py-4 px-6',
      titleClass: 'text-lg font-semibold',
      descClass: 'text-sm',
      emojiSize: 28,
    },
    lg: {
      padding: 'py-6 px-8',
      titleClass: 'text-xl font-bold',
      descClass: 'text-base',
      emojiSize: 36,
    },
    xl: {
      padding: 'py-8 px-10',
      titleClass: 'text-2xl font-bold',
      descClass: 'text-lg',
      emojiSize: 44,
    },
  };

  const currentSize = sizeConfig[size];

  // Handle dismiss
  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  // Render based on style variant
  const renderContent = () => (
    <>
      {/* Emoji */}
      {showEmoji && (
        <motion.span
          className="time-banner-emoji mr-3"
          style={{ fontSize: currentSize.emojiSize }}
          animate={{
            scale: [1, 1.1, 1],
            rotate: style === 'hero' ? [-5, 5, -5] : [0, 5, 0],
          }}
          transition={{
            duration: 2 / animationSpeed,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {timeConfig.emoji}
        </motion.span>
      )}

      {/* Content Container */}
      <div className="time-banner-content flex-1">
        {/* Greeting */}
        <motion.h2
          className={cn('time-banner-title', currentSize.titleClass)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {greeting}
        </motion.h2>

        {/* Description */}
        {showDescription && description && (
          <motion.p
            className={cn('time-banner-description mt-1', currentSize.descClass)}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {description}
          </motion.p>
        )}
      </div>

      {/* Action Button */}
      {showAction && onAction && (
        <motion.button
          className="time-banner-action ml-4 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
          style={{
            background: portalConfig.primary,
            color: 'white',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAction}
        >
          {actionText}
        </motion.button>
      )}

      {/* Dismiss Button */}
      {dismissible && (
        <motion.button
          className="time-banner-dismiss ml-4 p-1 rounded-full transition-all"
          style={{
            color: timeConfig.textColor,
            opacity: 0.6,
          }}
          whileHover={{ scale: 1.1, opacity: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleDismiss}
        >
          ✕
        </motion.button>
      )}
    </>
  );

  // Animated background elements
  const renderAnimatedBackground = () => {
    if (!showAnimatedBackground) return null;

    const animationConfig = {
      rise: { y: [-10, 0, -10], duration: 4 },
      glow: { opacity: [0.3, 0.6, 0.3], scale: [0.9, 1, 0.9], duration: 3 },
      wave: { x: [-20, 20, -20], duration: 5 },
      pulse: { scale: [1, 1.05, 1], duration: 2 },
    };

    const anim = animationConfig[timeConfig.animationType];

    return (
      <motion.div
        className="time-banner-animated-bg absolute inset-0 -z-10"
        style={{
          background: `linear-gradient(135deg, ${timeConfig.backgroundGradient.join(', ')})`,
          borderRadius: 'inherit',
        }}
        animate={anim}
        transition={{
          duration: anim.duration / animationSpeed,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    );
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          data-slot="time-of-day-banner"
          data-portal={activePortal}
          data-time-period={currentTimePeriod}
          data-style={style}
          className={cn(
            'relative overflow-hidden rounded-xl',
            currentSize.padding,
            'flex items-center',
            style === 'gradient' && 'time-banner-gradient',
            style === 'minimal' && 'time-banner-minimal',
            style === 'card' && 'time-banner-card',
            style === 'inline' && 'time-banner-inline',
            style === 'hero' && 'time-banner-hero',
            className
          )}
          style={
            style === 'minimal'
              ? {
                  background: `${portalConfig.primary}10`,
                  borderLeft: `4px solid ${portalConfig.primary}`,
                }
              : style === 'card'
              ? {
                  background: 'white',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                }
              : undefined
          }
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          {...props}
        >
          {/* Animated Background */}
          {style === 'gradient' && renderAnimatedBackground()}

          {/* Portal Accent Overlay */}
          {style === 'gradient' && (
            <div
              className="time-banner-portal-accent absolute inset-0 -z-5 opacity-20"
              style={{
                background: `linear-gradient(135deg, ${portalConfig.gradient.join(', ')})`,
                mixBlendMode: 'overlay',
              }}
            />
          )}

          {/* Content */}
          {renderContent()}

          {/* Decorative Sparkles */}
          {style === 'hero' && (
            <>
              <motion.div
                className="time-banner-sparkle absolute"
                style={{ top: 10, left: 20, color: portalConfig.primary }}
                animate={{
                  opacity: [0, 0.6, 0],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ✦
              </motion.div>
              <motion.div
                className="time-banner-sparkle absolute"
                style={{ bottom: 10, right: 30, color: portalConfig.secondary }}
                animate={{
                  opacity: [0, 0.5, 0],
                  scale: [0.6, 1.2, 0.6],
                }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
              >
                ✧
              </motion.div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * TimeOfDayBannerStyles — CSS styles for welcome banners
 */
export function TimeOfDayBannerStyles() {
  return (
    <style jsx global>{`
      .time-banner-gradient {
        position: relative;
      }

      .time-banner-gradient::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        padding: 1px;
        background: linear-gradient(135deg, 
          var(--portal-primary), 
          var(--portal-secondary)
        );
        mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        mask-composite: xor;
        -webkit-mask-composite: xor;
        pointer-events: none;
      }

      .time-banner-minimal {
        background: rgba(0, 0, 0, 0.03);
      }

      .dark .time-banner-minimal {
        background: rgba(255, 255, 255, 0.05);
      }

      .time-banner-card {
        border-radius: var(--radius-lg);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .time-banner-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      }

      .dark .time-banner-card {
        background: var(--card);
      }

      .time-banner-inline {
        border-radius: var(--radius-md);
      }

      .time-banner-hero {
        border-radius: var(--radius-xl);
        padding: 1.5rem 2rem;
        min-height: 120px;
      }

      .time-banner-emoji {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .time-banner-content {
        flex: 1;
      }

      .time-banner-title {
        color: var(--text-primary);
      }

      .time-banner-description {
        color: var(--text-secondary);
      }

      .time-banner-action {
        border-radius: var(--radius-md);
      }

      .time-banner-sparkle {
        font-size: 14px;
        pointer-events: none;
      }
    `}</style>
  );
}

// ── Preset Components ──

/**
 * DashboardWelcomeBanner — Pre-configured dashboard welcome banner
 */
export function DashboardWelcomeBanner({
  portal,
  userName,
  onViewDashboard,
  className,
}: {
  portal?: PortalType;
  userName?: string;
  onViewDashboard?: () => void;
  className?: string;
}) {
  return (
    <TimeOfDayBanner
      portal={portal}
      userName={userName}
      style="gradient"
      size="lg"
      showAction={!!onViewDashboard}
      actionText="View Dashboard"
      onAction={onViewDashboard}
      className={className}
    />
  );
}

/**
 * InlineWelcomeBanner — Minimal inline welcome banner
 */
export function InlineWelcomeBanner({
  portal,
  userName,
  className,
}: {
  portal?: PortalType;
  userName?: string;
  className?: string;
}) {
  return (
    <TimeOfDayBanner
      portal={portal}
      userName={userName}
      style="inline"
      size="sm"
      showDescription={false}
      showAnimatedBackground={false}
      className={className}
    />
  );
}

/**
 * HeroWelcomeBanner — Large hero-style welcome banner
 */
export function HeroWelcomeBanner({
  portal,
  userName,
  customMessage,
  className,
}: {
  portal?: PortalType;
  userName?: string;
  customMessage?: string;
  className?: string;
}) {
  return (
    <TimeOfDayBanner
      portal={portal}
      userName={userName}
      customMessage={customMessage}
      style="hero"
      size="xl"
      className={className}
    />
  );
}

// ── Time Utilities Export ──

export {
  getTimePeriod,
  TIME_PERIOD_CONFIG,
  PORTAL_ACCENT_CONFIG,
};

// Type exports
export type { TimePeriod, BannerStyle };