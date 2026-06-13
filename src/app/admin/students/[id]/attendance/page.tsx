'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PORTAL_THEMES, ATTENDANCE_COLORS } from '@/lib/theme-tokens';
import { Progress } from '@/components/ui/progress';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  BarChart3,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'HALF_DAY';

interface DayAttendance {
  day: number;
  status: AttendanceStatus;
}

const MOCK_ATTENDANCE: Record<string, AttendanceStatus> = {
  '1': 'PRESENT', '2': 'PRESENT', '3': 'PRESENT', '4': 'ABSENT', '5': 'PRESENT',
  '6': 'PRESENT', '7': 'LATE', '8': 'PRESENT', '9': 'PRESENT', '10': 'PRESENT',
  '11': 'PRESENT', '12': 'EXCUSED', '13': 'PRESENT', '14': 'PRESENT', '15': 'HALF_DAY',
  '16': 'PRESENT', '17': 'PRESENT', '18': 'ABSENT', '19': 'PRESENT', '20': 'PRESENT',
  '21': 'PRESENT', '22': 'LATE', '23': 'PRESENT', '24': 'PRESENT', '25': 'PRESENT',
  '26': 'PRESENT', '27': 'PRESENT', '28': 'PRESENT', '29': 'ABSENT', '30': 'PRESENT',
};

const ATTENDANCE_STATS = {
  totalDays: 30,
  present: 25,
  absent: 3,
  late: 2,
  excused: 1,
  halfDay: 1,
  percentage: 83,
};

const MONTHLY_TREND = [
  { month: 'Jan', rate: 92 }, { month: 'Feb', rate: 88 },
  { month: 'Mar', rate: 85 }, { month: 'Apr', rate: 90 },
  { month: 'May', rate: 87 }, { month: 'Jun', rate: 83 },
];

const STATUS_DOT: Record<string, string> = {
  PRESENT: 'bg-emerald-500',
  ABSENT: 'bg-red-500',
  LATE: 'bg-amber-500',
  EXCUSED: 'bg-blue-500',
  HALF_DAY: 'bg-yellow-500',
};

export default function StudentAttendancePage() {
  const params = useParams();
  const studentId = params?.id as string;
  const [currentDate] = useState(new Date(2026, 5, 1));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [firstDay, daysInMonth]);

  const getStatus = (day: number): AttendanceStatus | null => {
    return (MOCK_ATTENDANCE[String(day)] as AttendanceStatus) || null;
  };

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        {/* Header */}
        <StaggerItem>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarDays className="w-6 h-6" style={{ color: theme.primary }} />
              Attendance Record
            </h1>
            <p className="text-sm text-gray-500 mt-1">Student ID: {studentId} — Monthly attendance view</p>
          </div>
        </StaggerItem>

        {/* Stats Row */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Present', value: ATTENDANCE_STATS.present, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Absent', value: ATTENDANCE_STATS.absent, icon: XCircle, color: 'text-red-600 bg-red-50' },
              { label: 'Late', value: ATTENDANCE_STATS.late, icon: Clock, color: 'text-amber-600 bg-amber-50' },
              { label: 'Excused', value: ATTENDANCE_STATS.excused, icon: AlertTriangle, color: 'text-blue-600 bg-blue-50' },
              { label: 'Half Day', value: ATTENDANCE_STATS.halfDay, icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <PreOneCard key={s.label} variant="strip" className="p-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${s.color.split(' ')[1]} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${s.color.split(' ')[0]}`} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">{s.label}</p>
                      <p className={`text-sm font-bold ${s.color.split(' ')[0]}`}>{s.value}</p>
                    </div>
                  </div>
                </PreOneCard>
              );
            })}
          </div>
        </StaggerItem>

        {/* Attendance Rate */}
        <StaggerItem>
          <PreOneCard variant="default" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Attendance Rate</span>
              <span className="text-lg font-bold" style={{ color: theme.primary }}>{ATTENDANCE_STATS.percentage}%</span>
            </div>
            <Progress value={ATTENDANCE_STATS.percentage} className="h-2" />
          </PreOneCard>
        </StaggerItem>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <StaggerItem className="lg:col-span-2">
            <PreOneCard variant="default">
              <PreOneCardContent>
                <div className="flex items-center justify-between mb-4">
                  <Button variant="outline" size="icon"><ChevronLeft className="w-4 h-4" /></Button>
                  <h2 className="text-lg font-semibold text-gray-900">{MONTHS[month]} {year}</h2>
                  <Button variant="outline" size="icon"><ChevronRight className="w-4 h-4" /></Button>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mb-4">
                  {Object.entries(ATTENDANCE_COLORS).map(([key, cfg]) => (
                    <div key={key} className="flex items-center gap-1.5 text-xs">
                      <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                      <span className="text-gray-500 capitalize">{key.replace('_', ' ').toLowerCase()}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS.map((d) => (
                    <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, i) => {
                    if (day === null) return <div key={`empty-${i}`} className="h-14" />;
                    const status = getStatus(day);
                    const colorCfg = status ? ATTENDANCE_COLORS[status] : null;
                    return (
                      <div
                        key={`day-${day}`}
                        className={`h-14 p-1.5 rounded-lg border text-sm transition-colors ${
                          colorCfg ? `${colorCfg.bg} border-transparent` : 'border-transparent hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-xs font-medium text-gray-700">{day}</span>
                        {status && (
                          <div className={`w-2 h-2 rounded-full ${STATUS_DOT[status]} mt-1`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>

          {/* Trend */}
          <StaggerItem>
            <PreOneCard variant="default">
              <PreOneCardContent>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <h3 className="font-semibold text-gray-900">Monthly Trend</h3>
                </div>
                <div className="space-y-3">
                  {MONTHLY_TREND.map((m) => (
                    <div key={m.month} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">{m.month}</span>
                        <span className="font-medium" style={{ color: m.rate >= 85 ? '#22c55e' : '#f59e0b' }}>{m.rate}%</span>
                      </div>
                      <Progress value={m.rate} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>
        </div>
      </StaggerContainer>
    </PageTransition>
  );
}
