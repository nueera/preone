'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Portal Types ──
type PortalType = 'admin' | 'teacher' | 'parent';

// ── Mascot Empty State Portal Context ──
const MascotEmptyStatePortalContext = createContext<PortalType>('admin');

/**
 * Hook to get the current portal context for mascot empty state styling.
 */
export function useMascotEmptyStatePortal(): PortalType {
  return useContext(MascotEmptyStatePortalContext);
}

/**
 * Provider component to set portal context for nested mascot empty states.
 */
export function MascotEmptyStatePortalProvider({
  portal,
  children,
}: {
  portal: PortalType;
  children: React.ReactNode;
}) {
  return (
    <MascotEmptyStatePortalContext.Provider value={portal}>
      {children}
    </MascotEmptyStatePortalContext.Provider>
  );
}

// ── Portal Mascot Configurations ──
const PORTAL_MASCOT_CONFIG: Record<PortalType, {
  primary: string;
  secondary: string;
  tertiary: string;
  mascotName: string;
  mascotEmoji: string;
  mascotColor: string;
  gradientFrom: string;
  gradientTo: string;
}> = {
  admin: {
    primary: '#7C3AED',
    secondary: '#8B5CF6',
    tertiary: '#A78BFA',
    mascotName: 'Preo Admin',
    mascotEmoji: '🦊',
    mascotColor: '#7C3AED',
    gradientFrom: '#7C3AED',
    gradientTo: '#EC4899',
  },
  teacher: {
    primary: '#10B981',
    secondary: '#34D399',
    tertiary: '#6EE7B7',
    mascotName: 'Preo Teacher',
    mascotEmoji: '🌻',
    mascotColor: '#10B981',
    gradientFrom: '#10B981',
    gradientTo: '#0EA5E9',
  },
  parent: {
    primary: '#0EA5E9',
    secondary: '#38BDF8',
    tertiary: '#7DD3FC',
    mascotName: 'Preo Parent',
    mascotEmoji: '🌟',
    mascotColor: '#0EA5E9',
    gradientFrom: '#0EA5E9',
    gradientTo: '#10B981',
  },
};

// ── Empty State Scenarios ──
type EmptyStateScenario = 
  | 'no-data'
  | 'no-results'
  | 'no-children'
  | 'no-students'
  | 'no-classes'
  | 'no-teachers'
  | 'no-announcements'
  | 'no-messages'
  | 'no-activities'
  | 'no-fees'
  | 'no-attendance'
  | 'no-observations'
  | 'no-reports'
  | 'no-leads'
  | 'no-tasks'
  | 'no-notifications'
  | 'no-updates'
  | 'error'
  | 'coming-soon'
  | 'custom';

const SCENARIO_CONTENT: Record<EmptyStateScenario, {
  title: string;
  description: string;
  actionText: string;
  mascotMood: 'neutral' | 'curious' | 'helpful' | 'excited' | 'sad' | 'thinking';
}> = {
  'no-data': {
    title: 'Nothing here yet',
    description: 'Start adding data to see your progress grow!',
    actionText: 'Add First Item',
    mascotMood: 'curious',
  },
  'no-results': {
    title: 'No results found',
    description: 'Try adjusting your search or filters',
    actionText: 'Clear Filters',
    mascotMood: 'thinking',
  },
  'no-children': {
    title: 'No children linked',
    description: 'Link your child\'s profile to see their daily updates',
    actionText: 'Link Child',
    mascotMood: 'helpful',
  },
  'no-students': {
    title: 'No students yet',
    description: 'Add your first student to start tracking their journey',
    actionText: 'Add Student',
    mascotMood: 'excited',
  },
  'no-classes': {
    title: 'No classes created',
    description: 'Create classes to organize your students and teachers',
    actionText: 'Create Class',
    mascotMood: 'helpful',
  },
  'no-teachers': {
    title: 'No teachers added',
    description: 'Add teachers to assign them to classes',
    actionText: 'Add Teacher',
    mascotMood: 'curious',
  },
  'no-announcements': {
    title: 'No announcements',
    description: 'Share important updates with your community',
    actionText: 'Create Announcement',
    mascotMood: 'excited',
  },
  'no-messages': {
    title: 'No messages yet',
    description: 'Start a conversation with your community',
    actionText: 'Start Chat',
    mascotMood: 'helpful',
  },
  'no-activities': {
    title: 'No activities planned',
    description: 'Plan activities to engage your students',
    actionText: 'Add Activity',
    mascotMood: 'excited',
  },
  'no-fees': {
    title: 'No fee records',
    description: 'Track payments and invoices here',
    actionText: 'Add Fee Record',
    mascotMood: 'neutral',
  },
  'no-attendance': {
    title: 'No attendance data',
    description: 'Mark attendance to track student presence',
    actionText: 'Mark Attendance',
    mascotMood: 'curious',
  },
  'no-observations': {
    title: 'No observations',
    description: 'Record observations to track growth milestones',
    actionText: 'Add Observation',
    mascotMood: 'helpful',
  },
  'no-reports': {
    title: 'No reports generated',
    description: 'Generate reports to analyze performance',
    actionText: 'Generate Report',
    mascotMood: 'thinking',
  },
  'no-leads': {
    title: 'No leads yet',
    description: 'Add leads to track potential admissions',
    actionText: 'Add Lead',
    mascotMood: 'excited',
  },
  'no-tasks': {
    title: 'No tasks pending',
    description: 'Create tasks to stay organized',
    actionText: 'Add Task',
    mascotMood: 'curious',
  },
  'no-notifications': {
    title: 'All caught up!',
    description: 'No new notifications at this moment',
    actionText: '',
    mascotMood: 'excited',
  },
  'no-updates': {
    title: 'Waiting for updates',
    description: 'New updates will appear here when available',
    actionText: 'Refresh',
    mascotMood: 'curious',
  },
  'error': {
    title: 'Something went wrong',
    description: 'We couldn\'t load this content. Please try again.',
    actionText: 'Try Again',
    mascotMood: 'sad',
  },
  'coming-soon': {
    title: 'Coming Soon',
    description: 'This feature is being prepared for you!',
    actionText: '',
    mascotMood: 'excited',
  },
  'custom': {
    title: '',
    description: '',
    actionText: '',
    mascotMood: 'neutral',
  },
};

// ── Mascot Mood Animations ──
const MASCOT_MOOD_ANIMATIONS: Record<string, {
  float: { y: number[]; duration: number };
  rotate: number[];
  scale: number[];
}> = {
  neutral: {
    float: { y: [-5, 5], duration: 3 },
    rotate: [-2, 2],
    scale: [1, 1.02, 1],
  },
  curious: {
    float: { y: [-8, 8], duration: 2.5 },
    rotate: [-5, 5, -5],
    scale: [1, 1.05, 1],
  },
  helpful: {
    float: { y: [-4, 4], duration: 3.5 },
    rotate: [-3, 3],
    scale: [1, 1.03, 1],
  },
  excited: {
    float: { y: [-10, 10], duration: 1.5 },
    rotate: [-8, 8, -8],
    scale: [1, 1.1, 1],
  },
  sad: {
    float: { y: [-2, 2], duration: 4 },
    rotate: [-1, 1],
    scale: [0.98, 1, 0.98],
  },
  thinking: {
    float: { y: [-6, 6], duration: 3 },
    rotate: [-4, 4],
    scale: [1, 1.02, 1],
  },
};

/**
 * PortalMascotEmptyState — Portal-aware mascot empty state component
 * 
 * Features:
 * - Animated mascot character for each portal
 * - Pre-defined scenarios for common empty states
 * - Custom content support
 * - Mascot mood-based animations
 * - Optional action button
 * - GPU-optimized animations
 * - Portal-colored gradients
 * 
 * Usage:
 * ```tsx
 * <PortalMascotEmptyState portal="parent" scenario="no-children" />
 * ```
 */
export interface PortalMascotEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Portal override - defaults to context value */
  portal?: PortalType;
  /** Empty state scenario */
  scenario?: EmptyStateScenario;
  /** Custom title (overrides scenario) */
  customTitle?: string;
  /** Custom description (overrides scenario) */
  customDescription?: string;
  /** Custom action button */
  customAction?: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show mascot */
  showMascot?: boolean;
  /** Custom mascot emoji */
  customMascot?: string;
  /** Custom mascot mood */
  customMood?: 'neutral' | 'curious' | 'helpful' | 'excited' | 'sad' | 'thinking';
  /** Action button click handler */
  onActionClick?: () => void;
  /** Show background gradient */
  showBackground?: boolean;
  /** Animation enabled */
  animate?: boolean;
}

export function PortalMascotEmptyState({
  className,
  portal,
  scenario = 'no-data',
  customTitle,
  customDescription,
  customAction,
  size = 'md',
  showMascot = true,
  customMascot,
  customMood,
  onActionClick,
  showBackground = true,
  animate = true,
  ...props
}: PortalMascotEmptyStateProps) {
  const contextPortal = useMascotEmptyStatePortal();
  const activePortal = portal || contextPortal;
  const config = PORTAL_MASCOT_CONFIG[activePortal];
  
  const [isHovered, setIsHovered] = useState(false);

  // Get content based on scenario
  const scenarioContent = SCENARIO_CONTENT[scenario];
  const title = customTitle || scenarioContent.title;
  const description = customDescription || scenarioContent.description;
  const mascotMood = customMood || scenarioContent.mascotMood;
  const moodAnimation = MASCOT_MOOD_ANIMATIONS[mascotMood];

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'py-8 px-4',
      mascotSize: 60,
      titleClass: 'text-base font-medium',
      descClass: 'text-sm',
      actionSize: 'sm',
    },
    md: {
      container: 'py-12 px-6',
      mascotSize: 80,
      titleClass: 'text-lg font-semibold',
      descClass: 'text-sm',
      actionSize: 'default',
    },
    lg: {
      container: 'py-16 px-8',
      mascotSize: 100,
      titleClass: 'text-xl font-semibold',
      descClass: 'text-base',
      actionSize: 'lg',
    },
    xl: {
      container: 'py-20 px-10',
      mascotSize: 120,
      titleClass: 'text-2xl font-bold',
      descClass: 'text-lg',
      actionSize: 'lg',
    },
  };

  const currentSize = sizeConfig[size];
  const mascotEmoji = customMascot || config.mascotEmoji;

  return (
    <div
      data-slot="portal-mascot-empty-state"
      data-portal={activePortal}
      data-scenario={scenario}
      data-mood={mascotMood}
      className={cn(
        'relative flex flex-col items-center justify-center text-center',
        currentSize.container,
        showBackground && 'mascot-empty-state-bg',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {/* Mascot Character */}
      {showMascot && (
        <motion.div
          className="mascot-character-container relative mb-6"
          style={{
            width: currentSize.mascotSize,
            height: currentSize.mascotSize,
          }}
          animate={animate ? {
            y: moodAnimation.float.y,
            rotate: isHovered ? moodAnimation.rotate.map(r => r * 1.5) : moodAnimation.rotate,
            scale: isHovered ? moodAnimation.scale.map(s => s * 1.1) : moodAnimation.scale,
          } : {}}
          transition={{
            y: {
              duration: moodAnimation.float.duration,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            },
            rotate: {
              duration: moodAnimation.float.duration * 0.8,
              repeat: Infinity,
              repeatType: 'mirror',
              ease: 'easeInOut',
            },
            scale: {
              duration: moodAnimation.float.duration * 1.2,
              repeat: Infinity,
              repeatType: 'mirror',
              ease: 'easeInOut',
            },
          }}
        >
          {/* Mascot Glow */}
          <div
            className="mascot-glow absolute inset-0 rounded-full opacity-30"
            style={{
              background: `radial-gradient(circle, ${config.primary}40 0%, transparent 70%)`,
              filter: 'blur(10px)',
            }}
          />
          
          {/* Mascot Avatar */}
          <div
            className="mascot-avatar relative flex items-center justify-center rounded-full"
            style={{
              width: currentSize.mascotSize,
              height: currentSize.mascotSize,
              background: `linear-gradient(135deg, ${config.gradientFrom}20, ${config.gradientTo}30)`,
              border: `2px solid ${config.primary}40`,
            }}
          >
            <span 
              className="mascot-emoji"
              style={{ 
                fontSize: currentSize.mascotSize * 0.5,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
              }}
            >
              {mascotEmoji}
            </span>
          </div>

          {/* Mascot Accent Ring */}
          <motion.div
            className="mascot-accent-ring absolute inset-[-4px] rounded-full"
            style={{
              border: `1px solid ${config.primary}30`,
            }}
            animate={animate ? {
              scale: [1, 1.05, 1],
              opacity: [0.3, 0.5, 0.3],
            } : {}}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
      )}

      {/* Mascot Name Tag */}
      {showMascot && (
        <motion.div
          className="mascot-name-tag mb-4 px-3 py-1 rounded-full"
          style={{
            background: `${config.primary}15`,
            border: `1px solid ${config.primary}30`,
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <span 
            className="text-xs font-medium"
            style={{ color: config.primary }}
          >
            {config.mascotName}
          </span>
        </motion.div>
      )}

      {/* Title */}
      <motion.h3
        className={cn('mascot-title', currentSize.titleClass)}
        style={{ color: 'var(--text-primary)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          className={cn('mascot-description mt-2 max-w-md', currentSize.descClass)}
          style={{ color: 'var(--text-secondary)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          {description}
        </motion.p>
      )}

      {/* Action Button */}
      {(customAction || (scenarioContent.actionText && onActionClick)) && (
        <motion.div
          className="mascot-action mt-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {customAction || (
            <motion.button
              onClick={onActionClick}
              className="mascot-action-btn px-4 py-2 rounded-lg font-medium transition-all"
              style={{
                background: `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo})`,
                color: 'white',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {scenarioContent.actionText}
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Decorative Elements */}
      <motion.div
        className="mascot-sparkle absolute"
        style={{
          top: '15%',
          left: '20%',
          color: config.primary,
        }}
        animate={animate ? {
          opacity: [0, 0.6, 0],
          scale: [0.5, 1, 0.5],
        } : { opacity: 0.4 }}
        transition={{
          duration: 2,
          repeat: Infinity,
          delay: 0,
        }}
      >
        ✦
      </motion.div>
      
      <motion.div
        className="mascot-sparkle absolute"
        style={{
          top: '25%',
          right: '25%',
          color: config.secondary,
        }}
        animate={animate ? {
          opacity: [0, 0.5, 0],
          scale: [0.6, 1.2, 0.6],
        } : { opacity: 0.3 }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          delay: 0.5,
        }}
      >
        ✧
      </motion.div>
    </div>
  );
}

/**
 * PortalMascotEmptyStateStyles — CSS styles for mascot empty states
 */
export function PortalMascotEmptyStateStyles() {
  return (
    <style jsx global>{`
      .mascot-empty-state-bg {
        background: radial-gradient(
          ellipse at center,
          var(--portal-50) 0%,
          transparent 70%
        );
      }

      .mascot-character-container {
        will-change: transform;
      }

      .mascot-avatar {
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      }

      .mascot-emoji {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .mascot-action-btn {
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        transition: box-shadow 0.2s ease;
      }

      .mascot-action-btn:hover {
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      }

      .mascot-sparkle {
        font-size: 16px;
        pointer-events: none;
      }

      /* Dark mode adjustments */
      .dark .mascot-avatar {
        background: linear-gradient(135deg, 
          rgba(124, 58, 237, 0.15), 
          rgba(236, 72, 153, 0.2)
        );
        border-color: rgba(124, 58, 237, 0.3);
      }

      .dark .mascot-empty-state-bg {
        background: radial-gradient(
          ellipse at center,
          rgba(124, 58, 237, 0.05) 0%,
          transparent 70%
        );
      }
    `}</style>
  );
}

// ── Preset Components for Common Scenarios ──

/**
 * NoChildrenEmptyState — Parent portal empty state for no linked children
 */
export function NoChildrenEmptyState({
  onLinkChild,
  className,
}: {
  onLinkChild?: () => void;
  className?: string;
}) {
  return (
    <PortalMascotEmptyState
      portal="parent"
      scenario="no-children"
      onActionClick={onLinkChild}
      className={className}
    />
  );
}

/**
 * NoStudentsEmptyState — Admin portal empty state for no students
 */
export function NoStudentsEmptyState({
  onAddStudent,
  className,
}: {
  onAddStudent?: () => void;
  className?: string;
}) {
  return (
    <PortalMascotEmptyState
      portal="admin"
      scenario="no-students"
      onActionClick={onAddStudent}
      className={className}
    />
  );
}

/**
 * NoNotificationsEmptyState — Generic empty state for no notifications
 */
export function NoNotificationsEmptyState({
  portal,
  className,
}: {
  portal?: PortalType;
  className?: string;
}) {
  return (
    <PortalMascotEmptyState
      portal={portal}
      scenario="no-notifications"
      size="sm"
      showBackground={false}
      className={className}
    />
  );
}

/**
 * ComingSoonEmptyState — Coming soon placeholder
 */
export function ComingSoonEmptyState({
  portal,
  customTitle,
  className,
}: {
  portal?: PortalType;
  customTitle?: string;
  className?: string;
}) {
  return (
    <PortalMascotEmptyState
      portal={portal}
      scenario="coming-soon"
      customTitle={customTitle}
      size="lg"
      className={className}
    />
  );
}

/**
 * ErrorEmptyState — Error/failed state
 */
export function ErrorEmptyState({
  portal,
  onRetry,
  customDescription,
  className,
}: {
  portal?: PortalType;
  onRetry?: () => void;
  customDescription?: string;
  className?: string;
}) {
  return (
    <PortalMascotEmptyState
      portal={portal}
      scenario="error"
      customDescription={customDescription}
      onActionClick={onRetry}
      size="md"
      className={className}
    />
  );
}

// Export all
export { PORTAL_MASCOT_CONFIG, SCENARIO_CONTENT, MASCOT_MOOD_ANIMATIONS };