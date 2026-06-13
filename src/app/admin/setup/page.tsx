'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageTransition } from '@/components/ui/page-transition';
import { PreOneCard } from '@/components/ui/preone-card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  School,
  Calendar,
  GraduationCap,
  IndianRupee,
  Users,
  Puzzle,
  CheckCircle2,
  Circle,
  ArrowRight,
  Rocket,
  Sparkles,
} from 'lucide-react';
import { PORTAL_THEMES } from '@/lib/theme-tokens';
import { cn } from '@/lib/utils';

const theme = PORTAL_THEMES.admin;

interface SetupStep {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  completed: boolean;
  progress: number;
  color: string;
  bgColor: string;
}

const SETUP_STEPS: SetupStep[] = [
  {
    id: 'school',
    title: 'School Profile',
    description: 'Basic school information, logo, and contact details',
    href: '/admin/setup/school',
    icon: <School className="h-5 w-5" />,
    completed: true,
    progress: 100,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
  },
  {
    id: 'branches',
    title: 'Branches',
    description: 'Manage campuses and branch locations',
    href: '/admin/setup/branches',
    icon: <Building2 className="h-5 w-5" />,
    completed: true,
    progress: 100,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'academic-year',
    title: 'Academic Year',
    description: 'Configure academic years, terms, and holidays',
    href: '/admin/setup/academic-year',
    icon: <Calendar className="h-5 w-5" />,
    completed: true,
    progress: 100,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  {
    id: 'classes',
    title: 'Classes & Programs',
    description: 'Set up programs, classes, sections, and capacity',
    href: '/admin/setup/classes',
    icon: <GraduationCap className="h-5 w-5" />,
    completed: false,
    progress: 60,
    color: 'text-sky-600',
    bgColor: 'bg-sky-50',
  },
  {
    id: 'fee-structure',
    title: 'Fee Structure',
    description: 'Define fee types, amounts, and payment schedules',
    href: '/admin/setup/fee-structure',
    icon: <IndianRupee className="h-5 w-5" />,
    completed: false,
    progress: 40,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    id: 'staff',
    title: 'Staff Setup',
    description: 'Add staff, assign roles, and manage onboarding',
    href: '/admin/setup/staff',
    icon: <Users className="h-5 w-5" />,
    completed: false,
    progress: 25,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  {
    id: 'integrations',
    title: 'Integrations',
    description: 'Connect WhatsApp, payments, SMS, and other services',
    href: '/admin/setup/integrations',
    icon: <Puzzle className="h-5 w-5" />,
    completed: false,
    progress: 0,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
];

const completedCount = SETUP_STEPS.filter((s) => s.completed).length;
const overallProgress = Math.round(
  SETUP_STEPS.reduce((sum, s) => sum + s.progress, 0) / SETUP_STEPS.length
);

export default function SetupLandingPage() {
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Rocket className="h-6 w-6 text-violet-600" />
              Setup & Onboarding
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Complete these steps to get your school up and running on PreOne
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs px-3 py-1 border-violet-200 bg-violet-50 text-violet-700"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {completedCount} of {SETUP_STEPS.length} completed
            </Badge>
          </div>
        </div>

        {/* Overall Progress Card */}
        <PreOneCard variant="default">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Overall Setup Progress
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  You&apos;re almost there! Complete the remaining steps to unlock all features.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-sky-500 bg-clip-text text-transparent">
                  {overallProgress}%
                </span>
              </div>
            </div>
            <Progress value={overallProgress} className="h-3" />
            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
              <span>{completedCount} sections complete</span>
              <span>
                {SETUP_STEPS.length - completedCount} remaining
              </span>
            </div>
          </div>
        </PreOneCard>

        {/* Setup Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {SETUP_STEPS.map((step) => (
            <Link key={step.id} href={step.href} className="block group">
              <PreOneCard
                variant="default"
                hover
                className={cn(
                  'h-full transition-all duration-200',
                  hoveredStep === step.id && 'ring-2 ring-violet-200'
                )}
                onMouseEnter={() => setHoveredStep(step.id)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                <div className="p-5 space-y-4">
                  {/* Top: Icon + Status */}
                  <div className="flex items-start justify-between">
                    <div
                      className={cn(
                        'h-10 w-10 rounded-xl flex items-center justify-center',
                        step.bgColor,
                        step.color
                      )}
                    >
                      {step.icon}
                    </div>
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Circle
                        className={cn(
                          'h-5 w-5 flex-shrink-0',
                          step.progress > 0 ? 'text-amber-400' : 'text-gray-300'
                        )}
                      />
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-semibold text-sm text-gray-900 group-hover:text-violet-700 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                      {step.description}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  {!step.completed && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-medium text-gray-700">
                          {step.progress}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400 transition-all duration-500"
                          style={{ width: `${step.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Completed Badge */}
                  {step.completed && (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}

                  {/* Footer */}
                  <div className="flex items-center text-xs font-medium text-violet-600 group-hover:text-violet-700 pt-1 border-t">
                    {step.completed ? 'Edit settings' : 'Continue setup'}
                    <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </PreOneCard>
            </Link>
          ))}
        </div>

        {/* Quick Tips Section */}
        <PreOneCard variant="cosmic">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  Quick Setup Tips
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-violet-500 mt-0.5">•</span>
                    Start with School Profile and Branches — these are required before other steps
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-500 mt-0.5">•</span>
                    Set up Academic Year before creating Classes — classes are organized by academic year
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-500 mt-0.5">•</span>
                    Fee Structure and Integrations can be configured in parallel
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-violet-500 mt-0.5">•</span>
                    You can always come back and modify settings later from the Settings page
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </PreOneCard>
      </div>
    </PageTransition>
  );
}
