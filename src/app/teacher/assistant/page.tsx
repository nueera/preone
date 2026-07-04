'use client';

import React from 'react';
import { Bot } from 'lucide-react';
import { PreOneCard } from '@/components/ui/preone-card';

/**
 * PreOne Assistant — AI-powered help page
 * Coming Soon placeholder per teacher portal specification.
 */
export default function AssistantPage() {
  return (
    <div className="flex flex-col gap-6 max-w-[1440px] mx-auto w-full">
      {/* Header Section */}
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--teacher-primary-soft)' }}
        >
          <Bot
            className="h-5 w-5"
            style={{ color: 'var(--teacher-primary)' }}
          />
        </div>
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: 'var(--teacher-text)' }}
          >
            PreOne Assistant
          </h1>
          <p
            className="text-sm"
            style={{ color: 'var(--teacher-text-muted)' }}
          >
            AI-powered help and suggestions for teachers
          </p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <PreOneCard className="flex flex-col items-center justify-center p-16 text-center">
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'var(--teacher-primary-soft)' }}
        >
          <Bot
            className="h-8 w-8"
            style={{ color: 'var(--teacher-primary)' }}
          />
        </div>
        <h2
          className="text-lg font-semibold mb-2"
          style={{ color: 'var(--teacher-text)' }}
        >
          Coming Soon
        </h2>
        <p
          className="text-sm max-w-sm"
          style={{ color: 'var(--teacher-text-muted)' }}
        >
          PreOne Assistant is being crafted to provide AI-powered lesson planning,
          context-aware suggestions, and template generation. Stay tuned!
        </p>
      </PreOneCard>
    </div>
  );
}
