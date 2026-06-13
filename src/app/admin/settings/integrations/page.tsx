'use client';

import React, { useState } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  apiKey?: string;
  webhookUrl?: string;
  lastSync?: string;
}

const MOCK_INTEGRATIONS: Integration[] = [
  { id: '1', name: 'WhatsApp Business API', description: 'Send messages, templates, and broadcasts via WhatsApp', icon: MessageSquare, status: 'CONNECTED', apiKey: 'sk-whatsapp-****-****-abcd', lastSync: '5m ago' },
  { id: '2', name: 'Razorpay Payments', description: 'Process fee payments and manage subscriptions', icon: Globe, status: 'CONNECTED', apiKey: 'rzp_live_****-****-efgh', lastSync: '1h ago' },
  { id: '3', name: 'Google Workspace', description: 'Sync calendars and manage email', icon: Globe, status: 'DISCONNECTED' },
  { id: '4', name: 'Webhook Service', description: 'Send real-time event notifications', icon: Webhook, status: 'ERROR', webhookUrl: 'https://api.example.com/webhook', lastSync: '2d ago' },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  CONNECTED: { color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle2 },
  DISCONNECTED: { color: 'text-gray-700', bg: 'bg-gray-50', icon: XCircle },
  ERROR: { color: 'text-red-700', bg: 'bg-red-50', icon: AlertTriangle },
};

export default function IntegrationsSettingsPage() {
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [integrations] = useState<Integration[]>(MOCK_INTEGRATIONS);

  const toggleShowKey = (id: string) => {
    setShowKey((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Plug className="w-6 h-6" style={{ color: theme.primary }} />
                Integrations
              </h1>
              <p className="text-sm text-gray-500 mt-1">API keys, webhooks, and connected services</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md">
              <Save className="w-4 h-4 mr-2" /> Save All
            </Button>
          </div>
        </StaggerItem>

        {/* Integration Cards */}
        {integrations.map((integration) => {
          const statusCfg = STATUS_CONFIG[integration.status];
          const StatusIcon = statusCfg.icon;
          const Icon = integration.icon;
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
                        <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                        <p className="text-xs text-gray-500">{integration.description}</p>
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
                        <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center gap-1">
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
                        <label className="text-sm font-medium text-gray-700 mb-1 block flex items-center gap-1">
                          <Webhook className="w-3 h-3" /> Webhook URL
                        </label>
                        <Input value={integration.webhookUrl} readOnly className="font-mono text-sm" />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-xs text-gray-400">
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
