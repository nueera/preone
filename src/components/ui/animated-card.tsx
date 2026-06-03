'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
}

/**
 * AnimatedCard — Card with staggered entrance animation and optional hover lift.
 * Uses framer-motion for smooth entrance with configurable delay.
 * Usage: <AnimatedCard delay={0.2}>...</AnimatedCard>
 */
export function AnimatedCard({ children, className, delay = 0, hover = true }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: 'easeOut' }}
      whileHover={hover ? { y: -2, transition: { duration: 0.15 } } : undefined}
    >
      <Card className={cn(className)}>
        {children}
      </Card>
    </motion.div>
  );
}
