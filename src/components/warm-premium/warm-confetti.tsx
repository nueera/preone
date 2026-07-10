'use client';

/**
 * warmConfetti — delight trigger for celebratory moments.
 *
 * Fires a warm-palette confetti burst using canvas-confetti.
 * Designed for the Warm Premium design system: terracotta, sage, honey, sky, lavender, rose.
 *
 * Usage:
 *   import { warmConfetti } from '@/components/warm-premium/warm-confetti';
 *   warmConfetti();           // single burst
 *   warmConfetti('celebrate'); // bigger school-themed celebration
 */

import canvasConfetti from 'canvas-confetti';

const WARM_PALETTE = [
  '#E07856', // terracotta (primary)
  '#D4634A', // terracotta deep
  '#7BA05B', // sage
  '#F4B860', // honey
  '#7CB7E0', // sky
  '#B8A4D4', // lavender
  '#E8A0B0', // rose
  '#FBF7F2', // cream
];

type ConfettiPreset = 'burst' | 'celebrate' | 'sprinkle';

function fire(preset: ConfettiPreset = 'burst') {
  const defaults = {
    colors: WARM_PALETTE,
    scalar: 1,
    gravity: 0.9,
    drift: 0,
    ticks: 220,
    disableForReducedMotion: true,
  };

  if (preset === 'celebrate') {
    // School-themed celebration: multiple bursts + side cannons
    canvasConfetti({
      ...defaults,
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    setTimeout(() => {
      canvasConfetti({
        ...defaults,
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
      });
    }, 200);
    setTimeout(() => {
      canvasConfetti({
        ...defaults,
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
      });
    }, 400);
    // Final gentle rain
    setTimeout(() => {
      canvasConfetti({
        ...defaults,
        particleCount: 40,
        spread: 100,
        startVelocity: 25,
        origin: { y: 0.4 },
        scalar: 0.8,
      });
    }, 650);
    return;
  }

  if (preset === 'sprinkle') {
    // Gentle sprinkle for small wins
    canvasConfetti({
      ...defaults,
      particleCount: 25,
      spread: 45,
      startVelocity: 22,
      origin: { y: 0.7 },
      scalar: 0.7,
    });
    return;
  }

  // Default burst
  canvasConfetti({
    ...defaults,
    particleCount: 50,
    spread: 60,
    origin: { y: 0.65 },
  });
}

/**
 * warmConfetti — fire a warm-palette confetti burst.
 * @param preset 'burst' (default) | 'celebrate' (big school celebration) | 'sprinkle' (gentle)
 */
export function warmConfetti(preset: ConfettiPreset = 'burst') {
  if (typeof window === 'undefined') return;
  try {
    fire(preset);
  } catch {
    // no-op — confetti is a delight enhancement, never block business logic
  }
}
