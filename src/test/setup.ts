// ============================================================
// Vitest global setup
// Referenced by `setupFiles` in vitest.config.ts. Runs once per
// test worker in the jsdom environment. Registers @testing-library
// jest-dom matchers (toBeInTheDocument, toHaveTextContent, …) on
// Vitest's expect so component tests can use them.
// ============================================================

import '@testing-library/jest-dom/vitest';

// ── Polyfill ResizeObserver for cmdk and other components ──
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// ── Polyfill Element.prototype.hasPointerCapture for Radix UI ──
if (typeof Element !== 'undefined' && !Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = function () {
    return false;
  };
  Element.prototype.setPointerCapture = function () {};
  Element.prototype.releasePointerCapture = function () {};
}

// ── Polyfill scrollIntoView for cmdk ──
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {};
}

// ── Mock window.matchMedia for responsive hooks ──
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
