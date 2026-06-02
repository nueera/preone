'use client';

// ============================================================
// PreOne — Parent Settings Page
// Shows: Profile, Children, Notification Preferences,
// Security, App Info
// ============================================================

import React, { Suspense, useState } from 'react';
import {
  Settings,
  User,
  Baby,
  Bell,
  Shield,
  Info,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Lock,
  Monitor,
  LogOut,
  ChevronRight,
  FileText,
  MessageSquare,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useParentAuth } from '@/lib/parent-auth';
import { toast } from '@/hooks/use-toast';

// ============================================================
// HELPERS
// ============================================================

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// ============================================================
// LOADING SKELETON
// ============================================================

function SettingsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <Skeleton className="h-8 w-40 rounded-xl" />
        <Skeleton className="h-4 w-64 mt-2 rounded-lg" />
      </div>

      {/* Profile card skeleton */}
      <Card className="rounded-3xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40 rounded-lg" />
              <Skeleton className="h-4 w-28 rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Children card skeleton */}
      <Card className="rounded-3xl">
        <CardContent className="p-6 space-y-3">
          <Skeleton className="h-5 w-32 rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-20 rounded-2xl" />
          </div>
        </CardContent>
      </Card>

      {/* Notification card skeleton */}
      <Card className="rounded-3xl">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-5 w-48 rounded-lg" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </CardContent>
      </Card>

      {/* Security card skeleton */}
      <Card className="rounded-3xl">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-5 w-36 rounded-lg" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// MAIN SETTINGS CONTENT (inside Suspense)
// ============================================================

function SettingsContent() {
  const { parent, children, selectedChild, isLoading } = useParentAuth();

  // ── Notification preferences (UI-only state) ──
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    app: true,
  });

  // ── Loading state ──
  if (isLoading) {
    return <SettingsLoadingSkeleton />;
  }

  // ── No parent data ──
  if (!parent) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <User className="h-12 w-12 text-sky-400" />
        <p className="text-muted-foreground">Unable to load profile data.</p>
        <p className="text-xs text-muted-foreground">Please try refreshing the page.</p>
      </div>
    );
  }

  const parentInitials = getInitials(parent.firstName, parent.lastName);
  const parentFullName = `${parent.firstName} ${parent.lastName}`;

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════════════════════ */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500">
            <Settings className="h-5 w-5 text-white" />
          </div>
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your account preferences</p>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PROFILE SECTION
          ═══════════════════════════════════════════════════════════ */}
      <Card className="rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-sky-600" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <Avatar className="h-16 w-16 border-2 border-sky-200">
              <AvatarFallback className="bg-gradient-to-br from-sky-400 to-blue-500 text-white text-xl font-bold">
                {parentInitials}
              </AvatarFallback>
            </Avatar>

            {/* Info grid */}
            <div className="flex-1 min-w-0 space-y-3 w-full">
              <div>
                <h3 className="font-bold text-lg">{parentFullName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="outline"
                    className="text-[10px] border-sky-200 text-sky-700 bg-sky-50"
                  >
                    {parent.relation}
                  </Badge>
                  {parent.isEmergencyContact && (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-red-200 text-red-700 bg-red-50"
                    >
                      Emergency Contact
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {/* Phone */}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{parent.phone}</span>
                </div>

                {/* Email */}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span>{parent.email || 'Not provided'}</span>
                </div>

                {/* Occupation */}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5 shrink-0" />
                  <span>{parent.occupation || 'Not provided'}</span>
                </div>

                {/* Address */}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{parent.address || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t">
            <p className="text-[10px] text-muted-foreground">
              Profile information is managed by the school. Contact admin to update your details.
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* ═══════════════════════════════════════════════════════════
          CHILDREN SECTION
          ═══════════════════════════════════════════════════════════ */}
      <Card className="rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Baby className="h-4 w-4 text-sky-600" />
            Linked Children
            <Badge variant="secondary" className="ml-1 text-[10px]">
              {children.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {children.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {children.map((child) => {
                const childInitials = getInitials(child.firstName, child.lastName);
                const isActive = child.id === selectedChild?.id;

                return (
                  <div
                    key={child.id}
                    className={`p-4 rounded-2xl border transition-colors ${
                      isActive
                        ? 'border-sky-200 bg-sky-50/50'
                        : 'border-gray-100 bg-gray-50/50 hover:bg-gray-100/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-sky-100">
                        <AvatarImage src={child.photo || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-sky-400 to-blue-500 text-white text-xs font-bold">
                          {childInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate">
                            {child.firstName} {child.lastName}
                          </p>
                          {isActive && (
                            <Badge className="bg-sky-100 text-sky-700 text-[9px] shrink-0">
                              Active
                            </Badge>
                          )}
                          {child.isPrimary && (
                            <Badge className="bg-amber-100 text-amber-700 text-[9px] shrink-0">
                              Primary
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                          <span>{child.className || 'No class'}</span>
                          {child.rollNumber && (
                            <>
                              <span className="text-gray-300">|</span>
                              <span>Roll: {child.rollNumber}</span>
                            </>
                          )}
                        </div>
                        {child.programName && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {child.programName}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Baby className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No children linked yet</p>
              <p className="text-xs text-muted-foreground">Contact admin for enrollment.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* ═══════════════════════════════════════════════════════════
          NOTIFICATION PREFERENCES SECTION
          ═══════════════════════════════════════════════════════════ */}
      <Card className="rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-sky-600" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email Notifications */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100/80 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <Label htmlFor="email-notif" className="text-sm font-medium cursor-pointer">
                  Email Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive updates via email
                </p>
              </div>
            </div>
            <Switch
              id="email-notif"
              checked={notifications.email}
              onCheckedChange={(checked) =>
                setNotifications((prev) => ({ ...prev, email: checked }))
              }
            />
          </div>

          {/* SMS Notifications */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100/80 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <MessageSquare className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <Label htmlFor="sms-notif" className="text-sm font-medium cursor-pointer">
                  SMS Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive updates via SMS
                </p>
              </div>
            </div>
            <Switch
              id="sms-notif"
              checked={notifications.sms}
              onCheckedChange={(checked) =>
                setNotifications((prev) => ({ ...prev, sms: checked }))
              }
            />
          </div>

          {/* App Notifications */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100/80 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Bell className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <Label htmlFor="app-notif" className="text-sm font-medium cursor-pointer">
                  App Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Receive push notifications
                </p>
              </div>
            </div>
            <Switch
              id="app-notif"
              checked={notifications.app}
              onCheckedChange={(checked) =>
                setNotifications((prev) => ({ ...prev, app: checked }))
              }
            />
          </div>

          <div className="pt-2">
            <p className="text-[10px] text-muted-foreground">
              Notification preferences are saved locally. Backend sync will be available in a future update.
            </p>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* ═══════════════════════════════════════════════════════════
          SECURITY SECTION
          ═══════════════════════════════════════════════════════════ */}
      <Card className="rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-sky-600" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Change Password */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Lock className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Password</p>
                <p className="text-xs text-muted-foreground">
                  Change your account password
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => {
                toast({
                  title: 'Coming Soon',
                  description: 'Password change functionality will be available in a future update.',
                });
              }}
            >
              Change Password
            </Button>
          </div>

          {/* Active Sessions */}
          <div className="p-4 rounded-xl border border-gray-100">
            <p className="text-sm font-medium mb-3">Active Sessions</p>
            <div className="flex items-center gap-3 p-3 bg-sky-50 rounded-xl border border-sky-100">
              <div className="p-2 rounded-lg bg-sky-100">
                <Monitor className="h-4 w-4 text-sky-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Current Session</p>
                  <Badge className="bg-emerald-100 text-emerald-700 text-[9px]">Active</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {typeof navigator !== 'undefined'
                    ? `${navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : navigator.userAgent.includes('Safari') ? 'Safari' : 'Browser'} · ${navigator.userAgent.includes('Windows') ? 'Windows' : navigator.userAgent.includes('Mac') ? 'macOS' : navigator.userAgent.includes('Linux') ? 'Linux' : navigator.userAgent.includes('Android') ? 'Android' : navigator.userAgent.includes('iPhone') ? 'iOS' : 'Device'}`
                    : 'Browser · Device'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Signed in</p>
                <p className="text-xs font-medium text-sky-700">Now</p>
              </div>
            </div>
          </div>

          {/* Logout from all devices */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 border border-red-100/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <LogOut className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-700">Logout from All Devices</p>
                <p className="text-xs text-red-600/70">
                  End all active sessions except this one
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => {
                toast({
                  title: 'Coming Soon',
                  description: 'Remote session management will be available in a future update.',
                });
              }}
            >
              Logout All
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* ═══════════════════════════════════════════════════════════
          APP INFO SECTION
          ═══════════════════════════════════════════════════════════ */}
      <Card className="rounded-3xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4 text-sky-600" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {/* App Version */}
          <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-500">
                <Settings className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium">App Version</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              PreOne v1.0.0
            </Badge>
          </div>

          {/* Support Email */}
          <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Mail className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium">Support Email</p>
              </div>
            </div>
            <a
              href="mailto:support@preone.edu"
              className="text-sm text-sky-600 hover:text-sky-700 hover:underline"
            >
              support@preone.edu
            </a>
          </div>

          {/* Privacy Policy */}
          <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-100">
                <FileText className="h-4 w-4 text-violet-600" />
              </div>
              <p className="text-sm font-medium">Privacy Policy</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-sky-600 transition-colors" />
          </div>

          {/* Terms of Service */}
          <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <FileText className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-sm font-medium">Terms of Service</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-sky-600 transition-colors" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// EXPORTED PAGE (with Suspense boundary)
// ============================================================

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoadingSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}
