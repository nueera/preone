'use client';

import React, { useState, useMemo } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import {
  Users,
  GraduationCap,
  CheckCircle,
  Clock,
  Plus,
  Upload,
  Download,
  Search,
  SlidersHorizontal,
  Eye,
  Pencil,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Mail,
  Phone,
  Hash,
  Calendar,
  Briefcase,
  Award,
  MapPin,
  Power,
} from 'lucide-react';
import { toast } from 'sonner';

// ────────────────────────────────────────────────────────────────
// DATA MODEL
// ────────────────────────────────────────────────────────────────

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  roleColor: string;
  roleBg: string;
  department: string;
  status: 'Active' | 'Onboarding';
  avatarInitials: string;
  avatarColor: string;
  avatarBg: string;
  employeeId: string;
  dateOfJoining: string;
  qualification: string;
  experience: string;
  dateOfBirth: string;
  address: string;
}

// ────────────────────────────────────────────────────────────────
// MOCK DATA
// ────────────────────────────────────────────────────────────────

const STAFF_MEMBERS: StaffMember[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    email: 'priya@preone.edu.in',
    phone: '+91 98765 43210',
    role: 'Teacher',
    roleColor: 'var(--admin-primary)',
    roleBg: 'var(--admin-primary-soft)',
    department: 'Pre Primary',
    status: 'Active',
    avatarInitials: 'PS',
    avatarColor: 'var(--admin-primary)',
    avatarBg: 'var(--admin-primary-soft)',
    employeeId: 'EMP-0001',
    dateOfJoining: '12 Feb 2024',
    qualification: 'B.Ed, Early Childhood Education',
    experience: '3 Years',
    dateOfBirth: '15 Aug 1992',
    address: 'Bengaluru, Karnataka',
  },
  {
    id: '2',
    name: 'Anita Desai',
    email: 'anita@preone.edu.in',
    phone: '+91 98765 43211',
    role: 'Teacher',
    roleColor: 'var(--admin-primary)',
    roleBg: 'var(--admin-primary-soft)',
    department: 'Pre Primary',
    status: 'Active',
    avatarInitials: 'AD',
    avatarColor: 'var(--admin-info)',
    avatarBg: 'var(--admin-info-soft)',
    employeeId: 'EMP-0002',
    dateOfJoining: '12 Feb 2024',
    qualification: 'M.Ed, Child Psychology',
    experience: '5 Years',
    dateOfBirth: '22 Mar 1990',
    address: 'Mumbai, Maharashtra',
  },
  {
    id: '3',
    name: 'Rajesh Kumar',
    email: 'rajesh@preone.edu.in',
    phone: '+91 98765 43212',
    role: 'Admin Staff',
    roleColor: 'var(--admin-warning)',
    roleBg: 'var(--admin-warning-soft)',
    department: 'Administration',
    status: 'Active',
    avatarInitials: 'RK',
    avatarColor: 'var(--admin-warning)',
    avatarBg: 'var(--admin-warning-soft)',
    employeeId: 'EMP-0003',
    dateOfJoining: '15 Jun 2023',
    qualification: 'B.Com, Tally Certified',
    experience: '4 Years',
    dateOfBirth: '10 Jan 1988',
    address: 'Delhi, NCR',
  },
  {
    id: '4',
    name: 'Sneha Iyer',
    email: 'sneha@preone.edu.in',
    phone: '+91 98765 43213',
    role: 'Assistant Teacher',
    roleColor: 'var(--admin-info)',
    roleBg: 'var(--admin-info-soft)',
    department: 'Pre Primary',
    status: 'Active',
    avatarInitials: 'SI',
    avatarColor: 'var(--admin-success)',
    avatarBg: 'var(--admin-success-soft)',
    employeeId: 'EMP-0004',
    dateOfJoining: '10 Jan 2025',
    qualification: 'Diploma in ECE',
    experience: '2 Years',
    dateOfBirth: '05 May 1995',
    address: 'Chennai, Tamil Nadu',
  },
  {
    id: '5',
    name: 'Vikram Patel',
    email: 'vikram@preone.edu.in',
    phone: '+91 98765 43214',
    role: 'Transport Staff',
    roleColor: 'var(--admin-accent)',
    roleBg: 'var(--admin-warning-soft)',
    department: 'Transport',
    status: 'Active',
    avatarInitials: 'VP',
    avatarColor: 'var(--admin-error)',
    avatarBg: 'var(--admin-error-soft)',
    employeeId: 'EMP-0005',
    dateOfJoining: '01 Jul 2024',
    qualification: 'License Holder',
    experience: '6 Years',
    dateOfBirth: '18 Nov 1985',
    address: 'Ahmedabad, Gujarat',
  },
  {
    id: '6',
    name: 'Meera Nair',
    email: 'meera@preone.edu.in',
    phone: '+91 98765 43215',
    role: 'Teacher',
    roleColor: 'var(--admin-primary)',
    roleBg: 'var(--admin-primary-soft)',
    department: 'Pre Primary',
    status: 'Onboarding',
    avatarInitials: 'MN',
    avatarColor: 'var(--admin-primary)',
    avatarBg: 'var(--admin-primary-soft)',
    employeeId: 'EMP-0006',
    dateOfJoining: '01 Apr 2025',
    qualification: 'B.Ed, Montessori Certified',
    experience: '1 Year',
    dateOfBirth: '30 Dec 1997',
    address: 'Kochi, Kerala',
  },
  {
    id: '7',
    name: 'Arjun Rao',
    email: 'arjun@preone.edu.in',
    phone: '+91 98765 43216',
    role: 'Support Staff',
    roleColor: 'var(--admin-text-muted)',
    roleBg: 'var(--admin-surface-2)',
    department: 'Support',
    status: 'Active',
    avatarInitials: 'AR',
    avatarColor: 'var(--admin-primary)',
    avatarBg: 'var(--admin-primary-soft)',
    employeeId: 'EMP-0007',
    dateOfJoining: '20 Aug 2023',
    qualification: 'High School',
    experience: '8 Years',
    dateOfBirth: '14 Feb 1983',
    address: 'Hyderabad, Telangana',
  },
  {
    id: '8',
    name: 'Pooja Dubey',
    email: 'pooja@preone.edu.in',
    phone: '+91 98765 43217',
    role: 'Teacher',
    roleColor: 'var(--admin-primary)',
    roleBg: 'var(--admin-primary-soft)',
    department: 'Pre Primary',
    status: 'Onboarding',
    avatarInitials: 'PD',
    avatarColor: 'var(--admin-warning)',
    avatarBg: 'var(--admin-warning-soft)',
    employeeId: 'EMP-0008',
    dateOfJoining: '15 Apr 2025',
    qualification: 'B.Ed, Special Education',
    experience: '0 Years',
    dateOfBirth: '25 Jul 1999',
    address: 'Lucknow, Uttar Pradesh',
  },
];

const ROLE_OPTIONS = ['All Roles', 'Teacher', 'Admin Staff', 'Assistant Teacher', 'Transport Staff', 'Support Staff'];
const DEPT_OPTIONS = ['All Departments', 'Pre Primary', 'Administration', 'Transport', 'Support'];
const ITEMS_PER_PAGE = 10;
type DetailTab = 'overview' | 'details' | 'documents' | 'payroll';

// ────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ────────────────────────────────────────────────────────────────

/** StatCard — Single statistics card with icon, value, and label */
function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  value,
  label,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
}) {
  return (
    <PreOneCard variant="default" hover className="p-5">
      <div className="flex items-start gap-4">
        <div
          className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <Icon className="h-5 w-5" style={{ color: iconColor }} />
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--admin-text)' }}>
            {value}
          </div>
          <div className="text-sm mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>
            {label}
          </div>
        </div>
      </div>
    </PreOneCard>
  );
}

/** StatusBadge — Renders Active/Onboarding status pill with dot indicator */
function StatusBadge({ status }: { status: 'Active' | 'Onboarding' }) {
  if (status === 'Active') {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
        style={{ backgroundColor: 'var(--admin-success-soft)', color: 'var(--admin-success)' }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--admin-success)' }} />
        Active
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: 'var(--admin-warning-soft)', color: 'var(--admin-warning)' }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--admin-warning)' }} />
      Onboarding
    </span>
  );
}

/** RoleBadge — Colored role badge */
function RoleBadge({ role, color, bg }: { role: string; color: string; bg: string }) {
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: bg, color: color }}
    >
      {role}
    </span>
  );
}

/** InfoRow — Detail panel info row with icon + label + value */
function InfoRow({
  icon: Icon,
  label,
  value,
  valueExtra,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueExtra?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: '1px solid var(--admin-border)' }}>
      <Icon className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--admin-text-subtle)' }} />
      <div className="flex-1 min-w-0">
        <div className="text-xs" style={{ color: 'var(--admin-text-subtle)' }}>{label}</div>
        <div className="text-sm font-medium mt-0.5" style={{ color: 'var(--admin-text)' }}>
          {value}
          {valueExtra}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// PAGE
// ────────────────────────────────────────────────────────────────

export default function StaffManagementPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [deptFilter, setDeptFilter] = useState('All Departments');
  const [detailTab, setDetailTab] = useState<DetailTab>('overview');

  // ── Derived data ──
  const filteredStaff = useMemo(() => {
    let result = STAFF_MEMBERS;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.phone.includes(q)
      );
    }

    if (roleFilter !== 'All Roles') {
      result = result.filter((s) => s.role === roleFilter);
    }

    if (deptFilter !== 'All Departments') {
      result = result.filter((s) => s.department === deptFilter);
    }

    return result;
  }, [searchQuery, roleFilter, deptFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedStaff = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredStaff.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStaff, safeCurrentPage]);

  const startIdx = filteredStaff.length === 0 ? 0 : (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIdx = Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredStaff.length);

  const teacherCount = STAFF_MEMBERS.filter(
    (s) => s.role === 'Teacher' || s.role === 'Assistant Teacher'
  ).length;
  const activeCount = STAFF_MEMBERS.filter((s) => s.status === 'Active').length;
  const onboardingCount = STAFF_MEMBERS.filter((s) => s.status === 'Onboarding').length;

  // ── Handlers ──
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRoleFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDeptFilter(e.target.value);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const selectStaff = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setDetailTab('overview');
  };

  const closeDetail = () => {
    setSelectedStaff(null);
  };

  // ── Render ──
  return (
    <PageTransition>
      <div className="flex gap-6 max-w-[1440px] mx-auto" style={{ backgroundColor: 'var(--admin-bg)' }}>
        {/* ── Main Content Column ── */}
        <div
          className="flex flex-col gap-6 transition-all duration-300 min-w-0"
          style={{ width: selectedStaff ? '72%' : '100%' }}
        >
          {/* ── Section 1: Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left Side */}
            <div className="flex items-start gap-4">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--admin-primary-soft)' }}
              >
                <Users className="h-5 w-5" style={{ color: 'var(--admin-primary)' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--admin-text)' }}>
                  Staff Management
                </h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>
                  Manage staff members, roles, qualifications and onboarding.
                </p>
              </div>
            </div>
            {/* Right Side: Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('Import CSV dialog coming soon')}
                style={{ borderColor: 'var(--admin-border)' }}
              >
                <Upload className="h-4 w-4 mr-1.5" />
                Import CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('Export coming soon')}
                style={{ borderColor: 'var(--admin-border)' }}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </Button>
              <Button
                size="sm"
                onClick={() => toast.info('Add Staff dialog coming soon')}
                style={{ backgroundColor: 'var(--admin-primary)', color: 'var(--admin-primary-foreground)' }}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Staff
              </Button>
            </div>
          </div>

          {/* ── Section 2: Statistics Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} iconBg="var(--admin-primary-soft)" iconColor="var(--admin-primary)" value={String(STAFF_MEMBERS.length)} label="All staff members" />
            <StatCard icon={GraduationCap} iconBg="var(--admin-info-soft)" iconColor="var(--admin-info)" value={String(teacherCount)} label="Teaching staff" />
            <StatCard icon={CheckCircle} iconBg="var(--admin-success-soft)" iconColor="var(--admin-success)" value={String(activeCount)} label="Currently active" />
            <StatCard icon={Clock} iconBg="var(--admin-warning-soft)" iconColor="var(--admin-warning)" value={String(onboardingCount)} label="In onboarding" />
          </div>

          {/* ── Section 3: Search / Filter Bar ── */}
          <PreOneCard variant="default" className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: 'var(--admin-text-subtle)' }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by name, email or phone..."
                  className="h-10 w-full rounded-lg border pl-10 pr-4 text-sm outline-none transition-colors"
                  style={{
                    borderColor: 'var(--admin-border)',
                    backgroundColor: 'var(--admin-surface-2)',
                    color: 'var(--admin-text)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--admin-primary)';
                    e.currentTarget.style.boxShadow = '0 0 0 2px var(--admin-primary-soft)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--admin-border)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
              {/* Role Dropdown */}
              <select
                value={roleFilter}
                onChange={handleRoleChange}
                aria-label="Filter by role"
                className="h-9 rounded-lg border px-3 text-sm outline-none cursor-pointer"
                style={{
                  backgroundColor: 'var(--admin-surface)',
                  borderColor: 'var(--admin-border)',
                  color: 'var(--admin-text)',
                }}
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              {/* Department Dropdown */}
              <select
                value={deptFilter}
                onChange={handleDeptChange}
                aria-label="Filter by department"
                className="h-9 rounded-lg border px-3 text-sm outline-none cursor-pointer"
                style={{
                  backgroundColor: 'var(--admin-surface)',
                  borderColor: 'var(--admin-border)',
                  color: 'var(--admin-text)',
                }}
              >
                {DEPT_OPTIONS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {/* Filters Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('Advanced filters coming soon')}
                style={{ borderColor: 'var(--admin-border)' }}
              >
                <SlidersHorizontal className="h-4 w-4 mr-1.5" />
                Filters
              </Button>
            </div>
          </PreOneCard>

          {/* ── Section 4: Staff Table ── */}
          <PreOneCard variant="default" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* Table Header */}
                <thead>
                  <tr className="border-b" style={{ borderBottomColor: 'var(--admin-border)' }}>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--admin-text-muted)' }}>
                      Staff Member
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--admin-text-muted)' }}>
                      Role
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--admin-text-muted)' }}>
                      Department
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--admin-text-muted)' }}>
                      Status
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--admin-text-muted)' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                {/* Table Body */}
                <tbody>
                  {paginatedStaff.length > 0 ? (
                    paginatedStaff.map((member) => (
                      <tr
                        key={member.id}
                        className="border-b transition-colors cursor-pointer"
                        style={{
                          borderBottomColor: 'var(--admin-border)',
                          backgroundColor: selectedStaff?.id === member.id ? 'var(--admin-primary-soft)' : 'transparent',
                        }}
                        onClick={() => selectStaff(member)}
                        onMouseEnter={(e) => {
                          if (selectedStaff?.id !== member.id) {
                            e.currentTarget.style.backgroundColor = 'var(--admin-surface-2)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedStaff?.id !== member.id) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        {/* Column 1: Staff Member */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                              style={{ backgroundColor: member.avatarBg, color: member.avatarColor }}
                            >
                              {member.avatarInitials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium truncate" style={{ color: 'var(--admin-text)' }}>
                                {member.name}
                              </div>
                              <div className="text-xs truncate" style={{ color: 'var(--admin-text-subtle)' }}>
                                {member.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* Column 2: Role */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <RoleBadge role={member.role} color={member.roleColor} bg={member.roleBg} />
                        </td>
                        {/* Column 3: Department */}
                        <td className="px-5 py-4 whitespace-nowrap" style={{ color: 'var(--admin-text)' }}>
                          {member.department}
                        </td>
                        {/* Column 4: Status */}
                        <td className="px-5 py-4 whitespace-nowrap">
                          <StatusBadge status={member.status} />
                        </td>
                        {/* Column 5: Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              title="View"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectStaff(member);
                              }}
                              className="h-8 w-8 rounded-lg inline-flex items-center justify-center transition-colors"
                              style={{ color: 'var(--admin-text-muted)' }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--admin-surface-2)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              title="Edit"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.info('Edit dialog coming soon');
                              }}
                              className="h-8 w-8 rounded-lg inline-flex items-center justify-center transition-colors"
                              style={{ color: 'var(--admin-text-muted)' }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--admin-surface-2)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              title="More options"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.info('More options coming soon');
                              }}
                              className="h-8 w-8 rounded-lg inline-flex items-center justify-center transition-colors"
                              style={{ color: 'var(--admin-text-muted)' }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--admin-surface-2)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    /* Empty State */
                    <tr>
                      <td colSpan={5} className="py-12 px-5 text-center">
                        <Search
                          className="h-10 w-10 mx-auto mb-3"
                          style={{ color: 'var(--admin-text-muted)', opacity: 0.4 }}
                        />
                        <div className="text-sm font-medium" style={{ color: 'var(--admin-text-muted)' }}>
                          No staff members found
                        </div>
                        <div className="text-xs mt-1" style={{ color: 'var(--admin-text-muted)' }}>
                          Try adjusting your search or filters.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Section 5: Pagination ── */}
            {filteredStaff.length > 0 && (
              <div
                className="flex items-center justify-between border-t px-5 py-3"
                style={{ borderColor: 'var(--admin-border)' }}
              >
                <span className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                  Showing {startIdx} to {endIdx} of {filteredStaff.length} staff members
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={safeCurrentPage === 1}
                    onClick={() => goToPage(safeCurrentPage - 1)}
                    className="h-8 w-8 rounded-lg inline-flex items-center justify-center transition-colors disabled:opacity-40"
                    style={{ color: 'var(--admin-text-muted)' }}
                    onMouseEnter={(e) => { if (safeCurrentPage !== 1) e.currentTarget.style.backgroundColor = 'var(--admin-surface-2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className="h-8 w-8 rounded-lg inline-flex items-center justify-center text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: page === safeCurrentPage ? 'var(--admin-primary-soft)' : 'transparent',
                        color: page === safeCurrentPage ? 'var(--admin-primary)' : 'var(--admin-text-muted)',
                      }}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    disabled={safeCurrentPage === totalPages}
                    onClick={() => goToPage(safeCurrentPage + 1)}
                    className="h-8 w-8 rounded-lg inline-flex items-center justify-center transition-colors disabled:opacity-40"
                    style={{ color: 'var(--admin-text-muted)' }}
                    onMouseEnter={(e) => { if (safeCurrentPage !== totalPages) e.currentTarget.style.backgroundColor = 'var(--admin-surface-2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </PreOneCard>
        </div>

        {/* ── Section 6: Right Detail Panel ── */}
        {selectedStaff && (
          <div className="shrink-0 transition-all duration-300" style={{ width: '28%' }}>
            <PreOneCard variant="default" className="sticky top-0 overflow-hidden">
              {/* Panel Header */}
              <div className="relative p-4 pb-3" style={{ backgroundColor: 'var(--admin-surface-2)' }}>
                {/* Close button */}
                <button
                  onClick={closeDetail}
                  aria-label="Close details"
                  className="absolute top-3 right-3 h-7 w-7 rounded-lg inline-flex items-center justify-center transition-colors"
                  style={{ color: 'var(--admin-text-muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--admin-surface)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Avatar */}
                <div className="flex flex-col items-center text-center pt-2">
                  <div
                    className="h-16 w-16 rounded-full flex items-center justify-center text-lg font-bold mb-3"
                    style={{ backgroundColor: selectedStaff.avatarBg, color: selectedStaff.avatarColor }}
                  >
                    {selectedStaff.avatarInitials}
                  </div>
                  <div className="text-lg font-bold" style={{ color: 'var(--admin-text)' }}>
                    {selectedStaff.name}
                  </div>
                  <div className="mt-1">
                    <StatusBadge status={selectedStaff.status} />
                  </div>
                  <div className="text-sm mt-2" style={{ color: 'var(--admin-text-muted)' }}>
                    {selectedStaff.role} • {selectedStaff.department}
                  </div>
                  <div className="flex items-center gap-1 mt-1.5 text-xs" style={{ color: 'var(--admin-text-subtle)' }}>
                    <Mail className="h-3 w-3" />
                    {selectedStaff.email}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'var(--admin-text-subtle)' }}>
                    <Phone className="h-3 w-3" />
                    {selectedStaff.phone}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex px-4 border-b" style={{ borderBottomColor: 'var(--admin-border)' }}>
                {(['overview', 'details', 'documents', 'payroll'] as DetailTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDetailTab(tab)}
                    className="px-3 py-2.5 text-xs font-medium capitalize transition-colors relative"
                    style={{
                      color: detailTab === tab ? 'var(--admin-primary)' : 'var(--admin-text-muted)',
                    }}
                  >
                    {tab}
                    {detailTab === tab && (
                      <span
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ backgroundColor: 'var(--admin-primary)' }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-4 max-h-[400px] overflow-y-auto">
                {detailTab === 'overview' && (
                  <div>
                    <InfoRow icon={Hash} label="Employee ID" value={selectedStaff.employeeId} />
                    <InfoRow icon={Calendar} label="Date of Joining" value={selectedStaff.dateOfJoining} />
                    <InfoRow icon={Briefcase} label="Department" value={selectedStaff.department} />
                    <InfoRow icon={Award} label="Qualification" value={selectedStaff.qualification} />
                    <InfoRow icon={GraduationCap} label="Experience" value={selectedStaff.experience} />
                    <InfoRow icon={Calendar} label="Date of Birth" value={selectedStaff.dateOfBirth} />
                    <InfoRow icon={MapPin} label="Address" value={selectedStaff.address} />
                    <InfoRow
                      icon={Users}
                      label="Role"
                      value=""
                      valueExtra={<RoleBadge role={selectedStaff.role} color={selectedStaff.roleColor} bg={selectedStaff.roleBg} />}
                    />
                  </div>
                )}
                {detailTab === 'details' && (
                  <div className="py-8 text-center text-sm" style={{ color: 'var(--admin-text-muted)' }}>
                    Details will appear here.
                  </div>
                )}
                {detailTab === 'documents' && (
                  <div className="py-8 text-center text-sm" style={{ color: 'var(--admin-text-muted)' }}>
                    Documents will appear here.
                  </div>
                )}
                {detailTab === 'payroll' && (
                  <div className="py-8 text-center text-sm" style={{ color: 'var(--admin-text-muted)' }}>
                    Payroll will appear here.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 p-4 border-t" style={{ borderTopColor: 'var(--admin-border)' }}>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => toast.info('Edit Staff dialog coming soon')}
                  style={{ borderColor: 'var(--admin-border)' }}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit Staff
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => toast.info('Deactivate confirmation coming soon')}
                  style={{ borderColor: 'var(--admin-error-soft)', color: 'var(--admin-error)' }}
                >
                  <Power className="h-3.5 w-3.5 mr-1.5" />
                  Deactivate
                </Button>
              </div>
            </PreOneCard>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
