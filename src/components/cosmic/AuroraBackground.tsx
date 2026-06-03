'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * AuroraBackground — Living Universe ambient background
 * Renders animated gradient blobs that float gently behind content.
 * Wraps the entire portal layout for immersive feel.
 */
export function AuroraBackground({
  children,
  className,
  intensity = 'subtle',
}: {
  children: React.ReactNode;
  className?: string;
  /** How visible the aurora effect is */
  intensity?: 'subtle' | 'medium' | 'vibrant';
}) {
  const opacityMap = {
    subtle: 'opacity-30',
    medium: 'opacity-50',
    vibrant: 'opacity-70',
  };

  return (
    <div className={cn('relative min-h-0 flex-1', className)}>
      {/* Aurora layer — fixed behind content */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 overflow-hidden',
          opacityMap[intensity]
        )}
        aria-hidden="true"
      >
        {/* Blob 1 — Top-left sky */}
        <div
          className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-sky-300 via-blue-200 to-purple-200 blur-3xl"
          style={{
            animation: 'aurora-float-1 20s ease-in-out infinite',
          }}
        />
        {/* Blob 2 — Bottom-right pink */}
        <div
          className="absolute -right-32 -bottom-32 h-[400px] w-[400px] rounded-full bg-gradient-to-tl from-pink-300 via-rose-200 to-orange-200 blur-3xl"
          style={{
            animation: 'aurora-float-2 25s ease-in-out infinite',
          }}
        />
        {/* Blob 3 — Center emerald */}
        <div
          className="absolute top-1/2 left-1/2 h-[350px] w-[350px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-emerald-200 via-teal-200 to-sky-200 blur-3xl"
          style={{
            animation: 'aurora-float-3 18s ease-in-out infinite',
          }}
        />
      </div>

      {/* Content above aurora */}
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>

      {/* Keyframes injected once */}
      <style jsx global>{`
        @keyframes aurora-float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes aurora-float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-30px, 25px) scale(1.08); }
          66% { transform: translate(25px, -15px) scale(0.93); }
        }
        @keyframes aurora-float-3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          33% { transform: translate(calc(-50% + 20px), calc(-50% - 20px)) scale(1.1); }
          66% { transform: translate(calc(-50% - 15px), calc(-50% + 15px)) scale(0.9); }
        }
      `}</style>
    </div>
  );
}
