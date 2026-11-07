'use client';

/**
 * WarmPremium — opt-in wrapper.
 * Wrap any subtree with <WarmPremium> to activate the warm premium design tokens.
 * Renders a div with data-warm="premium" and a warm-cream background.
 */

import React from 'react';

type WarmPremiumProps = {
  children: React.ReactNode;
  className?: string;
  /** Background mode — default "cream" applies the warm cream bg */
  background?: 'cream' | 'soft' | 'transparent';
  /** Render as a different element (e.g. "section") — default div */
  as?: React.ElementType;
};

export function WarmPremium({
  children,
  className = '',
  background = 'cream',
  as: Component = 'div',
}: WarmPremiumProps) {
  const bgClass =
    background === 'cream'
      ? 'bg-[var(--warm-bg)]'
      : background === 'soft'
      ? 'bg-[var(--warm-bg-soft)]'
      : '';

  return (
    <Component
      data-warm="premium"
      className={`warm-premium-root ${bgClass} ${className}`.trim()}
    >
      {children}
    </Component>
  );
}
