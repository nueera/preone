'use client';

import React, { useState, useMemo } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import {
  CalendarDays,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Star,
  GraduationCap,
  PartyPopper,
  Plane,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'holiday' | 'activity' | 'event' | 'ptm' | 'exam';
  time?: string;
  description?: string;
}

const MOCK_EVENTS: CalendarEvent[] = [
  { id: '1', title: 'Annual Day Rehearsal', date: '2026-06-15', type: 'activity', time: '9:00 AM', description: 'Practice for annual day performances' },
  { id: '2', title: 'Parent-Teacher Meeting', date: '2026-06-20', type: 'ptm', time: '10:00 AM', description: 'Q1 progress review meeting' },
  { id: '3', title: 'Eid-ul-Adha Holiday', date: '2026-06-25', type: 'holiday', description: 'School closed' },
  { id: '4', title: 'Summer Camp Begins', date: '2026-06-01', type: 'event', time: '8:30 AM', description: 'Two-week summer camp program' },
  { id: '5', title: 'Art Exhibition', date: '2026-06-10', type: 'activity', time: '11:00 AM', description: 'Student artwork display' },
  { id: '6', title: 'Mid-Term Assessments', date: '2026-06-18', type: 'exam', time: '9:00 AM', description: 'Mid-term evaluations begin' },
  { id: '7', title: 'Yoga Day Celebration', date: '2026-06-21', type: 'event', time: '8:00 AM', description: 'International Yoga Day activities' },
  { id: '8', title: 'Staff Development Day', date: '2026-06-28', type: 'event', time: '9:00 AM', description: 'Teacher training workshop' },
  { id: '9', title: 'Raksha Bandhan Holiday', date: '2026-08-09', type: 'holiday', description: 'School closed' },
  { id: '10', title: 'Independence Day', date: '2026-08-15', type: 'holiday', description: 'School closed — flag hoisting ceremony' },
];

const TYPE_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  holiday:  { color: 'text-green-700', bg: 'bg-green-50', icon: Plane, label: 'Holiday' },
  activity: { color: 'text-blue-700', bg: 'bg-blue-50', icon: Star, label: 'Activity' },
  event:    { color: 'text-purple-700', bg: 'bg-purple-50', icon: PartyPopper, label: 'Event' },
  ptm:      { color: 'text-amber-700', bg: 'bg-amber-50', icon: GraduationCap, label: 'PTM' },
  exam:     { color: 'text-red-700', bg: 'bg-red-50', icon: GraduationCap, label: 'Exam' },
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [firstDay, daysInMonth]);

  const filteredEvents = useMemo(() => {
    return MOCK_EVENTS.filter((e) => {
      const matchSearch = !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = selectedType === 'all' || e.type === selectedType;
      return matchSearch && matchType;
    });
  }, [searchQuery, selectedType]);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return MOCK_EVENTS.filter((e) => e.date === dateStr);
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        {/* Header */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-6 h-6" style={{ color: theme.primary }} />
                School Calendar
              </h1>
              <p className="text-sm text-gray-500 mt-1">Manage events, holidays, and activities</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md hover:shadow-lg">
              <Plus className="w-4 h-4 mr-2" /> Add Event
            </Button>
          </div>
        </StaggerItem>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <StaggerItem>
            <PreOneCard variant="default" className="lg:col-span-2">
              <PreOneCardContent>
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <Button variant="outline" size="icon" onClick={prevMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {MONTHS[month]} {year}
                  </h2>
                  <Button variant="outline" size="icon" onClick={nextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS.map((d) => (
                    <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, i) => {
                    if (day === null) return <div key={`empty-${i}`} className="h-20" />;
                    const dayEvents = getEventsForDay(day);
                    const isToday =
                      today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

                    return (
                      <div
                        key={`day-${day}`}
                        className={`h-20 p-1 rounded-lg border text-sm transition-colors cursor-pointer hover:bg-gray-50 ${
                          isToday ? 'border-purple-400 bg-purple-50/50' : 'border-transparent'
                        }`}
                      >
                        <span
                          className={`text-xs font-medium ${
                            isToday ? 'text-purple-700' : 'text-gray-700'
                          }`}
                        >
                          {day}
                        </span>
                        <div className="mt-0.5 space-y-0.5">
                          {dayEvents.slice(0, 2).map((ev) => {
                            const cfg = TYPE_CONFIG[ev.type];
                            return (
                              <div
                                key={ev.id}
                                className={`text-[9px] px-1 py-0.5 rounded truncate ${cfg.bg} ${cfg.color}`}
                              >
                                {ev.title}
                              </div>
                            );
                          })}
                          {dayEvents.length > 2 && (
                            <div className="text-[9px] text-gray-400 px-1">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>

          {/* Event Sidebar */}
          <StaggerItem>
            <PreOneCard variant="default">
              <PreOneCardContent>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Upcoming Events</h3>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>

                {/* Filter */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <Badge
                    variant={selectedType === 'all' ? 'default' : 'outline'}
                    className="cursor-pointer text-[10px]"
                    onClick={() => setSelectedType('all')}
                  >
                    All
                  </Badge>
                  {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                    <Badge
                      key={key}
                      variant={selectedType === key ? 'default' : 'outline'}
                      className={`cursor-pointer text-[10px] ${selectedType === key ? '' : cfg.color}`}
                      onClick={() => setSelectedType(key)}
                    >
                      {cfg.label}
                    </Badge>
                  ))}
                </div>

                {/* Event List */}
                <ScrollArea className="max-h-96">
                  <div className="space-y-2">
                    {filteredEvents.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">No events found</p>
                    ) : (
                      filteredEvents.map((ev) => {
                        const cfg = TYPE_CONFIG[ev.type];
                        const Icon = cfg.icon;
                        return (
                          <div
                            key={ev.id}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                              <Icon className={`w-4 h-4 ${cfg.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{ev.title}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                {ev.time && ` • ${ev.time}`}
                              </p>
                              {ev.description && (
                                <p className="text-xs text-gray-400 mt-0.5 truncate">{ev.description}</p>
                              )}
                            </div>
                            <Badge className={`${cfg.bg} ${cfg.color} text-[9px] shrink-0`}>{cfg.label}</Badge>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </PreOneCardContent>
            </PreOneCard>
          </StaggerItem>
        </div>
      </StaggerContainer>
    </PageTransition>
  );
}
