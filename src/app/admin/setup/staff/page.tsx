'use client';

import React, { useState } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import { CosmicStatCard } from '@/components/ui/cosmic-stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Plus,
  UserPlus,
  Shield,
  Upload,
  Download,
  GraduationCap,
  Phone,
  Mail,
  Search,
  Edit3,
  Trash2,
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
} from 'lucide-react';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const theme = PORTAL_THEMES.admin;

interface StaffMember {
  id: string;
  name: string;
  role: string;
  qualification: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive' | 'onboarding';
  branch: string;
  joinDate: string;
  avatar?: string;
}

const INITIAL_STAFF: StaffMember[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    role: 'Teacher',
    qualification: 'B.Ed, Early Childhood Education',
    phone: '9876543210',
    email: 'priya@preone.edu.in',
    status: 'active',
    branch: 'Main Campus',
    joinDate: '2024-04-01',
  },
  {
    id: '2',
    name: 'Anita Desai',
    role: 'Teacher',
    qualification: 'M.Ed, Child Psychology',
    phone: '9876543211',
    email: 'anita@preone.edu.in',
    status: 'active',
    branch: 'Main Campus',
    joinDate: '2024-04-01',
  },
  {
    id: '3',
    name: 'Rajesh Kumar',
    role: 'Admin Staff',
    qualification: 'B.Com, Tally Certified',
    phone: '9876543212',
    email: 'rajesh@preone.edu.in',
    status: 'active',
    branch: 'Main Campus',
    joinDate: '2023-06-15',
  },
  {
    id: '4',
    name: 'Sneha Iyer',
    role: 'Assistant Teacher',
    qualification: 'Diploma in ECE',
    phone: '9876543213',
    email: 'sneha@preone.edu.in',
    status: 'active',
    branch: 'Whitefield',
    joinDate: '2025-01-10',
  },
  {
    id: '5',
    name: 'Vikram Patel',
    role: 'Transport Staff',
    qualification: 'License Holder',
    phone: '9876543214',
    email: 'vikram@preone.edu.in',
    status: 'active',
    branch: 'Main Campus',
    joinDate: '2024-07-01',
  },
  {
    id: '6',
    name: 'Meera Nair',
    role: 'Teacher',
    qualification: 'B.Ed, Montessori Certified',
    phone: '9876543215',
    email: 'meera@preone.edu.in',
    status: 'onboarding',
    branch: 'Jayanagar',
    joinDate: '2025-04-01',
  },
  {
    id: '7',
    name: 'Dr. Sunita Reddy',
    role: 'Principal',
    qualification: 'Ph.D Education, 20 yrs exp',
    phone: '9876543200',
    email: 'sunita@preone.edu.in',
    status: 'active',
    branch: 'Main Campus',
    joinDate: '2020-04-01',
  },
  {
    id: '8',
    name: 'Amit Verma',
    role: 'Support Staff',
    qualification: 'High School',
    phone: '9876543216',
    email: 'amit@preone.edu.in',
    status: 'inactive',
    branch: 'Whitefield',
    joinDate: '2023-08-20',
  },
];

const roleColors: Record<string, string> = {
  Principal: 'bg-violet-50 text-violet-700 border-violet-200',
  Teacher: 'bg-blue-50 text-blue-700 border-blue-200',
  'Assistant Teacher': 'bg-sky-50 text-sky-700 border-sky-200',
  'Admin Staff': 'bg-amber-50 text-amber-700 border-amber-200',
  'Transport Staff': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Support Staff': 'bg-gray-100 text-gray-700 border-gray-200',
};

const statusConfig: Record<string, { bg: string; icon: React.ReactNode }> = {
  active: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
  inactive: { bg: 'bg-gray-100 text-gray-500 border-gray-200', icon: <XCircle className="h-3 w-3 mr-1" /> },
  onboarding: { bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="h-3 w-3 mr-1" /> },
};

export default function StaffSetupPage() {
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'Teacher',
    qualification: '',
    phone: '',
    email: '',
    branch: 'Main Campus',
  });

  const filteredStaff = staff.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'all' || s.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleAddStaff = async () => {
    if (!newStaff.name.trim()) {
      toast.error('Staff name is required');
      return;
    }
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    const member: StaffMember = {
      id: String(staff.length + 1),
      ...newStaff,
      status: 'onboarding',
      joinDate: new Date().toISOString().split('T')[0],
    };
    setStaff((prev) => [...prev, member]);
    setNewStaff({
      name: '',
      role: 'Teacher',
      qualification: '',
      phone: '',
      email: '',
      branch: 'Main Campus',
    });
    setSaving(false);
    setDialogOpen(false);
    toast.success(`"${member.name}" added — onboarding pending`);
  };

  const handleImportCSV = () => {
    setCsvDialogOpen(false);
    toast.success('CSV import started — 15 staff members being processed');
  };

  const handleDelete = (id: string) => {
    setStaff((prev) => prev.filter((s) => s.id !== id));
    toast.success('Staff member removed');
  };

  const uniqueRoles = [...new Set(staff.map((s) => s.role))];

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-6 w-6 text-violet-600" />
              Staff Setup & Onboarding
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage staff members, roles, qualifications, and onboarding
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Import CSV
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Import Staff from CSV</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-violet-300 transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 font-medium">
                      Drop CSV file here or click to browse
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      CSV with columns: name, role, qualification, phone, email
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                    <span>Download template:</span>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                      staff_template.csv
                    </Button>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCsvDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleImportCSV}
                      className="bg-gradient-to-r from-violet-600 to-sky-500 text-white border-0"
                    >
                      Import
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1.5 bg-gradient-to-r from-violet-600 to-sky-500 text-white border-0 hover:from-violet-700 hover:to-sky-600">
                  <UserPlus className="h-4 w-4" /> Add Staff
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Staff Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label>Full Name</Label>
                    <Input
                      value={newStaff.name}
                      onChange={(e) =>
                        setNewStaff((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="Full name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Role</Label>
                      <Select
                        value={newStaff.role}
                        onValueChange={(val) =>
                          setNewStaff((p) => ({ ...p, role: val }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Principal">Principal</SelectItem>
                          <SelectItem value="Teacher">Teacher</SelectItem>
                          <SelectItem value="Assistant Teacher">Assistant Teacher</SelectItem>
                          <SelectItem value="Admin Staff">Admin Staff</SelectItem>
                          <SelectItem value="Transport Staff">Transport Staff</SelectItem>
                          <SelectItem value="Support Staff">Support Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Branch</Label>
                      <Select
                        value={newStaff.branch}
                        onValueChange={(val) =>
                          setNewStaff((p) => ({ ...p, branch: val }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Main Campus">Main Campus</SelectItem>
                          <SelectItem value="Whitefield">Whitefield</SelectItem>
                          <SelectItem value="Jayanagar">Jayanagar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Qualification</Label>
                    <Input
                      value={newStaff.qualification}
                      onChange={(e) =>
                        setNewStaff((p) => ({ ...p, qualification: e.target.value }))
                      }
                      placeholder="e.g., B.Ed, M.Ed"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Phone</Label>
                      <Input
                        value={newStaff.phone}
                        onChange={(e) =>
                          setNewStaff((p) => ({ ...p, phone: e.target.value }))
                        }
                        placeholder="Phone number"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={newStaff.email}
                        onChange={(e) =>
                          setNewStaff((p) => ({ ...p, email: e.target.value }))
                        }
                        placeholder="Email address"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddStaff}
                      disabled={saving}
                      className="bg-gradient-to-r from-violet-600 to-sky-500 text-white border-0"
                    >
                      {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                      Add Staff
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <CosmicStatCard
            label="Total Staff"
            value={staff.length}
            icon={<Users className="w-5 h-5" />}
            color="bg-violet-500"
          />
          <CosmicStatCard
            label="Teachers"
            value={staff.filter((s) => s.role === 'Teacher' || s.role === 'Assistant Teacher').length}
            icon={<GraduationCap className="w-5 h-5" />}
            color="bg-sky-500"
          />
          <CosmicStatCard
            label="Active"
            value={staff.filter((s) => s.status === 'active').length}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="bg-emerald-500"
          />
          <CosmicStatCard
            label="Onboarding"
            value={staff.filter((s) => s.status === 'onboarding').length}
            icon={<Clock className="w-5 h-5" />}
            color="bg-amber-500"
          />
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              placeholder="Search by name or email..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {uniqueRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStaff.map((member) => (
            <PreOneCard key={member.id} variant="default" hover>
              <div className="p-5 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-400 to-sky-400 flex items-center justify-center text-white font-semibold text-sm">
                      {member.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-gray-900">
                        {member.name}
                      </h3>
                      <Badge
                        className={cn(
                          'text-[10px] mt-0.5',
                          roleColors[member.role] || 'bg-gray-50 text-gray-700'
                        )}
                      >
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-400 hover:text-red-600"
                      onClick={() => handleDelete(member.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <GraduationCap className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{member.qualification}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{member.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{member.email}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <Badge className={cn('text-[10px]', statusConfig[member.status].bg)}>
                    {statusConfig[member.status].icon}
                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                  </Badge>
                  <span className="text-xs text-gray-400">{member.branch}</span>
                </div>
              </div>
            </PreOneCard>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No staff members match your search</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
