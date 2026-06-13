'use client';

import React, { useState } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import { Switch } from '@/components/ui/switch';
import {
  Shield,
  Save,
  CheckCircle2,
  XCircle,
  Users,
  Key,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

const ROLES = ['Super Admin', 'Admin', 'Task Master', 'Teacher'];

const PERMISSION_MODULES = [
  {
    group: 'Core',
    permissions: [
      { key: 'dashboard.view', label: 'View Dashboard' },
      { key: 'dashboard.analytics', label: 'View Analytics' },
    ],
  },
  {
    group: 'Students',
    permissions: [
      { key: 'students.view', label: 'View Students' },
      { key: 'students.create', label: 'Add Students' },
      { key: 'students.edit', label: 'Edit Students' },
      { key: 'students.delete', label: 'Delete Students' },
      { key: 'students.import', label: 'Import Students' },
    ],
  },
  {
    group: 'Teachers',
    permissions: [
      { key: 'teachers.view', label: 'View Teachers' },
      { key: 'teachers.create', label: 'Add Teachers' },
      { key: 'teachers.edit', label: 'Edit Teachers' },
      { key: 'teachers.delete', label: 'Delete Teachers' },
    ],
  },
  {
    group: 'Attendance',
    permissions: [
      { key: 'attendance.view', label: 'View Attendance' },
      { key: 'attendance.mark', label: 'Mark Attendance' },
      { key: 'attendance.reports', label: 'Attendance Reports' },
    ],
  },
  {
    group: 'Fees',
    permissions: [
      { key: 'fees.view', label: 'View Fees' },
      { key: 'fees.collect', label: 'Collect Payments' },
      { key: 'fees.invoices', label: 'Manage Invoices' },
      { key: 'fees.reports', label: 'Fee Reports' },
    ],
  },
  {
    group: 'CRM',
    permissions: [
      { key: 'crm.view', label: 'View CRM' },
      { key: 'crm.leads', label: 'Manage Leads' },
      { key: 'crm.pipeline', label: 'Pipeline Access' },
    ],
  },
  {
    group: 'Growth',
    permissions: [
      { key: 'growth.view', label: 'View Growth Data' },
      { key: 'growth.observations', label: 'Add Observations' },
      { key: 'growth.reports', label: 'Growth Reports' },
    ],
  },
  {
    group: 'Communication',
    permissions: [
      { key: 'comm.view', label: 'View Communication' },
      { key: 'comm.send', label: 'Send Messages' },
      { key: 'comm.templates', label: 'Manage Templates' },
    ],
  },
  {
    group: 'Settings',
    permissions: [
      { key: 'settings.view', label: 'View Settings' },
      { key: 'settings.edit', label: 'Edit Settings' },
      { key: 'settings.users', label: 'Manage Users' },
      { key: 'settings.roles', label: 'Manage Roles' },
    ],
  },
  {
    group: 'System',
    permissions: [
      { key: 'system.monitoring', label: 'System Monitoring' },
      { key: 'system.audit', label: 'Audit Logs' },
      { key: 'system.errors', label: 'Error Logs' },
    ],
  },
];

const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  'Super Admin': Object.fromEntries(PERMISSION_MODULES.flatMap((m) => m.permissions.map((p) => [p.key, true]))),
  'Admin': Object.fromEntries(PERMISSION_MODULES.flatMap((m) => m.permissions.map((p) => [p.key, !p.key.startsWith('system.')]))),
  'Task Master': Object.fromEntries(PERMISSION_MODULES.flatMap((m) => m.permissions.map((p) => [p.key, p.key.startsWith('dashboard.') || p.key.startsWith('crm.') || p.key === 'comm.view' || p.key === 'comm.send']))),
  'Teacher': Object.fromEntries(PERMISSION_MODULES.flatMap((m) => m.permissions.map((p) => [p.key, p.key.startsWith('dashboard.') || p.key.startsWith('students.view') || p.key.startsWith('attendance.') || p.key.startsWith('growth.') || p.key === 'comm.view' || p.key === 'comm.send' || p.key === 'fees.view']))),
};

export default function PermissionsSettingsPage() {
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>(DEFAULT_PERMISSIONS);

  const togglePermission = (role: string, key: string) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: { ...prev[role], [key]: !prev[role][key] },
    }));
  };

  const countPermissions = (role: string) => {
    const total = PERMISSION_MODULES.reduce((s, m) => s + m.permissions.length, 0);
    const granted = Object.values(permissions[role] || {}).filter(Boolean).length;
    return { granted, total };
  };

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Key className="w-6 h-6" style={{ color: theme.primary }} />
                Permission Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">Toggle permissions by role</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md">
              <Save className="w-4 h-4 mr-2" /> Save All
            </Button>
          </div>
        </StaggerItem>

        {/* Role Stats */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ROLES.map((role) => {
              const { granted, total } = countPermissions(role);
              return (
                <PreOneCard key={role} variant="strip" className="p-4">
                  <p className="text-xs text-gray-500">{role}</p>
                  <p className="text-lg font-bold" style={{ color: theme.primary }}>{granted}/{total}</p>
                  <p className="text-[10px] text-gray-400">permissions granted</p>
                </PreOneCard>
              );
            })}
          </div>
        </StaggerItem>

        {/* Permission Grid */}
        {PERMISSION_MODULES.map((module) => (
          <StaggerItem key={module.group}>
            <PreOneCard variant="default">
              <PreOneCardContent>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-500" /> {module.group}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left text-xs font-medium text-gray-500 pb-2 w-48">Permission</th>
                        {ROLES.map((role) => (
                          <th key={role} className="text-center text-xs font-medium text-gray-500 pb-2 px-2 min-w-[100px]">
                            <div>{role}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {module.permissions.map((perm) => (
                        <tr key={perm.key} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="py-2 text-sm text-gray-700">{perm.label}</td>
                          {ROLES.map((role) => {
                            const checked = permissions[role]?.[perm.key] || false;
                            return (
                              <td key={role} className="py-2 text-center">
                                <Switch checked={checked} onCheckedChange={() => togglePermission(role, perm.key)} className="mx-auto" />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </PageTransition>
  );
}
