'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PORTAL_THEMES, ATTENDANCE_COLORS } from '@/lib/theme-tokens';
import { Progress } from '@/components/ui/progress';
import {
  WarmPremium,
  WarmCard,
  WarmCardHeader,
  WarmCardTitle,
  WarmCardDescription,
  WarmCardContent,
  WarmCardFooter,
  WarmSectionHeading,
  WarmEmptyState,
  WarmButton,
  WarmStatCard,
  WarmPill,
} from '@/components/warm-premium';
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Loader2,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MON_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface AttRecord { date: string; status: string; }

const STATUS_DOT: Record<string, string> = {
  PRESENT: 'bg-emerald-500', ABSENT: 'bg-red-500', LATE: 'bg-amber-500', EXCUSED: 'bg-blue-500', HALF_DAY: 'bg-yellow-500',
};

export default function StudentAttendancePage() {
  const params = useParams();
  const studentId = params?.id as string;
  const [records, setRecords] = useState<AttRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const currentDate = useMemo(() => new Date(), []);

  useEffect(() => {
    if (!studentId) return;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/students/${studentId}`);
        if (!res.ok) throw new Error('Failed to load attendance');
        const data = await res.json();
        const s = data.student || {};
        setRecords((s.attendance || []).map((a: { date: string; status: string }) => ({ date: a.date, status: a.status })));
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load attendance');
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map day-of-month -> status for the current month
  const dayStatus = useMemo(() => {
    const map: Record<number, string> = {};
    for (const r of records) {
      const d = new Date(r.date);
      if (d.getFullYear() === year && d.getMonth() === month) map[d.getDate()] = r.status;
    }
    return map;
  }, [records, year, month]);

  const monthRecords = useMemo(() => records.filter((r) => {
    const d = new Date(r.date);
    return d.getFullYear() === year && d.getMonth() === month;
  }), [records, year, month]);

  const stats = useMemo(() => {
    const count = (st: string) => monthRecords.filter((r) => r.status === st).length;
    const present = count('PRESENT'); const late = count('LATE'); const total = monthRecords.length;
    return {
      present, absent: count('ABSENT'), late, excused: count('EXCUSED'), halfDay: count('HALF_DAY'),
      percentage: total ? Math.round(((present + late) / total) * 100) : 0,
    };
  }, [monthRecords]);

  const monthlyTrend = useMemo(() => {
    const out: { month: string; rate: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - i, 1);
      const inM = records.filter((r) => { const rd = new Date(r.date); return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth(); });
      const ok = inM.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
      out.push({ month: MON_SHORT[d.getMonth()], rate: inM.length ? Math.round((ok / inM.length) * 100) : 0 });
    }
    return out;
  }, [records, year, month]);

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [firstDay, daysInMonth]);

  if (loading) return <div className="flex items-center justify-center py-24 text-[var(--admin-text-subtle)]"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading attendance…</div>;
  if (error) return <div className="flex items-center justify-center py-24 text-red-500 text-sm">{error}</div>;

  return (
    <WarmPremium className="min-h-screen">
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div>
            <h1 className="text-2xl font-bold font-heading text-[var(--admin-text)] flex items-center gap-2">
              <CalendarDays className="w-6 h-6" style={{ color: theme.primary }} /> Attendance Record
            </h1>
            <p className="text-sm text-[var(--admin-text-muted)] mt-1">Monthly attendance view</p>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Present', value: stats.present, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Absent', value: stats.absent, icon: XCircle, color: 'text-red-600 bg-red-50' },
              { label: 'Late', value: stats.late, icon: Clock, color: 'text-amber-600 bg-amber-50' },
              { label: 'Excused', value: stats.excused, icon: AlertTriangle, color: 'text-blue-600 bg-blue-50' },
              { label: 'Half Day', value: stats.halfDay, icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <WarmCard key={s.label} variant="strip" className="p-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${s.color.split(' ')[1]} flex items-center justify-center`}><Icon className={`w-4 h-4 ${s.color.split(' ')[0]}`} /></div>
                    <div><p className="text-[10px] text-[var(--admin-text-subtle)]">{s.label}</p><p className={`text-sm font-bold ${s.color.split(' ')[0]}`}>{s.value}</p></div>
                  </div>
                </WarmCard>
              );
            })}
          </div>
        </StaggerItem>

        <StaggerItem>
          <WarmCard variant="default" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[var(--admin-text-muted)]">Attendance Rate ({MONTHS[month]})</span>
              <span className="text-lg font-bold" style={{ color: theme.primary }}>{stats.percentage}%</span>
            </div>
            <Progress value={stats.percentage} className="h-2" />
          </WarmCard>
        </StaggerItem>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StaggerItem className="lg:col-span-2">
            <WarmCard variant="default">
              <WarmCardContent>
                <div className="flex items-center justify-center mb-4">
                  <h2 className="text-lg font-semibold text-[var(--admin-text)]">{MONTHS[month]} {year}</h2>
                </div>
                {monthRecords.length === 0 && (
                  <p className="text-xs text-[var(--admin-text-subtle)] text-center mb-3">No attendance marked this month.</p>
                )}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS.map((d) => <div key={d} className="text-center text-xs font-semibold text-[var(--admin-text-subtle)] py-2">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, i) => {
                    if (day === null) return <div key={`empty-${i}`} className="h-14" />;
                    const status = dayStatus[day] || null;
                    const colorCfg = status ? ATTENDANCE_COLORS[status] : null;
                    return (
                      <div key={`day-${day}`} className={`h-14 p-1.5 rounded-lg border text-sm transition-colors ${colorCfg ? `${colorCfg.bg} border-transparent` : 'border-transparent hover:bg-[var(--warm-surface-2)]'}`}>
                        <span className="text-xs font-medium text-[var(--admin-text-muted)]">{day}</span>
                        {status && <div className={`w-2 h-2 rounded-full ${STATUS_DOT[status] || 'bg-[var(--admin-text-subtle)]'} mt-1`} />}
                      </div>
                    );
                  })}
                </div>
              </WarmCardContent>
            </WarmCard>
          </StaggerItem>

          <StaggerItem>
            <WarmCard variant="default">
              <WarmCardContent>
                <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4 text-[var(--admin-text-muted)]" /><h3 className="font-semibold text-[var(--admin-text)]">Monthly Trend</h3></div>
                <div className="space-y-3">
                  {monthlyTrend.map((m, idx) => (
                    <div key={`${m.month}-${idx}`} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--admin-text-muted)]">{m.month}</span>
                        <span className="font-medium" style={{ color: m.rate >= 85 ? '#22c55e' : '#f59e0b' }}>{m.rate}%</span>
                      </div>
                      <Progress value={m.rate} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </WarmCardContent>
            </WarmCard>
          </StaggerItem>
        </div>
      </StaggerContainer>
    </PageTransition>
    </WarmPremium>
  );
}
