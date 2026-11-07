'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Portal Types ──
type PortalType = 'admin' | 'teacher' | 'parent';

// ── Achievement Types ──
type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legendary';
type AchievementCategory = 'milestone' | 'growth' | 'attendance' | 'social' | 'creativity' | 'academic' | 'sports' | 'custom';
type AchievementAnimationVariant = 'unlock' | 'upgrade' | 'milestone' | 'badge' | 'trophy' | 'ribbon' | 'glow' | 'burst';

// ── Achievement Unlock Portal Context ──
const AchievementUnlockPortalContext = createContext<PortalType>('admin');

/**
 * Hook to get the current portal context for achievement styling.
 */
export function useAchievementUnlockPortal(): PortalType {
  return useContext(AchievementUnlockPortalContext);
}

/**
 * Provider component to set portal context for nested achievements.
 */
export function AchievementUnlockPortalProvider({
  portal,
  children,
}: {
  portal: PortalType;
  children: React.ReactNode;
}) {
  return (
    <AchievementUnlockPortalContext.Provider value={portal}>
      {children}
    </AchievementUnlockPortalContext.Provider>
  );
}

// ── Portal Achievement Configurations ──
const PORTAL_ACHIEVEMENT_CONFIG: Record<PortalType, {
  primary: string;
  secondary: string;
  tertiary: string;
  glowColor: string;
  particleColors: string[];
}> = {
  admin: {
    primary: '#7C3AED',
    secondary: '#8B5CF6',
    tertiary: '#A78BFA',
    glowColor: '#7C3AED',
    particleColors: ['#7C3AED', '#8B5CF6', '#EC4899', '#F97316', '#FBBF24'],
  },
  teacher: {
    primary: '#10B981',
    secondary: '#34D399',
    tertiary: '#6EE7B7',
    glowColor: '#10B981',
    particleColors: ['#10B981', '#34D399', '#0EA5E9', '#F59E0B', '#EF4444'],
  },
  parent: {
    primary: '#0EA5E9',
    secondary: '#38BDF8',
    tertiary: '#7DD3FC',
    glowColor: '#0EA5E9',
    particleColors: ['#0EA5E9', '#38BDF8', '#10B981', '#F97316', '#7C3AED'],
  },
};

// ── Achievement Tier Configurations ──
const TIER_CONFIG: Record<AchievementTier, {
  color: string;
  gradient: string[];
  glow: string;
  badgeIcon: string;
  particleCount: number;
  animationIntensity: number;
  soundEffect: string;
}> = {
  bronze: {
    color: '#CD7F32',
    gradient: ['#CD7F32', '#8B4513'],
    glow: '#CD7F32',
    badgeIcon: '🥉',
    particleCount: 20,
    animationIntensity: 0.6,
    soundEffect: 'light',
  },
  silver: {
    color: '#C0C0C0',
    gradient: ['#C0C0C0', '#A8A8A8'],
    glow: '#C0C0C0',
    badgeIcon: '🥈',
    particleCount: 30,
    animationIntensity: 0.7,
    soundEffect: 'medium',
  },
  gold: {
    color: '#FFD700',
    gradient: ['#FFD700', '#FFA500'],
    glow: '#FFD700',
    badgeIcon: '🥇',
    particleCount: 40,
    animationIntensity: 0.85,
    soundEffect: 'strong',
  },
  platinum: {
    color: '#E5E4E2',
    gradient: ['#E5E4E2', '#BCC6CC', '#E5E4E2'],
    glow: '#E5E4E2',
    badgeIcon: '💎',
    particleCount: 50,
    animationIntensity: 1.0,
    soundEffect: 'strong',
  },
  legendary: {
    color: '#FF6B35',
    gradient: ['#FF6B35', '#F7C531', '#FF6B35'],
    glow: '#FF6B35',
    badgeIcon: '🏆',
    particleCount: 60,
    animationIntensity: 1.2,
    soundEffect: 'epic',
  },
};

// ── Achievement Category Icons ──
const CATEGORY_ICONS: Record<AchievementCategory, string> = {
  milestone: '🎯',
  growth: '🌱',
  attendance: '✅',
  social: '👥',
  creativity: '🎨',
  academic: '📚',
  sports: '⚽',
  custom: '⭐',
};

// ── Animation Duration Presets ──
const ACHIEVEMENT_DURATION = {
  quick: 1500,
  standard: 3000,
  extended: 5000,
  epic: 8000,
};

/**
 * AchievementUnlockAnimation — Portal-colored achievement unlock animation
 * 
 * Features:
 * - Tier-based visual intensity (bronze → legendary)
 * - Category-specific icons
 * - Portal-aware color themes
 * - Multiple animation variants
 * - Particle burst effects
 * - Auto-dismiss with callback
 * - GPU-optimized animations
 * - Optional sound effects placeholder
 * 
 * Usage:
 * ```tsx
 * <AchievementUnlockAnimation
 *   portal="parent"
 *   trigger={showAchievement}
 *   tier="gold"
 *   title="First Steps"
 *   description="Child completed first milestone"
 * />
 * ```
 */
export interface AchievementUnlockAnimationProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Portal override - defaults to context value */
  portal?: PortalType;
  /** Trigger the animation */
  trigger?: boolean;
  /** Achievement tier (affects intensity) */
  tier?: AchievementTier;
  /** Achievement category */
  category?: AchievementCategory;
  /** Animation variant */
  variant?: AchievementAnimationVariant;
  /** Achievement title */
  title: string;
  /** Achievement description */
  description?: string;
  /** Custom badge icon */
  customIcon?: React.ReactNode;
  /** Points/value earned */
  points?: number;
  /** Duration preset or milliseconds */
  duration?: 'quick' | 'standard' | 'extended' | 'epic' | number;
  /** Auto-dismiss after duration */
  autoDismiss?: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Position for overlay */
  position?: 'center' | 'top' | 'bottom';
  /** Show particle burst */
  showParticles?: boolean;
  /** Show progress/XP bar */
  showProgress?: boolean;
  /** Progress percentage (0-100) */
  progressPercent?: number;
  /** Custom colors override */
  customColors?: {
    primary?: string;
    secondary?: string;
    glow?: string;
  };
  /** Enable glow effect */
  enableGlow?: boolean;
  /** Animation speed multiplier */
  animationSpeed?: number;
}

export function AchievementUnlockAnimation({
  className,
  portal,
  trigger = false,
  tier = 'gold',
  category = 'milestone',
  variant = 'unlock',
  title,
  description,
  customIcon,
  points,
  duration = 'standard',
  autoDismiss = true,
  onComplete,
  position = 'center',
  showParticles = true,
  showProgress = false,
  progressPercent = 0,
  customColors,
  enableGlow = true,
  animationSpeed = 1,
  children,
  ...props
}: AchievementUnlockAnimationProps) {
  const contextPortal = useAchievementUnlockPortal();
  const activePortal = portal || contextPortal;
  const portalConfig = PORTAL_ACHIEVEMENT_CONFIG[activePortal];
  const tierConfig = TIER_CONFIG[tier];

  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{
    id: number;
    color: string;
    x: number;
    y: number;
    size: number;
    angle: number;
    velocity: number;
  }>>([]);

  // Calculate colors
  const primaryColor = customColors?.primary || tierConfig.color;
  const secondaryColor = customColors?.secondary || tierConfig.gradient[1];
  const glowColor = customColors?.glow || tierConfig.glow;

  // Calculate duration
  const durationMs = typeof duration === 'number'
    ? duration
    : ACHIEVEMENT_DURATION[duration];

  // Generate particles
  const generateParticles = useCallback(() => {
    const particleColors = [...portalConfig.particleColors, primaryColor];
    const newParticles = Array.from({ length: tierConfig.particleCount }, (_, i) => ({
      id: i,
      color: particleColors[Math.floor(Math.random() * particleColors.length)],
      x: 50,
      y: 50,
      size: Math.random() * 8 + 4,
      angle: (360 / tierConfig.particleCount) * i + Math.random() * 20,
      velocity: Math.random() * 100 + 50 * tierConfig.animationIntensity,
    }));
    setParticles(newParticles);
  }, [portalConfig, tierConfig, primaryColor]);

  // Handle trigger
  useEffect(() => {
    if (trigger) {
      setIsVisible(true);
      if (showParticles) {
        generateParticles();
      }

      if (autoDismiss) {
        setTimeout(() => {
          setIsVisible(false);
          setParticles([]);
          onComplete?.();
        }, durationMs);
      }
    } else {
      setIsVisible(false);
      setParticles([]);
    }
  }, [trigger, showParticles, autoDismiss, durationMs, generateParticles, onComplete]);

  // Position configurations
  const positionClasses = {
    center: 'items-center justify-center',
    top: 'items-start justify-center pt-20',
    bottom: 'items-end justify-center pb-20',
  };

  // Animation intensity factor
  const intensity = tierConfig.animationIntensity * animationSpeed;

  // Render badge icon
  const renderBadgeIcon = () => {
    if (customIcon) return customIcon;
    
    return (
      <motion.div
        className="achievement-badge-icon flex items-center justify-center"
        animate={{
          scale: [1, 1.2 * intensity, 1],
          rotate: variant === 'trophy' ? [0, -10, 10, 0] : [0],
        }}
        transition={{
          duration: 0.8 / animationSpeed,
          repeat: 1,
          ease: 'easeOut',
        }}
      >
        <span className="achievement-badge-emoji" style={{ fontSize: 40 * intensity }}>
          {tierConfig.badgeIcon}
        </span>
      </motion.div>
    );
  };

  // Render particle burst
  const renderParticles = () => {
    if (!showParticles || particles.length === 0) return null;

    return (
      <div className="achievement-particle-container absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="achievement-particle absolute rounded-full"
            style={{
              backgroundColor: particle.color,
              width: particle.size,
              height: particle.size,
            }}
            initial={{
              left: '50%',
              top: '50%',
              scale: 0,
            }}
            animate={{
              left: `${particle.x + Math.cos(particle.angle * Math.PI / 180) * particle.velocity}%`,
              top: `${particle.y + Math.sin(particle.angle * Math.PI / 180) * particle.velocity}%`,
              scale: [0, 1.5 * intensity, 0],
              opacity: [1, 0.8, 0],
            }}
            transition={{
              duration: 1.5 / animationSpeed,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>
    );
  };

  // Render glow effect
  const renderGlow = () => {
    if (!enableGlow) return null;

    return (
      <motion.div
        className="achievement-glow absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(circle, ${glowColor}40 0%, transparent 60%)`,
          filter: 'blur(30px)',
        }}
        animate={{
          scale: [1, 1.5 * intensity, 1],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 2 / animationSpeed,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    );
  };

  // Render progress bar
  const renderProgress = () => {
    if (!showProgress) return null;

    return (
      <motion.div
        className="achievement-progress-bar mt-4 w-full h-2 rounded-full overflow-hidden"
        style={{ background: 'rgba(0,0,0,0.1)' }}
      >
        <motion.div
          className="achievement-progress-fill h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 1 / animationSpeed, ease: 'easeOut' }}
        />
      </motion.div>
    );
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          data-slot="achievement-unlock-animation"
          data-portal={activePortal}
          data-tier={tier}
          data-category={category}
          data-variant={variant}
          className={cn(
            'fixed inset-0 z-50 pointer-events-none flex',
            positionClasses[position],
            className
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          {...props}
        >
          {/* Achievement Card */}
          <motion.div
            className="achievement-card relative flex flex-col items-center p-8 rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${tierConfig.gradient.join(', ')})`,
              boxShadow: `0 10px 40px ${glowColor}40`,
            }}
            initial={{ scale: 0, y: 50 }}
            animate={{ 
              scale: [0, 1.2 * intensity, 1], 
              y: 0,
              rotateY: variant === 'unlock' ? [90, 0] : [0],
            }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
              duration: 0.5 / animationSpeed,
            }}
          >
            {/* Glow Effect */}
            {renderGlow()}

            {/* Particles */}
            {renderParticles()}

            {/* Category Icon */}
            <motion.div
              className="achievement-category-badge mb-2 px-2 py-1 rounded-full text-xs font-medium"
              style={{
                background: 'rgba(0,0,0,0.2)',
                color: 'white',
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 / animationSpeed }}
            >
              {CATEGORY_ICONS[category]} {category.charAt(0).toUpperCase() + category.slice(1)}
            </motion.div>

            {/* Badge Icon */}
            {renderBadgeIcon()}

            {/* Achievement Title */}
            <motion.h3
              className="achievement-title mt-4 text-lg font-bold text-white"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 / animationSpeed }}
            >
              {title}
            </motion.h3>

            {/* Achievement Description */}
            {description && (
              <motion.p
                className="achievement-description mt-2 text-sm text-white/80 max-w-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 / animationSpeed }}
              >
                {description}
              </motion.p>
            )}

            {/* Points Display */}
            {points && (
              <motion.div
                className="achievement-points mt-3 flex items-center gap-2 px-3 py-1 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 / animationSpeed }}
              >
                <span className="text-yellow-300">⭐</span>
                <span className="text-white font-semibold">+{points} XP</span>
              </motion.div>
            )}

            {/* Progress Bar */}
            {renderProgress()}

            {/* Ribbon Variant Decorations */}
            {variant === 'ribbon' && (
              <motion.div
                className="achievement-ribbon absolute -top-2 left-0 right-0 h-4"
                style={{
                  background: `linear-gradient(90deg, ${primaryColor}, transparent, ${primaryColor})`,
                }}
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1 / animationSpeed,
                  repeat: Infinity,
                }}
              />
            )}

            {/* Burst Variant Ring */}
            {variant === 'burst' && (
              <motion.div
                className="achievement-burst-ring absolute inset-0 rounded-2xl"
                style={{
                  border: `3px solid ${primaryColor}`,
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 0.5 / animationSpeed,
                  repeat: 2,
                }}
              />
            )}
          </motion.div>

          {/* Children (optional trigger content) */}
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * AchievementUnlockStyles — CSS styles for achievement animations
 */
export function AchievementUnlockStyles() {
  return (
    <style jsx global>{`
      .achievement-card {
        backdrop-filter: blur(10px);
        min-width: 280px;
        max-width: 400px;
      }

      .achievement-badge-icon {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .achievement-badge-emoji {
        filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2));
      }

      .achievement-particle-container {
        will-change: transform;
      }

      .achievement-particle {
        will-change: transform, opacity;
        pointer-events: none;
      }

      .achievement-glow {
        will-change: transform, opacity;
      }

      .achievement-title {
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .achievement-progress-bar {
        background: rgba(255, 255, 255, 0.2);
      }

      .achievement-progress-fill {
        will-change: width;
      }

      /* Dark mode adjustments */
      .dark .achievement-card {
        background: linear-gradient(135deg, 
          rgba(255, 215, 0, 0.2), 
          rgba(255, 165, 0, 0.1)
        );
        border: 1px solid rgba(255, 215, 0, 0.3);
      }

      /* Tier-specific glow effects */
      .achievement-card[data-tier="legendary"]::before {
        content: '';
        position: absolute;
        inset: -10px;
        background: radial-gradient(circle, #FF6B35 0%, transparent 60%);
        filter: blur(20px);
        opacity: 0.3;
        z-index: -1;
        animation: legendary-glow 2s ease-in-out infinite;
      }

      @keyframes legendary-glow {
        0%, 100% { transform: scale(1); opacity: 0.3; }
        50% { transform: scale(1.1); opacity: 0.5; }
      }
    `}</style>
  );
}

// ── Preset Achievement Components ──

/**
 * MilestoneAchievement — Achievement for milestone completion
 */
export function MilestoneAchievement({
  portal,
  trigger,
  title,
  description,
  points,
  onComplete,
  tier,
  className,
}: {
  portal?: PortalType;
  trigger?: boolean;
  title: string;
  description?: string;
  points?: number;
  onComplete?: () => void;
  tier?: AchievementTier;
  className?: string;
}) {
  return (
    <AchievementUnlockAnimation
      portal={portal}
      trigger={trigger}
      tier={tier || 'gold'}
      category="milestone"
      variant="milestone"
      title={title}
      description={description}
      points={points}
      onComplete={onComplete}
      className={className}
    />
  );
}

/**
 * GrowthAchievement — Achievement for growth/development progress
 */
export function GrowthAchievement({
  portal,
  trigger,
  title,
  description,
  points,
  onComplete,
  tier,
  className,
}: {
  portal?: PortalType;
  trigger?: boolean;
  title: string;
  description?: string;
  points?: number;
  onComplete?: () => void;
  tier?: AchievementTier;
  className?: string;
}) {
  return (
    <AchievementUnlockAnimation
      portal={portal}
      trigger={trigger}
      tier={tier || 'silver'}
      category="growth"
      variant="badge"
      title={title}
      description={description}
      points={points}
      onComplete={onComplete}
      className={className}
    />
  );
}

/**
 * AttendanceAchievement — Achievement for attendance milestones
 */
export function AttendanceAchievement({
  portal,
  trigger,
  title,
  description,
  points,
  daysAttended,
  onComplete,
  tier,
  className,
}: {
  portal?: PortalType;
  trigger?: boolean;
  title: string;
  description?: string;
  points?: number;
  daysAttended?: number;
  onComplete?: () => void;
  tier?: AchievementTier;
  className?: string;
}) {
  return (
    <AchievementUnlockAnimation
      portal={portal}
      trigger={trigger}
      tier={tier || 'bronze'}
      category="attendance"
      variant="ribbon"
      title={title}
      description={description || `${daysAttended || 0} consecutive days`}
      points={points}
      onComplete={onComplete}
      className={className}
    />
  );
}

/**
 * LegendaryAchievement — Special legendary tier achievement
 */
export function LegendaryAchievement({
  portal,
  trigger,
  title,
  description,
  points,
  onComplete,
  className,
}: {
  portal?: PortalType;
  trigger?: boolean;
  title: string;
  description?: string;
  points?: number;
  onComplete?: () => void;
  className?: string;
}) {
  return (
    <AchievementUnlockAnimation
      portal={portal}
      trigger={trigger}
      tier="legendary"
      category="milestone"
      variant="trophy"
      duration="epic"
      title={title}
      description={description}
      points={points}
      showProgress={true}
      progressPercent={100}
      onComplete={onComplete}
      className={className}
    />
  );
}

// ── Achievement Badge Display (Non-animated) ──

/**
 * AchievementBadge — Static badge display component
 */
export function AchievementBadge({
  portal,
  tier,
  category,
  title,
  earned = true,
  size = 'md',
  showGlow = true,
  className,
}: {
  portal?: PortalType;
  tier?: AchievementTier;
  category?: AchievementCategory;
  title?: string;
  earned?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showGlow?: boolean;
  className?: string;
}) {
  const contextPortal = useAchievementUnlockPortal();
  const activePortal = portal || contextPortal;
  const tierConfig = TIER_CONFIG[tier || 'bronze'];
  const categoryIcon = CATEGORY_ICONS[category || 'milestone'];

  const sizeConfig = {
    sm: { badgeSize: 40, fontSize: 16 },
    md: { badgeSize: 60, fontSize: 20 },
    lg: { badgeSize: 80, fontSize: 24 },
  };

  const config = sizeConfig[size];

  return (
    <div
      data-slot="achievement-badge"
      data-portal={activePortal}
      data-tier={tier}
      data-earned={earned}
      className={cn(
        'achievement-badge-static relative flex items-center justify-center rounded-full',
        className
      )}
      style={{
        width: config.badgeSize,
        height: config.badgeSize,
        background: earned
          ? `linear-gradient(135deg, ${tierConfig.gradient.join(', ')})`
          : 'rgba(0,0,0,0.2)',
        boxShadow: showGlow && earned ? `0 4px 20px ${tierConfig.glow}40` : 'none',
      }}
    >
      {showGlow && earned && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${tierConfig.glow}30 0%, transparent 60%)`,
          }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      <span style={{ fontSize: config.fontSize, filter: earned ? 'none' : 'grayscale(1)' }}>
        {earned ? tierConfig.badgeIcon : categoryIcon}
      </span>
      {title && (
        <div className="absolute -bottom-6 text-xs font-medium text-center whitespace-nowrap">
          {title}
        </div>
      )}
    </div>
  );
}

// Export all
export {
  PORTAL_ACHIEVEMENT_CONFIG,
  TIER_CONFIG,
  CATEGORY_ICONS,
  ACHIEVEMENT_DURATION,
};

// Type exports
export type { AchievementTier, AchievementCategory, AchievementAnimationVariant };