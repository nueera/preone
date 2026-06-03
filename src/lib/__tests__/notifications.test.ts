import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module before importing the module under test
vi.mock('@/lib/db', () => ({
  db: {
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}));

import {
  createNotification,
  createBulkNotifications,
  notifyByRole,
  NotificationTemplates,
  type CreateNotificationInput,
} from '@/lib/notifications';
import { db } from '@/lib/db';

// ============================================================
// Notification Templates Tests
// ============================================================

describe('NotificationTemplates', () => {
  describe('studentAbsent', () => {
    it('returns correct shape with title, message, type, category', () => {
      const result = NotificationTemplates.studentAbsent('Aarav', 'Nursery-A');
      expect(result).toEqual({
        title: 'Student Absent',
        message: 'Aarav was marked absent in Nursery-A today.',
        type: 'WARNING',
        category: 'ATTENDANCE',
      });
    });
  });

  describe('feePaymentReceived', () => {
    it('formats amount correctly', () => {
      const result = NotificationTemplates.feePaymentReceived('Priya', 5000);
      expect(result.title).toBe('Payment Received');
      expect(result.message).toContain('₹5,000');
      expect(result.message).toContain('Priya');
      expect(result.type).toBe('SUCCESS');
      expect(result.category).toBe('FEE');
    });

    it('formats large amounts with commas', () => {
      const result = NotificationTemplates.feePaymentReceived('Ravi', 100000);
      expect(result.message).toContain('₹100,000');
    });
  });

  describe('newLead', () => {
    it('returns CRM category', () => {
      const result = NotificationTemplates.newLead('John Doe');
      expect(result.title).toBe('New Lead');
      expect(result.message).toContain('John Doe');
      expect(result.type).toBe('INFO');
      expect(result.category).toBe('CRM');
    });
  });

  describe('dailyUpdatePosted', () => {
    it('returns COMMUNICATION category', () => {
      const result = NotificationTemplates.dailyUpdatePosted('Ananya');
      expect(result.title).toBe('Daily Update');
      expect(result.message).toContain('Ananya');
      expect(result.type).toBe('INFO');
      expect(result.category).toBe('COMMUNICATION');
    });
  });

  describe('feeOverdue', () => {
    it('returns ERROR type and FEE category', () => {
      const result = NotificationTemplates.feeOverdue('Rahul', 7500);
      expect(result.title).toBe('Fee Overdue');
      expect(result.message).toContain('₹7,500');
      expect(result.message).toContain('Rahul');
      expect(result.type).toBe('ERROR');
      expect(result.category).toBe('FEE');
    });
  });

  describe('leadAdmitted', () => {
    it('returns SUCCESS type and ADMISSION category', () => {
      const result = NotificationTemplates.leadAdmitted('Sneha');
      expect(result.title).toBe('Lead Admitted!');
      expect(result.message).toContain('Sneha');
      expect(result.type).toBe('SUCCESS');
      expect(result.category).toBe('ADMISSION');
    });
  });

  describe('milestoneAchieved', () => {
    it('returns correct template for milestone', () => {
      const result = NotificationTemplates.milestoneAchieved('Aarav', 'First Words');
      expect(result.title).toBe('Milestone Achieved!');
      expect(result.message).toContain('Aarav');
      expect(result.message).toContain('First Words');
      expect(result.type).toBe('SUCCESS');
      expect(result.category).toBe('GROWTH');
    });
  });

  describe('newAnnouncement', () => {
    it('returns ANNOUNCEMENT type and COMMUNICATION category', () => {
      const result = NotificationTemplates.newAnnouncement('Holiday Notice');
      expect(result.title).toBe('New Announcement');
      expect(result.message).toBe('Holiday Notice');
      expect(result.type).toBe('ANNOUNCEMENT');
      expect(result.category).toBe('COMMUNICATION');
    });
  });
});

// ============================================================
// createNotification Tests
// ============================================================

describe('createNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls db.notification.create with correct data', async () => {
    const mockCreated = { id: 'notif-1' };
    vi.mocked(db.notification.create).mockResolvedValue(mockCreated as any);

    const input: CreateNotificationInput = {
      userId: 'user-1',
      schoolId: 'school-1',
      title: 'Test Title',
      message: 'Test Message',
      type: 'INFO',
      category: 'SYSTEM',
      link: '/test',
      senderId: 'sender-1',
    };

    const result = await createNotification(input);

    expect(db.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        schoolId: 'school-1',
        title: 'Test Title',
        message: 'Test Message',
        type: 'INFO',
        category: 'SYSTEM',
        link: '/test',
        senderId: 'sender-1',
      },
    });
    expect(result).toEqual(mockCreated);
  });

  it('calls db.notification.create without optional fields', async () => {
    vi.mocked(db.notification.create).mockResolvedValue({ id: 'notif-2' } as any);

    const input: CreateNotificationInput = {
      userId: 'user-2',
      schoolId: 'school-1',
      title: 'No Options',
      message: 'No link or sender',
      type: 'WARNING',
      category: 'ATTENDANCE',
    };

    await createNotification(input);

    expect(db.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-2',
        schoolId: 'school-1',
        title: 'No Options',
        message: 'No link or sender',
        type: 'WARNING',
        category: 'ATTENDANCE',
        link: undefined,
        senderId: undefined,
      },
    });
  });
});

// ============================================================
// createBulkNotifications Tests
// ============================================================

describe('createBulkNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls db.notification.createMany with array of data', async () => {
    vi.mocked(db.notification.createMany).mockResolvedValue({ count: 3 } as any);

    const userIds = ['user-1', 'user-2', 'user-3'];
    const input = {
      schoolId: 'school-1',
      title: 'Bulk Title',
      message: 'Bulk Message',
      type: 'INFO' as const,
      category: 'SYSTEM' as const,
    };

    const result = await createBulkNotifications(userIds, input);

    expect(db.notification.createMany).toHaveBeenCalledWith({
      data: [
        { userId: 'user-1', schoolId: 'school-1', title: 'Bulk Title', message: 'Bulk Message', type: 'INFO', category: 'SYSTEM', link: undefined, senderId: undefined },
        { userId: 'user-2', schoolId: 'school-1', title: 'Bulk Title', message: 'Bulk Message', type: 'INFO', category: 'SYSTEM', link: undefined, senderId: undefined },
        { userId: 'user-3', schoolId: 'school-1', title: 'Bulk Title', message: 'Bulk Message', type: 'INFO', category: 'SYSTEM', link: undefined, senderId: undefined },
      ],
    });
    expect(result).toEqual({ count: 3 });
  });

  it('returns empty array when userIds is empty', async () => {
    const result = await createBulkNotifications([], {
      schoolId: 'school-1',
      title: 'Empty',
      message: 'No users',
      type: 'INFO',
      category: 'SYSTEM',
    });

    expect(db.notification.createMany).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});

// ============================================================
// notifyByRole Tests
// ============================================================

describe('notifyByRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('finds users by role and calls createBulkNotifications', async () => {
    vi.mocked(db.user.findMany).mockResolvedValue([
      { id: 'user-1' },
      { id: 'user-2' },
    ] as any);
    vi.mocked(db.notification.createMany).mockResolvedValue({ count: 2 } as any);

    const input = {
      title: 'Role Notification',
      message: 'Hello role members',
      type: 'INFO' as const,
      category: 'COMMUNICATION' as const,
    };

    const result = await notifyByRole('school-1', 'TEACHER', input);

    expect(db.user.findMany).toHaveBeenCalledWith({
      where: { schoolId: 'school-1', role: 'TEACHER', isActive: true },
      select: { id: true },
    });

    expect(db.notification.createMany).toHaveBeenCalledWith({
      data: [
        { userId: 'user-1', schoolId: 'school-1', title: 'Role Notification', message: 'Hello role members', type: 'INFO', category: 'COMMUNICATION', link: undefined, senderId: undefined },
        { userId: 'user-2', schoolId: 'school-1', title: 'Role Notification', message: 'Hello role members', type: 'INFO', category: 'COMMUNICATION', link: undefined, senderId: undefined },
      ],
    });
  });

  it('returns empty array when no users found for role', async () => {
    vi.mocked(db.user.findMany).mockResolvedValue([]);

    const result = await notifyByRole('school-1', 'PARENT', {
      title: 'No Users',
      message: 'No one here',
      type: 'INFO',
      category: 'SYSTEM',
    });

    expect(db.notification.createMany).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
