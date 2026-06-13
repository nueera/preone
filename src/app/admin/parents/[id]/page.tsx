'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  ShieldCheck,
  Clock,
  AlertCircle,
  MessageSquare,
  IndianRupee,
  FileText,
  Users,
  Pencil,
  Heart,
} from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { CosmicStatCard } from '@/components/ui/cosmic-stat-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PORTAL_THEMES } from '@/lib/theme-tokens';

const theme = PORTAL_THEMES.admin;

// ── Types ──
interface ParentData {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  relation: 'Father' | 'Mother' | 'Guardian';
  occupation: string;
  address: string;
  photo: string | null;
  kycStatus: 'Verified' | 'Pending' | 'Not Submitted';
  children: { id: string; name: string; className: string; rollNo: string; attendance: number; feeStatus: string }[];
}

// ── KYC badge styles ──
const KYC_STYLES: Record<string, { bg: string; icon: React.ReactNode }> = {
  Verified: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
  },
  Pending: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  'Not Submitted': {
    bg: 'bg-gray-50 text-gray-600 border-gray-200',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
};

const RELATION_COLORS: Record<string, string> = {
  Father: 'bg-sky-50 text-sky-700 border-sky-200',
  Mother: 'bg-pink-50 text-pink-700 border-pink-200',
  Guardian: 'bg-violet-50 text-violet-700 border-violet-200',
};

// ── Placeholder data ──
const PLACEHOLDER_PARENT: ParentData = {
  id: 'p1',
  firstName: 'Rajesh',
  lastName: 'Kumar',
  phone: '9876543210',
  email: 'rajesh.kumar@email.com',
  relation: 'Father',
  occupation: 'Software Engineer',
  address: '42, HSR Layout, Sector 2, Bangalore - 560102',
  photo: null,
  kycStatus: 'Verified',
  children: [
    { id: 's1', name: 'Aarav Kumar', className: 'Nursery A', rollNo: '12', attendance: 94, feeStatus: 'Paid' },
    { id: 's2', name: 'Isha Kumar', className: 'Daycare 1', rollNo: '05', attendance: 89, feeStatus: 'Pending' },
  ],
};

export default function ParentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const parentId = params.id as string;

  const [parent, setParent] = useState<ParentData | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Simulate loading ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setParent(PLACEHOLDER_PARENT);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [parentId]);

  // ── Loading state ──
  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </PageTransition>
    );
  }

  if (!parent) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Users className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">Parent not found</p>
          <Button variant="outline" onClick={() => router.push('/admin/parents')}>
            Back to Parents
          </Button>
        </div>
      </PageTransition>
    );
  }

  const getInitials = (first: string, last: string) =>
    `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* ── Back Button ── */}
        <Button
          variant="ghost"
          className="gap-1 text-muted-foreground"
          onClick={() => router.push('/admin/parents')}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Parents
        </Button>

        {/* ── Profile Header ── */}
        <PreOneCard variant="default">
          <PreOneCardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className={`${theme.avatarFallbackClass} text-2xl font-bold`}>
                  {getInitials(parent.firstName, parent.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {parent.firstName} {parent.lastName}
                  </h1>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${RELATION_COLORS[parent.relation]}`}>
                    <Heart className="h-3 w-3" />
                    {parent.relation}
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${KYC_STYLES[parent.kycStatus].bg}`}>
                    {KYC_STYLES[parent.kycStatus].icon}
                    KYC {parent.kycStatus}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {parent.email}</span>
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {parent.phone}</span>
                  <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {parent.occupation}</span>
                </div>
                {parent.address && (
                  <p className="flex items-start gap-1 mt-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {parent.address}
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="gap-1">
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
              </div>
            </div>
          </PreOneCardContent>
        </PreOneCard>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <CosmicStatCard
            label="Linked Children"
            value={parent.children.length}
            icon={<Users className="h-5 w-5" />}
            color="bg-violet-500"
          />
          <CosmicStatCard
            label="Messages Sent"
            value={14}
            icon={<MessageSquare className="h-5 w-5" />}
            color="bg-sky-500"
          />
          <CosmicStatCard
            label="Total Paid"
            value={37500}
            suffix="₹"
            icon={<IndianRupee className="h-5 w-5" />}
            color="bg-emerald-500"
          />
          <CosmicStatCard
            label="Documents"
            value={5}
            icon={<FileText className="h-5 w-5" />}
            color="bg-amber-500"
          />
        </div>

        {/* ── Quick Action Buttons ── */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push(`/admin/parents/${parentId}/communication`)}
          >
            <MessageSquare className="h-4 w-4" />
            Send Message
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push(`/admin/parents/${parentId}/payments`)}
          >
            <IndianRupee className="h-4 w-4" />
            View Payments
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push(`/admin/parents/${parentId}/documents`)}
          >
            <FileText className="h-4 w-4" />
            View Documents
          </Button>
        </div>

        {/* ── Tabs ── */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="children">Children</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* ═══ Tab: Overview ═══ */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Parent Profile */}
              <PreOneCard variant="default">
                <PreOneCardContent>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-portal-500" />
                    Parent Information
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Full Name</p>
                        <p className="text-sm font-medium">{parent.firstName} {parent.lastName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Relation</p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${RELATION_COLORS[parent.relation]}`}>
                          {parent.relation}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="text-sm font-medium flex items-center gap-1"><Phone className="h-3 w-3" /> {parent.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-medium flex items-center gap-1"><Mail className="h-3 w-3" /> {parent.email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Occupation</p>
                        <p className="text-sm font-medium flex items-center gap-1"><Briefcase className="h-3 w-3" /> {parent.occupation}</p>
                      </div>
                    </div>
                    {parent.address && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Address</p>
                          <p className="text-sm flex items-start gap-1"><MapPin className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" /> {parent.address}</p>
                        </div>
                      </>
                    )}
                  </div>
                </PreOneCardContent>
              </PreOneCard>

              {/* KYC Status */}
              <PreOneCard variant="default">
                <PreOneCardContent>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-portal-500" />
                    KYC Verification
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-sm font-medium">Overall Status</span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium border ${KYC_STYLES[parent.kycStatus].bg}`}>
                        {KYC_STYLES[parent.kycStatus].icon}
                        {parent.kycStatus}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {['Aadhaar Card', 'Address Proof', 'PAN Card', 'Child Birth Certificate'].map((doc, idx) => {
                        const status = idx < 2 ? 'Verified' : idx < 3 ? 'Pending' : 'Not Submitted';
                        return (
                          <div key={doc} className="flex items-center justify-between py-2 px-3 rounded-lg border">
                            <span className="text-sm">{doc}</span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${KYC_STYLES[status].bg}`}>
                              {KYC_STYLES[status].icon}
                              {status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </PreOneCardContent>
              </PreOneCard>
            </div>
          </TabsContent>

          {/* ═══ Tab: Children ═══ */}
          <TabsContent value="children">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parent.children.map((child) => (
                <PreOneCard key={child.id} variant="strip" hover>
                  <PreOneCardContent>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className={theme.avatarFallbackClass}>
                            {child.name.split(' ').map((n) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">{child.name}</h4>
                          <p className="text-sm text-muted-foreground">{child.className} — Roll #{child.rollNo}</p>
                        </div>
                      </div>
                      <Badge className={child.feeStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 text-[10px]' : 'bg-amber-50 text-amber-700 text-[10px]'}>
                        {child.feeStatus}
                      </Badge>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex items-center gap-6 text-xs text-muted-foreground">
                      <span>📊 Attendance: {child.attendance}%</span>
                      <span>💰 Fees: {child.feeStatus}</span>
                    </div>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => router.push(`/admin/students/${child.id}`)}
                      >
                        View Child Profile
                      </Button>
                    </div>
                  </PreOneCardContent>
                </PreOneCard>
              ))}
            </div>
          </TabsContent>

          {/* ═══ Tab: Communication ═══ */}
          <TabsContent value="communication">
            <PreOneCard variant="default">
              <PreOneCardContent>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-portal-500" />
                    Recent Messages
                  </h3>
                  <Button
                    className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
                    onClick={() => router.push(`/admin/parents/${parentId}/communication`)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    View All
                  </Button>
                </div>
                <div className="space-y-3">
                  {[
                    { date: '10 Jun 2026', type: 'WhatsApp', subject: 'Fee Reminder — Q3', status: 'Read' },
                    { date: '05 Jun 2026', type: 'Email', subject: 'Monthly Newsletter', status: 'Read' },
                    { date: '01 Jun 2026', type: 'WhatsApp', subject: 'Holiday Notice', status: 'Sent' },
                  ].map((msg, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 px-4 rounded-lg border hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => router.push(`/admin/parents/${parentId}/communication`)}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{msg.subject}</p>
                        <p className="text-xs text-muted-foreground">{msg.date} · {msg.type}</p>
                      </div>
                      <Badge className={msg.status === 'Read' ? 'bg-emerald-50 text-emerald-700 text-[10px]' : 'bg-gray-50 text-gray-500 text-[10px]'}>
                        {msg.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </PreOneCardContent>
            </PreOneCard>
          </TabsContent>

          {/* ═══ Tab: Documents ═══ */}
          <TabsContent value="documents">
            <PreOneCard variant="default">
              <PreOneCardContent>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-portal-500" />
                    Uploaded Documents
                  </h3>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => router.push(`/admin/parents/${parentId}/documents`)}
                  >
                    View All Documents
                  </Button>
                </div>
                <div className="space-y-2">
                  {[
                    { name: 'Aadhaar Card — Father', type: 'ID Proof', status: 'Verified' },
                    { name: 'Address Proof', type: 'Utility Bill', status: 'Verified' },
                    { name: 'Medical Certificate', type: 'Health', status: 'Pending' },
                  ].map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 px-4 rounded-lg border">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">{doc.type}</p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${KYC_STYLES[doc.status as keyof typeof KYC_STYLES]?.bg || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {KYC_STYLES[doc.status as keyof typeof KYC_STYLES]?.icon}
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </PreOneCardContent>
            </PreOneCard>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
