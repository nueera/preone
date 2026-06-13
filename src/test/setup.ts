// ============================================================
// Vitest global setup
// Referenced by `setupFiles` in vitest.config.ts. Runs once per
// test worker in the jsdom environment. Registers @testing-library
// jest-dom matchers (toBeInTheDocument, toHaveTextContent, …) on
// Vitest's expect so component tests can use them.
// ============================================================

import '@testing-library/jest-dom/vitest';
