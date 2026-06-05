'use client';

import { create } from 'zustand';

// ────────────────────────────────────────────
// Type definitions
// ────────────────────────────────────────────

interface Announcement {
  id: string;
  schoolId: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  target: string;
  targetIds?: string | null;
  branchId?: string | null;
  classId?: string | null;
  attachments?: string | null;
  coverImage?: string | null;
  status: string;
  publishedAt?: string | null;
  scheduledAt?: string | null;
  channels: string;
  sendAsChat: boolean;
  createdBy?: string | null;
  totalRecipients: number;
  readCount: number;
  isRead: boolean;
  createdAt: string;
  creator?: { id: string; name: string; avatar: string | null } | null;
}

interface AnnouncementState {
  announcements: Announcement[];
  drafts: Announcement[];
  currentAnnouncement: Announcement | null;
  isLoading: boolean;

  fetchAnnouncements: (filters?: Record<string, string>) => Promise<void>;
  fetchDrafts: () => Promise<void>;
  createAnnouncement: (data: Record<string, unknown>) => Promise<void>;
  updateAnnouncement: (id: string, data: Record<string, unknown>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  publishAnnouncement: (id: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  setCurrentAnnouncement: (announcement: Announcement | null) => void;
}

// ────────────────────────────────────────────
// Store
// ────────────────────────────────────────────

export const useAnnouncementStore = create<AnnouncementState>((set, get) => ({
  announcements: [],
  drafts: [],
  currentAnnouncement: null,
  isLoading: false,

  // ────────────────────────────────────────
  // Fetch published / filtered announcements
  // ────────────────────────────────────────
  fetchAnnouncements: async (filters?: Record<string, string>) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/announcements?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch announcements');
      const data = await res.json();
      set({ announcements: data.announcements || [], isLoading: false });
    } catch (err) {
      console.error('[AnnouncementStore] fetchAnnouncements error:', err);
      set({ isLoading: false });
    }
  },

  // ────────────────────────────────────────
  // Fetch draft announcements
  // ────────────────────────────────────────
  fetchDrafts: async () => {
    try {
      const res = await fetch('/api/announcements?status=DRAFT');
      if (!res.ok) throw new Error('Failed to fetch drafts');
      const data = await res.json();
      set({ drafts: data.announcements || [] });
    } catch (err) {
      console.error('[AnnouncementStore] fetchDrafts error:', err);
    }
  },

  // ────────────────────────────────────────
  // Create a new announcement
  // ────────────────────────────────────────
  createAnnouncement: async (data) => {
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create announcement');
      const result = await res.json();

      const a = result.announcement || result;
      const newAnnouncement: Announcement = {
        id: a.id,
        schoolId: a.schoolId,
        title: a.title,
        content: a.content,
        type: a.type,
        priority: a.priority,
        target: a.target,
        targetIds: a.targetIds,
        branchId: a.branchId,
        classId: a.classId,
        attachments: a.attachments,
        coverImage: a.coverImage,
        status: a.status,
        publishedAt: a.publishedAt,
        scheduledAt: a.scheduledAt,
        channels: a.channels,
        sendAsChat: a.sendAsChat,
        createdBy: a.createdBy,
        totalRecipients: a.totalRecipients || 0,
        readCount: 0,
        isRead: false,
        createdAt: a.createdAt,
        creator: a.creator,
      };

      set((state) => ({
        announcements: [newAnnouncement, ...state.announcements],
      }));
    } catch (err) {
      console.error('[AnnouncementStore] createAnnouncement error:', err);
      throw err;
    }
  },

  // ────────────────────────────────────────
  // Update an existing announcement
  // ────────────────────────────────────────
  updateAnnouncement: async (id, data) => {
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update announcement');

      set((state) => ({
        announcements: state.announcements.map((a) =>
          a.id === id ? { ...a, ...data } : a,
        ),
        drafts: state.drafts.map((a) =>
          a.id === id ? { ...a, ...data } : a,
        ),
        currentAnnouncement:
          state.currentAnnouncement?.id === id
            ? { ...state.currentAnnouncement, ...data }
            : state.currentAnnouncement,
      }));
    } catch (err) {
      console.error('[AnnouncementStore] updateAnnouncement error:', err);
      throw err;
    }
  },

  // ────────────────────────────────────────
  // Delete an announcement
  // ────────────────────────────────────────
  deleteAnnouncement: async (id) => {
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete announcement');

      set((state) => ({
        announcements: state.announcements.filter((a) => a.id !== id),
        drafts: state.drafts.filter((a) => a.id !== id),
        currentAnnouncement:
          state.currentAnnouncement?.id === id
            ? null
            : state.currentAnnouncement,
      }));
    } catch (err) {
      console.error('[AnnouncementStore] deleteAnnouncement error:', err);
      throw err;
    }
  },

  // ────────────────────────────────────────
  // Publish a draft/scheduled announcement
  // ────────────────────────────────────────
  publishAnnouncement: async (id) => {
    try {
      const res = await fetch(`/api/announcements/${id}/publish`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to publish announcement');

      set((state) => ({
        announcements: state.announcements.map((a) =>
          a.id === id
            ? { ...a, status: 'PUBLISHED', publishedAt: new Date().toISOString() }
            : a,
        ),
        drafts: state.drafts.filter((a) => a.id !== id),
        currentAnnouncement:
          state.currentAnnouncement?.id === id
            ? {
                ...state.currentAnnouncement,
                status: 'PUBLISHED',
                publishedAt: new Date().toISOString(),
              }
            : state.currentAnnouncement,
      }));
    } catch (err) {
      console.error('[AnnouncementStore] publishAnnouncement error:', err);
      throw err;
    }
  },

  // ────────────────────────────────────────
  // Mark announcement as read
  // ────────────────────────────────────────
  markAsRead: async (id) => {
    try {
      // Optimistic update
      set((state) => ({
        announcements: state.announcements.map((a) =>
          a.id === id ? { ...a, isRead: true, readCount: a.readCount + 1 } : a,
        ),
        currentAnnouncement:
          state.currentAnnouncement?.id === id
            ? { ...state.currentAnnouncement, isRead: true }
            : state.currentAnnouncement,
      }));

      await fetch(`/api/announcements/${id}/read`, {
        method: 'PUT',
      });
    } catch (err) {
      console.error('[AnnouncementStore] markAsRead error:', err);
    }
  },

  // ────────────────────────────────────────
  // Set current announcement for detail view
  // ────────────────────────────────────────
  setCurrentAnnouncement: (announcement) => {
    set({ currentAnnouncement: announcement });
  },
}));
