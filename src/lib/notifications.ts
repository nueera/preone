/**
 * PreOne Notification Service — Central notification creation system
 *
 * ALL modules should use this service to create notifications.
 * Never create Notification records directly via Prisma.
 *
 * Usage:
 *   import { createNotification, NotificationTemplates } from '@/lib/notifications';
 *   await createNotification({
 *     userId: parentId,
 *     schoolId,
 *     ...NotificationTemplates.studentAbsent('Aarav', 'Nursery-A'),
 *     link: '/parent/attendance',
 *   });
 */

import { db } from '@/lib/db';

// ── Types ──

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'ANNOUNCEMENT' | 'REMINDER' | 'ALERT';
export type NotificationCategory = 'ATTENDANCE' | 'FEE' | 'ADMISSION' | 'ACTIVITY' | 'GROWTH' | 'COMMUNICATION' | 'SYSTEM' | 'CRM';

export interface CreateNotificationInput {
  userId: string;
  schoolId: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  link?: string;
  senderId?: string;
}

// ── Core Functions ──

/**
 * Create a single notification
 */
export async function createNotification(input: CreateNotificationInput) {
  return db.notification.create({
    data: {
      userId: input.userId,
      schoolId: input.schoolId,
      title: input.title,
      message: input.message,
      type: input.type,
      category: input.category,
      link: input.link,
      senderId: input.senderId,
    },
  });
}

/**
 * Create notifications for multiple users (e.g., broadcast announcement)
 */
export async function createBulkNotifications(
  userIds: string[],
  input: Omit<CreateNotificationInput, 'userId'>
) {
  if (userIds.length === 0) return [];

  const data = userIds.map((userId) => ({
    userId,
    schoolId: input.schoolId,
    title: input.title,
    message: input.message,
    type: input.type,
    category: input.category,
    link: input.link,
    senderId: input.senderId,
  }));

  return db.notification.createMany({ data });
}

/**
 * Create notification for all users of a specific role in a school
 */
export async function notifyByRole(
  schoolId: string,
  role: string,
  input: Omit<CreateNotificationInput, 'userId' | 'schoolId'>
) {
  const users = await db.user.findMany({
    where: { schoolId, role: role as any, isActive: true },
    select: { id: true },
  });

  if (users.length === 0) return [];

  return createBulkNotifications(
    users.map((u) => u.id),
    { ...input, schoolId }
  );
}

// ── Notification Templates ──
// Each template returns a Pick of CreateNotificationInput (title, message, type, category)

export const NotificationTemplates = {
  // ── Attendance ──
  studentAbsent: (studentName: string, className: string) => ({
    title: 'Student Absent',
    message: `${studentName} was marked absent in ${className} today.`,
    type: 'WARNING' as NotificationType,
    category: 'ATTENDANCE' as NotificationCategory,
  }),

  attendanceMarked: (className: string, present: number, total: number) => ({
    title: 'Attendance Marked',
    message: `Attendance for ${className}: ${present}/${total} students present.`,
    type: 'SUCCESS' as NotificationType,
    category: 'ATTENDANCE' as NotificationCategory,
  }),

  // ── Fees ──
  feePaymentReceived: (studentName: string, amount: number) => ({
    title: 'Payment Received',
    message: `Fee payment of ₹${amount.toLocaleString()} received for ${studentName}.`,
    type: 'SUCCESS' as NotificationType,
    category: 'FEE' as NotificationCategory,
  }),

  feeOverdue: (studentName: string, amount: number) => ({
    title: 'Fee Overdue',
    message: `${studentName}'s fee of ₹${amount.toLocaleString()} is overdue.`,
    type: 'ERROR' as NotificationType,
    category: 'FEE' as NotificationCategory,
  }),

  feeReminder: (studentName: string, amount: number, dueDate: string) => ({
    title: 'Fee Reminder',
    message: `Fee of ₹${amount.toLocaleString()} for ${studentName} is due on ${dueDate}.`,
    type: 'REMINDER' as NotificationType,
    category: 'FEE' as NotificationCategory,
  }),

  // ── Admission / CRM ──
  newLead: (leadName: string) => ({
    title: 'New Lead',
    message: `New lead: ${leadName} has been added to the CRM.`,
    type: 'INFO' as NotificationType,
    category: 'CRM' as NotificationCategory,
  }),

  followUpReminder: (leadName: string, time: string) => ({
    title: 'Follow-up Reminder',
    message: `Follow-up with ${leadName} scheduled at ${time}.`,
    type: 'REMINDER' as NotificationType,
    category: 'CRM' as NotificationCategory,
  }),

  leadStageChanged: (leadName: string, newStage: string) => ({
    title: 'Lead Updated',
    message: `${leadName} moved to ${newStage.replace(/_/g, ' ')} stage.`,
    type: 'INFO' as NotificationType,
    category: 'CRM' as NotificationCategory,
  }),

  leadAdmitted: (leadName: string) => ({
    title: 'Lead Admitted!',
    message: `${leadName} has been successfully admitted. Convert to student now.`,
    type: 'SUCCESS' as NotificationType,
    category: 'ADMISSION' as NotificationCategory,
  }),

  // ── Activities ──
  newActivity: (activityName: string, date: string) => ({
    title: 'New Activity',
    message: `${activityName} scheduled for ${date}.`,
    type: 'INFO' as NotificationType,
    category: 'ACTIVITY' as NotificationCategory,
  }),

  activityReminder: (activityName: string, time: string) => ({
    title: 'Activity Reminder',
    message: `${activityName} starts at ${time}.`,
    type: 'REMINDER' as NotificationType,
    category: 'ACTIVITY' as NotificationCategory,
  }),

  // ── Growth ──
  milestoneAchieved: (studentName: string, milestone: string) => ({
    title: 'Milestone Achieved!',
    message: `${studentName} achieved: ${milestone}`,
    type: 'SUCCESS' as NotificationType,
    category: 'GROWTH' as NotificationCategory,
  }),

  observationShared: (studentName: string, category: string) => ({
    title: 'Observation Shared',
    message: `A new ${category.toLowerCase()} observation was shared for ${studentName}.`,
    type: 'INFO' as NotificationType,
    category: 'GROWTH' as NotificationCategory,
  }),

  // ── Communication ──
  newAnnouncement: (title: string) => ({
    title: 'New Announcement',
    message: title,
    type: 'ANNOUNCEMENT' as NotificationType,
    category: 'COMMUNICATION' as NotificationCategory,
  }),

  newMessage: (senderName: string) => ({
    title: 'New Message',
    message: `You have a new message from ${senderName}.`,
    type: 'INFO' as NotificationType,
    category: 'COMMUNICATION' as NotificationCategory,
  }),

  // ── Daily Updates ──
  dailyUpdatePosted: (childName: string) => ({
    title: 'Daily Update',
    message: `A new daily update has been posted for ${childName}.`,
    type: 'INFO' as NotificationType,
    category: 'COMMUNICATION' as NotificationCategory,
  }),

  // ── System ──
  systemMaintenance: (time: string) => ({
    title: 'Scheduled Maintenance',
    message: `System maintenance scheduled at ${time}.`,
    type: 'WARNING' as NotificationType,
    category: 'SYSTEM' as NotificationCategory,
  }),

  welcomeUser: (name: string) => ({
    title: 'Welcome to PreOne!',
    message: `Hello ${name}, your account has been set up. Explore your dashboard to get started.`,
    type: 'SUCCESS' as NotificationType,
    category: 'SYSTEM' as NotificationCategory,
  }),

  passwordChanged: () => ({
    title: 'Password Changed',
    message: 'Your password was changed successfully. If this wasn\'t you, contact your school admin.',
    type: 'WARNING' as NotificationType,
    category: 'SYSTEM' as NotificationCategory,
  }),
};
