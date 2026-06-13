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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  LogIn,
  LogOut,
  TrendingUp,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY';

interface CheckInOut {
  date: string;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
  hours: number;
}

const MOCK_CHECKINS: CheckInOut[] = [
  { date: '2026-06-12', checkIn: '8:25 AM', checkOut: '3:35 PM', status: 'PRESENT', hours: 7.2 },
  { date: '2026-06-11', checkIn: '8:30 AM', checkOut: '3:30 PM', status: 'PRESENT', hours: 7.0 },
  { date: '2026-06-10', checkIn: '9:05 AM', checkOut: '3:30 PM', status: 'LATE', hours: 6.4 },
  { date: '2026-06-09', checkIn: '8:28 AM', checkOut: '1:00 PM', status: 'HALF_DAY', hours: 4.5 },
  { date: '2026-06-08', checkIn: '—', checkOut: '—', status: 'ABSENT', hours: 0 },
  { date: '2026-06-05', checkIn: '8:20 AM', checkOut: '3:40 PM', status: 'PRESENT', hours: 7.3 },
  { date: '2026-06-04', checkIn: '8:30 AM', checkOut: '3:30 PM', status: 'PRESENT', hours: 7.0 },
  { date: '2026-06-03', checkIn: '8:32 AM', checkOut: '3:30 PM', status: 'PRESENT', hours: 7.0 },
  { date: '2026-06-02', checkIn: '8:28 AM', checkOut: '3:28 PM', status: 'PRESENT', hours: 7.0 },
  { date: '2026-06-01', checkIn: '8:25 AM', checkOut: '3:35 PM', status: 'PRESENT', hours: 7.2 },
];

const MOCK_CALENDAR: Record<string, AttendanceStatus> = {
  '1': 'PRESENT', '2': 'PRESENT', '3': 'PRESENT', '4': 'PRESENT', '5': 'PRESENT',
  '6': 'PRESENT', '8': 'ABSENT', '9': 'HALF_DAY', '10': 'LATE', '11': 'PRESENT',
  '12': 'PRESENT', '15': 'PRESENT', '16': 'PRESENT', '17': 'PRESENT', '18': 'PRESENT',
  '19': 'PRESENT', '22': 'PRESENT', '23': 'PRESENT', '24': 'PRESENT', '25': 'PRESENT',
  '26': 'PRESENT', '29': 'PRESENT', '30': 'PRESENT',
};

const STATUS_DOT: Record<string, string> = {
  PRESENT: 'bg-emerald-500', ABSENT: 'bg-red-500', LATE: 'bg-amber-500', HALF_DAY: 'bg-yellow-500',
};

const STATS = { total: 22, present: 18, absent: 1, late: 1, halfDay: 1, rate: 82 };

export default function TeacherAttendancePage() {
  const params = useParams();
  const teacherId = params?.id as string;
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

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6" style={{ color: theme.primary }} />
            Teacher Attendance
          </h1>
          <p className="text-sm text-gray-500 mt-1">Teacher ID: {teacherId}</p>
        </StaggerItem>

        {/* Stats */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-xs text-gray-500">Present</span></div>
              <p className="text-lg font-bold text-emerald-700 mt-1">{STATS.present}/{STATS.total}</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-600" /><span className="text-xs text-gray-500">Absent</span></div>
              <p className="text-lg font-bold text-red-700 mt-1">{STATS.absent}</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" /><span className="text-xs text-gray-500">Late</span></div>
              <p className="text-lg font-bold text-amber-700 mt-1">{STATS.late}</p>
            </PreOneCard>
            <PreOneCard variant="strip" className="p-4">
              <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-purple-600" /><span className="text-xs text-gray-500">Rate</span></div>
              <p className="text-lg font-bold text-purple-700 mt-1">{STATS.rate}%</p>
            </PreOneCard>
          </div>
        </StaggerItem>

        {/* Progress */}
        <StaggerItem>
          <PreOneCard variant="default" className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Attendance Rate</span>
              <span className="text-lg font-bold" style={{ color: theme.primary }}>{STATS.rate}%</span>
            </div>
            <Progress value={STATS.rate} className="h-2" />
          </PreOneCard>
        </StaggerItem>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <StaggerItem>
            <PreOneCard variant="default">
              <PreOneCardContent>
                <div className="flex items-center justify-between mb-4">
                  <Button variant="outline" size="icon"><ChevronLeft className="w-4 h-4" /></Button>
                  <h2 className="text-lg font-semibold">{MONTHS[month]} {year}</h2>
                  <Button variant="outline" size="icon"><ChevronRight className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(ATTENDANCE_COLORS).filter(([k]) => ['PRESENT','ABSENT','LATE','HALF_DAY'].includes(k)).map(([key, cfg]) => (
                    <div key={key} className="flex items-center gap-1 text-xs">
                      <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                      <span className="text-gray-500 capitalize">{key.replace('_',' ').toLowerCase()}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS.map((d) => <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, i) => {
                    if (day === null) return <div key={`e-${i}`} className="h-12" />;
                    const status = MOCK_CALENDAR[String(day)];
                    const colorCfg = status ? ATTENDANCE_COLORS[status] : null;
                    return (
                      <div key={`d-${day}`} className={`h-12 p-1 rounded-lg border ${colorCfg ? `${colorCfg.bg} border-transparent` : 'border-transparent'}`}>
                        <span className="text-xs font-medium text-gray-700">{day}</span>
                        {status && <div className={`w-2 h-2 rounded-full ${STATUS_DOT[status]} mt-1`} />}
                      </div>
                    );
                  })}
                </div>
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>

          {/* Check-in/Out Log */}
          <StaggerItem>
            <PreOneCard variant="default">
              <PreOneCardContent>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <LogIn className="w-4 h-4 text-gray-500" /> Check-in / Check-out Log
                </h3>
                <div className="overflow-hidden -mx-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MOCK_CHECKINS.map((c, i) => (
                        <TableRow key={i} className="hover:bg-purple-50/30">
                          <TableCell className="text-sm">{new Date(c.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</TableCell>
                          <TableCell className="text-sm flex items-center gap-1"><LogIn className="w-3 h-3 text-emerald-500" />{c.checkIn}</TableCell>
                          <TableCell className="text-sm flex items-center gap-1"><LogOut className="w-3 h-3 text-red-500" />{c.checkOut}</TableCell>
                          <TableCell className="text-sm font-medium">{c.hours > 0 ? `${c.hours}h` : '—'}</TableCell>
                          <TableCell>
                            <Badge className={`${ATTENDANCE_COLORS[c.status]?.bg || 'bg-gray-50'} ${ATTENDANCE_COLORS[c.status]?.text || 'text-gray-700'} text-[10px]`}>{c.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>
        </div>
      </StaggerContainer>
    </PageTransition>
  );
}
