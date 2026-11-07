export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-[var(--preone-primary)]/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--preone-primary)] animate-spin" />
        </div>
        <p className="text-sm text-[var(--text-muted)]">Loading...</p>
      </div>
    </div>
  );
}
