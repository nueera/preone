'use client';

import React, { useState, useMemo } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PORTAL_THEMES, ACHIEVEMENT_COLORS, GROWTH_COLORS } from '@/lib/theme-tokens';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Trophy,
  Plus,
  Search,
  Award,
  Star,
  Medal,
  Target,
  BookOpen,
  Sparkles,
  CalendarDays,
  Filter,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface Achievement {
  id: string;
  student: string;
  title: string;
  category: string;
  type: 'CERTIFICATE' | 'BADGE' | 'MILESTONE' | 'AWARD';
  date: string;
  description: string;
  icon: string;
}

const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: '1', student: 'Aarav Kumar', title: 'First Steps', category: 'physical', type: 'MILESTONE', date: '2026-03-15', description: 'Completed the walking milestone independently', icon: '🚶' },
  { id: '2', student: 'Priya Sharma', title: 'Story Star', category: 'language', type: 'BADGE', date: '2026-05-20', description: 'Told 5 complete stories in class', icon: '⭐' },
  { id: '3', student: 'Vihaan Singh', title: 'Perfect Attendance', category: 'social', type: 'CERTIFICATE', date: '2026-04-01', description: 'No absences for the entire month of March', icon: '📜' },
  { id: '4', student: 'Isha Sharma', title: 'Little Artist', category: 'creativity', type: 'AWARD', date: '2026-06-10', description: 'Won first place in the art exhibition', icon: '🎨' },
  { id: '5', student: 'Ananya Gupta', title: 'Number Whiz', category: 'cognitive', type: 'BADGE', date: '2026-05-15', description: 'Can count to 20 and recognize all numerals', icon: '🔢' },
  { id: '6', student: 'Arjun Patel', title: 'Kindness Champion', category: 'social', type: 'AWARD', date: '2026-04-20', description: 'Recognized for consistently helping classmates', icon: '💝' },
  { id: '7', student: 'Meera Joshi', title: 'Science Explorer', category: 'cognitive', type: 'BADGE', date: '2026-03-28', description: 'Asked 20 thoughtful questions during nature walk', icon: '🔬' },
  { id: '8', student: 'Rohan Mehta', title: 'Team Player', category: 'social', type: 'CERTIFICATE', date: '2026-06-05', description: 'Demonstrated excellent teamwork in sports day', icon: '🤝' },
  { id: '9', student: 'Sara Khan', title: 'Rhyme Master', category: 'language', type: 'MILESTONE', date: '2026-05-10', description: 'Can recite 10 nursery rhymes from memory', icon: '🎵' },
  { id: '10', student: 'Kabir Reddy', title: 'Building Blocks', category: 'cognitive', type: 'MILESTONE', date: '2026-04-15', description: 'Built a 10-block tower independently', icon: '🏗️' },
];

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  CERTIFICATE: { icon: Award, color: 'text-purple-700', bg: 'bg-purple-50' },
  BADGE: { icon: Star, color: 'text-amber-700', bg: 'bg-amber-50' },
  MILESTONE: { icon: Target, color: 'text-emerald-700', bg: 'bg-emerald-50' },
  AWARD: { icon: Trophy, color: 'text-pink-700', bg: 'bg-pink-50' },
};

export default function AchievementsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    return MOCK_ACHIEVEMENTS.filter((a) => {
      const matchSearch = !searchQuery || a.student.toLowerCase().includes(searchQuery.toLowerCase()) || a.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = typeFilter === 'all' || a.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [searchQuery, typeFilter]);

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Trophy className="w-6 h-6" style={{ color: theme.primary }} />
                Achievements
              </h1>
              <p className="text-sm text-gray-500 mt-1">Certificates, badges, milestones, and awards</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md">
              <Plus className="w-4 h-4 mr-2" /> Add Achievement
            </Button>
          </div>
        </StaggerItem>

        {/* Type Stats */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
              const Icon = cfg.icon;
              const count = MOCK_ACHIEVEMENTS.filter((a) => a.type === type).length;
              return (
                <PreOneCard key={type} variant="strip" hover className={`p-4 cursor-pointer ${typeFilter === type ? 'ring-2 ring-purple-400' : ''}`} onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{type}</p>
                      <p className="text-lg font-bold" style={{ color: theme.primary }}>{count}</p>
                    </div>
                  </div>
                </PreOneCard>
              );
            })}
          </div>
        </StaggerItem>

        {/* Search & Filter */}
        <StaggerItem>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search by student or title..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
          </div>
        </StaggerItem>

        {/* Achievement Grid */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-gray-900 mb-4">All Achievements</h3>
              <ScrollArea className="max-h-96">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filtered.map((a) => {
                    const typeCfg = TYPE_CONFIG[a.type];
                    const growthCfg = GROWTH_COLORS[a.category];
                    const TypeIcon = typeCfg.icon;
                    return (
                      <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl border hover:shadow-sm transition-shadow">
                        <div className="text-2xl">{a.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className="text-sm font-medium text-gray-900 truncate">{a.title}</h4>
                            <div className={`w-6 h-6 rounded-full ${typeCfg.bg} flex items-center justify-center shrink-0`}>
                              <TypeIcon className={`w-3 h-3 ${typeCfg.color}`} />
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mb-1">{a.student}</p>
                          <p className="text-xs text-gray-400 mb-1.5 line-clamp-2">{a.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge className={`${growthCfg?.bg || 'bg-gray-50'} ${growthCfg?.text || 'text-gray-700'} text-[9px] capitalize`}>{a.category}</Badge>
                            <Badge variant="outline" className="text-[9px]">{a.type}</Badge>
                            <span className="text-[10px] text-gray-400">{new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          </div>
                        </div>
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
