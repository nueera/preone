'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Upload,
  Plus,
  Search,
  X,
  SlidersHorizontal,
  Columns3,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  MoreHorizontal,
  Phone,
  ShieldCheck,
  Clock,
  AlertTriangle,
  TrendingUp,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PreOneCard } from '@/components/ui/preone-card';

// ── Types ──
interface ParentRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  relation: 'Father' | 'Mother' | 'Guardian';
  kycStatus: 'Verified' | 'Pending' | 'Not Submitted';
  children: { name: string; className: string }[];
  avatarInitials: string;
  avatarColor: string;
  avatarBg: string;
}

// ── Mock Data: 10 Parents ──
const MOCK_PARENTS: ParentRecord[] = [
  {
    id: '1', name: 'Rajesh Kumar', email: 'rajesh.kumar@email.com', phone: '+91 98765 43210',
    relation: 'Father', kycStatus: 'Verified',
    children: [{ name: 'Aarav Kumar', className: 'Nursery-A' }],
    avatarInitials: 'RK', avatarColor: 'var(--admin-info)', avatarBg: 'var(--admin-info-soft)',
  },
  {
    id: '2', name: 'Sunita Patel', email: 'sunita.patel@email.com', phone: '+91 91234 56789',
    relation: 'Mother', kycStatus: 'Verified',
    children: [{ name: 'Ananya Patel', className: 'LKG-A' }],
    avatarInitials: 'SP', avatarColor: 'var(--admin-pink)', avatarBg: 'var(--admin-pink-soft)',
  },
  {
    id: '3', name: 'Arjun Singh', email: 'arjun.singh@email.com', phone: '+91 99887 76655',
    relation: 'Father', kycStatus: 'Pending',
    children: [{ name: 'Vihaan Singh', className: 'UKG-A' }],
    avatarInitials: 'AS', avatarColor: 'var(--admin-info)', avatarBg: 'var(--admin-info-soft)',
  },
  {
    id: '4', name: 'Priya Sharma', email: 'priya.sharma@email.com', phone: '+91 87654 32109',
    relation: 'Mother', kycStatus: 'Verified',
    children: [{ name: 'Isha Sharma', className: 'Nursery-B' }, { name: 'Arya Sharma', className: 'LKG-B' }],
    avatarInitials: 'PS', avatarColor: 'var(--admin-pink)', avatarBg: 'var(--admin-pink-soft)',
  },
  {
    id: '5', name: 'Mohammad Khan', email: 'mkhan@email.com', phone: '+91 93214 56780',
    relation: 'Father', kycStatus: 'Not Submitted',
    children: [{ name: 'Ibrahim Khan', className: 'Nursery-A' }],
    avatarInitials: 'MK', avatarColor: 'var(--admin-info)', avatarBg: 'var(--admin-info-soft)',
  },
  {
    id: '6', name: 'Lakshmi Iyer', email: 'lakshmi.iyer@email.com', phone: '+91 96587 41236',
    relation: 'Mother', kycStatus: 'Pending',
    children: [{ name: 'Kavya Iyer', className: 'Pre-Nursery' }],
    avatarInitials: 'LI', avatarColor: 'var(--admin-pink)', avatarBg: 'var(--admin-pink-soft)',
  },
  {
    id: '7', name: 'Deepak Reddy', email: 'deepak.reddy@email.com', phone: '+91 87612 34567',
    relation: 'Father', kycStatus: 'Verified',
    children: [{ name: 'Arjun Reddy', className: 'LKG-A' }],
    avatarInitials: 'DR', avatarColor: 'var(--admin-info)', avatarBg: 'var(--admin-info-soft)',
  },
  {
    id: '8', name: 'Nandini Gupta', email: 'nandini.gupta@email.com', phone: '+91 91234 87654',
    relation: 'Guardian', kycStatus: 'Not Submitted',
    children: [{ name: 'Rohan Gupta', className: 'UKG-A' }],
    avatarInitials: 'NG', avatarColor: 'var(--admin-text-muted)', avatarBg: 'var(--admin-surface-2)',
  },
  {
    id: '9', name: 'Suresh Nair', email: 'suresh.nair@email.com', phone: '+91 98765 12345',
    relation: 'Father', kycStatus: 'Verified',
    children: [{ name: 'Meera Nair', className: 'UKG-B' }],
    avatarInitials: 'SN', avatarColor: 'var(--admin-info)', avatarBg: 'var(--admin-info-soft)',
  },
  {
    id: '10', name: 'Anita Deshmukh', email: 'anita.d@email.com', phone: '+91 78965 43211',
    relation: 'Mother', kycStatus: 'Verified',
    children: [{ name: 'Neha Deshmukh', className: 'Playgroup-A' }],
    avatarInitials: 'AD', avatarColor: 'var(--admin-pink)', avatarBg: 'var(--admin-pink-soft)',
  },
];

// ── Stat Card Config ──
const STAT_CARDS = [
  { title: 'Total Parents', value: 248, icon: Users, iconBg: 'var(--admin-primary-soft)', iconColor: 'var(--admin-primary)', borderColor: 'var(--admin-primary)', subtitle: 'All registered parents' },
  { title: 'KYC Verified', value: 206, icon: ShieldCheck, iconBg: 'var(--admin-success-soft)', iconColor: 'var(--admin-success)', borderColor: 'var(--admin-success)', subtitle: '83% of total', trend: '12% vs last month', trendPositive: true },
  { title: 'KYC Pending', value: 28, icon: Clock, iconBg: 'var(--admin-warning-soft)', iconColor: 'var(--admin-warning)', borderColor: 'var(--admin-warning)', subtitle: '11% of total' },
  { title: 'Not Submitted', value: 14, icon: AlertTriangle, iconBg: 'var(--admin-error-soft)', iconColor: 'var(--admin-error)', borderColor: 'var(--admin-error)', subtitle: '6% of total' },
];

// ── KYC Badge Config ──
const KYC_CONFIG: Record<string, { bg: string; color: string; Icon: React.ElementType }> = {
  Verified: { bg: 'var(--admin-success-soft)', color: 'var(--admin-success)', Icon: ShieldCheck },
  Pending: { bg: 'var(--admin-warning-soft)', color: 'var(--admin-warning)', Icon: Clock },
  'Not Submitted': { bg: 'var(--admin-error-soft)', color: 'var(--admin-error)', Icon: AlertTriangle },
};

// ── Relation Badge Config ──
const RELATION_CONFIG: Record<string, { bg: string; color: string }> = {
  Father: { bg: 'var(--admin-info-soft)', color: 'var(--admin-info)' },
  Mother: { bg: 'var(--admin-pink-soft)', color: 'var(--admin-pink)' },
  Guardian: { bg: 'var(--admin-surface-2)', color: 'var(--admin-text-muted)' },
};

// ── Class Options ──
const CLASS_OPTIONS = ['All Classes', 'Nursery-A', 'Nursery-B', 'LKG-A', 'LKG-B', 'UKG-A', 'UKG-B', 'Playgroup-A', 'Pre-Nursery'];

// ── Sub-Components ──

function StatCard({ title, value, icon: Icon, iconBg, iconColor, borderColor, subtitle, trend, trendPositive }: {
  title: string; value: number; icon: React.ElementType; iconBg: string; iconColor: string;
  borderColor: string; subtitle: string; trend?: string; trendPositive?: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border shadow-sm backdrop-blur-sm" style={{ background: 'var(--admin-surface)' }}>
      {/* Left color border */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl" style={{ background: borderColor }} />
      <div className="flex items-start gap-4 p-5 pl-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: iconBg }}>
          <Icon className="h-5 w-5" style={{ color: iconColor }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium" style={{ color: 'var(--admin-text-muted)' }}>{title}</p>
          <p className="text-2xl font-bold tracking-tight" style={{ color: iconColor }}>{value}</p>
          <p className="text-xs" style={{ color: 'var(--admin-text-subtle)' }}>{subtitle}</p>
          {trend && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium" style={{ color: trendPositive ? 'var(--admin-success)' : 'var(--admin-error)' }}>
              <TrendingUp className="h-3 w-3" />
              {trend}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function KycBadge({ status }: { status: ParentRecord['kycStatus'] }) {
  const config = KYC_CONFIG[status];
  const IconComp = config.Icon;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ background: config.bg, color: config.color }}>
      <IconComp className="h-3 w-3" />
      {status}
    </span>
  );
}

function RelationBadge({ relation }: { relation: ParentRecord['relation'] }) {
  const config = RELATION_CONFIG[relation];
  return (
    <span className="inline-flex rounded-md px-2 py-0.5 text-xs font-medium" style={{ background: config.bg, color: config.color }}>
      {relation}
    </span>
  );
}

// ── Main Page ──

export default function ParentsListPage() {
  const router = useRouter();

  // ── State ──
  const [searchQuery, setSearchQuery] = useState('');
  const [kycFilter, setKycFilter] = useState('All KYC Status');
  const [relationFilter, setRelationFilter] = useState('All Relations');
  const [classFilter, setClassFilter] = useState('All Classes');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const hasActiveFilters =
    searchQuery !== '' ||
    kycFilter !== 'All KYC Status' ||
    relationFilter !== 'All Relations' ||
    classFilter !== 'All Classes';

  // ── Filtered data ──
  const filteredParents = useMemo(() => {
    let result = MOCK_PARENTS;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.children.some((c) => c.name.toLowerCase().includes(q) || c.className.toLowerCase().includes(q))
      );
    }

    if (kycFilter !== 'All KYC Status') {
      result = result.filter((p) => p.kycStatus === kycFilter);
    }

    if (relationFilter !== 'All Relations') {
      result = result.filter((p) => p.relation === relationFilter);
    }

    if (classFilter !== 'All Classes') {
      result = result.filter((p) => p.children.some((c) => c.className === classFilter));
    }

    return result;
  }, [searchQuery, kycFilter, relationFilter, classFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredParents.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedParents = useMemo(() => {
    const start = (safePage - 1) * rowsPerPage;
    return filteredParents.slice(start, start + rowsPerPage);
  }, [filteredParents, safePage, rowsPerPage]);

  const startRow = filteredParents.length === 0 ? 0 : (safePage - 1) * rowsPerPage + 1;
  const endRow = Math.min(safePage * rowsPerPage, filteredParents.length);

  // ── Handlers ──
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setKycFilter('All KYC Status');
    setRelationFilter('All Relations');
    setClassFilter('All Classes');
    setCurrentPage(1);
  }, []);

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  // ── Page numbers ──
  const pageNumbers = useMemo(() => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push('...');
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, safePage]);

  return (
    <div className="flex flex-col gap-6 max-w-[1440px] mx-auto">
      {/* ── SECTION 1: HEADER ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'var(--admin-primary-soft)' }}>
            <Users className="h-5 w-5" style={{ color: 'var(--admin-primary)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--admin-text)' }}>Parents</h1>
            <p className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>Manage parent records and KYC verification</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button size="sm" className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover">
            <Plus className="h-4 w-4" />
            Add Parent
          </Button>
        </div>
      </div>

      {/* ── SECTION 2: STATISTICS CARDS ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            iconBg={card.iconBg}
            iconColor={card.iconColor}
            borderColor={card.borderColor}
            subtitle={card.subtitle}
            trend={card.trend}
            trendPositive={card.trendPositive}
          />
        ))}
      </div>

      {/* ── SECTION 3: FILTER BAR ── */}
      <PreOneCard className="!rounded-xl">
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--admin-text-subtle)' }} />
              <input
                type="text"
                placeholder="Search by name, phone, email, child or class..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-9 w-full rounded-lg border px-3 pl-9 text-sm outline-none transition-colors"
                style={{ background: 'var(--admin-surface-2)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--admin-primary)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--admin-primary-soft)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--admin-border)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>

            {/* KYC Status Dropdown */}
            <select
              value={kycFilter}
              onChange={(e) => { setKycFilter(e.target.value); setCurrentPage(1); }}
              className="h-9 rounded-lg border px-3 text-sm outline-none"
              style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
            >
              <option>All KYC Status</option>
              <option>Verified</option>
              <option>Pending</option>
              <option>Not Submitted</option>
            </select>

            {/* Relation Dropdown */}
            <select
              value={relationFilter}
              onChange={(e) => { setRelationFilter(e.target.value); setCurrentPage(1); }}
              className="h-9 rounded-lg border px-3 text-sm outline-none"
              style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
            >
              <option>All Relations</option>
              <option>Father</option>
              <option>Mother</option>
              <option>Guardian</option>
            </select>

            {/* Class Dropdown */}
            <select
              value={classFilter}
              onChange={(e) => { setClassFilter(e.target.value); setCurrentPage(1); }}
              className="h-9 rounded-lg border px-3 text-sm outline-none"
              style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
            >
              {CLASS_OPTIONS.map((opt) => <option key={opt}>{opt}</option>)}
            </select>

            {/* Filters Button */}
            <Button variant="outline" size="sm" className="gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
            </Button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="gap-1.5" style={{ color: 'var(--admin-error)' }} onClick={clearFilters}>
                <X className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </PreOneCard>

      {/* ── SECTION 4: STATS BAR + TABLE ── */}
      <PreOneCard className="!rounded-xl overflow-hidden">
        {/* Stats Bar */}
        <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: 'var(--admin-border)' }}>
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--admin-text-muted)' }}>Total Parents</span>
            <span className="rounded-md px-2 py-0.5 text-sm font-bold" style={{ background: 'var(--admin-primary-soft)', color: 'var(--admin-primary)' }}>
              {filteredParents.length}
            </span>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Columns3 className="h-3.5 w-3.5" />
            Columns
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--admin-border)' }}>
                <th className="min-w-[200px] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--admin-text-muted)' }}>Parent</th>
                <th className="w-[150px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--admin-text-muted)' }}>Phone</th>
                <th className="w-[100px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--admin-text-muted)' }}>Relation</th>
                <th className="w-[180px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--admin-text-muted)' }}>Child / Class</th>
                <th className="w-[140px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--admin-text-muted)' }}>KYC Status</th>
                <th className="w-[100px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--admin-text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedParents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Search className="h-10 w-10 opacity-40" style={{ color: 'var(--admin-text-muted)' }} />
                      <p className="text-sm font-medium" style={{ color: 'var(--admin-text-muted)' }}>No parents found</p>
                      <p className="text-xs" style={{ color: 'var(--admin-text-subtle)' }}>Try adjusting your search or filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedParents.map((parent) => (
                  <tr
                    key={parent.id}
                    className="cursor-pointer table-row-preone border-b"
                    style={{ borderColor: 'var(--admin-border)' }}
                    onClick={() => router.push(`/admin/parents/${parent.id}`)}
                  >
                    {/* Parent: Avatar + Name + Email */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs font-semibold" style={{ background: parent.avatarBg, color: parent.avatarColor }}>
                            {parent.avatarInitials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="truncate font-medium" style={{ color: 'var(--admin-text)' }}>{parent.name}</div>
                          <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--admin-text-subtle)' }}>
                            <Mail className="h-3 w-3" />
                            {parent.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 whitespace-nowrap text-xs tabular-nums" style={{ color: 'var(--admin-text-muted)' }}>
                        <Phone className="h-3 w-3" />
                        {parent.phone}
                      </span>
                    </td>

                    {/* Relation */}
                    <td className="px-4 py-3">
                      <RelationBadge relation={parent.relation} />
                    </td>

                    {/* Child / Class */}
                    <td className="px-4 py-3">
                      {parent.children.length > 0 ? (
                        <div className="space-y-0.5">
                          {parent.children.map((child, idx) => (
                            <div key={idx} className="text-sm">
                              <span style={{ color: 'var(--admin-text)' }}>{child.name}</span>
                              <span style={{ color: 'var(--admin-text-subtle)' }}> ({child.className})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--admin-text-subtle)' }}>No children linked</span>
                      )}
                    </td>

                    {/* KYC Status */}
                    <td className="px-4 py-3">
                      <KycBadge status={parent.kycStatus} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                          style={{ color: 'var(--admin-text-muted)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--admin-surface-2)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          onClick={() => router.push(`/admin/parents/${parent.id}`)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                          style={{ color: 'var(--admin-text-muted)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--admin-surface-2)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                          style={{ color: 'var(--admin-text-muted)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--admin-surface-2)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION ── */}
        {filteredParents.length > 0 && (
          <div className="flex flex-col gap-3 border-t px-5 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--admin-border)' }}>
            <div className="flex items-center gap-4">
              <span className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                Showing {startRow} to {endRow} of {filteredParents.length} parents
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'var(--admin-text-subtle)' }}>Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="h-7 rounded border px-1.5 text-xs outline-none"
                  style={{ background: 'var(--admin-surface)', borderColor: 'var(--admin-border)', color: 'var(--admin-text)' }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="flex h-8 w-8 items-center justify-center rounded-md" style={{ color: 'var(--admin-text-muted)', opacity: safePage <= 1 ? 0.4 : 1 }} disabled={safePage <= 1} onClick={() => setCurrentPage(safePage - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              {pageNumbers.map((p, idx) =>
                p === '...' ? (
                  <span key={`e-${idx}`} className="flex h-8 w-8 items-center justify-center text-xs" style={{ color: 'var(--admin-text-muted)' }}>...</span>
                ) : (
                  <button key={p} className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-medium" style={safePage === p ? { background: 'var(--admin-primary-soft)', color: 'var(--admin-primary)' } : { color: 'var(--admin-text-muted)' }} onClick={() => setCurrentPage(p)}>
                    {p}
                  </button>
                )
              )}
              <button className="flex h-8 w-8 items-center justify-center rounded-md" style={{ color: 'var(--admin-text-muted)', opacity: safePage >= totalPages ? 0.4 : 1 }} disabled={safePage >= totalPages} onClick={() => setCurrentPage(safePage + 1)}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </PreOneCard>
    </div>
  );
}
