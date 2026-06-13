'use client';

import React, { useState, useMemo } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Plus,
  Search,
  Shield,
  Key,
  Mail,
  MoreHorizontal,
  UserPlus,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  lastLogin: string;
  avatar: string;
}

const MOCK_USERS: UserRecord[] = [
  { id: '1', name: 'Principal Sharma', email: 'principal@preone.com', role: 'ADMIN', status: 'ACTIVE', lastLogin: '2h ago', avatar: 'PS' },
  { id: '2', name: 'Ms. Priya', email: 'priya@preone.com', role: 'TEACHER', status: 'ACTIVE', lastLogin: '1h ago', avatar: 'MP' },
  { id: '3', name: 'Mr. Raj', email: 'raj@preone.com', role: 'TEACHER', status: 'ACTIVE', lastLogin: '3h ago', avatar: 'MR' },
  { id: '4', name: 'Ms. Kavitha', email: 'kavitha@preone.com', role: 'TEACHER', status: 'ACTIVE', lastLogin: '30m ago', avatar: 'MK' },
  { id: '5', name: 'Ms. Sana', email: 'sana@preone.com', role: 'TEACHER', status: 'ACTIVE', lastLogin: '1d ago', avatar: 'MS' },
  { id: '6', name: 'Admin User', email: 'admin@preone.com', role: 'SUPER_ADMIN', status: 'ACTIVE', lastLogin: '5m ago', avatar: 'AU' },
  { id: '7', name: 'Reception Desk', email: 'reception@preone.com', role: 'TASK_MASTER', status: 'ACTIVE', lastLogin: '4h ago', avatar: 'RD' },
  { id: '8', name: 'Old Teacher', email: 'old@preone.com', role: 'TEACHER', status: 'INACTIVE', lastLogin: '30d ago', avatar: 'OT' },
];

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-50 text-red-700',
  ADMIN: 'bg-purple-50 text-purple-700',
  TASK_MASTER: 'bg-amber-50 text-amber-700',
  TEACHER: 'bg-blue-50 text-blue-700',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  INACTIVE: 'bg-gray-50 text-gray-700',
  PENDING: 'bg-amber-50 text-amber-700',
};

export default function UsersSettingsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return MOCK_USERS.filter((u) => {
      const matchSearch = !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [searchQuery, roleFilter]);

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
            <PreOneCard variant="strip" className="p-4"><p className="text-xs text-gray-500">Total Users</p><p className="text-lg font-bold text-purple-700">{MOCK_USERS.length}</p></PreOneCard>
            <PreOneCard variant="strip" className="p-4"><p className="text-xs text-gray-500">Active</p><p className="text-lg font-bold text-emerald-700">{MOCK_USERS.filter((u) => u.status === 'ACTIVE').length}</p></PreOneCard>
            <PreOneCard variant="strip" className="p-4"><p className="text-xs text-gray-500">Teachers</p><p className="text-lg font-bold text-blue-700">{MOCK_USERS.filter((u) => u.role === 'TEACHER').length}</p></PreOneCard>
            <PreOneCard variant="strip" className="p-4"><p className="text-xs text-gray-500">Admins</p><p className="text-lg font-bold text-red-700">{MOCK_USERS.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length}</p></PreOneCard>
          </div>
        </StaggerItem>

        {/* Filters */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="flex gap-1.5">
              {['all', 'SUPER_ADMIN', 'ADMIN', 'TASK_MASTER', 'TEACHER'].map((r) => (
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
                      <TableCell><Badge className={`${ROLE_COLORS[u.role] || 'bg-gray-50'} text-[10px]`}>{u.role}</Badge></TableCell>
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
            </div>
          </PreOneCard>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}
