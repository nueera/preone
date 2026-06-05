'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '@/lib/stores/chat-store';

/**
 * Initialize chat connection on app mount.
 * Reads the auth token from localStorage and connects to the socket server.
 * Automatically loads threads and cleans up on unmount.
 */
export function useChatInit() {
  const connect = useChatStore((s) => s.connect);
  const disconnect = useChatStore((s) => s.disconnect);
  const loadThreads = useChatStore((s) => s.loadThreads);

  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('preone_token')
        : null;

    if (token) {
      connect(token);
      loadThreads();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, loadThreads]);
}

/**
 * Typing indicator with debounce.
 * Fires `setTyping(true)` on every keystroke, then auto-stops after 3 seconds
 * of inactivity. Call `handleStopTyping()` when the user sends or clears the input.
 */
export function useTypingIndicator(threadId: string) {
  const setTyping = useChatStore((s) => s.setTyping);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleTyping = useCallback(() => {
    setTyping(threadId, true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setTyping(threadId, false);
    }, 3000);
  }, [threadId, setTyping]);

  const handleStopTyping = useCallback(() => {
    clearTimeout(typingTimer.current);
    setTyping(threadId, false);
  }, [threadId, setTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(typingTimer.current);
    };
  }, []);

  return { handleTyping, handleStopTyping };
}

/**
 * Infinite scroll for messages.
 * - Automatically scrolls to bottom on new messages.
 * - Provides `loadMore()` for loading older messages when scrolled to top.
 * - Uses cursor-based pagination with the oldest message id as cursor.
 */
export function useMessageScroll(threadId: string) {
  const messages = useChatStore((s) => s.messages[threadId] || []);
  const hasMore = useChatStore((s) => s.hasMore[threadId]);
  const loadMessages = useChatStore((s) => s.loadMessages);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  const loadMore = useCallback(() => {
    if (!hasMore || messages.length === 0) return;
    loadMessages(threadId, messages[0].id);
  }, [threadId, hasMore, messages, loadMessages]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    // If messages were appended at the bottom (new messages), auto-scroll
    if (messages.length > prevLengthRef.current) {
      const wasNearBottom =
        container.scrollHeight -
          container.scrollTop -
          container.clientHeight <
        150;

      if (wasNearBottom || messages.length - prevLengthRef.current === 1) {
        container.scrollTop = container.scrollHeight;
      }
    }

    prevLengthRef.current = messages.length;
  }, [messages.length]);

  return { scrollRef, loadMore, hasMore };
}
