'use client';

import { useChatStore } from '@/lib/stores/chat-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  X,
  Users,
  BellOff,
  LogOut,
  UserPlus,
  Image as ImageIcon,
  FileText,
  Link2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface ChatThreadInfoProps {
  thread: ReturnType<typeof useChatStore.getState>['threads'][0];
  onClose: () => void;
}

export function ChatThreadInfo({ thread, onClose }: ChatThreadInfoProps) {
  const onlineUsers = useChatStore((s) => s.onlineUsers);

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

  const otherParticipant = thread.participants?.find(
    (p) => p.userId !== currentUserId
  );

  const threadName =
    thread.name ||
    otherParticipant?.user?.name ||
    (thread.type === 'DIRECT' ? 'Direct Message' : 'Group Chat');

  const isGroup = thread.type === 'CLASS_GROUP';

  const isOnline = (userId: string) =>
    onlineUsers.some((u) => u.userId === userId);

  const handleMuteToggle = () => {
    toast.success(
      thread.participants?.some((p) => p.isMuted)
        ? 'Notifications unmuted'
        : 'Notifications muted'
    );
  };

  const handleLeave = () => {
    toast.success('Left conversation');
    onClose();
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Details
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Thread Identity */}
          <motion.div
            className="flex flex-col items-center text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Avatar className="h-20 w-20 rounded-2xl mb-3">
              {otherParticipant?.user?.avatar && (
                <AvatarImage
                  src={otherParticipant.user.avatar}
                  alt={threadName}
                />
              )}
              <AvatarFallback
                className={cn(
                  'rounded-2xl text-2xl font-bold',
                  isGroup
                    ? 'bg-gradient-to-br from-[var(--preone-orange)] to-[var(--preone-pink)] text-white'
                    : 'bg-gradient-to-br from-[var(--preone-primary)] to-[var(--preone-blue)] text-white'
                )}
              >
                {isGroup ? (
                  <Users className="h-8 w-8" />
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

            <h4 className="text-base font-semibold text-[var(--text-primary)]">
              {threadName}
            </h4>

            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="secondary"
                className="text-[10px] rounded-full px-2"
              >
                {isGroup ? 'Group' : 'Direct Message'}
              </Badge>
              {thread.onlyAdminsCanMessage && (
                <Badge
                  variant="outline"
                  className="text-[10px] rounded-full px-2"
                >
                  Admin Only
                </Badge>
              )}
            </div>

            {/* Online status for DMs */}
            {!isGroup && otherParticipant && (
              <div className="flex items-center gap-1.5 mt-2">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    isOnline(otherParticipant.userId)
                      ? 'bg-[var(--preone-green)]'
                      : 'bg-[var(--text-muted)]'
                  )}
                />
                <span className="text-xs text-[var(--text-muted)]">
                  {isOnline(otherParticipant.userId) ? 'Active now' : 'Offline'}
                </span>
              </div>
            )}
          </motion.div>

          <Separator className="bg-[var(--border-default)]" />

          {/* Participants */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Members · {thread.participants?.length || 0}
              </h5>
              {isGroup && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs rounded-lg text-[var(--preone-primary)]"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              )}
            </div>

            <div className="space-y-1">
              {thread.participants?.map((participant) => (
                <div
                  key={participant.userId}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <div className="relative">
                    <Avatar className="h-9 w-9 rounded-lg">
                      {participant.user?.avatar && (
                        <AvatarImage
                          src={participant.user.avatar}
                          alt={participant.user.name}
                        />
                      )}
                      <AvatarFallback className="rounded-lg text-xs bg-gradient-to-br from-[var(--preone-primary)] to-[var(--preone-blue)] text-white">
                        {participant.user?.name
                          ?.split(' ')
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline(participant.userId) && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[var(--preone-green)] border-2 border-[var(--bg-primary)]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {participant.user?.name || 'Unknown'}
                      {participant.userId === currentUserId && (
                        <span className="text-[var(--text-muted)]"> (You)</span>
                      )}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {participant.role === 'admin' ? 'Admin' : 'Member'}
                    </p>
                  </div>
                  {participant.isMuted && (
                    <BellOff className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-[var(--border-default)]" />

          {/* Shared Media */}
          <div>
            <h5 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Shared Media
            </h5>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-default)] flex items-center justify-center"
                >
                  <ImageIcon className="h-5 w-5 text-[var(--text-muted)]" />
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-xs text-[var(--preone-primary)] rounded-xl"
            >
              View all media
            </Button>
          </div>

          <Separator className="bg-[var(--border-default)]" />

          {/* Shared Files */}
          <div>
            <h5 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Shared Files
            </h5>
            <div className="space-y-2">
              {['Lesson Plan.pdf', 'Progress Report.xlsx', 'Schedule.docx'].map(
                (file) => (
                  <div
                    key={file}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                  >
                    <div className="h-9 w-9 rounded-lg bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-[var(--text-muted)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                        {file}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        Shared recently
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <Separator className="bg-[var(--border-default)]" />

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 rounded-xl text-sm h-10"
              onClick={handleMuteToggle}
            >
              <BellOff className="h-4 w-4 text-[var(--text-secondary)]" />
              <span className="text-[var(--text-secondary)]">
                {thread.participants?.some((p) => p.isMuted)
                  ? 'Unmute notifications'
                  : 'Mute notifications'}
              </span>
            </Button>

            {isGroup && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 rounded-xl text-sm h-10 text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={handleLeave}
              >
                <LogOut className="h-4 w-4" />
                Leave group
              </Button>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
