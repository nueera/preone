'use client';

import React, { useState } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Puzzle,
  Plug,
  Settings,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Plus,
  MessageSquare,
  CreditCard,
  Smartphone,
  Mail,
  Calendar,
  BarChart3,
  Shield,
  Wifi,
  WifiOff,
  Loader2,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const theme = PORTAL_THEMES.admin;

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'connected' | 'disconnected' | 'error';
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  lastSync?: string;
  features: string[];
  configureFields?: { label: string; placeholder: string }[];
}

const INTEGRATIONS: Integration[] = [
  {
    id: '1',
    name: 'WhatsApp Business API',
    description:
      'Send automated messages, notifications, and daily updates to parents via WhatsApp',
    category: 'Communication',
    status: 'connected',
    icon: <MessageSquare className="h-6 w-6" />,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    lastSync: '2 minutes ago',
    features: [
      'Automated daily updates',
      'Fee payment reminders',
      'Event notifications',
      'Emergency alerts',
    ],
    configureFields: [
      { label: 'Phone Number ID', placeholder: 'Enter Phone Number ID' },
      { label: 'Business Account ID', placeholder: 'Enter Business Account ID' },
      { label: 'Access Token', placeholder: 'Enter permanent access token' },
    ],
  },
  {
    id: '2',
    name: 'Razorpay Payment Gateway',
    description:
      'Accept online fee payments, set up recurring billing, and auto-generate receipts',
    category: 'Payments',
    status: 'connected',
    icon: <CreditCard className="h-6 w-6" />,
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-600',
    lastSync: '5 minutes ago',
    features: [
      'Online fee collection',
      'Auto receipt generation',
      'Recurring payments',
      'Payment reminders',
    ],
    configureFields: [
      { label: 'API Key ID', placeholder: 'rzp_live_xxxxxxxx' },
      { label: 'API Key Secret', placeholder: 'Enter API secret' },
      { label: 'Webhook URL', placeholder: 'Auto-generated' },
    ],
  },
  {
    id: '3',
    name: 'SMS Provider (MSG91)',
    description:
      'Send bulk SMS for attendance alerts, fee reminders, and important announcements',
    category: 'Communication',
    status: 'disconnected',
    icon: <Smartphone className="h-6 w-6" />,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    features: [
      'Bulk SMS broadcasting',
      'Attendance notifications',
      'Fee reminders',
      'Custom templates',
    ],
    configureFields: [
      { label: 'Auth Key', placeholder: 'Enter MSG91 auth key' },
      { label: 'Sender ID', placeholder: 'e.g., PREONE' },
      { label: 'Template ID', placeholder: 'Enter default template ID' },
    ],
  },
  {
    id: '4',
    name: 'Email Service (SendGrid)',
    description:
      'Send professional emails for newsletters, reports, and parent communications',
    category: 'Communication',
    status: 'disconnected',
    icon: <Mail className="h-6 w-6" />,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    features: [
      'Email campaigns',
      'Report delivery',
      'Branded templates',
      'Delivery analytics',
    ],
    configureFields: [
      { label: 'API Key', placeholder: 'SG.xxxxxxxxxxxxxxxx' },
      { label: 'From Email', placeholder: 'noreply@preone.edu.in' },
      { label: 'From Name', placeholder: 'PreOne School' },
    ],
  },
  {
    id: '5',
    name: 'Google Calendar',
    description:
      'Sync school events, holidays, and parent-teacher meetings with Google Calendar',
    category: 'Productivity',
    status: 'disconnected',
    icon: <Calendar className="h-6 w-6" />,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    features: [
      'Event sync',
      'Holiday calendar',
      'PTM scheduling',
      'Room booking',
    ],
    configureFields: [
      { label: 'Client ID', placeholder: 'Enter Google OAuth Client ID' },
      { label: 'Client Secret', placeholder: 'Enter Google OAuth Client Secret' },
      { label: 'Calendar ID', placeholder: 'Enter primary calendar ID' },
    ],
  },
  {
    id: '6',
    name: 'Tally ERP',
    description:
      'Sync financial data, fee collections, and expenses with Tally for seamless accounting',
    category: 'Finance',
    status: 'disconnected',
    icon: <BarChart3 className="h-6 w-6" />,
    iconBg: 'bg-pink-50',
    iconColor: 'text-pink-600',
    features: [
      'Fee receipt sync',
      'Expense tracking',
      'Financial reports',
      'GST compliance',
    ],
    configureFields: [
      { label: 'Tally IP Address', placeholder: '192.168.1.100' },
      { label: 'Port', placeholder: '9000' },
      { label: 'Company Name', placeholder: 'PreOne Preschool' },
    ],
  },
];

const categoryColors: Record<string, string> = {
  Communication: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Payments: 'bg-sky-50 text-sky-700 border-sky-200',
  Productivity: 'bg-amber-50 text-amber-700 border-amber-200',
  Finance: 'bg-pink-50 text-pink-700 border-pink-200',
};

export default function IntegrationsSetupPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATIONS);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] =
    useState<Integration | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connectedCount = integrations.filter(
    (i) => i.status === 'connected'
  ).length;

  const handleConnect = async (integration: Integration) => {
    setSelectedIntegration(integration);
    setConfigDialogOpen(true);
  };

  const handleConfirmConnect = async () => {
    setConnecting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === selectedIntegration?.id
          ? { ...i, status: 'connected' as const, lastSync: 'Just now' }
          : i
      )
    );
    setConnecting(false);
    setConfigDialogOpen(false);
    toast.success(`${selectedIntegration?.name} connected successfully`);
  };

  const handleDisconnect = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status: 'disconnected' as const, lastSync: undefined }
          : i
      )
    );
    toast.success('Integration disconnected');
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Puzzle className="h-6 w-6 text-violet-600" />
              Third-Party Integrations
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Connect external services to extend PreOne&apos;s capabilities
            </p>
          </div>
          <Button className="gap-1.5 bg-gradient-to-r from-violet-600 to-sky-500 text-white border-0 hover:from-violet-700 hover:to-sky-600">
            <Plus className="h-4 w-4" /> Browse Marketplace
          </Button>
        </div>

        {/* Connection Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <PreOneCard variant="default">
            <div className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Wifi className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {connectedCount}
                </p>
                <p className="text-sm text-gray-500">Connected</p>
              </div>
            </div>
          </PreOneCard>
          <PreOneCard variant="default">
            <div className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center">
                <WifiOff className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-600">
                  {integrations.filter((i) => i.status === 'disconnected').length}
                </p>
                <p className="text-sm text-gray-500">Available</p>
              </div>
            </div>
          </PreOneCard>
          <PreOneCard variant="default">
            <div className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-violet-50 flex items-center justify-center">
                <Zap className="h-6 w-6 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-violet-600">
                  {integrations.length}
                </p>
                <p className="text-sm text-gray-500">Total Integrations</p>
              </div>
            </div>
          </PreOneCard>
        </div>

        {/* Integration Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {integrations.map((intg) => (
            <PreOneCard
              key={intg.id}
              variant="default"
              hover={intg.status === 'disconnected'}
            >
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-12 w-12 rounded-xl flex items-center justify-center',
                        intg.iconBg,
                        intg.iconColor
                      )}
                    >
                      {intg.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">
                        {intg.name}
                      </h3>
                      <Badge
                        className={cn(
                          'text-[10px] mt-1',
                          categoryColors[intg.category] ||
                            'bg-gray-50 text-gray-700'
                        )}
                      >
                        {intg.category}
                      </Badge>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      'text-[10px]',
                      intg.status === 'connected'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : intg.status === 'error'
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                    )}
                  >
                    {intg.status === 'connected' && (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    )}
                    {intg.status === 'disconnected' && (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {intg.status === 'connected'
                      ? 'Connected'
                      : intg.status === 'error'
                      ? 'Error'
                      : 'Available'}
                  </Badge>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-500 leading-relaxed">
                  {intg.description}
                </p>

                {/* Features */}
                <div className="space-y-1">
                  {intg.features.slice(0, 3).map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-1.5 text-xs text-gray-600"
                    >
                      <div className="h-1 w-1 rounded-full bg-violet-400" />
                      {feature}
                    </div>
                  ))}
                  {intg.features.length > 3 && (
                    <p className="text-xs text-gray-400 pl-2.5">
                      +{intg.features.length - 3} more
                    </p>
                  )}
                </div>

                {/* Last Sync */}
                {intg.lastSync && (
                  <p className="text-[10px] text-gray-400">
                    Last synced: {intg.lastSync}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  {intg.status === 'connected' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1"
                        onClick={() => handleConnect(intg)}
                      >
                        <Settings className="h-3 w-3" />
                        Configure
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-red-500 hover:text-red-700"
                        onClick={() => handleDisconnect(intg.id)}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="h-8 text-xs gap-1 bg-gradient-to-r from-violet-600 to-sky-500 text-white border-0"
                      onClick={() => handleConnect(intg)}
                    >
                      <Plug className="h-3 w-3" />
                      Connect
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </PreOneCard>
          ))}
        </div>

        {/* Configure Dialog */}
        <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedIntegration && (
                  <div
                    className={cn(
                      'h-8 w-8 rounded-lg flex items-center justify-center',
                      selectedIntegration.iconBg,
                      selectedIntegration.iconColor
                    )}
                  >
                    {selectedIntegration.icon}
                  </div>
                )}
                {selectedIntegration?.status === 'connected'
                  ? `Configure ${selectedIntegration?.name}`
                  : `Connect ${selectedIntegration?.name}`}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {selectedIntegration?.configureFields?.map((field) => (
                <div key={field.label} className="space-y-1.5">
                  <Label>{field.label}</Label>
                  <Input placeholder={field.placeholder} />
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setConfigDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmConnect}
                  disabled={connecting}
                  className="bg-gradient-to-r from-violet-600 to-sky-500 text-white border-0"
                >
                  {connecting && (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  )}
                  {selectedIntegration?.status === 'connected'
                    ? 'Save Configuration'
                    : 'Connect'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
