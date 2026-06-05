'use client';
 

import { useState, useEffect, useRef } from 'react';
import { Building2, ChevronDown, Check, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ── Auth user shape (from localStorage) ──
interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  branchId?: string | null;
  schoolId?: string | null;
}

// ── Branch type ──
interface BranchItem {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
}

// ── Portal-based theme colors ──
const PORTAL_THEMES_MAP: Record<string, {
  bg: string;
  text: string;
  border: string;
  hoverBg: string;
  activeBg: string;
  dot: string;
}> = {
  admin: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    hoverBg: 'hover:bg-purple-100',
    activeBg: 'bg-purple-100',
    dot: 'bg-purple-500',
  },
  teacher: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    hoverBg: 'hover:bg-emerald-100',
    activeBg: 'bg-emerald-100',
    dot: 'bg-emerald-500',
  },
  parent: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    hoverBg: 'hover:bg-sky-100',
    activeBg: 'bg-sky-100',
    dot: 'bg-sky-500',
  },
};

function getPortalFromPath(): string {
  if (typeof window === 'undefined') return 'admin';
  const path = window.location.pathname;
  if (path.startsWith('/teacher')) return 'teacher';
  if (path.startsWith('/parent')) return 'parent';
  return 'admin';
}

/**
 * BranchSwitcher — Dropdown component for switching active branch.
 *
 * - Shows current branch name (or "All Branches" for admin without branch)
 * - Dropdown with list of branches from /api/branches
 * - When switching, calls POST /api/branches with new branchId
 * - Updates localStorage token on switch
 * - Shows a building icon + branch name
 * - Only shown when user has schoolId and there are multiple branches
 * - Purple theme for admin, emerald for teacher, sky for parent
 */
export function BranchSwitcher() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [currentBranchId, setCurrentBranchId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Load user from localStorage ──
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('preone_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setCurrentBranchId(parsed.branchId || null);
      }
    } catch {
      // Silent fail
    }
  }, []);

  // ── Fetch branches ──
  useEffect(() => {
    if (!user?.schoolId) return;

    const fetchBranches = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('preone_token');
        if (!token) return;

        const res = await fetch('/api/branches', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setBranches(data.branches || []);
          setCurrentBranchId(data.currentBranchId || null);
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [user?.schoolId]);

  // ── Close on outside click ──
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [isOpen]);

  // ── Switch branch ──
  const switchBranch = async (branchId: string | null) => {
    if (!user) return;
    // Only admin and task_master can switch
    if (user.role !== 'ADMIN' && user.role !== 'TASK_MASTER') return;

    setSwitching(true);
    try {
      const token = localStorage.getItem('preone_token');
      if (!token) return;

      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ branchId }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update token in localStorage
        localStorage.setItem('preone_token', data.token);
        // Update user in localStorage
        const updatedUser = { ...user, branchId: data.branchId };
        localStorage.setItem('preone_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setCurrentBranchId(data.branchId);
        setIsOpen(false);
      }
    } catch {
      // Silent fail
    } finally {
      setSwitching(false);
    }
  };

  // ── Don't render if no school or not enough branches ──
  if (!user?.schoolId) return null;
  if (branches.length === 0 && !loading) return null;
  // Only show for admin and task_master roles (others are always scoped to their branch)
  if (user.role !== 'ADMIN' && user.role !== 'TASK_MASTER') return null;

  const portal = getPortalFromPath();
  const theme = PORTAL_THEMES_MAP[portal] || PORTAL_THEMES_MAP.admin;

  const currentBranch = branches.find((b) => b.id === currentBranchId);
  const displayLabel = currentBranch?.name || 'All Branches';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'h-8 gap-1.5 px-2.5 rounded-md border text-xs font-medium transition-colors',
          theme.bg, theme.text, theme.border,
          'hover:opacity-90'
        )}
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
      >
        {currentBranchId ? (
          <Building2 className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <Globe className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="max-w-[120px] truncate hidden sm:inline">
          {displayLabel}
        </span>
        <ChevronDown className={cn(
          'h-3 w-3 shrink-0 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </Button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <div
              className="fixed inset-0 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-2 z-50 w-64 rounded-xl border bg-white shadow-xl dark:bg-gray-900 dark:border-gray-800 overflow-hidden"
            >
              {/* Header */}
              <div className="px-3 py-2.5 border-b dark:border-gray-800">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Switch Branch
                </p>
              </div>

              {/* Branch List */}
              <div className="max-h-64 overflow-y-auto py-1">
                {/* All Branches option (only for users without a fixed branch) */}
                {!user.branchId && (
                  <button
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                      !currentBranchId
                        ? `${theme.activeBg} ${theme.text} font-medium`
                        : 'text-foreground hover:bg-gray-50 dark:hover:bg-gray-800'
                    )}
                    onClick={() => switchBranch(null)}
                    disabled={switching}
                  >
                    <Globe className="h-4 w-4 shrink-0 opacity-60" />
                    <span className="flex-1 text-left truncate">All Branches</span>
                    {!currentBranchId && (
                      <Check className={cn('h-4 w-4 shrink-0', theme.text)} />
                    )}
                  </button>
                )}

                {branches.map((branch) => (
                  <button
                    key={branch.id}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors',
                      currentBranchId === branch.id
                        ? `${theme.activeBg} ${theme.text} font-medium`
                        : 'text-foreground hover:bg-gray-50 dark:hover:bg-gray-800'
                    )}
                    onClick={() => switchBranch(branch.id)}
                    disabled={switching}
                  >
                    <Building2 className="h-4 w-4 shrink-0 opacity-60" />
                    <div className="flex-1 text-left min-w-0">
                      <p className="truncate">{branch.name}</p>
                      {branch.address && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {branch.address}
                        </p>
                      )}
                    </div>
                    {currentBranchId === branch.id && (
                      <Check className={cn('h-4 w-4 shrink-0', theme.text)} />
                    )}
                  </button>
                ))}
              </div>

              {/* Loading / Switching indicator */}
              {switching && (
                <div className="border-t px-3 py-2 flex items-center gap-2 dark:border-gray-800">
                  <div className="h-3 w-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  <span className="text-xs text-muted-foreground">Switching...</span>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
