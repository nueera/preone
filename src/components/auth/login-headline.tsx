'use client';

// ============================================================
// PreOne — Login Headline (Left overlay)
// Floating logo + headline + subheadline that sits on top
// of the full-bleed wallpaper (lg+ only). On smaller screens it
// is hidden — the wallpaper still shows through the glass card.
//
// Uses Framer Motion spring entrance for premium feel.
// ============================================================

import { motion } from 'framer-motion';
import Image from 'next/image';

const headlineStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const headlineItem = {
  hidden: { opacity: 0, x: -20, filter: 'blur(4px)' },
  show: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring',
      stiffness: 280,
      damping: 24,
      mass: 0.8,
    },
  },
};

export function LoginHeadline() {
  return (
    <motion.div
      variants={headlineStagger}
      initial="hidden"
      animate="show"
      className="
        pointer-events-none absolute inset-y-0 left-0 z-10 hidden
        lg:flex lg:w-[55%] flex-col justify-center px-10 xl:px-16
      "
      aria-hidden="true"
    >
      {/* Logo + wordmark row */}
      <motion.div variants={headlineItem} className="mb-8 flex items-center gap-3">
        <Image
          src="/preonelogo.png"
          alt="PreOne logo"
          width={48}
          height={48}
          priority
          className="h-10 w-10 xl:h-12 xl:w-12 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
        />
        <span
          className="
            login-brand-wordmark text-[26px] xl:text-[28px] font-bold tracking-tight
          "
          style={{ letterSpacing: '-0.01em' }}
        >
          PreOne
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        variants={headlineItem}
        className="
          max-w-[480px] text-white
          text-[clamp(28px,3.5vw,36px)] leading-[1.15] font-bold
          drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]
        "
        style={{ letterSpacing: '-0.02em' }}
      >
        Welcome to the PreOne Universe
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        variants={headlineItem}
        className="
          mt-6 max-w-[460px] text-[clamp(16px,1.8vw,18px)] leading-[1.6] font-normal
          drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]
        "
        style={{ color: 'rgba(255, 255, 255, 0.9)' }}
      >
        Where every child begins their learning journey among the stars.
      </motion.p>
    </motion.div>
  );
}
