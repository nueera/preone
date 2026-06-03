'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, X } from 'lucide-react';

/**
 * AiCompanion — Floating AI insight bubble
 * Shows at the bottom-right corner with a friendly AI-generated message.
 * Can be dismissed by the user.
 */

interface AiCompanionProps {
  /** The AI insight message to display */
  message: string;
  /** Optional child name for personalization */
  childName?: string;
  className?: string;
}

export function AiCompanion({
  message,
  childName,
  className,
}: AiCompanionProps) {
  const [visible, setVisible] = useState(true);
  const [expanded, setExpanded] = useState(false);

  if (!visible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 flex items-end gap-2',
        className
      )}
    >
      {/* Expanded bubble */}
      {expanded && (
        <div
          className={cn(
            'max-w-xs rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl',
            'border border-purple-200/50 shadow-xl p-4',
            'animate-in fade-in slide-in-from-bottom-2 duration-300'
          )}
        >
          <div className="flex items-start gap-2">
            <div className="shrink-0 p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-0.5">
                PreOne AI
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {message}
              </p>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="shrink-0 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-3 w-3 text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Floating orb button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'relative h-12 w-12 rounded-full flex items-center justify-center',
          'bg-gradient-to-br from-purple-500 via-sky-500 to-pink-500',
          'shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40',
          'transition-all duration-300 hover:scale-105 active:scale-95',
          'ring-2 ring-white/20'
        )}
        aria-label="AI Companion"
      >
        <Sparkles className="h-5 w-5 text-white" />
        {/* Pulse indicator */}
        <span
          className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white"
          style={{ animation: 'companion-pulse 2s ease-in-out infinite' }}
        />
      </button>

      <style jsx global>{`
        @keyframes companion-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
