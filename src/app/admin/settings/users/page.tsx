'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Search,
  Key,
  UserPlus,
  Loader2,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin: string;
  avatar: string;
}

interface ApiUser {
  id: string;
  name?: string | null;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin?: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-50 text-purple-700',
  TASK_MASTER: 'bg-amber-50 text-amber-700',
  TEACHER: 'bg-blue-50 text-blue-700',
  PARENT: 'bg-emerald-50 text-emerald-700',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  INACTIVE: 'bg-gray-50 text-gray-700',
};

const ROLE_FILTERS = ['all', 'ADMIN', 'TASK_MASTER', 'TEACHER', 'PARENT'];

function initials(name: string, email: string): string {
  const src = name?.trim() || email;
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || src.slice(0, 2).toUpperCase();
}

function timeAgo(iso?: string | null): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return 'Never';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function UsersSettingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/settings/users?limit=200');
        if (!res.ok) throw new Error('Failed to load users');
        const data = await res.json();
        const apiUsers: ApiUser[] = data.users || [];
        setUsers(apiUsers.map((u) => ({
          id: u.id,
          name: u.name || u.email,
          email: u.email,
          role: u.role,
          status: u.isActive ? 'ACTIVE' : 'INACTIVE',
          lastLogin: timeAgo(u.lastLogin),
          avatar: initials(u.name || '', u.email),
        })));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, searchQuery, roleFilter]);

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter((u) => u.status === 'ACTIVE').length,
    teachers: users.filter((u) => u.role === 'TEACHER').length,
    admins: users.filter((u) => u.role === 'ADMIN').length,
  }), [users]);

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6" style={{ color: theme.primary }} />
                User Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">Manage users, roles, and access</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md">
              <UserPlus className="w-4 h-4 mr-2" /> Add User
            </Button>
          </div>
        </StaggerItem>

        {/* Stats */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <PreOneCard variant="strip" className="p-4"><p className="text-xs text-gray-500">Total Users</p><p className="text-lg font-bold text-purple-700">{stats.total}</p></PreOneCard>
            <PreOneCard variant="strip" className="p-4"><p className="text-xs text-gray-500">Active</p><p className="text-lg font-bold text-emerald-700">{stats.active}</p></PreOneCard>
            <PreOneCard variant="strip" className="p-4"><p className="text-xs text-gray-500">Teachers</p><p className="text-lg font-bold text-blue-700">{stats.teachers}</p></PreOneCard>
            <PreOneCard variant="strip" className="p-4"><p className="text-xs text-gray-500">Admins</p><p className="text-lg font-bold text-red-700">{stats.admins}</p></PreOneCard>
          </div>
        </StaggerItem>

        {/* Filters */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ROLE_FILTERS.map((r) => (
                <Badge key={r} variant={roleFilter === r ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => setRoleFilter(r)}>
                  {r === 'all' ? 'All' : r}
                </Badge>
              ))}
            </div>
          </div>
        </StaggerItem>

        {/* User Table */}
        <StaggerItem>
          <PreOneCard variant="default">
            <div className="overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-gray-400"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading users…</div>
              ) : error ? (
                <div className="py-12 text-center text-red-500 text-sm">{error}</div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">No users found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((u) => (
                      <TableRow key={u.id} className="hover:bg-purple-50/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center text-white text-xs font-bold">{u.avatar}</div>
                            <span className="text-sm font-medium">{u.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{u.email}</TableCell>
                        <TableCell><Badge className={`${ROLE_COLORS[u.role] || 'bg-gray-50 text-gray-600'} text-[10px]`}>{u.role}</Badge></TableCell>
                        <TableCell><Badge className={`${STATUS_COLORS[u.status]} text-[10px]`}>{u.status}</Badge></TableCell>
                        <TableCell className="text-sm text-gray-400">{u.lastLogin}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 text-xs"><Key className="w-3 h-3 mr-1" /> Reset</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </PreOneCard>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}
