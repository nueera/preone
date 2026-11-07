// ============================================================
// PreOne — Teacher Hooks
// React Query hooks for teacher portal data fetching
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  teacherGet,
  teacherPost,
  teacherPatch,
} from '@/lib/teacher-api';

// ============================================================
// Query Key Factory
// ============================================================

export const teacherKeys = {
  profile: ['teacher', 'profile'] as const,
  class: ['teacher', 'class'] as const,
  students: ['teacher', 'students'] as const,
  schedule: ['teacher', 'schedule'] as const,
  leaveBalance: ['teacher', 'leave-balance'] as const,
  todayAttendance: ['teacher', 'today-attendance'] as const,
  notificationPrefs: ['teacher', 'notification-preferences'] as const,
};

// ============================================================
// useTeacherClass — Get teacher's assigned class info
// ============================================================

export function useTeacherClass() {
  return useQuery({
    queryKey: teacherKeys.class,
    queryFn: () =>
      teacherGet<{
        assignedClass: {
          id: string;
          name: string;
          program: { id: string; name: string };
        } | null;
      }>('/api/teacher/profile').then((data) => data.assignedClass),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================
// useMyStudents — Get students in teacher's class
// ============================================================

export function useMyStudents() {
  return useQuery({
    queryKey: teacherKeys.students,
    queryFn: () =>
      teacherGet<{
        students: Array<{
          id: string;
          firstName: string;
          lastName: string;
          rollNumber: string | null;
          photo: string | null;
          gender: string;
          dob: string;
          status: string;
        }>;
      }>('/api/teacher/class'),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================================
// useTodayAttendance — Get today's attendance status
// ============================================================

export function useTodayAttendance() {
  return useQuery({
    queryKey: teacherKeys.todayAttendance,
    queryFn: () =>
      teacherGet<{
        date: string;
        marked: boolean;
        present: number;
        absent: number;
        late: number;
        total: number;
        records: Array<{
          studentId: string;
          status: string;
        }>;
      }>('/api/teacher/attendance/mark?today=true'),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ============================================================
// useTeacherSchedule — Get teacher's weekly schedule
// ============================================================

export function useTeacherSchedule() {
  return useQuery({
    queryKey: teacherKeys.schedule,
    queryFn: () =>
      teacherGet<{
        schedule: Array<{
          id: string;
          dayOfWeek: number;
          dayName: string;
          startTime: string;
          endTime: string;
          subject: string | null;
        }>;
        todaySchedule: Array<{
          id: string;
          startTime: string;
          endTime: string;
          subject: string | null;
        }>;
        hasSchedule: boolean;
      }>('/api/teacher/schedule'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================================
// useLeaveBalance — Get teacher's leave balance
// ============================================================

export function useLeaveBalance() {
  return useQuery({
    queryKey: teacherKeys.leaveBalance,
    queryFn: () =>
      teacherGet<{
        balances: Record<
          string,
          { total: number; used: number; remaining: number }
        >;
      }>('/api/teacher/leaves'),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============================================================
// useNotificationPreferences — Get notification prefs
// ============================================================

export function useNotificationPreferences() {
  return useQuery({
    queryKey: teacherKeys.notificationPrefs,
    queryFn: () =>
      teacherGet<{
        preferences: Record<string, { push: boolean; email: boolean }>;
      }>('/api/teacher/notification-preferences'),
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================
// useUpdateProfile — Mutation for updating teacher profile
// ============================================================

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { phone?: string; address?: string; photo?: string }) =>
      teacherPatch('/api/teacher/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.profile });
    },
  });
}

// ============================================================
// useChangePassword — Mutation for changing password
// ============================================================

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      teacherPost('/api/teacher/change-password', data),
  });
}

// ============================================================
// useUpdateNotificationPrefs — Mutation for updating prefs
// ============================================================

export function useUpdateNotificationPrefs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, { push: boolean; email: boolean }>) =>
      teacherPatch('/api/teacher/notification-preferences', { preferences: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teacherKeys.notificationPrefs });
    },
  });
}
