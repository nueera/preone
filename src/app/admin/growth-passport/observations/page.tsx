'use client';

import React, { useState } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { PORTAL_THEMES, OBSERVATION_COLORS } from '@/lib/theme-tokens';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Eye,
  Plus,
  Send,
  X,
  Clock,
  User,
  Brain,
  Heart,
  Hand,
  BookOpen,
  Sparkles,
  Filter,
  Camera,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface GrowthObservation {
  id: string;
  student: string;
  category: 'COGNITIVE' | 'SOCIAL' | 'PHYSICAL' | 'EMOTIONAL' | 'LANGUAGE' | 'CREATIVE';
  title: string;
  note: string;
  teacher: string;
  date: string;
  milestone?: string;
  photo?: boolean;
}

const MOCK_OBSERVATIONS: GrowthObservation[] = [
  { id: '1', student: 'Aarav Kumar', category: 'COGNITIVE', title: 'Pattern Recognition', note: 'Successfully identified ABAB pattern during math activity. Could extend the pattern independently.', teacher: 'Ms. Priya', date: '2026-06-12', milestone: 'Sorts by Color' },
  { id: '2', student: 'Priya Sharma', category: 'SOCIAL', title: 'Cooperative Play', note: 'Engaged in cooperative play with 3 other children for 20 minutes. Negotiated roles in pretend play.', teacher: 'Ms. Kavitha', date: '2026-06-11', milestone: 'Shares Toys' },
  { id: '3', student: 'Vihaan Singh', category: 'PHYSICAL', title: 'Balance Improvement', note: 'Walked on balance beam for 8 steps without falling. Much improvement from last month.', teacher: 'Mr. Raj', date: '2026-06-10', photo: true },
  { id: '4', student: 'Isha Sharma', category: 'LANGUAGE', title: 'Story Retelling', note: 'Retold the story of Three Bears with correct sequence. Used expressive voice for each character.', teacher: 'Ms. Priya', date: '2026-06-09', milestone: 'Tells Simple Story' },
  { id: '5', student: 'Ananya Gupta', category: 'CREATIVE', title: 'Color Mixing', note: 'Experimented with mixing primary colors. Discovered green from blue+yellow. Was very excited about the result.', teacher: 'Ms. Sana', date: '2026-06-08', photo: true },
  { id: '6', student: 'Arjun Patel', category: 'EMOTIONAL', title: 'Self-Regulation', note: 'Used breathing technique when frustrated during puzzle activity. Calmed down within 2 minutes.', teacher: 'Ms. Kavitha', date: '2026-06-07' },
  { id: '7', student: 'Meera Joshi', category: 'COGNITIVE', title: 'Number Sense', note: 'Can now count up to 15 reliably and recognizes numerals 1-10. Associating quantities with symbols.', teacher: 'Ms. Priya', date: '2026-06-06', milestone: 'Counts to 5' },
  { id: '8', student: 'Rohan Mehta', category: 'SOCIAL', title: 'Turn Taking', note: 'Waited patiently for his turn during the board game. Encouraged others when waiting.', teacher: 'Mr. Raj', date: '2026-06-05', milestone: 'Takes Turns' },
];

const CATEGORY_ICON: Record<string, React.ElementType> = {
  COGNITIVE: Brain, SOCIAL: User, PHYSICAL: Hand,
  EMOTIONAL: Heart, LANGUAGE: BookOpen, CREATIVE: Sparkles,
};

export default function GrowthObservationsPage() {
  const [showForm, setShowForm] = useState(false);
  const [newCategory, setNewCategory] = useState<string>('COGNITIVE');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredObs = filterCategory === 'all'
    ? MOCK_OBSERVATIONS
    : MOCK_OBSERVATIONS.filter((o) => o.category === filterCategory);

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Eye className="w-6 h-6" style={{ color: theme.primary }} />
                Growth Observations
              </h1>
              <p className="text-sm text-gray-500 mt-1">Teacher observations and developmental tracking</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md" onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-2" /> Add Observation
            </Button>
          </div>
        </StaggerItem>

        {/* Add Form */}
        {showForm && (
          <StaggerItem>
            <PreOneCard variant="emotional" className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">New Growth Observation</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-3">
                <Input placeholder="Student name..." />
                <div className="flex flex-wrap gap-2">
                  {Object.entries(OBSERVATION_COLORS).map(([key, cfg]) => {
                    const Icon = CATEGORY_ICON[key] || Brain;
                    return (
                      <Badge key={key} variant={newCategory === key ? 'default' : 'outline'} className={`cursor-pointer text-xs ${newCategory !== key ? cfg.text : ''}`} onClick={() => setNewCategory(key)}>
                        <Icon className="w-3 h-3 mr-1" /> {key}
                      </Badge>
                    );
                  })}
                </div>
                <Input placeholder="Observation title..." />
                <Textarea placeholder="Describe your observation..." rows={3} />
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm"><Camera className="w-3 h-3 mr-1" /> Add Photo</Button>
                  <Input placeholder="Related milestone (optional)..." className="flex-1" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button size="sm" className="bg-gradient-to-r from-violet-600 to-sky-500 text-white"><Send className="w-3 h-3 mr-1" /> Save</Button>
                </div>
              </div>
            </PreOneCard>
          </StaggerItem>
        )}

        {/* Category Filter */}
        <StaggerItem>
          <div className="flex flex-wrap gap-2">
            <Badge variant={filterCategory === 'all' ? 'default' : 'outline'} className="cursor-pointer text-xs" onClick={() => setFilterCategory('all')}>All</Badge>
            {Object.entries(OBSERVATION_COLORS).map(([key, cfg]) => (
              <Badge key={key} variant={filterCategory === key ? 'default' : 'outline'} className={`cursor-pointer text-xs ${filterCategory !== key ? cfg.text : ''}`} onClick={() => setFilterCategory(key)}>
                {key}
              </Badge>
            ))}
          </div>
        </StaggerItem>

        {/* Timeline */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-gray-900 mb-4">Observations Timeline</h3>
              <ScrollArea className="max-h-[600px]">
                <div className="relative pl-6 border-l-2 border-gray-100 space-y-6">
                  {filteredObs.map((obs) => {
                    const cfg = OBSERVATION_COLORS[obs.category] || OBSERVATION_COLORS.COGNITIVE;
                    const Icon = CATEGORY_ICON[obs.category] || Brain;
                    return (
                      <div key={obs.id} className="relative">
                        <div className={`absolute -left-[31px] w-6 h-6 rounded-full ${cfg.bg} flex items-center justify-center border-2 border-white`}>
                          <Icon className={`w-3 h-3 ${cfg.text}`} />
                        </div>
                        <div className="ml-4 p-3 rounded-xl border hover:shadow-sm transition-shadow">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium text-gray-900">{obs.title}</h4>
                            <div className="flex items-center gap-1.5">
                              {obs.photo && <Badge className="bg-sky-50 text-sky-700 text-[9px]"><Camera className="w-2.5 h-2.5 mr-0.5" /> Photo</Badge>}
                              <Badge className={`${cfg.bg} ${cfg.text} text-[9px]`}>{obs.category}</Badge>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mb-1 font-medium">{obs.student}</p>
                          <p className="text-sm text-gray-600 mb-2">{obs.note}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {obs.teacher}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(obs.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                            {obs.milestone && <Badge variant="outline" className="text-[9px]">🎯 {obs.milestone}</Badge>}
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
