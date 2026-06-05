'use client';

import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

// ────────────────────────────────────────────
// Type definitions
// ────────────────────────────────────────────

interface ChatThread {
  id: string;
  type: string;
  name: string | null;
  schoolId: string;
  branchId?: string | null;
  classId?: string | null;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
  onlyAdminsCanMessage: boolean;
  participants: {
    userId: string;
    role: string;
    unreadCount: number;
    isMuted: boolean;
    isPinned: boolean;
    user: { id: string; name: string; avatar: string | null; role: string };
  }[];
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  type: string;
  mediaUrl?: string | null;
  mediaThumbnail?: string | null;
  mediaType?: string | null;
  mediaSize?: number | null;
  replyToId?: string | null;
  isEdited: boolean;
  isDeleted: boolean;
  reactions: string;
  metadata: string;
  createdAt: string;
  sender: { id: string; name: string; avatar: string | null; role: string };
  replyTo?: { id: string; content: string; sender: { name: string } } | null;
}

interface TypingUser {
  threadId: string;
  userId: string;
  isTyping: boolean;
}

interface OnlineUser {
  userId: string;
  name?: string;
  role?: string;
}

interface ChatState {
  // ── State ──
  socket: Socket | null;
  isConnected: boolean;
  threads: ChatThread[];
  activeThread: ChatThread | null;
  messages: Record<string, ChatMessage[]>;
  typingUsers: TypingUser[];
  onlineUsers: OnlineUser[];
  hasMore: Record<string, boolean>;
  totalUnread: number;

  // ── Actions ──
  connect: (token: string) => void;
  disconnect: () => void;
  loadThreads: () => Promise<void>;
  loadMessages: (threadId: string, cursor?: string) => Promise<void>;
  sendMessage: (data: {
    threadId: string;
    content: string;
    type?: string;
    mediaUrl?: string;
    replyToId?: string;
  }) => void;
  editMessage: (messageId: string, content: string) => void;
  deleteMessage: (messageId: string) => void;
  reactToMessage: (messageId: string, emoji: string) => void;
  markAsRead: (threadId: string) => void;
  setTyping: (threadId: string, isTyping: boolean) => void;
  createThread: (data: Record<string, unknown>) => void;
  setActiveThread: (thread: ChatThread | null) => void;
}

// ────────────────────────────────────────────
// Store
// ────────────────────────────────────────────

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  isConnected: false,
  threads: [],
  activeThread: null,
  messages: {},
  typingUsers: [],
  onlineUsers: [],
  hasMore: {},
  totalUnread: 0,

  // ────────────────────────────────────────
  // Connect to Socket.io server
  // ────────────────────────────────────────
  connect: (token: string) => {
    const existing = get().socket;
    if (existing?.connected) return;

    const socket = io({
      path: '/api/socketio',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    // ── Connection events ──
    socket.on('connect', () => {
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    // ── Message events ──
    socket.on('message:new', (message: ChatMessage) => {
      set((state) => {
        const threadMessages = state.messages[message.threadId] || [];
        // Avoid duplicates
        if (threadMessages.some((m) => m.id === message.id)) return state;

        const updatedMessages = {
          ...state.messages,
          [message.threadId]: [...threadMessages, message],
        };

        // Update thread preview + unread
        const updatedThreads = state.threads.map((t) => {
          if (t.id !== message.threadId) return t;
          const isMe = message.senderId === (socket as any)?.auth?.token; // approximate check
          return {
            ...t,
            lastMessagePreview: message.content?.substring(0, 100) || '',
            lastMessageAt: message.createdAt,
            unreadCount: isMe ? t.unreadCount : t.unreadCount + 1,
          };
        });

        const totalUnread = updatedThreads.reduce(
          (sum, t) => sum + (t.unreadCount || 0),
          0,
        );

        return {
          messages: updatedMessages,
          threads: updatedThreads,
          totalUnread,
        };
      });
    });

    socket.on('message:edited', (data: ChatMessage) => {
      set((state) => {
        const threadMessages = state.messages[data.threadId];
        if (!threadMessages) return state;

        return {
          messages: {
            ...state.messages,
            [data.threadId]: threadMessages.map((m) =>
              m.id === data.id
                ? { ...m, content: data.content, isEdited: true }
                : m,
            ),
          },
        };
      });
    });

    socket.on('message:deleted', ({ messageId }: { messageId: string }) => {
      set((state) => {
        const newMessages: Record<string, ChatMessage[]> = {};
        for (const [threadId, msgs] of Object.entries(state.messages)) {
          newMessages[threadId] = msgs.map((m) =>
            m.id === messageId
              ? { ...m, isDeleted: true, content: 'This message was deleted' }
              : m,
          );
        }
        return { messages: newMessages };
      });
    });

    socket.on(
      'message:reaction',
      ({
        messageId,
        reactions,
      }: {
        messageId: string;
        reactions: Record<string, string[]>;
      }) => {
        set((state) => {
          const newMessages: Record<string, ChatMessage[]> = {};
          for (const [threadId, msgs] of Object.entries(state.messages)) {
            newMessages[threadId] = msgs.map((m) =>
              m.id === messageId
                ? { ...m, reactions: JSON.stringify(reactions) }
                : m,
            );
          }
          return { messages: newMessages };
        });
      },
    );

    // ── Thread events ──
    socket.on('thread:new', (thread: ChatThread) => {
      set((state) => {
        if (state.threads.some((t) => t.id === thread.id)) return state;
        return { threads: [thread, ...state.threads] };
      });
    });

    socket.on(
      'thread:read',
      ({ threadId }: { threadId: string }) => {
        set((state) => {
          const updatedThreads = state.threads.map((t) =>
            t.id === threadId ? { ...t, unreadCount: 0 } : t,
          );
          const totalUnread = updatedThreads.reduce(
            (sum, t) => sum + (t.unreadCount || 0),
            0,
          );
          return { threads: updatedThreads, totalUnread };
        });
      },
    );

    // ── Typing events ──
    socket.on('user:typing', (data: TypingUser) => {
      set((state) => {
        const filtered = state.typingUsers.filter(
          (t) =>
            !(t.threadId === data.threadId && t.userId === data.userId),
        );
        if (data.isTyping) {
          return { typingUsers: [...filtered, data] };
        }
        return { typingUsers: filtered };
      });
    });

    // ── Presence events ──
    socket.on('user:online', (data: OnlineUser) => {
      set((state) => {
        if (state.onlineUsers.some((u) => u.userId === data.userId))
          return state;
        return { onlineUsers: [...state.onlineUsers, data] };
      });
    });

    socket.on(
      'user:offline',
      ({ userId }: { userId: string }) => {
        set((state) => ({
          onlineUsers: state.onlineUsers.filter((u) => u.userId !== userId),
        }));
      },
    );

    socket.on(
      'presence:onlineUsers',
      (users: OnlineUser[]) => {
        set({ onlineUsers: users });
      },
    );

    set({ socket });
  },

  // ────────────────────────────────────────
  // Disconnect from Socket.io
  // ────────────────────────────────────────
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }
    set({
      socket: null,
      isConnected: false,
      onlineUsers: [],
      typingUsers: [],
    });
  },

  // ────────────────────────────────────────
  // Load threads from REST API
  // ────────────────────────────────────────
  loadThreads: async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('preone_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/chat/threads', { headers });
      if (!res.ok) throw new Error('Failed to load threads');
      const data = await res.json();
      const threads: ChatThread[] = data.threads || [];
      const totalUnread = data.totalUnread || threads.reduce(
        (sum, t) => sum + (t.unreadCount || 0),
        0,
      );
      set({ threads, totalUnread });
    } catch (err) {
      console.error('[ChatStore] loadThreads error:', err);
    }
  },

  // ────────────────────────────────────────
  // Load messages for a thread (cursor-based pagination)
  // ────────────────────────────────────────
  loadMessages: async (threadId: string, cursor?: string) => {
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (cursor) params.set('before', cursor);

      const token = typeof window !== 'undefined' ? localStorage.getItem('preone_token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(
        `/api/chat/threads/${threadId}/messages?${params.toString()}`,
        { headers },
      );
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      const incoming: ChatMessage[] = data.messages || [];

      set((state) => {
        const existing = state.messages[threadId] || [];
        const merged =
          cursor && existing.length > 0
            ? [...incoming, ...existing] // prepend older messages
            : incoming;

        // Deduplicate by id
        const seen = new Set<string>();
        const deduped = merged.filter((m) => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });

        return {
          messages: { ...state.messages, [threadId]: deduped },
          hasMore: {
            ...state.hasMore,
            [threadId]: incoming.length >= 50,
          },
        };
      });
    } catch (err) {
      console.error('[ChatStore] loadMessages error:', err);
    }
  },

  // ────────────────────────────────────────
  // Send message via Socket.io
  // ────────────────────────────────────────
  sendMessage: (data) => {
    const { socket } = get();
    if (!socket?.connected) {
      console.warn('[ChatStore] Cannot send — socket not connected');
      return;
    }
    socket.emit('message:send', data);
  },

  // ────────────────────────────────────────
  // Edit message via Socket.io
  // ────────────────────────────────────────
  editMessage: (messageId, content) => {
    const { socket } = get();
    if (!socket?.connected) return;
    socket.emit('message:edit', { messageId, content });
  },

  // ────────────────────────────────────────
  // Delete message via Socket.io
  // ────────────────────────────────────────
  deleteMessage: (messageId) => {
    const { socket } = get();
    if (!socket?.connected) return;
    socket.emit('message:delete', { messageId });
  },

  // ────────────────────────────────────────
  // React to message via Socket.io
  // ────────────────────────────────────────
  reactToMessage: (messageId, emoji) => {
    const { socket } = get();
    if (!socket?.connected) return;
    socket.emit('message:react', { messageId, emoji });
  },

  // ────────────────────────────────────────
  // Mark thread as read
  // ────────────────────────────────────────
  markAsRead: (threadId) => {
    const { socket } = get();
    if (!socket?.connected) return;

    // Optimistic update
    set((state) => {
      const updatedThreads = state.threads.map((t) =>
        t.id === threadId ? { ...t, unreadCount: 0 } : t,
      );
      const totalUnread = updatedThreads.reduce(
        (sum, t) => sum + (t.unreadCount || 0),
        0,
      );
      return { threads: updatedThreads, totalUnread };
    });

    socket.emit('message:read', { threadId });
  },

  // ────────────────────────────────────────
  // Set typing indicator
  // ────────────────────────────────────────
  setTyping: (threadId, isTyping) => {
    const { socket } = get();
    if (!socket?.connected) return;
    socket.emit('message:typing', { threadId, isTyping });
  },

  // ────────────────────────────────────────
  // Create a new thread via Socket.io
  // ────────────────────────────────────────
  createThread: (data) => {
    const { socket } = get();
    if (!socket?.connected) return;
    socket.emit('thread:create', data);
  },

  // ────────────────────────────────────────
  // Set active thread
  // ────────────────────────────────────────
  setActiveThread: (thread) => {
    set({ activeThread: thread });

    // Auto-load messages when switching thread
    if (thread) {
      const state = get();
      const existing = state.messages[thread.id];
      if (!existing || existing.length === 0) {
        state.loadMessages(thread.id);
      }
      // Mark as read
      state.markAsRead(thread.id);
    }
  },
}));
