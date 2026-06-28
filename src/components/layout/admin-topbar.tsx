'use client';

// ============================================================
// PreOne — Admin Topbar
//
// Sticky 48px top bar rendered on EVERY admin page. No sidebar,
// no hamburger — the topbar is the only persistent chrome.
//
// Left:   Brand mark + "PreOne Preschool ERP"
// Center: Welcome message (hidden < md)
// Right:  Time pill + Date pill (hidden < md) + User avatar dropdown
//
// The topbar is identical on /admin and every /admin/<module> page.
// No module-specific tabs or controls live here.
// ============================================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Clock, LogOut, Settings, User } from 'lucide-react';
import { GlobalThemeToggle } from '@/components/ui/global-theme-toggle';

export function AdminTopbar() {
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Tick the clock every second. We defer to useEffect to avoid
  // hydration mismatch (server renders null, client starts ticking).
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = () => setDropdownOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [dropdownOpen]);

  const timeStr = now
    ? now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    : '--:-- --';
  const dateStr = now
    ? now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  function handleLogout() {
    localStorage.removeItem('preone_token');
    localStorage.removeItem('preone_user');
    document.cookie = 'preone_token=; path=/; max-age=0';
    router.push('/login');
  }

  return (
    <header
      role="banner"
      className="
        sticky top-0 z-40 flex h-12 w-full items-center justify-between
        border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-6
      "
    >
      {/* ── Left: Brand ── */}
      <div className="flex items-center gap-2">
        <div
          className="
            flex h-7 w-7 items-center justify-center rounded-full
          "
          style={{
            background: 'linear-gradient(135deg, var(--admin-primary) 0%, #8B5CF6 100%)',
          }}
        >
          <Image
            src="/preonelogo.png"
            alt="PreOne"
            width={18}
            height={18}
            className="rounded-full object-contain"
          />
        </div>
        <span className="flex items-baseline gap-1 whitespace-nowrap text-[16px] leading-none">
          <span className="font-bold text-[var(--admin-primary)]">PreOne</span>
          <span className="font-medium text-[var(--admin-text-muted)]">Preschool ERP</span>
        </span>
      </div>

      {/* ── Center: Welcome (hidden < md) ── */}
      <span className="hidden text-[14px] font-medium text-[var(--admin-text)] md:block">
        Welcome back, Nilesh! 👋
      </span>

      {/* ── Right: Time + Date + Theme Toggle + Avatar ── */}
      <div className="flex items-center gap-3">
        {/* Time pill */}
        <span className="hidden items-center gap-1.5 sm:flex">
          <Clock className="h-3.5 w-3.5 text-[var(--admin-text-muted)]" />
          <span className="font-mono text-[13px] text-[var(--admin-text)]">{timeStr}</span>
        </span>

        {/* Date pill (hidden < md) */}
        <span className="hidden text-[13px] text-[var(--admin-text-muted)] md:block">
          {dateStr}
        </span>

        {/* ── Global Theme Toggle ── */}
        <GlobalThemeToggle variant="pill" />

        {/* Avatar + dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen((o) => !o);
            }}
            aria-haspopup="menu"
            aria-expanded={dropdownOpen}
            aria-label="User menu"
            className="
              flex h-8 w-8 items-center justify-center rounded-full
              border-2 border-[var(--admin-primary)]
              transition-shadow focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-[var(--admin-primary)] focus-visible:ring-offset-2
            "
          >
            <Image
              src="/preonelogo.png"
              alt="Admin avatar"
              width={28}
              height={28}
              className="rounded-full object-contain"
            />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div
              role="menu"
              className="
                absolute right-0 top-full mt-1 w-44 overflow-hidden
                rounded-lg border border-[var(--admin-border)]
                bg-[var(--admin-surface)] shadow-lg
              "
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => { setDropdownOpen(false); }}
                className="
                  flex w-full items-center gap-2 px-3 py-2 text-left
                  text-[13px] text-[var(--admin-text)]
                  hover:bg-[var(--admin-surface-2)]
                "
              >
                <User className="h-4 w-4 text-[var(--admin-text-muted)]" />
                Profile
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => { setDropdownOpen(false); }}
                className="
                  flex w-full items-center gap-2 px-3 py-2 text-left
                  text-[13px] text-[var(--admin-text)]
                  hover:bg-[var(--admin-surface-2)]
                "
              >
                <Settings className="h-4 w-4 text-[var(--admin-text-muted)]" />
                Settings
              </button>
              <div className="border-t border-[var(--admin-border)]" />
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="
                  flex w-full items-center gap-2 px-3 py-2 text-left
                  text-[13px] text-[var(--admin-error)]
                  hover:bg-[var(--admin-error-soft)]
                "
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
