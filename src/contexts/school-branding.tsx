'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * SchoolBrandingContext — Provides school-specific branding across the entire app.
 * 
 * White-label ready: each school can customize their logo, name, and accent color.
 * Falls back to PreOne defaults when no school branding is configured.
 * 
 * Usage:
 *   import { useSchoolBranding } from '@/contexts/school-branding';
 *   const { schoolName, schoolLogo, accentColor } = useSchoolBranding();
 */

interface SchoolBranding {
  /** School display name (e.g. "Sunshine Preschool") */
  schoolName: string;
  /** URL or path to school logo image */
  schoolLogo: string | null;
  /** School brand accent color (hex) */
  accentColor: string;
  /** School favicon URL */
  favicon: string | null;
  /** Whether branding has been loaded from API */
  loaded: boolean;
  /** Update school branding (called from Settings > Branding) */
  updateBranding: (updates: Partial<Omit<SchoolBranding, 'loaded' | 'updateBranding' | 'resetBranding'>>) => void;
  /** Reset to PreOne defaults */
  resetBranding: () => void;
}

const PREONE_DEFAULTS = {
  schoolName: 'PreOne',
  schoolLogo: null as string | null,
  accentColor: '#6366F1',
  favicon: null as string | null,
};

const SchoolBrandingContext = createContext<SchoolBranding>({
  ...PREONE_DEFAULTS,
  loaded: false,
  updateBranding: () => {},
  resetBranding: () => {},
});

export function SchoolBrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState({
    ...PREONE_DEFAULTS,
    loaded: false,
  });

  // Load branding from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('preone_school_branding');
      if (saved) {
        const parsed = JSON.parse(saved);
        setBranding({ ...PREONE_DEFAULTS, ...parsed, loaded: true });
      } else {
        // Try loading from user's school data
        const userStr = localStorage.getItem('preone_user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user.schoolName) {
            setBranding((prev) => ({
              ...prev,
              schoolName: user.schoolName,
              loaded: true,
            }));
          } else {
            setBranding((prev) => ({ ...prev, loaded: true }));
          }
        } else {
          setBranding((prev) => ({ ...prev, loaded: true }));
        }
      }
    } catch {
      setBranding((prev) => ({ ...prev, loaded: true }));
    }
  }, []);

  // Apply accent color as CSS variable on the root
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--school-accent', branding.accentColor);
      // Generate soft variant (20% opacity)
      document.documentElement.style.setProperty(
        '--school-accent-soft',
        `${branding.accentColor}33`
      );
      // Apply favicon if set
      if (branding.favicon) {
        const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (link) link.href = branding.favicon;
      }
    }
  }, [branding.accentColor, branding.favicon]);

  const updateBranding = useCallback(
    (updates: Partial<Omit<SchoolBranding, 'loaded' | 'updateBranding' | 'resetBranding'>>) => {
      setBranding((prev) => {
        const next = { ...prev, ...updates };
        try {
          localStorage.setItem(
            'preone_school_branding',
            JSON.stringify({
              schoolName: next.schoolName,
              schoolLogo: next.schoolLogo,
              accentColor: next.accentColor,
              favicon: next.favicon,
            })
          );
        } catch { /* ignore */ }
        return next;
      });
    },
    []
  );

  const resetBranding = useCallback(() => {
    setBranding({ ...PREONE_DEFAULTS, loaded: true });
    try {
      localStorage.removeItem('preone_school_branding');
      document.documentElement.style.removeProperty('--school-accent');
      document.documentElement.style.removeProperty('--school-accent-soft');
    } catch { /* ignore */ }
  }, []);

  return (
    <SchoolBrandingContext.Provider
      value={{
        schoolName: branding.schoolName,
        schoolLogo: branding.schoolLogo,
        accentColor: branding.accentColor,
        favicon: branding.favicon,
        loaded: branding.loaded,
        updateBranding,
        resetBranding,
      }}
    >
      {children}
    </SchoolBrandingContext.Provider>
  );
}

export function useSchoolBranding() {
  const context = useContext(SchoolBrandingContext);
  if (!context) {
    throw new Error('useSchoolBranding must be used within a SchoolBrandingProvider');
  }
  return context;
}
