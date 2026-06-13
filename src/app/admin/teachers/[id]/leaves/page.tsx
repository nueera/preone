'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Plane,
  Send,
  X,
  Sun,
  Umbrella,
  Stethoscope,
  Baby,
  GraduationCap,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

type LeaveType = 'CASUAL' | 'SICK' | 'MATERNITY' | 'PATERNITY' | 'COMPENSATORY' | 'LOSS_OF_PAY';
type LeaveStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

interface LeaveBalance {
  type: LeaveType;
  total: number;
  used: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface LeaveRecord {
  id: string;
  type: LeaveType;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  appliedOn: string;
}

const LEAVE_BALANCES: LeaveBalance[] = [
  { type: 'CASUAL', total: 12, used: 4, icon: Sun, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  { type: 'SICK', total: 10, used: 2, icon: Stethoscope, color: 'text-red-600', bgColor: 'bg-red-50' },
  { type: 'MATERNITY', total: 180, used: 0, icon: Baby, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  { type: 'COMPENSATORY', total: 5, used: 1, icon: Umbrella, color: 'text-teal-600', bgColor: 'bg-teal-50' },
  { type: 'LOSS_OF_PAY', total: 0, used: 0, icon: GraduationCap, color: 'text-gray-600', bgColor: 'bg-gray-50' },
];

const MOCK_LEAVES: LeaveRecord[] = [
  { id: '1', type: 'CASUAL', from: '2026-06-05', to: '2026-06-05', days: 1, reason: 'Personal work', status: 'APPROVED', approvedBy: 'Principal Sharma', appliedOn: '2026-06-03' },
  { id: '2', type: 'SICK', from: '2026-05-20', to: '2026-05-21', days: 2, reason: 'Fever and cold', status: 'APPROVED', approvedBy: 'Principal Sharma', appliedOn: '2026-05-19' },
  { id: '3', type: 'CASUAL', from: '2026-06-28', to: '2026-06-29', days: 2, reason: 'Family function', status: 'PENDING', appliedOn: '2026-06-10' },
  { id: '4', type: 'COMPENSATORY', from: '2026-04-14', to: '2026-04-14', days: 1, reason: 'Worked on holiday', status: 'APPROVED', approvedBy: 'Principal Sharma', appliedOn: '2026-04-12' },
  { id: '5', type: 'CASUAL', from: '2026-03-10', to: '2026-03-11', days: 2, reason: 'Travel', status: 'REJECTED', approvedBy: 'Principal Sharma', appliedOn: '2026-03-08' },
];

const STATUS_BADGE: Record<string, string> = {
  APPROVED: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  REJECTED: 'bg-red-50 text-red-700',
};

export default function TeacherLeavesPage() {
  const params = useParams();
  const teacherId = params?.id as string;
  const [showForm, setShowForm] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>('CASUAL');

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-6 h-6" style={{ color: theme.primary }} />
                Leave Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">Teacher ID: {teacherId}</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md" onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-2" /> Apply Leave
            </Button>
          </div>
        </StaggerItem>

        {/* Apply Leave Form */}
        {showForm && (
          <StaggerItem>
            <PreOneCard variant="emotional" className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Apply for Leave</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {LEAVE_BALANCES.filter((l) => l.type !== 'LOSS_OF_PAY').map((l) => {
                    const Icon = l.icon;
                    return (
                      <Badge key={l.type} variant={leaveType === l.type ? 'default' : 'outline'} className="cursor-pointer text-xs" onClick={() => setLeaveType(l.type)}>
                        <Icon className="w-3 h-3 mr-1" /> {l.type}
                      </Badge>
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="date" />
                  <Input type="date" />
                </div>
                <Textarea placeholder="Reason for leave..." rows={2} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button size="sm" className="bg-gradient-to-r from-violet-600 to-sky-500 text-white">
                    <Send className="w-3 h-3 mr-1" /> Submit
                  </Button>
                </div>
              </div>
            </PreOneCard>
          </StaggerItem>
        )}

        {/* Leave Balance */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {LEAVE_BALANCES.map((lb) => {
              const Icon = lb.icon;
              const remaining = lb.total - lb.used;
              return (
                <PreOneCard key={lb.type} variant="strip" className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-lg ${lb.bgColor} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${lb.color}`} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 capitalize">{lb.type.replace('_',' ')}</p>
                      <p className="text-sm font-bold" style={{ color: theme.primary }}>{remaining}/{lb.total}</p>
                    </div>
                  </div>
                  {lb.total > 0 && <Progress value={(lb.used / lb.total) * 100} className="h-1" />}
                </PreOneCard>
              );
            })}
          </div>
        </StaggerItem>

        {/* Leave History */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-gray-900 mb-4">Leave History</h3>
              <ScrollArea className="max-h-96">
                <div className="space-y-3">
                  {MOCK_LEAVES.map((l) => {
                    const lb = LEAVE_BALANCES.find((b) => b.type === l.type);
                    const Icon = lb?.icon || CalendarDays;
                    return (
                      <div key={l.id} className="flex items-start gap-3 p-3 rounded-xl border hover:shadow-sm transition-shadow">
                        <div className={`w-10 h-10 rounded-xl ${lb?.bgColor || 'bg-gray-50'} flex items-center justify-center shrink-0`}>
                          <Icon className={`w-5 h-5 ${lb?.color || 'text-gray-500'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium capitalize">{l.type.replace('_',' ')} Leave</p>
                            <Badge className={`${STATUS_BADGE[l.status]} text-[10px]`}>{l.status}</Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(l.from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(l.to).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {l.days} day{l.days > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{l.reason}</p>
                          {l.approvedBy && <p className="text-[10px] text-gray-400 mt-1">By: {l.approvedBy} • Applied: {l.appliedOn}</p>}
                        </div>
                        {l.status === 'PENDING' && (
                          <div className="flex gap-1 shrink-0">
                            <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600 hover:text-emerald-700">Approve</Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 hover:text-red-700">Reject</Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </PreOneCardContent>
          </PreOneCard>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  );
}
