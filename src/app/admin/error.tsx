"use client";

import { useEffect } from 'react';

export default function AdminError({
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
        source: 'FRONTEND',
        severity: 'HIGH',
        tags: ['admin-portal'],
      }),
    }).catch(() => {});
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Admin Portal Error</h3>
        <p className="text-sm text-[var(--text-tertiary)] mb-6">{error.message || 'Something went wrong'}</p>

        {process.env.NODE_ENV === 'development' && (
          <details className="text-left mb-4 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
            <summary className="text-xs font-medium text-red-400 cursor-pointer">
              Error Details (Dev Only)
            </summary>
            <pre className="mt-2 text-xs text-red-300/70 overflow-auto max-h-40 whitespace-pre-wrap">
              {error.stack}
            </pre>
          </details>
        )}

        <div className="flex items-center gap-3 justify-center">
          <button onClick={reset} className="px-4 py-2 rounded-xl bg-[var(--preone-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity">
            Try Again
          </button>
          <a href="/admin" className="px-4 py-2 rounded-xl border border-[var(--border-default)] text-sm font-medium hover:bg-[var(--bg-secondary)] transition-colors">
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
