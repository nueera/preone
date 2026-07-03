'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Home,
  Users,
  GraduationCap,
  IndianRupee,
  Settings,
  MessageCircle,
  Sparkles,
  LayoutDashboard,
  Calendar,
  Zap,
  Rocket,
  ChevronRight,
  Clock,
  Hash,
  BarChart3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSchoolBranding } from '@/contexts/school-branding';

/**
 * CommandPalette — Ctrl+K search overlay for quick navigation and actions.
 * 
 * Features:
 * - Search pages, actions, and recent history
 * - Keyboard navigation (↑↓ Enter Esc)
 * - Fuzzy matching on labels
 * - Recent pages history (stored in localStorage)
 * - Quick actions (Create Student, Send Announcement, etc.)
 * 
 * Usage: Just render <CommandPalette /> in the layout — it listens for Ctrl+K globally.
 */

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  href?: string;
  category: 'page' | 'action' | 'recent';
  keywords?: string[];
}

const ALL_ITEMS: CommandItem[] = [
  // Pages
  { id: 'page-dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, href: '/admin/dashboard', category: 'page', keywords: ['home', 'main'] },
  { id: 'page-setup', label: 'Setup & Onboarding', icon: <Rocket className="h-4 w-4" />, href: '/admin/setup', category: 'page', keywords: ['wizard', 'onboard'] },
  { id: 'page-setup-school', label: 'School Profile', icon: <Home className="h-4 w-4" />, href: '/admin/setup/school', category: 'page' },
  { id: 'page-setup-groups', label: 'Group Management', icon: <Users className="h-4 w-4" />, href: '/admin/setup/group', category: 'page', keywords: ['age', 'playgroup', 'nursery'] },
  { id: 'page-setup-classes', label: 'Classes & Programs', icon: <GraduationCap className="h-4 w-4" />, href: '/admin/setup/classes', category: 'page' },
  { id: 'page-admissions', label: 'Admissions', icon: <Zap className="h-4 w-4" />, href: '/admin/admissions', category: 'page', keywords: ['leads', 'crm', 'pipeline'] },
  { id: 'page-students', label: 'Students', icon: <GraduationCap className="h-4 w-4" />, href: '/admin/students', category: 'page', keywords: ['kids', 'children'] },
  { id: 'page-parents', label: 'Parents', icon: <Users className="h-4 w-4" />, href: '/admin/parents', category: 'page' },
  { id: 'page-teachers', label: 'Teachers', icon: <Users className="h-4 w-4" />, href: '/admin/teachers', category: 'page', keywords: ['staff'] },
  { id: 'page-fees', label: 'Fees', icon: <IndianRupee className="h-4 w-4" />, href: '/admin/fees', category: 'page', keywords: ['payment', 'invoice'] },
  { id: 'page-communication', label: 'Communication', icon: <MessageCircle className="h-4 w-4" />, href: '/admin/communication', category: 'page', keywords: ['chat', 'whatsapp', 'announce'] },
  { id: 'page-reports', label: 'Reports', icon: <BarChart3 className="h-4 w-4" />, href: '/admin/reports', category: 'page', keywords: ['analytics'] },
  { id: 'page-ai-center', label: 'AI Center', icon: <Sparkles className="h-4 w-4" />, href: '/admin/ai-center', category: 'page', keywords: ['artificial', 'intelligence'] },
  { id: 'page-calendar', label: 'Calendar', icon: <Calendar className="h-4 w-4" />, href: '/admin/operations/calendar', category: 'page' },
  { id: 'page-settings', label: 'Settings', icon: <Settings className="h-4 w-4" />, href: '/admin/settings', category: 'page', keywords: ['config', 'branding'] },
  // Actions
  { id: 'action-create-student', label: 'Create Student', icon: <GraduationCap className="h-4 w-4" />, href: '/admin/students?action=create', category: 'action', description: 'Add a new student', keywords: ['add', 'new', 'enroll'] },
  { id: 'action-create-lead', label: 'Create Lead', icon: <Zap className="h-4 w-4" />, href: '/admin/admissions/leads/new', category: 'action', description: 'Add a new admission lead', keywords: ['admission', 'new'] },
  { id: 'action-send-announcement', label: 'Send Announcement', icon: <MessageCircle className="h-4 w-4" />, href: '/admin/communication/announcements?action=create', category: 'action', keywords: ['broadcast', 'notify'] },
  { id: 'action-generate-report', label: 'Generate Report', icon: <BarChart3 className="h-4 w-4" />, href: '/admin/reports', category: 'action', keywords: ['export', 'download'] },
];

const STORAGE_KEY = 'preone_recent_pages';
const MAX_RECENT = 5;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentPages, setRecentPages] = useState<CommandItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { schoolName } = useSchoolBranding();

  // Load recent pages from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const paths: string[] = JSON.parse(saved);
        const found = paths
          .map((p) => ALL_ITEMS.find((pg) => pg.href === p))
          .filter(Boolean) as CommandItem[];
        const items = found.map((p) => ({ ...p, category: 'recent' as const }));
        setRecentPages(items);
      }
    } catch { /* ignore */ }
  }, []);

  // Global keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
        if (!open) {
          setQuery('');
          setSelectedIndex(0);
        }
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Build filtered results
  const results = useMemo(() => {
    if (!query.trim()) {
      // Show recent pages first, then actions
      const actions = ALL_ITEMS.filter((i) => i.category === 'action').slice(0, 3);
      return [...recentPages.slice(0, 3), ...actions];
    }
    const q = query.toLowerCase();
    return ALL_ITEMS.filter((item) => {
      const matchLabel = item.label.toLowerCase().includes(q);
      const matchKeywords = item.keywords?.some((kw) => kw.includes(q));
      const matchDesc = item.description?.toLowerCase().includes(q);
      return matchLabel || matchKeywords || matchDesc;
    });
  }, [query, recentPages]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  // Navigate to item
  const navigateTo = useCallback(
    (item: CommandItem) => {
      if (item.href) {
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          const paths: string[] = saved ? JSON.parse(saved) : [];
          const updated = [item.href, ...paths.filter((p) => p !== item.href)].slice(0, MAX_RECENT);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch { /* ignore */ }
        router.push(item.href);
      }
      setOpen(false);
    },
    [router]
  );

  // Keyboard navigation within results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      navigateTo(results[selectedIndex]);
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'recent': return 'Recent';
      case 'page': return 'Pages';
      case 'action': return 'Actions';
      default: return cat;
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'recent': return <Clock className="h-3 w-3" />;
      case 'action': return <Hash className="h-3 w-3" />;
      default: return <ChevronRight className="h-3 w-3" />;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed left-1/2 top-[15%] z-[101] w-full max-w-xl -translate-x-1/2"
            style={{
              backgroundColor: 'var(--admin-surface)',
              border: '1px solid var(--admin-border)',
              borderRadius: '16px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Search Input */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: '1px solid var(--admin-border)' }}
            >
              <Search
                className="h-5 w-5 shrink-0"
                style={{ color: 'var(--admin-text-muted)' }}
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Search ${schoolName}...`}
                className="flex-1 bg-transparent text-base outline-none"
                style={{
                  color: 'var(--admin-text)',
                }}
              />
              <kbd
                className="hidden sm:inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px] font-mono"
                style={{
                  borderColor: 'var(--admin-border)',
                  color: 'var(--admin-text-subtle)',
                  backgroundColor: 'var(--admin-surface-2)',
                }}
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[300px] overflow-y-auto py-2 px-2">
              {results.length === 0 ? (
                <div
                  className="px-4 py-8 text-center text-sm"
                  style={{ color: 'var(--admin-text-muted)' }}
                >
                  No results found for &ldquo;{query}&rdquo;
                </div>
              ) : (
                results.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors"
                    style={{
                      backgroundColor:
                        idx === selectedIndex
                          ? 'var(--admin-primary-soft)'
                          : 'transparent',
                    }}
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: 'var(--admin-surface-2)',
                        color:
                          idx === selectedIndex
                            ? 'var(--admin-primary)'
                            : 'var(--admin-text-muted)',
                      }}
                    >
                      {item.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-medium truncate"
                        style={{ color: 'var(--admin-text)' }}
                      >
                        {item.label}
                      </div>
                      {item.description && (
                        <div
                          className="text-xs truncate"
                          style={{ color: 'var(--admin-text-muted)' }}
                        >
                          {item.description}
                        </div>
                      )}
                    </div>
                    <span
                      className="flex items-center gap-1 shrink-0 text-[10px]"
                      style={{ color: 'var(--admin-text-subtle)' }}
                    >
                      {getCategoryIcon(item.category)}
                      {getCategoryLabel(item.category)}
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-4 py-2 text-[10px]"
              style={{
                borderTop: '1px solid var(--admin-border)',
                color: 'var(--admin-text-subtle)',
              }}
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border px-1 py-0.5" style={{ borderColor: 'var(--admin-border)' }}>↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border px-1 py-0.5" style={{ borderColor: 'var(--admin-border)' }}>↵</kbd>
                  Open
                </span>
              </div>
              <span>{schoolName}</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
