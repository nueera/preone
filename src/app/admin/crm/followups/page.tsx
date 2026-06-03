'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CRM_COLORS, PORTAL_THEMES } from '@/lib/theme-tokens';
import { cn } from '@/lib/utils';

const theme = PORTAL_THEMES.admin;

// ── Types ──
interface FollowUpItem {
  id: string;
  leadId: string;
  leadParentName: string;
  leadChildName: string;
  leadStage: string;
  type: string;
  dateTime: string;
  outcome: string;
  nextFollowUp: string | null;
  notes: string;
  createdBy: string | null;
  createdAt: string;
}

const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  NEW: { label: 'New', color: CRM_COLORS.NEW?.hex ?? '#9ca3af' },
  CONTACTED: { label: 'Contacted', color: CRM_COLORS.CONTACTED?.hex ?? '#3b82f6' },
  VISITED: { label: 'Visited', color: CRM_COLORS.TOUR_SCHEDULED?.hex ?? '#8b5cf6' },
  APPLIED: { label: 'Applied', color: CRM_COLORS.APPLICATION?.hex ?? '#f59e0b' },
  ENROLLED: { label: 'Enrolled', color: CRM_COLORS.ENROLLED?.hex ?? '#10b981' },
  LOST: { label: 'Lost', color: CRM_COLORS.LOST?.hex ?? '#9ca3af' },
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('preone_token');
}

/**
 * CRM Follow-ups page — Shows all upcoming and past follow-ups across all leads.
 */
export default function CrmFollowupsPage() {
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'overdue' | 'today'>('all');

  const fetchFollowUps = useCallback(async () => {
    try {
      const token = getToken();
      // Fetch all leads with their follow-ups
      const res = await fetch('/api/crm/pipeline', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Flatten follow-ups from all leads
        const allFollowUps: FollowUpItem[] = [];
        for (const stage of data.pipeline) {
          for (const lead of stage.leads) {
            for (const fu of lead.followUps || []) {
              allFollowUps.push({
                id: fu.id,
                leadId: lead.id,
                leadParentName: lead.parentName,
                leadChildName: lead.childName,
                leadStage: lead.stage,
                type: fu.type,
                dateTime: fu.dateTime,
                outcome: fu.outcome,
                nextFollowUp: fu.nextFollowUp,
                notes: fu.notes,
                createdBy: fu.createdBy,
                createdAt: fu.createdAt,
              });
            }
          }
        }
        // Sort by date descending
        allFollowUps.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
        setFollowUps(allFollowUps);
      }
    } catch (err) {
      console.error('Failed to fetch follow-ups:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  // Also fetch leads with next follow-up dates
  const [leadsWithFollowUp, setLeadsWithFollowUp] = useState<Array<{
    id: string;
    parentName: string;
    childName: string;
    stage: string;
    nextFollowUp: string | null;
  }>>([]);

  const fetchLeadsWithFollowUp = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/crm/leads?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const withFollowUp = (data.leads || [])
          .filter((l: { nextFollowUp: string | null }) => l.nextFollowUp)
          .map((l: { id: string; parentName: string; childName: string; stage: string; nextFollowUp: string | null }) => ({
            id: l.id,
            parentName: l.parentName,
            childName: l.childName,
            stage: l.stage,
            nextFollowUp: l.nextFollowUp,
          }));
        setLeadsWithFollowUp(withFollowUp);
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    }
  }, []);

  useEffect(() => {
    fetchLeadsWithFollowUp();
  }, [fetchLeadsWithFollowUp]);

  // Filter upcoming follow-ups
  const upcomingFollowUps = leadsWithFollowUp.filter((l) => {
    const d = new Date(l.nextFollowUp!);
    if (filter === 'today') return isToday(d);
    if (filter === 'upcoming') return d >= new Date();
    if (filter === 'overdue') return isPast(d) && !isToday(d);
    return true;
  }).sort((a, b) => new Date(a.nextFollowUp!).getTime() - new Date(b.nextFollowUp!).getTime());

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
        <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchFollowUps(); fetchLeadsWithFollowUp(); }} className="gap-1">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {(['all', 'today', 'upcoming', 'overdue'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className={cn('capitalize', filter === f && 'bg-brand-gradient text-white border-0')}
          >
            {f === 'all' ? 'All' : f === 'today' ? 'Today' : f === 'upcoming' ? 'Upcoming' : 'Overdue'}
          </Button>
        ))}
      </div>

      {/* Upcoming Follow-ups List */}
      <div className="space-y-3">
        {upcomingFollowUps.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No follow-ups scheduled</p>
            <p className="text-sm text-gray-400 mt-1">Add follow-up dates to leads to see them here</p>
          </Card>
        ) : (
          upcomingFollowUps.map((lead) => {
            const followUpDate = new Date(lead.nextFollowUp!);
            const stageCfg = STAGE_CONFIG[lead.stage] || STAGE_CONFIG.NEW;
            const isOverdue = isPast(followUpDate) && !isToday(followUpDate);
            const isTodayFollowUp = isToday(followUpDate);
            const isTomorrowFollowUp = isTomorrow(followUpDate);

            return (
              <Card key={lead.id} className={cn(
                'p-4 hover:shadow-md transition-all duration-200 border-l-4',
                isOverdue && 'border-l-red-500 bg-red-50/30',
                isTodayFollowUp && 'border-l-amber-500 bg-amber-50/30',
                !isOverdue && !isTodayFollowUp && 'border-l-transparent'
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-portal-50 flex items-center justify-center">
                      <UserCircle className="h-5 w-5 text-portal-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{lead.parentName}</p>
                      <p className="text-xs text-gray-500">Child: {lead.childName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      'text-sm font-medium',
                      isOverdue && 'text-red-600',
                      isTodayFollowUp && 'text-amber-600',
                      isTomorrowFollowUp && 'text-blue-600',
                      !isOverdue && !isTodayFollowUp && !isTomorrowFollowUp && 'text-gray-600'
                    )}>
                      {isTodayFollowUp ? 'Today' : isTomorrowFollowUp ? 'Tomorrow' : format(followUpDate, 'dd MMM yyyy')}
                    </div>
                    <div className="text-xs text-gray-400">
                      {format(followUpDate, 'hh:mm a')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{ backgroundColor: stageCfg.color + '15', color: stageCfg.color }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stageCfg.color }} />
                    {stageCfg.label}
                  </span>
                  {isOverdue && (
                    <Badge variant="destructive" className="text-[10px] h-5">
                      <AlertCircle className="h-3 w-3 mr-0.5" />
                      Overdue
                    </Badge>
                  )}
                  {isTodayFollowUp && (
                    <Badge className="text-[10px] h-5 bg-amber-100 text-amber-700 border-amber-200">
                      <Clock className="h-3 w-3 mr-0.5" />
                      Due Today
                    </Badge>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
