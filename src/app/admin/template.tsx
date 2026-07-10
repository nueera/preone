'use client';

/**
 * Admin template — wraps every admin page with a subtle Warm Premium page transition.
 *
 * Motion level: Medium+ (fade + slide-up entrance on every navigation).
 * Honors prefers-reduced-motion.
 *
 * Next.js re-mounts template.tsx on each navigation, giving each page a fresh
 * entrance animation without requiring per-page motion wrappers.
 */

import { motion, useReducedMotion } from 'framer-motion';
import React from 'react';

export default function AdminTemplate({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.32,
        ease: [0.22, 1, 0.36, 1], // ease-out-quart — smooth, premium feel
      }}
    >
      {children}
    </motion.div>
  );
}
