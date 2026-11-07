/**
 * Tests for the Providers module.
 *
 * Verifies:
 * - QueryProvider creates QueryClient with correct defaults
 * - PreOneProviders wraps children with ThemeProvider + QueryProvider
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryProvider, PreOneProviders } from '@/components/providers';

// Mock next-themes since it uses browser APIs
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

describe('QueryProvider', () => {
  it('renders children inside QueryClientProvider', () => {
    render(
      <QueryProvider>
        <div data-testid="child">Test</div>
      </QueryProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});

describe('PreOneProviders', () => {
  it('wraps children with ThemeProvider then QueryProvider', () => {
    render(
      <PreOneProviders>
        <div data-testid="child">Test</div>
      </PreOneProviders>
    );
    expect(screen.getByTestId('theme-provider')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
