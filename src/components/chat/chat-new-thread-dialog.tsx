'use client';

import { useState, useCallback } from 'react';
import { useChatStore } from '@/lib/stores/chat-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Users, MessageCircle, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ChatNewThreadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock users for demonstration — in production this would come from search API
const MOCK_USERS = [
  { id: 'u1', name: 'Sarah Johnson', role: 'TEACHER', avatar: null },
  { id: 'u2', name: 'Michael Chen', role: 'TEACHER', avatar: null },
  { id: 'u3', name: 'Priya Sharma', role: 'PARENT', avatar: null },
  { id: 'u4', name: 'David Wilson', role: 'PARENT', avatar: null },
  { id: 'u5', name: 'Emily Davis', role: 'TEACHER', avatar: null },
  { id: 'u6', name: 'Raj Patel', role: 'PARENT', avatar: null },
];

export function ChatNewThreadDialog({
  open,
  onOpenChange,
}: ChatNewThreadDialogProps) {
  const createThread = useChatStore((s) => s.createThread);
  const setActiveThread = useChatStore((s) => s.setActiveThread);

  const [threadType, setThreadType] = useState<'dm' | 'group'>('dm');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const filteredUsers = MOCK_USERS.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUser = useCallback((userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }, []);

  const handleCreate = useCallback(async () => {
    if (threadType === 'dm' && selectedUsers.length !== 1) {
      toast.error('Select one person for a direct message');
      return;
    }
    if (threadType === 'group' && selectedUsers.length === 0) {
      toast.error('Add at least one participant');
      return;
    }
    if (threadType === 'group' && !groupName.trim()) {
      toast.error('Enter a group name');
      return;
    }

    setIsCreating(true);

    try {
      createThread({
        type: threadType === 'dm' ? 'DIRECT' : 'CLASS_GROUP',
        name: threadType === 'group' ? groupName.trim() : undefined,
        participantIds: selectedUsers,
      });

      toast.success(
        threadType === 'dm'
          ? 'Direct message created'
          : 'Group created successfully'
      );

      // Reset & close
      setSelectedUsers([]);
      setGroupName('');
      setSearchQuery('');
      onOpenChange(false);
    } catch {
      toast.error('Failed to create conversation');
    } finally {
      setIsCreating(false);
    }
  }, [threadType, selectedUsers, groupName, createThread, onOpenChange]);

  const canCreate =
    threadType === 'dm'
      ? selectedUsers.length === 1
      : selectedUsers.length > 0 && groupName.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-lg font-semibold text-[var(--text-primary)]">
            New Conversation
          </DialogTitle>
          <DialogDescription className="text-sm text-[var(--text-muted)]">
            Start a new direct message or group chat
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pt-4">
          {/* Type Tabs */}
          <Tabs
            value={threadType}
            onValueChange={(v) => {
              setThreadType(v as 'dm' | 'group');
              setSelectedUsers([]);
              setSearchQuery('');
            }}
          >
            <TabsList className="w-full bg-[var(--bg-secondary)] rounded-xl h-10">
              <TabsTrigger
                value="dm"
                className="flex-1 rounded-lg text-sm data-[state=active]:bg-[var(--bg-primary)] data-[state=active]:shadow-sm"
              >
                <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                Direct
              </TabsTrigger>
              <TabsTrigger
                value="group"
                className="flex-1 rounded-lg text-sm data-[state=active]:bg-[var(--bg-primary)] data-[state=active]:shadow-sm"
              >
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Group
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Group Name (for groups only) */}
          {threadType === 'group' && (
            <div className="mt-4">
              <Input
                placeholder="Group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="rounded-xl bg-[var(--bg-secondary)] border-[var(--border-default)] text-sm h-10"
              />
            </div>
          )}

          {/* Selected users */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {selectedUsers.map((userId) => {
                const user = MOCK_USERS.find((u) => u.id === userId);
                return (
                  <Badge
                    key={userId}
                    className="rounded-lg px-2 py-1 bg-[var(--preone-primary-50)] text-[var(--preone-primary)] border-[var(--preone-primary)]/20 text-xs flex items-center gap-1"
                  >
                    {user?.name?.split(' ')[0] || 'User'}
                    <button
                      onClick={() => toggleUser(userId)}
                      className="hover:bg-[var(--preone-primary)]/10 rounded-full p-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <Input
              placeholder={
                threadType === 'dm'
                  ? 'Search for a person...'
                  : 'Add participants...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl bg-[var(--bg-secondary)] border-[var(--border-default)] text-sm h-10"
            />
          </div>

          {/* User List */}
          <ScrollArea className="h-56 mt-3 -mx-6 px-6">
            <div className="space-y-1">
              {filteredUsers.map((user) => {
                const isSelected = selectedUsers.includes(user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleUser(user.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left',
                      isSelected
                        ? 'bg-[var(--preone-primary-50)] border border-[var(--preone-primary)]/20'
                        : 'hover:bg-[var(--bg-secondary)] border border-transparent'
                    )}
                  >
                    <Avatar className="h-9 w-9 rounded-lg">
                      <AvatarFallback className="rounded-lg text-xs bg-gradient-to-br from-[var(--preone-primary)] to-[var(--preone-blue)] text-white">
                        {user.name
                          .split(' ')
                          .map((w) => w[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {user.role}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="h-5 w-5 rounded-full bg-[var(--preone-primary)] flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="p-6 pt-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!canCreate || isCreating}
            className={cn(
              'rounded-xl',
              canCreate
                ? 'bg-gradient-to-r from-[var(--preone-primary)] to-[var(--preone-blue)] text-white'
                : ''
            )}
          >
            {isCreating ? 'Creating...' : threadType === 'dm' ? 'Start Chat' : 'Create Group'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
