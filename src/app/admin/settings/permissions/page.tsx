'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield,
  Save,
  Key,
  Loader2,
  AlertCircle,
  RefreshCw,
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

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

export default function PermissionsSettingsPage() {
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const res = await fetch('/api/settings/permissions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to load permissions');
      }
      const json = await res.json();
      setPermissions(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const togglePermission = (role: string, key: string) => {
    setPermissions((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [role]: { ...prev[role], [key]: !prev[role][key] },
      };
    });
  };

  const handleSave = async () => {
    if (!permissions) return;
    setSaving(true);
    setError('');
    try {
      const token = getToken();
      const res = await fetch('/api/settings/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(permissions),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to save permissions');
      }
      const json = await res.json();
      setPermissions(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSaving(false);
    }
  };

  const countPermissions = (role: string) => {
    const total = PERMISSION_MODULES.reduce((s, m) => s + m.permissions.length, 0);
    const granted = Object.values(permissions?.[role] || {}).filter(Boolean).length;
    return { granted, total };
  };

  if (loading) {
    return (
      <PageTransition>
        <StaggerContainer className="space-y-6">
          <StaggerItem>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-xl" />
              <div>
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-4 w-72 mt-1" />
              </div>
            </div>
          </StaggerItem>
          <StaggerItem>
            <Skeleton className="h-40 w-full rounded-3xl" />
          </StaggerItem>
        </StaggerContainer>
      </PageTransition>
    );
  }

  if (error && !permissions) {
    return (
      <PageTransition>
        <StaggerContainer className="space-y-6">
          <StaggerItem>
            <h1 className="text-2xl font-bold font-heading text-[var(--admin-text)] flex items-center gap-2">
              <Key className="w-6 h-6" style={{ color: theme.primary }} />
              Permission Management
            </h1>
          </StaggerItem>
          <StaggerItem>
            <PreOneCard variant="default">
              <PreOneCardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
                  <p className="text-[var(--admin-text)] font-medium mb-1">Failed to load permissions</p>
                  <p className="text-sm text-[var(--admin-text-muted)] mb-4">{error}</p>
                  <Button onClick={fetchPermissions} variant="outline" className="rounded-xl">
                    <RefreshCw className="w-4 h-4 mr-2" /> Retry
                  </Button>
                </div>
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>
        </StaggerContainer>
      </PageTransition>
    );
  }

  if (!permissions) return null;

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-heading text-[var(--admin-text)] flex items-center gap-2">
                <Key className="w-6 h-6" style={{ color: theme.primary }} />
                Permission Management
              </h1>
              <p className="text-sm text-[var(--admin-text-muted)] mt-1">Toggle permissions by role</p>
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save All
            </Button>
          </div>
          {error && <p className="text-sm text-rose-500 mt-2">{error}</p>}
        </StaggerItem>

        {/* Role Stats */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ROLES.map((role) => {
              const { granted, total } = countPermissions(role);
              return (
                <PreOneCard key={role} variant="strip" className="p-4">
                  <p className="text-xs text-[var(--admin-text-muted)]">{role}</p>
                  <p className="text-lg font-bold" style={{ color: theme.primary }}>{granted}/{total}</p>
                  <p className="text-[10px] text-[var(--admin-text-subtle)]">permissions granted</p>
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
                <h3 className="font-semibold text-[var(--admin-text)] mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[var(--admin-text-muted)]" /> {module.group}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left text-xs font-medium text-[var(--admin-text-muted)] pb-2 w-48">Permission</th>
                        {ROLES.map((role) => (
                          <th key={role} className="text-center text-xs font-medium text-[var(--admin-text-muted)] pb-2 px-2 min-w-[100px]">
                            <div>{role}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {module.permissions.map((perm) => (
                        <tr key={perm.key} className="border-b border-[var(--admin-border)] hover:bg-[var(--admin-surface-2)]/50">
                          <td className="py-2 text-sm text-[var(--admin-text-muted)]">{perm.label}</td>
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
