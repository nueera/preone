'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, isToday, isTomorrow, isPast, isFuture } from 'date-fns';
import Link from 'next/link';
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Clock,
  UserCircle,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Filter,
  MessageSquare,
  Eye,
  FileText,
  Check,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CRM_COLORS, PORTAL_THEMES } from '@/lib/theme-tokens';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const theme = PORTAL_THEMES.admin;

// ── Types ──
interface LeadInfo {
  id: string;
  parentName: string;
  childName: string;
  phone?: string;
  stage: string;
  nextFollowUp: string | null;
}

interface FollowUpItem {
  id: string;
  leadId: string;
  type: string;
  dateTime: string;
  outcome: string;
  nextFollowUp: string | null;
  notes: string;
  createdBy: string | null;
  completedAt: string | null;
  createdAt: string;
  lead: LeadInfo;
}

const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  NEW: { label: 'New', color: CRM_COLORS.NEW?.hex ?? '#9ca3af' },
  CONTACTED: { label: 'Contacted', color: CRM_COLORS.CONTACTED?.hex ?? '#3b82f6' },
  VISITED: { label: 'Visited', color: CRM_COLORS.TOUR_SCHEDULED?.hex ?? '#8b5cf6' },
  APPLIED: { label: 'Applied', color: CRM_COLORS.APPLICATION?.hex ?? '#f59e0b' },
  ENROLLED: { label: 'Enrolled', color: CRM_COLORS.ENROLLED?.hex ?? '#10b981' },
  LOST: { label: 'Lost', color: CRM_COLORS.LOST?.hex ?? '#ef4444' },
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

// ── Follow-up Type Icon ──
function FollowUpTypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'Call': return <Phone className="h-4 w-4 text-blue-500" />;
    case 'WhatsApp': return <MessageSquare className="h-4 w-4 text-green-500" />;
    case 'Email': return <Mail className="h-4 w-4 text-orange-500" />;
    case 'Visit': return <Eye className="h-4 w-4 text-purple-500" />;
    default: return <FileText className="h-4 w-4 text-gray-500" />;
  }
}

/**
 * CRM Follow-ups page — Shows all follow-ups across all leads with completion support.
 */
export default function CrmFollowupsPage() {
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'completed'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [completing, setCompleting] = useState<string | null>(null);

  const fetchFollowUps = useCallback(async () => {
    try {
      const token = getToken();
      const params = new URLSearchParams();
      if (filter === 'pending') params.set('status', 'pending');
      else if (filter === 'completed') params.set('status', 'completed');
      else if (filter === 'overdue') params.set('status', 'overdue');
      if (typeFilter) params.set('type', typeFilter);

      const res = await fetch(`/api/crm/followups?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFollowUps(data.followUps || []);
      }
    } catch (err) {
      console.error('Failed to fetch follow-ups:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, typeFilter]);

  useEffect(() => {
    setLoading(true);
    fetchFollowUps();
  }, [fetchFollowUps]);

  // Also fetch leads with nextFollowUp for the upcoming sidebar
  const [upcomingLeads, setUpcomingLeads] = useState<Array<{
    id: string;
    parentName: string;
    childName: string;
    stage: string;
    nextFollowUp: string | null;
  }>>([]);

  const fetchUpcomingLeads = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/crm/leads?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const withFollowUp = (data.leads || [])
          .filter((l: { nextFollowUp: string | null; stage: string }) => l.nextFollowUp && l.stage !== 'ENROLLED' && l.stage !== 'LOST')
          .map((l: { id: string; parentName: string; childName: string; stage: string; nextFollowUp: string | null }) => ({
            id: l.id,
            parentName: l.parentName,
            childName: l.childName,
            stage: l.stage,
            nextFollowUp: l.nextFollowUp,
          }))
          .sort((a: { nextFollowUp: string | null }, b: { nextFollowUp: string | null }) =>
            new Date(a.nextFollowUp!).getTime() - new Date(b.nextFollowUp!).getTime()
          );
        setUpcomingLeads(withFollowUp);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    }
  }, []);

  useEffect(() => {
    fetchUpcomingLeads();
  }, [fetchUpcomingLeads]);

  // Mark follow-up as completed
  const handleComplete = async (followUpId: string, outcome?: string) => {
    setCompleting(followUpId);
    try {
      const token = getToken();
      const res = await fetch(`/api/crm/followups/${followUpId}/complete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ outcome: outcome || 'Completed' }),
      });
      if (res.ok) {
        toast.success('Follow-up marked as completed');
        fetchFollowUps();
        fetchUpcomingLeads();
      } else {
        toast.error('Failed to complete follow-up');
      }
    } catch {
      toast.error('Failed to complete follow-up');
    } finally {
      setCompleting(null);
    }
  };

  // Stats
  const pendingCount = followUps.filter((f) => !f.completedAt && new Date(f.dateTime) >= new Date()).length;
  const overdueCount = followUps.filter((f) => !f.completedAt && isPast(new Date(f.dateTime)) && !isToday(new Date(f.dateTime))).length;
  const completedCount = followUps.filter((f) => f.completedAt).length;
  const todayCount = upcomingLeads.filter((l) => l.nextFollowUp && isToday(new Date(l.nextFollowUp))).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/crm">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to CRM
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Phone className="h-6 w-6 text-portal-600" />
              Follow-ups
            </h1>
            <p className="text-sm text-gray-500 mt-1">Track upcoming follow-ups and never miss a callback</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setLoading(true); fetchFollowUps(); fetchUpcomingLeads(); }}
          className="gap-1"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{todayCount}</p>
              <p className="text-xs text-gray-500">Due Today</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{pendingCount}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              <p className="text-xs text-gray-500">Overdue</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {(['all', 'pending', 'overdue', 'completed'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className={cn('capitalize', filter === f && 'bg-brand-gradient text-white border-0')}
          >
            {f === 'all' ? 'All' : f === 'pending' ? 'Pending' : f === 'overdue' ? 'Overdue' : 'Completed'}
          </Button>
        ))}

        <div className="ml-auto">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v === 'ALL' ? '' : v)}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="Call">Call</SelectItem>
              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
              <SelectItem value="Email">Email</SelectItem>
              <SelectItem value="Visit">Visit</SelectItem>
              <SelectItem value="Note">Note</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Two Column Layout: Follow-ups + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: Follow-up List */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">
            {filter === 'all' ? 'All Follow-ups' : filter === 'pending' ? 'Pending Follow-ups' : filter === 'overdue' ? 'Overdue Follow-ups' : 'Completed Follow-ups'}
          </h3>

          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              Loading...
            </div>
          ) : followUps.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No follow-ups found</p>
              <p className="text-sm text-gray-400 mt-1">
                {filter === 'completed' ? 'No completed follow-ups yet' : 'Add follow-up dates to leads to see them here'}
              </p>
            </Card>
          ) : (
            followUps.map((fu) => {
              const fuDate = new Date(fu.dateTime);
              const isOverdue = !fu.completedAt && isPast(fuDate) && !isToday(fuDate);
              const isTodayFU = !fu.completedAt && isToday(fuDate);
              const isCompleted = !!fu.completedAt;
              const stageCfg = STAGE_CONFIG[fu.lead?.stage] || STAGE_CONFIG.NEW;

              return (
                <Card
                  key={fu.id}
                  className={cn(
                    'p-4 hover:shadow-md transition-all duration-200 border-l-4',
                    isCompleted && 'border-l-green-500 bg-green-50/20 opacity-70',
                    isOverdue && 'border-l-red-500 bg-red-50/30',
                    isTodayFU && 'border-l-amber-500 bg-amber-50/30',
                    !isOverdue && !isTodayFU && !isCompleted && 'border-l-blue-500',
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
                        isCompleted ? 'bg-green-50' : 'bg-portal-50',
                      )}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <FollowUpTypeIcon type={fu.type} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={cn('font-medium', isCompleted && 'line-through text-gray-400')}>
                            {fu.lead?.parentName || 'Unknown'}
                          </p>
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                            style={{ backgroundColor: stageCfg.color + '15', color: stageCfg.color }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stageCfg.color }} />
                            {stageCfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Child: {fu.lead?.childName || 'N/A'} &middot; {fu.type}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          &quot;{fu.notes}&quot;
                        </p>
                        {fu.outcome && isCompleted && (
                          <p className="text-xs text-green-600 mt-1 font-medium">
                            Outcome: {fu.outcome}
                          </p>
                        )}
                        {fu.createdBy && (
                          <p className="text-[11px] text-gray-400 mt-1">— {fu.createdBy}</p>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-4">
                      <div className={cn(
                        'text-sm font-medium',
                        isOverdue && 'text-red-600',
                        isTodayFU && 'text-amber-600',
                        isCompleted && 'text-green-600',
                        !isOverdue && !isTodayFU && !isCompleted && isFuture(fuDate) && 'text-gray-600',
                      )}>
                        {isTodayFU ? 'Today' : isTomorrow(fuDate) ? 'Tomorrow' : format(fuDate, 'dd MMM yyyy')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {format(fuDate, 'hh:mm a')}
                      </div>

                      <div className="flex items-center gap-1 mt-2 justify-end">
                        {isOverdue && (
                          <Badge variant="destructive" className="text-[10px] h-5">
                            <AlertCircle className="h-3 w-3 mr-0.5" />
                            Overdue
                          </Badge>
                        )}
                        {isTodayFU && (
                          <Badge className="text-[10px] h-5 bg-amber-100 text-amber-700 border-amber-200">
                            <Clock className="h-3 w-3 mr-0.5" />
                            Due Today
                          </Badge>
                        )}
                      </div>

                      {!isCompleted && (
                        <Button
                          size="sm"
                          className={cn(
                            'mt-2 h-7 text-xs gap-1',
                            isOverdue ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover',
                          )}
                          disabled={completing === fu.id}
                          onClick={() => handleComplete(fu.id)}
                        >
                          {completing === fu.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Sidebar: Upcoming Follow-ups */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Upcoming Follow-ups</h3>
          {upcomingLeads.length === 0 ? (
            <Card className="p-6 text-center">
              <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No upcoming follow-ups</p>
            </Card>
          ) : (
            upcomingLeads.slice(0, 15).map((lead) => {
              const followUpDate = new Date(lead.nextFollowUp!);
              const stageCfg = STAGE_CONFIG[lead.stage] || STAGE_CONFIG.NEW;
              const isOverdue = isPast(followUpDate) && !isToday(followUpDate);

              return (
                <Card
                  key={lead.id}
                  className={cn(
                    'p-3 hover:shadow-sm transition-all border-l-3',
                    isOverdue && 'border-l-red-500',
                    isToday(followUpDate) && 'border-l-amber-500',
                    !isOverdue && !isToday(followUpDate) && 'border-l-blue-300',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{lead.parentName}</p>
                      <p className="text-xs text-gray-500 truncate">{lead.childName}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className={cn(
                        'text-xs font-medium',
                        isOverdue ? 'text-red-600' : isToday(followUpDate) ? 'text-amber-600' : 'text-gray-600',
                      )}>
                        {isToday(followUpDate) ? 'Today' : isTomorrow(followUpDate) ? 'Tomorrow' : format(followUpDate, 'dd MMM')}
                      </p>
                      <p className="text-[10px] text-gray-400">{format(followUpDate, 'hh:mm a')}</p>
                    </div>
                  </div>
                  <div className="mt-1">
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium"
                      style={{ backgroundColor: stageCfg.color + '15', color: stageCfg.color }}
                    >
                      <span className="h-1 w-1 rounded-full" style={{ backgroundColor: stageCfg.color }} />
                      {stageCfg.label}
                    </span>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
