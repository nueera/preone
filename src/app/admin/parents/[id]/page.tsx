'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  FileText,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Pencil,
  Power,
  Heart,
  User,
  Calendar,
  GraduationCap,
  Users,
  ChevronRight,
  MessageCircle,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PreOneCard } from '@/components/ui/preone-card';

// ── Types ──
interface ParentData {
  id: string;
  name: string;
  email: string;
  phone: string;
  altPhone: string;
  occupation: string;
  address: string;
  relation: 'Father' | 'Mother' | 'Guardian';
  kycStatus: 'Verified' | 'Pending' | 'Not Submitted';
  dateOfJoining: string;
  parentId: string;
  children: { id: string; name: string; studentId: string; className: string }[];
  avatarInitials: string;
  avatarColor: string;
  avatarBg: string;
}

// ── Mock Data ──
const MOCK_PARENTS: Record<string, ParentData> = {
  '1': {
    id: '1', name: 'Rajesh Kumar', email: 'rajesh.kumar@email.com', phone: '+91 98765 43210',
    altPhone: '+91 87654 32109', occupation: 'Software Engineer', address: 'HSR Layout, Bengaluru, Karnataka',
    relation: 'Father', kycStatus: 'Verified', dateOfJoining: '15 Jan 2024', parentId: 'P1',
    children: [{ id: 's1', name: 'Aarav Kumar', studentId: '#NUR-001', className: 'Nursery-A' }],
    avatarInitials: 'RK', avatarColor: 'var(--admin-info)', avatarBg: 'var(--admin-info-soft)',
  },
  '2': {
    id: '2', name: 'Sunita Patel', email: 'sunita.patel@email.com', phone: '+91 91234 56789',
    altPhone: '', occupation: 'Homemaker', address: 'Indiranagar, Bengaluru, Karnataka',
    relation: 'Mother', kycStatus: 'Verified', dateOfJoining: '20 Feb 2024', parentId: 'P2',
    children: [{ id: 's2', name: 'Ananya Patel', studentId: '#LKG-012', className: 'LKG-A' }],
    avatarInitials: 'SP', avatarColor: 'var(--admin-pink)', avatarBg: 'var(--admin-pink-soft)',
  },
  '3': {
    id: '3', name: 'Arjun Singh', email: 'arjun.singh@email.com', phone: '+91 99887 76655',
    altPhone: '+91 99112 23344', occupation: 'Business Owner', address: 'Koramangala, Bengaluru, Karnataka',
    relation: 'Father', kycStatus: 'Pending', dateOfJoining: '10 Mar 2024', parentId: 'P3',
    children: [{ id: 's3', name: 'Vihaan Singh', studentId: '#UKG-021', className: 'UKG-A' }],
    avatarInitials: 'AS', avatarColor: 'var(--admin-info)', avatarBg: 'var(--admin-info-soft)',
  },
  '4': {
    id: '4', name: 'Priya Sharma', email: 'priya.sharma@email.com', phone: '+91 87654 32109',
    altPhone: '', occupation: 'Teacher', address: 'Whitefield, Bengaluru, Karnataka',
    relation: 'Mother', kycStatus: 'Verified', dateOfJoining: '05 Apr 2024', parentId: 'P4',
    children: [
      { id: 's4a', name: 'Isha Sharma', studentId: '#NUR-020', className: 'Nursery-B' },
      { id: 's4b', name: 'Arya Sharma', studentId: '#LKG-015', className: 'LKG-B' },
    ],
    avatarInitials: 'PS', avatarColor: 'var(--admin-pink)', avatarBg: 'var(--admin-pink-soft)',
  },
  '5': {
    id: '5', name: 'Mohammad Khan', email: 'mkhan@email.com', phone: '+91 93214 56780',
    altPhone: '', occupation: 'Doctor', address: 'Jayanagar, Bengaluru, Karnataka',
    relation: 'Father', kycStatus: 'Not Submitted', dateOfJoining: '01 May 2024', parentId: 'P5',
    children: [{ id: 's5', name: 'Ibrahim Khan', studentId: '#NUR-010', className: 'Nursery-A' }],
    avatarInitials: 'MK', avatarColor: 'var(--admin-info)', avatarBg: 'var(--admin-info-soft)',
  },
  '6': {
    id: '6', name: 'Lakshmi Iyer', email: 'lakshmi.iyer@email.com', phone: '+91 96587 41236',
    altPhone: '+91 94455 66778', occupation: 'Retired Professor', address: 'Malleshwaram, Bengaluru, Karnataka',
    relation: 'Mother', kycStatus: 'Pending', dateOfJoining: '15 Jun 2024', parentId: 'P6',
    children: [{ id: 's6', name: 'Kavya Iyer', studentId: '#PRE-003', className: 'Pre-Nursery' }],
    avatarInitials: 'LI', avatarColor: 'var(--admin-pink)', avatarBg: 'var(--admin-pink-soft)',
  },
  '7': {
    id: '7', name: 'Deepak Reddy', email: 'deepak.reddy@email.com', phone: '+91 87612 34567',
    altPhone: '', occupation: 'Chartered Accountant', address: 'Electronic City, Bengaluru, Karnataka',
    relation: 'Father', kycStatus: 'Verified', dateOfJoining: '20 Jan 2024', parentId: 'P7',
    children: [{ id: 's7', name: 'Arjun Reddy', studentId: '#LKG-005', className: 'LKG-A' }],
    avatarInitials: 'DR', avatarColor: 'var(--admin-info)', avatarBg: 'var(--admin-info-soft)',
  },
  '8': {
    id: '8', name: 'Nandini Gupta', email: 'nandini.gupta@email.com', phone: '+91 91234 87654',
    altPhone: '+91 90011 22334', occupation: 'Architect', address: 'Rajajinagar, Bengaluru, Karnataka',
    relation: 'Guardian', kycStatus: 'Not Submitted', dateOfJoining: '10 Feb 2024', parentId: 'P8',
    children: [{ id: 's8', name: 'Rohan Gupta', studentId: '#UKG-008', className: 'UKG-A' }],
    avatarInitials: 'NG', avatarColor: 'var(--admin-text-muted)', avatarBg: 'var(--admin-surface-2)',
  },
  '9': {
    id: '9', name: 'Suresh Nair', email: 'suresh.nair@email.com', phone: '+91 98765 12345',
    altPhone: '', occupation: 'Professor', address: 'BTM Layout, Bengaluru, Karnataka',
    relation: 'Father', kycStatus: 'Verified', dateOfJoining: '25 Mar 2024', parentId: 'P9',
    children: [{ id: 's9', name: 'Meera Nair', studentId: '#UKG-030', className: 'UKG-B' }],
    avatarInitials: 'SN', avatarColor: 'var(--admin-info)', avatarBg: 'var(--admin-info-soft)',
  },
  '10': {
    id: '10', name: 'Anita Deshmukh', email: 'anita.d@email.com', phone: '+91 78965 43211',
    altPhone: '', occupation: 'Homemaker', address: 'Marathahalli, Bengaluru, Karnataka',
    relation: 'Mother', kycStatus: 'Verified', dateOfJoining: '01 Apr 2024', parentId: 'P10',
    children: [{ id: 's10', name: 'Neha Deshmukh', studentId: '#PLG-011', className: 'Playgroup-A' }],
    avatarInitials: 'AD', avatarColor: 'var(--admin-pink)', avatarBg: 'var(--admin-pink-soft)',
  },
};

// ── KYC Badge Config ──
const KYC_CONFIG: Record<string, { bg: string; color: string; Icon: React.ElementType }> = {
  Verified: { bg: 'var(--admin-success-soft)', color: 'var(--admin-success)', Icon: ShieldCheck },
  Pending: { bg: 'var(--admin-warning-soft)', color: 'var(--admin-warning)', Icon: Clock },
  'Not Submitted': { bg: 'var(--admin-error-soft)', color: 'var(--admin-error)', Icon: AlertTriangle },
};

const RELATION_CONFIG: Record<string, { bg: string; color: string }> = {
  Father: { bg: 'var(--admin-info-soft)', color: 'var(--admin-info)' },
  Mother: { bg: 'var(--admin-pink-soft)', color: 'var(--admin-pink)' },
  Guardian: { bg: 'var(--admin-surface-2)', color: 'var(--admin-text-muted)' },
};

// ── Sub-Components ──

function KycBadge({ status }: { status: ParentData['kycStatus'] }) {
  const config = KYC_CONFIG[status];
  const IconComp = config.Icon;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: config.bg, color: config.color }}>
      <IconComp className="h-3 w-3" />
      {status}
    </span>
  );
}

function RelationBadge({ relation }: { relation: ParentData['relation'] }) {
  const config = RELATION_CONFIG[relation];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: config.bg, color: config.color }}>
      <Heart className="h-3 w-3" />
      {relation}
    </span>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b" style={{ borderColor: 'var(--admin-border)' }}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--admin-text-subtle)' }} />
      <div className="min-w-0 flex-1">
        <p className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>{label}</p>
        <div className="text-sm font-medium" style={{ color: 'var(--admin-text)' }}>{value}</div>
      </div>
    </div>
  );
}

// ── Tab types ──
type TabKey = 'overview' | 'children' | 'documents' | 'communication';

// ── Main Page ──

export default function ParentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const parentId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const parent = MOCK_PARENTS[parentId] || null;

  // ── Not Found State ──
  if (!parent) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Users className="h-16 w-16 opacity-30" style={{ color: 'var(--admin-text-muted)' }} />
        <h2 className="text-xl font-semibold" style={{ color: 'var(--admin-text)' }}>Parent Not Found</h2>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => router.push('/admin/parents')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Parents
        </Button>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'children', label: 'Children' },
    { key: 'documents', label: 'Documents' },
    { key: 'communication', label: 'Communication' },
  ];

  const childCount = parent.children.length;

  return (
    <div className="flex flex-col gap-6 max-w-[1440px] mx-auto">
      {/* ── AREA 1: BACK NAVIGATION ── */}
      <button
        className="flex items-center gap-1.5 text-sm font-medium transition-colors w-fit"
        style={{ color: 'var(--admin-primary)' }}
        onClick={() => router.push('/admin/parents')}
        onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
        onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Parents
      </button>

      {/* ── AREA 2: PARENT HEADER ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 shrink-0 rounded-2xl">
            <AvatarFallback className="text-xl font-bold rounded-2xl" style={{ background: parent.avatarBg, color: parent.avatarColor }}>
              {parent.avatarInitials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--admin-text)' }}>{parent.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <RelationBadge relation={parent.relation} />
              <KycBadge status={parent.kycStatus} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--admin-text-subtle)' }}>
              <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {parent.email}</span>
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {parent.phone}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Edit Parent
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" style={{ color: 'var(--admin-error)' }}>
            <Power className="h-3.5 w-3.5" />
            Deactivate
          </Button>
        </div>
      </div>

      {/* ── AREA 3: TABBED CONTENT ── */}
      <PreOneCard className="!rounded-xl overflow-hidden">
        {/* Tab Bar */}
        <div className="flex border-b px-5" style={{ borderColor: 'var(--admin-border)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className="relative px-4 py-3 text-sm font-medium transition-colors"
              style={{ color: activeTab === tab.key ? 'var(--admin-primary)' : 'var(--admin-text-muted)' }}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'var(--admin-primary)' }} />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {/* ═══ OVERVIEW TAB ═══ */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Left Column — Personal Information */}
              <div>
                <h3 className="mb-4 text-sm font-semibold" style={{ color: 'var(--admin-text)' }}>Personal Information</h3>
                <InfoRow icon={User} label="Full Name" value={parent.name} />
                <InfoRow icon={Mail} label="Email Address" value={parent.email} />
                <InfoRow icon={Phone} label="Primary Phone" value={parent.phone} />
                <InfoRow icon={Phone} label="Alternate Phone" value={parent.altPhone || '—'} />
                <InfoRow icon={FileText} label="Occupation" value={parent.occupation} />
                <InfoRow icon={MapPin} label="Address" value={parent.address} />
              </div>

              {/* Right Column — Account & KYC */}
              <div>
                <h3 className="mb-4 text-sm font-semibold" style={{ color: 'var(--admin-text)' }}>Account &amp; KYC</h3>
                <InfoRow icon={Calendar} label="Date of Joining" value={parent.dateOfJoining} />
                <InfoRow icon={Heart} label="Relation" value={<RelationBadge relation={parent.relation} />} />
                <InfoRow icon={ShieldCheck} label="KYC Status" value={<KycBadge status={parent.kycStatus} />} />
                <InfoRow icon={GraduationCap} label="Children" value={`${childCount} child${childCount !== 1 ? 'ren' : ''} enrolled`} />
                <InfoRow icon={Users} label="Parent ID" value={parent.parentId} />
              </div>
            </div>
          )}

          {/* ═══ CHILDREN TAB ═══ */}
          {activeTab === 'children' && (
            <div className="space-y-3">
              {parent.children.map((child) => (
                <PreOneCard key={child.id} hover className="!rounded-xl cursor-pointer" onClick={() => router.push(`/admin/students/${child.id}`)}>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11 rounded-xl">
                        <AvatarFallback className="text-xs font-semibold rounded-xl" style={{ background: 'var(--admin-primary-soft)', color: 'var(--admin-primary)' }}>
                          {child.name.split(' ').map((n) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium" style={{ color: 'var(--admin-text)' }}>{child.name}</p>
                        <p className="text-xs" style={{ color: 'var(--admin-text-subtle)' }}>{child.studentId} · {child.className}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4" style={{ color: 'var(--admin-text-subtle)' }} />
                  </div>
                </PreOneCard>
              ))}
              {parent.children.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-8">
                  <GraduationCap className="h-10 w-10 opacity-30" style={{ color: 'var(--admin-text-muted)' }} />
                  <p className="text-sm font-medium" style={{ color: 'var(--admin-text-muted)' }}>No children linked</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ DOCUMENTS TAB ═══ */}
          {activeTab === 'documents' && (
            <div className="flex flex-col items-center gap-3 py-12">
              <FileText className="h-12 w-12 opacity-30" style={{ color: 'var(--admin-text-muted)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--admin-text-muted)' }}>No documents uploaded yet</p>
              <p className="text-xs" style={{ color: 'var(--admin-text-subtle)' }}>KYC documents and uploads will appear here.</p>
              <Button variant="outline" size="sm" className="mt-2 gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                Upload Document
              </Button>
            </div>
          )}

          {/* ═══ COMMUNICATION TAB ═══ */}
          {activeTab === 'communication' && (
            <div className="flex flex-col items-center gap-3 py-12">
              <MessageCircle className="h-12 w-12 opacity-30" style={{ color: 'var(--admin-text-muted)' }} />
              <p className="text-sm font-medium" style={{ color: 'var(--admin-text-muted)' }}>No recent conversations</p>
              <Button variant="outline" size="sm" className="mt-2 gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" />
                Start Conversation
              </Button>
            </div>
          )}
        </div>
      </PreOneCard>
    </div>
  );
}
