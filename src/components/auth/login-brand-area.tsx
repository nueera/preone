'use client';

// ============================================================
// PreOne — Mobile Brand Area (top of the mobile login stack)
//
// Renders ONLY on < md screens (md:hidden wrapper). On md+ the
// desktop LoginHeadline takes over and this component is removed
// from the layout entirely.
//
// Uses responsive min-h classes instead of hardcoded inline styles
// so it adapts fluidly across mobile screen sizes.
// ============================================================

import { motion } from 'framer-motion';
import Image from 'next/image';

const brandFadeIn = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
      mass: 0.8,
    },
  },
};

export function LoginBrandArea() {
  return (
    <motion.div
      variants={brandFadeIn}
      className="
        relative flex w-full flex-col items-center justify-end
        px-5 pb-4 pt-6
        sm:px-6 sm:pt-8
        md:hidden
        min-h-[30vh] sm:min-h-[35vh]
      "
    >
      {/* Logo + wordmark, stacked vertically for mobile */}
      <div className="flex flex-col items-center gap-2">
        <Image
          src="/preonelogo.png"
          alt="PreOne logo"
          width={56}
          height={56}
          priority
          className="h-12 w-12 sm:h-14 sm:w-14 object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)]"
        />
        <span
          className="
            login-brand-wordmark text-[22px] sm:text-[24px] font-bold tracking-tight
          "
          style={{ letterSpacing: '-0.01em' }}
        >
          PreOne
        </span>
      </div>

      {/* Tagline — hidden on < sm to save vertical space */}
      <p
        className="
          mt-2 hidden max-w-[280px] text-center text-[13px] leading-[1.5]
          sm:block
        "
        style={{ color: 'rgba(255, 255, 255, 0.85)' }}
      >
        Where every child begins their journey among the stars.
      </p>
    </motion.div>
  );
}
