'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Shield,
  Plus,
  Users,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Save,
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

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

export default function RolesSettingsPage() {
  const [roles, setRoles] = useState<Role[] | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const res = await fetch('/api/settings/roles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to load roles');
      }
      const json = await res.json();
      setRoles(json.roles);
      setSelectedRoleId((prev) => prev ?? json.roles[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const togglePermission = (roleId: string, key: string) => {
    setRoles((prev) =>
      prev
        ? prev.map((r) =>
            r.id === roleId ? { ...r, permissions: { ...r.permissions, [key]: !r.permissions[key] } } : r
          )
        : prev
    );
  };

  const handleSave = async () => {
    if (!roles) return;
    setSaving(true);
    setError('');
    try {
      const token = getToken();
      const res = await fetch('/api/settings/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ roles }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to save roles');
      }
      const json = await res.json();
      setRoles(json.roles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setSaving(false);
    }
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
            <Skeleton className="h-64 w-full rounded-3xl" />
          </StaggerItem>
        </StaggerContainer>
      </PageTransition>
    );
  }

  if (error && !roles) {
    return (
      <PageTransition>
        <StaggerContainer className="space-y-6">
          <StaggerItem>
            <h1 className="text-2xl font-bold font-heading text-[var(--admin-text)] flex items-center gap-2">
              <Shield className="w-6 h-6" style={{ color: theme.primary }} />
              Role Management
            </h1>
          </StaggerItem>
          <StaggerItem>
            <PreOneCard variant="default">
              <PreOneCardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
                  <p className="text-[var(--admin-text)] font-medium mb-1">Failed to load roles</p>
                  <p className="text-sm text-[var(--admin-text-muted)] mb-4">{error}</p>
                  <Button onClick={fetchRoles} variant="outline" className="rounded-xl">
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

  if (!roles) return null;
  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold font-heading text-[var(--admin-text)] flex items-center gap-2">
                <Shield className="w-6 h-6" style={{ color: theme.primary }} />
                Role Management
              </h1>
              <p className="text-sm text-[var(--admin-text-muted)] mt-1">Manage roles and their permission matrices</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md">
              <Plus className="w-4 h-4 mr-2" /> Add Role
            </Button>
          </div>
          {error && <p className="text-sm text-rose-500 mt-2">{error}</p>}
        </StaggerItem>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Role List */}
          <StaggerItem>
            <PreOneCard variant="default">
              <PreOneCardContent>
                <h3 className="font-semibold text-[var(--admin-text)] mb-4">Roles</h3>
                <div className="space-y-2">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                        selectedRole.id === role.id ? 'border-purple-400 bg-purple-50/50' : 'hover:bg-[var(--admin-surface-2)]'
                      }`}
                      onClick={() => setSelectedRoleId(role.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-medium text-[var(--admin-text)]">{role.name}</h4>
                        <div className="flex items-center gap-1">
                          {role.isSystem && <Badge className="bg-[var(--admin-surface-2)] text-[var(--admin-text-muted)] text-[9px]">System</Badge>}
                          <Badge variant="outline" className="text-[9px]"><Users className="w-2.5 h-2.5 mr-0.5" />{role.userCount}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-[var(--admin-text-subtle)]">{role.description}</p>
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
                    <h3 className="font-semibold text-[var(--admin-text)]">{selectedRole.name} — Permissions</h3>
                    <p className="text-xs text-[var(--admin-text-subtle)]">{selectedRole.description}</p>
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
                      <div key={cat.key} className="flex items-center justify-between p-3 rounded-xl border hover:bg-[var(--admin-surface-2)]">
                        <div className="flex items-center gap-3">
                          {hasPermission ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-[var(--admin-text-subtle)]" />
                          )}
                          <span className="text-sm text-[var(--admin-text-muted)]">{cat.label}</span>
                        </div>
                        <Switch
                          checked={hasPermission}
                          disabled={selectedRole.isSystem}
                          onCheckedChange={() => togglePermission(selectedRole.id, cat.key)}
                        />
                      </div>
                    );
                  })}
                </div>
                {!selectedRole.isSystem && (
                  <div className="mt-4 flex justify-end">
                    <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-violet-600 to-sky-500 text-white">
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Permissions
                    </Button>
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
