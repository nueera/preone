'use client';

// ============================================================
// PreOne — Login Wallpaper (Left Panel, 60%)
// Renders the supplied PreOne space illustration as a full-bleed
// background with a subtle dark gradient overlay for text legibility.
//
// Asset slot:
//   Replace `public/login-wallpaper-dark.png` and
//   `public/login-wallpaper-light.png` with the supplied PreOne
//   space illustrations. The component picks the right one based
//   on the resolved theme (next-themes).
//
// Prop API:
//   - <LoginWallpaper />                                   → default per-theme asset
//   - <LoginWallpaper wallpaperSrc="/custom.svg" />        → single asset in both themes (spec §6)
//   - <LoginWallpaper wallpaperSrc={{ dark, light }} />    → per-theme override
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
    <aside
      className="
        relative hidden lg:flex lg:w-[60%] xl:w-[60%]
        flex-col justify-center
        overflow-hidden
      "
      aria-hidden="true"
    >
      {/* Full-bleed wallpaper */}
      <Image
        src={src}
        alt=""
        fill
        className="object-cover"
        priority
        sizes="(min-width: 1024px) 60vw, 0px"
      />

      {/* Subtle dark gradient overlay for text legibility */}
      <div
        className="absolute inset-0 login-wallpaper-overlay"
        aria-hidden="true"
      />

      {/* Centered content — logo row, headline, subheadline */}
      <div className="relative z-10 flex flex-col justify-center px-16">
        {/* Logo row */}
        <div className="mb-8 flex items-center gap-3">
          <div
            className="
              flex h-12 w-12 items-center justify-center rounded-full
              shadow-lg
            "
            style={{
              background:
                'linear-gradient(135deg, #7B2CBF 0%, #3A86FF 100%)',
            }}
          >
            <span className="text-xl font-bold text-white">O</span>
          </div>
          <span
            className="text-[28px] font-bold tracking-tight text-white"
            style={{ letterSpacing: '-0.01em' }}
          >
            PreOne
          </span>
        </div>

        {/* Headline */}
        <h1
          className="
            max-w-[480px] text-white
            text-[36px] leading-[1.15] font-bold
          "
          style={{ letterSpacing: '-0.02em' }}
        >
          Welcome to the PreOne Universe
        </h1>

        {/* Subheadline */}
        <p
          className="
            mt-6 max-w-[460px] text-[18px] leading-[1.6] font-normal
          "
          style={{ color: 'rgba(255, 255, 255, 0.8)' }}
        >
          Where every child begins their learning journey among the stars.
        </p>
      </div>
    </aside>
  );
}
