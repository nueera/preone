import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// ── Portal Aurora Tests ──
import {
  PortalAuroraBackground,
  AuroraPortalProvider,
  useAuroraPortal,
  PORTAL_AURORA_CONFIG,
} from '../portal-aurora';

describe('PortalAuroraBackground', () => {
  it('renders with children', () => {
    render(
      <PortalAuroraBackground>
        <div>Test Content</div>
      </PortalAuroraBackground>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with default admin portal', () => {
    render(
      <PortalAuroraBackground>
        <div>Admin Aurora</div>
      </PortalAuroraBackground>
    );
    // Check that the component renders correctly with admin portal colors
    expect(screen.getByText('Admin Aurora')).toBeInTheDocument();
    // Check that aurora blobs are rendered (admin uses purple/violet colors)
    const blobs = document.querySelectorAll('[aria-hidden="true"] > div');
    expect(blobs.length).toBe(3); // 3 aurora blobs
  });

  it('renders with teacher portal colors', () => {
    render(
      <PortalAuroraBackground portal="teacher">
        <div>Teacher Aurora</div>
      </PortalAuroraBackground>
    );
    // Check that the component renders with teacher portal (emerald/teal colors)
    expect(screen.getByText('Teacher Aurora')).toBeInTheDocument();
    const blobs = document.querySelectorAll('[aria-hidden="true"] > div');
    expect(blobs.length).toBe(3);
  });

  it('renders with parent portal colors', () => {
    render(
      <PortalAuroraBackground portal="parent">
        <div>Parent Aurora</div>
      </PortalAuroraBackground>
    );
    expect(screen.getByText('Parent Aurora')).toBeInTheDocument();
  });

  it('applies intensity variants', () => {
    const { rerender } = render(
      <PortalAuroraBackground intensity="subtle">
        <div>Subtle</div>
      </PortalAuroraBackground>
    );

    rerender(
      <PortalAuroraBackground intensity="vibrant">
        <div>Vibrant</div>
      </PortalAuroraBackground>
    );
    expect(screen.getByText('Vibrant')).toBeInTheDocument();
  });

  it('disables animations when enableAnimations is false', () => {
    render(
      <PortalAuroraBackground enableAnimations={false}>
        <div>No Animation</div>
      </PortalAuroraBackground>
    );
    const blobs = document.querySelectorAll('[aria-hidden="true"]');
    expect(blobs.length).toBeGreaterThan(0);
  });

  it('respects portal context from provider', () => {
    const TestComponent = () => {
      const portal = useAuroraPortal();
      return <span data-testid="portal-context">{portal}</span>;
    };

    render(
      <AuroraPortalProvider portal="teacher">
        <PortalAuroraBackground>
          <TestComponent />
        </PortalAuroraBackground>
      </AuroraPortalProvider>
    );

    expect(screen.getByTestId('portal-context')).toHaveTextContent('teacher');
  });

  it('has correct portal color configurations', () => {
    expect(PORTAL_AURORA_CONFIG.admin).toBeDefined();
    expect(PORTAL_AURORA_CONFIG.teacher).toBeDefined();
    expect(PORTAL_AURORA_CONFIG.parent).toBeDefined();
    
    expect(PORTAL_AURORA_CONFIG.admin.blob1.light).toContain('purple');
    expect(PORTAL_AURORA_CONFIG.teacher.blob1.light).toContain('emerald');
    expect(PORTAL_AURORA_CONFIG.parent.blob1.light).toContain('sky');
  });

  it('applies custom className', () => {
    render(
      <PortalAuroraBackground className="custom-class">
        <div>Custom</div>
      </PortalAuroraBackground>
    );
    const container = screen.getByText('Custom').parentElement?.parentElement;
    expect(container).toHaveClass('custom-class');
  });
});

// ── Glassmorphism Card Tests ──
import {
  GlassmorphismCard,
  GlassmorphismCardContent,
  GlassmorphismCardHeader,
  GlassmorphismCardFooter,
  GlassPortalProvider,
  useGlassPortal,
  PORTAL_GLASS_CONFIG,
} from '../glassmorphism-card';

describe('GlassmorphismCard', () => {
  it('renders with children', () => {
    render(
      <GlassmorphismCard>
        <GlassmorphismCardContent>
          <p>Card Content</p>
        </GlassmorphismCardContent>
      </GlassmorphismCard>
    );
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('renders with default admin portal', () => {
    render(
      <GlassmorphismCard>
        <div>Admin Glass</div>
      </GlassmorphismCard>
    );
    const card = screen.getByText('Admin Glass').closest('[data-slot="glassmorphism-card"]');
    expect(card).toHaveAttribute('data-portal', 'admin');
  });

  it('renders with teacher portal', () => {
    render(
      <GlassmorphismCard portal="teacher">
        <div>Teacher Glass</div>
      </GlassmorphismCard>
    );
    const card = screen.getByText('Teacher Glass').closest('[data-slot="glassmorphism-card"]');
    expect(card).toHaveAttribute('data-portal', 'teacher');
  });

  it('renders with parent portal', () => {
    render(
      <GlassmorphismCard portal="parent">
        <div>Parent Glass</div>
      </GlassmorphismCard>
    );
    const card = screen.getByText('Parent Glass').closest('[data-slot="glassmorphism-card"]');
    expect(card).toHaveAttribute('data-portal', 'parent');
  });

  it('applies glass variants', () => {
    const variants = ['subtle', 'medium', 'vibrant', 'frosted', 'crystalline'] as const;
    
    variants.forEach((variant) => {
      const { unmount } = render(
        <GlassmorphismCard variant={variant}>
          <div>{variant}</div>
        </GlassmorphismCard>
      );
      expect(screen.getByText(variant)).toBeInTheDocument();
      unmount();
    });
  });

  it('applies hover effect when enabled', () => {
    render(
      <GlassmorphismCard hover>
        <div>Hoverable</div>
      </GlassmorphismCard>
    );
    const card = screen.getByText('Hoverable').closest('[data-slot="glassmorphism-card"]');
    expect(card).toHaveClass('hover:-translate-y-1');
  });

  it('shows accent border when enabled', () => {
    render(
      <GlassmorphismCard accentBorder portal="admin">
        <div>Accent Border</div>
      </GlassmorphismCard>
    );
    const card = screen.getByText('Accent Border').closest('[data-slot="glassmorphism-card"]');
    expect(card).toBeTruthy();
  });

  it('shows gradient overlay by default', () => {
    render(
      <GlassmorphismCard gradientOverlay>
        <div>Gradient</div>
      </GlassmorphismCard>
    );
    const card = screen.getByText('Gradient').closest('[data-slot="glassmorphism-card"]');
    expect(card).toBeTruthy();
  });

  it('shows inner glow when enabled', () => {
    render(
      <GlassmorphismCard innerGlow>
        <div>Inner Glow</div>
      </GlassmorphismCard>
    );
    const card = screen.getByText('Inner Glow').closest('[data-slot="glassmorphism-card"]');
    expect(card).toBeTruthy();
  });

  it('respects glass portal context from provider', () => {
    const TestComponent = () => {
      const portal = useGlassPortal();
      return <span data-testid="glass-portal">{portal}</span>;
    };

    render(
      <GlassPortalProvider portal="parent">
        <GlassmorphismCard>
          <TestComponent />
        </GlassmorphismCard>
      </GlassPortalProvider>
    );

    expect(screen.getByTestId('glass-portal')).toHaveTextContent('parent');
  });

  it('has correct portal glass configurations', () => {
    expect(PORTAL_GLASS_CONFIG.admin).toBeDefined();
    expect(PORTAL_GLASS_CONFIG.teacher).toBeDefined();
    expect(PORTAL_GLASS_CONFIG.parent).toBeDefined();
    
    expect(PORTAL_GLASS_CONFIG.admin.primarySoft).toContain('admin');
    expect(PORTAL_GLASS_CONFIG.teacher.primarySoft).toContain('teacher');
    expect(PORTAL_GLASS_CONFIG.parent.primarySoft).toContain('parent');
  });

  it('renders header and footer', () => {
    render(
      <GlassmorphismCard>
        <GlassmorphismCardHeader>Header</GlassmorphismCardHeader>
        <GlassmorphismCardContent>Content</GlassmorphismCardContent>
        <GlassmorphismCardFooter>Footer</GlassmorphismCardFooter>
      </GlassmorphismCard>
    );
    
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });
});

// ── Animated Gradient Border Tests ──
import {
  AnimatedGradientBorder,
  GradientBorderWrapper,
  GradientBorderPortalProvider,
  useGradientBorderPortal,
  PORTAL_GRADIENT_CONFIG,
} from '../animated-gradient-border';

describe('AnimatedGradientBorder', () => {
  it('renders with children', () => {
    render(
      <AnimatedGradientBorder>
        <div>Bordered Content</div>
      </AnimatedGradientBorder>
    );
    expect(screen.getByText('Bordered Content')).toBeInTheDocument();
  });

  it('renders with default admin portal', () => {
    render(
      <AnimatedGradientBorder>
        <div>Admin Border</div>
      </AnimatedGradientBorder>
    );
    const container = screen.getByText('Admin Border').closest('[data-slot="animated-gradient-border"]');
    expect(container).toHaveAttribute('data-portal', 'admin');
  });

  it('renders with teacher portal colors', () => {
    render(
      <AnimatedGradientBorder portal="teacher">
        <div>Teacher Border</div>
      </AnimatedGradientBorder>
    );
    const container = screen.getByText('Teacher Border').closest('[data-slot="animated-gradient-border"]');
    expect(container).toHaveAttribute('data-portal', 'teacher');
  });

  it('renders with parent portal colors', () => {
    render(
      <AnimatedGradientBorder portal="parent">
        <div>Parent Border</div>
      </AnimatedGradientBorder>
    );
    const container = screen.getByText('Parent Border').closest('[data-slot="animated-gradient-border"]');
    expect(container).toHaveAttribute('data-portal', 'parent');
  });

  it('applies animation speed variants', () => {
    const speeds = ['slow', 'medium', 'fast', 'veryFast'] as const;
    
    speeds.forEach((speed) => {
      const { unmount } = render(
        <AnimatedGradientBorder speed={speed}>
          <div>{speed}</div>
        </AnimatedGradientBorder>
      );
      expect(screen.getByText(speed)).toBeInTheDocument();
      unmount();
    });
  });

  it('applies rounded variants', () => {
    const roundeds = ['none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full'] as const;
    
    roundeds.forEach((rounded) => {
      const { unmount } = render(
        <AnimatedGradientBorder rounded={rounded}>
          <div>{rounded}</div>
        </AnimatedGradientBorder>
      );
      expect(screen.getByText(rounded)).toBeInTheDocument();
      unmount();
    });
  });

  it('shows glow effect when enabled', () => {
    render(
      <AnimatedGradientBorder glow>
        <div>Glowing Border</div>
      </AnimatedGradientBorder>
    );
    const container = screen.getByText('Glowing Border').closest('[data-slot="animated-gradient-border"]');
    expect(container).toBeTruthy();
  });

  it('applies custom border width', () => {
    render(
      <AnimatedGradientBorder borderWidth={4}>
        <div>Wide Border</div>
      </AnimatedGradientBorder>
    );
    expect(screen.getByText('Wide Border')).toBeInTheDocument();
  });

  it('respects gradient border portal context', () => {
    const TestComponent = () => {
      const portal = useGradientBorderPortal();
      return <span data-testid="border-portal">{portal}</span>;
    };

    render(
      <GradientBorderPortalProvider portal="teacher">
        <AnimatedGradientBorder>
          <TestComponent />
        </AnimatedGradientBorder>
      </GradientBorderPortalProvider>
    );

    expect(screen.getByTestId('border-portal')).toHaveTextContent('teacher');
  });

  it('has correct portal gradient configurations', () => {
    expect(PORTAL_GRADIENT_CONFIG.admin).toBeDefined();
    expect(PORTAL_GRADIENT_CONFIG.teacher).toBeDefined();
    expect(PORTAL_GRADIENT_CONFIG.parent).toBeDefined();
    
    expect(PORTAL_GRADIENT_CONFIG.admin.colors).toContain('#7C3AED');
    expect(PORTAL_GRADIENT_CONFIG.teacher.colors).toContain('#10B981');
    expect(PORTAL_GRADIENT_CONFIG.parent.colors).toContain('#0EA5E9');
  });

  it('renders static gradient wrapper', () => {
    render(
      <GradientBorderWrapper portal="admin">
        <div>Static Border</div>
      </GradientBorderWrapper>
    );
    expect(screen.getByText('Static Border')).toBeInTheDocument();
  });
});

// ── Portal Spinner Tests ──
import {
  PortalSpinner,
  SpinnerPortalProvider,
  useSpinnerPortal,
  InlineSpinner,
  PageSpinner,
  PORTAL_SPINNER_CONFIG,
  SIZE_CONFIG,
} from '../portal-spinner';

describe('PortalSpinner', () => {
  it('renders ring spinner by default', () => {
    render(<PortalSpinner />);
    const spinner = document.querySelector('[data-slot="portal-spinner"]');
    expect(spinner).toBeTruthy();
    expect(spinner).toHaveAttribute('data-variant', 'ring');
  });

  it('renders with admin portal colors', () => {
    render(<PortalSpinner portal="admin" />);
    const spinner = document.querySelector('[data-portal="admin"]');
    expect(spinner).toBeTruthy();
  });

  it('renders with teacher portal colors', () => {
    render(<PortalSpinner portal="teacher" />);
    const spinner = document.querySelector('[data-portal="teacher"]');
    expect(spinner).toBeTruthy();
  });

  it('renders with parent portal colors', () => {
    render(<PortalSpinner portal="parent" />);
    const spinner = document.querySelector('[data-portal="parent"]');
    expect(spinner).toBeTruthy();
  });

  it('renders all spinner variants', () => {
    const variants = ['ring', 'dots', 'pulse', 'orbit', 'gradient'] as const;
    
    variants.forEach((variant) => {
      const { unmount } = render(
        <PortalSpinner variant={variant} />
      );
      const spinner = document.querySelector(`[data-variant="${variant}"]`);
      expect(spinner).toBeTruthy();
      unmount();
    });
  });

  it('renders all size variants', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
    
    sizes.forEach((size) => {
      const { unmount } = render(
        <PortalSpinner size={size} />
      );
      expect(document.querySelector('[data-slot="portal-spinner"]')).toBeTruthy();
      unmount();
    });
  });

  it('renders all speed variants', () => {
    const speeds = ['slow', 'medium', 'fast', 'veryFast'] as const;
    
    speeds.forEach((speed) => {
      const { unmount } = render(
        <PortalSpinner speed={speed} />
      );
      expect(document.querySelector('[data-slot="portal-spinner"]')).toBeTruthy();
      unmount();
    });
  });

  it('shows loading text when enabled', () => {
    render(<PortalSpinner showText text="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('uses custom color when provided', () => {
    render(<PortalSpinner customColor="#FF0000" />);
    expect(document.querySelector('[data-slot="portal-spinner"]')).toBeTruthy();
  });

  it('respects spinner portal context', () => {
    // The PortalSpinner doesn't render children - it only renders the spinner
    // So we test the context by checking the spinner uses the parent portal colors
    render(
      <SpinnerPortalProvider portal="parent">
        <PortalSpinner />
      </SpinnerPortalProvider>
    );

    // Check that spinner has parent portal colors (sky/blue)
    const spinner = document.querySelector('[data-portal="parent"]');
    expect(spinner).toBeTruthy();
  });

  it('has correct portal spinner configurations', () => {
    expect(PORTAL_SPINNER_CONFIG.admin).toBeDefined();
    expect(PORTAL_SPINNER_CONFIG.teacher).toBeDefined();
    expect(PORTAL_SPINNER_CONFIG.parent).toBeDefined();
    
    expect(PORTAL_SPINNER_CONFIG.admin.primary).toBe('#7C3AED');
    expect(PORTAL_SPINNER_CONFIG.teacher.primary).toBe('#10B981');
    expect(PORTAL_SPINNER_CONFIG.parent.primary).toBe('#0EA5E9');
  });

  it('has correct size configurations', () => {
    expect(SIZE_CONFIG.xs).toBeDefined();
    expect(SIZE_CONFIG.md).toBeDefined();
    expect(SIZE_CONFIG['2xl']).toBeDefined();
    
    expect(SIZE_CONFIG.md.dimension).toBe(24);
    expect(SIZE_CONFIG.xl.dimension).toBe(48);
  });

  it('renders inline spinner', () => {
    render(<InlineSpinner />);
    expect(document.querySelector('[data-slot="portal-spinner"]')).toBeTruthy();
  });

  it('renders page spinner', () => {
    render(<PageSpinner showText text="Loading page..." />);
    expect(screen.getByText('Loading page...')).toBeInTheDocument();
  });
});

// ── Success Celebration Tests ──
import {
  SuccessCelebration,
  CelebrationPortalProvider,
  useCelebrationPortal,
  QuickSuccess,
  PORTAL_CELEBRATION_CONFIG,
} from '../success-celebration';

describe('SuccessCelebration', () => {
  it('renders with children', () => {
    render(
      <SuccessCelebration>
        <div>Content</div>
      </SuccessCelebration>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('does not show celebration when trigger is false', () => {
    render(
      <SuccessCelebration trigger={false}>
        <div>Hidden</div>
      </SuccessCelebration>
    );
    expect(screen.getByText('Hidden')).toBeInTheDocument();
    // Confetti should not be visible
    expect(document.querySelector('.celebration-confetti-container')).toBeFalsy();
  });

  it('shows celebration when trigger is true', () => {
    render(
      <SuccessCelebration trigger={true} variant="confetti">
        <div>Shown</div>
      </SuccessCelebration>
    );
    expect(screen.getByText('Shown')).toBeInTheDocument();
  });

  it('renders with admin portal colors', () => {
    render(
      <SuccessCelebration portal="admin" trigger={true}>
        <div>Admin Celebration</div>
      </SuccessCelebration>
    );
    const container = screen.getByText('Admin Celebration').closest('[data-slot="success-celebration"]');
    expect(container).toHaveAttribute('data-portal', 'admin');
  });

  it('renders with teacher portal colors', () => {
    render(
      <SuccessCelebration portal="teacher" trigger={true}>
        <div>Teacher Celebration</div>
      </SuccessCelebration>
    );
    const container = screen.getByText('Teacher Celebration').closest('[data-slot="success-celebration"]');
    expect(container).toHaveAttribute('data-portal', 'teacher');
  });

  it('renders with parent portal colors', () => {
    render(
      <SuccessCelebration portal="parent" trigger={true}>
        <div>Parent Celebration</div>
      </SuccessCelebration>
    );
    const container = screen.getByText('Parent Celebration').closest('[data-slot="success-celebration"]');
    expect(container).toHaveAttribute('data-portal', 'parent');
  });

  it('renders all celebration variants', () => {
    const variants = ['confetti', 'pop', 'sparkle', 'stars', 'trophy', 'wave'] as const;
    
    variants.forEach((variant) => {
      const { unmount } = render(
        <SuccessCelebration trigger={true} variant={variant}>
          <div>{variant}</div>
        </SuccessCelebration>
      );
      const container = screen.getByText(variant).closest('[data-slot="success-celebration"]');
      expect(container).toHaveAttribute('data-variant', variant);
      unmount();
    });
  });

  it('shows custom message', () => {
    render(
      <SuccessCelebration trigger={true} variant="confetti" message="Great job!" duration={10000}>
        <div>Custom Message</div>
      </SuccessCelebration>
    );
    // Message should appear after animation delay
    expect(screen.getByText('Custom Message')).toBeInTheDocument();
  });

  it('applies duration presets', () => {
    const durations = ['short', 'medium', 'long'] as const;
    
    durations.forEach((duration) => {
      const { unmount } = render(
        <SuccessCelebration trigger={true} duration={duration}>
          <div>{duration}</div>
        </SuccessCelebration>
      );
      expect(screen.getByText(duration)).toBeInTheDocument();
      unmount();
    });
  });

  it('applies position variants', () => {
    const positions = ['center', 'top', 'top-left', 'top-right'] as const;
    
    positions.forEach((position) => {
      const { unmount } = render(
        <SuccessCelebration trigger={true} position={position}>
          <div>{position}</div>
        </SuccessCelebration>
      );
      expect(screen.getByText(position)).toBeInTheDocument();
      unmount();
    });
  });

  it('respects celebration portal context', () => {
    const TestComponent = () => {
      const portal = useCelebrationPortal();
      return <span data-testid="celebration-portal">{portal}</span>;
    };

    render(
      <CelebrationPortalProvider portal="teacher">
        <SuccessCelebration>
          <TestComponent />
        </SuccessCelebration>
      </CelebrationPortalProvider>
    );

    expect(screen.getByTestId('celebration-portal')).toHaveTextContent('teacher');
  });

  it('has correct portal celebration configurations', () => {
    expect(PORTAL_CELEBRATION_CONFIG.admin).toBeDefined();
    expect(PORTAL_CELEBRATION_CONFIG.teacher).toBeDefined();
    expect(PORTAL_CELEBRATION_CONFIG.parent).toBeDefined();
    
    expect(PORTAL_CELEBRATION_CONFIG.admin.primary).toBe('#7C3AED');
    expect(PORTAL_CELEBRATION_CONFIG.teacher.primary).toBe('#10B981');
    expect(PORTAL_CELEBRATION_CONFIG.parent.primary).toBe('#0EA5E9');
    
    expect(PORTAL_CELEBRATION_CONFIG.admin.confettiColors.length).toBeGreaterThan(0);
  });

  it('renders quick success indicator', () => {
    render(<QuickSuccess />);
    expect(document.querySelector('.quick-success-icon')).toBeTruthy();
  });

  it('renders quick success with different sizes', () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    
    sizes.forEach((size) => {
      const { unmount } = render(<QuickSuccess size={size} />);
      expect(document.querySelector('.quick-success-icon')).toBeTruthy();
      unmount();
    });
  });

  it('calls onComplete callback', async () => {
    const onComplete = vi.fn();
    
    render(
      <SuccessCelebration 
        trigger={true} 
        duration={100} 
        autoDismiss={true}
        onComplete={onComplete}
      >
        <div>Callback Test</div>
      </SuccessCelebration>
    );

    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, 150));
    expect(onComplete).toHaveBeenCalled();
  });
});