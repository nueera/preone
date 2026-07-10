'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import {
  Plug,
  Save,
  Eye,
  EyeOff,
  Key,
  Globe,
  Webhook,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  apiKey?: string;
  webhookUrl?: string;
  lastSync?: string;
}

// ponytail: icons aren't serializable, so map by name instead of storing them in the API payload.
const ICON_BY_NAME: Record<string, React.ElementType> = {
  'WhatsApp Business API': MessageSquare,
  'Razorpay Payments': Globe,
  'Google Workspace': Globe,
  'Webhook Service': Webhook,
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  CONNECTED: { color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle2 },
  DISCONNECTED: { color: 'text-[var(--admin-text-muted)]', bg: 'bg-[var(--admin-surface-2)]', icon: XCircle },
  ERROR: { color: 'text-red-700', bg: 'bg-red-50', icon: AlertTriangle },
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

export default function IntegrationsSettingsPage() {
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [integrations, setIntegrations] = useState<Integration[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchIntegrations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const res = await fetch('/api/settings/integrations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to load integrations');
      }
      const json = await res.json();
      setIntegrations(json.integrations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const toggleShowKey = (id: string) => {
    setShowKey((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSave = async () => {
    if (!integrations) return;
    setSaving(true);
    setError('');
    try {
      const token = getToken();
      const res = await fetch('/api/settings/integrations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ integrations }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || 'Failed to save integrations');
      }
      const json = await res.json();
      setIntegrations(json.integrations);
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
            <Skeleton className="h-40 w-full rounded-3xl" />
          </StaggerItem>
        </StaggerContainer>
      </PageTransition>
    );
  }

  if (error && !integrations) {
    return (
      <PageTransition>
        <StaggerContainer className="space-y-6">
          <StaggerItem>
            <h1 className="text-2xl font-bold font-heading text-[var(--admin-text)] flex items-center gap-2">
              <Plug className="w-6 h-6" style={{ color: theme.primary }} />
              Integrations
            </h1>
          </StaggerItem>
          <StaggerItem>
            <PreOneCard variant="default">
              <PreOneCardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
                  <p className="text-[var(--admin-text)] font-medium mb-1">Failed to load integrations</p>
                  <p className="text-sm text-[var(--admin-text-muted)] mb-4">{error}</p>
                  <Button onClick={fetchIntegrations} variant="outline" className="rounded-xl">
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

  if (!integrations) return null;

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-heading text-[var(--admin-text)] flex items-center gap-2">
                <Plug className="w-6 h-6" style={{ color: theme.primary }} />
                Integrations
              </h1>
              <p className="text-sm text-[var(--admin-text-muted)] mt-1">API keys, webhooks, and connected services</p>
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save All
            </Button>
          </div>
          {error && <p className="text-sm text-rose-500 mt-2">{error}</p>}
        </StaggerItem>

        {/* Integration Cards */}
        {integrations.map((integration) => {
          const statusCfg = STATUS_CONFIG[integration.status];
          const StatusIcon = statusCfg.icon;
          const Icon = ICON_BY_NAME[integration.name] || Globe;
          return (
            <StaggerItem key={integration.id}>
              <PreOneCard variant="default">
                <PreOneCardContent>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--admin-text)]">{integration.name}</h3>
                        <p className="text-xs text-[var(--admin-text-muted)]">{integration.description}</p>
                      </div>
                    </div>
                    <Badge className={`${statusCfg.bg} ${statusCfg.color} text-[10px]`}>
                      <StatusIcon className="w-3 h-3 mr-1" /> {integration.status}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {/* API Key */}
                    {integration.apiKey && (
                      <div>
                        <label className="text-sm font-medium text-[var(--admin-text-muted)] mb-1 block flex items-center gap-1">
                          <Key className="w-3 h-3" /> API Key
                        </label>
                        <div className="flex gap-2">
                          <Input
                            value={showKey[integration.id] ? integration.apiKey : integration.apiKey.replace(/./g, '•').slice(0, 20) + '...'}
                            readOnly
                            className="flex-1 font-mono text-sm"
                          />
                          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => toggleShowKey(integration.id)}>
                            {showKey[integration.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Webhook URL */}
                    {integration.webhookUrl && (
                      <div>
                        <label className="text-sm font-medium text-[var(--admin-text-muted)] mb-1 block flex items-center gap-1">
                          <Webhook className="w-3 h-3" /> Webhook URL
                        </label>
                        <Input value={integration.webhookUrl} readOnly className="font-mono text-sm" />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-xs text-[var(--admin-text-subtle)]">
                        {integration.lastSync && <span>Last sync: {integration.lastSync}</span>}
                      </div>
                      <div className="flex gap-2">
                        {integration.status === 'CONNECTED' && (
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            <RefreshCw className="w-3 h-3 mr-1" /> Sync
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          {integration.status === 'CONNECTED' ? 'Disconnect' : 'Connect'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </PreOneCardContent>
              </PreOneCard>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </PageTransition>
  );
}
