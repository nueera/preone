'use client';

import React, { useState, useMemo } from 'react';
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/page-transition';
import { PreOneCard, PreOneCardContent } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PORTAL_THEMES, GROWTH_COLORS } from '@/lib/theme-tokens';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Milestone,
  Plus,
  Search,
  Brain,
  Users,
  Baby,
  MessageSquare,
  Target,
  CheckCircle2,
  Clock,
  Star,
} from 'lucide-react';

const theme = PORTAL_THEMES.admin;

type MilestoneCategory = 'Motor' | 'Cognitive' | 'Social' | 'Language';

interface MilestoneTemplate {
  id: string;
  name: string;
  category: MilestoneCategory;
  ageRange: string;
  description: string;
  criteria: string;
  isDefault: boolean;
}

const CATEGORY_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType; hex: string }> = {
  Motor:     { color: 'text-orange-700', bg: 'bg-orange-50', icon: Baby, hex: '#f97316' },
  Cognitive: { color: 'text-purple-700', bg: 'bg-purple-50', icon: Brain, hex: '#7c3aed' },
  Social:    { color: 'text-green-700', bg: 'bg-green-50', icon: Users, hex: '#22c55e' },
  Language:  { color: 'text-sky-700', bg: 'bg-sky-50', icon: MessageSquare, hex: '#0ea5e9' },
};

const MOCK_MILESTONES: MilestoneTemplate[] = [
  { id: '1', name: 'Walks Independently', category: 'Motor', ageRange: '12-18 months', description: 'Child can walk without support for at least 5 steps', criteria: '5 consecutive steps unaided', isDefault: true },
  { id: '2', name: 'Stacks 4 Blocks', category: 'Motor', ageRange: '18-24 months', description: 'Can stack at least 4 blocks on top of each other', criteria: '4 blocks stacked without falling', isDefault: true },
  { id: '3', name: 'Holds Crayon', category: 'Motor', ageRange: '24-36 months', description: 'Holds crayon with tripod grip', criteria: 'Can draw a circle', isDefault: true },
  { id: '4', name: 'Object Permanence', category: 'Cognitive', ageRange: '8-12 months', description: 'Understands that objects exist even when hidden', criteria: 'Searches for hidden toy', isDefault: true },
  { id: '5', name: 'Sorts by Color', category: 'Cognitive', ageRange: '24-36 months', description: 'Can sort objects by one attribute (color)', criteria: 'Sorts 3 colors correctly', isDefault: true },
  { id: '6', name: 'Counts to 5', category: 'Cognitive', ageRange: '36-48 months', description: 'Can count objects up to 5', criteria: 'Correctly counts 5 objects', isDefault: true },
  { id: '7', name: 'Parallel Play', category: 'Social', ageRange: '24-36 months', description: 'Plays alongside other children', criteria: 'Engages in parallel play for 10 min', isDefault: true },
  { id: '8', name: 'Shares Toys', category: 'Social', ageRange: '36-48 months', description: 'Willingly shares toys with peers', criteria: 'Shares without prompting 3 times', isDefault: true },
  { id: '9', name: 'Takes Turns', category: 'Social', ageRange: '36-48 months', description: 'Can wait for turn in games', criteria: 'Waits turn in group activity', isDefault: false },
  { id: '10', name: 'First Words', category: 'Language', ageRange: '10-14 months', description: 'Says first meaningful words', criteria: '3 meaningful words', isDefault: true },
  { id: '11', name: '2-Word Sentences', category: 'Language', ageRange: '18-24 months', description: 'Combines 2 words to communicate', criteria: '5 two-word combinations', isDefault: true },
  { id: '12', name: 'Tells Simple Story', category: 'Language', ageRange: '36-48 months', description: 'Can narrate a simple sequence of events', criteria: '3-sentence narrative', isDefault: true },
];

export default function MilestonesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredMilestones = useMemo(() => {
    return MOCK_MILESTONES.filter((m) => {
      const matchSearch = !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === 'all' || m.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [searchQuery, categoryFilter]);

  const grouped = useMemo(() => {
    const groups: Record<string, MilestoneTemplate[]> = {};
    filteredMilestones.forEach((m) => {
      if (!groups[m.category]) groups[m.category] = [];
      groups[m.category].push(m);
    });
    return groups;
  }, [filteredMilestones]);

  return (
    <PageTransition>
      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Target className="w-6 h-6" style={{ color: theme.primary }} />
                Milestone Templates
              </h1>
              <p className="text-sm text-gray-500 mt-1">Developmental milestones by category</p>
            </div>
            <Button className="bg-gradient-to-r from-violet-600 to-sky-500 text-white shadow-md">
              <Plus className="w-4 h-4 mr-2" /> Add Milestone
            </Button>
          </div>
        </StaggerItem>

        {/* Category Stats */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(CATEGORY_CONFIG).map(([cat, cfg]) => {
              const Icon = cfg.icon;
              const count = MOCK_MILESTONES.filter((m) => m.category === cat).length;
              return (
                <PreOneCard
                  key={cat}
                  variant="strip"
                  hover
                  className={`p-4 cursor-pointer ${categoryFilter === cat ? 'ring-2 ring-purple-400' : ''}`}
                  onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{cat}</p>
                      <p className="text-lg font-bold" style={{ color: cfg.hex }}>{count}</p>
                    </div>
                  </div>
                </PreOneCard>
              );
            })}
          </div>
        </StaggerItem>

        {/* Search */}
        <StaggerItem>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search milestones..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
        </StaggerItem>

        {/* Milestone Grid by Category */}
        {Object.entries(grouped).map(([category, milestones]) => {
          const cfg = CATEGORY_CONFIG[category];
          const Icon = cfg.icon;
          return (
            <StaggerItem key={category}>
              <PreOneCard variant="default">
                <PreOneCardContent>
                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <h3 className="font-semibold text-gray-900">{category} Development</h3>
                    <Badge className={`${cfg.bg} ${cfg.color} text-[10px]`}>{milestones.length} milestones</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {milestones.map((m) => (
                      <div key={m.id} className="p-3 rounded-xl border hover:shadow-sm transition-shadow">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-gray-900">{m.name}</h4>
                          {m.isDefault && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{m.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[9px]">{m.ageRange}</Badge>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px]">Edit</Button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">Criteria: {m.criteria}</p>
                      </div>
                    ))}
                  </div>
                </PreOneCardContent>
              </PreOneCard>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </PageTransition>
  );
}
