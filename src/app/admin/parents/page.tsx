'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  X,
  Users,
  Phone,
  Mail,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  AlertCircle,
  UserPlus,
} from 'lucide-react';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import { CosmicStatCard } from '@/components/ui/cosmic-stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PORTAL_THEMES } from '@/lib/theme-tokens';

const theme = PORTAL_THEMES.admin;

// ── Types ──
interface ParentRecord {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  relation: 'Father' | 'Mother' | 'Guardian';
  occupation: string;
  photo: string | null;
  kycStatus: 'Verified' | 'Pending' | 'Not Submitted';
  children: { name: string; className: string }[];
}

// ── KYC badge colors ──
const KYC_STYLES: Record<string, { bg: string; icon: React.ReactNode }> = {
  Verified: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: <ShieldCheck className="h-3 w-3" />,
  },
  Pending: {
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: <Clock className="h-3 w-3" />,
  },
  'Not Submitted': {
    bg: 'bg-gray-50 text-gray-600 border-gray-200',
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

const RELATION_COLORS: Record<string, string> = {
  Father: 'bg-sky-50 text-sky-700 border-sky-200',
  Mother: 'bg-pink-50 text-pink-700 border-pink-200',
  Guardian: 'bg-violet-50 text-violet-700 border-violet-200',
};

// ── Placeholder data ──
const PLACEHOLDER_PARENTS: ParentRecord[] = [
  { id: 'p1', firstName: 'Rajesh', lastName: 'Kumar', phone: '9876543210', email: 'rajesh.kumar@email.com', relation: 'Father', occupation: 'Software Engineer', photo: null, kycStatus: 'Verified', children: [{ name: 'Aarav Kumar', className: 'Nursery A' }] },
  { id: 'p2', firstName: 'Sunita', lastName: 'Patel', phone: '9876543211', email: 'sunita.patel@email.com', relation: 'Mother', occupation: 'Homemaker', photo: null, kycStatus: 'Verified', children: [{ name: 'Ananya Patel', className: 'LKG A' }] },
  { id: 'p3', firstName: 'Arjun', lastName: 'Singh', phone: '9876543212', email: 'arjun.singh@email.com', relation: 'Father', occupation: 'Business Owner', photo: null, kycStatus: 'Pending', children: [{ name: 'Vihaan Singh', className: 'UKG A' }] },
  { id: 'p4', firstName: 'Priya', lastName: 'Sharma', phone: '9876543213', email: 'priya.sharma@email.com', relation: 'Mother', occupation: 'Teacher', photo: null, kycStatus: 'Verified', children: [{ name: 'Isha Sharma', className: 'Nursery B' }, { name: 'Arya Sharma', className: 'LKG B' }] },
  { id: 'p5', firstName: 'Mohammed', lastName: 'Khan', phone: '9876543214', email: 'mkhan@email.com', relation: 'Father', occupation: 'Doctor', photo: null, kycStatus: 'Not Submitted', children: [{ name: 'Zara Khan', className: 'UKG B' }] },
  { id: 'p6', firstName: 'Lakshmi', lastName: 'Rao', phone: '9876543215', email: 'lakshmi.rao@email.com', relation: 'Guardian', occupation: 'Retired Professor', photo: null, kycStatus: 'Pending', children: [{ name: 'Ravi Rao', className: 'Daycare 1' }] },
  { id: 'p7', firstName: 'Deepak', lastName: 'Verma', phone: '9876543216', email: 'deepak.verma@email.com', relation: 'Father', occupation: 'Chartered Accountant', photo: null, kycStatus: 'Verified', children: [{ name: 'Neha Verma', className: 'Nursery A' }] },
  { id: 'p8', firstName: 'Meena', lastName: 'Gupta', phone: '9876543217', email: 'meena.gupta@email.com', relation: 'Mother', occupation: 'Architect', photo: null, kycStatus: 'Not Submitted', children: [{ name: 'Rohan Gupta', className: 'LKG A' }] },
];

export default function ParentsListPage() {
  const router = useRouter();

  // ── State ──
  const [parents, setParents] = useState<ParentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [relationFilter, setRelationFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // ── Debounce search ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // ── Simulate loading ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setParents(PLACEHOLDER_PARENTS);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // ── Filter & search ──
  const filteredParents = parents.filter((p) => {
    const matchesSearch =
      !debouncedSearch ||
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.phone.includes(debouncedSearch) ||
      p.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.children.some((c) => c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || c.className.toLowerCase().includes(debouncedSearch.toLowerCase()));
    const matchesKyc = !kycFilter || p.kycStatus === kycFilter;
    const matchesRelation = !relationFilter || p.relation === relationFilter;
    return matchesSearch && matchesKyc && matchesRelation;
  });

  const totalPages = Math.ceil(filteredParents.length / limit);
  const paginatedParents = filteredParents.slice((page - 1) * limit, page * limit);

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setKycFilter('');
    setRelationFilter('');
    setPage(1);
  };

  const hasActiveFilters = debouncedSearch || kycFilter || relationFilter;

  const getInitials = (first: string, last: string) =>
    `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

  // ── Stats ──
  const totalParents = parents.length;
  const verifiedCount = parents.filter((p) => p.kycStatus === 'Verified').length;
  const pendingCount = parents.filter((p) => p.kycStatus === 'Pending').length;
  const notSubmittedCount = parents.filter((p) => p.kycStatus === 'Not Submitted').length;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* ── Top Bar ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Parents
            </h1>
            <p className="text-sm text-muted-foreground">Manage parent records and KYC verification</p>
          </div>
          <Button
            className="gap-2 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
          >
            <UserPlus className="h-4 w-4" />
            Add Parent
          </Button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CosmicStatCard
            label="Total Parents"
            value={totalParents}
            icon={<Users className="h-5 w-5" />}
            color="bg-violet-500"
          />
          <CosmicStatCard
            label="KYC Verified"
            value={verifiedCount}
            icon={<ShieldCheck className="h-5 w-5" />}
            color="bg-emerald-500"
            trend={{ value: 12, positive: true }}
          />
          <CosmicStatCard
            label="KYC Pending"
            value={pendingCount}
            icon={<Clock className="h-5 w-5" />}
            color="bg-amber-500"
          />
          <CosmicStatCard
            label="Not Submitted"
            value={notSubmittedCount}
            icon={<AlertCircle className="h-5 w-5" />}
            color="bg-gray-400"
          />
        </div>

        {/* ── Filters Row ── */}
        <PreOneCard variant="default">
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              Filters
            </div>
            <div className="flex flex-wrap gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, email, child..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* KYC Status Filter */}
              <Select
                value={kycFilter || 'ALL'}
                onValueChange={(v) => {
                  setKycFilter(v === 'ALL' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="KYC Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All KYC Status</SelectItem>
                  <SelectItem value="Verified">Verified</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Not Submitted">Not Submitted</SelectItem>
                </SelectContent>
              </Select>

              {/* Relation Filter */}
              <Select
                value={relationFilter || 'ALL'}
                onValueChange={(v) => {
                  setRelationFilter(v === 'ALL' ? '' : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Relation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Relations</SelectItem>
                  <SelectItem value="Father">Father</SelectItem>
                  <SelectItem value="Mother">Mother</SelectItem>
                  <SelectItem value="Guardian">Guardian</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={clearFilters}>
                  <X className="h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </PreOneCard>

        {/* ── Parents Table ── */}
        <PreOneCard variant="default">
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Photo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-[140px]">Phone</TableHead>
                    <TableHead className="w-[120px]">Relation</TableHead>
                    <TableHead className="w-[180px]">Child / Class</TableHead>
                    <TableHead className="w-[130px]">KYC Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-9 w-9 rounded-full" /></TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-40" />
                        </TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : paginatedParents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-48 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Users className="h-12 w-12 text-muted-foreground/30" />
                          <p className="text-muted-foreground">No parents found</p>
                          <Button
                            className="bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover"
                            onClick={clearFilters}
                          >
                            Clear Filters
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedParents.map((parent) => (
                      <TableRow
                        key={parent.id}
                        className="cursor-pointer table-row-preone"
                        onClick={() => router.push(`/admin/parents/${parent.id}`)}
                      >
                        <TableCell>
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className={theme.avatarFallbackClass}>
                              {getInitials(parent.firstName, parent.lastName)}
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {parent.firstName} {parent.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {parent.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm flex items-center gap-1 text-portal-600">
                            <Phone className="h-3 w-3" />
                            {parent.phone}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${RELATION_COLORS[parent.relation]}`}>
                            {parent.relation}
                          </span>
                        </TableCell>
                        <TableCell>
                          {parent.children.length > 0 ? (
                            <div className="space-y-0.5">
                              {parent.children.map((child, idx) => (
                                <div key={idx} className="text-sm">
                                  <span className="font-medium">{child.name}</span>
                                  <span className="text-muted-foreground"> ({child.className})</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No children linked</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium border ${KYC_STYLES[parent.kycStatus].bg}`}>
                            {KYC_STYLES[parent.kycStatus].icon}
                            {parent.kycStatus}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* ── Pagination ── */}
            {!loading && filteredParents.length > 0 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * limit) + 1}–{Math.min(page * limit, filteredParents.length)} of {filteredParents.length} parents
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">{page} / {totalPages || 1}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </PreOneCard>
      </div>
    </PageTransition>
  );
}
