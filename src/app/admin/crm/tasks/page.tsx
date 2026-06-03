'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckSquare,
  Plus,
  Clock,
  AlertCircle,
  Circle,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// ── Types ──
interface CrmTask {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'done';
  dueDate: string | null;
  createdAt: string;
}

/**
 * CRM Tasks page — Simple task management for CRM activities.
 * Tasks are stored in localStorage for now (no backend model yet).
 * This is a lightweight task board for Task Masters and Admins.
 */
export default function CrmTasksPage() {
  const [tasks, setTasks] = useState<CrmTask[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('preone_crm_tasks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [filter, setFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');

  // Save tasks to localStorage
  const saveTasks = (updatedTasks: CrmTask[]) => {
    setTasks(updatedTasks);
    localStorage.setItem('preone_crm_tasks', JSON.stringify(updatedTasks));
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: CrmTask = {
      id: `task_${Date.now()}`,
      title: newTaskTitle.trim(),
      description: '',
      priority: newTaskPriority,
      status: 'todo',
      dueDate: null,
      createdAt: new Date().toISOString(),
    };
    saveTasks([newTask, ...tasks]);
    setNewTaskTitle('');
    setNewTaskPriority('medium');
  };

  const toggleStatus = (id: string) => {
    const updated = tasks.map((t) => {
      if (t.id === id) {
        const nextStatus = t.status === 'todo' ? 'in_progress' : t.status === 'in_progress' ? 'done' : 'todo';
        return { ...t, status: nextStatus };
      }
      return t;
    });
    saveTasks(updated);
  };

  const deleteTask = (id: string) => {
    saveTasks(tasks.filter((t) => t.id !== id));
  };

  const filteredTasks = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);
  const todoCount = tasks.filter((t) => t.status === 'todo').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const doneCount = tasks.filter((t) => t.status === 'done').length;

  const priorityColors = {
    high: 'text-red-600 bg-red-50 border-red-200',
    medium: 'text-amber-600 bg-amber-50 border-amber-200',
    low: 'text-gray-500 bg-gray-50 border-gray-200',
  };

  const statusIcons = {
    todo: <Circle className="h-4 w-4 text-gray-400" />,
    in_progress: <Clock className="h-4 w-4 text-blue-500" />,
    done: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  };

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
              <CheckSquare className="h-6 w-6 text-portal-600" />
              CRM Tasks
            </h1>
            <p className="text-sm text-gray-500 mt-1">Track your CRM tasks and to-dos</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-gray-400">{todoCount}</p>
          <p className="text-xs text-gray-500">To Do</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-blue-500">{inProgressCount}</p>
          <p className="text-xs text-gray-500">In Progress</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-2xl font-bold text-green-500">{doneCount}</p>
          <p className="text-xs text-gray-500">Done</p>
        </Card>
      </div>

      {/* Add Task */}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Add a new CRM task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            className="flex-1"
          />
          <select
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value as 'high' | 'medium' | 'low')}
            className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <Button onClick={addTask} className="gap-1 bg-brand-gradient text-white border-0 hover:bg-brand-gradient-hover">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {(['all', 'todo', 'in_progress', 'done'] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className={cn('capitalize', filter === f && 'bg-brand-gradient text-white border-0')}
          >
            {f === 'all' ? 'All' : f === 'todo' ? 'To Do' : f === 'in_progress' ? 'In Progress' : 'Done'}
          </Button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No tasks yet</p>
            <p className="text-sm text-gray-400 mt-1">Add your first CRM task above</p>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card
              key={task.id}
              className={cn(
                'p-3 hover:shadow-sm transition-all duration-200',
                task.status === 'done' && 'opacity-60'
              )}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleStatus(task.id)}
                  className="shrink-0 hover:scale-110 transition-transform"
                >
                  {statusIcons[task.status]}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium',
                    task.status === 'done' && 'line-through text-gray-400'
                  )}>
                    {task.title}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-medium border',
                  priorityColors[task.priority]
                )}>
                  {task.priority}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                  onClick={() => deleteTask(task.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
