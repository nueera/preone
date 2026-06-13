'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
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
  Clock,
  User,
  MessageSquare,
  Brain,
  Heart,
  Hand,
  BookOpen,
  Sparkles,
  Send,
  X,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

interface Observation {
  id: string;
  category: 'COGNITIVE' | 'SOCIAL' | 'PHYSICAL' | 'EMOTIONAL' | 'LANGUAGE' | 'CREATIVE';
  title: string;
  note: string;
  teacher: string;
  date: string;
  time: string;
  severity?: 'POSITIVE' | 'NEUTRAL' | 'CONCERN';
}

const MOCK_OBSERVATIONS: Observation[] = [
  { id: '1', category: 'COGNITIVE', title: 'Problem Solving', note: 'Demonstrated excellent problem-solving skills during the puzzle activity. Was able to complete a 12-piece puzzle independently.', teacher: 'Ms. Priya', date: '2026-06-12', time: '10:30 AM', severity: 'POSITIVE' },
  { id: '2', category: 'SOCIAL', title: 'Group Play', note: 'Showed great cooperation during group play. Helped a younger peer find their shoes.', teacher: 'Mr. Raj', date: '2026-06-11', time: '11:15 AM', severity: 'POSITIVE' },
  { id: '3', category: 'EMOTIONAL', title: 'Separation Anxiety', note: 'Appeared hesitant during morning drop-off. Took about 20 minutes to settle in. Cried briefly when parent left.', teacher: 'Ms. Kavitha', date: '2026-06-10', time: '8:45 AM', severity: 'CONCERN' },
  { id: '4', category: 'LANGUAGE', title: 'Vocabulary Growth', note: 'Used 5 new words today during story time. Attempted to form complete sentences.', teacher: 'Ms. Priya', date: '2026-06-09', time: '2:00 PM', severity: 'POSITIVE' },
  { id: '5', category: 'PHYSICAL', title: 'Fine Motor Skills', note: 'Holding crayon with improved grip. Drawing more controlled circles and lines.', teacher: 'Ms. Sana', date: '2026-06-08', time: '10:00 AM', severity: 'NEUTRAL' },
  { id: '6', category: 'CREATIVE', title: 'Art Expression', note: 'Created an imaginative drawing of a house with family. Used multiple colors purposefully.', teacher: 'Ms. Sana', date: '2026-06-07', time: '9:30 AM', severity: 'POSITIVE' },
  { id: '7', category: 'COGNITIVE', title: 'Counting Skills', note: 'Can count objects up to 10 reliably. Struggled with counting beyond 15.', teacher: 'Ms. Priya', date: '2026-06-06', time: '11:00 AM', severity: 'NEUTRAL' },
  { id: '8', category: 'SOCIAL', title: 'Sharing Behavior', note: 'Reluctant to share toys during free play. Needed teacher intervention twice.', teacher: 'Mr. Raj', date: '2026-06-05', time: '3:00 PM', severity: 'CONCERN' },
];

const CATEGORY_ICON: Record<string, React.ElementType> = {
  COGNITIVE: Brain, SOCIAL: User, PHYSICAL: Hand,
  EMOTIONAL: Heart, LANGUAGE: BookOpen, CREATIVE: Sparkles,
};

const SEVERITY_BADGE: Record<string, string> = {
  POSITIVE: 'bg-emerald-50 text-emerald-700',
  NEUTRAL: 'bg-blue-50 text-blue-700',
  CONCERN: 'bg-red-50 text-red-700',
};

export default function StudentObservationsPage() {
  const params = useParams();
  const studentId = params?.id as string;
  const [showForm, setShowForm] = useState(false);
  const [newCategory, setNewCategory] = useState<string>('COGNITIVE');
  const [newNote, setNewNote] = useState('');

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        {/* Header */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Eye className="w-6 h-6" style={{ color: theme.primary }} />
                Student Observations
              </h1>
              <p className="text-sm text-gray-500 mt-1">Student ID: {studentId} — Teacher observations timeline</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md" onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-2" /> Add Observation
            </Button>
          </div>
        </StaggerItem>

        {/* Add Observation Form */}
        {showForm && (
          <StaggerItem>
            <PreOneCard variant="emotional" className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">New Observation</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(OBSERVATION_COLORS).map(([key, cfg]) => {
                    const Icon = CATEGORY_ICON[key] || Brain;
                    return (
                      <Badge
                        key={key}
                        variant={newCategory === key ? 'default' : 'outline'}
                        className={`cursor-pointer text-xs ${newCategory !== key ? cfg.text : ''}`}
                        onClick={() => setNewCategory(key)}
                      >
                        <Icon className="w-3 h-3 mr-1" /> {key}
                      </Badge>
                    );
                  })}
                </div>
                <Input placeholder="Observation title..." />
                <Textarea placeholder="Describe your observation..." value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={3} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button size="sm" className="bg-gradient-to-r from-violet-600 to-sky-500 text-white">
                    <Send className="w-3 h-3 mr-1" /> Save
                  </Button>
                </div>
              </div>
            </PreOneCard>
          </StaggerItem>
        )}

        {/* Category Stats */}
        <StaggerItem>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {Object.entries(OBSERVATION_COLORS).map(([key, cfg]) => {
              const Icon = CATEGORY_ICON[key] || Brain;
              const count = MOCK_OBSERVATIONS.filter((o) => o.category === key).length;
              return (
                <PreOneCard key={key} variant="strip" className="p-3 text-center">
                  <Icon className={`w-5 h-5 mx-auto ${cfg.text}`} />
                  <p className="text-[10px] text-gray-500 mt-1 capitalize">{key}</p>
                  <p className="text-sm font-bold" style={{ color: cfg.hex }}>{count}</p>
                </PreOneCard>
              );
            })}
          </div>
        </StaggerItem>

        {/* Timeline */}
        <StaggerItem>
          <PreOneCard variant="default">
            <PreOneCardContent>
              <h3 className="font-semibold text-gray-900 mb-4">Observation Timeline</h3>
              <ScrollArea className="max-h-[500px]">
                <div className="relative pl-6 border-l-2 border-gray-100 space-y-6">
                  {MOCK_OBSERVATIONS.map((obs) => {
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
                            {obs.severity && (
                              <Badge className={`${SEVERITY_BADGE[obs.severity]} text-[9px]`}>{obs.severity}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{obs.note}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {obs.teacher}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(obs.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} {obs.time}</span>
                            <Badge className={`${cfg.bg} ${cfg.text} text-[9px]`}>{obs.category}</Badge>
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
