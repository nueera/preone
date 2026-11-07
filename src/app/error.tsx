"use client";

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        type: error.constructor.name,
        url: window.location.href,
        severity: 'HIGH',
      }),
    }).catch(() => {});

    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#121234] to-[#1a0a2e] p-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <svg className="w-12 h-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Something Went Wrong</h1>
        <p className="text-white/40 mb-2">
          We&apos;ve logged this error and will investigate. Our team has been notified.
        </p>
        <p className="text-xs text-white/20 mb-8 font-mono">
          Error ID: {error.digest || 'N/A'}
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className="text-left mb-6 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
            <summary className="text-xs font-medium text-red-400 cursor-pointer mb-2">
              Error Details (Dev Only)
            </summary>
            <pre className="text-xs text-red-300/70 overflow-auto max-h-40 whitespace-pre-wrap">
              {error.stack || error.message}
            </pre>
          </details>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#6c5ce7] text-white font-medium hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 rounded-xl border border-white/10 text-white/60 font-medium hover:bg-white/5 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
