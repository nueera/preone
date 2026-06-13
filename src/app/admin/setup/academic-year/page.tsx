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
  Calendar,
  Plus,
  Edit3,
  Copy,
  CheckCircle2,
  Clock,
  BookOpen,
  GraduationCap,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sun,
  Leaf,
  Snowflake,
  CloudRain,
} from 'lucide-react';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const theme = PORTAL_THEMES.admin;

interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  icon: React.ReactNode;
  color: string;
}

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'completed';
  terms: Term[];
  totalWorkingDays: number;
}

const INITIAL_YEARS: AcademicYear[] = [
  {
    id: '1',
    name: '2025–26',
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    status: 'active',
    totalWorkingDays: 220,
    terms: [
      {
        id: 't1',
        name: 'Term 1 — Spring',
        startDate: '2025-04-01',
        endDate: '2025-06-30',
        workingDays: 60,
        icon: <Sun className="h-3.5 w-3.5" />,
        color: 'bg-amber-50 text-amber-700',
      },
      {
        id: 't2',
        name: 'Term 2 — Monsoon',
        startDate: '2025-07-01',
        endDate: '2025-09-30',
        workingDays: 60,
        icon: <CloudRain className="h-3.5 w-3.5" />,
        color: 'bg-sky-50 text-sky-700',
      },
      {
        id: 't3',
        name: 'Term 3 — Autumn',
        startDate: '2025-10-01',
        endDate: '2025-12-20',
        workingDays: 55,
        icon: <Leaf className="h-3.5 w-3.5" />,
        color: 'bg-orange-50 text-orange-700',
      },
      {
        id: 't4',
        name: 'Term 4 — Winter',
        startDate: '2026-01-05',
        endDate: '2026-03-31',
        workingDays: 45,
        icon: <Snowflake className="h-3.5 w-3.5" />,
        color: 'bg-purple-50 text-purple-700',
      },
    ],
  },
  {
    id: '2',
    name: '2024–25',
    startDate: '2024-04-01',
    endDate: '2025-03-31',
    status: 'completed',
    totalWorkingDays: 218,
    terms: [
      {
        id: 't5',
        name: 'Term 1 — Spring',
        startDate: '2024-04-01',
        endDate: '2024-06-30',
        workingDays: 58,
        icon: <Sun className="h-3.5 w-3.5" />,
        color: 'bg-amber-50 text-amber-700',
      },
      {
        id: 't6',
        name: 'Term 2 — Monsoon',
        startDate: '2024-07-01',
        endDate: '2024-09-30',
        workingDays: 62,
        icon: <CloudRain className="h-3.5 w-3.5" />,
        color: 'bg-sky-50 text-sky-700',
      },
      {
        id: 't7',
        name: 'Term 3 — Autumn',
        startDate: '2024-10-01',
        endDate: '2024-12-20',
        workingDays: 54,
        icon: <Leaf className="h-3.5 w-3.5" />,
        color: 'bg-orange-50 text-orange-700',
      },
      {
        id: 't8',
        name: 'Term 4 — Winter',
        startDate: '2025-01-05',
        endDate: '2025-03-31',
        workingDays: 44,
        icon: <Snowflake className="h-3.5 w-3.5" />,
        color: 'bg-purple-50 text-purple-700',
      },
    ],
  },
  {
    id: '3',
    name: '2026–27',
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    status: 'upcoming',
    totalWorkingDays: 220,
    terms: [
      {
        id: 't9',
        name: 'Term 1 — Spring',
        startDate: '2026-04-01',
        endDate: '2026-06-30',
        workingDays: 60,
        icon: <Sun className="h-3.5 w-3.5" />,
        color: 'bg-amber-50 text-amber-700',
      },
    ],
  },
];

export default function AcademicYearPage() {
  const [years, setYears] = useState<AcademicYear[]>(INITIAL_YEARS);
  const [expandedYear, setExpandedYear] = useState<string>('1');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTerm, setNewTerm] = useState({
    name: '',
    startDate: '',
    endDate: '',
  });

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const handleAddTerm = () => {
    if (!newTerm.name.trim()) {
      toast.error('Term name is required');
      return;
    }
    toast.success(`"${newTerm.name}" added to active academic year`);
    setNewTerm({ name: '', startDate: '', endDate: '' });
    setDialogOpen(false);
  };

  const activeYear = years.find((y) => y.status === 'active');

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-6 w-6 text-violet-600" />
              Academic Year Configuration
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Set up academic years, terms/semesters, and holiday calendars
            </p>
          </div>
          <Button className="gap-1.5 bg-gradient-to-r from-violet-600 to-sky-500 text-white border-0 hover:from-violet-700 hover:to-sky-600">
            <Plus className="h-4 w-4" /> Create Academic Year
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <CosmicStatCard
            label="Active Year"
            value={years.filter((y) => y.status === 'active').length}
            icon={<Calendar className="w-5 h-5" />}
            color="bg-emerald-500"
          />
          <CosmicStatCard
            label="Total Terms"
            value={activeYear?.terms.length ?? 0}
            icon={<BookOpen className="w-5 h-5" />}
            color="bg-violet-500"
          />
          <CosmicStatCard
            label="Working Days"
            value={activeYear?.totalWorkingDays ?? 0}
            icon={<Clock className="w-5 h-5" />}
            color="bg-sky-500"
          />
          <CosmicStatCard
            label="Academic Years"
            value={years.length}
            icon={<GraduationCap className="w-5 h-5" />}
            color="bg-amber-500"
          />
        </div>

        {/* Current Academic Year Highlight */}
        {activeYear && (
          <PreOneCard variant="default">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Current: {activeYear.name}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {formatDate(activeYear.startDate)} —{' '}
                      {formatDate(activeYear.endDate)}
                    </p>
                  </div>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Plus className="h-3.5 w-3.5" /> Add Term
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Term to {activeYear.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <Label>Term Name</Label>
                        <Input
                          value={newTerm.name}
                          onChange={(e) =>
                            setNewTerm((p) => ({ ...p, name: e.target.value }))
                          }
                          placeholder="e.g., Term 3 — Autumn"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            value={newTerm.startDate}
                            onChange={(e) =>
                              setNewTerm((p) => ({
                                ...p,
                                startDate: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            value={newTerm.endDate}
                            onChange={(e) =>
                              setNewTerm((p) => ({
                                ...p,
                                endDate: e.target.value,
                              }))
                            }
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
                          onClick={handleAddTerm}
                          className="bg-gradient-to-r from-violet-600 to-sky-500 text-white border-0"
                        >
                          Add Term
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Terms Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {activeYear.terms.map((term, i) => (
                  <div
                    key={term.id}
                    className={cn(
                      'rounded-xl p-4 border',
                      term.color,
                      'border-current/10'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {term.icon}
                      <span className="text-sm font-semibold">{term.name}</span>
                    </div>
                    <p className="text-xs opacity-80">
                      {formatDate(term.startDate)} — {formatDate(term.endDate)}
                    </p>
                    <div className="mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3 opacity-60" />
                      <span className="text-xs opacity-70">
                        {term.workingDays} working days
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </PreOneCard>
        )}

        {/* All Academic Years Table */}
        <PreOneCard variant="default">
          <div className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4">
              All Academic Years
            </h3>
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Terms</TableHead>
                    <TableHead>Working Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {years.map((y) => (
                    <TableRow key={y.id} className="hover:bg-violet-50/30">
                      <TableCell className="font-medium">{y.name}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(y.startDate)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(y.endDate)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {y.terms.length} Term{y.terms.length !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {y.totalWorkingDays} days
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            'text-[10px]',
                            y.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : y.status === 'upcoming'
                              ? 'bg-sky-50 text-sky-700 border-sky-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          )}
                        >
                          {y.status === 'active' && (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          )}
                          {y.status.charAt(0).toUpperCase() + y.status.slice(1)}
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
