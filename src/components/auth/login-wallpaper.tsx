'use client';

// ============================================================
// PreOne — Login Wallpaper (Full-bleed background, responsive)
//
// Renders the supplied PreOne space illustration as a FIXED
// full-viewport background. The asset resolves per-theme:
//
//   - Desktop (≥ md): public/login-wallpaper-{dark,light}.png
//     (1536×1024, 3:2 — split-screen layout, wider scene)
//   - Mobile  (< md): public/login-wallpaper-mobile-{dark,light}.png
//     (853×1844, tall portrait — vertical stack layout)
//
// Both variants fill the entire viewport via next/image fill +
// object-cover. The <picture>-style switching is done with two
// stacked <Image> elements, one visible per breakpoint, so we
// don't need a JS resize listener and SSR/CSR markup stays
// stable. next/image priority is set on both (only one is
// actually fetched, depending on viewport).
//
// Overlay gradients:
//   - Desktop overlay (.login-wallpaper-overlay): 135deg diagonal
//     wash tuned for the left/right split-screen composition.
//   - Mobile overlay  (.login-wallpaper-overlay-mobile): 180deg
//     vertical vignette — darker top & bottom, clearer middle —
//     so the brand wordmark and footer remain legible on phones
//     while the form card area gets visual breathing room.
// ============================================================

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

export type WallpaperSrc =
  | string
  | { dark?: string; light?: string };

interface WallpaperSet {
  dark: string;
  light: string;
}

const DEFAULT_DESKTOP: WallpaperSet = {
  dark: '/login-wallpaper-dark.png',
  light: '/login-wallpaper-light.png',
};

const DEFAULT_MOBILE: WallpaperSet = {
  dark: '/login-wallpaper-mobile-dark.png',
  light: '/login-wallpaper-mobile-light.png',
};

interface LoginWallpaperProps {
  /** Override the DESKTOP wallpaper asset. */
  desktop?: WallpaperSrc;
  /** Override the MOBILE wallpaper asset. */
  mobile?: WallpaperSrc;
}

export function LoginWallpaper({ desktop, mobile }: LoginWallpaperProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Resolve asset URL for the requested theme. Before mount we
  // default to the dark variant to keep SSR/CSR markup stable.
  const resolve = (set: WallpaperSet, override?: WallpaperSrc): string => {
    if (!override) {
      const theme = mounted ? resolvedTheme : 'dark';
      return theme === 'light' ? set.light : set.dark;
    }
    if (typeof override === 'string') return override;
    const theme = mounted ? resolvedTheme : 'dark';
    if (theme === 'light') return override.light ?? set.light;
    return override.dark ?? set.dark;
  };

  const desktopSrc = resolve(DEFAULT_DESKTOP, desktop);
  const mobileSrc = resolve(DEFAULT_MOBILE, mobile);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* ── Desktop wallpaper (md+) — wide 3:2 scene ── */}
      <Image
        src={desktopSrc}
        alt=""
        fill
        className="object-cover hidden md:block"
        priority
        sizes="100vw"
      />

      {/* ── Mobile wallpaper (< md) — tall portrait scene ── */}
      <Image
        src={mobileSrc}
        alt=""
        fill
        className="object-cover md:hidden"
        priority
        sizes="100vw"
      />

      {/* ── Desktop overlay (md+) — 135deg diagonal wash ── */}
      <div
        className="absolute inset-0 login-wallpaper-overlay hidden md:block"
        aria-hidden="true"
      />

      {/* ── Mobile overlay (< md) — 180deg vertical vignette ── */}
      <div
        className="absolute inset-0 login-wallpaper-overlay-mobile md:hidden"
        aria-hidden="true"
      />
    </div>
  );
}
