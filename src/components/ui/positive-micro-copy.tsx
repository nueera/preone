'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react';

// ── Portal Types ──
type PortalType = 'admin' | 'teacher' | 'parent';

// ── Micro-Copy Context Types ──
type MicroCopyContextType = 
  | 'welcome'
  | 'success'
  | 'progress'
  | 'motivation'
  | 'celebration'
  | 'encouragement'
  | 'confirmation'
  | 'loading'
  | 'errorRecovery'
  | 'emptyState'
  | 'milestone'
  | 'achievement'
  | 'reminder'
  | 'tip'
  | 'insight'
  | 'custom';

// ── Micro-Copy Portal Context ──
const MicroCopyPortalContext = createContext<PortalType>('admin');

/**
 * Hook to get the current portal context for micro-copy styling.
 */
export function useMicroCopyPortal(): PortalType {
  return useContext(MicroCopyPortalContext);
}

/**
 * Provider component to set portal context for nested micro-copy.
 */
export function MicroCopyPortalProvider({
  portal,
  children,
}: {
  portal: PortalType;
  children: React.ReactNode;
}) {
  return (
    <MicroCopyPortalContext.Provider value={portal}>
      {children}
    </MicroCopyPortalContext.Provider>
  );
}

// ── Portal Color Configurations ──
const PORTAL_MICRO_COPY_CONFIG: Record<PortalType, {
  primary: string;
  secondary: string;
  accent: string;
  emojiSet: string[];
}> = {
  admin: {
    primary: '#7C3AED',
    secondary: '#8B5CF6',
    accent: '#EC4899',
    emojiSet: ['✨', '🎯', '💪', '🚀', '💡'],
  },
  teacher: {
    primary: '#10B981',
    secondary: '#34D399',
    accent: '#0EA5E9',
    emojiSet: ['🌱', '🌻', '⭐', '📚', '🎨'],
  },
  parent: {
    primary: '#0EA5E9',
    secondary: '#38BDF8',
    accent: '#10B981',
    emojiSet: ['🌟', '💙', '🌈', '🧸', '💫'],
  },
};

// ── Micro-Copy Library ──
const MICRO_COPY_LIBRARY: Record<MicroCopyContextType, {
  templates: string[];
  emojis: string[];
  tone: 'encouraging' | 'celebratory' | 'supportive' | 'informative' | 'motivational';
}> = {
  welcome: {
    templates: [
      'Welcome back! Let\'s make today great.',
      'You\'re here! Time to shine.',
      'Welcome! Great things await.',
      'Good to see you! Let\'s do this together.',
      'You made it! Every day is a new opportunity.',
    ],
    emojis: ['👋', '✨', '🌟', '💫', '🤗'],
    tone: 'encouraging',
  },
  success: {
    templates: [
      'Amazing work! You did it!',
      'Success! You\'re making progress.',
      'Well done! Keep up the great momentum.',
      'Fantastic! You nailed it.',
      'Great job! Your effort paid off.',
      'Perfect! You\'re getting better every day.',
    ],
    emojis: ['🎉', '✅', '⭐', '🏆', '💫', '👏'],
    tone: 'celebratory',
  },
  progress: {
    templates: [
      'You\'re making progress! Keep going.',
      'Step by step, you\'re moving forward.',
      'Every action counts. You\'re doing great.',
      'Progress is progress, no matter how small.',
      'You\'re building something amazing.',
      'One step closer to your goal!',
    ],
    emojis: ['📈', '🌱', '🏃', '💪', '🚀'],
    tone: 'motivational',
  },
  motivation: {
    templates: [
      'You\'ve got this! Believe in yourself.',
      'Keep pushing! Your dedication matters.',
      'Stay focused! Success is within reach.',
      'You\'re capable of amazing things.',
      'Don\'t give up! Every effort counts.',
      'Your potential is unlimited. Keep going!',
    ],
    emojis: ['💪', '🔥', '⚡', '🌟', '💫'],
    tone: 'motivational',
  },
  celebration: {
    templates: [
      'Celebration time! You earned it!',
      'What an achievement! Let\'s celebrate!',
      'This is worth celebrating! You did amazing.',
      'Cheers to your success!',
      'Party time! Your hard work paid off.',
    ],
    emojis: ['🎊', '🎉', '🥳', '🎁', '✨'],
    tone: 'celebratory',
  },
  encouragement: {
    templates: [
      'You\'re doing great! Keep it up.',
      'Don\'t worry, you\'re making progress.',
      'It\'s okay to take breaks. You\'ll succeed.',
      'Every step forward is a win.',
      'You\'re stronger than you think.',
      'Believe in yourself. We believe in you.',
    ],
    emojis: ['💛', '🤝', '🌈', '💪', '✨'],
    tone: 'supportive',
  },
  confirmation: {
    templates: [
      'Perfect! That\'s exactly right.',
      'Confirmed! You\'re all set.',
      'Got it! Everything looks good.',
      'Confirmed! Thanks for your attention.',
      'All set! You\'re ready to proceed.',
    ],
    emojis: ['✓', '✅', '👍', '👌', '🎯'],
    tone: 'informative',
  },
  loading: {
    templates: [
      'Almost there... Great things are loading!',
      'Preparing something wonderful for you...',
      'Just a moment... Your experience is loading.',
      'Loading... Good things take time.',
      'Getting ready... Thanks for your patience.',
    ],
    emojis: ['⏳', '🔄', '✨', '💫', '🌟'],
    tone: 'encouraging',
  },
  errorRecovery: {
    templates: [
      'Don\'t worry, let\'s try again together.',
      'Oops! No worries, we can fix this.',
      'Something happened, but you\'re still awesome.',
      'Let\'s give it another go. You\'ve got this.',
      'Not quite right, but that\'s okay! Keep trying.',
      'It didn\'t work, but your effort matters. Try again!',
    ],
    emojis: ['💛', '🔄', '💪', '🌈', '✨'],
    tone: 'supportive',
  },
  emptyState: {
    templates: [
      'Nothing here yet, but great things await!',
      'This space is ready for your amazing work.',
      'A fresh start! Add something wonderful.',
      'Ready for new beginnings.',
      'Your journey starts here. Add your first item.',
    ],
    emojis: ['🌱', '✨', '🌟', '💫', '🎯'],
    tone: 'encouraging',
  },
  milestone: {
    templates: [
      'Milestone reached! You\'re growing.',
      'Another milestone! Keep up the amazing work.',
      'You hit a milestone! That\'s impressive.',
      'Checkpoint achieved! You\'re on track.',
      'Milestone unlocked! Your journey continues.',
    ],
    emojis: ['🎯', '🏆', '⭐', '🌟', '🎉'],
    tone: 'celebratory',
  },
  achievement: {
    templates: [
      'Achievement unlocked! You\'re remarkable.',
      'New achievement! Your dedication shines.',
      'You earned a new badge! Amazing work.',
      'Achievement complete! You\'re unstoppable.',
      'Badge earned! Your skills are growing.',
    ],
    emojis: ['🏅', '🎖️', '🏆', '⭐', '💎'],
    tone: 'celebratory',
  },
  reminder: {
    templates: [
      'Friendly reminder: You\'re making progress!',
      'Just a nudge: Keep up your great work.',
      'Quick tip: Your consistency pays off.',
      'Remember: Every step counts.',
      'Don\'t forget: You\'re capable of greatness.',
    ],
    emojis: ['💡', '📌', '⭐', '✨', '🎯'],
    tone: 'informative',
  },
  tip: {
    templates: [
      'Pro tip: Small steps lead to big wins.',
      'Quick tip: Your focus matters.',
      'Here\'s a tip: Stay consistent.',
      'Suggestion: Take breaks to recharge.',
      'Helpful hint: Plan ahead for success.',
    ],
    emojis: ['💡', '✨', '🎯', '📚', '💭'],
    tone: 'informative',
  },
  insight: {
    templates: [
      'Insight: Your patterns show great progress.',
      'Observation: You\'re improving steadily.',
      'Notable: Your consistency is impressive.',
      'Discovery: Your efforts are paying off.',
      'Finding: You\'re developing new skills.',
    ],
    emojis: ['🔍', '💡', '📊', '✨', '🎯'],
    tone: 'informative',
  },
  custom: {
    templates: [],
    emojis: ['✨'],
    tone: 'encouraging',
  },
};

// ── Child-Specific Micro-Copy ──
const CHILD_MICRO_COPY: {
  morningCheckIn: string[];
  afternoonUpdate: string[];
  milestoneAchieved: string[];
  growthProgress: string[];
  observationHighlights: string[];
} = {
  morningCheckIn: [
    '{name} started the day with energy! 🌅',
    '{name} arrived ready to learn and play! ⭐',
    '{name} is all set for a wonderful day! 🌈',
    'Great morning energy from {name}! 💪',
    '{name} walked in with a bright smile! ✨',
  ],
  afternoonUpdate: [
    '{name} had a wonderful afternoon! ☀️',
    '{name} enjoyed their activities today! 🎨',
    '{name} showed great creativity! 💫',
    '{name} made new friends today! 👥',
    '{name} had a playful afternoon! 🧸',
  ],
  milestoneAchieved: [
    '{name} reached a new milestone! 🎯',
    '{name}\'s growth is shining! 🌟',
    'Exciting milestone for {name}! 🎉',
    '{name} achieved something special! ⭐',
    '{name} is growing beautifully! 🌱',
  ],
  growthProgress: [
    '{name} is blossoming every day! 🌸',
    '{name}\'s skills are developing nicely! 📈',
    'Watch {name}\'s amazing progress! ✨',
    '{name} is learning and growing! 📚',
    '{name} shows wonderful development! 💫',
  ],
  observationHighlights: [
    '{name} was creative and curious! 🎨',
    '{name} showed kindness to friends! 💙',
    '{name} explored new activities today! 🔍',
    '{name} demonstrated great teamwork! 👥',
    '{name} expressed themselves beautifully! ✨',
  ],
};

/**
 * getMicroCopy — Returns a random positive micro-copy message
 */
export function getMicroCopy(
  contextType: MicroCopyContextType,
  options?: {
    customTemplate?: string;
    portal?: PortalType;
    includeEmoji?: boolean;
    childName?: string;
    deterministicIndex?: number;
  }
): { message: string; emoji: string } {
  const library = MICRO_COPY_LIBRARY[contextType];
  
  // Handle custom template
  if (options?.customTemplate) {
    return {
      message: options.customTemplate,
      emoji: library.emojis[0],
    };
  }

  // Handle empty library for custom type
  if (contextType === 'custom' && !options?.customTemplate) {
    return {
      message: 'You\'re doing amazing!',
      emoji: '✨',
    };
  }

  // Select template (deterministic or random)
  const templates = library.templates;
  const templateIndex = options?.deterministicIndex !== undefined
    ? options.deterministicIndex % templates.length
    : Math.floor(Math.random() * templates.length);
  
  let message = templates[templateIndex];

  // Replace placeholders with child name
  if (options?.childName) {
    message = message.replace('{name}', options.childName);
  }

  // Select emoji
  const emojiIndex = options?.deterministicIndex !== undefined
    ? options.deterministicIndex % library.emojis.length
    : Math.floor(Math.random() * library.emojis.length);
  
  const emoji = library.emojis[emojiIndex];

  return { message, emoji };
}

/**
 * getChildMicroCopy — Returns child-specific positive micro-copy
 */
export function getChildMicroCopy(
  category: keyof typeof CHILD_MICRO_COPY,
  childName: string,
  options?: {
    deterministicIndex?: number;
  }
): { message: string; emoji: string } {
  const messages = CHILD_MICRO_COPY[category];
  
  const messageIndex = options?.deterministicIndex !== undefined
    ? options.deterministicIndex % messages.length
    : Math.floor(Math.random() * messages.length);
  
  let message = messages[messageIndex].replace('{name}', childName);

  // Extract emoji from message or use default
  const emojiMatch = message.match(/[^\x00-\x7F]+/);
  const emoji = emojiMatch ? emojiMatch[0] : '✨';

  // Clean emoji from message if needed
  message = message.replace(/[^\x00-\x7F]+/g, '').trim();

  return { message: message + ' ' + emoji, emoji };
}

/**
 * useMicroCopy — Hook for reactive micro-copy generation
 */
export function useMicroCopy(
  contextType: MicroCopyContextType,
  options?: {
    customTemplate?: string;
    childName?: string;
    refreshKey?: number;
    portal?: PortalType;
  }
) {
  const contextPortal = useMicroCopyPortal();
  const activePortal = options?.portal || contextPortal;
  const portalConfig = PORTAL_MICRO_COPY_CONFIG[activePortal];

  return useMemo(() => {
    const result = getMicroCopy(contextType, {
      ...options,
      portal: activePortal,
      deterministicIndex: options?.refreshKey,
    });

    return {
      ...result,
      colors: portalConfig,
    };
  }, [contextType, options?.customTemplate, options?.childName, options?.refreshKey, activePortal, portalConfig]);
}

/**
 * PositiveMicroCopy — Component for displaying positive micro-copy
 * 
 * Features:
 * - Portal-aware styling
 * - Animated appearance
 * - Multiple display variants
 * - Emoji support
 * - Child-specific copy
 * - Deterministic or random selection
 * 
 * Usage:
 * ```tsx
 * <PositiveMicroCopy context="success" childName="Emma" />
 * ```
 */
export interface PositiveMicroCopyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Micro-copy context type */
  contextType?: MicroCopyContextType;
  /** Portal override */
  portal?: PortalType;
  /** Custom message template */
  customMessage?: string;
  /** Child name for placeholders */
  childName?: string;
  /** Display variant */
  variant?: 'inline' | 'card' | 'toast' | 'banner' | 'tooltip';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show emoji */
  showEmoji?: boolean;
  /** Animate appearance */
  animate?: boolean;
  /** Animation type */
  animationType?: 'fade' | 'slide' | 'pop' | 'bounce';
  /** Deterministic index (for testing) */
  deterministicIndex?: number;
  /** Auto-refresh interval (ms) */
  refreshInterval?: number;
  /** Custom colors */
  customColors?: {
    primary?: string;
    accent?: string;
  };
}

export function PositiveMicroCopy({
  className,
  contextType = 'encouragement',
  portal,
  customMessage,
  childName,
  variant = 'inline',
  size = 'md',
  showEmoji = true,
  animate = true,
  animationType = 'fade',
  deterministicIndex,
  refreshInterval,
  customColors,
  ...props
}: PositiveMicroCopyProps) {
  const contextPortal = useMicroCopyPortal();
  const activePortal = portal || contextPortal;
  const portalConfig = PORTAL_MICRO_COPY_CONFIG[activePortal];

  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-refresh effect
  useEffect(() => {
    if (refreshInterval) {
      const interval = setInterval(() => {
        setRefreshKey(prev => prev + 1);
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  // Get micro-copy
  const { message, emoji } = useMemo(() => {
    if (customMessage) {
      return {
        message: childName ? customMessage.replace('{name}', childName) : customMessage,
        emoji: portalConfig.emojiSet[0],
      };
    }
    return getMicroCopy(contextType, {
      childName,
      deterministicIndex: deterministicIndex ?? refreshKey,
      portal: activePortal,
    });
  }, [customMessage, childName, contextType, deterministicIndex, refreshKey, activePortal, portalConfig]);

  // Colors
  const primaryColor = customColors?.primary || portalConfig.primary;
  const accentColor = customColors?.accent || portalConfig.accent;

  // Size configurations
  const sizeConfig = {
    sm: { textClass: 'text-xs', emojiSize: 12, padding: 'py-1 px-2' },
    md: { textClass: 'text-sm', emojiSize: 14, padding: 'py-2 px-3' },
    lg: { textClass: 'text-base', emojiSize: 18, padding: 'py-3 px-4' },
  };

  const currentSize = sizeConfig[size];

  // Animation configurations
  const animationConfig = {
    fade: { initial: { opacity: 0 }, animate: { opacity: 1 } },
    slide: { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } },
    pop: { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 } },
    bounce: { initial: { opacity: 0, scale: 0.5 }, animate: { opacity: 1, scale: [1, 1.1, 1] } },
  };

  // Variant styles
  const variantStyles = {
    inline: 'inline-flex items-center gap-2',
    card: cn(
      'flex items-center gap-3 rounded-lg',
      currentSize.padding,
      'micro-copy-card'
    ),
    toast: cn(
      'flex items-center gap-3 rounded-xl shadow-lg',
      currentSize.padding,
      'micro-copy-toast'
    ),
    banner: cn(
      'flex items-center gap-3 rounded-lg w-full',
      currentSize.padding,
      'micro-copy-banner'
    ),
    tooltip: cn(
      'flex items-center gap-2 rounded-md px-2 py-1',
      'micro-copy-tooltip'
    ),
  };

  const content = (
    <>
      {showEmoji && (
        <span
          className="micro-copy-emoji"
          style={{ fontSize: currentSize.emojiSize }}
        >
          {emoji}
        </span>
      )}
      <span
        className={cn('micro-copy-message', currentSize.textClass)}
        style={{ color: variant === 'inline' ? primaryColor : 'inherit' }}
      >
        {message}
      </span>
    </>
  );

  // For inline variant, just return simple span
  if (variant === 'inline' && !animate) {
    return (
      <span
        data-slot="positive-micro-copy"
        data-portal={activePortal}
        data-context={contextType}
        className={cn(variantStyles.inline, className)}
        {...props}
      >
        {content}
      </span>
    );
  }

  // For animated variants
  return (
    <div
      data-slot="positive-micro-copy"
      data-portal={activePortal}
      data-context={contextType}
      data-variant={variant}
      className={cn(variantStyles[variant], className)}
      style={
        variant === 'card'
          ? {
              background: `${primaryColor}10`,
              borderLeft: `3px solid ${primaryColor}`,
            }
          : variant === 'toast'
          ? {
              background: 'white',
              boxShadow: `0 4px 20px ${primaryColor}20`,
            }
          : variant === 'banner'
          ? {
              background: `linear-gradient(90deg, ${primaryColor}10, ${accentColor}10)`,
            }
          : variant === 'tooltip'
          ? {
              background: primaryColor,
              color: 'white',
            }
          : undefined
      }
      {...props}
    >
      {content}
    </div>
  );
}

/**
 * PositiveMicroCopyStyles — CSS styles for micro-copy components
 */
export function PositiveMicroCopyStyles() {
  return (
    <style jsx global>{`
      .micro-copy-card {
        backdrop-filter: blur(8px);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .micro-copy-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      }

      .dark .micro-copy-card {
        background: rgba(124, 58, 237, 0.1);
        border-left-color: rgba(124, 58, 237, 0.8);
      }

      .micro-copy-toast {
        backdrop-filter: blur(10px);
      }

      .dark .micro-copy-toast {
        background: rgba(30, 41, 59, 0.9);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      }

      .micro-copy-banner {
        background-size: 200% 100%;
        animation: banner-shimmer 3s ease-in-out infinite;
      }

      @keyframes banner-shimmer {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }

      .micro-copy-tooltip {
        pointer-events: none;
        animation: tooltip-appear 0.2s ease-out forwards;
      }

      @keyframes tooltip-appear {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .micro-copy-emoji {
        display: inline-flex;
        align-items: center;
        animation: emoji-pop 0.3s ease-out forwards;
      }

      @keyframes emoji-pop {
        0% { transform: scale(0.8); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }

      .micro-copy-message {
        font-weight: 500;
      }
    `}</style>
  );
}

// ── Preset Micro-Copy Components ──

/**
 * SuccessMicroCopy — Success context micro-copy
 */
export function SuccessMicroCopy({
  portal,
  childName,
  variant,
  className,
}: {
  portal?: PortalType;
  childName?: string;
  variant?: 'inline' | 'card' | 'toast';
  className?: string;
}) {
  return (
    <PositiveMicroCopy
      contextType="success"
      portal={portal}
      childName={childName}
      variant={variant || 'card'}
      size="md"
      className={className}
    />
  );
}

/**
 * ProgressMicroCopy — Progress context micro-copy
 */
export function ProgressMicroCopy({
  portal,
  childName,
  variant,
  className,
}: {
  portal?: PortalType;
  childName?: string;
  variant?: 'inline' | 'card' | 'banner';
  className?: string;
}) {
  return (
    <PositiveMicroCopy
      contextType="progress"
      portal={portal}
      childName={childName}
      variant={variant || 'inline'}
      size="sm"
      className={className}
    />
  );
}

/**
 * ChildMorningMicroCopy — Morning check-in for child
 */
export function ChildMorningMicroCopy({
  childName,
  portal,
  className,
}: {
  childName: string;
  portal?: PortalType;
  className?: string;
}) {
  const { message, emoji } = getChildMicroCopy('morningCheckIn', childName);

  return (
    <PositiveMicroCopy
      portal={portal || 'parent'}
      customMessage={message}
      showEmoji={false}
      variant="banner"
      size="md"
      className={className}
    />
  );
}

/**
 * ChildMilestoneMicroCopy — Milestone achieved for child
 */
export function ChildMilestoneMicroCopy({
  childName,
  portal,
  variant,
  className,
}: {
  childName: string;
  portal?: PortalType;
  variant?: 'card' | 'toast' | 'banner';
  className?: string;
}) {
  const { message } = getChildMicroCopy('milestoneAchieved', childName);

  return (
    <PositiveMicroCopy
      contextType="milestone"
      portal={portal || 'parent'}
      customMessage={message}
      variant={variant || 'card'}
      size="lg"
      className={className}
    />
  );
}

/**
 * ErrorRecoveryMicroCopy — Supportive error recovery message
 */
export function ErrorRecoveryMicroCopy({
  portal,
  variant,
  className,
}: {
  portal?: PortalType;
  variant?: 'inline' | 'card';
  className?: string;
}) {
  return (
    <PositiveMicroCopy
      contextType="errorRecovery"
      portal={portal}
      variant={variant || 'card'}
      size="md"
      className={className}
    />
  );
}

/**
 * LoadingMicroCopy — Encouraging loading message
 */
export function LoadingMicroCopy({
  portal,
  refreshInterval,
  className,
}: {
  portal?: PortalType;
  refreshInterval?: number;
  className?: string;
}) {
  return (
    <PositiveMicroCopy
      contextType="loading"
      portal={portal}
      variant="inline"
      size="sm"
      refreshInterval={refreshInterval || 3000}
      className={className}
    />
  );
}

/**
 * InsightMicroCopy — AI-generated insight message
 */
export function InsightMicroCopy({
  childName,
  portal,
  customMessage,
  className,
}: {
  childName?: string;
  portal?: PortalType;
  customMessage?: string;
  className?: string;
}) {
  return (
    <PositiveMicroCopy
      contextType="insight"
      portal={portal}
      childName={childName}
      customMessage={customMessage}
      variant="tooltip"
      size="sm"
      className={className}
    />
  );
}

// Export all
export {
  PORTAL_MICRO_COPY_CONFIG,
  MICRO_COPY_LIBRARY,
  CHILD_MICRO_COPY,
};

// Type exports
export type { MicroCopyContextType };