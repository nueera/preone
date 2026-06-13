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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  IndianRupee,
  Plus,
  Edit3,
  Copy,
  Trash2,
  CheckCircle2,
  Clock,
  CreditCard,
  Bus,
  UtensilsCrossed,
  PartyPopper,
  BookOpen,
  Stethoscope,
  Loader2,
  Receipt,
} from 'lucide-react';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const theme = PORTAL_THEMES.admin;

interface FeeType {
  id: string;
  name: string;
  icon: React.ReactNode;
  amount: number;
  frequency: 'annual' | 'quarterly' | 'monthly' | 'one-time';
  applicableClasses: string[];
  status: 'active' | 'draft';
  description: string;
}

const INITIAL_FEES: FeeType[] = [
  {
    id: '1',
    name: 'Tuition Fee',
    icon: <BookOpen className="h-4 w-4" />,
    amount: 60000,
    frequency: 'annual',
    applicableClasses: ['Playgroup', 'Nursery', 'LKG', 'UKG'],
    status: 'active',
    description: 'Core academic instruction and learning materials',
  },
  {
    id: '2',
    name: 'Transport Fee',
    icon: <Bus className="h-4 w-4" />,
    amount: 24000,
    frequency: 'annual',
    applicableClasses: ['All'],
    status: 'active',
    description: 'School bus pickup and drop-off service',
  },
  {
    id: '3',
    name: 'Meal Plan',
    icon: <UtensilsCrossed className="h-4 w-4" />,
    amount: 18000,
    frequency: 'annual',
    applicableClasses: ['All'],
    status: 'active',
    description: 'Nutritious lunch and snack plan',
  },
  {
    id: '4',
    name: 'Activity Fee',
    icon: <PartyPopper className="h-4 w-4" />,
    amount: 8000,
    frequency: 'annual',
    applicableClasses: ['Nursery', 'LKG', 'UKG'],
    status: 'active',
    description: 'Extra-curricular activities, events, and field trips',
  },
  {
    id: '5',
    name: 'Admission Fee',
    icon: <Receipt className="h-4 w-4" />,
    amount: 15000,
    frequency: 'one-time',
    applicableClasses: ['All'],
    status: 'active',
    description: 'One-time admission processing fee',
  },
  {
    id: '6',
    name: 'Health & Wellness',
    icon: <Stethoscope className="h-4 w-4" />,
    amount: 5000,
    frequency: 'annual',
    applicableClasses: ['All'],
    status: 'draft',
    description: 'Annual health checkup and wellness program',
  },
  {
    id: '7',
    name: 'Development Fee',
    icon: <CreditCard className="h-4 w-4" />,
    amount: 10000,
    frequency: 'annual',
    applicableClasses: ['LKG', 'UKG'],
    status: 'active',
    description: 'Infrastructure and facility development',
  },
];

const frequencyLabels: Record<string, string> = {
  annual: 'Annual',
  quarterly: 'Quarterly',
  monthly: 'Monthly',
  'one-time': 'One-time',
};

export default function FeeStructureSetupPage() {
  const [fees, setFees] = useState<FeeType[]>(INITIAL_FEES);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newFee, setNewFee] = useState({
    name: '',
    amount: '',
    frequency: 'annual' as FeeType['frequency'],
    description: '',
  });

  const totalAnnual = fees
    .filter((f) => f.status === 'active')
    .reduce((sum, f) => sum + f.amount, 0);
  const activeFees = fees.filter((f) => f.status === 'active').length;

  const handleAddFee = async () => {
    if (!newFee.name.trim() || !newFee.amount) {
      toast.error('Name and amount are required');
      return;
    }
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    const fee: FeeType = {
      id: String(fees.length + 1),
      name: newFee.name,
      icon: <CreditCard className="h-4 w-4" />,
      amount: parseInt(newFee.amount),
      frequency: newFee.frequency,
      applicableClasses: ['All'],
      status: 'draft',
      description: newFee.description,
    };
    setFees((prev) => [...prev, fee]);
    setNewFee({ name: '', amount: '', frequency: 'annual', description: '' });
    setSaving(false);
    setDialogOpen(false);
    toast.success(`"${fee.name}" fee type added`);
  };

  const handleDelete = (id: string) => {
    setFees((prev) => prev.filter((f) => f.id !== id));
    toast.success('Fee type removed');
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <IndianRupee className="h-6 w-6 text-violet-600" />
              Fee Structure Setup
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Define fee types, amounts, frequency, and applicable classes
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5 bg-gradient-to-r from-violet-600 to-sky-500 text-white border-0 hover:from-violet-700 hover:to-sky-600">
                <Plus className="h-4 w-4" /> Add Fee Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Fee Type</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Fee Name</Label>
                  <Input
                    value={newFee.name}
                    onChange={(e) =>
                      setNewFee((p) => ({ ...p, name: e.target.value }))
                    }
                    placeholder="e.g., Technology Fee"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Amount (₹)</Label>
                    <Input
                      type="number"
                      value={newFee.amount}
                      onChange={(e) =>
                        setNewFee((p) => ({ ...p, amount: e.target.value }))
                      }
                      placeholder="5000"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Frequency</Label>
                    <Select
                      value={newFee.frequency}
                      onValueChange={(val) =>
                        setNewFee((p) => ({
                          ...p,
                          frequency: val as FeeType['frequency'],
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annual">Annual</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="one-time">One-time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Input
                    value={newFee.description}
                    onChange={(e) =>
                      setNewFee((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="Brief description"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddFee}
                    disabled={saving}
                    className="bg-gradient-to-r from-violet-600 to-sky-500 text-white border-0"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                    Add Fee Type
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <CosmicStatCard
            label="Fee Types"
            value={fees.length}
            icon={<IndianRupee className="w-5 h-5" />}
            color="bg-violet-500"
          />
          <CosmicStatCard
            label="Total Annual"
            value={totalAnnual}
            suffix="₹"
            icon={<IndianRupee className="w-5 h-5" />}
            color="bg-emerald-500"
          />
          <CosmicStatCard
            label="Active Fees"
            value={activeFees}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="bg-sky-500"
          />
          <CosmicStatCard
            label="Draft Fees"
            value={fees.filter((f) => f.status === 'draft').length}
            icon={<Clock className="w-5 h-5" />}
            color="bg-amber-500"
          />
        </div>

        {/* Fee Breakdown Summary */}
        <PreOneCard variant="default">
          <div className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">
              Fee Breakdown Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {fees
                .filter((f) => f.status === 'active')
                .map((fee) => (
                  <div
                    key={fee.id}
                    className="rounded-xl border bg-white p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-8 w-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600">
                        {fee.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {fee.name}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      ₹{fee.amount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {frequencyLabels[fee.frequency]}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </PreOneCard>

        {/* Detailed Fee Table */}
        <PreOneCard variant="default">
          <div className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">
              All Fee Types
            </h3>
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Applicable Classes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fees.map((fee) => (
                    <TableRow key={fee.id} className="hover:bg-violet-50/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600">
                            {fee.icon}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{fee.name}</p>
                            <p className="text-xs text-gray-400">
                              {fee.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        ₹{fee.amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {frequencyLabels[fee.frequency]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {fee.applicableClasses.map((cls) => (
                            <Badge
                              key={cls}
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0"
                            >
                              {cls}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            'text-[10px]',
                            fee.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          )}
                        >
                          {fee.status === 'active' ? 'Active' : 'Draft'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-400 hover:text-red-600"
                            onClick={() => handleDelete(fee.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </PreOneCard>
      </div>
    </PageTransition>
  );
}
