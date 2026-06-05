'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useChatStore } from '@/lib/stores/chat-store';
import { useTypingIndicator, useMessageScroll } from '@/hooks/use-chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMediaUpload } from './chat-media-upload';
import {
  ArrowLeft,
  Info,
  Send,
  Paperclip,
  Smile,
  Reply,
  MoreHorizontal,
  Pencil,
  Trash2,
  Image as ImageIcon,
  FileText,
  Mic,
  Users,
  Phone,
  Video,
  Check,
  CheckCheck,
  X,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────

interface ChatMessageAreaProps {
  thread: ReturnType<typeof useChatStore.getState>['threads'][0];
  onBack: () => void;
  onInfoToggle: () => void;
  showInfo?: boolean;
}

// ─── Main Component ───────────────────────────────

export function ChatMessageArea({
  thread,
  onBack,
  onInfoToggle,
  showInfo,
}: ChatMessageAreaProps) {
  const messages = useChatStore((s) => s.messages[thread.id] || []);
  const onlineUsers = useChatStore((s) => s.onlineUsers);
  const typingUsers = useChatStore((s) => s.typingUsers);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const reactToMessage = useChatStore((s) => s.reactToMessage);
  const deleteMessage = useChatStore((s) => s.deleteMessage);

  const [messageText, setMessageText] = useState('');
  const [replyTo, setReplyTo] = useState<{
    id: string;
    content: string;
    sender: { name: string };
  } | null>(null);
  const [showAttachments, setShowAttachments] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { handleTyping, handleStopTyping } = useTypingIndicator(thread.id);
  const { scrollRef, loadMore, hasMore } = useMessageScroll(thread.id);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get current user id from localStorage
  const currentUserId =
    typeof window !== 'undefined'
      ? (() => {
          try {
            const u = localStorage.getItem('preone_user');
            return u ? JSON.parse(u).id : '';
          } catch {
            return '';
          }
        })()
      : '';

  // Typing indicators for this thread
  const activeTyping = typingUsers.filter(
    (t) => t.threadId === thread.id && t.userId !== currentUserId
  );

  // Is the other participant online?
  const otherParticipant = thread.participants?.find(
    (p) => p.userId !== currentUserId
  );
  const isOtherOnline = otherParticipant
    ? onlineUsers.some((u) => u.userId === otherParticipant.userId)
    : false;

  // Get display name for thread
  const threadName =
    thread.name ||
    otherParticipant?.user?.name ||
    (thread.type === 'DIRECT' ? 'Direct Message' : 'Group Chat');

  const handleSend = useCallback(() => {
    const text = messageText.trim();
    if (!text) return;

    sendMessage({
      threadId: thread.id,
      content: text,
      type: 'TEXT',
      replyToId: replyTo?.id,
    });

    setMessageText('');
    setReplyTo(null);
    handleStopTyping();
    inputRef.current?.focus();
  }, [messageText, thread.id, sendMessage, replyTo, handleStopTyping]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessageText(e.target.value);
      handleTyping();
    },
    [handleTyping]
  );

  const handleReaction = useCallback(
    (messageId: string, emoji: string) => {
      reactToMessage(messageId, emoji);
    },
    [reactToMessage]
  );

  const handleDelete = useCallback(
    (messageId: string) => {
      deleteMessage(messageId);
      toast.success('Message deleted');
    },
    [deleteMessage]
  );

  // Group messages by date
  const groupedMessages = messages.reduce<
    Record<string, typeof messages>
  >((acc, msg) => {
    const date = format(new Date(msg.createdAt), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)] bg-[var(--bg-primary)]/80 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          {/* Back button (mobile) */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 rounded-xl shrink-0"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <Avatar className="h-10 w-10 rounded-xl shrink-0">
            {otherParticipant?.user?.avatar && (
              <AvatarImage
                src={otherParticipant.user.avatar}
                alt={threadName}
              />
            )}
            <AvatarFallback
              className={cn(
                'rounded-xl text-sm font-semibold',
                thread.type === 'DIRECT'
                  ? 'bg-gradient-to-br from-[var(--preone-primary)] to-[var(--preone-blue)] text-white'
                  : 'bg-gradient-to-br from-[var(--preone-orange)] to-[var(--preone-pink)] text-white'
              )}
            >
              {thread.type === 'CLASS_GROUP' ? (
                <Users className="h-4 w-4" />
              ) : (
                threadName
                  .split(' ')
                  .map((w) => w[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
              )}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {threadName}
            </h3>
            <div className="flex items-center gap-1.5">
              {thread.type === 'DIRECT' ? (
                <span
                  className={cn(
                    'text-xs',
                    isOtherOnline
                      ? 'text-[var(--preone-green)]'
                      : 'text-[var(--text-muted)]'
                  )}
                >
                  {isOtherOnline ? 'Online' : 'Offline'}
                </span>
              ) : (
                <span className="text-xs text-[var(--text-muted)]">
                  {thread.participants?.length || 0} members
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl hidden sm:flex"
          >
            <Phone className="h-4 w-4 text-[var(--text-secondary)]" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl hidden sm:flex"
          >
            <Video className="h-4 w-4 text-[var(--text-secondary)]" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl"
            onClick={onInfoToggle}
          >
            <Info
              className={cn(
                'h-4 w-4',
                showInfo
                  ? 'text-[var(--preone-primary)]'
                  : 'text-[var(--text-secondary)]'
              )}
            />
          </Button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-1"
      >
        {hasMore && (
          <div className="flex justify-center py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMore}
              className="text-xs text-[var(--text-muted)] rounded-xl"
            >
              Load earlier messages
            </Button>
          </div>
        )}

        {messages.length === 0 ? (
          <EmptyMessageState />
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <DateSeparator date={date} />
              <div className="space-y-1">
                {msgs.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderId === currentUserId}
                    onReply={setReplyTo}
                    onDelete={handleDelete}
                    onReact={handleReaction}
                    onImageClick={setImagePreview}
                  />
                ))}
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        <AnimatePresence>
          {activeTyping.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2 px-2 py-1"
            >
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--preone-primary)] animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--preone-primary)] animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--preone-primary)] animate-bounce [animation-delay:300ms]" />
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                {activeTyping.length === 1
                  ? 'Someone is typing...'
                  : `${activeTyping.length} people are typing...`}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Reply Preview Bar ── */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[var(--border-default)] bg-[var(--bg-secondary)]"
          >
            <div className="flex items-center gap-2 px-4 py-2">
              <div className="w-1 h-8 rounded-full bg-[var(--preone-primary)]" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[var(--preone-primary)]">
                  {replyTo.sender.name}
                </p>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {replyTo.content}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => setReplyTo(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Attachment Tray ── */}
      <AnimatePresence>
        {showAttachments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[var(--border-default)] bg-[var(--bg-secondary)]"
          >
            <ChatMediaUpload
              threadId={thread.id}
              onClose={() => setShowAttachments(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input Area ── */}
      <div className="p-3 border-t border-[var(--border-default)] bg-[var(--bg-primary)]">
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl shrink-0"
            onClick={() => setShowAttachments(!showAttachments)}
          >
            <Paperclip className="h-4 w-4 text-[var(--text-secondary)]" />
          </Button>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={messageText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className={cn(
                'w-full resize-none rounded-2xl bg-[var(--bg-secondary)]',
                'border border-[var(--border-default)]',
                'px-4 py-2.5 pr-10',
                'text-sm text-[var(--text-primary)]',
                'placeholder:text-[var(--text-muted)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--preone-primary)]/30 focus:border-[var(--preone-primary)]/50',
                'max-h-32 overflow-y-auto custom-scrollbar',
                'transition-all duration-200'
              )}
              style={{ minHeight: '40px' }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 bottom-1 h-7 w-7 rounded-lg"
            >
              <Smile className="h-4 w-4 text-[var(--text-muted)]" />
            </Button>
          </div>

          <Button
            onClick={handleSend}
            disabled={!messageText.trim()}
            className={cn(
              'h-9 w-9 rounded-xl shrink-0 p-0',
              messageText.trim()
                ? 'bg-gradient-to-r from-[var(--preone-primary)] to-[var(--preone-blue)] text-white shadow-md hover:shadow-lg'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
            )}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Image Preview Modal ── */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setImagePreview(null)}
          >
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              src={imagePreview}
              alt="Preview"
              className="max-w-full max-h-full rounded-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
              onClick={() => setImagePreview(null)}
            >
              <X className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────

interface MessageBubbleProps {
  message: ReturnType<typeof useChatStore.getState>['messages'][string][0];
  isOwn: boolean;
  onReply: (
    reply: { id: string; content: string; sender: { name: string } } | null
  ) => void;
  onDelete: (id: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onImageClick: (url: string) => void;
}

function MessageBubble({
  message,
  isOwn,
  onReply,
  onDelete,
  onReact,
  onImageClick,
}: MessageBubbleProps) {
  const [showActions, setShowActions] = useState(false);
  const reactions = message.reactions ? JSON.parse(message.reactions) : {};

  if (message.isDeleted) {
    return (
      <div
        className={cn(
          'flex px-2 py-1',
          isOwn ? 'justify-end' : 'justify-start'
        )}
      >
        <p className="text-xs italic text-[var(--text-muted)] px-3 py-2 rounded-2xl bg-[var(--bg-secondary)]">
          This message was deleted
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group flex gap-2 px-2 py-0.5',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar (for others' messages) */}
      {!isOwn && (
        <Avatar className="h-8 w-8 rounded-lg shrink-0 mt-auto mb-5">
          {message.sender?.avatar && (
            <AvatarImage src={message.sender.avatar} alt={message.sender.name} />
          )}
          <AvatarFallback className="rounded-lg text-xs bg-gradient-to-br from-[var(--preone-primary)] to-[var(--preone-blue)] text-white">
            {message.sender?.name
              ?.split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn('max-w-[75%] min-w-0', isOwn && 'flex flex-col items-end')}>
        {/* Sender name + timestamp */}
        {!isOwn && (
          <div className="flex items-center gap-2 mb-0.5 px-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">
              {message.sender?.name || 'Unknown'}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">
              {format(new Date(message.createdAt), 'HH:mm')}
            </span>
          </div>
        )}

        {/* Reply indicator */}
        {message.replyTo && (
          <div
            className={cn(
              'mb-1 px-3 py-1.5 rounded-xl text-xs',
              'bg-[var(--bg-secondary)] border-l-2 border-[var(--preone-primary)]',
              isOwn ? 'mr-2' : 'ml-2'
            )}
          >
            <p className="font-semibold text-[var(--preone-primary)]">
              {message.replyTo.sender?.name}
            </p>
            <p className="text-[var(--text-muted)] truncate">
              {message.replyTo.content}
            </p>
          </div>
        )}

        {/* Bubble */}
        <div className="relative">
          <div
            className={cn(
              'px-3.5 py-2 rounded-2xl text-sm leading-relaxed break-words',
              isOwn
                ? 'bg-gradient-to-r from-[var(--preone-primary)] to-[var(--preone-blue)] text-white rounded-br-md'
                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-bl-md border border-[var(--border-default)]'
            )}
          >
            {/* Image content */}
            {message.type === 'IMAGE' && message.mediaUrl && (
              <div className="mb-2 -mx-1 -mt-1">
                <img
                  src={message.mediaUrl}
                  alt="Shared image"
                  className="rounded-xl max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => onImageClick(message.mediaUrl!)}
                />
              </div>
            )}

            {/* File content */}
            {message.type === 'FILE' && message.mediaUrl && (
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl mb-2',
                  isOwn
                    ? 'bg-white/10'
                    : 'bg-[var(--bg-tertiary)]'
                )}
              >
                <FileText className="h-5 w-5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">Attachment</p>
                  {message.mediaSize && (
                    <p className="text-[10px] opacity-70">
                      {(message.mediaSize / 1024).toFixed(1)} KB
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Text content */}
            <p className="whitespace-pre-wrap">{message.content}</p>

            {/* Edited indicator */}
            {message.isEdited && (
              <span
                className={cn(
                  'text-[10px] ml-1',
                  isOwn ? 'text-white/60' : 'text-[var(--text-muted)]'
                )}
              >
                (edited)
              </span>
            )}
          </div>

          {/* Hover actions */}
          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  'absolute top-0 flex items-center gap-0.5',
                  isOwn
                    ? '-left-2 -translate-x-full'
                    : '-right-2 translate-x-full'
                )}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg bg-[var(--bg-primary)] shadow-sm border border-[var(--border-default)]"
                  onClick={() =>
                    onReply({
                      id: message.id,
                      content: message.content,
                      sender: { name: message.sender?.name || 'Unknown' },
                    })
                  }
                >
                  <Reply className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg bg-[var(--bg-primary)] shadow-sm border border-[var(--border-default)]"
                  onClick={() => onReact(message.id, '👍')}
                >
                  👍
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg bg-[var(--bg-primary)] shadow-sm border border-[var(--border-default)]"
                  onClick={() => onReact(message.id, '❤️')}
                >
                  ❤️
                </Button>
                {isOwn && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg bg-[var(--bg-primary)] shadow-sm border border-[var(--border-default)] text-red-500 hover:text-red-600"
                    onClick={() => onDelete(message.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reactions */}
        {Object.keys(reactions).length > 0 && (
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            {Object.entries(reactions).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => onReact(message.id, emoji)}
                className={cn(
                  'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs',
                  'bg-[var(--bg-secondary)] border border-[var(--border-default)]',
                  'hover:bg-[var(--bg-tertiary)] transition-colors'
                )}
              >
                <span>{emoji}</span>
                <span className="text-[var(--text-muted)]">
                  {(users as string[]).length}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Own message timestamp */}
        {isOwn && (
          <div className="flex items-center justify-end gap-1 mt-0.5 px-1">
            <span className="text-[10px] text-[var(--text-muted)]">
              {format(new Date(message.createdAt), 'HH:mm')}
            </span>
            <CheckCheck className="h-3 w-3 text-[var(--preone-blue)]" />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Date Separator ───────────────────────────────

function DateSeparator({ date }: { date: string }) {
  const label = (() => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return format(d, 'MMMM d, yyyy');
  })();

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 h-px bg-[var(--border-default)]" />
      <span className="text-[11px] font-medium text-[var(--text-muted)] px-3 py-1 rounded-full bg-[var(--bg-secondary)]">
        {label}
      </span>
      <div className="flex-1 h-px bg-[var(--border-default)]" />
    </div>
  );
}

// ─── Empty Message State ──────────────────────────

function EmptyMessageState() {
  return (
    <div className="flex-1 flex items-center justify-center py-12">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[var(--preone-primary)]/10 to-[var(--preone-blue)]/10 flex items-center justify-center">
          <MessageCircle className="h-7 w-7 text-[var(--preone-primary)]" />
        </div>
        <p className="text-sm font-medium text-[var(--text-primary)]">
          No messages yet
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Send a message to start the conversation
        </p>
      </div>
    </div>
  );
}
