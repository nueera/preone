"use client";

// Initialize this in root layout to catch ALL unhandled errors
let initialized = false;

export function initClientErrorHandler(userId?: string, userRole?: string, schoolId?: string) {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  // Capture unhandled JS errors
  const originalOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    reportError({
      message: String(message),
      stack: error?.stack,
      type: error?.constructor.name || 'UnknownError',
      url: window.location.href,
      lineNumber: lineno || undefined,
      columnName: colno || undefined,
      fileName: source || undefined,
      userId,
      userRole,
      schoolId,
      severity: 'HIGH',
    });

    if (originalOnError) {
      originalOnError(message, source, lineno, colno, error);
    }
  };

  // Capture unhandled promise rejections
  const originalOnUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    const reason = event.reason;
    reportError({
      message: reason?.message || String(reason),
      stack: reason?.stack,
      type: reason?.constructor.name || 'UnhandledRejection',
      url: window.location.href,
      userId,
      userRole,
      schoolId,
      severity: 'MEDIUM',
    });

    if (originalOnUnhandledRejection) {
      originalOnUnhandledRejection.call(window, event);
    }
  };

  // Capture console.error (filtered)
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const message = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');

    // Only report meaningful errors, not React dev warnings
    if (
      !message.includes('Warning:') &&
      !message.includes('act(') &&
      !message.includes('ReactDOM.render') &&
      !message.includes('[HMR]') &&
      message.length > 10 &&
      (
        message.includes('Error') ||
        message.includes('error') ||
        message.includes('failed') ||
        message.includes('Failed') ||
        message.includes('prisma') ||
        message.includes('PrismaClient')
      )
    ) {
      reportError({
        message: message.substring(0, 500),
        type: 'ConsoleError',
        url: window.location.href,
        userId,
        userRole,
        schoolId,
        severity: 'LOW',
      });
    }
    originalConsoleError.apply(console, args);
  };
}

// Debounced error reporting
const recentReports = new Map<string, number>();
const DEBOUNCE_MS = 5000;

async function reportError(params: {
  message: string;
  stack?: string;
  type?: string;
  url?: string;
  lineNumber?: number;
  columnName?: number;
  fileName?: string;
  userId?: string;
  userRole?: string;
  schoolId?: string;
  severity?: string;
}) {
  const key = `${params.type}:${params.message.substring(0, 100)}`;
  const lastReport = recentReports.get(key);
  if (lastReport && Date.now() - lastReport < DEBOUNCE_MS) return;

  recentReports.set(key, Date.now());

  try {
    await fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  } catch {
    // Silently fail
  }

  // Cleanup old debounce entries
  if (recentReports.size > 100) {
    const cutoff = Date.now() - DEBOUNCE_MS;
    for (const [k, v] of recentReports.entries()) {
      if (v < cutoff) recentReports.delete(k);
    }
  }
}
