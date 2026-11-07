"use client";

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a1a] via-[#121234] to-[#1a0a2e] p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-[#6366F1]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-[#6c5ce7]/5 rounded-full blur-[120px]" />
      </div>

      <div className="text-center relative z-10">
        <div className="mb-8">
          <div className="relative inline-block">
            <span className="text-[150px] sm:text-[200px] font-bold text-white/5 leading-none">404</span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#6366F1]/20 to-[#6c5ce7]/20 flex items-center justify-center border border-[#6366F1]/20">
                <svg className="w-12 h-12 text-[#6366F1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Page Not Found</h1>
        <p className="text-white/40 mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Maybe you took a wrong turn in the cosmos?
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#6c5ce7] text-white font-medium hover:opacity-90 transition-opacity"
          >
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 rounded-xl border border-white/10 text-white/60 font-medium hover:bg-white/5 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
