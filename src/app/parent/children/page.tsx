'use client';

// ============================================================
// PreOne — My Children Page
// Shows all children linked to the authenticated parent
// Each child card shows: photo, name, class, roll, DOB, age,
// blood group, program, admission date, parents, siblings,
// and actions to view full profile or switch active child
// ============================================================

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Baby, Calendar, Droplets, GraduationCap, Users,
  ArrowRight, RefreshCw, AlertCircle, UserCheck,
  Phone, Mail, Heart, ShieldCheck,
} from 'lucide-react';
import {
  Card, CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useParentAuth } from '@/lib/parent-auth';
import { useParentChildren, type ChildInfo } from '@/hooks/use-parent';

// ============================================================
// HELPERS
// ============================================================

function calculateAge(dob: string): string {
  const birthDate = new Date(dob);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  if (today.getDate() < birthDate.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }
  return `${years}y ${months}m`;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'ACTIVE':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 text-[10px] border border-emerald-200">
          Active ✅
        </Badge>
      );
    case 'INACTIVE':
      return (
        <Badge className="bg-gray-100 text-gray-700 text-[10px] border border-gray-200">
          Inactive
        </Badge>
      );
    case 'GRADUATED':
      return (
        <Badge className="bg-blue-100 text-blue-700 text-[10px] border border-blue-200">
          Graduated 🎓
        </Badge>
      );
    case 'TRANSFERRED':
      return (
        <Badge className="bg-amber-100 text-amber-700 text-[10px] border border-amber-200">
          Transferred
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-[10px]">
          {status}
        </Badge>
      );
  }
}

function getRelationIcon(relation: string): string {
  const r = relation.toLowerCase();
  if (r === 'father') return '👨';
  if (r === 'mother') return '👩';
  if (r === 'guardian') return '🛡️';
  return '👤';
}

// ============================================================
// CHILD CARD COMPONENT
// ============================================================

function ChildCard({
  child,
  isActive,
  onSwitch,
  onViewProfile,
}: {
  child: ChildInfo;
  isActive: boolean;
  onSwitch: () => void;
  onViewProfile: () => void;
}) {
  const fullName = `${child.firstName} ${child.lastName}`;
  const initials = `${child.firstName[0]}${child.lastName[0]}`;

  return (
    <Card className="rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300">
      <CardContent className="p-0">
        {/* Header with photo and basic info */}
        <div className="p-5 pb-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 border-2 border-sky-200 shrink-0">
              <AvatarImage src={child.photo || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-sky-400 to-blue-500 text-white text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold truncate">{fullName}</h3>
                {isActive && (
                  <Badge className="bg-sky-100 text-sky-700 text-[9px] border border-sky-200">
                    Active
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                <span>{child.class?.name || 'No class'}</span>
                {child.rollNumber && <span>Roll: {child.rollNumber}</span>}
              </div>
              <div className="mt-1.5">{getStatusBadge(child.status)}</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Details section */}
        <div className="p-5 pt-4 space-y-3">
          {/* Personal details grid */}
          <div className="grid grid-cols-2 gap-2.5 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-sky-500 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">DOB</p>
                <p className="font-medium text-xs">
                  {formatDate(child.dob)} <span className="text-muted-foreground">({calculateAge(child.dob)})</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">Blood Group</p>
                <p className="font-medium text-xs">{child.bloodGroup || 'Not recorded'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-3.5 w-3.5 text-purple-500 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">Program</p>
                <p className="font-medium text-xs">{child.class?.program?.name || 'Not assigned'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">Admission</p>
                <p className="font-medium text-xs">{formatDate(child.admissionDate)}</p>
              </div>
            </div>
          </div>

          {/* Parents section */}
          {child.parents.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> Parents:
              </p>
              <div className="space-y-1">
                {child.parents.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 text-xs py-0.5"
                  >
                    <span>{getRelationIcon(p.relation)}</span>
                    <span className="font-medium">
                      {p.firstName} {p.lastName}
                    </span>
                    <span className="text-muted-foreground">({p.relation})</span>
                    {p.isPrimary && (
                      <Badge className="bg-sky-50 text-sky-600 text-[8px] px-1.5 py-0 border border-sky-200">
                        Primary
                      </Badge>
                    )}
                    {p.isEmergencyContact && (
                      <ShieldCheck className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Siblings section */}
          {child.siblings.length > 0 && (
            <div className="pt-1">
              <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" /> Siblings:
              </p>
              <div className="space-y-1">
                {child.siblings.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 text-xs py-0.5"
                  >
                    <Baby className="h-3 w-3 text-pink-500" />
                    <span className="font-medium">
                      {s.firstName} {s.lastName}
                    </span>
                    <span className="text-muted-foreground">
                      ({s.relation})
                    </span>
                    {s.className && (
                      <span className="text-muted-foreground">
                        — {s.className}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="p-4 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-xl text-xs"
            onClick={onViewProfile}
          >
            View Full Profile
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
          {!isActive && (
            <Button
              size="sm"
              className="flex-1 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl hover:from-sky-600 hover:to-blue-600 text-xs"
              onClick={onSwitch}
            >
              <UserCheck className="h-3 w-3 mr-1" />
              Switch to This Child
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// LOADING SKELETON
// ============================================================

function ChildrenLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-40 rounded-xl" />
        <Skeleton className="h-4 w-64 rounded-lg" />
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="rounded-3xl">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-40 rounded-lg" />
                  <Skeleton className="h-4 w-32 rounded-lg" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4 rounded-lg" />
                <Skeleton className="h-4 w-1/2 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================

export default function MyChildrenPage() {
  const router = useRouter();
  const { selectedChildId, selectChild } = useParentAuth();
  const { data, isLoading, isError, error, refetch } = useParentChildren();

  // Loading state
  if (isLoading) {
    return <ChildrenLoadingSkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-500 text-sm">
          {error?.message || 'Failed to load children'}
        </p>
        <Button onClick={() => refetch()} variant="outline" className="rounded-xl">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  const children = data?.children || [];

  // Empty state
  if (children.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">My Children</h1>
          <p className="text-muted-foreground text-sm">
            View profiles and details of your children
          </p>
        </div>
        <Card className="rounded-3xl">
          <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
            <Baby className="h-12 w-12 text-sky-400" />
            <p className="text-muted-foreground">No children found</p>
            <p className="text-xs text-muted-foreground">
              Contact the school administration for enrollment details
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">My Children</h1>
        <p className="text-muted-foreground text-sm">
          View profiles and details of your children
        </p>
      </div>

      {/* Summary Stats */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 px-4 py-2 bg-sky-50 rounded-xl border border-sky-100">
          <Baby className="h-4 w-4 text-sky-600" />
          <span className="text-sm font-medium text-sky-700">
            {children.length} {children.length === 1 ? 'Child' : 'Children'}
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
          <span className="text-sm font-medium text-emerald-700">
            {children.filter((c) => c.status === 'ACTIVE').length} Active
          </span>
        </div>
      </div>

      {/* Children Cards Grid */}
      <div
        className={`grid gap-6 ${
          children.length === 1
            ? 'grid-cols-1 max-w-xl'
            : 'grid-cols-1 lg:grid-cols-2'
        }`}
      >
        {children.map((child) => (
          <ChildCard
            key={child.id}
            child={child}
            isActive={child.id === selectedChildId}
            onSwitch={() => selectChild(child.id)}
            onViewProfile={() =>
              router.push(`/parent/children/${child.id}`)
            }
          />
        ))}
      </div>

      {/* Quick info for multiple children */}
      {children.length > 1 && (
        <Card className="rounded-3xl bg-gradient-to-r from-sky-50 to-blue-50 border-sky-100">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-5 w-5 text-sky-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-sky-800">
                You have {children.length} children enrolled
              </p>
              <p className="text-xs text-sky-600">
                Click &quot;Switch to This Child&quot; to view dashboard data for a specific child,
                or &quot;View Full Profile&quot; to see all details.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
