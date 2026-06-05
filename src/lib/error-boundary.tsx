"use client";

import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Report to server
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        type: error.constructor.name,
        url: window.location.href,
        severity: 'HIGH',
        tags: ['error-boundary'],
      }),
    }).catch(() => {});
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Something went wrong
            </h3>
            <p className="text-sm text-[var(--text-tertiary)] mb-4">
              {this.state.error?.message || 'An unexpected error occurred in this component.'}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo?.componentStack && (
              <details className="text-left mb-4 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                <summary className="text-xs font-medium text-red-400 cursor-pointer">
                  Component Stack (Dev Only)
                </summary>
                <pre className="mt-2 text-xs text-red-300/70 overflow-auto max-h-40 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex items-center gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 rounded-xl bg-[var(--preone-primary)] text-white text-sm font-medium hover:bg-[var(--preone-primary)]/90 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-xl border border-[var(--border-default)] text-sm font-medium hover:bg-[var(--bg-secondary)] transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
