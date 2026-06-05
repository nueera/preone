import Link from 'next/link';

export default function TeacherNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-8">
      <div className="text-center">
        <span className="text-8xl font-bold text-[var(--preone-primary)]/10">404</span>
        <h2 className="text-xl font-semibold mt-4 mb-2 text-[var(--text-primary)]">Page Not Found</h2>
        <p className="text-sm text-[var(--text-tertiary)] mb-6">
          This teacher page doesn&apos;t exist or has been moved.
        </p>
        <Link href="/teacher" className="px-4 py-2 rounded-xl bg-[var(--preone-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
