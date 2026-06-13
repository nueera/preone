'use client';

import React, { useState } from 'react';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import { CosmicStatCard } from '@/components/ui/cosmic-stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  Users,
  GraduationCap,
  Edit3,
  Trash2,
  Loader2,
  MoreVertical,
  UserCheck,
  PhoneCall,
} from 'lucide-react';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const theme = PORTAL_THEMES.admin;

interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  status: 'active' | 'inactive';
  studentsCount: number;
  teachersCount: number;
  isMain: boolean;
}

const INITIAL_BRANCHES: Branch[] = [
  {
    id: '1',
    name: 'Main Campus — Koramangala',
    address: '123 Education Lane, Koramangala',
    city: 'Bangalore',
    phone: '080-12345678',
    status: 'active',
    studentsCount: 120,
    teachersCount: 15,
    isMain: true,
  },
  {
    id: '2',
    name: 'Whitefield Branch',
    address: '456 Learning Ave, Whitefield',
    city: 'Bangalore',
    phone: '080-23456789',
    status: 'active',
    studentsCount: 85,
    teachersCount: 10,
    isMain: false,
  },
  {
    id: '3',
    name: 'Indiranagar Branch',
    address: '789 Growth Street, Indiranagar',
    city: 'Bangalore',
    phone: '080-34567890',
    status: 'inactive',
    studentsCount: 0,
    teachersCount: 0,
    isMain: false,
  },
  {
    id: '4',
    name: 'Jayanagar Branch',
    address: '321 Discovery Road, Jayanagar',
    city: 'Bangalore',
    phone: '080-45678901',
    status: 'active',
    studentsCount: 62,
    teachersCount: 8,
    isMain: false,
  },
];

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newBranch, setNewBranch] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
  });

  const handleAddBranch = async () => {
    if (!newBranch.name.trim()) {
      toast.error('Branch name is required');
      return;
    }
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    const branch: Branch = {
      id: String(branches.length + 1),
      name: newBranch.name,
      address: newBranch.address,
      city: newBranch.city,
      phone: newBranch.phone,
      status: 'active',
      studentsCount: 0,
      teachersCount: 0,
      isMain: false,
    };
    setBranches((prev) => [...prev, branch]);
    setNewBranch({ name: '', address: '', city: '', phone: '' });
    setSaving(false);
    setDialogOpen(false);
    toast.success(`"${branch.name}" added successfully`);
  };

  const handleDeleteBranch = (id: string) => {
    const branch = branches.find((b) => b.id === id);
    if (branch?.isMain) {
      toast.error('Cannot delete the main branch');
      return;
    }
    setBranches((prev) => prev.filter((b) => b.id !== id));
    toast.success('Branch removed');
  };

  const toggleStatus = (id: string) => {
    setBranches((prev) =>
      prev.map((b) =>
        b.id === id
          ? { ...b, status: b.status === 'active' ? 'inactive' : 'active' }
          : b
      )
    );
    toast.success('Branch status updated');
  };

  const activeCount = branches.filter((b) => b.status === 'active').length;
  const totalStudents = branches.reduce((s, b) => s + b.studentsCount, 0);
  const totalTeachers = branches.reduce((s, b) => s + b.teachersCount, 0);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-6 w-6 text-violet-600" />
              Branch Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your school branches, campuses, and locations
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5 bg-gradient-to-r from-violet-600 to-sky-500 text-white border-0 hover:from-violet-700 hover:to-sky-600">
                <Plus className="h-4 w-4" />
                Add Branch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Branch</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Branch Name</Label>
                  <Input
                    value={newBranch.name}
                    onChange={(e) =>
                      setNewBranch((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g., HSR Layout Branch"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Address</Label>
                  <Input
                    value={newBranch.address}
                    onChange={(e) =>
                      setNewBranch((p) => ({ ...p, address: e.target.value }))
                    }
                    placeholder="Street address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>City</Label>
                    <Input
                      value={newBranch.city}
                      onChange={(e) =>
                        setNewBranch((p) => ({ ...p, city: e.target.value }))
                      }
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input
                      value={newBranch.phone}
                      onChange={(e) =>
                        setNewBranch((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="Phone number"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddBranch}
                    disabled={saving}
                    className="bg-gradient-to-r from-violet-600 to-sky-500 text-white border-0"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                    Add Branch
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <CosmicStatCard
            label="Total Branches"
            value={branches.length}
            icon={<Building2 className="w-5 h-5" />}
            color="bg-violet-500"
          />
          <CosmicStatCard
            label="Active Branches"
            value={activeCount}
            icon={<Building2 className="w-5 h-5" />}
            color="bg-emerald-500"
          />
          <CosmicStatCard
            label="Total Students"
            value={totalStudents}
            icon={<Users className="w-5 h-5" />}
            color="bg-sky-500"
          />
          <CosmicStatCard
            label="Total Teachers"
            value={totalTeachers}
            icon={<GraduationCap className="w-5 h-5" />}
            color="bg-amber-500"
          />
        </div>

        {/* Branch Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {branches.map((branch) => (
            <PreOneCard key={branch.id} variant="default" hover>
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'h-11 w-11 rounded-xl flex items-center justify-center',
                        branch.status === 'active'
                          ? 'bg-violet-50'
                          : 'bg-gray-100'
                      )}
                    >
                      <Building2
                        className={cn(
                          'h-5 w-5',
                          branch.status === 'active'
                            ? 'text-violet-600'
                            : 'text-gray-400'
                        )}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {branch.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge
                          className={cn(
                            'text-[10px]',
                            branch.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                          )}
                        >
                          {branch.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                        {branch.isMain && (
                          <Badge className="bg-violet-50 text-violet-700 border-violet-200 text-[10px]">
                            Main
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => toggleStatus(branch.id)}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-400 hover:text-red-600"
                      onClick={() => handleDeleteBranch(branch.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">
                      {branch.address}, {branch.city}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <PhoneCall className="h-3.5 w-3.5" />
                    <span>{branch.phone}</span>
                  </div>
                </div>

                {/* Counts */}
                <div className="flex items-center gap-3 pt-3 border-t">
                  <div className="flex items-center gap-1.5 flex-1 bg-sky-50 rounded-lg px-3 py-2">
                    <Users className="h-3.5 w-3.5 text-sky-600" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {branch.studentsCount}
                      </p>
                      <p className="text-[10px] text-gray-500">Students</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-1 bg-amber-50 rounded-lg px-3 py-2">
                    <UserCheck className="h-3.5 w-3.5 text-amber-600" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {branch.teachersCount}
                      </p>
                      <p className="text-[10px] text-gray-500">Teachers</p>
                    </div>
                  </div>
                </div>
              </div>
            </PreOneCard>
          ))}

          {/* Add Branch Placeholder Card */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <div className="border-2 border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 hover:border-violet-300 hover:bg-violet-50/20 transition-all cursor-pointer min-h-[200px]">
                <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    Add New Branch
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Expand your school network
                  </p>
                </div>
              </div>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>
    </PageTransition>
  );
}
