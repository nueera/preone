'use client';

import React, { useState } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Shield,
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: Record<string, boolean>;
  isSystem: boolean;
}

const PERMISSION_CATEGORIES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'students', label: 'Students' },
  { key: 'teachers', label: 'Teachers' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'fees', label: 'Fees' },
  { key: 'crm', label: 'CRM/Admissions' },
  { key: 'growth', label: 'Growth Passport' },
  { key: 'communication', label: 'Communication' },
  { key: 'reports', label: 'Reports' },
  { key: 'settings', label: 'Settings' },
  { key: 'system', label: 'System' },
];

const MOCK_ROLES: Role[] = [
  { id: '1', name: 'Super Admin', description: 'Full system access with all permissions', userCount: 1, isSystem: true, permissions: Object.fromEntries(PERMISSION_CATEGORIES.map((p) => [p.key, true])) },
  { id: '2', name: 'Admin', description: 'Full access except system settings', userCount: 2, isSystem: true, permissions: { dashboard: true, students: true, teachers: true, attendance: true, fees: true, crm: true, growth: true, communication: true, reports: true, settings: true, system: false } },
  { id: '3', name: 'Task Master', description: 'CRM and dashboard access only', userCount: 1, isSystem: false, permissions: { dashboard: true, students: false, teachers: false, attendance: false, fees: false, crm: true, growth: false, communication: true, reports: false, settings: false, system: false } },
  { id: '4', name: 'Teacher', description: 'Class and student management', userCount: 4, isSystem: false, permissions: { dashboard: true, students: true, teachers: false, attendance: true, fees: false, crm: false, growth: true, communication: true, reports: true, settings: false, system: false } },
];

export default function RolesSettingsPage() {
  const [roles] = useState<Role[]>(MOCK_ROLES);
  const [selectedRole, setSelectedRole] = useState<Role>(MOCK_ROLES[0]);

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-6 h-6" style={{ color: theme.primary }} />
                Role Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">Manage roles and their permission matrices</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md">
              <Plus className="w-4 h-4 mr-2" /> Add Role
            </Button>
          </div>
        </StaggerItem>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Role List */}
          <StaggerItem>
            <PreOneCard variant="default">
              <PreOneCardContent>
                <h3 className="font-semibold text-gray-900 mb-4">Roles</h3>
                <div className="space-y-2">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                        selectedRole.id === role.id ? 'border-purple-400 bg-purple-50/50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedRole(role)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-gray-900">{role.name}</h4>
                        <div className="flex items-center gap-1">
                          {role.isSystem && <Badge className="bg-gray-50 text-gray-500 text-[9px]">System</Badge>}
                          <Badge variant="outline" className="text-[9px]"><Users className="w-2.5 h-2.5 mr-0.5" />{role.userCount}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">{role.description}</p>
                    </div>
                  ))}
                </div>
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>

          {/* Permissions Matrix */}
          <StaggerItem className="lg:col-span-2">
            <PreOneCard variant="default">
              <PreOneCardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{selectedRole.name} — Permissions</h3>
                    <p className="text-xs text-gray-400">{selectedRole.description}</p>
                  </div>
                  <div className="flex gap-1">
                    {!selectedRole.isSystem && <Button variant="ghost" size="sm" className="h-7 text-xs"><Edit className="w-3 h-3 mr-1" /> Edit</Button>}
                    {!selectedRole.isSystem && <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600"><Trash2 className="w-3 h-3 mr-1" /> Delete</Button>}
                  </div>
                </div>
                <div className="space-y-2">
                  {PERMISSION_CATEGORIES.map((cat) => {
                    const hasPermission = selectedRole.permissions[cat.key];
                    return (
                      <div key={cat.key} className="flex items-center justify-between p-3 rounded-xl border hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          {hasPermission ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-300" />
                          )}
                          <span className="text-sm text-gray-700">{cat.label}</span>
                        </div>
                        <Switch checked={hasPermission} disabled={selectedRole.isSystem} />
                      </div>
                    );
                  })}
                </div>
                {!selectedRole.isSystem && (
                  <div className="mt-4 flex justify-end">
                    <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white">Save Permissions</Button>
                  </div>
                )}
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>
        </div>
      </StaggerContainer>
    </PageTransition>
  );
}
