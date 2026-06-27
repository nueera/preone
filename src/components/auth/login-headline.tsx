'use client';

// ============================================================
// PreOne — Login Headline (Left overlay)
// Floating headline + subheadline + logo row that sits on top
// of the full-bleed wallpaper (lg+ only). On smaller screens it
// is hidden — the wallpaper still shows through the glass card.
// ============================================================

export function LoginHeadline() {
  return (
    <div
      className="
        pointer-events-none absolute inset-y-0 left-0 z-10 hidden
        lg:flex lg:w-[55%] xl:w-[55%] flex-col justify-center px-16
      "
      aria-hidden="true"
    >
      {/* Logo row */}
      <div className="mb-8 flex items-center gap-3">
        <div
          className="
            flex h-12 w-12 items-center justify-center rounded-full
            shadow-lg
          "
          style={{
            background:
              'linear-gradient(135deg, var(--brand-purple) 0%, var(--brand-blue) 100%)',
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
          drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]
        "
        style={{ letterSpacing: '-0.02em' }}
      >
        Welcome to the PreOne Universe
      </h1>

      {/* Subheadline */}
      <p
        className="
          mt-6 max-w-[460px] text-[18px] leading-[1.6] font-normal
          drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]
        "
        style={{ color: 'rgba(255, 255, 255, 0.9)' }}
      >
        Where every child begins their learning journey among the stars.
      </p>
    </div>
  );
}
