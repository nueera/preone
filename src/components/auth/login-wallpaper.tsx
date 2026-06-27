'use client';

// ============================================================
// PreOne — Login Wallpaper (Full-bleed background)
// Renders the supplied PreOne space illustration as a FIXED
// full-viewport background so it shows through the translucent
// login card on the right AND the headline overlay on the left.
//
// Why full-bleed instead of left-panel-only:
//   - Source wallpapers are 1536×1024 (3:2). Constrained to a
//     60%-wide panel, object-cover crops the right side (where
//     the rocket + blue planet live). Spanning the full viewport
//     keeps the entire scene visible.
//   - A transparent glass card needs the wallpaper behind it,
//     not just on the left side.
//
// Asset slot:
//   Replace `public/login-wallpaper-dark.png` and
//   `public/login-wallpaper-light.png` with the supplied PreOne
//   space illustrations. The component picks the right one based
//   on the resolved theme (next-themes).
// ============================================================

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

export type WallpaperSrc =
  | string
  | { dark?: string; light?: string };

const DEFAULT_WALLPAPER: { dark: string; light: string } = {
  dark: '/login-wallpaper-dark.png',
  light: '/login-wallpaper-light.png',
};

interface LoginWallpaperProps {
  wallpaperSrc?: WallpaperSrc;
}

export function LoginWallpaper({ wallpaperSrc }: LoginWallpaperProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Resolve the asset URL for the current theme.
  // Before mount we render the dark wallpaper to keep SSR/CSR markup stable
  // (default theme is dark in the design reference).
  const resolveSrc = (): string => {
    if (!wallpaperSrc) {
      const theme = mounted ? resolvedTheme : 'dark';
      return theme === 'light'
        ? DEFAULT_WALLPAPER.light
        : DEFAULT_WALLPAPER.dark;
    }
    if (typeof wallpaperSrc === 'string') return wallpaperSrc;
    const theme = mounted ? resolvedTheme : 'dark';
    if (theme === 'light') {
      return wallpaperSrc.light ?? DEFAULT_WALLPAPER.light;
    }
    return wallpaperSrc.dark ?? DEFAULT_WALLPAPER.dark;
  };

  const src = resolveSrc();

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Full-bleed wallpaper — covers the entire viewport so it shows
          through the translucent login card on the right and the
          headline overlay on the left. object-cover keeps the focal
          point (children on left) visible with minimal cropping. */}
      <Image
        src={src}
        alt=""
        fill
        className="object-cover"
        priority
        sizes="100vw"
      />

      {/* Theme-aware overlay for text legibility —
          dark: stronger purple-black gradient on top of dark wallpaper
          light: softer white-purple wash so light wallpaper stays airy */}
      <div
        className="absolute inset-0 login-wallpaper-overlay"
        aria-hidden="true"
      />
    </div>
  );
}
