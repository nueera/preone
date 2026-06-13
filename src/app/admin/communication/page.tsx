'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Megaphone,
  MessageCircle,
  FileText,
  ArrowRight,
  Sparkles,
  Users,
  Bell,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import { useChatStore } from '@/lib/stores/chat-store';
import { useAnnouncementStore } from '@/lib/stores/announcement-store';

const theme = PORTAL_THEMES.admin;

// ── Types ──
interface CommunicationCardData {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  count: number;
  countLabel: string;
  badge?: {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
  };
  gradient: string;
  iconBg: string;
  iconColor: string;
  features: string[];
}

// ── Main Page Component ──
export default function CommunicationHubPage() {
  const totalUnread = useChatStore((s) => s.totalUnread);
  const { announcements, fetchAnnouncements } = useAnnouncementStore();

  const chatUnread = totalUnread;
  const announcementDraftCount = announcements?.filter((a) => a.status === 'DRAFT').length ?? 0;
  const publishedCount = announcements?.filter((a) => a.status === 'PUBLISHED').length ?? 0;
  const templateCount = 12;
  const whatsappConnected = true;

  // Fetch announcements on mount
  useEffect(() => {
    fetchAnnouncements().catch(() => {});
  }, [fetchAnnouncements]);

  // ── Card configuration ──
  const cards: CommunicationCardData[] = [
    {
      id: 'chat',
      title: 'Chat',
      description: 'Real-time messaging with parents and staff members',
      icon: MessageSquare,
      href: '/admin/communication/chat',
      count: chatUnread,
      countLabel: 'unread messages',
      badge: chatUnread > 0
        ? { label: `${chatUnread} unread`, variant: 'destructive', className: 'bg-red-500 text-white border-0' }
        : { label: 'All read', variant: 'secondary', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      gradient: 'from-violet-500/5 to-purple-500/5 hover:from-violet-500/10 hover:to-purple-500/10',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
      features: ['Instant messaging', 'Group chats', 'File sharing'],
    },
    {
      id: 'announcements',
      title: 'Announcements',
      description: 'Broadcast announcements to parents and staff',
      icon: Megaphone,
      href: '/admin/communication/announcements',
      count: publishedCount,
      countLabel: 'published',
      badge: announcementDraftCount > 0
        ? { label: `${announcementDraftCount} draft${announcementDraftCount > 1 ? 's' : ''}`, variant: 'outline', className: 'bg-amber-50 text-amber-700 border-amber-200' }
        : undefined,
      gradient: 'from-amber-500/5 to-orange-500/5 hover:from-amber-500/10 hover:to-orange-500/10',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      features: ['Broadcast', 'Email + WhatsApp', 'Read receipts'],
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      description: 'Direct WhatsApp messaging integration for your school',
      icon: MessageCircle,
      href: '/admin/communication/whatsapp',
      count: whatsappConnected ? 1 : 0,
      countLabel: whatsappConnected ? 'connected' : 'disconnected',
      badge: whatsappConnected
        ? { label: 'Connected', variant: 'secondary', className: 'bg-green-50 text-green-700 border-green-200' }
        : { label: 'Disconnected', variant: 'destructive', className: 'bg-red-50 text-red-700 border-red-200' },
      gradient: 'from-emerald-500/5 to-green-500/5 hover:from-emerald-500/10 hover:to-green-500/10',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      features: ['WhatsApp API', 'Delivery reports', 'Auto-reminders'],
    },
    {
      id: 'templates',
      title: 'Templates',
      description: 'Reusable message templates for common communications',
      icon: FileText,
      href: '/admin/communication/templates',
      count: templateCount,
      countLabel: 'templates',
      badge: templateCount > 0
        ? { label: `${templateCount} templates`, variant: 'outline', className: 'bg-purple-50 text-purple-700 border-purple-200' }
        : undefined,
      gradient: 'from-purple-500/5 to-fuchsia-500/5 hover:from-purple-500/10 hover:to-fuchsia-500/10',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      features: ['Pre-built', 'Custom fields', 'Usage tracking'],
    },
  ];

  // ── Quick stats ──
  const totalMessages = chatUnread;
  const totalAnnouncements = publishedCount + announcementDraftCount;
  const engagementRate = publishedCount > 0 ? 78 : 0;

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-portal-600" />
            Communication Hub
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all your school communication channels from one place
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-xs px-3 py-1 border-purple-200 text-purple-700 bg-purple-50">
            <TrendingUp className="h-3 w-3" />
            {engagementRate}% engagement
          </Badge>
        </div>
      </div>

      {/* ── Quick Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-purple-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Unread Chats</p>
              <p className="text-xl font-bold text-violet-700">{chatUnread}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Announcements</p>
              <p className="text-xl font-bold text-amber-700">{totalAnnouncements}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">WhatsApp</p>
              <p className="text-xl font-bold text-emerald-700">
                {whatsappConnected ? 'Active' : 'Off'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-fuchsia-50 border-purple-100">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Templates</p>
              <p className="text-xl font-bold text-purple-700">{templateCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Communication Engagement Overview ── */}
      <Card className="border-purple-100 bg-gradient-to-r from-purple-50/50 to-violet-50/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-purple-900">Communication Engagement</h3>
            </div>
            <span className="text-xs text-purple-600 font-medium">{engagementRate}% read rate</span>
          </div>
          <Progress value={engagementRate} className="h-2 bg-purple-100" />
          <div className="flex items-center gap-4 mt-3 text-xs text-purple-600">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last 7 days
            </span>
            <span>{publishedCount} announcements sent</span>
            <span>{chatUnread} unread messages</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Channel Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.id} href={card.href} className="group block">
              <Card className={`h-full bg-gradient-to-br ${card.gradient} border-gray-200/60 transition-all duration-300 group-hover:shadow-lg group-hover:border-purple-200 group-hover:scale-[1.01]`}>
                <CardContent className="p-6">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-xl ${card.iconBg} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                        <Icon className={`h-6 w-6 ${card.iconColor}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{card.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {card.badge && (
                        <Badge variant={card.badge.variant} className={`text-[10px] ${card.badge.className}`}>
                          {card.badge.label}
                        </Badge>
                      )}
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-all duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>

                  {/* Count Display */}
                  <div className="mb-4 p-3 rounded-lg bg-white/60 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                        {card.countLabel}
                      </span>
                      <span className={`text-2xl font-bold ${card.iconColor}`}>
                        {card.count}
                      </span>
                    </div>
                  </div>

                  {/* Feature Tags */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {card.features.map((feature) => (
                      <span
                        key={feature}
                        className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-white/80 border border-gray-100 rounded-full px-2.5 py-1"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* ── Getting Started Section ── */}
      <Card className="border-dashed border-2 border-purple-200 bg-purple-50/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-purple-900 mb-1">Quick Start Guide</h3>
              <p className="text-xs text-purple-700 mb-3">
                Get the most out of your communication tools with these recommended steps.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/70 border border-purple-100">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-200 text-[10px] font-bold text-purple-800">1</span>
                  <span className="text-xs text-purple-800">Set up chat channels</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/70 border border-purple-100">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-200 text-[10px] font-bold text-purple-800">2</span>
                  <span className="text-xs text-purple-800">Create announcement templates</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-white/70 border border-purple-100">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-200 text-[10px] font-bold text-purple-800">3</span>
                  <span className="text-xs text-purple-800">Connect WhatsApp Business</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
