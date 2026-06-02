// ============================================================
// PreOne — Parent API Client
// Shared fetch helper for all parent portal API calls
// Handles auth token injection, 401/403 redirects, and errors
// ============================================================

const TOKEN_KEY = 'preone_token';
const USER_KEY = 'preone_user';

// Role-based dashboard redirect map
const ROLE_DASHBOARD: Record<string, string> = {
  ADMIN: '/admin/dashboard',
  TEACHER: '/teacher/dashboard',
  PARENT: '/parent/dashboard',
  TASK_MASTER: '/taskmaster/dashboard',
};

/**
 * parentFetch — Drop-in replacement for fetch() in parent portal pages.
 * Automatically adds Authorization header, handles 401/403 redirects.
 */
export async function parentFetch(
  path: string,
  options?: RequestInit
): Promise<Response | null> {
  if (typeof window === 'undefined') return null;

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    window.location.href = '/login';
    return null;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options?.headers as Record<string, string> | undefined),
  };

  // Don't set Content-Type for FormData uploads
  if (options?.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  try {
    const res = await fetch(path, {
      ...options,
      headers,
    });

    // Handle 401 — Token expired or invalid
    if (res.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = '/login';
      return null;
    }

    // Handle 403 — Role mismatch
    if (res.status === 403) {
      try {
        const user = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
        const role = user.role as string | undefined;
        if (role && ROLE_DASHBOARD[role]) {
          window.location.href = ROLE_DASHBOARD[role];
        } else {
          window.location.href = '/login';
        }
      } catch {
        window.location.href = '/login';
      }
      return null;
    }

    return res;
  } catch (error) {
    console.error('Parent API fetch error:', error);
    throw error;
  }
}

/**
 * parentGet — Convenience GET helper
 */
export async function parentGet<T = unknown>(path: string): Promise<T> {
  const res = await parentFetch(path);
  if (!res) throw new Error('Request failed');
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || err.message || 'Request failed');
  }
  return res.json();
}

/**
 * parentPost — Convenience POST helper
 */
export async function parentPost<T = unknown>(
  path: string,
  body: unknown
): Promise<T> {
  const res = await parentFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res) throw new Error('Request failed');
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || err.message || 'Request failed');
  }
  return res.json();
}

/**
 * parentPatch — Convenience PATCH helper
 */
export async function parentPatch<T = unknown>(
  path: string,
  body: unknown
): Promise<T> {
  const res = await parentFetch(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  if (!res) throw new Error('Request failed');
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || err.message || 'Request failed');
  }
  return res.json();
}

/**
 * getToken — Get the current auth token from localStorage
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * getSelectedChildId — Get the currently selected child ID
 */
export function getSelectedChildId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_selected_child');
}

/**
 * setSelectedChildId — Store the selected child ID
 */
export function setSelectedChildId(childId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('preone_selected_child', childId);
}
