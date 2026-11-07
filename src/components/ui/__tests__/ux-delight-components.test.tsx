import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// Helper to get element by data-slot
function getBySlot(slotName: string): HTMLElement {
  return document.querySelector(`[data-slot="${slotName}"]`) as HTMLElement;
}

// ── Portal Mascot Empty State Tests ──
import {
  PortalMascotEmptyState,
  MascotEmptyStatePortalProvider,
  NoChildrenEmptyState,
  NoStudentsEmptyState,
  NoNotificationsEmptyState,
  ComingSoonEmptyState,
  ErrorEmptyState,
  PORTAL_MASCOT_CONFIG,
} from '../portal-mascot-empty-state';

describe('PortalMascotEmptyState', () => {
  describe('Basic Rendering', () => {
    it('renders with default portal (admin)', () => {
      render(<PortalMascotEmptyState scenario="no-data" />);
      
      const element = getBySlot('portal-mascot-empty-state');
      expect(element).toBeDefined();
      expect(element?.getAttribute('data-portal')).toBe('admin');
    });

    it('renders with specified portal', () => {
      render(<PortalMascotEmptyState portal="teacher" scenario="no-data" />);
      
      const element = getBySlot('portal-mascot-empty-state');
      expect(element?.getAttribute('data-portal')).toBe('teacher');
    });

    it('renders with parent portal', () => {
      render(<PortalMascotEmptyState portal="parent" scenario="no-data" />);
      
      const element = getBySlot('portal-mascot-empty-state');
      expect(element?.getAttribute('data-portal')).toBe('parent');
    });

    it('uses context portal when not specified', () => {
      render(
        <MascotEmptyStatePortalProvider portal="parent">
          <PortalMascotEmptyState scenario="no-data" />
        </MascotEmptyStatePortalProvider>
      );
      
      const element = getBySlot('portal-mascot-empty-state');
      expect(element?.getAttribute('data-portal')).toBe('parent');
    });

    it('portal prop overrides context portal', () => {
      render(
        <MascotEmptyStatePortalProvider portal="admin">
          <PortalMascotEmptyState portal="teacher" scenario="no-data" />
        </MascotEmptyStatePortalProvider>
      );
      
      const element = getBySlot('portal-mascot-empty-state');
      expect(element?.getAttribute('data-portal')).toBe('teacher');
    });
  });

  describe('Scenario Content', () => {
    it('renders no-data scenario content', () => {
      render(<PortalMascotEmptyState portal="admin" scenario="no-data" />);
      
      expect(screen.getByText('Nothing here yet')).toBeDefined();
      expect(screen.getByText('Start adding data to see your progress grow!')).toBeDefined();
    });

    it('renders no-results scenario content', () => {
      render(<PortalMascotEmptyState portal="admin" scenario="no-results" />);
      
      expect(screen.getByText('No results found')).toBeDefined();
    });

    it('renders no-children scenario content', () => {
      render(<PortalMascotEmptyState portal="parent" scenario="no-children" />);
      
      expect(screen.getByText('No children linked')).toBeDefined();
    });

    it('renders no-students scenario content', () => {
      render(<PortalMascotEmptyState portal="admin" scenario="no-students" />);
      
      expect(screen.getByText('No students yet')).toBeDefined();
    });

    it('renders error scenario content', () => {
      render(<PortalMascotEmptyState portal="admin" scenario="error" />);
      
      expect(screen.getByText('Something went wrong')).toBeDefined();
    });

    it('renders coming-soon scenario content', () => {
      render(<PortalMascotEmptyState portal="admin" scenario="coming-soon" />);
      
      expect(screen.getByText('Coming Soon')).toBeDefined();
    });

    it('renders custom title and description', () => {
      render(
        <PortalMascotEmptyState
          portal="admin"
          scenario="custom"
          customTitle="My Custom Title"
          customDescription="My custom description"
        />
      );
      
      expect(screen.getByText('My Custom Title')).toBeDefined();
      expect(screen.getByText('My custom description')).toBeDefined();
    });
  });

  describe('Mascot Display', () => {
    it('shows mascot by default', () => {
      render(<PortalMascotEmptyState portal="admin" scenario="no-data" />);
      
      expect(screen.getByText('🦊')).toBeDefined();
    });

    it('hides mascot when showMascot is false', () => {
      render(<PortalMascotEmptyState portal="admin" scenario="no-data" showMascot={false} />);
      
      expect(screen.queryByText('🦊')).toBeNull();
    });

    it('shows custom mascot emoji', () => {
      render(<PortalMascotEmptyState portal="admin" scenario="no-data" customMascot="🎯" />);
      
      expect(screen.getByText('🎯')).toBeDefined();
    });

    it('shows correct mascot for each portal', () => {
      const { rerender } = render(<PortalMascotEmptyState portal="admin" scenario="no-data" />);
      expect(screen.getByText(PORTAL_MASCOT_CONFIG.admin.mascotEmoji)).toBeDefined();
      
      rerender(<PortalMascotEmptyState portal="teacher" scenario="no-data" />);
      expect(screen.getByText(PORTAL_MASCOT_CONFIG.teacher.mascotEmoji)).toBeDefined();
      
      rerender(<PortalMascotEmptyState portal="parent" scenario="no-data" />);
      expect(screen.getByText(PORTAL_MASCOT_CONFIG.parent.mascotEmoji)).toBeDefined();
    });
  });

  describe('Action Button', () => {
    it('shows action button when onActionClick provided', () => {
      const handleClick = vi.fn();
      render(<PortalMascotEmptyState portal="admin" scenario="no-data" onActionClick={handleClick} />);
      
      expect(screen.getByText('Add First Item')).toBeDefined();
    });

    it('calls onActionClick when button clicked', async () => {
      const handleClick = vi.fn();
      render(<PortalMascotEmptyState portal="admin" scenario="no-students" onActionClick={handleClick} />);
      
      await userEvent.click(screen.getByText('Add Student'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders custom action button', () => {
      render(
        <PortalMascotEmptyState
          portal="admin"
          scenario="no-data"
          customAction={<button>Custom Action</button>}
        />
      );
      
      expect(screen.getByText('Custom Action')).toBeDefined();
    });
  });

  describe('Size Variants', () => {
    it('renders with different sizes', () => {
      const { container } = render(<PortalMascotEmptyState portal="admin" scenario="no-data" size="sm" />);
      expect(container.firstChild).toBeDefined();
    });
  });

  describe('Mood-based Attributes', () => {
    it('sets correct mood attribute', () => {
      render(<PortalMascotEmptyState portal="admin" scenario="no-data" />);
      
      const element = getBySlot('portal-mascot-empty-state');
      expect(element?.getAttribute('data-mood')).toBe('curious');
    });

    it('sets sad mood for error scenario', () => {
      render(<PortalMascotEmptyState portal="admin" scenario="error" />);
      
      const element = getBySlot('portal-mascot-empty-state');
      expect(element?.getAttribute('data-mood')).toBe('sad');
    });

    it('accepts custom mood', () => {
      render(<PortalMascotEmptyState portal="admin" scenario="no-data" customMood="excited" />);
      
      const element = getBySlot('portal-mascot-empty-state');
      expect(element?.getAttribute('data-mood')).toBe('excited');
    });
  });
});

describe('Preset Empty State Components', () => {
  it('NoChildrenEmptyState renders correctly', () => {
    render(<NoChildrenEmptyState />);
    
    const element = getBySlot('portal-mascot-empty-state');
    expect(element?.getAttribute('data-portal')).toBe('parent');
    expect(screen.getByText('No children linked')).toBeDefined();
  });

  it('NoStudentsEmptyState renders correctly', () => {
    render(<NoStudentsEmptyState />);
    
    const element = getBySlot('portal-mascot-empty-state');
    expect(element?.getAttribute('data-portal')).toBe('admin');
    expect(screen.getByText('No students yet')).toBeDefined();
  });

  it('NoNotificationsEmptyState renders correctly', () => {
    render(<NoNotificationsEmptyState portal="admin" />);
    
    expect(screen.getByText('All caught up!')).toBeDefined();
  });

  it('ComingSoonEmptyState renders correctly', () => {
    render(<ComingSoonEmptyState portal="teacher" />);
    
    expect(screen.getByText('Coming Soon')).toBeDefined();
  });

  it('ErrorEmptyState renders correctly', () => {
    render(<ErrorEmptyState portal="admin" />);
    
    expect(screen.getByText('Something went wrong')).toBeDefined();
  });
});

// ── Time-of-Day Banner Tests ──
import {
  TimeOfDayBanner,
  WelcomeBannerPortalProvider,
  DashboardWelcomeBanner,
  InlineWelcomeBanner,
  HeroWelcomeBanner,
  getTimePeriod,
  TIME_PERIOD_CONFIG,
} from '../time-of-day-banner';

describe('TimeOfDayBanner', () => {
  describe('Time Period Detection', () => {
    it('returns morning for hours 5-11', () => {
      expect(getTimePeriod(5)).toBe('morning');
      expect(getTimePeriod(8)).toBe('morning');
      expect(getTimePeriod(11)).toBe('morning');
    });

    it('returns afternoon for hours 12-16', () => {
      expect(getTimePeriod(12)).toBe('afternoon');
      expect(getTimePeriod(15)).toBe('afternoon');
      expect(getTimePeriod(16)).toBe('afternoon');
    });

    it('returns evening for hours 17-20', () => {
      expect(getTimePeriod(17)).toBe('evening');
      expect(getTimePeriod(19)).toBe('evening');
      expect(getTimePeriod(20)).toBe('evening');
    });

    it('returns night for hours 21-4', () => {
      expect(getTimePeriod(21)).toBe('night');
      expect(getTimePeriod(23)).toBe('night');
      expect(getTimePeriod(0)).toBe('night');
      expect(getTimePeriod(4)).toBe('night');
    });
  });

  describe('Basic Rendering', () => {
    it('renders with default portal', () => {
      render(<TimeOfDayBanner />);
      
      const element = getBySlot('time-of-day-banner');
      expect(element).toBeDefined();
      expect(element?.getAttribute('data-portal')).toBe('admin');
    });

    it('renders with specified portal', () => {
      render(<TimeOfDayBanner portal="teacher" />);
      
      const element = getBySlot('time-of-day-banner');
      expect(element?.getAttribute('data-portal')).toBe('teacher');
    });

    it('uses context portal', () => {
      render(
        <WelcomeBannerPortalProvider portal="parent">
          <TimeOfDayBanner />
        </WelcomeBannerPortalProvider>
      );
      
      const element = getBySlot('time-of-day-banner');
      expect(element?.getAttribute('data-portal')).toBe('parent');
    });
  });

  describe('Greeting Content', () => {
    it('shows morning greeting when overrideTimePeriod is morning', () => {
      render(<TimeOfDayBanner overrideTimePeriod="morning" />);
      
      expect(screen.getByText(/Good Morning/)).toBeDefined();
    });

    it('shows afternoon greeting when overrideTimePeriod is afternoon', () => {
      render(<TimeOfDayBanner overrideTimePeriod="afternoon" />);
      
      expect(screen.getByText(/Good Afternoon/)).toBeDefined();
    });

    it('includes user name in greeting', () => {
      render(<TimeOfDayBanner userName="Sarah" overrideTimePeriod="morning" />);
      
      expect(screen.getByText(/Good Morning, Sarah!/)).toBeDefined();
    });

    it('shows custom message', () => {
      render(<TimeOfDayBanner customMessage="Welcome to PreOne!" overrideTimePeriod="morning" />);
      
      expect(screen.getByText('Welcome to PreOne!')).toBeDefined();
    });

    it('shows custom description', () => {
      render(<TimeOfDayBanner customDescription="Have a productive day!" overrideTimePeriod="morning" />);
      
      expect(screen.getByText('Have a productive day!')).toBeDefined();
    });
  });

  describe('Emoji Display', () => {
    it('shows emoji by default', () => {
      render(<TimeOfDayBanner overrideTimePeriod="morning" />);
      
      expect(screen.getByText('☀️')).toBeDefined();
    });

    it('hides emoji when showEmoji is false', () => {
      render(<TimeOfDayBanner overrideTimePeriod="morning" showEmoji={false} />);
      
      expect(screen.queryByText('☀️')).toBeNull();
    });
  });

  describe('Action Button', () => {
    it('shows action button when showAction and onAction provided', () => {
      const handleAction = vi.fn();
      render(<TimeOfDayBanner showAction onAction={handleAction} actionText="Get Started" />);
      
      expect(screen.getByText('Get Started')).toBeDefined();
    });

    it('calls onAction when button clicked', async () => {
      const handleAction = vi.fn();
      render(<TimeOfDayBanner showAction onAction={handleAction} />);
      
      await userEvent.click(screen.getByText('View Dashboard'));
      expect(handleAction).toHaveBeenCalled();
    });
  });

  describe('Dismiss Functionality', () => {
    it('shows dismiss button when dismissible', () => {
      render(<TimeOfDayBanner dismissible />);
      
      expect(screen.getByText('✕')).toBeDefined();
    });

    it('hides banner after dismiss', async () => {
      render(<TimeOfDayBanner dismissible />);
      
      await userEvent.click(screen.getByText('✕'));
      
      await waitFor(() => {
        expect(document.querySelector('[data-slot="time-of-day-banner"]')).toBeNull();
      });
    });
  });

  describe('Style Variants', () => {
    it('renders different styles', () => {
      const { container } = render(<TimeOfDayBanner style="gradient" />);
      expect(container.firstChild).toBeDefined();
    });
  });

  describe('Data Attributes', () => {
    it('sets correct time-period attribute', () => {
      render(<TimeOfDayBanner overrideTimePeriod="morning" />);
      
      const element = getBySlot('time-of-day-banner');
      expect(element?.getAttribute('data-time-period')).toBe('morning');
    });

    it('sets correct style attribute', () => {
      render(<TimeOfDayBanner style="hero" />);
      
      const element = getBySlot('time-of-day-banner');
      expect(element?.getAttribute('data-style')).toBe('hero');
    });
  });
});

describe('Preset Welcome Banner Components', () => {
  it('DashboardWelcomeBanner renders correctly', () => {
    render(<DashboardWelcomeBanner userName="Admin" />);
    
    expect(screen.getByText(/Good/)).toBeDefined();
  });

  it('InlineWelcomeBanner renders correctly', () => {
    render(<InlineWelcomeBanner userName="Teacher" />);
    
    expect(screen.getByText(/Good/)).toBeDefined();
  });

  it('HeroWelcomeBanner renders correctly', () => {
    render(<HeroWelcomeBanner userName="Parent" customMessage="Welcome to PreOne!" />);
    
    expect(screen.getByText('Welcome to PreOne!')).toBeDefined();
  });
});

// ── Achievement Unlock Animation Tests ──
import {
  AchievementUnlockAnimation,
  AchievementUnlockPortalProvider,
  AchievementBadge,
  MilestoneAchievement,
  GrowthAchievement,
  AttendanceAchievement,
  LegendaryAchievement,
  TIER_CONFIG,
  CATEGORY_ICONS,
} from '../achievement-unlock-animation';

describe('AchievementUnlockAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Rendering', () => {
    it('does not render when trigger is false', () => {
      render(<AchievementUnlockAnimation title="First Steps" trigger={false} />);
      
      expect(document.querySelector('[data-slot="achievement-unlock-animation"]')).toBeNull();
    });

    it('renders when trigger is true', () => {
      render(<AchievementUnlockAnimation title="First Steps" trigger={true} autoDismiss={false} />);
      
      expect(getBySlot('achievement-unlock-animation')).toBeDefined();
    });

    it('uses correct portal attribute', () => {
      render(<AchievementUnlockAnimation title="Test" portal="teacher" trigger={true} autoDismiss={false} />);
      
      const element = getBySlot('achievement-unlock-animation');
      expect(element?.getAttribute('data-portal')).toBe('teacher');
    });

    it('uses context portal', () => {
      render(
        <AchievementUnlockPortalProvider portal="parent">
          <AchievementUnlockAnimation title="Test" trigger={true} autoDismiss={false} />
        </AchievementUnlockPortalProvider>
      );
      
      const element = getBySlot('achievement-unlock-animation');
      expect(element?.getAttribute('data-portal')).toBe('parent');
    });
  });

  describe('Content Rendering', () => {
    it('shows achievement title', () => {
      render(<AchievementUnlockAnimation title="Amazing Achievement" trigger={true} autoDismiss={false} />);
      
      expect(screen.getByText('Amazing Achievement')).toBeDefined();
    });

    it('shows achievement description', () => {
      render(
        <AchievementUnlockAnimation
          title="Test"
          description="You did something amazing!"
          trigger={true}
          autoDismiss={false}
        />
      );
      
      expect(screen.getByText('You did something amazing!')).toBeDefined();
    });

    it('shows points display', () => {
      render(<AchievementUnlockAnimation title="Test" points={100} trigger={true} autoDismiss={false} />);
      
      expect(screen.getByText('+100 XP')).toBeDefined();
    });

    it('shows category badge', () => {
      render(<AchievementUnlockAnimation title="Test" category="growth" trigger={true} autoDismiss={false} />);
      
      // Category is shown with icon and name together
      expect(screen.getByText(/Growth/)).toBeDefined();
    });
  });

  describe('Tier Configurations', () => {
    it('renders bronze tier badge', () => {
      render(<AchievementUnlockAnimation title="Test" tier="bronze" trigger={true} autoDismiss={false} />);
      
      expect(screen.getByText(TIER_CONFIG.bronze.badgeIcon)).toBeDefined();
    });

    it('renders gold tier badge', () => {
      render(<AchievementUnlockAnimation title="Test" tier="gold" trigger={true} autoDismiss={false} />);
      
      expect(screen.getByText(TIER_CONFIG.gold.badgeIcon)).toBeDefined();
    });

    it('renders legendary tier badge', () => {
      render(<AchievementUnlockAnimation title="Test" tier="legendary" trigger={true} autoDismiss={false} />);
      
      expect(screen.getByText(TIER_CONFIG.legendary.badgeIcon)).toBeDefined();
    });

    it('sets correct tier attribute', () => {
      render(<AchievementUnlockAnimation title="Test" tier="gold" trigger={true} autoDismiss={false} />);
      
      const element = getBySlot('achievement-unlock-animation');
      expect(element?.getAttribute('data-tier')).toBe('gold');
    });
  });

  describe('Auto-Dismiss', () => {
    it('does not auto-dismiss when autoDismiss is false', () => {
      render(<AchievementUnlockAnimation title="Test" trigger={true} autoDismiss={false} duration="quick" />);
      
      vi.advanceTimersByTime(1500);
      
      expect(getBySlot('achievement-unlock-animation')).toBeDefined();
    });
  });

  describe('Data Attributes', () => {
    it('sets correct category attribute', () => {
      render(<AchievementUnlockAnimation title="Test" category="milestone" trigger={true} autoDismiss={false} />);
      
      const element = getBySlot('achievement-unlock-animation');
      expect(element?.getAttribute('data-category')).toBe('milestone');
    });

    it('sets correct variant attribute', () => {
      render(<AchievementUnlockAnimation title="Test" variant="trophy" trigger={true} autoDismiss={false} />);
      
      const element = getBySlot('achievement-unlock-animation');
      expect(element?.getAttribute('data-variant')).toBe('trophy');
    });
  });
});

describe('AchievementBadge (Static)', () => {
  it('renders static badge', () => {
    render(<AchievementBadge tier="gold" />);
    
    expect(screen.getByText(TIER_CONFIG.gold.badgeIcon)).toBeDefined();
  });

  it('renders with different sizes', () => {
    const { container } = render(<AchievementBadge tier="gold" size="sm" />);
    expect(container.firstChild).toBeDefined();
  });

  it('renders with title', () => {
    render(<AchievementBadge tier="gold" title="First Steps" />);
    
    expect(screen.getByText('First Steps')).toBeDefined();
  });
});

describe('Preset Achievement Components', () => {
  it('MilestoneAchievement renders correctly', () => {
    render(<MilestoneAchievement trigger={true} title="First Milestone" autoDismiss={false} />);
    
    expect(screen.getByText('First Milestone')).toBeDefined();
    expect(getBySlot('achievement-unlock-animation')?.getAttribute('data-category')).toBe('milestone');
  });

  it('GrowthAchievement renders correctly', () => {
    render(<GrowthAchievement trigger={true} title="Growth Milestone" autoDismiss={false} />);
    
    expect(screen.getByText('Growth Milestone')).toBeDefined();
    expect(getBySlot('achievement-unlock-animation')?.getAttribute('data-category')).toBe('growth');
  });

  it('AttendanceAchievement renders correctly', () => {
    render(<AttendanceAchievement trigger={true} title="Perfect Attendance" daysAttended={30} autoDismiss={false} />);
    
    expect(screen.getByText('Perfect Attendance')).toBeDefined();
  });

  it('LegendaryAchievement renders correctly', () => {
    render(<LegendaryAchievement trigger={true} title="Legendary Achievement" autoDismiss={false} />);
    
    expect(screen.getByText('Legendary Achievement')).toBeDefined();
    expect(getBySlot('achievement-unlock-animation')?.getAttribute('data-tier')).toBe('legendary');
  });
});

// ── Positive Micro-Copy Tests ──
import {
  PositiveMicroCopy,
  MicroCopyPortalProvider,
  getMicroCopy,
  getChildMicroCopy,
  SuccessMicroCopy,
  ProgressMicroCopy,
  ChildMorningMicroCopy,
  ChildMilestoneMicroCopy,
  ErrorRecoveryMicroCopy,
  LoadingMicroCopy,
  MICRO_COPY_LIBRARY,
} from '../positive-micro-copy';

describe('PositiveMicroCopy', () => {
  describe('getMicroCopy Function', () => {
    it('returns message and emoji for success context', () => {
      const result = getMicroCopy('success');
      
      expect(result.message).toBeDefined();
      expect(result.emoji).toBeDefined();
      expect(MICRO_COPY_LIBRARY.success.templates.includes(result.message)).toBe(true);
    });

    it('returns deterministic message with index', () => {
      const result1 = getMicroCopy('success', { deterministicIndex: 0 });
      const result2 = getMicroCopy('success', { deterministicIndex: 0 });
      
      expect(result1.message).toBe(result2.message);
    });

    it('returns different messages with different indices', () => {
      const result1 = getMicroCopy('success', { deterministicIndex: 0 });
      const result2 = getMicroCopy('success', { deterministicIndex: 1 });
      
      expect(result1.message).not.toBe(result2.message);
    });

    it('replaces {name} placeholder with child name', () => {
      // Test with a context that has {name} placeholder
      const result = getChildMicroCopy('morningCheckIn', 'Emma');
      
      expect(result.message.includes('Emma')).toBe(true);
    });

    it('returns custom template when provided', () => {
      const result = getMicroCopy('success', { customTemplate: 'My custom message!' });
      
      expect(result.message).toBe('My custom message!');
    });
  });

  describe('getChildMicroCopy Function', () => {
    it('returns child-specific morning message', () => {
      const result = getChildMicroCopy('morningCheckIn', 'Emma');
      
      expect(result.message.includes('Emma')).toBe(true);
    });

    it('returns child-specific milestone message', () => {
      const result = getChildMicroCopy('milestoneAchieved', 'Lucas');
      
      expect(result.message.includes('Lucas')).toBe(true);
    });
  });

  describe('Component Rendering', () => {
    it('renders inline variant', () => {
      render(<PositiveMicroCopy contextType="success" />);
      
      expect(getBySlot('positive-micro-copy')).toBeDefined();
    });

    it('renders card variant', () => {
      render(<PositiveMicroCopy contextType="success" variant="card" />);
      
      expect(getBySlot('positive-micro-copy')).toBeDefined();
    });

    it('renders toast variant', () => {
      render(<PositiveMicroCopy contextType="success" variant="toast" />);
      
      expect(getBySlot('positive-micro-copy')).toBeDefined();
    });

    it('renders banner variant', () => {
      render(<PositiveMicroCopy contextType="progress" variant="banner" />);
      
      expect(getBySlot('positive-micro-copy')).toBeDefined();
    });
  });

  describe('Portal Support', () => {
    it('uses admin portal by default', () => {
      render(<PositiveMicroCopy contextType="success" />);
      
      const element = getBySlot('positive-micro-copy');
      expect(element?.getAttribute('data-portal')).toBe('admin');
    });

    it('uses specified portal', () => {
      render(<PositiveMicroCopy contextType="success" portal="teacher" />);
      
      const element = getBySlot('positive-micro-copy');
      expect(element?.getAttribute('data-portal')).toBe('teacher');
    });

    it('uses context portal', () => {
      render(
        <MicroCopyPortalProvider portal="parent">
          <PositiveMicroCopy contextType="success" />
        </MicroCopyPortalProvider>
      );
      
      const element = getBySlot('positive-micro-copy');
      expect(element?.getAttribute('data-portal')).toBe('parent');
    });
  });

  describe('Emoji Display', () => {
    it('shows emoji by default', () => {
      render(<PositiveMicroCopy contextType="success" />);
      
      const element = getBySlot('positive-micro-copy');
      const emoji = element?.querySelector('.micro-copy-emoji');
      expect(emoji).toBeDefined();
    });

    it('hides emoji when showEmoji is false', () => {
      const { container } = render(<PositiveMicroCopy contextType="success" showEmoji={false} />);
      
      expect(container.querySelector('.micro-copy-emoji')).toBeNull();
    });
  });

  describe('Size Variants', () => {
    it('renders sm size', () => {
      const { container } = render(<PositiveMicroCopy contextType="success" size="sm" />);
      expect(container.firstChild).toBeDefined();
    });

    it('renders md size', () => {
      const { container } = render(<PositiveMicroCopy contextType="success" size="md" />);
      expect(container.firstChild).toBeDefined();
    });

    it('renders lg size', () => {
      const { container } = render(<PositiveMicroCopy contextType="success" size="lg" />);
      expect(container.firstChild).toBeDefined();
    });
  });

  describe('Custom Message', () => {
    it('renders custom message', () => {
      render(<PositiveMicroCopy customMessage="Custom encouragement!" />);
      
      expect(screen.getByText('Custom encouragement!')).toBeDefined();
    });

    it('replaces {name} in custom message', () => {
      render(<PositiveMicroCopy customMessage="Hello, {name}!" childName="Emma" />);
      
      expect(screen.getByText('Hello, Emma!')).toBeDefined();
    });
  });

  describe('Deterministic Index', () => {
    it('uses deterministic index for consistent output', () => {
      render(<PositiveMicroCopy contextType="success" deterministicIndex={0} />);
      
      const element = getBySlot('positive-micro-copy');
      
      const expectedMessage = MICRO_COPY_LIBRARY.success.templates[0];
      expect(element?.textContent).toContain(expectedMessage);
    });
  });

  describe('Data Attributes', () => {
    it('sets correct context attribute', () => {
      render(<PositiveMicroCopy contextType="motivation" />);
      
      const element = getBySlot('positive-micro-copy');
      expect(element?.getAttribute('data-context')).toBe('motivation');
    });

    it('sets correct variant attribute', () => {
      render(<PositiveMicroCopy contextType="success" variant="card" />);
      
      const element = getBySlot('positive-micro-copy');
      expect(element?.getAttribute('data-variant')).toBe('card');
    });
  });
});

describe('Preset Micro-Copy Components', () => {
  it('SuccessMicroCopy renders correctly', () => {
    render(<SuccessMicroCopy />);
    
    expect(getBySlot('positive-micro-copy')?.getAttribute('data-context')).toBe('success');
  });

  it('ProgressMicroCopy renders correctly', () => {
    render(<ProgressMicroCopy />);
    
    expect(getBySlot('positive-micro-copy')?.getAttribute('data-context')).toBe('progress');
  });

  it('ChildMorningMicroCopy renders correctly', () => {
    render(<ChildMorningMicroCopy childName="Emma" />);
    
    expect(getBySlot('positive-micro-copy')?.getAttribute('data-portal')).toBe('parent');
  });

  it('ChildMilestoneMicroCopy renders correctly', () => {
    render(<ChildMilestoneMicroCopy childName="Lucas" />);
    
    expect(getBySlot('positive-micro-copy')?.getAttribute('data-context')).toBe('milestone');
  });

  it('ErrorRecoveryMicroCopy renders correctly', () => {
    render(<ErrorRecoveryMicroCopy />);
    
    expect(getBySlot('positive-micro-copy')?.getAttribute('data-context')).toBe('errorRecovery');
  });

  it('LoadingMicroCopy renders correctly', () => {
    render(<LoadingMicroCopy />);
    
    expect(getBySlot('positive-micro-copy')?.getAttribute('data-context')).toBe('loading');
  });
});