/**
 * Tests for the KeyboardShortcuts component.
 *
 * Verifies:
 * - Renders without crashing
 * - Opens on "?" key press
 * - Shows shortcut categories (Navigation, Actions, Go To, General)
 * - Shows key combinations with kbd elements
 * - Closes on button click
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KeyboardShortcuts } from '@/components/ui/keyboard-shortcuts';

describe('KeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<KeyboardShortcuts />);
  });

  it('opens on "?" key press', async () => {
    render(<KeyboardShortcuts />);

    fireEvent.keyDown(document, { key: '?' });

    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });
  });

  it('shows shortcut categories', async () => {
    render(<KeyboardShortcuts />);

    fireEvent.keyDown(document, { key: '?' });

    await waitFor(() => {
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
      expect(screen.getByText('Go To')).toBeInTheDocument();
      expect(screen.getByText('General')).toBeInTheDocument();
    });
  });

  it('shows key combinations in kbd elements', async () => {
    render(<KeyboardShortcuts />);

    fireEvent.keyDown(document, { key: '?' });

    await waitFor(() => {
      const kbdElements = screen.getAllByText('Ctrl');
      expect(kbdElements.length).toBeGreaterThan(0);
    });
  });

  it('shows Open command palette shortcut', async () => {
    render(<KeyboardShortcuts />);

    fireEvent.keyDown(document, { key: '?' });

    await waitFor(() => {
      expect(screen.getByText('Open command palette')).toBeInTheDocument();
    });
  });

  it('does not open when typing in an input', () => {
    render(
      <>
        <input data-testid="test-input" />
        <KeyboardShortcuts />
      </>
    );

    const input = screen.getByTestId('test-input');
    input.focus();
    fireEvent.keyDown(input, { key: '?' });

    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('closes on "Got it" button click', async () => {
    render(<KeyboardShortcuts />);

    fireEvent.keyDown(document, { key: '?' });

    await waitFor(() => {
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Got it'));

    await waitFor(() => {
      expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
    });
  });
});
